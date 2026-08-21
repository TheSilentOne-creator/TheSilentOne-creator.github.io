#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
守夜者之书 - Markdown 批量转 HTML 构建工具
"""

import os
import re
import json
import html as html_module
from pathlib import Path
import markdown
from pygments import highlight
from pygments.lexers import get_lexer_by_name
from pygments.formatters import HtmlFormatter

BASE_DIR = Path(__file__).parent
DATA_FILE = BASE_DIR / 'data' / 'tutorials.json'


# ============================================================
# 解析 tutorials.md
# ============================================================
def parse_series_sidebar(md_file_path, current_page_name):
    if not md_file_path.exists():
        return None, '<li class="sidebar-category">暂无目录</li>'

    with open(md_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    series_title = None
    in_list = False
    chapters = []
    stack = [chapters]
    indent_levels = [0]

    for line in lines:
        line = line.rstrip()

        if line.startswith('# ') and not series_title:
            series_title = line[2:].strip()
            continue

        if line.startswith('## 章节列表') or line.startswith('## Chapters'):
            in_list = True
            continue

        if not in_list:
            continue

        indent = len(line) - len(line.lstrip())
        stripped = line.strip()

        if not stripped:
            continue

        match = re.match(r'^[-*]?\s*\[([^\]]+)\]\(([^)]+)\)', stripped)
        if not match:
            match = re.match(r'^\d+\.\s*\[([^\]]+)\]\(([^)]+)\)', stripped)

        if match:
            title = match.group(1)
            link = match.group(2)
            is_active = (link == current_page_name or
                        link == f'./{current_page_name}' or
                        Path(link).name == current_page_name)

            if indent == 0:
                chapters.append({
                    'title': title,
                    'link': link,
                    'active': is_active,
                    'children': [],
                    'level': 0
                })
                stack = [chapters]
                indent_levels = [0]
            else:
                level = indent // 2

                while len(stack) > level + 1:
                    stack.pop()
                    indent_levels.pop()

                if level > indent_levels[-1]:
                    parent = stack[-1][-1] if stack[-1] else None
                    if parent and 'children' in parent:
                        parent['children'].append({
                            'title': title,
                            'link': link,
                            'active': is_active,
                            'children': [],
                            'level': level
                        })
                        stack.append(parent['children'])
                        indent_levels.append(level)
                    else:
                        stack[-1].append({
                            'title': title,
                            'link': link,
                            'active': is_active,
                            'children': [],
                            'level': level
                        })
                else:
                    stack[-1].append({
                        'title': title,
                        'link': link,
                        'active': is_active,
                        'children': [],
                        'level': level
                    })
                    indent_levels[-1] = level

    if not series_title:
        series_title = "系列目录"

    def render_sidebar_items(items, level=0):
        html = ''
        for item in items:
            active_class = 'active' if item.get('active', False) else ''
            indent_style = f'padding-left: {20 + level * 16}px;' if level > 0 else ''
            html += f'''
            <li>
                <a href="{item['link']}" class="{active_class}" style="{indent_style}">
                    {item['title']}
                </a>
            </li>'''
            if item.get('children'):
                html += render_sidebar_items(item['children'], level + 1)
        return html

    sidebar_html = f'<li class="sidebar-category">{series_title}</li>'
    sidebar_html += render_sidebar_items(chapters)

    return series_title, sidebar_html


# ============================================================
# Markdown → HTML
# ============================================================
class MarkdownToHTML:
    def __init__(self, md_file_path):
        self.md_file_path = md_file_path
        self.md = markdown.Markdown(extensions=[
            'extra',        # 表格、围栏代码块、脚注
            'toc',
            'sane_lists',   # 更智能的列表
            'nl2br',        # 换行转 <br>
            'smarty',       # 智能引号
        ])

    def convert(self, md_text):
        # 修正图片路径
        md_text = self._fix_image_paths(md_text)
        # 修正链接路径
        md_text = self._fix_link_paths(md_text)

        # 使用 markdown 库转换
        html = self.md.convert(md_text)

        # 代码高亮（只处理 <pre><code>）
        html = self._highlight_code_blocks(html)

        return html

    def _fix_image_paths(self, md_text):
        def replace_image(match):
            alt = match.group(1)
            path = match.group(2)
            if path.startswith('/') or path.startswith('http://') or path.startswith('https://'):
                return f'![{alt}]({path})'
            md_dir = self.md_file_path.parent
            img_path = md_dir / path
            if img_path.exists():
                rel_path = img_path.relative_to(BASE_DIR)
                return f'![{alt}](/{rel_path})'
            return f'![{alt}]({path})'

        pattern = r'!\[([^\]]*)\]\(([^)]+)\)'
        return re.sub(pattern, replace_image, md_text)

    def _fix_link_paths(self, md_text):
        def replace_link(match):
            text = match.group(1)
            path = match.group(2)
            if path.startswith('/') or path.startswith('http://') or path.startswith('https://') or path.startswith('#'):
                return f'[{text}]({path})'
            md_dir = self.md_file_path.parent
            link_path = md_dir / path
            if link_path.exists():
                rel_path = link_path.relative_to(BASE_DIR)
                return f'[{text}](/{rel_path})'
            return f'[{text}]({path})'

        pattern = r'(?<!\!)\[([^\]]*)\]\(([^)]+)\)'
        return re.sub(pattern, replace_link, md_text)

    def _highlight_code_blocks(self, html):
        """高亮代码块，不破坏其他结构"""
        # 匹配 markdown 库生成的代码块
        pattern = r'<pre><code class="language-(\w+)">(.*?)</code></pre>'

        def replace_code_block(match):
            language = match.group(1)
            code = match.group(2)
            # 解码 HTML 实体（如 &lt; → <）
            code = html_module.unescape(code)
            try:
                lexer = get_lexer_by_name(language, stripall=True)
                formatter = HtmlFormatter(style='monokai', cssclass='codehilite')
                return highlight(code, lexer, formatter)
            except:
                return f'<pre><code class="language-{language}">{code}</code></pre>'

        return re.sub(pattern, replace_code_block, html, flags=re.DOTALL)


# ============================================================
# 辅助函数
# ============================================================
def load_tutorials_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def find_markdown_files(tutorial_id, lang):
    search_dir = BASE_DIR / lang / 'tutorials' / tutorial_id
    if not search_dir.exists():
        return []
    md_files = sorted([f for f in search_dir.glob('*.md') if f.name != 'tutorials.md'])
    return md_files


def extract_title(md_content, default_title):
    for line in md_content.split('\n'):
        if line.startswith('# ') and not line.startswith('## '):
            return line[2:].strip()
    return default_title


def get_series_nav(md_files, current_file):
    sorted_files = sorted(md_files)
    for i, f in enumerate(sorted_files):
        if f.name == current_file.name:
            prev_file = sorted_files[i - 1] if i > 0 else None
            next_file = sorted_files[i + 1] if i < len(sorted_files) - 1 else None
            return prev_file, next_file
    return None, None


def generate_html_page(tutorial, lang, title, body_html, prev_file, next_file,
                       series_sidebar_html, series_title):
    title_clean = re.sub(r'^[^\w\u4e00-\u9fa5]+\s*', '', title)

    status_map = {
        'done': ('✅ Done' if lang == 'en' else '✅ 已完成', 'done'),
        'writing': ('✍️ Writing' if lang == 'en' else '✍️ 编写中', 'writing'),
        'coming': ('⏳ Coming Soon' if lang == 'en' else '⏳ 敬请期待', 'coming')
    }
    status_display, status_class = status_map.get(tutorial['status'], ('', ''))

    # 上一篇/下一篇
    prev_html = ''
    if prev_file:
        prev_content = prev_file.read_text(encoding='utf-8')
        prev_title = extract_title(prev_content, prev_file.stem)
        prev_link = prev_file.name.replace('.md', '.html')
        prev_html = f'<a href="{prev_link}" class="prev">← {prev_title}</a>'
    else:
        prev_html = '<span class="prev disabled">← ' + ('Previous' if lang == 'en' else '上一篇') + '</span>'

    next_html = ''
    if next_file:
        next_content = next_file.read_text(encoding='utf-8')
        next_title = extract_title(next_content, next_file.stem)
        next_link = next_file.name.replace('.md', '.html')
        next_html = f'<a href="{next_link}" class="next">{next_title} →</a>'
    else:
        next_html = '<span class="next disabled">' + ('Next' if lang == 'en' else '下一篇') + ' →</span>'

    lang_code = 'zh-CN' if lang == 'zh' else 'en'
    home_text = '首页' if lang == 'zh' else 'Home'
    tutorials_text = '教程' if lang == 'zh' else 'Tutorials'

    html = f'''<!DOCTYPE html>
<html lang="{lang_code}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} · {"The Night Keeper's Book" if lang == 'en' else '守夜者之书'}</title>
    <link rel="preload" href="/css/style.css" as="style">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">

    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {{
            mermaid.initialize({{
                theme: 'dark',
                themeVariables: {{
                    background: '#0a0e14',
                    primaryColor: '#64ffda',
                    primaryTextColor: '#e6edf3',
                    primaryBorderColor: '#64ffda',
                    lineColor: '#64ffda',
                    secondaryColor: '#1a2636',
                    tertiaryColor: '#111821'
                }}
            }});
        }});
    </script>

    <script>
        MathJax = {{
            tex: {{
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
            }},
            svg: {{
                fontCache: 'global'
            }}
        }};
    </script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js" async></script>

    <style>
        .sidebar-menu .sidebar-category {{
            font-size: 13px;
            font-weight: 700;
            color: var(--accent);
            padding: 16px 12px 8px 12px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 8px;
        }}
        .sidebar-menu li a {{
            display: block;
            padding: 4px 12px 4px 20px;
            border-radius: 4px;
            font-size: 14px;
            color: var(--text-secondary);
            transition: all 0.15s;
            text-decoration: none;
        }}
        .sidebar-menu li a:hover {{
            color: var(--text-primary);
            background: var(--bg-hover);
        }}
        .sidebar-menu li a.active {{
            color: var(--accent);
            background: var(--accent-dim);
            border-left: 3px solid var(--accent);
        }}
        .mermaid {{
            background: var(--bg-code);
            padding: 20px;
            border-radius: 8px;
            margin: 16px 0 24px 0;
            border-left: 3px solid var(--accent);
            text-align: center;
        }}
        .MathJax {{
            color: var(--text-primary) !important;
        }}
        .codehilite {{ background: #0d1117; padding: 16px 20px; border-radius: 0 8px 8px 0; overflow-x: auto; margin: 16px 0 24px 0; border-left: 3px solid #64ffda; }}
        .codehilite pre {{ margin: 0; background: transparent; }}
        .tutorial-body table {{
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }}
        .tutorial-body th, .tutorial-body td {{
            border: 1px solid var(--border);
            padding: 8px 12px;
            text-align: left;
        }}
        .tutorial-body th {{
            background: var(--bg-card);
            color: var(--text-primary);
        }}
        .tutorial-body td {{
            color: var(--text-secondary);
        }}
    </style>
</head>
<body>
    <div id="navbar"></div>

    <aside class="sidebar" id="sidebar">
        <div class="sidebar-inner">
            <ul class="sidebar-menu">
                {series_sidebar_html}
            </ul>
        </div>
    </aside>

    <main class="main-content">
        <div class="content-inner tutorial-content">

            <nav class="breadcrumb">
                <a href="/{lang}/">{home_text}</a>
                <span class="separator">/</span>
                <a href="/{lang}/tutorials/">{tutorials_text}</a>
                <span class="separator">/</span>
                <span class="current">{series_title}</span>
            </nav>

            <header class="tutorial-header">
                <div class="tutorial-meta">
                    <span class="tutorial-number">{tutorial['number']}</span>
                    <span class="tutorial-status {status_class}">{status_display}</span>
                    <span class="tutorial-level">{tutorial.get('level', '')}</span>
                    <span class="tutorial-readtime">⏱️ {"About 30 min" if lang == 'en' else '约 30 分钟'}</span>
                </div>
                <h1>{tutorial[lang]['title']}</h1>
                <p class="tutorial-subtitle">{tutorial[lang].get('description', '')}</p>
            </header>

            <section class="tutorial-body">
                {body_html}
            </section>

            <div class="tutorial-nav">
                {prev_html}
                {next_html}
            </div>

        </div>
    </main>

    <div id="footer"></div>

    <script src="/js/loader.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {{
            if (typeof mermaid !== 'undefined') {{
                mermaid.run({{
                    querySelector: '.mermaid'
                }});
            }}
        }});
    </script>
</body>
</html>'''

    return html


# ============================================================
# 批量处理
# ============================================================
def batch_process_all_tutorials():
    data = load_tutorials_data()
    tutorials = data['tutorials']

    results = []
    total = len(tutorials)

    print(f'📚 共 {total} 个教程需要处理\n')

    for idx, tutorial in enumerate(tutorials):
        tutorial_id = tutorial['id']
        print(f'[{idx+1}/{total}] 处理: {tutorial_id}')

        for lang in ['zh', 'en']:
            lang_data = tutorial.get(lang)
            if not lang_data:
                continue

            md_files = find_markdown_files(tutorial_id, lang)

            if not md_files:
                print(f'  ⚠️ 未找到 [{lang}] Markdown 文件')
                continue

            sidebar_file = BASE_DIR / lang / 'tutorials' / tutorial_id / 'tutorials.md'

            for md_file in md_files:
                print(f'  📖 处理 [{lang}]: {md_file.name}')

                md_content = md_file.read_text(encoding='utf-8')

                title = extract_title(md_content, md_file.stem)

                series_title, series_sidebar_html = parse_series_sidebar(
                    sidebar_file,
                    md_file.name.replace('.md', '.html')
                )

                prev_file, next_file = get_series_nav(md_files, md_file)

                converter = MarkdownToHTML(md_file)
                body_html = converter.convert(md_content)

                html = generate_html_page(
                    tutorial, lang, title, body_html,
                    prev_file, next_file,
                    series_sidebar_html, series_title or tutorial_id
                )

                output_file = md_file.parent / md_file.name.replace('.md', '.html')
                output_file.write_text(html, encoding='utf-8')

                print(f'    ✅ 生成: {output_file}')
                results.append({'tutorial': tutorial_id, 'lang': lang, 'file': md_file.name})

        print()

    return results


def main():
    print('🔧 守夜者之书 - Markdown 批量构建工具')
    print('=' * 60)
    print('  ✅ 支持 GFM 语法（表格、任务列表、删除线等）')
    print('  ✅ 支持代码语法高亮（pygments）')
    print('  ✅ 支持图片渲染（路径自动修正）')
    print('  ✅ 支持 Mermaid 流程图（客户端渲染）')
    print('  ✅ 支持 MathJax 数学公式（客户端渲染）')
    print('  ✅ 支持多级系列目录侧边栏（tutorials.md）')
    print('  ✅ 支持系列内上一篇/下一篇导航')
    print('=' * 60 + '\n')

    results = batch_process_all_tutorials()

    print('=' * 60)
    print(f'🎉 构建完成！共处理 {len(results)} 个文件')
    print('=' * 60)


if __name__ == '__main__':
    main()
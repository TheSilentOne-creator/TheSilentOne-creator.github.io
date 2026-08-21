#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
守夜者之书 - Markdown 批量转 HTML 构建工具
支持：流程图(Mermaid) + 数学公式(MathJax) + 系列目录侧边栏
"""

import os
import re
import json
from pathlib import Path
import markdown
from pygments import highlight
from pygments.lexers import get_lexer_by_name
from pygments.formatters import HtmlFormatter

# ============================================================
# 配置
# ============================================================
BASE_DIR = Path(__file__).parent
DATA_FILE = BASE_DIR / 'data' / 'tutorials.json'
OUTPUT_DIR = BASE_DIR


# ============================================================
# 解析 tutorials.md（系列目录）
# ============================================================
def parse_series_sidebar(md_file_path, current_page_name):
    """
    解析 tutorials.md，生成系列目录侧边栏 HTML
    返回: (series_title, sidebar_html)
    """
    if not md_file_path.exists():
        return None, '<li class="sidebar-category">暂无目录</li>'
    
    with open(md_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    series_title = None
    in_list = False
    chapters = []
    
    for line in lines:
        line = line.strip()
        
        # 提取系列标题（# 开头）
        if line.startswith('# ') and not series_title:
            series_title = line[2:].strip()
            continue
        
        # 检测章节列表开始
        if line.startswith('## 章节列表') or line.startswith('## Chapters'):
            in_list = True
            continue
        
        # 解析列表项: - [标题](链接)
        if in_list and line.startswith('- ['):
            # 提取标题和链接
            match = re.match(r'- \[([^\]]+)\]\(([^)]+)\)', line)
            if match:
                title = match.group(1)
                link = match.group(2)
                # 判断当前章节是否激活
                is_active = (link == current_page_name or 
                            link == f'./{current_page_name}' or
                            Path(link).name == current_page_name)
                chapters.append({
                    'title': title,
                    'link': link,
                    'active': is_active
                })
    
    if not series_title:
        series_title = "系列目录"
    
    # 生成侧边栏 HTML
    sidebar_html = f'<li class="sidebar-category">{series_title}</li>'
    for ch in chapters:
        active_class = 'active' if ch['active'] else ''
        sidebar_html += f'''
        <li>
            <a href="{ch['link']}" class="{active_class}">
                {ch['title']}
            </a>
        </li>
        '''
    
    return series_title, sidebar_html


# ============================================================
# Markdown → HTML（支持 GFM + 语法高亮）
# ============================================================
class MarkdownToHTML:
    def __init__(self, md_file_path, lang):
        self.md_file_path = md_file_path
        self.lang = lang
        self.md = markdown.Markdown(extensions=[
            'extra',
            'toc',
            'sane_lists',
            'nl2br',
            'smarty',
        ])
    
    def convert(self, md_text):
        """将 Markdown 转换为 HTML"""
        md_text = self._fix_image_paths(md_text)
        md_text = self._fix_link_paths(md_text)
        html = self.md.convert(md_text)
        html = self._highlight_code_blocks(html, md_text)
        return html
    
    def _fix_image_paths(self, md_text):
        """修正图片路径"""
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
        """修正内部链接路径"""
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
    
    def _highlight_code_blocks(self, html, md_text):
        """用 pygments 高亮代码块"""
        pattern = r'```(\w*)\n(.*?)```'
        
        def replace_code_block(match):
            language = match.group(1)
            code = match.group(2)
            if language:
                try:
                    lexer = get_lexer_by_name(language, stripall=True)
                    formatter = HtmlFormatter(style='monokai', cssclass='codehilite')
                    return highlight(code, lexer, formatter)
                except:
                    return f'<pre><code class="language-{language}">{code}</code></pre>'
            else:
                return f'<pre><code>{code}</code></pre>'
        
        return re.sub(pattern, replace_code_block, md_text, flags=re.DOTALL)


# ============================================================
# 查找 Markdown 文件
# ============================================================
def find_markdown_files(tutorial_id, lang):
    """查找教程下所有 Markdown 文件（排除 tutorials.md）"""
    if lang == 'zh':
        search_dir = BASE_DIR / 'zh' / 'tutorials' / tutorial_id
    else:
        search_dir = BASE_DIR / 'en' / 'tutorials' / tutorial_id
    
    if not search_dir.exists():
        return []
    
    # 排除 tutorials.md，按文件名排序
    md_files = sorted([f for f in search_dir.glob('*.md') if f.name != 'tutorials.md'])
    return md_files


# ============================================================
# 加载教程数据
# ============================================================
def load_tutorials_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


# ============================================================
# 获取系列内上一篇/下一篇
# ============================================================
def get_series_nav(md_files, current_file):
    """根据文件名排序，获取当前文件的上一篇和下一篇"""
    if not md_files:
        return None, None
    
    # 按文件名排序
    sorted_files = sorted(md_files)
    current_name = current_file.name
    
    prev_file = None
    next_file = None
    
    for i, f in enumerate(sorted_files):
        if f.name == current_name:
            if i > 0:
                prev_file = sorted_files[i-1]
            if i < len(sorted_files) - 1:
                next_file = sorted_files[i+1]
            break
    
    return prev_file, next_file


# ============================================================
# 生成 HTML 页面
# ============================================================
def generate_html_page(tutorial, lang, title, body_html, prev_file, next_file, 
                       series_sidebar_html, series_title):
    """生成完整的 HTML 页面"""
    
    title_clean = re.sub(r'^[^\w\u4e00-\u9fa5]+\s*', '', title)
    
    status_map = {
        'done': ('✅ Done' if lang == 'en' else '✅ 已完成', 'done'),
        'writing': ('✍️ Writing' if lang == 'en' else '✍️ 编写中', 'writing'),
        'coming': ('⏳ Coming Soon' if lang == 'en' else '⏳ 敬请期待', 'coming')
    }
    status_display, status_class = status_map.get(tutorial['status'], ('', ''))
    
    # 系列内上一篇/下一篇
    prev_html = ''
    if prev_file:
        prev_title = prev_file.stem.replace('-', ' ').title()
        prev_link = prev_file.name.replace('.md', '.html')
        prev_html = f'<a href="{prev_link}" class="prev">← {prev_title}</a>'
    else:
        prev_html = '<span class="prev disabled">← ' + ('Previous' if lang == 'en' else '上一篇') + '</span>'
    
    next_html = ''
    if next_file:
        next_title = next_file.stem.replace('-', ' ').title()
        next_link = next_file.name.replace('.md', '.html')
        next_html = f'<a href="{next_link}" class="next">{next_title} →</a>'
    else:
        next_html = '<span class="next disabled">' + ('Next' if lang == 'en' else '下一篇') + ' →</span>'
    
    # 语言判断
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
    
    <!-- Mermaid 流程图 -->
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
    
    <!-- MathJax 数学公式 -->
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
        /* 侧边栏系列目录样式 - 覆盖默认 */
        .sidebar-menu .sidebar-category {{
            font-size: 13px;
            font-weight: 700;
            color: var(--accent);
            padding: 16px 12px 8px 12px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 8px;
        }}
        .sidebar-menu li a {{
            padding-left: 20px;
        }}
        .sidebar-menu li a.active {{
            color: var(--accent);
            background: var(--accent-dim);
            border-left: 3px solid var(--accent);
        }}
        /* Mermaid 流程图适配暗色主题 */
        .mermaid {{
            background: var(--bg-code);
            padding: 20px;
            border-radius: 8px;
            margin: 16px 0 24px 0;
            border-left: 3px solid var(--accent);
            text-align: center;
        }}
        /* MathJax 公式适配 */
        .MathJax {{
            color: var(--text-primary) !important;
        }}
        /* 代码高亮 */
        .codehilite {{ background: #0d1117; padding: 16px 20px; border-radius: 0 8px 8px 0; overflow-x: auto; margin: 16px 0 24px 0; border-left: 3px solid #64ffda; }}
        .codehilite pre {{ margin: 0; background: transparent; }}
        .codehilite .hll {{ background-color: #1e2a3a; }}
        .codehilite .c {{ color: #8b949e; font-style: italic; }}
        .codehilite .err {{ color: #f85149; }}
        .codehilite .k {{ color: #ff7b72; }}
        .codehilite .o {{ color: #ff7b72; }}
        .codehilite .ch {{ color: #8b949e; font-style: italic; }}
        .codehilite .cm {{ color: #8b949e; font-style: italic; }}
        .codehilite .cp {{ color: #ff7b72; font-weight: bold; }}
        .codehilite .cpf {{ color: #8b949e; font-style: italic; }}
        .codehilite .c1 {{ color: #8b949e; font-style: italic; }}
        .codehilite .cs {{ color: #8b949e; font-style: italic; }}
        .codehilite .gd {{ color: #f85149; }}
        .codehilite .ge {{ font-style: italic; }}
        .codehilite .gr {{ color: #f85149; }}
        .codehilite .gh {{ color: #58a6ff; font-weight: bold; }}
        .codehilite .gi {{ color: #3fb950; }}
        .codehilite .go {{ color: #8b949e; }}
        .codehilite .gp {{ color: #8b949e; font-weight: bold; }}
        .codehilite .gs {{ font-weight: bold; }}
        .codehilite .gu {{ color: #58a6ff; font-weight: bold; }}
        .codehilite .gt {{ color: #f85149; }}
        .codehilite .kc {{ color: #ff7b72; }}
        .codehilite .kd {{ color: #ff7b72; }}
        .codehilite .kn {{ color: #ff7b72; }}
        .codehilite .kp {{ color: #ff7b72; }}
        .codehilite .kr {{ color: #ff7b72; }}
        .codehilite .kt {{ color: #ff7b72; }}
        .codehilite .m {{ color: #f2cc60; }}
        .codehilite .s {{ color: #a5d6ff; }}
        .codehilite .na {{ color: #d2a8ff; }}
        .codehilite .nb {{ color: #ff7b72; }}
        .codehilite .nc {{ color: #d2a8ff; font-weight: bold; }}
        .codehilite .no {{ color: #ff7b72; }}
        .codehilite .nd {{ color: #ff7b72; }}
        .codehilite .ni {{ color: #ff7b72; }}
        .codehilite .ne {{ color: #f85149; font-weight: bold; }}
        .codehilite .nf {{ color: #d2a8ff; }}
        .codehilite .nl {{ color: #ff7b72; }}
        .codehilite .nn {{ color: #ff7b72; }}
        .codehilite .nt {{ color: #ff7b72; }}
        .codehilite .nv {{ color: #79c0ff; }}
        .codehilite .ow {{ color: #ff7b72; font-weight: bold; }}
        .codehilite .w {{ color: #8b949e; }}
        .codehilite .mb {{ color: #f2cc60; }}
        .codehilite .mf {{ color: #f2cc60; }}
        .codehilite .mh {{ color: #f2cc60; }}
        .codehilite .mi {{ color: #f2cc60; }}
        .codehilite .mo {{ color: #f2cc60; }}
        .codehilite .sa {{ color: #a5d6ff; }}
        .codehilite .sb {{ color: #a5d6ff; }}
        .codehilite .sc {{ color: #a5d6ff; }}
        .codehilite .dl {{ color: #a5d6ff; }}
        .codehilite .sd {{ color: #a5d6ff; }}
        .codehilite .s2 {{ color: #a5d6ff; }}
        .codehilite .se {{ color: #f2cc60; }}
        .codehilite .sh {{ color: #a5d6ff; }}
        .codehilite .si {{ color: #a5d6ff; }}
        .codehilite .sx {{ color: #a5d6ff; }}
        .codehilite .sr {{ color: #f2cc60; }}
        .codehilite .s1 {{ color: #a5d6ff; }}
        .codehilite .ss {{ color: #a5d6ff; }}
        .codehilite .bp {{ color: #ff7b72; }}
        .codehilite .fm {{ color: #d2a8ff; }}
        .codehilite .vc {{ color: #79c0ff; }}
        .codehilite .vg {{ color: #79c0ff; }}
        .codehilite .vi {{ color: #79c0ff; }}
        .codehilite .vm {{ color: #79c0ff; }}
        .codehilite .il {{ color: #f2cc60; }}
    </style>
</head>
<body>
    <div id="navbar"></div>
    
    <!-- 侧边栏：显示系列目录（由教程的侧边栏控制） -->
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-inner">
            <ul class="sidebar-menu">
                {series_sidebar_html}
            </ul>
        </div>
    </aside>

    <main class="main-content">
        <div class="content-inner tutorial-content">

            <!-- 面包屑 -->
            <nav class="breadcrumb">
                <a href="/{lang}/">{home_text}</a>
                <span class="separator">/</span>
                <a href="/{lang}/tutorials/">{tutorials_text}</a>
                <span class="separator">/</span>
                <span class="current">{series_title}</span>
            </nav>

            <!-- 教程头部 -->
            <header class="tutorial-header">
                <div class="tutorial-meta">
                    <span class="tutorial-number">{tutorial['number']}</span>
                    <span class="tutorial-status {status_class}">{status_display}</span>
                    <span class="tutorial-level">{tutorial.get('level', '')}</span>
                    <span class="tutorial-readtime">⏱️ {"About 30 min" if lang == 'en' else '约 30 分钟'}</span>
                </div>
                <h1>{title}</h1>
                <p class="tutorial-subtitle">{tutorial[lang].get('description', '')}</p>
            </header>

            <!-- 正文 -->
            <section class="tutorial-body">
                {body_html}
            </section>

            <!-- 上一篇 / 下一篇 -->
            <div class="tutorial-nav">
                {prev_html}
                {next_html}
            </div>

        </div>
    </main>

    <div id="footer"></div>

    <script src="/js/loader.js"></script>
    
    <!-- 重新渲染 Mermaid -->
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
# 获取教程在 series 中的顺序索引
# ============================================================
def get_series_index(series_config, current_page):
    """从系列配置中获取当前页面的顺序位置"""
    for i, ch in enumerate(series_config):
        if ch['link'] == current_page.name or ch['link'] == f'./{current_page.name}':
            return i
    return -1


# ============================================================
# 批量处理所有教程
# ============================================================
def batch_process_all_tutorials():
    """一次性处理所有教程"""
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
            
            # 查找所有 Markdown 文件
            md_files = find_markdown_files(tutorial_id, lang)
            
            if not md_files:
                print(f'  ⚠️ 未找到 [{lang}] Markdown 文件 → 生成占位')
                continue
            
            # 解析 tutorials.md（系列目录）
            if lang == 'zh':
                sidebar_file = BASE_DIR / 'zh' / 'tutorials' / tutorial_id / 'tutorials.md'
            else:
                sidebar_file = BASE_DIR / 'en' / 'tutorials' / tutorial_id / 'tutorials.md'
            
            # 对每个 md 文件生成 HTML
            for md_file in md_files:
                print(f'  📖 处理 [{lang}]: {md_file.name}')
                
                # 读取内容
                with open(md_file, 'r', encoding='utf-8') as f:
                    md_content = f.read()
                
                # 提取标题
                title = None
                for line in md_content.split('\n'):
                    if line.startswith('# ') and not line.startswith('## '):
                        title = line[2:].strip()
                        break
                if not title:
                    title = md_file.stem.replace('-', ' ').title()
                
                # 获取系列侧边栏
                series_title, series_sidebar_html = parse_series_sidebar(sidebar_file, md_file.name.replace('.md', '.html'))
                
                # 获取系列内上一篇/下一篇
                prev_file, next_file = get_series_nav(md_files, md_file)
                
                # 转换 Markdown → HTML
                converter = MarkdownToHTML(md_file, lang)
                body_html = converter.convert(md_content)
                
                # 生成 HTML
                html = generate_html_page(
                    tutorial, lang, title, body_html, 
                    prev_file, next_file, 
                    series_sidebar_html, series_title
                )
                
                # 输出 HTML（同目录，同名）
                output_file = md_file.parent / md_file.name.replace('.md', '.html')
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(html)
                
                print(f'    ✅ 生成: {output_file}')
                results.append({'tutorial': tutorial_id, 'lang': lang, 'file': md_file.name, 'status': 'success'})
        
        print()
    
    return results


# ============================================================
# 主函数
# ============================================================
def main():
    print('🔧 守夜者之书 - Markdown 批量构建工具')
    print('=' * 60)
    print('  ✅ 支持 GFM 语法（表格、任务列表、删除线等）')
    print('  ✅ 支持代码语法高亮（pygments）')
    print('  ✅ 支持图片渲染（路径自动修正）')
    print('  ✅ 支持 Mermaid 流程图（客户端渲染）')
    print('  ✅ 支持 MathJax 数学公式（客户端渲染）')
    print('  ✅ 支持系列目录侧边栏（tutorials.md）')
    print('  ✅ 支持系列内上一篇/下一篇导航')
    print('=' * 60 + '\n')
    
    results = batch_process_all_tutorials()
    
    print('=' * 60)
    print(f'🎉 构建完成！共处理 {len(results)} 个文件')
    print('=' * 60)


if __name__ == '__main__':
    main()
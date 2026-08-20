// docs/js/loader.js
// ============================================================
// 守夜者之书 - 页面加载器（支持中英文）
// ============================================================

// ============================================================
// 辅助函数：获取当前语言
// ============================================================
function getCurrentLang() {
    var path = window.location.pathname
    if (path.startsWith('/zh/')) return 'zh'
    if (path.startsWith('/en/')) return 'en'
    return 'zh'
}

function buildSidebarConfig(data, lang) {
    var categoryMap = {
        '01-markdown': '基础工具',
        '02-vscode': '基础工具',
        '03-vim': '基础工具',
        '04-git': '基础工具',
        '05-cybersecurity': '网络安全（主线）',
        '06-python': 'Python 系列（中阶）',
        '07-rust': '进阶之路',
        '08-cs-canon': '进阶之路'
    }
    
    var categoryLabels = {
        '基础工具': '⚔️ 基础工具',
        '网络安全（主线）': '🌐 网络安全（主线）',
        'Python 系列（中阶）': '🐍 Python 系列（中阶）',
        '进阶之路': '🚀 进阶之路'
    }
    
    var result = {}
    var tutorials = data.tutorials || []
    
    tutorials.forEach(function(t) {
        var cat = categoryMap[t.id] || '其他'
        if (!result[cat]) result[cat] = []
        var content = t[lang] || t['zh']
        result[cat].push({
            text: content.title,
            link: content.link,
            status: t.status
        })
    })
    
    var sidebarArray = []
    for (var cat in result) {
        sidebarArray.push({
            category: categoryLabels[cat] || cat,
            items: result[cat]
        })
    }
    return sidebarArray
}

// ============================================================
// 0. 加载公共 head
// ============================================================
fetch('/components/head.html')
    .then(function(res) {
        if (!res.ok) throw new Error('head.html 加载失败')
        return res.text()
    })
    .then(function(html) {
        document.head.insertAdjacentHTML('beforeend', html)
        console.log('✅ 公共 head 已加载')
    })
    .catch(function(err) {
        console.warn('⚠️ head.html 加载失败:', err)
    })

// ============================================================
// 1. 加载教程数据
// ============================================================
fetch('/data/tutorials.json')
    .then(function(res) {
        if (!res.ok) throw new Error('tutorials.json 加载失败')
        return res.json()
    })
    .then(function(data) {
        var lang = getCurrentLang()
        window.TUTORIALS_DATA = data
        window.CURRENT_LANG = lang
        window.SIDEBAR_CONFIG = buildSidebarConfig(data, lang)
        console.log('✅ 教程数据已加载，当前语言:', lang)
    })
    .catch(function(err) {
        console.warn('⚠️ 教程数据加载失败:', err)
        window.SIDEBAR_CONFIG = []
    })
    .finally(function() {
        // ============================================================
        // 2. 加载 components.js
        // ============================================================
        var script = document.createElement('script')
        script.src = '/js/components.js'
        script.onload = function() {
            console.log('✅ components.js 已加载')
            
            // 渲染导航栏
            if (typeof renderNavbar === 'function') {
                renderNavbar()
                console.log('✅ 导航栏已渲染')
            }
            
            var currentPath = window.location.pathname
            
            // 首页：渲染侧边栏
            if (currentPath === '/zh/' || currentPath === '/zh/index.html' ||
                currentPath === '/en/' || currentPath === '/en/index.html' ||
                currentPath === '/' || currentPath === '/index.html') {
                if (typeof renderSidebar === 'function') {
                    renderSidebar()
                    console.log('🏠 首页：渲染侧边栏')
                }
            } else {
                // 其他页面：由 toc.js 生成目录
                var tocScript = document.createElement('script')
                tocScript.src = '/js/toc.js'
                tocScript.onload = function() {
                    console.log('✅ toc.js 已加载')
                    if (typeof generateTOC === 'function') {
                        generateTOC()
                    }
                }
                document.body.appendChild(tocScript)
            }
            
            // 渲染页脚
            if (typeof renderFooter === 'function') {
                renderFooter()
                console.log('✅ 页脚已渲染')
            }
        }
        document.body.appendChild(script)
    })
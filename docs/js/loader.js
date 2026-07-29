// docs/js/loader.js
// ============================================================
// 守夜者之书 - 页面加载器
// ============================================================

// 0. 加载公共 head
fetch('/components/head.html')
    .then(res => {
        if (!res.ok) throw new Error('head.html 加载失败 (HTTP ' + res.status + ')')
        return res.text()
    })
    .then(html => {
        document.head.insertAdjacentHTML('beforeend', html)
        console.log('✅ 公共 head 已加载')
    })
    .catch(err => {
        console.warn('⚠️ head.html 加载失败:', err)
    })

// 1. 加载侧边栏配置
fetch('/components/sidebar-config.js')
    .then(res => {
        if (!res.ok) throw new Error('sidebar-config.js 加载失败 (HTTP ' + res.status + ')')
        return res.text()
    })
    .then(code => {
        eval(code)
        console.log('✅ 侧边栏配置已加载')
    })
    .catch(err => {
        console.warn('⚠️ 侧边栏配置加载失败:', err)
        window.SIDEBAR_CONFIG = []
    })
    .finally(() => {
        // 2. 加载 components.js
        const script = document.createElement('script')
        script.src = '/js/components.js'
        script.onload = function() {
            console.log('✅ components.js 已加载')
            
            // 渲染导航栏
            if (typeof renderNavbar === 'function') {
                renderNavbar()
                console.log('✅ 导航栏已渲染')
            }
            
            const currentPath = window.location.pathname
            console.log('🔍 当前路径:', currentPath)
            
            // ============================================================
            // 首页：用 renderSidebar 渲染教程列表
            // 其他页面：用 toc.js 生成目录
            // ============================================================
            if (currentPath === '/' || currentPath === '/index.html') {
                if (typeof renderSidebar === 'function') {
                    renderSidebar()
                    console.log('🏠 首页：渲染教程列表侧边栏')
                }
            } else {
                // about、tutorials 和其他页面：用 toc.js 生成 TOC
                const tocScript = document.createElement('script')
                tocScript.src = '/js/toc.js'
                tocScript.onload = function() {
                    console.log('✅ toc.js 已加载，生成 TOC')
                    if (typeof generateTOC === 'function') {
                        generateTOC()
                    }
                }
                document.body.appendChild(tocScript)
                console.log('📄 内容页：加载 toc.js')
            }
            
            // 渲染页脚
            if (typeof renderFooter === 'function') {
                renderFooter()
                console.log('✅ 页脚已渲染')
            }
        }
        document.body.appendChild(script)
    })
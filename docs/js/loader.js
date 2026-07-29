// docs/js/loader.js

// ============================================================
// 守夜者之书 - 页面加载器
// 负责加载配置、公共组件、初始化页面
// ============================================================

// 先加载侧边栏配置
fetch('/components/sidebar-config.js')
    .then(res => {
        if (!res.ok) throw new Error('sidebar-config.js 加载失败')
        return res.text()
    })
    .then(code => {
        // 执行配置脚本，定义 window.SIDEBAR_CONFIG
        eval(code)
        console.log('✅ 侧边栏配置已加载')
    })
    .catch(err => {
        console.warn('⚠️ 侧边栏配置加载失败:', err)
        // 设置空配置，避免页面报错
        window.SIDEBAR_CONFIG = []
    })
    .finally(() => {
        // 配置加载完成后，再加载 components.js
        const script = document.createElement('script')
        script.src = '/js/components.js'
        script.onload = function() {
            console.log('✅ components.js 已加载')
            
            // 渲染所有组件
            if (typeof renderNavbar === 'function') renderNavbar()
            if (typeof renderSidebar === 'function') renderSidebar()
            if (typeof renderFooter === 'function') renderFooter()
            
            // 加载 main.js（交互功能）
            const mainScript = document.createElement('script')
            mainScript.src = '/js/main.js'
            document.body.appendChild(mainScript)
        }
        document.body.appendChild(script)
    })
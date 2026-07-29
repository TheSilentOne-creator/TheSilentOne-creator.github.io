// docs/js/components.js
// ============================================================
// 守夜者之书 - 公共组件渲染
// 导航栏、侧边栏、页脚
// ============================================================

// ============================================================
// 1. 导航栏配置
// ============================================================
const NAV_CONFIG = {
    brand: {
        name: '⚔️ 守夜者之书',
        link: '/'
    },
    links: [
        { text: '首页', link: '/' },
        { text: '教程', link: '/tutorials/' },
        { text: '关于', link: '/about/' }
    ],
    github: 'https://github.com/TheSilentOne-creator/The-Night-Keeper-s-Book'
}

// ============================================================
// 2. 渲染导航栏
// ============================================================
function renderNavbar() {
    const currentPath = window.location.pathname
    
    let navHtml = `
        <nav class="navbar">
            <div class="nav-container">
                <a href="${NAV_CONFIG.brand.link}" class="nav-brand">
                    ${NAV_CONFIG.brand.name}
                </a>
                <button class="nav-toggle" id="navToggle" aria-label="菜单">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <ul class="nav-links">
    `
    
    NAV_CONFIG.links.forEach(link => {
        const isActive = currentPath === link.link || 
                         (link.link !== '/' && currentPath.startsWith(link.link))
        navHtml += `
            <li>
                <a href="${link.link}" class="${isActive ? 'active' : ''}">
                    ${link.text}
                </a>
            </li>
        `
    })
    
    navHtml += `
                </ul>
                <div class="nav-actions">
                    <a href="${NAV_CONFIG.github}" target="_blank" class="github-link" title="GitHub 仓库">
                        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                        </svg>
                    </a>
                </div>
            </div>
        </nav>
    `
    
    document.getElementById('navbar').innerHTML = navHtml
    
    // 移动端菜单切换
    const toggle = document.getElementById('navToggle')
    const links = document.querySelector('.nav-links')
    if (toggle && links) {
        toggle.addEventListener('click', () => {
            links.classList.toggle('open')
            toggle.classList.toggle('active')
        })
    }
}

// ============================================================
// 3. 渲染侧边栏
// ============================================================
function renderSidebar() {
    if (typeof window.SIDEBAR_CONFIG === 'undefined') {
        console.warn('⚠️ SIDEBAR_CONFIG 未加载')
        return
    }
    
    const currentPath = window.location.pathname
    const sidebarEl = document.getElementById('sidebar')
    if (!sidebarEl) {
        console.warn('⚠️ 找不到 #sidebar 元素')
        return
    }
    
    let sidebarHtml = `
        <div class="sidebar-inner">
            <div class="sidebar-search">
                <input type="text" id="sidebarSearch" placeholder="🔍 搜索教程... (Ctrl+K)" />
            </div>
            <ul class="sidebar-menu">
    `
    
    window.SIDEBAR_CONFIG.forEach(group => {
        sidebarHtml += `
            <li class="sidebar-category">${group.category}</li>
        `
        group.items.forEach(item => {
            const isActive = currentPath === item.link || 
                             (item.link !== '/' && currentPath.startsWith(item.link))
            
            const statusMap = {
                'done': '✅ 已完成',
                'writing': '✍️ 编写中',
                'coming': '⏳ 敬请期待'
            }
            const statusText = item.status ? statusMap[item.status] : ''
            const statusClass = item.status ? `status-${item.status}` : ''
            
            sidebarHtml += `
                <li>
                    <a href="${item.link}" class="${isActive ? 'active' : ''} ${statusClass}">
                        ${item.text}
                        ${statusText ? `<span class="status-badge">${statusText}</span>` : ''}
                    </a>
                </li>
            `
        })
    })
    
    sidebarHtml += `
            </ul>
        </div>
    `
    
    sidebarEl.innerHTML = sidebarHtml
    
    const searchInput = document.getElementById('sidebarSearch')
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase()
            const items = sidebarEl.querySelectorAll('.sidebar-menu li:not(.sidebar-category)')
            items.forEach(item => {
                const text = item.textContent.toLowerCase()
                item.style.display = text.includes(query) ? '' : 'none'
            })
        })
    }
}

// ============================================================
// 4. 渲染页脚
// ============================================================
function renderFooter() {
    const footerEl = document.getElementById('footer')
    if (!footerEl) {
        console.warn('⚠️ 找不到 #footer 元素')
        return
    }
    
    fetch('/components/footer.html')
        .then(res => {
            if (!res.ok) throw new Error('footer.html 加载失败 (HTTP ' + res.status + ')')
            return res.text()
        })
        .then(html => {
            footerEl.innerHTML = html
            console.log('✅ 页脚已加载')
        })
        .catch(err => {
            console.warn('⚠️ 页脚加载失败:', err)
            footerEl.innerHTML = `
                <footer class="site-footer">
                    <div class="footer-container">
                        <div class="footer-oath">
                            <p>「长夜将至，我从今开始守夜，今夜如此，夜夜皆然。」</p>
                        </div>
                        <div class="footer-info">
                            <p>© 2026 守夜者之书 · CC BY-NC-SA 4.0</p>
                        </div>
                    </div>
                </footer>
            `
        })
}

// ============================================================
// 5. 暴露给全局
// ============================================================
window.renderNavbar = renderNavbar
window.renderSidebar = renderSidebar
window.renderFooter = renderFooter

console.log('✅ components.js 已加载')
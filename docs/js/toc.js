// docs/js/toc.js
// 自动生成页面标题大纲（Table of Contents）

function generateTOC() {
    const sidebar = document.getElementById('sidebar')
    if (!sidebar) {
        console.warn('⚠️ 找不到 #sidebar 元素')
        return
    }

    const currentPath = window.location.pathname
    console.log('🔍 当前路径:', currentPath)

    // ============================================================
    // 只有首页才显示默认侧边栏
    // /tutorials/ 也要显示 TOC
    // ============================================================
    if (currentPath === '/' || currentPath === '/index.html') {
        console.log('🏠 首页，保持默认侧边栏')
        return
    }

    const content = document.querySelector('.tutorial-content, .content-inner')
    if (!content) {
        console.warn('⚠️ 找不到 .tutorial-content 或 .content-inner')
        return
    }

    const headings = content.querySelectorAll('h1[id], h2[id], h3[id], h4[id]')
    console.log('🔍 找到带 id 的标题数量:', headings.length)
    
    if (headings.length === 0) {
        console.warn('⚠️ 页面没有带 id 的标题')
        return
    }

    // ============================================================
    // 生成 TOC 目录
    // ============================================================
    let tocHtml = `
        <div class="sidebar-inner">
            <div class="toc-header">
                <span class="toc-title">📖 本页目录</span>
            </div>
            <ul class="toc-list">
    `

    headings.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1))
        const indent = (level - 1) * 16
        const text = heading.textContent.trim()

        tocHtml += `
            <li class="toc-item toc-level-${level}" style="padding-left: ${indent}px;">
                <a href="#${heading.id}" class="toc-link">
                    ${text}
                </a>
            </li>
        `
    })

    tocHtml += `
            </ul>
        </div>
    `

    sidebar.innerHTML = tocHtml
    console.log('✅ TOC 已生成')

    // ============================================================
    // 高亮当前标题（根据滚动位置）
    // ============================================================
    function updateActiveTOC() {
        const navbarHeight = 64
        let currentId = null

        headings.forEach((heading) => {
            const rect = heading.getBoundingClientRect()
            if (rect.top <= navbarHeight + 20) {
                currentId = heading.id
            }
        })

        document.querySelectorAll('.toc-link').forEach(link => {
            const href = link.getAttribute('href')
            link.classList.toggle('active', href === `#${currentId}`)
        })
    }

    // ============================================================
    // 点击跳转：精确偏移 + 立即高亮
    // ============================================================
    document.querySelectorAll('.toc-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault()
            
            const targetId = this.getAttribute('href').substring(1)
            const target = document.getElementById(targetId)
            if (!target) return

            const navbarHeight = 64
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 16

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            })

            document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'))
            this.classList.add('active')
            history.pushState(null, null, `#${targetId}`)
        })
    })

    // ============================================================
    // 滚动时更新高亮（节流）
    // ============================================================
    let ticking = false
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateActiveTOC()
                ticking = false
            })
            ticking = true
        }
    })

    // ============================================================
    // 页面加载完成后，根据 URL hash 高亮
    // ============================================================
    setTimeout(function() {
        const hash = window.location.hash
        if (hash) {
            document.querySelectorAll('.toc-link').forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === hash)
            })
        }
        if (!hash && document.querySelector('.toc-link')) {
            document.querySelector('.toc-link').classList.add('active')
        }
    }, 150)

    updateActiveTOC()
}

document.addEventListener('DOMContentLoaded', generateTOC)
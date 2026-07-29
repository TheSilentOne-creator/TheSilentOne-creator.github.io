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

    // 首页 / 教程列表页 → 保持默认侧边栏（不做任何事）
    if (currentPath === '/' || currentPath === '/index.html' || 
        currentPath === '/tutorials/' || currentPath === '/tutorials/index.html') {
        console.log('📋 列表页，保持默认侧边栏')
        return
    }

    // 检查内容区域是否有标题
    const content = document.querySelector('.tutorial-content, .content-inner')
    if (!content) {
        console.warn('⚠️ 找不到 .tutorial-content 或 .content-inner')
        return
    }

    // 查找所有带 id 的标题
    const headings = content.querySelectorAll('h1[id], h2[id], h3[id], h4[id]')
    console.log('🔍 找到带 id 的标题数量:', headings.length)
    
    if (headings.length === 0) {
        console.warn('⚠️ 页面没有带 id 的标题，保持默认侧边栏')
        return
    }

    // 生成 TOC 目录（覆盖默认侧边栏）
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
    console.log('✅ TOC 已生成（覆盖默认侧边栏）')

    // ============================================================
    // 点击跳转：精确计算偏移量
    // ============================================================
    document.querySelectorAll('.toc-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault()
            const targetId = this.getAttribute('href').substring(1)
            const target = document.getElementById(targetId)
            if (target) {
                const navbarHeight = 64
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 16
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                })
                // 高亮当前链接
                document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'))
                this.classList.add('active')
            }
        })
    })

    // 滚动时高亮当前可见的标题
    let ticking = false
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateActiveTOC(headings)
                ticking = false
            })
            ticking = true
        }
    })
}

function updateActiveTOC(headings) {
    const navbarHeight = 64
    let currentId = null

    headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect()
        if (rect.top <= navbarHeight + 20) {
            currentId = heading.id
        }
    })

    document.querySelectorAll('.toc-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`)
    })
}

// 在 DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', generateTOC)
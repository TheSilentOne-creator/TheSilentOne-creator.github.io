// docs/js/toc.js
// 自动生成页面标题大纲（Table of Contents）

function generateTOC() {
    var sidebar = document.getElementById('sidebar')
    if (!sidebar) {
        console.warn('⚠️ 找不到 #sidebar 元素')
        return
    }

    var currentPath = window.location.pathname
    console.log('🔍 当前路径:', currentPath)

    // 首页不生成 TOC
    if (currentPath === '/' || currentPath === '/index.html' ||
        currentPath === '/zh/' || currentPath === '/zh/index.html' ||
        currentPath === '/en/' || currentPath === '/en/index.html') {
        console.log('🏠 首页，保持默认侧边栏')
        return
    }

    var content = document.querySelector('.tutorial-content, .content-inner')
    if (!content) {
        console.warn('⚠️ 找不到 .tutorial-content 或 .content-inner')
        return
    }

    var headings = content.querySelectorAll('h1[id], h2[id], h3[id], h4[id]')
    console.log('🔍 找到带 id 的标题数量:', headings.length)
    
    if (headings.length === 0) {
        console.warn('⚠️ 页面没有带 id 的标题')
        return
    }

    // 生成 TOC
    var tocHtml = `
        <div class="sidebar-inner">
            <div class="toc-header">
                <span class="toc-title">📖 本页目录</span>
            </div>
            <ul class="toc-list">
    `

    headings.forEach(function(heading) {
        var level = parseInt(heading.tagName.charAt(1))
        var indent = (level - 1) * 16
        var text = heading.textContent.trim()

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

    // 更新高亮
    function updateActiveTOC() {
        var navbarHeight = 64
        var currentId = null

        headings.forEach(function(heading) {
            var rect = heading.getBoundingClientRect()
            if (rect.top <= navbarHeight + 20) {
                currentId = heading.id
            }
        })

        document.querySelectorAll('.toc-link').forEach(function(link) {
            var href = link.getAttribute('href')
            link.classList.toggle('active', href === '#' + currentId)
        })
    }

    // 点击跳转
    document.querySelectorAll('.toc-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault()
            
            var targetId = this.getAttribute('href').substring(1)
            var target = document.getElementById(targetId)
            if (!target) return

            var navbarHeight = 64
            var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 16

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            })

            document.querySelectorAll('.toc-link').forEach(function(l) {
                l.classList.remove('active')
            })
            this.classList.add('active')
            history.pushState(null, null, '#' + targetId)
        })
    })

    // 滚动更新高亮
    var ticking = false
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateActiveTOC()
                ticking = false
            })
            ticking = true
        }
    })

    // 初始高亮
    setTimeout(function() {
        var hash = window.location.hash
        if (hash) {
            document.querySelectorAll('.toc-link').forEach(function(link) {
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
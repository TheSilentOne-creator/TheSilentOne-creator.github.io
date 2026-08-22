// docs/js/toc.js
// 侧边栏 Tab 切换：本页目录 ↔ 教程目录

function generateTOC() {
    var sidebar = document.getElementById('sidebar')
    if (!sidebar) {
        console.warn('⚠️ 找不到 #sidebar 元素')
        return
    }

    var currentPath = window.location.pathname

    // 首页不生成 TOC
    if (currentPath === '/' || currentPath === '/index.html' ||
        currentPath === '/zh/' || currentPath === '/zh/index.html' ||
        currentPath === '/en/' || currentPath === '/en/index.html') {
        return
    }

    var content = document.querySelector('.tutorial-content, .content-inner')
    if (!content) return

    // ============================================================
    // 1. 生成「本页目录」
    // ============================================================
    var headings = content.querySelectorAll('h1[id], h2[id], h3[id], h4[id]')
    var pageTocHtml = ''
    if (headings.length > 0) {
        pageTocHtml = '<ul class="toc-list">'
        headings.forEach(function(heading) {
            var level = parseInt(heading.tagName.charAt(1))
            var indent = (level - 1) * 16
            var text = heading.textContent.trim()
            pageTocHtml += `
                <li class="toc-item toc-level-${level}" style="padding-left: ${indent}px;">
                    <a href="#${heading.id}" class="toc-link">
                        ${text}
                    </a>
                </li>
            `
        })
        pageTocHtml += '</ul>'
    } else {
        pageTocHtml = '<p class="toc-empty">暂无目录</p>'
    }

    // ============================================================
    // 2. 生成「教程目录」（从 /zh/tutorials/xxx/tutorials.json 读取）
    // ============================================================
    var seriesTocHtml = '<p class="toc-empty">加载中...</p>'

    var pathParts = currentPath.split('/')
    var lang = pathParts[1] || 'zh'
    var tutorialId = null

    for (var i = 0; i < pathParts.length; i++) {
        if (pathParts[i] === 'tutorials' && i + 1 < pathParts.length) {
            tutorialId = pathParts[i + 1]
            break
        }
    }

    if (tutorialId) {
        // 从 /zh/tutorials/xxx/tutorials.json 读取
        var jsonPath = '/' + lang + '/tutorials/' + tutorialId + '/tutorials.json'
        console.log('📂 加载教程目录:', jsonPath)

        fetch(jsonPath)
            .then(function(res) {
                if (!res.ok) throw new Error('tutorials.json 加载失败 (HTTP ' + res.status + ')')
                return res.json()
            })
            .then(function(data) {
                // 从 JSON 中提取 chapters
                var chapters = data.chapters || []
                var seriesTitle = data.title || data.zh?.title || tutorialId

                if (chapters.length === 0) {
                    document.getElementById('series-toc-content').innerHTML = '<p class="toc-empty">暂无章节</p>'
                    return
                }

                var html = '<div class="series-title">' + seriesTitle + '</div>'
                html += '<ul class="toc-list series-toc-list">'
                chapters.forEach(function(ch) {
                    var isActive = ch.link === currentPath || currentPath.indexOf(ch.link) !== -1
                    var paddingLeft = 20 + (ch.level || 0) * 16
                    html += `
                        <li class="toc-item series-item" style="padding-left: ${paddingLeft}px;">
                            <a href="${ch.link}" class="toc-link ${isActive ? 'active' : ''}">
                                ${ch.title}
                            </a>
                        </li>
                    `
                })
                html += '</ul>'
                document.getElementById('series-toc-content').innerHTML = html
            })
            .catch(function(err) {
                console.warn('⚠️ 加载 tutorials.json 失败:', err)
                document.getElementById('series-toc-content').innerHTML = '<p class="toc-empty">暂无教程目录</p>'
            })
    } else {
        seriesTocHtml = '<p class="toc-empty">暂无教程目录</p>'
    }

    // ============================================================
    // 3. 渲染侧边栏（一个按钮切换）
    // ============================================================
    var sidebarHtml = `
        <div class="sidebar-inner">
            <div class="sidebar-tabs">
                <button class="sidebar-tab" id="toggleTab">📖 本页目录</button>
            </div>
            <div id="tab-content">
                ${pageTocHtml}
            </div>
            <div id="series-toc-content" style="display: none;">
                ${seriesTocHtml}
            </div>
        </div>
    `

    sidebar.innerHTML = sidebarHtml

    // ============================================================
    // 4. 切换逻辑（一个按钮）
    // ============================================================
    var tabBtn = document.getElementById('toggleTab')
    var pageContent = document.getElementById('tab-content')
    var seriesContent = document.getElementById('series-toc-content')
    var isPageMode = true

    // 默认显示本页目录（已经默认了）

    function switchMode() {
        isPageMode = !isPageMode
        if (isPageMode) {
            tabBtn.textContent = '📖 本页目录'
            pageContent.style.display = 'block'
            seriesContent.style.display = 'none'
            localStorage.setItem('sidebar-mode', 'page')
        } else {
            tabBtn.textContent = '📚 教程目录'
            pageContent.style.display = 'none'
            seriesContent.style.display = 'block'
            localStorage.setItem('sidebar-mode', 'series')
        }
    }

    tabBtn.addEventListener('click', switchMode)

    // 从 localStorage 恢复（默认 page，只有用户手动切换过才恢复）
    var savedMode = localStorage.getItem('sidebar-mode')
    if (savedMode === 'series') {
        switchMode()
    }

    // ============================================================
    // 5. 滚动高亮（仅对「本页目录」有效）
    // ============================================================
    function updateActiveTOC() {
        var navbarHeight = 64
        var currentId = null
        var tocLinks = document.querySelectorAll('#tab-content .toc-link')
        if (tocLinks.length === 0) return

        headings.forEach(function(heading) {
            var rect = heading.getBoundingClientRect()
            if (rect.top <= navbarHeight + 20) {
                currentId = heading.id
            }
        })

        tocLinks.forEach(function(link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + currentId)
        })
    }

    document.querySelectorAll('#tab-content .toc-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault()
            var targetId = this.getAttribute('href').substring(1)
            var target = document.getElementById(targetId)
            if (!target) return

            var navbarHeight = 64
            var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 16
            window.scrollTo({ top: targetPosition, behavior: 'smooth' })

            document.querySelectorAll('#tab-content .toc-link').forEach(function(l) {
                l.classList.remove('active')
            })
            this.classList.add('active')
            history.pushState(null, null, '#' + targetId)
        })
    })

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

    setTimeout(function() {
        var hash = window.location.hash
        if (hash) {
            document.querySelectorAll('#tab-content .toc-link').forEach(function(link) {
                link.classList.toggle('active', link.getAttribute('href') === hash)
            })
        }
        if (!hash && document.querySelector('#tab-content .toc-link')) {
            document.querySelector('#tab-content .toc-link').classList.add('active')
        }
    }, 150)

    updateActiveTOC()
}

document.addEventListener('DOMContentLoaded', generateTOC)
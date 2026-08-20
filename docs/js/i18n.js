// docs/js/i18n.js
// 中英文切换

(function() {
    function getCurrentLang() {
        var path = window.location.pathname
        if (path.startsWith('/zh/')) return 'zh'
        if (path.startsWith('/en/')) return 'en'
        return null
    }

    function switchLanguage(targetLang) {
        var currentLang = getCurrentLang()
        if (currentLang === targetLang) return

        var currentPath = window.location.pathname
        var newPath = currentPath

        if (currentLang) {
            newPath = currentPath.replace('/' + currentLang + '/', '/' + targetLang + '/')
        } else {
            newPath = '/' + targetLang + '/'
        }

        localStorage.setItem('nightkeeper-lang', targetLang)
        window.location.href = newPath
    }

    window.i18n = {
        getCurrentLang: getCurrentLang,
        switchLanguage: switchLanguage
    }

    // 在导航栏注入语言切换按钮
    document.addEventListener('DOMContentLoaded', function() {
        var navActions = document.querySelector('.nav-actions')
        if (!navActions) return

        var currentLang = getCurrentLang()
        if (!currentLang) return

        var targetLang = currentLang === 'zh' ? 'en' : 'zh'
        var targetLabel = targetLang === 'zh' ? '中' : 'EN'
        var targetFlag = targetLang === 'zh' ? '🇨🇳' : '🇬🇧'

        var btn = document.createElement('button')
        btn.className = 'lang-switch-btn'
        btn.innerHTML = targetFlag + ' ' + targetLabel
        btn.title = targetLang === 'zh' ? '切换到中文' : 'Switch to English'
        btn.addEventListener('click', function() {
            window.i18n.switchLanguage(targetLang)
        })

        navActions.insertBefore(btn, navActions.querySelector('.github-link'))
    })
})()
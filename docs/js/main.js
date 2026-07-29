// docs/js/main.js
// 通用交互脚本

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. 给所有 external 链接添加 target="_blank"
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        link.setAttribute('target', '_blank')
        link.setAttribute('rel', 'noopener noreferrer')
    })
    
    // 2. 键盘快捷键：Ctrl+K 聚焦搜索框
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault()
            const searchInput = document.getElementById('sidebarSearch')
            if (searchInput) {
                searchInput.focus()
                searchInput.select()
            }
        }
    })
    
    // 3. 代码块复制功能（可选）
    document.querySelectorAll('pre code').forEach(block => {
        // 可以添加复制按钮，暂不实现
    })
    
    console.log('⚔️ 长夜将至，我从今开始守夜。')
    console.log('📖 守夜者之书 · 从零开始学安全')
})
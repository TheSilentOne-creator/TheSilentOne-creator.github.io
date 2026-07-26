/**
 * 主入口
 * 确保所有模块按顺序初始化
 */

(function() {
  function init() {
    // 按依赖顺序初始化
    // 1. 主题（独立）
    if (window.Theme && typeof window.Theme.init === 'function') {
      window.Theme.init();
    }
    
    // 2. 语言（独立）
    if (window.Lang && typeof window.Lang.init === 'function') {
      window.Lang.init();
    }
    
    // 3. 侧边栏（独立）
    if (window.Sidebar && typeof window.Sidebar.init === 'function') {
      window.Sidebar.init();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(init, 300);
    });
  } else {
    setTimeout(init, 300);
  }

  // Docsify 路由切换后重新绑定
  document.addEventListener('pjax:complete', function() {
    setTimeout(init, 300);
  });
})();
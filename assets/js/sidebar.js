/**
 * 侧边栏收缩模块
 */

(function() {
  // 从 localStorage 读取侧边栏状态，默认展开（null 或 'visible' 都视为展开）
  const stored = localStorage.getItem('docsify-sidebar');
  let sidebarVisible = stored !== 'hidden';  // 默认展开

  // 应用侧边栏状态
  function applySidebar(visible) {
    sidebarVisible = visible;
    localStorage.setItem('docsify-sidebar', visible ? 'visible' : 'hidden');
    
    const sidebar = document.querySelector('.sidebar');
    const showBtn = document.getElementById('sidebarShowBtn');
    
    // 控制侧边栏显示
    if (sidebar) {
      sidebar.classList.toggle('hidden', !visible);
    }
    
    // 控制 body 类，用于内容居中
    document.body.classList.toggle('sidebar-hidden', !visible);
    
    // 浮动展开按钮：侧边栏隐藏时显示
    if (showBtn) {
      showBtn.classList.toggle('visible', !visible);
    }
  }

  // 切换侧边栏
  function toggleSidebar() {
    applySidebar(!sidebarVisible);
  }

  // 创建侧边栏头部
  function createSidebarHeader() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    if (sidebar.querySelector('.sidebar-header')) return;

    const header = document.createElement('div');
    header.className = 'sidebar-header';
    
    const title = document.createElement('span');
    title.className = 'app-name-link';
    title.textContent = '📖 守夜者之书';
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'sidebar-toggle-btn';
    toggleBtn.textContent = '☰';
    toggleBtn.title = '收缩侧边栏';
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleSidebar();
    });
    
    header.appendChild(title);
    header.appendChild(toggleBtn);
    
    sidebar.insertBefore(header, sidebar.firstChild);
  }

  // 创建浮动展开按钮
  function createShowButton() {
    let showBtn = document.getElementById('sidebarShowBtn');
    if (!showBtn) {
      showBtn = document.createElement('button');
      showBtn.id = 'sidebarShowBtn';
      showBtn.className = 'sidebar-show-btn';
      showBtn.textContent = '☰';
      showBtn.title = '展开侧边栏';
      showBtn.addEventListener('click', function() {
        applySidebar(true);
      });
      document.body.appendChild(showBtn);
    }
    // 根据状态显示/隐藏
    showBtn.classList.toggle('visible', !sidebarVisible);
    return showBtn;
  }

  // 初始化
  function initSidebar() {
    createSidebarHeader();
    createShowButton();
    applySidebar(sidebarVisible);
  }

  // 导出
  window.Sidebar = {
    init: initSidebar,
    apply: applySidebar,
    toggle: toggleSidebar
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initSidebar, 300);
    });
  } else {
    setTimeout(initSidebar, 300);
  }

  document.addEventListener('pjax:complete', function() {
    setTimeout(initSidebar, 300);
  });

  // 监听侧边栏外部变化，同步状态
  const observer = new MutationObserver(function() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      const isHidden = sidebar.classList.contains('hidden');
      const stored = localStorage.getItem('docsify-sidebar');
      const expectedHidden = stored === 'hidden';
      if (isHidden !== expectedHidden) {
        localStorage.setItem('docsify-sidebar', isHidden ? 'hidden' : 'visible');
        sidebarVisible = !isHidden;
        const showBtn = document.getElementById('sidebarShowBtn');
        if (showBtn) {
          showBtn.classList.toggle('visible', isHidden);
        }
        document.body.classList.toggle('sidebar-hidden', isHidden);
      }
    }
  });
  
  setTimeout(function() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    }
  }, 500);
})();
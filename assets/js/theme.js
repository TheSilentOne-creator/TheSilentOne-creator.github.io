/**
 * 主题切换模块
 */

(function() {
  // 从 localStorage 读取主题，默认暗色
  let currentTheme = localStorage.getItem('docsify-theme') || 'dark';

  // 应用主题
  function applyTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('docsify-theme', theme);
    
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }

    // 更新按钮文字
    const themeBtn = document.querySelector('.theme-btn');
    if (themeBtn) {
      themeBtn.textContent = theme === 'dark' ? '🌙 暗色' : '☀️ 亮色';
      themeBtn.dataset.theme = theme;
    }
  }

  // 切换主题
  function toggleTheme() {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(nextTheme === 'dark' ? '🌙 已切换到暗色模式' : '☀️ 已切换到亮色模式');
  }

  // 创建主题按钮
  function createThemeButton() {
    const nav = document.querySelector('.app-nav');
    if (!nav) return;

    // 检查是否已存在按钮组
    let btnGroup = nav.querySelector('.nav-buttons');
    if (!btnGroup) {
      btnGroup = document.createElement('div');
      btnGroup.className = 'nav-buttons';
      nav.appendChild(btnGroup);
    }

    // 检查是否已存在主题按钮
    if (btnGroup.querySelector('.theme-btn')) return;

    const themeBtn = document.createElement('button');
    themeBtn.className = 'nav-btn theme-btn';
    themeBtn.dataset.theme = currentTheme;
    themeBtn.textContent = currentTheme === 'dark' ? '🌙 暗色' : '☀️ 亮色';
    themeBtn.title = '切换暗色/亮色模式';
    themeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleTheme();
    });

    // 插入到语言按钮之前
    const langBtn = btnGroup.querySelector('.lang-btn');
    if (langBtn) {
      btnGroup.insertBefore(themeBtn, langBtn);
    } else {
      btnGroup.appendChild(themeBtn);
    }

    return themeBtn;
  }

  // Toast 提示（复用）
  function showToast(msg) {
    const old = document.querySelector('.lang-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'lang-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(function() {
      toast.classList.add('fade-out');
      setTimeout(function() { toast.remove(); }, 300);
    }, 2000);
  }

  // 初始化
  function initTheme() {
    applyTheme(currentTheme);
    createThemeButton();
  }

  // 导出
  window.Theme = {
    init: initTheme,
    apply: applyTheme,
    toggle: toggleTheme,
    createButton: createThemeButton
  };

  // 页面加载完成后自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initTheme, 300);
    });
  } else {
    setTimeout(initTheme, 300);
  }

  // 监听路由变化
  document.addEventListener('pjax:complete', function() {
    setTimeout(createThemeButton, 300);
  });
})();
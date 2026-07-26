/**
 * 语言切换模块
 */

(function() {
  // 语言配置
  const translations = {
    'zh': { label: '🌐 中文', switchTo: 'en', switchLabel: 'English' },
    'en': { label: '🌐 English', switchTo: 'zh', switchLabel: '中文' }
  };

  // 从 localStorage 读取语言，默认中文
  let currentLang = localStorage.getItem('docsify-lang') || 'zh';

  // 切换语言
  function switchLang() {
    const t = translations[currentLang];
    const newLang = t.switchTo;
    currentLang = newLang;
    localStorage.setItem('docsify-lang', currentLang);
    
    // 更新按钮文字
    const langBtn = document.querySelector('.lang-btn');
    if (langBtn) {
      langBtn.textContent = translations[currentLang].label;
    }
    
    showToast(translations[currentLang].switchLabel + ' (翻译中)');
  }

  // 创建语言按钮
  function createLangButton() {
    const nav = document.querySelector('.app-nav');
    if (!nav) return;

    let btnGroup = nav.querySelector('.nav-buttons');
    if (!btnGroup) {
      btnGroup = document.createElement('div');
      btnGroup.className = 'nav-buttons';
      nav.appendChild(btnGroup);
    }

    if (btnGroup.querySelector('.lang-btn')) return;

    const langBtn = document.createElement('button');
    langBtn.className = 'nav-btn lang-btn';
    langBtn.textContent = translations[currentLang].label;
    langBtn.title = '切换语言';
    langBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      switchLang();
    });

    btnGroup.appendChild(langBtn);
    return langBtn;
  }

  // Toast 提示
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
  function initLang() {
    createLangButton();
  }

  // 导出
  window.Lang = {
    init: initLang,
    switch: switchLang,
    createButton: createLangButton,
    getCurrent: function() { return currentLang; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initLang, 300);
    });
  } else {
    setTimeout(initLang, 300);
  }

  document.addEventListener('pjax:complete', function() {
    setTimeout(createLangButton, 300);
  });
})();
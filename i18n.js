/* ============================================================
   مشاتي السعودية — محرّك اللغتين (عربي / إنجليزي)
   الطريقة: كل عنصر نصّي يحمل النص الإنجليزي في data-en،
   ويُلتقط النص العربي تلقائياً من المحتوى الأصلي.
   عند التبديل يتم تغيير dir/lang للصفحة بالكامل.
   ============================================================ */
(function () {
  var KEY = 'mshati_lang';

  function getLang() {
    try { return localStorage.getItem(KEY) || 'ar'; } catch (e) { return 'ar'; }
  }
  function storeLang(l) {
    try { localStorage.setItem(KEY, l); } catch (e) {}
  }

  function apply(lang) {
    var en = (lang === 'en');
    var html = document.documentElement;
    html.lang = en ? 'en' : 'ar';
    html.dir = en ? 'ltr' : 'rtl';
    html.setAttribute('data-lang', en ? 'en' : 'ar');

    // النصوص (innerHTML حتى تُدعم العناصر الداخلية مثل <span>)
    var nodes = document.querySelectorAll('[data-en]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el.hasAttribute('data-ar')) {
        el.setAttribute('data-ar', el.innerHTML.trim());
      }
      el.innerHTML = en ? el.getAttribute('data-en') : el.getAttribute('data-ar');
    }

    // النصوص النائبة (placeholder)
    var phs = document.querySelectorAll('[data-en-ph]');
    for (var j = 0; j < phs.length; j++) {
      var p = phs[j];
      if (!p.hasAttribute('data-ar-ph')) {
        p.setAttribute('data-ar-ph', p.getAttribute('placeholder') || '');
      }
      p.setAttribute('placeholder', en ? p.getAttribute('data-en-ph') : p.getAttribute('data-ar-ph'));
    }

    // تسمية زر التبديل: يعرض اللغة الأخرى
    var btns = document.querySelectorAll('[data-lang-toggle]');
    for (var k = 0; k < btns.length; k++) {
      btns[k].textContent = en ? 'العربية' : 'EN';
      btns[k].setAttribute('aria-label', en ? 'التبديل إلى العربية' : 'Switch to English');
    }
  }

  function setLang(lang) { storeLang(lang); apply(lang); }
  function toggle() { setLang(getLang() === 'en' ? 'ar' : 'en'); }

  window.MshatiI18n = { get: getLang, set: setLang, apply: apply, toggle: toggle };

  function init() {
    apply(getLang());
    var btns = document.querySelectorAll('[data-lang-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function (e) { e.preventDefault(); toggle(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

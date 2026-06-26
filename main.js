/* ============================================================
   مشاتي السعودية — التفاعلات + ربط Supabase (واجهة الزوار)
   ============================================================ */
(function () {
  const CFG = window.MSHATI_CONFIG || {};

  // ====================================================================
  // اتصال مباشر بقاعدة البيانات عبر fetch — بدون مكتبة خارجية من CDN.
  // كانت مكتبة supabase-js تُحمّل من cdn.jsdelivr.net، وقد تُحجب أو تتأخّر
  // لدى بعض مزوّدي الإنترنت في السعودية، فلا تظهر الصور ولا المشاريع للزوار.
  // هذا العميل المصغّر يدعم: select / insert / order — وهو ما يحتاجه الموقع.
  // ====================================================================
  function makeClient(baseUrl, key) {
    const rest = baseUrl + '/rest/v1';
    const hdr = (extra) => Object.assign({ apikey: key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' }, extra || {});
    function qb(table) {
      const st = { table: table, method: 'GET', cols: '*', order: null, filters: [], body: null };
      const b = {
        select: function (c) { st.cols = c || '*'; return b; },
        insert: function (r) { st.method = 'POST'; st.body = r; return b; },
        update: function (r) { st.method = 'PATCH'; st.body = r; return b; },
        delete: function () { st.method = 'DELETE'; return b; },
        eq: function (c, v) { st.filters.push(c + '=eq.' + encodeURIComponent(v)); return b; },
        order: function (c, o) { st.order = c + '.' + ((!o || o.ascending !== false) ? 'asc' : 'desc'); return b; },
        then: function (res, rej) { return exec(st).then(res, rej); }
      };
      return b;
    }
    function exec(st) {
      let url = rest + '/' + st.table;
      let p = [];
      if (st.method === 'GET' && st.cols) p.push('select=' + encodeURIComponent(st.cols));
      if (st.order) p.push('order=' + st.order);
      if (st.filters.length) p = p.concat(st.filters);
      if (p.length) url += '?' + p.join('&');
      const opt = { method: st.method, headers: hdr(st.method === 'POST' ? { Prefer: 'return=representation' } : null) };
      if (st.body != null) opt.body = JSON.stringify(st.body);
      return fetch(url, opt).then(function (r) {
        return r.text().then(function (t) {
          let data = null;
          if (t) { try { data = JSON.parse(t); } catch (_) { data = t; } }
          if (!r.ok) return { data: null, error: { message: (data && data.message) || ('HTTP ' + r.status) } };
          return { data: data, error: null };
        });
      }).catch(function (e) { return { data: null, error: { message: (e && e.message) || 'فشل الاتصال بالشبكة' } }; });
    }
    return { from: qb };
  }

  const SB = (CFG.SUPABASE_URL && CFG.SUPABASE_KEY) ? makeClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY) : null;
  window.MSHATI_SB = SB; // shared for admin

  /* ---------- Icons ---------- */
  const ICON = {
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.748-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>',
    quote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6M9 9h1"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4 20-7Z"/></svg>'
  };

  /* ---------- Header / nav ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 30);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  const observeReveals = () => document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
  observeReveals();

  const y = document.querySelector('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Toast ---------- */
  function toast(msg, isErr) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.className = 'toast' + (isErr ? ' err' : '');
    t.innerHTML = (isErr ? ICON.close : ICON.check) + '<span></span>';
    t.querySelector('span').textContent = msg;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove('show'), 4200);
  }
  window.MSHATI_TOAST = toast;

  /* ---------- Floating buttons + Quote modal (injected once) ---------- */
  const wa = `https://wa.me/${CFG.WHATSAPP}?text=${encodeURIComponent(CFG.WHATSAPP_MSG || '')}`;
  const fab = document.createElement('div');
  fab.className = 'fab-stack';
  fab.innerHTML = `
    <a class="fab fab-wa" href="${wa}" target="_blank" rel="noopener" aria-label="تواصل عبر واتساب">
      ${ICON.wa}<span class="fab-label">واتساب</span>
    </a>
    <button class="fab fab-quote" data-open-quote aria-label="طلب عرض سعر">
      ${ICON.quote}<span class="fab-label">طلب عرض سعر</span>
    </button>`;
  document.body.appendChild(fab);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="طلب عرض سعر">
      <button class="modal-close" data-close-quote aria-label="إغلاق">${ICON.close}</button>
      <span class="eyebrow">طلب عرض سعر</span>
      <h3>احكِ لنا عن مشروعك</h3>
      <p class="muted">عبّئي البيانات وسنعاود التواصل معك بأقرب وقت.</p>
      <form id="quote-form">
        <div class="field"><label>الاسم</label><input name="name" type="text" placeholder="الاسم الكامل" required></div>
        <div class="field"><label>رقم الجوال</label><input name="phone" type="tel" placeholder="05xxxxxxxx" required></div>
        <div class="field"><label>نوع المشروع</label>
          <input name="project_type" type="text" placeholder="إنشائي / تشطيب / زراعة / ترميم تراثي" list="ptypes">
          <datalist id="ptypes">
            <option value="مقاولات إنشائية ومعمارية"></option>
            <option value="تشطيبات وديكور"></option>
            <option value="مقاولات زراعية وتنسيق مواقع"></option>
            <option value="ترميم تراثي"></option>
          </datalist>
        </div>
        <div class="field"><label>تفاصيل المشروع</label><textarea name="message" placeholder="الموقع، المساحة، المطلوب..."></textarea></div>
        <button type="submit" class="btn btn-gold" style="width:100%;justify-content:center">إرسال الطلب ${ICON.send}</button>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  const openModal = () => { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeModal = () => { overlay.classList.remove('open'); document.body.style.overflow = ''; };
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-quote]')) { e.preventDefault(); openModal(); }
    if (e.target.closest('[data-close-quote]') || e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------- Submit quote (modal + page contact form) ---------- */
  async function submitQuote(data) {
    if (!SB) { toast('تعذّر الاتصال بقاعدة البيانات.', true); return false; }
    const { error } = await SB.from('quote_requests').insert([data]);
    if (error) { toast('حدث خطأ، حاولي مرة أخرى.', true); return false; }
    return true;
  }
  const qf = overlay.querySelector('#quote-form');
  qf.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(qf).entries());
    if (await submitQuote(fd)) { qf.reset(); closeModal(); toast('تم استلام طلبك — سنتواصل معك قريباً.'); }
  });

  const pageForm = document.querySelector('#contact-form');
  if (pageForm) {
    pageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(pageForm).entries());
      const payload = { name: fd.name || '', phone: fd.phone || '', project_type: fd.type || '', message: fd.msg || '' };
      const note = pageForm.querySelector('.form-note');
      if (await submitQuote(payload)) {
        pageForm.reset();
        if (note) { note.textContent = 'شكراً لتواصلك — تم استلام طلبك وسنعاود التواصل معك قريباً.'; note.style.color = 'var(--gold-2)'; }
        toast('تم استلام طلبك بنجاح.');
      }
    });
  }

  /* ---------- Page-view logging ---------- */
  if (SB) {
    const page = document.body.dataset.page || location.pathname.split('/').pop() || 'index';
    SB.from('page_views').insert([{ page }]).then(() => {}, () => {});
  }

  /* ---------- Apply editable images from DB ---------- */
  async function applySiteImages() {
    if (!SB) return;
    const { data } = await SB.from('site_images').select('key,image_url');
    if (!data) return;
    const map = Object.fromEntries(data.map(r => [r.key, r.image_url]));
    document.querySelectorAll('[data-bg-slot]').forEach(el => {
      const u = map[el.dataset.bgSlot];
      if (u) el.style.backgroundImage =
        `linear-gradient(90deg, rgba(8,7,6,.95) 0%, rgba(8,7,6,.6) 45%, rgba(8,7,6,.25) 100%), linear-gradient(0deg, rgba(8,7,6,.95), rgba(8,7,6,.1) 55%), url('${u}')`;
    });
    document.querySelectorAll('[data-img-slot]').forEach(el => {
      const u = map[el.dataset.imgSlot];
      if (u) {
        const img = el.querySelector('img') || el;
        if (img.tagName === 'IMG') { img.src = u; img.style.display = 'block'; }
        else { el.style.backgroundImage = `url('${u}')`; el.style.backgroundSize = 'cover'; el.style.backgroundPosition = 'center'; }
        const ph = el.querySelector('.media-ph'); if (ph) ph.style.display = 'none';
      }
    });
  }
  applySiteImages();

  /* ---------- Dynamic projects (projects page) ---------- */
  const grid = document.querySelector('#projects-grid');
  if (grid && SB) {
    const CAT = {
      structural: 'إنشائية', finishing: 'تشطيبات', landscape: 'زراعة وتنسيق', heritage: 'تراث وترميم'
    };
    const phIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>';
    grid.innerHTML = '<div class="state-msg">جارٍ تحميل المشاريع…</div>';
    SB.from('projects').select('*').order('sort', { ascending: true }).then(({ data, error }) => {
      if (error || !data || !data.length) {
        grid.innerHTML = '<div class="state-msg">لا توجد مشاريع منشورة بعد.</div>'; return;
      }
      grid.innerHTML = data.map(p => `
        <article class="project-card reveal" data-cat="${p.category}">
          <div class="project-thumb">
            <span class="project-tag">${CAT[p.category] || ''}</span>
            ${p.image_url
              ? `<img src="${p.image_url}" alt="${escapeHtml(p.title)}" loading="lazy">`
              : `<div class="ph">${phIcon}<br>صورة المشروع</div>`}
          </div>
          <div class="project-body"><h4>${escapeHtml(p.title)}</h4><p>${escapeHtml(p.description || '')}</p></div>
        </article>`).join('');
      observeReveals();
      bindFilter();
    });
  }

  function bindFilter() {
    const btns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card');
    btns.forEach(btn => btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active')); btn.classList.add('active');
      const f = btn.dataset.filter;
      cards.forEach(c => c.classList.toggle('hide', !(f === 'all' || c.dataset.cat === f)));
    }));
  }
  // static filter (if grid not dynamic)
  if (!grid) bindFilter();

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
})();

/* ============================================================
   مشاتي السعودية — لوحة التحكم (Supabase)
   ملاحظة أمنية: التحقق من كلمة المرور يتم في المتصفح فقط،
   وهو مناسب لحماية بسيطة. للحماية الكاملة استخدمي Supabase Auth.
   ============================================================ */
(function () {
  const CFG = window.MSHATI_CONFIG || {};
  const SB = (window.supabase && CFG.SUPABASE_URL)
    ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY)
    : null;
  const BUCKET = CFG.BUCKET || 'site-images';
  const SKEY = 'mshati_admin_ok';

  const CAT = { structural: 'إنشائية', finishing: 'تشطيبات', landscape: 'زراعة وتنسيق', heritage: 'تراث وترميم' };
  const ICON = {
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
    img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.748-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>'
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const fmtDate = (d) => { try { return new Date(d).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return d; } };

  function toast(msg, isErr) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.className = 'toast' + (isErr ? ' err' : '');
    t.innerHTML = '<span></span>'; t.querySelector('span').textContent = msg;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(t._tm); t._tm = setTimeout(() => t.classList.remove('show'), 4200);
  }

  /* ---------- Login ---------- */
  const gate = $('#login-gate'), dash = $('#dashboard');
  function showDash() { gate.hidden = true; dash.hidden = false; initDashboard(); }
  function isAuthed() { try { return sessionStorage.getItem(SKEY) === '1'; } catch (e) { return false; } }

  if (isAuthed()) showDash();

  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = $('#admin-pass').value;
    if (val === CFG.ADMIN_PASSWORD) {
      try { sessionStorage.setItem(SKEY, '1'); } catch (e2) {}
      $('#login-error').textContent = '';
      showDash();
    } else {
      $('#login-error').textContent = 'كلمة المرور غير صحيحة.';
      $('#admin-pass').value = '';
    }
  });

  $('#logout-btn').addEventListener('click', () => {
    try { sessionStorage.removeItem(SKEY); } catch (e) {}
    location.reload();
  });

  /* ---------- Tabs ---------- */
  $$('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    $$('.tab-panel').forEach(p => p.hidden = (p.id !== 'tab-' + tab));
  }));

  document.addEventListener('click', (e) => {
    const r = e.target.closest('[data-refresh]');
    if (!r) return;
    const map = { analytics: loadAnalytics, projects: loadProjects, images: loadImages, quotes: loadQuotes };
    (map[r.dataset.refresh] || (() => {}))();
  });

  /* ---------- Init ---------- */
  let inited = false;
  function initDashboard() {
    if (inited) return; inited = true;
    if (!SB) { toast('تعذّر الاتصال بقاعدة البيانات. تحقّقي من config.js', true); return; }
    loadAnalytics(); loadProjects(); loadImages(); loadQuotes();
    bindProjectForm();
  }

  /* ---------- Storage upload ---------- */
  async function uploadFile(file, prefix) {
    const clean = file.name.replace(/[^\w.\-]/g, '_');
    const path = `${prefix}/${Date.now()}-${clean}`;
    const { error } = await SB.storage.from(BUCKET).upload(path, file, { upsert: true, cacheControl: '3600' });
    if (error) throw error;
    const { data } = SB.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  /* ================= ANALYTICS ================= */
  async function loadAnalytics() {
    const cards = $('#stat-cards'), bars = $('#page-bars');
    cards.innerHTML = '<div class="state-msg">جارٍ التحميل…</div>'; bars.innerHTML = '';
    const [views, quotes, projects] = await Promise.all([
      SB.from('page_views').select('page'),
      SB.from('quote_requests').select('id'),
      SB.from('projects').select('id')
    ]);
    const v = views.data || [];
    const counts = {};
    v.forEach(r => { counts[r.page] = (counts[r.page] || 0) + 1; });
    const labels = { index: 'الرئيسية', about: 'من نحن', services: 'خدماتنا', projects: 'المشاريع', process: 'خط السير', contact: 'تواصل معنا', admin: 'لوحة التحكم' };
    cards.innerHTML = [
      ['إجمالي الزيارات', v.length],
      ['طلبات عروض الأسعار', (quotes.data || []).length],
      ['المشاريع المنشورة', (projects.data || []).length],
      ['عدد الصفحات المُزارة', Object.keys(counts).length]
    ].map(([l, n]) => `<div class="stat-card"><div class="stat-num">${n}</div><div class="stat-label">${l}</div></div>`).join('');

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = entries.length ? entries[0][1] : 1;
    bars.innerHTML = entries.length
      ? entries.map(([p, n]) => `
        <div class="page-bar">
          <div class="pb-top"><b>${esc(labels[p] || p)}</b><span>${n} زيارة</span></div>
          <div class="pb-track"><div class="pb-fill" style="width:${Math.round(n / max * 100)}%"></div></div>
        </div>`).join('')
      : '<div class="state-msg">لا توجد زيارات مسجّلة بعد.</div>';
  }

  /* ================= PROJECTS ================= */
  async function loadProjects() {
    const list = $('#projects-admin-list');
    list.innerHTML = '<div class="state-msg">جارٍ التحميل…</div>';
    const { data, error } = await SB.from('projects').select('*').order('sort', { ascending: true });
    if (error) { list.innerHTML = '<div class="state-msg">تعذّر تحميل المشاريع.</div>'; return; }
    if (!data.length) { list.innerHTML = '<div class="state-msg">لا توجد مشاريع بعد.</div>'; return; }
    list.innerHTML = data.map(p => `
      <div class="admin-item" data-id="${p.id}">
        <div class="thumb" ${p.image_url ? `style="background-image:url('${esc(p.image_url)}')"` : ''}>${p.image_url ? '' : ICON.img}</div>
        <div class="meta">
          <b>${esc(p.title)}</b>
          <small>${esc((p.description || '').slice(0, 70))}</small>
          <span class="cat-tag">${CAT[p.category] || p.category}</span>
        </div>
        <div class="ops">
          <button class="icon-btn" data-edit aria-label="تعديل">${ICON.edit}</button>
          <button class="icon-btn del" data-del aria-label="حذف">${ICON.del}</button>
        </div>
      </div>`).join('');

    list._data = data;
    $$('[data-edit]', list).forEach(b => b.addEventListener('click', () => {
      const id = b.closest('.admin-item').dataset.id;
      const p = data.find(x => String(x.id) === String(id));
      if (p) fillProjectForm(p);
    }));
    $$('[data-del]', list).forEach(b => b.addEventListener('click', async () => {
      const id = b.closest('.admin-item').dataset.id;
      if (!confirm('حذف هذا المشروع نهائياً؟')) return;
      const { error } = await SB.from('projects').delete().eq('id', id);
      if (error) return toast('تعذّر الحذف.', true);
      toast('تم حذف المشروع.'); loadProjects(); loadAnalytics();
    }));
  }

  function fillProjectForm(p) {
    const f = $('#project-form');
    f.id.value = p.id; f.title.value = p.title || ''; f.description.value = p.description || '';
    f.category.value = p.category || 'structural'; f.sort.value = p.sort || 0;
    $('#proj-form-title').textContent = 'تعديل المشروع';
    $('#proj-reset').hidden = false;
    const prev = $('#proj-preview');
    if (p.image_url) { prev.hidden = false; prev.querySelector('img').src = p.image_url; }
    else { prev.hidden = true; }
    f._existingImage = p.image_url || '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetProjectForm() {
    const f = $('#project-form'); f.reset(); f.id.value = '';
    f._existingImage = ''; $('#proj-preview').hidden = true;
    $('#proj-form-title').textContent = 'إضافة مشروع جديد';
    $('#proj-reset').hidden = true;
  }

  function bindProjectForm() {
    const f = $('#project-form');
    $('#proj-reset').addEventListener('click', resetProjectForm);
    $('#proj-image').addEventListener('change', (e) => {
      const file = e.target.files[0]; const prev = $('#proj-preview');
      if (file) { prev.hidden = false; prev.querySelector('img').src = URL.createObjectURL(file); }
    });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = f.querySelector('button[type=submit]'); const orig = btn.textContent;
      btn.disabled = true; btn.textContent = 'جارٍ الحفظ…';
      try {
        let image_url = f._existingImage || null;
        const file = $('#proj-image').files[0];
        if (file) image_url = await uploadFile(file, 'projects');
        const row = {
          title: f.title.value.trim(),
          description: f.description.value.trim(),
          category: f.category.value,
          sort: parseInt(f.sort.value, 10) || 0,
          image_url
        };
        let error;
        if (f.id.value) ({ error } = await SB.from('projects').update(row).eq('id', f.id.value));
        else ({ error } = await SB.from('projects').insert([row]));
        if (error) throw error;
        toast(f.id.value ? 'تم تحديث المشروع.' : 'تمت إضافة المشروع.');
        resetProjectForm(); loadProjects(); loadAnalytics();
      } catch (err) {
        toast('حدث خطأ أثناء الحفظ: ' + (err.message || ''), true);
      } finally { btn.disabled = false; btn.textContent = orig; }
    });
  }

  /* ================= IMAGES ================= */
  async function loadImages() {
    const wrap = $('#image-slots');
    wrap.innerHTML = '<div class="state-msg">جارٍ التحميل…</div>';
    const { data, error } = await SB.from('site_images').select('*').order('key', { ascending: true });
    if (error) { wrap.innerHTML = '<div class="state-msg">تعذّر تحميل الصور.</div>'; return; }
    if (!data.length) { wrap.innerHTML = '<div class="state-msg">لا توجد مواضع صور.</div>'; return; }
    wrap.innerHTML = data.map(s => `
      <div class="slot-card" data-key="${esc(s.key)}">
        <div class="slot-img" ${s.image_url ? `style="background-image:url('${esc(s.image_url)}')"` : ''}>${s.image_url ? '' : ICON.img}</div>
        <div class="slot-body">
          <b>${esc(s.label || s.key)}</b>
          <small>${esc(s.key)}</small>
          <div class="slot-upload">
            <label>${ICON.up}<span>${s.image_url ? 'تغيير الصورة' : 'رفع صورة'}</span>
              <input type="file" accept="image/*" data-slot-input>
            </label>
          </div>
        </div>
      </div>`).join('');

    $$('[data-slot-input]', wrap).forEach(inp => inp.addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const card = inp.closest('.slot-card'); const key = card.dataset.key;
      card.classList.add('busy');
      try {
        const url = await uploadFile(file, 'slots/' + key);
        const { error: upErr } = await SB.from('site_images').update({ image_url: url, updated_at: new Date().toISOString() }).eq('key', key);
        if (upErr) throw upErr;
        card.querySelector('.slot-img').style.backgroundImage = `url('${url}')`;
        card.querySelector('.slot-img').innerHTML = '';
        toast('تم تحديث الصورة.');
      } catch (err) {
        toast('تعذّر رفع الصورة: ' + (err.message || ''), true);
      } finally { card.classList.remove('busy'); }
    }));
  }

  /* ================= QUOTES ================= */
  async function loadQuotes() {
    const list = $('#quotes-list');
    list.innerHTML = '<div class="state-msg">جارٍ التحميل…</div>';
    const { data, error } = await SB.from('quote_requests').select('*').order('created_at', { ascending: false });
    if (error) { list.innerHTML = '<div class="state-msg">تعذّر تحميل الطلبات.</div>'; return; }
    if (!data.length) { list.innerHTML = '<div class="state-msg">لا توجد طلبات بعد.</div>'; return; }
    list.innerHTML = data.map(q => {
      const phone = (q.phone || '').replace(/\D/g, '');
      const wa = phone ? `https://wa.me/${phone.startsWith('0') ? '966' + phone.slice(1) : phone}` : '';
      return `
      <div class="quote-card">
        <div class="qc-head"><b>${esc(q.name || 'بدون اسم')}</b><span class="qc-date">${fmtDate(q.created_at)}</span></div>
        <div class="qc-row"><span>الجوال:</span> ${esc(q.phone || '—')}</div>
        <div class="qc-row"><span>نوع المشروع:</span> ${esc(q.project_type || '—')}</div>
        ${q.message ? `<div class="qc-msg">${esc(q.message)}</div>` : ''}
        ${wa ? `<div class="qc-actions"><a class="wa-link" href="${wa}" target="_blank" rel="noopener">${ICON.wa} تواصل عبر واتساب</a></div>` : ''}
      </div>`;
    }).join('');
  }
})();

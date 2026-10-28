  function globalListeners() {
    ['mouseenter', 'mouseleave'].forEach(t => document.addEventListener(t, (e) => {
      const id = e.target && e.target.id;
      if (id === 'nqActivePet' || id === 'qrDock') e.stopImmediatePropagation();
    }, true));
    document.addEventListener('pointerdown', (e) => {
      if (dockOpen && !e.target.closest('#qrDockWrap, #nqActivePet')) setDock(false);
      if (e.target.closest && e.target.closest('#nqBgSave')) saving = true;
    }, true);

    document.addEventListener('click', (e) => {
      const pet = e.target.closest && e.target.closest('#qrDock .qrPet');
      if (!pet || e.target.closest('a')) return;
      const on = !pet.classList.contains('nqTap');
      document.querySelectorAll('#qrDock .qrPet.nqTap').forEach(x => x.classList.remove('nqTap'));
      if (on) pet.classList.add('nqTap');
    });
    document.addEventListener('click', async (e) => {
      const a = e.target.closest && e.target.closest('#qrDock .qrOverlay a');
      if (!a || !/make active/i.test(a.textContent) || e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (a.dataset.busy) return;
      a.dataset.busy = '1'; a.textContent = 'Switching…';
      try { await fetch(a.href, { credentials: 'include', cache: 'no-store' }); } catch {}
      ['nq_qr_data', 'nq_qr_data_lastFetch', 'nq_active_pet_img_v1'].forEach(LSdel);
      location.reload();
    }, true);

    document.addEventListener('mousemove', (e) => {
      const col = 240;
      if (tabEl) tabEl.classList.toggle('show', (innerHeight - e.clientY < 44 && e.clientX > col) || !!(panelEl && panelEl.classList.contains('open')));
      if (handleEl) handleEl.classList.toggle('nq-show', innerWidth - e.clientX < 44 && e.clientY > 60);
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      setTimeout(() => { const i = $('#nqTools input'); if (i) i.focus(); }, 40);
    }, true);
  }

  const ACCT_KEYS = ['nq_bank_state_v2', 'nq_bank_daily_v1', 'nq_bank_history_v1', 'nq_bank_pin_v1',
    'nq_np_last', 'nq_qr_data', 'nq_qr_data_lastFetch', 'nq_active_pet_img_v1', 'nq_user_stub', 'nq_hud_username', 'nq_cd_v1', 'nq_cd_seen_v1', 'nq_ack_v1', 'nq_nc_last'];
  const THEME_KEYS = ['nq_accent_v1', 'nq_color_main', 'nq_color_left', 'nq_color_head', 'nq_bg_main_v3', 'nq_bg_left_v3', 'nq_logo_white', 'nq_topbar_bg_v1'];
  const themeShared = () => LSget('nq_theme_shared') !== '0';
  const readTheme = () => { const t = {}; THEME_KEYS.forEach(k => { const v = LSget(k); if (v) t[k] = v; }); return t; };
  const writeTheme = (t) => THEME_KEYS.forEach(k => (t && t[k]) ? LSset(k, t[k]) : LSdel(k));
  function swapTheme(owner, u) {
    if (themeShared()) return;
    if (owner) LSset('nq_theme_' + owner, JSON.stringify(readTheme()));
    try { const t = JSON.parse(LSget('nq_theme_' + u) || 'null'); if (t) writeTheme(t); } catch {}
  }
  let petSyncUntil = 0;
  let acctChecked = false;
  let petSettled = true;
  let petWaited = false;
  const unwait = () => {
    if (!root.classList.contains('nq-wait')) return;
    const np = $('#nqNp');
    if ($('#nqFoot') && $('#nqTools') && np && np.dataset.acc && acctChecked && (petSettled || petWaited)) root.classList.remove('nq-wait');
  };
  const cachedAtStart = LSget('nq_hud_username');
  let tabUser = '';
  const staleTab = () => { const o = LSget('nq_owner'); return !!(tabUser && o && o.toLowerCase() !== tabUser.toLowerCase()); };
  function accountGuard() {
    let tries = 0;
    const iv = setInterval(() => {
      let u = '';
      try { u = String(W.appInsightsUserName || '').trim(); } catch {}
      if (!u) { if (++tries > 100) { clearInterval(iv); acctChecked = true; unwait(); } return; }
      clearInterval(iv);
      tabUser = u;
      const owner = LSget('nq_owner') || cachedAtStart;
      noteAccount(u); noteAccount(owner);
      if (owner === u) {
        LSset('nq_owner', u);
        try {
          if (sessionStorage.getItem('nq_theme_check') === u) {
            sessionStorage.removeItem('nq_theme_check');
            const t = !themeShared() && JSON.parse(LSget('nq_theme_' + u) || 'null');
            if (t && THEME_KEYS.some(k => (LSget(k) || '') !== (t[k] || ''))) { writeTheme(t); location.reload(); return; }
          }
        } catch {}
        try {
          if (sessionStorage.getItem('nq_swapped') === u) {
            sessionStorage.removeItem('nq_swapped'); petSyncUntil = Date.now() + 9000; petSettled = false;
            const sync = setInterval(() => { syncPetImg(); if (petSettled || Date.now() > petSyncUntil) { clearInterval(sync); unwait(); } }, 200);
          }
        } catch {}
        acctChecked = true; unwait();
        return;
      }
      try { sessionStorage.setItem('nq_swapped', u); } catch {}
      if (owner) {
        const snap = {};
        ACCT_KEYS.forEach(k => { const v = LSget(k); if (v) snap[k] = v; });
        LSset('nq_acct_' + owner, JSON.stringify(snap));
      }
      swapTheme(owner, u);
      try { sessionStorage.setItem('nq_theme_check', u); } catch {}
      ACCT_KEYS.forEach(LSdel);
      try {
        const saved = JSON.parse(LSget('nq_acct_' + u) || 'null');
        if (saved) Object.keys(saved).forEach(k => LSset(k, saved[k]));
      } catch {}
      LSset('nq_owner', u);
      if (owner) location.reload(); else { acctChecked = true; unwait(); }
    }, 100);
  }
  accountGuard();
  ['visibilitychange', 'focus', 'pageshow', 'storage'].forEach(ev => window.addEventListener(ev, (e) => { if (staleTab()) e.stopImmediatePropagation(); }, true));

  const AUTH_RE = /^\/(log(in|out)[^/]*|loginpage\.phtml|signin|neopass|hub\/login|index\.phtml)(\/|\.|$)/i;
  const isAuth = AUTH_RE.test(location.pathname);
  function stripUi() {
    root.classList.add('nq-auth');
    const st = document.getElementById('nq-auth-css') || document.createElement('style');
    st.id = 'nq-auth-css';
    st.textContent = 'html.nq-auth #nq-host, html.nq-auth #nqHud, html.nq-auth #nqLeftBar, html.nq-auth #btnOverlay, html.nq-auth #nqSideBtnHost, html.nq-auth #nqBgHandle, html.nq-auth #nqBgSidebar, html.nq-auth #qrDockWrap, html.nq-auth #nqScrollTrack, html.nq-auth #nqFoot, html.nq-auth #nqTools, html.nq-auth #nqBell,html.nq-auth #nqNestPop, html.nq-auth #nqNestMenu { display: none !important; }\nhtml.nq-auth, html.nq-auth body { visibility: visible !important; opacity: 1 !important; }';
    if (!st.isConnected) (document.head || root).appendChild(st);
    document.querySelectorAll('style').forEach(el => {
      const t = el.textContent || '';
      if (el === st) return;
      if (['nq-core-layout', 'nq-kill-native', 'nqHudStyle', 'nqRecolorSite', 'nq-frame-resize-style'].includes(el.id) || t.includes('#nqLeftBar') || t.includes('#nqBgHandle')) el.remove();
    });
  }
  function checkLoggedOutHome() {
    if (isNc || isPopup || !/^\/(home(\/(index\.phtml)?)?)?$/i.test(location.pathname)) return;
    const check = () => {
      let u = ''; try { u = String(W.appInsightsUserName || '').trim(); } catch {}
      if (u) return false;
      stripUi();
      return true;
    };
    const run = () => { if (check()) [300, 1000, 2500].forEach(t => setTimeout(stripUi, t)); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true }); else run();
    window.addEventListener('load', () => { check(); }, { once: true });
  }
  checkLoggedOutHome();

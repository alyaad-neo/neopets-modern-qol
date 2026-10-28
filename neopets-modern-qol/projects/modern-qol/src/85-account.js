  function globalListeners() {
    ['mouseenter', 'mouseleave'].forEach(t => document.addEventListener(t, (e) => {
      const id = e.target && e.target.id;
      if (id === 'npActivePet' || id === 'qrDock') e.stopImmediatePropagation();
    }, true));
    document.addEventListener('pointerdown', (e) => {
      if (dockOpen && !e.target.closest('#qrDockWrap, #npActivePet')) setDock(false);
      if (e.target.closest && e.target.closest('#npBgSave')) saving = true;
    }, true);

    document.addEventListener('click', (e) => {
      const pet = e.target.closest && e.target.closest('#qrDock .qrPet');
      if (!pet || e.target.closest('a')) return;
      const on = !pet.classList.contains('nppTap');
      document.querySelectorAll('#qrDock .qrPet.nppTap').forEach(x => x.classList.remove('nppTap'));
      if (on) pet.classList.add('nppTap');
    });
    document.addEventListener('click', async (e) => {
      const a = e.target.closest && e.target.closest('#qrDock .qrOverlay a');
      if (!a || !/make active/i.test(a.textContent) || e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (a.dataset.busy) return;
      a.dataset.busy = '1'; a.textContent = 'Switching…';
      try { await fetch(a.href, { credentials: 'include', cache: 'no-store' }); } catch {}
      ['npqol_qr_data', 'npqol_qr_data_lastFetch', 'npqol_active_pet_img_v1'].forEach(LSdel);
      location.reload();
    }, true);

    document.addEventListener('mousemove', (e) => {
      const col = 240;
      if (tabEl) tabEl.classList.toggle('show', (innerHeight - e.clientY < 44 && e.clientX > col) || !!(panelEl && panelEl.classList.contains('open')));
      if (handleEl) handleEl.classList.toggle('npp-show', innerWidth - e.clientX < 44 && e.clientY > 60);
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      setTimeout(() => { const i = $('#nppTools input'); if (i) i.focus(); }, 40);
    }, true);
  }

  const ACCT_KEYS = ['npqol_bank_state_v2', 'npqol_bank_daily_v1', 'npqol_bank_history_v1', 'npqol_bank_pin_v1',
    'npqol_np_last', 'npqol_qr_data', 'npqol_qr_data_lastFetch', 'npqol_active_pet_img_v1', 'npqol_user_stub', 'npqol_hud_username', 'npp_cd_v1', 'npp_cd_seen_v1', 'npp_ack_v1', 'npp_nc_last'];
  const THEME_KEYS = ['npqol_accent_v1', 'npp_color_main', 'npp_color_left', 'npp_color_head', 'npqol_bg_main_v3', 'npqol_bg_left_v3', 'npp_logo_white', 'npqol_topbar_bg_v1'];
  const themeShared = () => LSget('npp_theme_shared') !== '0';
  const readTheme = () => { const t = {}; THEME_KEYS.forEach(k => { const v = LSget(k); if (v) t[k] = v; }); return t; };
  const writeTheme = (t) => THEME_KEYS.forEach(k => (t && t[k]) ? LSset(k, t[k]) : LSdel(k));
  function swapTheme(owner, u) {
    if (themeShared()) return;
    if (owner) LSset('npp_theme_' + owner, JSON.stringify(readTheme()));
    try { const t = JSON.parse(LSget('npp_theme_' + u) || 'null'); if (t) writeTheme(t); } catch {}
  }
  let petSyncUntil = 0;
  let acctChecked = false;
  let petSettled = true;
  let petWaited = false;
  const unwait = () => {
    if (!root.classList.contains('npp-wait')) return;
    const np = $('#npNp');
    if ($('#nppFoot') && $('#nppTools') && np && np.dataset.acc && acctChecked && (petSettled || petWaited)) root.classList.remove('npp-wait');
  };
  const cachedAtStart = LSget('npqol_hud_username');
  let tabUser = '';
  const staleTab = () => { const o = LSget('npp_owner'); return !!(tabUser && o && o.toLowerCase() !== tabUser.toLowerCase()); };
  function accountGuard() {
    let tries = 0;
    const iv = setInterval(() => {
      let u = '';
      try { u = String(W.appInsightsUserName || '').trim(); } catch {}
      if (!u) { if (++tries > 100) { clearInterval(iv); acctChecked = true; unwait(); } return; }
      clearInterval(iv);
      tabUser = u;
      const owner = LSget('npp_owner') || cachedAtStart;
      noteAccount(u); noteAccount(owner);
      if (owner === u) {
        LSset('npp_owner', u);
        try {
          if (sessionStorage.getItem('npp_theme_check') === u) {
            sessionStorage.removeItem('npp_theme_check');
            const t = !themeShared() && JSON.parse(LSget('npp_theme_' + u) || 'null');
            if (t && THEME_KEYS.some(k => (LSget(k) || '') !== (t[k] || ''))) { writeTheme(t); location.reload(); return; }
          }
        } catch {}
        try {
          if (sessionStorage.getItem('npp_swapped') === u) {
            sessionStorage.removeItem('npp_swapped'); petSyncUntil = Date.now() + 9000; petSettled = false;
            const sync = setInterval(() => { syncPetImg(); if (petSettled || Date.now() > petSyncUntil) { clearInterval(sync); unwait(); } }, 200);
          }
        } catch {}
        acctChecked = true; unwait();
        return;
      }
      try { sessionStorage.setItem('npp_swapped', u); } catch {}
      if (owner) {
        const snap = {};
        ACCT_KEYS.forEach(k => { const v = LSget(k); if (v) snap[k] = v; });
        LSset('npp_acct_' + owner, JSON.stringify(snap));
      }
      swapTheme(owner, u);
      try { sessionStorage.setItem('npp_theme_check', u); } catch {}
      ACCT_KEYS.forEach(LSdel);
      try {
        const saved = JSON.parse(LSget('npp_acct_' + u) || 'null');
        if (saved) Object.keys(saved).forEach(k => LSset(k, saved[k]));
      } catch {}
      LSset('npp_owner', u);
      if (owner) location.reload(); else { acctChecked = true; unwait(); }
    }, 100);
  }
  accountGuard();
  ['visibilitychange', 'focus', 'pageshow', 'storage'].forEach(ev => window.addEventListener(ev, (e) => { if (staleTab()) e.stopImmediatePropagation(); }, true));

  const AUTH_RE = /^\/(log(in|out)[^/]*|loginpage\.phtml|signin|neopass|hub\/login|index\.phtml)(\/|\.|$)/i;
  const isAuth = AUTH_RE.test(location.pathname);
  function stripUi() {
    root.classList.add('npp-auth');
    const st = document.getElementById('npp-auth-css') || document.createElement('style');
    st.id = 'npp-auth-css';
    st.textContent = 'html.npp-auth #npx-host, html.npp-auth #npHud, html.npp-auth #npLeftBar, html.npp-auth #btnOverlay, html.npp-auth #npxSideBtnHost, html.npp-auth #npBgHandle, html.npp-auth #npBgSidebar, html.npp-auth #qrDockWrap, html.npp-auth #npxScrollTrack, html.npp-auth #nppFoot, html.npp-auth #nppTools, html.npp-auth #nppBell,html.npp-auth #nppNestPop, html.npp-auth #nppNestMenu { display: none !important; }\nhtml.npp-auth, html.npp-auth body { visibility: visible !important; opacity: 1 !important; }';
    if (!st.isConnected) (document.head || root).appendChild(st);
    document.querySelectorAll('style').forEach(el => {
      const t = el.textContent || '';
      if (el === st) return;
      if (['np-core-layout', 'np-kill-native', 'npHudStyle', 'npRecolorSite', 'np-frame-resize-style'].includes(el.id) || t.includes('#npLeftBar') || t.includes('#npBgHandle')) el.remove();
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

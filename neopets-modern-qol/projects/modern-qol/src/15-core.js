  if (!/^(www\.|ncmall\.)?neopets\.com$/i.test(location.hostname)) return;

  const NP_RUN_ON_PHONES = false;
  const npIsPhone = () => {
    try {
      const uad = navigator.userAgentData;
      if (uad && typeof uad.mobile === 'boolean') return uad.mobile === true;
    } catch {}
    try {
      return /iPhone|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini|Android.*Mobile/i.test(navigator.userAgent || '');
    } catch { return false; }
  };
  const npBaseOff = () => {
    const p = location.pathname;
    if (p === '/' || p.startsWith('/~') || p.startsWith('/faeriefragments') ||
        p.startsWith('/talesofdacardia') ||
        (p === '/games/game.phtml' && location.search)) return true;
    if (!NP_RUN_ON_PHONES && npIsPhone()){
      let forced = false;
      try { forced = localStorage.getItem('npqol_mobile_v1') === 'on'; } catch {}
      if (!forced) return true;
    }
    return false;
  };
  if (!npBaseOff()) {
    try { document.documentElement.dataset.npModernInterface = '1'; } catch {}
    NQ.base = true;
  }

  const NP_BACKOFF_KEY = 'npqol_403_backoff_until_v1';
  const NP_STRIKE_KEY  = 'npqol_403_strikes_v1';
  const NP_BACKOFF_STEPS_MIN = [10, 30, 60, 120];
  const np403BackoffActive = () => {
    try { return Date.now() < (+localStorage.getItem(NP_BACKOFF_KEY) || 0); } catch { return false; }
  };
  const npNote403 = (res) => {
    if (!res || res.status !== 403) return;
    try {
      const nowMs = Date.now();
      let strikes = 0, lastMs = 0;
      try {
        const raw = JSON.parse(localStorage.getItem(NP_STRIKE_KEY) || 'null');
        if (raw && typeof raw === 'object'){ strikes = +raw.n || 0; lastMs = +raw.t || 0; }
      } catch {}
      if (lastMs && (nowMs - lastMs) > 3 * 60 * 60 * 1000) strikes = 0;
      const mins = NP_BACKOFF_STEPS_MIN[Math.min(strikes, NP_BACKOFF_STEPS_MIN.length - 1)];
      localStorage.setItem(NP_BACKOFF_KEY, String(nowMs + mins * 60 * 1000));
      localStorage.setItem(NP_STRIKE_KEY, JSON.stringify({ n: strikes + 1, t: nowMs }));
    } catch {}
  };
  const npWhenBgAllowed = (fn) => {
    const run = () => { if (np403BackoffActive()) return; try { fn(); } catch {} };
    let hidden = false;
    try { hidden = document.visibilityState === 'hidden'; } catch {}
    if (!hidden){ run(); return; }
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', onVis);
      run();
    };
    document.addEventListener('visibilitychange', onVis);
  };

  const W = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
  const root = document.documentElement;
  const rs = root.style;
  const path = location.pathname.toLowerCase();
  const $ = (s, r = document) => r.querySelector(s);
  const LSget = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
  const LSset = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const LSdel = (k) => { try { localStorage.removeItem(k); } catch {} };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shadow = () => { const h = $('#npx-host'); return h && h.shadowRoot; };

  const SYNC_KEYS = ['npqol_accent_v1', 'npqol_btn_theme_v1', 'npqol_topbar_bg_v1', 'npqol_recolor_site_v1',
    'npqol_bg_main_v3', 'npqol_bg_left_v3', 'npqol_side_btns_v2', 'npqol_side_icon_size_v1',
    'npqol_topbar_custom_v1', 'npqol_bank_btn_settings_v1',
    'npp_color_main', 'npp_color_left', 'npp_color_head', 'npp_defaults_v3'];
  const DATA_KEYS = ['npqol_hud_username', 'npqol_np_last', 'npqol_bank_state_v2', 'npqol_bank_daily_v1', 'npqol_bank_history_v1',
    'npqol_qr_data', 'npqol_active_pet_img_v1', 'npqol_user_stub'];
  const isNc = location.hostname.toLowerCase() === 'ncmall.neopets.com';
  if (typeof GM_getValue === 'function' && typeof GM_setValue === 'function') {
    if (isNc) {
      try { const snap = JSON.parse(GM_getValue('npp_sync', '{}') || '{}'); Object.keys(snap).forEach(k => LSset(k, snap[k])); } catch {}
      LSset('npqol_403_backoff_until_v1', String(Date.now() + 365 * 24 * 3600 * 1000));
      LSset('npqol_recolor_site_v1', '0');
    } else if (/^(www\.)?neopets\.com$/i.test(location.hostname)) {
      const save = () => {
        const o = {};
        SYNC_KEYS.concat(DATA_KEYS).forEach(k => { const v = LSget(k); if (v) o[k] = v; });
        try { GM_setValue('npp_sync', JSON.stringify(o)); } catch {}
      };
      save(); setInterval(save, 8000); window.addEventListener('pagehide', save);
    }
  }

  const K = { mainImg: 'npqol_bg_main_v3', leftImg: 'npqol_bg_left_v3', main: 'npp_color_main', left: 'npp_color_left', head: 'npp_color_head' };
  const NP_ORANGE = '#ff8a1f';
  const DEF = { main: '#ffffff', left: '#2a292e', head: NP_ORANGE };
  const HEAD_ALPHA = 'ed';

  const EYE_OFF = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.2 2.2l11.6 11.6M6.6 6.7A2 2 0 0 0 9.3 9.4M4.1 4.4C2.6 5.4 1.5 8 1.5 8s2.3 4.5 6.5 4.5c1.4 0 2.6-.5 3.6-1.1M7 3.6c.3 0 .7-.1 1-.1 4.2 0 6.5 4.5 6.5 4.5s-.6 1.2-1.8 2.3"/></svg>';
  const CHEV = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M3.5 6.2l4.5 4.5 4.5-4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const COPY = '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5v-1a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1"/></svg>';
  const CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 5"/></svg>';
  const LOGO_URL = 'https://images.neopets.com/themes/h5/basic/images/v3/np-logo-R.svg';
  const EYE = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 8s2.3-4.5 6.5-4.5S14.5 8 14.5 8s-2.3 4.5-6.5 4.5S1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/></svg>';
  const PENCIL = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2.5l2.5 2.5L5.5 13H3v-2.5z"/></svg>';
  const SHUFFLE = '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4.5h2.2c3 0 4 7 7.1 7H14M2 11.5h2.2c1 0 1.8-.6 2.5-1.4M9.3 5.9c.6-.8 1.2-1.4 2.2-1.4H14M12 2.5l2 2-2 2M12 9.5l2 2-2 2"/></svg>';
  const SWAP = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5.5h9.5M10 3l2.5 2.5L10 8M13 10.5H3.5M6 8l-2.5 2.5L6 13"/></svg>';
  const STATS_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M3 13V8.5M8 13V3M13 13V6"/></svg>';

  const isPopup = /popup/.test(path) || (!!window.opener && window.outerWidth < 900);
  let handleEl = null, tabEl = null, panelEl = null, dockOpen = false;

  (function noAdblockPopup() {
    try { sessionStorage.setItem('ta_session_pv', '0'); } catch {}
    const st = document.createElement('style');
    st.id = 'npp-no-adblock-popup';
    st.textContent = '#ta-ab-overlay, .ta-ab-overlay, .ta-ab-modal { display: none !important; visibility: hidden !important; pointer-events: none !important; }';
    (document.head || root).appendChild(st);
    const strip = () => { const o = document.getElementById('ta-ab-overlay'); if (o) o.remove(); };
    const mo = new MutationObserver(strip);
    mo.observe(root, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 90000);
  })();

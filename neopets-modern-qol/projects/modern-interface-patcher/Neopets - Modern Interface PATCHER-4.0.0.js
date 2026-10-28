// ==UserScript==
// @name         Neopets - Modern Interface PATCHER
// @namespace    neopets-qol-patcher
// @version      4.1.35
// @description  Core runtime patches for "Neopets - Modern Interface": header, sidebar, colours, accounts, background picker, pet card.
// @match        *://*.neopets.com/*
// @match        *://ncmall.neopets.com/*
// @run-at       document-start
// @exclude      *://www.neopets.com/
// @exclude      *://www.neopets.com/index.phtml*
// @exclude      *://www.neopets.com/login*
// @exclude      *://www.neopets.com/logout*
// @exclude      *://www.neopets.com/loginpage.phtml*
// @exclude      *://www.neopets.com/signin*
// @exclude      *://www.neopets.com/neopass*
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      pets.neopets.com
// @connect      images.neopets.com
// @connect      impress-2020.openneo.net
// @connect      impress.openneo.net
// @match        *://items.jellyneo.net/*
// ==/UserScript==
(function () {
  'use strict';
  if (window.top !== window) return;
  const POP = 'nppJN';
  if (location.hostname === 'items.jellyneo.net') {
    if (window.name !== POP) return;
    const CSS = `#nppJnCard { position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; background: #fff; color: #1f2937; font: 600 14px/1.35 system-ui, sans-serif; text-align: center; }
#nppJnCard .in { padding: 14px 16px 16px; }
#nppJnCard p { margin: 0; }
#nppJnCard img { display: block; width: 80px; height: 80px; margin: 0 auto 6px; image-rendering: auto; }
#nppJnCard a { color: inherit; text-decoration: none; }
#nppJnCard .price-history-link { display: inline-block; margin-top: 6px; padding: 4px 12px; border-radius: 999px; background: #f3f4f6; font-size: 15px; font-weight: 800; color: #111827; }
#nppJnCard .x { position: fixed; top: 6px; right: 6px; width: 26px; height: 26px; border: 0; border-radius: 50%; background: #f3f4f6; color: #374151; font: 700 16px/26px system-ui, sans-serif; cursor: pointer; padding: 0; }
#nppJnCard .x:hover { background: #e5e7eb; }
html.nppJn, html.nppJn body { overflow: hidden !important; }`;
    let tries = 0;
    const show = () => {
      if (document.getElementById('nppJnCard')) return;
      const img = document.querySelector('img.item-result-image'), res = img && img.closest('p');
      if (!res) { if (++tries < 40) setTimeout(show, 150); return; }
      const st = document.createElement('style'); st.textContent = CSS; (document.head || document.documentElement).appendChild(st);
      const card = document.createElement('div'); card.id = 'nppJnCard';
      const inner = document.createElement('div'); inner.className = 'in';
      inner.appendChild(res.cloneNode(true));
      inner.querySelectorAll('input, label:empty').forEach(n => n.remove());
      inner.querySelectorAll('br').forEach(b => b.replaceWith(document.createElement('div')));
      inner.querySelectorAll('a[href]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
      card.innerHTML = '<button class="x" type="button" title="Close (Esc)">×</button>';
      card.appendChild(inner);
      document.body.appendChild(card);
      document.documentElement.classList.add('nppJn');
      card.querySelector('.x').addEventListener('click', () => window.close());
      try { window.resizeBy(0, inner.offsetHeight + 8 - window.innerHeight); } catch {}
    };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.close(); });
    window.addEventListener('blur', () => window.close());
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show, { once: true }); else show();
    return;
  }
  if (!/^(www\.)?neopets\.com$/i.test(location.hostname)) return;
  let jn = null;
  document.addEventListener('click', (e) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const a = (e.composedPath ? e.composedPath() : [e.target]).find(n => n && n.classList && n.classList.contains('iph-icon--jellyneo') && n.href);
    if (!a) return;
    e.preventDefault(); e.stopPropagation();
    try { if (jn && !jn.closed) jn.close(); } catch {}
    const w = 240, h = 230, x = Math.max(0, Math.round(e.screenX - w / 2)), y = Math.max(0, Math.round(e.screenY + 18));
    jn = window.open(a.href, POP, `popup,width=${w},height=${h},left=${x},top=${y}`);
    if (!jn) window.open(a.href, '_blank', 'noopener');
  }, true);
  const closeJn = () => { try { if (jn && !jn.closed) jn.close(); } catch {} jn = null; };
  window.addEventListener('focus', closeJn);
  document.addEventListener('pointerdown', closeJn, true);
})();

(function () {
  'use strict';

  if (window.top !== window) return;
  if (!/^(www\.|ncmall\.)?neopets\.com$/i.test(location.hostname)) return;

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
    'npqol_bg_main_v3', 'npqol_bg_left_v3', 'npqol_side_btns_v2', 'npqol_side_layout_v1',
    'npqol_side_side_v1', 'npqol_side_shift_v1', 'npqol_side_x_v1', 'npqol_col_offset_v1', 'npqol_side_icon_size_v1',
    'npqol_topbar_custom_v1', 'npqol_user_settings_v1', 'npqol_qr_settings_v1', 'npqol_bank_btn_settings_v1',
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
        try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('npqol_hud_userlookup:')) o[k] = localStorage.getItem(k); } } catch {}
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

  const PAGE_CSS = `
html[data-np-modern-interface] {
  --np-col-width: 240px !important;
  --np-hud-left: 14px !important;
  --np-hud-top: 72px !important;
  --np-bar-inset-left: 0px !important;
  --npp-card: rgba(20,18,28,.42);
  --npp-card-line: rgba(255,255,255,.14);
  --npp-drawer-bg: linear-gradient(var(--npp-card), var(--npp-card)), linear-gradient(rgba(0,0,0,.22), rgba(0,0,0,.22)), var(--npLeftBarImg, none) center / cover no-repeat, var(--npLeftBarSolid, #3a3350);
  --npp-drawer-layers: linear-gradient(var(--npp-card), var(--npp-card)), linear-gradient(rgba(0,0,0,.22), rgba(0,0,0,.22));
  --npp-ico-shadow: drop-shadow(0 2px 3px rgba(0,0,0,.4));

  body, body *:not(:where(i, .fa, .fas, .far, .fab, .fal, .fad, [class*="fa-"], [class*="glyphicon"], [class*="icon-"], [class*="-icon"], [class*="material-icons"], [class*="mdi"], .bi, [class^="bi-"], .dashicons, [class*="ico-"])) { font-family: 'Outfit', system-ui, sans-serif !important; }
  .qrOverlay a, .qrPetName, .bankSettingsHead h3, #npUserTitle, #npBank .title,
  #nppNst { font-family: 'CafeteriaBlack', Georgia, serif !important; }

  .searchForm { margin: 0 !important; }
  div#boardTopic { border: 0 !important; }
  div#superfooter { display: none !important; }
  .container { box-shadow: 0 0 6px rgba(0,0,0,.1); }

  body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) {
    border: none !important;
    margin-left: calc(var(--np-col-width) + (100vw - var(--np-col-width) - var(--np-frame-width, 1100px)) / 2) !important;
  }
  body#neobdy div#main #content { margin-left: 0 !important; }
  @media (max-width: 900px) {
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) { margin-left: auto !important; }
  }

  body > .errorOuter, body > .errorInner, body > .errorMessage {
    position: relative; box-sizing: border-box; width: min(560px, calc(100vw - var(--np-col-width, 240px) - 48px)); max-width: none;
    margin: 120px 24px 40px calc(var(--np-col-width, 240px) + max(24px, (100vw - var(--np-col-width, 240px) - 560px) / 2)) !important;
  }
  @media (max-width: 900px) { body > .errorOuter, body > .errorInner, body > .errorMessage { width: auto; margin: 110px 16px 32px !important; } }

  #npHudResizer, #npxFrameResizeR, #npxFrameResizeB { display: none !important; }

  #npLeftBar { border: 0 !important; box-shadow: 0 0 10px rgba(0,0,0,.4) !important; top: 0 !important; bottom: auto !important; height: 100vh !important; }
  #npHud > #npBank, #npQrActive { display: none !important; }

  #npNp { flex-direction: column !important; align-items: stretch !important; cursor: default !important; }
  #npNp .np-amounts { flex: 1; display: flex; align-items: center; white-space: nowrap; }
  #npNp .np-amount, #npNp .np-nc { display: flex; align-items: center; gap: 5px; text-decoration: none !important; transition: background .15s; }
  #npNp .np-amount img, #npNp .np-nc img { flex: 0 0 auto; }
  #npNp .np-chevron { display: flex; align-items: center; justify-content: center; cursor: pointer; }
  #npNp.np-open .np-chevron { transform: rotate(180deg); }
  #npNp .np-bank-drawer { display: none; background: transparent !important; }
  #npNp.np-open .np-bank-drawer { display: block; }
  #npNp .np-bank-drawer #npBank { border: 0 !important; box-shadow: none !important; backdrop-filter: none !important; background: transparent !important; padding: 8px 0 0 !important; margin: 0 !important; width: 100% !important; }

  #npActivePet { flex: 0 0 auto !important; flex-direction: column !important; align-items: stretch !important; height: auto !important; min-height: 0 !important; max-height: none !important; }
  #npActivePet > img { order: 0; }
  #npPetDockBtn { position: absolute; top: 12px; right: 12px; width: auto; height: 26px; padding: 0 9px; gap: 5px; font: 700 11px/1 'Outfit', system-ui, sans-serif; white-space: nowrap; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 7px; background: rgba(0,0,0,.55); color: #fff; cursor: pointer; opacity: 1; transition: background .14s; z-index: 4; }
  #npPetDockBtn:hover { background: rgba(0,0,0,.75); }
  #nppPetInfo .nppTitle { display: flex; justify-content: center; gap: 6px; font-weight: 700; text-align: center; }
  #nppPetInfo .nppTitle a { color: #fff !important; font-weight: 700; text-decoration: none !important; }
  #nppPetInfo .nppTitle a:hover { text-decoration: underline !important; }
  #nppPetInfo .nppLinks { display: flex; justify-content: center; font-size: 11px; }
  #nppPetInfo .nppCopy { flex: 0 0 auto; padding: 2px; border: 0; background: transparent; cursor: pointer; }
  #nppPetInfo .nppCopy:hover { color: #fff; }
  #nppPetInfo .nppDetails { grid-template-columns: auto 1fr; font-size: 11px; color: rgba(255,255,255,.88); }
  #nppPetInfo .nppDetails span { color: rgba(255,255,255,.55) !important; opacity: 1 !important; font-weight: 400 !important; }
  #nppPetInfo .nppDetails b { color: #fff !important; font-weight: 700 !important; font-size: inherit !important; }
  #nppPetInfo .nppDetails b.gF { color: #ff8fc4 !important; }
  #nppPetInfo .nppDetails b.gM { color: #6db3ff !important; }
  #nppPetInfo { order: 2; position: relative; }

  #qrDockWrap { overflow-y: auto !important; overflow-x: hidden !important; }
  #qrDockWrap.open { top: 62px !important; }
  #qrDock { overflow-y: auto !important; overflow-x: hidden !important; min-height: 100% !important; height: auto !important; }
  .qrPet { min-height: 50px !important; flex: 1 1 50px !important; }

  #nppFoot { position: fixed; left: 0; bottom: 0; width: var(--np-col-width); box-sizing: border-box; padding: 0 14px 12px; display: flex; flex-direction: column; gap: 8px; z-index: 1000; }

  #btnOverlay[data-mode="single"] .col.left { left: 239px !important; top: auto !important; bottom: calc(16px + var(--npp-tools-h, 0px) + var(--npp-ig, 10px)) !important; transform: translate(-50%, var(--np-side-col-shift, 0px)) !important; }
  #btnOverlay .col.right { position: fixed !important; left: calc(var(--np-col-width) - 24px) !important; top: auto !important; bottom: 16px !important; transform: translateY(var(--np-side-col-shift, 0px)) !important; }

  #npBgSidebar { top: 0 !important; height: 100vh !important; box-sizing: border-box !important; padding-top: 0 !important; z-index: 2100 !important; background: #1a1722 !important; border-left: 1px solid rgba(255,255,255,.14); box-shadow: -4px 0 32px rgba(0,0,0,.12) !important; }
  #npBgHandle { top: calc(60px + (100vh - 60px - 44px) / 2) !important; width: 16px !important; height: 44px !important; font-size: 0 !important; opacity: 0; transition: opacity .15s, background .12s !important; }
  #npBgHandle.npp-show, #npBgHandle:hover { opacity: 1; }
  #npBgHandle svg { width: 12px; height: 12px; transform: rotate(90deg); }
  #nppColors { display: flex; flex-direction: column; margin: 0 0 10px; }
  #nppColors input[type="color"] { width: 36px; height: 26px; padding: 2px; border: 1px solid rgba(255,255,255,.3); border-radius: 6px; background: none; cursor: pointer; }
  #nppColors button { padding: 4px 8px; border: 1px solid rgba(255,255,255,.2); border-radius: 6px; color: #fff; font-size: 11px; cursor: pointer; }

  #npBgBody { color: #fff; }
  #npBgSidebar .npSmall { color: rgba(255,255,255,.92); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
  #npBgSidebar .npThemeSelect { height: 36px; font-size: 13px; background-color: rgba(255,255,255,.1); border-color: rgba(255,255,255,.3); color: #fff; }
  #npBgSidebar .npThemeSelect:hover { background-color: rgba(255,255,255,.16); }
  #npBgSidebar .npRecolorBtn:not(.isOn) { color: #fff; background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.3); }
  #npBgSidebar .npOptRow { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.22); }
  #npBgSidebar .npOptText { color: #fff; font-size: 12.5px; }
  #npBgSidebar .npOptText small { color: rgba(255,255,255,.74); font-size: 11px; }
  #nppColors .nppRow { color: rgba(255,255,255,.95); }
  #nppColors button { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.3); }
  #nppColors button:hover { background: rgba(255,255,255,.22); }
  #npBgSidebar .npBgSearch input { height: 32px; font-size: 13px; background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.3); }
  #npBgSidebar .npBgSearch input::placeholder { color: rgba(255,255,255,.62); }
  #npBgSidebar .npBgSearch button { height: 32px; background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.3); }
  #nppShuffle { display: flex; align-items: center; justify-content: center; }
  #nppShuffle.busy { background: var(--np-accent, #fff) !important; color: var(--npp-accent-fg, #1a1330) !important; border-color: transparent !important; }
  #nppShuffle.busy svg { animation: nppSpin .7s linear infinite; }
  #npBgList { transition: opacity .2s; }
  #npBgList.nppFetching { opacity: .35; pointer-events: none; }
  #npBgList .nppRowIn { animation: nppRowIn .38s cubic-bezier(.22, 1, .36, 1) both; animation-delay: calc(var(--i, 0) * 30ms); }
  #nppDiscBar.loading { position: relative; overflow: hidden; padding-bottom: 7px; }
  #nppDiscBar.loading #nppDiscMsg { animation: nppPulse 1s ease-in-out infinite; }
  #nppDiscBar.loading::after { content: ""; position: absolute; left: 0; bottom: 0; width: 38%; height: 3px; border-radius: 2px; background: var(--np-accent, #fff); animation: nppSlide 1s ease-in-out infinite; }
  #npBgBody > #nppDiscBar { order: 6; display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: -6px; padding: 0 2px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,.8); }
  #nppDiscBar[hidden] { display: none !important; }
  #nppShuffle svg { display: block; }
  #npBgSidebar .npBgItem { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.16); }
  #npBgSidebar .npBgName { color: #fff; font-size: 12px; font-weight: 600; }
  #npBgSidebar .npBgBtn { background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.3); }
  #npBgSidebar .npBgBtn:hover { background: rgba(255,255,255,.26); filter: none; }
  #npBgSidebar #npBgFooter { background: rgba(0,0,0,.28); border-top-color: rgba(255,255,255,.18); }
  #npBgSidebar .npFooterBtn { font-size: 13px; background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.34); }
  #npBgSidebar .npFooterBtn:hover { background: rgba(255,255,255,.2); filter: none; }
  #npBgSidebar .npFooterBtn.primary { background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1330); border-color: transparent; text-shadow: var(--npp-accent-fg-shadow, none); }
  #npBgSidebar .npFooterBtn.primary:hover { filter: brightness(1.06); }

  #npBgBody { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px 10px; align-content: start; padding: 14px; }
  #npBgBody > * { grid-column: 1 / -1; margin: 0; min-width: 0; }
  #npBgBody > .npThemeBlock { grid-column: auto; }
  #npBgBody > #nppColors { order: 4; }
  #npBgBody > .npBgSearch { order: 5; }
  #npBgBody > #npBgList { order: 7; margin-top: -4px; gap: 6px; max-height: clamp(260px, 52vh, 560px); overflow-y: auto; overscroll-behavior: contain; padding: 6px; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; background: rgba(255,255,255,.03); scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.3) transparent; }
  #npBgList::-webkit-scrollbar { width: 8px; }
  #npBgList::-webkit-scrollbar-thumb { background: rgba(255,255,255,.3); border-radius: 4px; }
  #npBgSidebar .npRecolorBtn { display: flex; align-items: center; justify-content: space-between; gap: 10px; height: auto; min-height: 42px; padding: 8px 12px 8px 14px; text-align: left; font-size: 17px; font-weight: 600; }
  #npBgSidebar .npRecolorBtn::after { content: 'OFF'; font: 700 10px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; padding: 5px 9px; border-radius: 999px; background: rgba(255,255,255,.16); color: rgba(255,255,255,.88); text-shadow: none; }
  #npBgSidebar .npRecolorBtn.isOn { color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.5), 0 0 0 rgba(0,0,0,.35); }
  #npBgSidebar .npRecolorBtn.isOn::after { content: 'ON'; background: #22b45a; color: #fff; text-shadow: 0 1px 1px rgba(0,0,0,.25); box-shadow: 0 1px 4px rgba(0,0,0,.25); }
  #nppColors { padding: 12px 14px; gap: 10px; text-align: left; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; background: rgba(255,255,255,.04); }
  #nppColors .nppPresets { display: flex; gap: 6px; flex-wrap: wrap; }
  #nppColors .nppPresets button { flex: 1 1 auto; padding: 5px 8px; border: 1px solid rgba(255,255,255,.3); border-radius: 8px; background: rgba(255,255,255,.1); color: #fff; font-size: 11px; font-weight: 600; cursor: pointer; }
  #nppColors .nppPresets button:hover { background: rgba(255,255,255,.2); }
  #nppColors .npSmall { margin: 0 0 2px; text-align: left; }
  #nppColors .nppRow { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center; gap: 12px; font-size: 13px; font-weight: 600; text-align: left; }
  #nppColors .nppRow input[type="color"] { order: 1; width: 44px; height: 30px; padding: 3px; border: 1px solid rgba(255,255,255,.3); border-radius: 9px; background: rgba(255,255,255,.08); cursor: pointer; }
  #nppColors .nppRow span { order: 2; flex: none; }
  #nppColors .nppRow button { order: 3; padding: 5px 11px; border: 1px solid rgba(255,255,255,.24); border-radius: 8px; background: transparent; color: rgba(255,255,255,.85); font-size: 11px; font-weight: 600; }
  #nppColors .nppRow button:hover { background: rgba(255,255,255,.16); color: #fff; }
  #nppColors .nppShareRow { display: flex; align-items: center; gap: 10px; margin-top: 2px; padding: 8px 2px 2px; border-top: 1px solid rgba(255,255,255,.12); cursor: pointer; font-size: 13px; font-weight: 600; color: rgba(255,255,255,.9); text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6); }
  #nppColors .nppShareRow input { width: 16px; height: 16px; margin: 0; accent-color: var(--np-accent, #fff); cursor: pointer; }
  #nppColors .nppLogoDot { order: 1; display: block; width: 44px; height: 30px; box-sizing: border-box; border: 1px solid rgba(255,255,255,.3); border-radius: 9px; background: #111; }
  #nppColors .nppLogoRow[data-logo="1"] .nppLogoDot { background: #fff; }
  #nppColors .nppLogoRow span { order: 2; }
  #nppColors .nppLogoRow .nppSeg { order: 3; display: inline-flex; padding: 2px; border: 1px solid rgba(255,255,255,.3); border-radius: 999px; background: rgba(255,255,255,.08); }
  #nppColors .nppLogoRow .nppSeg button { order: 0; padding: 4px 13px; border: 0; border-radius: 999px; background: transparent; color: rgba(255,255,255,.85); font-size: 11px; font-weight: 600; }
  #nppColors .nppLogoRow .nppSeg button:hover { background: rgba(255,255,255,.16); color: #fff; }
  #nppColors .nppLogoRow .nppSeg button.on { background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1330); text-shadow: var(--npp-accent-fg-shadow, none); }
  #nppColors input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
  #nppColors input[type="color"]::-webkit-color-swatch { border: 0; border-radius: 6px; }
  #nppColors input[type="color"]::-moz-color-swatch { border: 0; border-radius: 6px; }
  #npBgSidebar .npBgSearch { padding: 0; }
  #npBgSidebar .npBgItem { grid-template-columns: 48px minmax(0, 1fr) auto auto; gap: 6px; padding: 5px 8px; }
  #npBgSidebar .npBgThumb { width: 48px; height: 48px; }
  #npBgSidebar #npBgFooter { padding: 12px 14px; gap: 10px; }

  #npUser, #npNp, #npActivePet, #nppDaily {
    background: var(--npp-card) !important;
    border: 1px solid var(--npp-card-line) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    backdrop-filter: blur(10px) !important;
    box-shadow: none !important;
  }
  #npUser:hover, #npNp:hover, #npActivePet:hover { border-color: rgba(255,255,255,.26) !important; }

  #npHud { left: calc(var(--np-hud-left, 14px) + 6px); width: calc(var(--np-col-width, 240px) - 2 * (var(--np-hud-left, 14px) + 6px)); }
  #nppFoot { padding-left: calc(var(--np-hud-left, 14px) + 6px); padding-right: calc(var(--np-hud-left, 14px) + 6px); }

  #npHud, #nppFoot { text-shadow: 0 1px 3px rgba(0,0,0,.8); }

  #npUserTitle { color: #fff !important; text-shadow: 0 2px 6px rgba(0,0,0,.7) !important; }
  #npUser .meta .k { opacity: .85 !important; }
  #npUserGear, #npUserRefresh, #npUser .shieldSlot, #npUser .avatarSlot, #npUser .meta, #npUser .spinner { display: none !important; }
  #npUser { min-height: 0 !important; }
  #nppAcctTab { display: none !important; }
  #npUser .rightSide { display: grid !important; width: 100%; }
  #npUser .name { max-width: 100%; text-align: left !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
  #npUserTitle { font-size: 24px !important; }

  #npNp .np-amount, #npNp .np-nc { font-weight: 800 !important; color: #fff !important; }
  #npNp .np-amount:hover, #npNp .np-nc:hover { background: rgba(255,255,255,.2) !important; }
  #npNp .np-chevron { background: none !important; border: 0 !important; }
  #npNp .np-chevron:hover { opacity: .75; }
  #npNp .np-amounts { gap: 10px; min-width: 0; }
  #npNp .npVal, #npNp .ncVal { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #npBank .bankCustomForm .ok, .bankSettingsFoot .npBtn.save { color: var(--npp-accent-fg, #1a1330); }
  #npNp .np-amount, #npNp .np-nc { position: relative; box-sizing: border-box; min-height: 24px; flex: 0 1 auto; min-width: 0; padding: 2px 7px 2px 14px !important; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; background: rgba(255,255,255,.12); font-size: 13px !important; }
  #npNp .np-amount:hover, #npNp .np-nc:hover { border-color: rgba(255,255,255,.4); }
  #npNp .np-amount img, #npNp .np-nc img { position: absolute; left: -6px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; filter: drop-shadow(0 1px 2px rgba(0,0,0,.5)); }
  #npNp .bankGraph text { fill: rgba(255,255,255,.85); }
  #npNp #npBank .msg { opacity: .9; }
  #npNp #npBank .npBtn { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.28); }
  #npNp #npBank .npBtn:hover { background: rgba(255,255,255,.2); }

  #nppPetInfo .nppTitle { font-size: 14px !important; flex-wrap: nowrap; align-items: flex-start !important; line-height: 1.2; }
  #nppPetInfo .nppTitle a { display: block; flex: 1 1 auto; text-align: center; text-shadow: 0 1px 3px rgba(0,0,0,.7); min-width: 0; }
  #nppPetInfo .nppName { display: block; font-family: 'CafeteriaBlack', Georgia, serif !important; font-size: 22px; font-weight: 400; line-height: 1.1; letter-spacing: .02em; overflow-wrap: anywhere; padding: 0 24px; }
  #nppPetInfo .nppSub { display: block; margin-top: 2px; font-size: 11.5px; font-weight: 500; line-height: 1.25; color: rgba(255,255,255,.82); }
  #nppPetInfo .nppTitle .nppCopy { position: absolute; top: 0; right: 0; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border-radius: 7px; transition: background .15s, color .15s, transform .1s; }
  #nppPetInfo .nppTitle .nppCopy svg { width: 14px; height: 14px; display: block; }
  #nppPetInfo .nppTitle .nppCopy:hover { background: rgba(255,255,255,.16); color: #fff; }
  #nppPetInfo .nppTitle .nppCopy:active { transform: scale(.86); }
  #nppPetInfo .nppTitle .nppCopy.done { background: rgba(123,224,142,.22); color: #7be08e; animation: nppCopyPop .35s cubic-bezier(.3,1.6,.5,1); }
  #nppPetInfo .nppTitle .nppCopy.fail { background: rgba(255,90,90,.22); color: #ff8a8a; font-size: 18px; line-height: 1; animation: nppCopyPop .35s cubic-bezier(.3,1.6,.5,1); }
  #nppPetInfo .nppTitle a .nppG.gF { color: #ffa6d2 !important; }
  #nppPetInfo .nppTitle a .nppG.gM { color: #8cc4ff !important; }
  #nppPetInfo .nppCopy { color: rgba(255,255,255,.85) !important; }

  #nppPetInfo .nppLinks { gap: 5px !important; margin-top: 6px !important; }
  #nppPetInfo .nppLinks a { flex: 1; text-align: center; display: flex; align-items: center; justify-content: center; padding: 5px 4px; color: #fff !important; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); border-radius: 999px; text-decoration: none !important; }
  #nppPetInfo .nppLinks a:hover { background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1330) !important; text-shadow: var(--npp-accent-fg-shadow, none); text-decoration: none !important; }
  #nppPetInfo .nppLinks a svg, #nppPetInfo .nppLinks button svg { width: 16px; height: 16px; display: block; }
  #nppPetInfo .nppLinks button { flex: 1; display: flex; align-items: center; justify-content: center; padding: 5px 4px; color: #fff; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); border-radius: 999px; cursor: pointer; transition: background .15s, color .15s; }
  #nppPetInfo .nppLinks button:hover { background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1330); }
  #nppPetInfo .nppLinks button.on { background: rgba(255,255,255,.3); }
  #nppPetInfo .nppLinks button.on:hover { background: var(--np-accent, #fff); }

  #nppPetInfo .nppDetails { display: flex !important; flex-direction: column; gap: 2px !important; margin-top: 6px !important; }
  #nppPetInfo .nppStat { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 2px 9px; border-radius: 7px; background: rgba(255,255,255,.07); font-size: 11.5px; line-height: 1.3; }
  #nppPetInfo .nppStat:nth-child(even) { background: rgba(255,255,255,.12); }
  #nppPetInfo .nppDetails .nppStat span { color: rgba(255,255,255,.78) !important; font-weight: 500 !important; white-space: nowrap; }
  #nppPetInfo .nppDetails .nppStat b { color: #fff !important; font-weight: 700 !important; text-align: right; min-width: 0; }
  #nppPetInfo .nppDetails .nppStat b.gF { color: #ffa6d2 !important; }
  #nppPetInfo .nppDetails .nppStat b.gM { color: #8cc4ff !important; }

  #nppPetInfo .nppStats { margin-top: 8px; }
  #nppPetInfo .nppStatsHead { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; border: 1px solid rgba(255,255,255,.22); border-radius: 9px; background: rgba(255,255,255,.12); color: #fff; cursor: pointer; text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6); transition: background .15s; }
  #nppPetInfo .nppStatsHead:hover { background: rgba(255,255,255,.2); }
  #nppPetInfo .nppStatsHead span { font: 600 12.5px/1.2 'Outfit', system-ui, sans-serif !important; color: #fff !important; }
  #nppPetInfo .nppStatsHead svg { width: 12px; height: 12px; flex: none; transition: transform .25s cubic-bezier(.22, 1, .36, 1); }
  #nppPetInfo .nppStats.open .nppStatsHead svg { transform: rotate(180deg); }
  #nppPetInfo .nppStatsBody { max-height: 0; opacity: 0; margin-top: 0; overflow: hidden; transition: max-height .3s cubic-bezier(.22, 1, .36, 1), opacity .2s ease, margin-top .3s ease; }
  #nppPetInfo .nppStats.open .nppStatsBody { max-height: 240px; opacity: 1; margin-top: 6px; }
  #nppPetInfo .nppStatsBody .nppDetails { margin-top: 0 !important; }
  #nppPetInfo .nppChips { position: absolute; left: 8px; right: 8px; bottom: calc(100% + 16px); margin: 0; display: flex; flex-wrap: nowrap; justify-content: flex-start; gap: 5px; pointer-events: none; z-index: 2; }
  #nppPetInfo .nppChip { padding: 3px 9px; border-radius: 999px; background: rgba(18,16,26,.6); border: 1px solid rgba(255,255,255,.22); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); color: #fff; font-size: 11.5px; font-weight: 600; line-height: 1.3; white-space: nowrap; text-shadow: none; }
  #nppPetInfo .nppChip.gF { color: #ffa6d2; }
  #nppPetInfo .nppChip.gM { color: #8cc4ff; }

  #nppTools .nppSearch button img { width: calc(var(--npp-ic) * .85) !important; height: calc(var(--npp-ic) * .85) !important; object-fit: contain !important; filter: var(--npp-ico-shadow) !important; }
  #btnOverlay .col [data-npp-nested] { display: none !important; }
  #btnOverlay .col.left { gap: 6px !important; row-gap: 6px !important; }
  #btnOverlay .col.left > * { margin-top: 0 !important; margin-bottom: 0 !important; }
  #nppNestPop { position: fixed !important; z-index: 1003; display: flex !important; flex-direction: row !important; align-items: center; gap: calc(var(--npp-ig, 10px) + 18px) !important; width: auto !important; height: auto !important; margin: 0 !important; padding: 4px 8px 4px calc(var(--npp-ig, 10px) + 18px) !important; right: auto !important; bottom: auto !important; background: none !important; border: 0 !important; box-shadow: none !important; opacity: 0; transform: translateY(-50%) translateX(-8px) !important; pointer-events: none !important; transition: opacity .15s ease, transform .24s cubic-bezier(.22, 1, .36, 1); }
  #nppNestPop.open { opacity: 1; transform: translateY(-50%) !important; pointer-events: auto !important; }
  #nppNestPop.open .col > * { animation: nppNestIn .28s cubic-bezier(.22, 1, .36, 1) both; animation-delay: calc(var(--i, 0) * 50ms); }
  #nppNestMenu { -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); position: fixed; z-index: 1004; min-width: 210px; padding: 6px; border: 1px solid var(--npp-card-line); border-radius: 14px; background: var(--npp-drawer-bg); box-shadow: 0 4px 14px rgba(0,0,0,.10); opacity: 0; transform: scale(.96); transform-origin: left top; pointer-events: none; transition: opacity .12s, transform .16s; }
  #nppNestMenu.open { opacity: 1; transform: none; pointer-events: auto; }
  #nppNestMenu button { display: block; width: 100%; padding: 8px 12px; border: 0; border-radius: 9px; background: transparent; color: #fff; text-align: left; font: 600 13px 'Outfit', system-ui, sans-serif; text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6); cursor: pointer; }
  #nppNestMenu button:hover { background: rgba(255,255,255,.14); }

  &.npp-shop-lock .shop-bg { cursor: not-allowed !important; opacity: .6; transition: opacity .3s; }
  .nppBigPrice { font-size: 1.7em !important; font-weight: 800 !important; line-height: 1.1; color: #9900b3 !important; }

  #btnOverlay .iconBtn { padding: 6px !important; margin: -6px !important; }
  #nppTools .nppSearch button { min-width: 36px; min-height: 36px; }
  .nppGrpHead { margin: 6px 4px 2px; font: 700 10px/1 'Outfit', system-ui, sans-serif; letter-spacing: .09em; text-transform: uppercase; color: rgba(255,255,255,.6); }
  .nppGrpHead:first-child { margin-top: 0; }
  #nppTop { position: fixed; right: 24px; bottom: 20px; z-index: 2150; width: 42px; height: 42px; border-radius: 50%; border: 1px solid rgba(255,255,255,.3); background: var(--npp-card, rgba(20,18,28,.7)); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .2s ease, background .15s; box-shadow: 0 4px 14px rgba(0,0,0,.3); }
  #nppTop.on { opacity: 1; pointer-events: auto; }
  #nppTop:hover { background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1330); }
  #nppTop svg { width: 18px; height: 18px; }
  .nppFold { position: absolute; top: 6px; left: 6px; z-index: 5; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 7px; background: rgba(0,0,0,.45); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: .7; transition: opacity .15s; }
  .nppFold:hover { opacity: 1; }
  #nppDaily > .nppFold.nppEye { left: auto; right: 4px; top: 4px; width: 22px; height: 22px; border-radius: 50%; background: rgba(14,42,68,.22); color: #0e2a44; opacity: .55; }
  #nppDaily > .nppFold.nppEye:hover { opacity: 1; background: rgba(14,42,68,.35); }
  #nppDaily > .nppFold.nppEye svg { width: 13px; height: 13px; }
  #nppDaily.nppFolded > .nppFold.nppEye { background: rgba(255,255,255,.2); color: #fff; }
  .nppFold svg { width: 12px; height: 12px; transition: transform .2s ease; }
  .nppFold.up svg { transform: rotate(180deg); }
  #npNp.nppFolded > :not(.nppFold), #npActivePet.nppFolded > :not(.nppFold), #nppDaily.nppFolded > :not(.nppFold) { display: none !important; }
  #npNp.nppFolded, #npActivePet.nppFolded, #nppDaily.nppFolded { height: 36px !important; min-height: 36px !important; padding: 0 !important; overflow: hidden !important; }

  #nppTools { position: fixed; right: calc(14px + var(--npp-ic, 44px) + var(--npp-ig, 10px)); top: var(--npp-tools-top, 27px); transform: translateY(-50%); z-index: 2010; display: flex; flex-direction: row; align-items: center; gap: var(--npp-ig, 10px); transition: opacity .25s ease; }
  #nppTools .nppSep { display: none; }
  #nppTools .nppSearch { position: relative; width: var(--npp-ic, 44px); height: var(--npp-ic, 44px); margin: 0; transition: width .25s ease, height .25s ease; }
  #nppTools .nppSearch button { position: absolute; z-index: 2; left: 0; top: 0; width: var(--npp-ic, 44px); height: var(--npp-ic, 44px); padding: 0; display: flex; align-items: center; justify-content: center; border: 0; background: transparent; cursor: pointer; transition: width .25s ease, height .25s ease; }
  #nppTools .nppSearch button img { display: block; transition: transform .2s cubic-bezier(.3, 1.4, .5, 1), width .25s ease, height .25s ease; }
  #nppTools .nppSearch.noimg::before, #nppTools .nppSearch button.noimg::before { content: "⌕"; font-size: 24px; color: #fff; }
  #nppTools .nppSearch input { position: absolute; z-index: 1; right: 0; top: 50%; transform: translateY(-50%); box-sizing: border-box; width: var(--npp-ic, 44px); height: calc(var(--npp-ic, 44px) * .8); padding: 0 calc(var(--npp-ic, 44px) + 6px) 0 16px; border: 1px solid transparent; border-radius: 999px; background: transparent; color: #fff; font: 400 17px 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .02em; text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6); outline: 0; cursor: pointer; transition: width .42s cubic-bezier(.22, 1, .36, 1), background .25s, border-color .25s, box-shadow .25s; }
  #nppTools .nppSearch.nppOpen input { width: 252px; cursor: text; border-color: var(--npp-card-line); background: var(--npp-drawer-bg); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); box-shadow: 0 4px 14px rgba(0,0,0,.10); }
  #nppTools .nppSearch input:focus { border-color: var(--np-accent, #fff); }
  #nppTools .nppSearch input::placeholder { color: rgba(255,255,255,.75); opacity: 0; transition: opacity .12s; }
  #nppTools .nppSearch.nppOpen input::placeholder { opacity: 1; transition: opacity .3s .2s; }
  &.npp-wait #nppTools, &.npp-wait #nppBell { opacity: 0 !important; pointer-events: none; }
  #nppBell { position: fixed; right: 14px; top: var(--npp-tools-top, 27px); transform: translateY(-50%); z-index: 2010; width: var(--npp-ic, 44px); height: var(--npp-ic, 44px); display: flex; align-items: center; justify-content: center; }
  #nppBell .nav-bell-icon__2020 { position: relative !important; inset: auto !important; margin: 0 !important; width: calc(var(--npp-ic, 44px) * .85) !important; height: calc(var(--npp-ic, 44px) * .85) !important; background-size: contain !important; background-position: center !important; background-repeat: no-repeat !important; cursor: pointer; }
  #nppBell #navnewsdropdown__2020 { position: fixed !important; top: calc(var(--npp-header-h, 54px) + 8px) !important; right: 10px !important; left: auto !important; bottom: auto !important; z-index: 2100 !important; }
  #nppBell > img { width: calc(var(--npp-ic, 44px) * .85); height: calc(var(--npp-ic, 44px) * .85); object-fit: contain; filter: var(--npp-ico-shadow); }
  #nppBell .nppBellDot { position: absolute; top: 2px; right: 2px; width: 12px; height: 12px; border-radius: 50%; background: #ff3b3b; box-shadow: 0 0 0 2px rgba(255,255,255,.92); }

  #nppBottom { display: flex; align-items: center; justify-content: center; min-height: 30px; }
  #nppNst { display: inline-block; padding: 0; font-size: 20px !important; color: #fff !important; background: none !important; border: 0 !important; font-variant-numeric: tabular-nums; white-space: nowrap; }

  #npLeftBarBg { background-image: none !important; overflow: hidden; }
  &[data-npp-bar="none"] #npLeftBarBg::after { top: 0; }
  #npLeftBarBg::before { content: ""; position: absolute; inset: -30px; background: var(--npLeftBarImg) center / cover no-repeat; filter: blur(14px) saturate(1.12); }
  #npLeftBarBg::after { content: ""; position: absolute; left: 0; right: 0; top: 60px; aspect-ratio: 4 / 3; background: var(--npLeftBarImg) center / cover no-repeat; -webkit-mask-image: linear-gradient(to bottom, #000 62%, transparent 100%); mask-image: linear-gradient(to bottom, #000 62%, transparent 100%); }

  #npHud, #nppFoot, #btnOverlay { transition: opacity .25s ease; }
  &.npp-wait #npHud, &.npp-wait #nppFoot, &.npp-wait #btnOverlay { opacity: 0 !important; pointer-events: none; }

  &.npp-reg4 .content { margin: 0 !important; padding: 0 !important; background: transparent !important; }
  &.npp-home body .inner-body { margin-left: 0 !important; margin-right: 0 !important; padding-top: 0 !important; }
  &.npp-home body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner),
  &.npp-home body :is(.container, .theme-bg) {
    background: transparent !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; padding-top: 0 !important;
  }
  &.npp-home body #container__2020, &.npp-home body #container__2020.theme-bg { background: transparent !important; box-shadow: none !important; }
  &.npp-home { --np-top-offset: 0px !important; --np-bottom-spacer: 0px !important; }
  &.npp-home body::after { display: none !important; }

  &.npp-nc { --np-col-width: 0px !important; }
  &.npp-nc #npHud, &.npp-nc #npLeftBar, &.npp-nc #btnOverlay, &.npp-nc #npxSideBtnHost, &.npp-nc #qrDockWrap, &.npp-nc #nppFoot,
  &.npp-nc #npHudResizer, &.npp-nc #npBgHandle, &.npp-nc #npBgSidebar { display: none !important; }
  &.npp-nc body #container__2020 { max-width: var(--np-frame-width) !important; }
  &.npp-nc body :is(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) :is(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) {
    width: auto !important; max-width: none !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important;
    border: 0 !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important;
  }

  &.npp-popup { background: #fff !important; }
  &.npp-popup::before { display: none !important; }
  &.npp-popup #npx-host, &.npp-popup #npHud, &.npp-popup #npLeftBar, &.npp-popup #btnOverlay,
  &.npp-popup #npxSideBtnHost, &.npp-popup #npBgHandle, &.npp-popup #npBgSidebar, &.npp-popup #nppFoot,
  &.npp-popup #qrDockWrap, &.npp-popup #npxScrollTrack, &.npp-popup #nppBell { display: none !important; }
  &.npp-popup body { background: #fff !important; }
  &.npp-popup body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) {
    width: auto !important; max-width: none !important; min-height: 0 !important; margin: 0 !important; padding: 8px !important; border: 0 !important; border-radius: 0 !important;
  }
  html[data-np-modern-interface] .tp-border-frame a[href*="criteria=id"] {
    position: relative !important;
    z-index: 1 !important;
    display: block !important;
    margin: 10px 0 14px !important;
    clear: both !important;
  }
}

html[data-np-modern-interface] body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) {
  padding-top: 100px !important;
}
html[data-np-modern-interface] body .container.theme-bg,
html[data-np-modern-interface]:not(.np-keep-native-bg) body #container__2020.theme-bg,
html[data-np-modern-interface]:not(.np-keep-native-bg) body .container,
html[data-np-modern-interface]:not(.np-keep-native-bg) body .theme-bg {
  padding-top: 0 !important;
}
@font-face {
  font-family: 'CafeteriaBlack';
  src: url('https://images.neopets.com/js/fonts/cafeteria-black.otf') format('opentype');
  font-display: swap;
}
@keyframes nppIn { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes nppSpin { to { transform: rotate(360deg); } }
@keyframes nppCopyPop { 0% { transform: scale(.6); } 100% { transform: scale(1); } }
@keyframes nppFlash { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .2; transform: scale(.7); } }
@keyframes nppNestIn { from { opacity: 0; transform: translateX(-12px) scale(.88); } to { opacity: 1; transform: none; } }
@keyframes nppRowIn { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes nppSlide { from { transform: translateX(-110%); } to { transform: translateX(260%); } }
@keyframes nppPulse { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes nppBellHalo { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,59,59,.65); } 50% { box-shadow: 0 0 0 9px rgba(255,59,59,0); } }`;

  const LAYOUT_CSS = `
html[data-np-modern-interface] {
  --npp-drawer-w: min(320px, 88vw);

  #npHud { position: fixed !important; top: var(--np-hud-top, 72px) !important; bottom: 0 !important; height: auto !important; max-height: none !important; display: flex !important; flex-direction: column !important; overflow-x: hidden !important; overflow-y: auto !important; overscroll-behavior: contain; box-sizing: border-box; scrollbar-width: thin !important; scrollbar-color: rgba(255,255,255,.28) transparent; }
  #npHud::-webkit-scrollbar { display: block; width: 6px; }
  #npHud::-webkit-scrollbar-thumb { background: rgba(255,255,255,.28); border-radius: 3px; }
  #npHud > * { flex: 0 0 auto !important; min-width: 0; }
  #npHud > #nppFoot { position: static !important; width: auto !important; z-index: auto; display: flex; flex-direction: column; gap: 8px; }

  #nppNavMod { box-sizing: border-box; border-radius: 14px; background: var(--npp-card); border: 1px solid var(--npp-card-line); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
  #nppIcons { position: relative; box-sizing: border-box; margin-top: auto !important; padding: 6px 0 0; background: none; border: 0; }
  #nppIcons:not(:has(.col > *)) { display: none; }
  #nppNavMod .nppNavHead { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 9px 12px; border: 0; background: transparent; color: #fff; font: 700 12px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; text-shadow: inherit; }
  #nppNavMod .nppNavHead svg { width: 12px; height: 12px; transition: transform .2s; }
  #nppNavMod .nppNavGrp.open .nppNavHead svg { transform: rotate(180deg); }
  #nppIcons .nppIcHead { display: none; }
  #nppIcons .nppIcBody, #nppIcons.nppShut .nppIcBody { display: block; padding: 0; }
  #nppIcons #btnOverlay { position: static !important; inset: auto !important; width: auto !important; height: auto !important; transform: none !important; z-index: auto !important; pointer-events: auto !important; opacity: 1 !important; overflow: visible !important; }
  #nppIcons #btnOverlay .col, #nppIcons #btnOverlay .col.left, #nppIcons #btnOverlay .col.right { position: static !important; inset: auto !important; transform: none !important; width: auto !important; height: auto !important; margin: 0 !important; display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; justify-content: center !important; align-items: center !important; gap: 10px !important; row-gap: 10px !important; }
  #nppIcons #btnOverlay .col:empty { display: none !important; }
  #nppIcons #btnOverlay .col > * { flex: 0 0 auto !important; position: relative; }
  #nppIcons #btnOverlay .col img { max-width: 40px; max-height: 40px; }
  #nppIcons #nppNestPop { position: absolute !important; left: clamp(0px, calc(var(--tx, 50%) - 28px), calc(100% - 56px)) !important; right: auto !important; bottom: calc(100% + 8px) !important; top: auto !important; width: 56px !important; flex-direction: column !important; align-items: center; transform-origin: 50% 100% !important; box-sizing: border-box; margin: 0 !important; padding: 10px 8px !important; display: flex !important; flex-wrap: nowrap; justify-content: center; gap: 8px !important; border-radius: 16px !important; box-shadow: 0 10px 28px rgba(0,0,0,.4) !important; z-index: 5; opacity: 0; visibility: hidden; pointer-events: none !important; transform: translateY(14px) scale(.92) !important; transition: opacity .2s ease, transform .3s cubic-bezier(.34, 1.4, .5, 1), visibility 0s .3s; }
  #nppIcons #nppNestPop.open { opacity: 1; visibility: visible; pointer-events: auto !important; transform: none !important; transition: opacity .2s ease, transform .3s cubic-bezier(.34, 1.4, .5, 1), visibility 0s; }
  #nppIcons #nppNestPop::after { content: ""; position: absolute; left: 50%; }
  #nppIcons #nppNestPop.open .col > * { animation: nppTrayIn .42s cubic-bezier(.34, 1.56, .5, 1) both; animation-delay: calc(var(--i, 0) * 45ms + 60ms); }
  @media (prefers-reduced-motion: reduce) { #nppIcons #nppNestPop, #nppIcons #nppNestPop.open { transition: none; } #nppIcons #nppNestPop.open .col > * { animation: none; } }

  #npNp .np-top-row .np-amount, #npNp .np-top-row .np-nc { flex-direction: row; overflow: visible; white-space: nowrap; }
  #npNp .np-top-row .np-amount img, #npNp .np-top-row .np-nc img { flex: 0 0 auto; order: -1; }
  #npNp .np-top-row .npVal, #npNp .np-top-row .ncVal { flex: 0 0 auto; white-space: nowrap !important; letter-spacing: 0; }
  #npNp .np-top-row .np-chevron { flex: 0 0 auto; }

  #npUser .rightSide { align-items: center !important; }
  #npUser #nppAvatar { align-self: center !important; }

  html #npHud #nppFoot { position: relative !important; z-index: 0; flex: 0 0 auto !important; min-height: 0; }
  #nppPinsMod { position: relative; }
  #nppIcons { z-index: 1; flex: 0 0 auto !important; padding-top: 12px; }

  #npHud { --pn-pad: 12px; --pn-r: 16px; --pn-t2: rgba(255,255,255,.72); --pn-t3: rgba(255,255,255,.55); font-family: 'Outfit', system-ui, sans-serif; }
  #npHud#npHud, #npHud#npHud * { text-shadow: none !important; }
  #npHud#npHud { padding: 0 6px 8px !important; gap: 10px !important; justify-content: flex-start !important; background: none !important; border: 0 !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; color: #fff; }
  @media (min-width: 1101px) { #npHud { left: 4px !important; width: calc(var(--np-col-width, 240px) - 8px) !important; bottom: 8px !important; } }
  @media (max-width: 1100px) { #npHud#npHud { padding: 0 12px 12px !important; } }
  #npHud > #npUser, #npHud > #npNp, #npHud > #npActivePet, #npHud > #nppListsMod, #npHud > #nppFoot { box-sizing: border-box; margin: 0 !important; padding: var(--pn-pad) !important; background: rgba(18,16,28,.62) !important; -webkit-backdrop-filter: blur(18px) saturate(140%) !important; backdrop-filter: blur(18px) saturate(140%) !important; border: 1px solid rgba(255,255,255,.10) !important; border-radius: var(--pn-r) !important; box-shadow: 0 8px 24px rgba(0,0,0,.25) !important; color: #fff; }
  #npHud > #nppNavMod { order: 5; margin: 0 !important; }
  #npHud > #npActivePet { order: 4; position: relative !important; display: block !important; overflow: hidden !important; }
  #npHud > #nppFoot { order: 6; flex: 0 0 auto !important; }
  #npHud > #nppIcons { order: 8; flex: 0 0 auto !important; margin: auto 0 0 !important; position: sticky; bottom: 0; z-index: 6; padding: 6px 0 2px !important; border: 0; background: none; }
  #npHud > #nppIcons:not(:has(.col > *)) { display: none; }

  #npHud #npUser .rightSide { row-gap: 3px !important; }
  #npHud #npUser #nppAvatar { grid-column: 1 !important; grid-row: 1 / span 2 !important; font: 700 17px/1 'Outfit', system-ui, sans-serif; border: 2px solid var(--np-accent, #fff) !important; box-shadow: 0 0 0 3px color-mix(in srgb, var(--np-accent, #fff) 28%, transparent); }
  #npHud #npUser .name { grid-column: 2 !important; grid-row: 1 / span 2 !important; align-self: center !important; min-width: 0; }
  #npHud #npUser #npUserTitle { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #fff !important; }
  #npHud #npUser[data-main="1"] .name { grid-row: 1 !important; align-self: end !important; }
  #npHud #npUser[data-main="1"] .rightSide::after { content: "MAIN"; grid-column: 2; grid-row: 2; justify-self: start; align-self: start; padding: 2px 7px; border-radius: 999px; font: 700 11px/1 'Outfit', system-ui, sans-serif; letter-spacing: .06em; color: #fff; background: color-mix(in srgb, var(--np-accent, #fff) 45%, transparent); }
  #npHud #npUser #nppAcctBtns { grid-column: 3 !important; grid-row: 1 / span 2 !important; align-self: center; display: flex !important; margin: 0 !important; }
  #npHud #npUser #npLogoutBtn, #npHud #npUser #npSwapBtn { padding: 0 !important; justify-content: center; border: 0 !important; color: var(--pn-t2) !important; }
  #npHud #npUser #npLogoutBtn span, #npHud #npUser #npSwapBtn span { display: none !important; }
  #npHud #npUser #npLogoutBtn:hover, #npHud #npUser #npSwapBtn:hover { background: rgba(255,255,255,.12) !important; color: #fff !important; }

  #npHud #npNp .np-top-row { gap: 6px !important; }
  #npHud #npNp .np-top-row .np-amount, #npHud #npNp .np-top-row .np-nc { grid-template-columns: auto minmax(0, 1fr); transition: background .15s; }
  #npHud #npNp .np-top-row .np-amount::before { content: none; }
  #npHud #npNp .np-top-row .np-nc::before { content: none; }
  #npHud #npNp .np-top-row .np-amount::before, #npHud #npNp .np-top-row .np-nc::before { grid-row: 1; font: 600 11px/1 'Outfit', system-ui, sans-serif; text-transform: uppercase; letter-spacing: .06em; color: var(--pn-t3); }
  #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { color: #fff !important; font: 700 17px/1.15 'Outfit', system-ui, sans-serif !important; }
  #npHud #npNp .np-top-row .np-amount, #npHud #npNp .np-top-row .np-nc { position: relative; } #npHud #npNp .np-top-row .np-amount img, #npHud #npNp .np-top-row .np-nc img { position: absolute !important; top: 50% !important; transform: translateY(-50%) !important; grid-column: auto; grid-row: auto; filter: drop-shadow(0 2px 3px rgba(0,0,0,.45)); } #npHud #npNp .np-top-row .np-amount::before, #npHud #npNp .np-top-row .np-nc::before, #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { grid-column: 2; font-variant-numeric: tabular-nums; }
  #npHud #npNp .np-chevron { color: var(--pn-t2) !important; transition: transform .2s, color .15s, background .15s; }
  #npHud #npNp .np-chevron:hover { color: #fff !important; background: rgba(255,255,255,.12) !important; }
  #npHud #npNp .np-bank-drawer { padding: 10px 0 0; margin-top: 10px; border-top: 1px solid rgba(255,255,255,.10); }

  #npHud #npActivePet > img { -webkit-mask-image: none; mask-image: none; }
  #npHud #npPetDockBtn { top: 18px; right: 18px; height: 28px; border-radius: 999px; background: rgba(255,255,255,.85) !important; color: #1a1626 !important; border: 1px solid rgba(255,255,255,.6) !important; box-shadow: 0 2px 8px rgba(0,0,0,.28) !important; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); font: 600 11px/1 'Outfit', system-ui, sans-serif; z-index: 2; } #npHud #npPetDockBtn svg { width: 13px; height: 13px; flex: none; color: inherit; transition: transform .35s cubic-bezier(.3,.7,.3,1); } #npHud #npPetDockBtn:hover { background: #fff !important; box-shadow: 0 3px 10px rgba(0,0,0,.34) !important; } #npHud #npPetDockBtn:hover svg { transform: rotate(180deg); } @media (prefers-reduced-motion: reduce) { #npHud #npPetDockBtn svg { transition: none; } }
  #npHud #npPetDockBtn { width: 28px; padding: 0; gap: 0; justify-content: center; overflow: hidden; transition: width .3s cubic-bezier(.3,.7,.3,1), padding .3s, gap .3s, background .15s, box-shadow .15s; } #npHud #npPetDockBtn span { max-width: 0; opacity: 0; overflow: hidden; white-space: nowrap; transition: max-width .3s cubic-bezier(.3,.7,.3,1), opacity .2s; } #npHud #npPetDockBtn:hover, #npHud #npPetDockBtn:focus-visible { width: 112px; padding: 0 11px 0 9px; gap: 6px; } #npHud #npPetDockBtn:hover span, #npHud #npPetDockBtn:focus-visible span { max-width: 80px; opacity: 1; } #npHud #npPetDockBtn:focus-visible svg { transform: rotate(180deg); } @media (prefers-reduced-motion: reduce) { #npHud #npPetDockBtn, #npHud #npPetDockBtn span { transition: none; } }
  #npHud #npActivePet #nppPetInfo { display: flex; padding: 0; text-align: left; }
  #npHud #nppPetInfo .nppTitle { order: 1; flex: 0 0 100%; justify-content: flex-start; text-align: left; position: relative; }
  #npHud #nppPetInfo .nppTitle a { text-align: left; color: #fff !important; }
  #npHud #nppPetInfo .nppSub { color: var(--pn-t2); }
  #npHud #nppPetInfo .nppTitle .nppCopy { right: 0; top: -2px; }
  #npHud #nppPetInfo .nppChips { order: 2; position: static; display: flex; margin: 0; pointer-events: auto; }
  #npHud #nppPetInfo .nppChip { font-weight: 600; -webkit-backdrop-filter: none; backdrop-filter: none; color: #fff; }
  #npHud #nppPetInfo .nppLinks { order: 3; flex: 0 0 auto; justify-content: flex-end; margin: 0 !important; }
  #npHud #nppPetInfo .nppLinks a, #npHud #nppPetInfo .nppLinks button { flex: 0 0 auto; padding: 0; }
  #npHud #nppPetInfo .nppLinks a:hover, #npHud #nppPetInfo .nppLinks button:hover { background: rgba(255,255,255,.2); }
  #npHud #nppPetInfo .nppLinks button.on { background: color-mix(in srgb, var(--np-accent, #fff) 45%, transparent); }
  #npHud #nppPetInfo .nppDetails { order: 4; flex: 0 0 100%; }
  #npHud #npActivePet:not(:has(.nppTitle))::before { content: ""; position: absolute; inset: 12px; border-radius: 12px; z-index: 0; background: linear-gradient(100deg, rgba(255,255,255,.04) 30%, rgba(255,255,255,.16) 50%, rgba(255,255,255,.04) 70%) 0 0 / 200% 100%; animation: nppShimmer 1.4s linear infinite; }
  #npHud #npActivePet > img { position: relative; z-index: 1; }
  #npHud #npActivePet:not(:has(.nppTitle)) { min-height: 194px; }
  @keyframes nppShimmer { to { background-position: -200% 0; } }
  @media (prefers-reduced-motion: reduce) { #npHud #npActivePet:not(:has(.nppTitle))::before { animation: none; } }

  #npHud #nppListsMod { display: grid; }
  #npHud #nppListsMod .nppLt { flex-wrap: nowrap; white-space: nowrap; }
  #npHud #nppListsMod .nppLt + .nppLt { position: relative; } #npHud #nppListsMod .nppLt + .nppLt::before { content: ""; position: absolute; left: -2px; top: 8px; bottom: 8px; width: 1px; background: rgba(255,255,255,.10); pointer-events: none; }
  #npHud #nppListsMod .nppLt svg { color: var(--pn-t2); }
  #npHud #nppListsMod .nppLt b { color: #fff; }
  #npHud #nppListsMod .nppLt em { flex: none; text-align: center; }
  #npHud #nppListsMod .nppLt { transition: background .18s, transform .18s, box-shadow .18s; } #npHud #nppListsMod .nppLt:hover, #npHud #nppListsMod .nppLt:focus-visible { transform: translateY(-2px); background: rgba(255,255,255,.14); box-shadow: 0 6px 14px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.18); } #npHud #nppListsMod .nppLt:hover svg, #npHud #nppListsMod .nppLt:focus-visible svg { animation: nppLtWiggle .5s ease; } #npHud #nppListsMod .nppLt em { animation: nppLtPop .5s cubic-bezier(.3,1.6,.5,1) .15s both; } @keyframes nppLtWiggle { 0%,100% { transform: rotate(0) translateY(0); } 25% { transform: rotate(-14deg) translateY(-2px); } 55% { transform: rotate(10deg) translateY(-1px); } 80% { transform: rotate(-4deg); } } @keyframes nppLtPop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } } @media (prefers-reduced-motion: reduce) { #npHud #nppListsMod .nppLt, #npHud #nppListsMod .nppLt em, #npHud #nppListsMod .nppLt svg { animation: none !important; transition: none !important; transform: none !important; } }

  #npHud #nppPinsMod { border: 0; background: none; border-radius: 0; overflow: visible; height: auto; min-height: 0; flex: 0 0 auto; -webkit-backdrop-filter: none; backdrop-filter: none; }
  #npHud #nppPinsMod .pTabs { position: relative; display: flex; gap: 2px; padding: 3px; margin: 0 0 8px; border-radius: 10px; background: rgba(255,255,255,.08); }
  #npHud #nppPinsMod .pTabs button { flex: 1 1 0; padding: 6px 4px; border-radius: 8px; background: none; color: var(--pn-t2); border-bottom: 0; }
  #npHud #nppPinsMod .pTabs button { position: relative; z-index: 1; transition: color .2s; } #npHud #nppPinsMod .pTabs button.on, #npHud #nppPinsMod .pTabs button[data-t="pinned"].on { color: #fff; background: none; } #npHud #nppPinsMod .pTabs::before { content: ""; position: absolute; z-index: 0; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 8px) / 2); border-radius: 8px; background: color-mix(in srgb, var(--np-accent, #fff) 40%, rgba(255,255,255,.1)); transition: transform .3s cubic-bezier(.34, 1.3, .5, 1); } #npHud #nppPinsMod[data-tab="pinned"] .pTabs::before { transform: translateX(calc(100% + 2px)); } #npHud #nppPinsMod #nppRecent, #npHud #nppPinsMod #nppPinned { animation: nppTabIn .28s ease both; } @keyframes nppTabIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } } @media (prefers-reduced-motion: reduce) { #npHud #nppPinsMod .pTabs::before { transition: none; } #npHud #nppPinsMod #nppRecent, #npHud #nppPinsMod #nppPinned { animation: none; } }
  #npHud #nppPinsMod #nppRecent, #npHud #nppPinsMod #nppPinned { padding: 0; height: auto; min-height: 0; flex: 0 0 auto; }
  #npHud #nppPinsMod .rList { box-sizing: border-box; width: 100%; margin: 0 !important; padding: 0 !important; max-height: 92px; height: auto; flex: 0 0 auto; gap: 4px; overflow-x: hidden; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; } #npHud #nppPinsMod .rList::-webkit-scrollbar { display: none; width: 0; height: 0; } #npHud #nppPinsMod .rList li { box-sizing: border-box; width: 100%; } #npHud #nppPinsMod .rPin { right: 6px; }
  #npHud #nppPinsMod .rList:empty::before { color: var(--pn-t3); }
  #npHud #nppPinsMod .rList a { height: 28px; background: rgba(255,255,255,.05) !important; border: 0 !important; border-radius: 8px; box-sizing: border-box; width: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 34px 0 10px !important; color: #fff; }
  #npHud #nppPinsMod .rList a:hover { background: rgba(255,255,255,.14) !important; }
  #npHud #nppPinsMod .rList b { color: #fff; }

  #npHud #npUser #npUserTitle { font: 400 18px/1.15 'CafeteriaBlack', Georgia, serif !important; letter-spacing: 0; }
  #npHud #nppListsMod .nppLt b { font: 400 16px/1 'CafeteriaBlack', Georgia, serif; }
  #npHud #nppPetInfo .nppTitle a { min-width: 0; overflow: hidden; }
  #npHud #nppPetInfo .nppName { font: 400 24px/1.15 'CafeteriaBlack', Georgia, serif !important; letter-spacing: 0; padding: 0 28px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; overflow-wrap: normal; }
  #npHud #npNp .np-top-row .np-amount::before, #npHud #npNp .np-top-row .np-nc::before { display: none !important; }
  #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { grid-row: 1 !important; align-self: center; }
  #npHud #npNp .np-top-row .np-amounts { grid-template-columns: none !important; } #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { display: block; min-width: 0; overflow: hidden !important; text-overflow: clip !important; }
  #npHud #nppPetInfo .nppChips { flex: 1 1 auto; min-width: max-content; flex-wrap: nowrap; align-items: center; gap: 6px; }
  #npHud #nppPetInfo .nppChip { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.1); font-size: 12px; line-height: 1; white-space: nowrap; flex: 0 0 auto; }
  #npHud #nppPetInfo .nppLinks { align-items: center; gap: 6px !important; }
  #npHud #nppPetInfo .nppLinks a, #npHud #nppPetInfo .nppLinks button { box-sizing: border-box; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.14); border-radius: 50%; background: rgba(255,255,255,.1); color: #fff; }
  &.npp-side-light #npHud #nppPetInfo .nppChip, &.npp-side-light #npHud #nppPetInfo .nppLinks a, &.npp-side-light #npHud #nppPetInfo .nppLinks button { background: #fff; border-color: rgba(0,0,0,.10); color: #1c1830 !important; }
  &.npp-side-light #npHud #nppPetInfo .nppLinks a:hover, &.npp-side-light #npHud #nppPetInfo .nppLinks button:hover { background: #f1eff7; }
  &.npp-side-light #npHud #nppPetInfo .nppLinks button.on { background: color-mix(in srgb, var(--np-accent, #888) 35%, rgba(255,255,255,.6)); }
  &.npp-side-light #npHud { --pn-t2: rgba(28,24,48,.68); --pn-t3: rgba(28,24,48,.5); }
  &.npp-side-light #npHud > #npUser, &.npp-side-light #npHud > #npNp, &.npp-side-light #npHud > #npActivePet, &.npp-side-light #npHud > #nppListsMod, &.npp-side-light #npHud > #nppFoot { background: rgba(255,255,255,.72) !important; -webkit-backdrop-filter: blur(18px) !important; backdrop-filter: blur(18px) !important; border-color: rgba(0,0,0,.08) !important; box-shadow: 0 8px 24px rgba(40,30,80,.14) !important; color: #1c1830; }
  &.npp-side-light #npHud #npUserTitle, &.npp-side-light #npHud #nppPetInfo .nppTitle a, &.npp-side-light #npHud #nppPetInfo .nppName { color: #1c1830 !important; text-shadow: none !important; }
  &.npp-side-light #npHud #npNp .np-top-row .npVal, &.npp-side-light #npHud #npNp .np-top-row .ncVal, &.npp-side-light #npHud #npNp, &.npp-side-light #npHud #npNp .np-amount, &.npp-side-light #npHud #npNp .np-nc { color: #1c1830 !important; }
  &.npp-side-light #npHud #npNp .np-chevron { color: rgba(28,24,48,.68) !important; } 
  &.npp-side-light #npHud #npNp .np-bank-drawer { border-top-color: rgba(0,0,0,.08); } &.npp-side-light #npNp .bankGraph text { fill: rgba(28,24,48,.7); }
  &.npp-side-light #npHud #nppPetInfo .nppSub, &.npp-side-light #npHud #nppPetInfo { color: rgba(28,24,48,.68); }
  &.npp-side-light #npHud #nppPetInfo .nppTitle .nppCopy { color: rgba(28,24,48,.6); } &.npp-side-light #npHud #nppPetInfo .nppTitle .nppCopy:hover { background: rgba(0,0,0,.07); color: #1c1830; }
  &.npp-side-light #npHud #nppListsMod .nppLt em { color: #1c1830; }
  &.npp-side-light #npHud #nppListsMod .nppLt + .nppLt::before { background: rgba(0,0,0,.10); }
  &.npp-side-light #npHud #nppPinsMod .pTabs { background: rgba(0,0,0,.06); }
  &.npp-side-light #npHud #nppPinsMod .pTabs button, &.npp-side-light #npHud #nppPinsMod .rPin { color: rgba(28,24,48,.6); }
  &.npp-side-light #npHud #nppPinsMod .pTabs button.on, &.npp-side-light #npHud #nppPinsMod .pTabs button[data-t="pinned"].on { color: #1c1830; }
  &.npp-side-light #npHud #nppPinsMod .rList a { background: #fff !important; color: #1c1830 !important; } &.npp-side-light #npHud #nppPinsMod .rList a:hover { background: #f1eff7 !important; }
  &.npp-side-light #npHud #nppPinsMod .rEmpty { color: rgba(28,24,48,.6) !important; }
  &.npp-side-light #npHud #nppPinsMod .rList b { color: #1c1830; } &.npp-side-light #npHud #nppPinsMod .rList:empty::before { color: rgba(28,24,48,.5); }
  &.npp-side-light #npHud #nppPinsMod li.isPinned .rPin { color: #d89a00; }
  #npHud #npNp .np-top-row { align-items: center; min-height: 0; }
  #nppIcons #nppNestPop { border: 0 !important; }
  #nppIcons #nppNestPop::before { content: ""; position: absolute; left: -6px; right: -6px; top: 100%; height: 16px; }
  #nppIcons #nppNestPop .col, #nppIcons #nppNestPop .col > *, #nppIcons #nppNestPop .col > * * { border: 0 !important; }
  #nppColors .nppSideRow .nppLogoDot { display: none; }

  #npHud #nppIcons #btnOverlay .col { justify-content: space-evenly !important; flex-wrap: nowrap !important; gap: 8px !important; }
  #npHud #nppIcons #btnOverlay .col img { max-width: 36px; max-height: 36px; width: 36px; height: 36px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,.45)); }
  #npHud #nppIcons #btnOverlay .col > * { transition: transform .18s ease, filter .18s ease; }
  #npHud #nppIcons #btnOverlay .col > *:hover { transform: translateY(-2px); filter: brightness(1.12); }
  @media (prefers-reduced-motion: reduce) { #npHud #nppIcons #btnOverlay .col > * { transition: none; } #npHud #nppIcons #btnOverlay .col > *:hover { transform: none; } }

  #qrDockWrap { scrollbar-width: none !important; -ms-overflow-style: none; }
  #qrDockWrap::-webkit-scrollbar, #qrDock::-webkit-scrollbar { display: none !important; }
  #qrDock { scrollbar-width: none !important; }
  #qrDock .qrPet { position: relative !important; min-height: 120px !important; flex: 1 0 120px !important; overflow: hidden; }
  #qrDock .qrPet::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 55%; background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,0)); pointer-events: none; z-index: 1; }
  #qrDock .qrPetName { position: absolute !important; left: 0 !important; right: 0 !important; bottom: 0 !important; top: auto !important; z-index: 2; margin: 0 !important; padding: 14px 10px 8px !important; opacity: 1 !important; visibility: visible !important; transform: none !important; background: none !important; color: #fff !important; font-size: 17px !important; line-height: 1.15; text-align: center; text-shadow: 0 1px 3px rgba(0,0,0,.95), 0 0 8px rgba(0,0,0,.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
  #qrDock .qrOverlay { position: absolute !important; inset: 0 !important; z-index: 3; opacity: 1 !important; visibility: visible !important; background: none !important; display: flex !important; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 0 0 28px; pointer-events: none; }
  #qrDock .qrOverlay a { pointer-events: auto; opacity: 0; visibility: hidden; transform: translateY(4px); transition: opacity .15s, transform .15s, visibility 0s .15s; display: inline-flex; align-items: center; justify-content: center; min-width: 118px; min-height: 30px; box-sizing: border-box; padding: 5px 14px; border-radius: 999px; background: rgba(14,12,22,.88) !important; border: 1px solid rgba(255,255,255,.55); color: #fff !important; font-size: 14px !important; font-weight: 700; text-decoration: none !important; text-shadow: none; box-shadow: 0 2px 8px rgba(0,0,0,.5); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
  #qrDock .qrOverlay a:hover, #qrDock .qrOverlay a:focus-visible { background: #fff !important; color: #14111f !important; outline: none; }
  #qrDock .qrPet:hover .qrOverlay a, #qrDock .qrPet:focus-within .qrOverlay a, #qrDock .qrPet.nppTap .qrOverlay a { opacity: 1; visibility: visible; transform: none; transition: opacity .15s, transform .15s, visibility 0s; }
  @media (hover: none), (max-width: 640px) { #qrDock .qrOverlay a { opacity: 1; visibility: visible; transform: none; min-height: 28px; font-size: 13px !important; } #qrDock .qrOverlay { gap: 5px; } }
  @media (prefers-reduced-motion: reduce) { #qrDock .qrOverlay a { transition: none; } }

  #nppNavMod { display: none; }
  #nppNavMod .nppNavGrp + .nppNavGrp { border-top: 1px solid var(--npp-card-line); }
  #nppNavMod .nppNavLinks { display: none; padding: 0 12px 8px; }
  #nppNavMod .nppNavGrp.open .nppNavLinks { display: block; }
  #nppNavMod .nppNavLinks a { display: block; padding: 6px 4px; color: rgba(255,255,255,.9) !important; font-size: 13.5px; text-decoration: none !important; border-radius: 6px; }
  #nppNavMod .nppNavLinks a:hover { background: rgba(255,255,255,.12); }
  #nppNavMod a.nppNavSolo { display: block; padding: 9px 12px; color: #fff !important; font: 700 12px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; text-decoration: none !important; }

  #nppMenuBtn { display: none; position: fixed; left: 10px; top: var(--npp-tools-top, 27px); transform: translateY(-50%); z-index: 2010; width: 40px; height: 40px; padding: 0; align-items: center; justify-content: center; border: 1px solid var(--npp-card-line); border-radius: 12px; background: var(--npp-card); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: #fff; cursor: pointer; }
  #nppMenuBtn svg { width: 20px; height: 20px; }
  #nppScrim { display: none; position: fixed; inset: 0; z-index: 2040; background: rgba(8,6,14,.55); opacity: 0; transition: opacity .25s; }
  #nppDrawerClose { display: none; position: fixed; top: 8px; left: calc(var(--npp-drawer-w) - 48px); z-index: 2052; width: 38px; height: 38px; padding: 0; align-items: center; justify-content: center; border: 1px solid var(--npp-card-line); border-radius: 10px; background: rgba(0,0,0,.35); color: #fff; font-size: 22px; line-height: 1; cursor: pointer; }
  &.npp-wait #nppMenuBtn { opacity: 0; }

  @media (max-height: 820px) {
    --np-hud-top: 66px !important;
  }

  @media (max-width: 1100px) {
    --np-col-width: 0px !important;
    #npLeftBar { left: 0 !important; width: var(--npp-drawer-w) !important; z-index: 2050 !important; transform: translateX(-104%); visibility: hidden; transition: transform .26s cubic-bezier(.22, 1, .36, 1), visibility 0s .26s; }
    #npHud { left: 0 !important; width: var(--npp-drawer-w) !important; top: 52px !important; z-index: 2051 !important; transform: translateX(-104%); visibility: hidden; transition: transform .26s cubic-bezier(.22, 1, .36, 1), visibility 0s .26s; }
    &.nppDrawerOpen #npLeftBar, &.nppDrawerOpen #npHud { transform: none; visibility: visible; transition: transform .26s cubic-bezier(.22, 1, .36, 1), visibility 0s; }
    &.nppDrawerOpen #nppScrim { display: block; opacity: 1; }
    &.nppDrawerOpen #nppDrawerClose { display: flex; }
    &.nppDrawerOpen body { overflow: hidden !important; }
    #nppMenuBtn { display: flex; }
    #nppTools .nppSearch.nppOpen input { width: min(252px, calc(100vw - 150px)); }
  }
  @media (max-width: 1100px) and (max-height: 820px) { #npHud { top: 48px !important; } }
  @media (max-width: 640px) { #nppNavMod { display: block; } }
  @keyframes nppTrayIn { from { opacity: 0; transform: translateY(16px) scale(.4); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { #npLeftBar, #npHud, #nppScrim { transition: none !important; } } #npHud #npActivePet #nppPetInfo { container-type: inline-size; flex-wrap: wrap !important; } #npHud #npActivePet #nppPetInfo .nppChips { gap: 0 !important; justify-content: flex-start !important; flex-wrap: nowrap !important; } #npHud #npActivePet #nppPetInfo .nppChip { height: auto !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; line-height: 1.2 !important; white-space: nowrap !important; flex: 0 0 auto !important; } #npHud #npActivePet #nppPetInfo .nppChip:not(.gF):not(.gM) { color: var(--pn-t2, rgba(255,255,255,.7)) !important; } #npHud #npActivePet #nppPetInfo .nppChip + .nppChip::before { content: "·"; margin: 0 6px; } #npHud #npActivePet #nppPetInfo .nppLinks { justify-content: flex-end !important; } #npHud #npActivePet #nppPetInfo .nppLinks a, #npHud #npActivePet #nppPetInfo .nppLinks button { flex: 0 0 auto !important; padding: 0 !important; } #npHud #nppListsMod { grid-template-columns: 1fr auto 1fr !important; gap: 0 !important; } #npHud #nppListsMod::before { content: ""; grid-column: 2; grid-row: 1; width: 1px; margin: 8px 0; background: rgba(255,255,255,.10); pointer-events: none; } #npHud #nppListsMod .nppLt + .nppLt::before { display: none !important; } #npHud #nppListsMod .nppLt b { font-family: 'CafeteriaBlack', Georgia, serif !important; letter-spacing: normal !important; flex: 0 0 auto !important; overflow: visible !important; text-overflow: clip !important; white-space: nowrap !important; } #npHud #nppListsMod .nppLt em { box-sizing: border-box !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; height: 16px !important; min-width: 16px !important; padding: 0 5px !important; line-height: 1 !important; } #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { font-family: 'CafeteriaBlack', Georgia, serif !important; } #npHud #nppPinsMod .pTabs button { font: 400 13px/1.1 'CafeteriaBlack', Georgia, serif !important; letter-spacing: normal !important; text-transform: none !important; }
  #npHud #npUser #npUserTitle { font-size: 21px !important; font-weight: 400 !important; line-height: 1.15 !important; }
  #npHud #nppListsMod .nppLt b { font-size: 16px !important; font-weight: 400 !important; }
  #npHud #nppListsMod .nppLt em { font-size: 10px !important; font-weight: 600 !important; }
  #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { font-weight: 400 !important; }
  #npHud #nppPetInfo .nppName { font-size: 26px !important; font-weight: 400 !important; line-height: 1.15 !important; }
  #npHud #nppPetInfo .nppSub { font-size: 12px !important; font-weight: 500 !important; line-height: 1.3 !important; }
  #npHud #npActivePet #nppPetInfo .nppChip { font-size: 11px !important; font-weight: 500 !important; }
  #npHud #nppPinsMod .pTabs button { font-size: 16px !important; font-weight: 400 !important; }
  #npHud #nppPinsMod .rList b { font-size: 12px !important; font-weight: 500 !important; }
  #npHud #npUser #npUserTitle, #npHud #nppListsMod .nppLt b, #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal, #npHud #nppPetInfo .nppName, #npHud #nppPinsMod .pTabs button { text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6) !important; }
  &.npp-side-light #npHud #npUser #npUserTitle, &.npp-side-light #npHud #nppListsMod .nppLt b, &.npp-side-light #npHud #npNp .np-top-row .npVal, &.npp-side-light #npHud #npNp .np-top-row .ncVal, &.npp-side-light #npHud #nppPetInfo .nppName, &.npp-side-light #npHud #nppPinsMod .pTabs button { text-shadow: none !important; }
  #npHud { --npp-pill-h: 36px; --npp-pill-r: 10px; --npp-pill-bg: rgba(255,255,255,.08); --npp-pill-bg-h: rgba(255,255,255,.15); }
  &.npp-side-light #npHud { --npp-pill-bg: rgba(0,0,0,.05); --npp-pill-bg-h: rgba(0,0,0,.09); }
  #npHud > #npUser { padding: 10px 12px !important; }
  #npHud #npUser .rightSide { grid-template-columns: 44px minmax(0, 1fr) auto !important; column-gap: 12px !important; }
  #npHud #npUser #nppAvatar { width: 44px !important; height: 44px !important; }
  #npHud #npUser #npLogoutBtn, #npHud #npUser #npSwapBtn { background: var(--npp-pill-bg) !important; }
  #npHud #npUser #npSwapBtn:hover { background: var(--npp-pill-bg-h) !important; }
  #npHud > #nppListsMod { display: grid !important; gap: 8px !important; padding: 8px !important; }
  #npHud #nppListsMod::before { display: none !important; }
  #npHud #nppListsMod .nppLtAcct, #npHud #nppListsMod .nppLtPets { grid-column: auto !important; grid-row: auto !important; }
  #npHud #nppListsMod .nppLt { display: flex !important; align-items: center !important; height: var(--npp-pill-h) !important; border: 0 !important; border-radius: var(--npp-pill-r) !important; background: var(--npp-pill-bg) !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
  #npHud #nppListsMod .nppLt:hover { background: var(--npp-pill-bg-h) !important; }
  #npHud #nppListsMod .nppLt svg { width: 16px !important; height: 16px !important; flex: none; }
  #npHud #nppListsMod .nppLt em { border-radius: 999px !important; background: rgba(255,255,255,.14) !important; color: inherit !important; }
  #npHud #npNp .np-chevron { width: var(--npp-pill-h) !important; height: var(--npp-pill-h) !important; border-radius: var(--npp-pill-r) !important; }
  &.npp-side-light #npHud #npUser #npUserTitle, &.npp-side-light #npHud #npUser .name, &.npp-side-light #npHud #npUser .name * { color: #1c1830 !important; text-shadow: none !important; }
  &.npp-side-light #npHud #npUser[data-main="1"] .rightSide::after { color: #1c1830 !important; }
  &.npp-side-light #npHud #npUser #npLogoutBtn, &.npp-side-light #npHud #npUser #npSwapBtn, &.npp-side-light #npHud #npUser #npSwapBtn:hover { color: #1c1830 !important; }
  &.npp-side-light #npHud #npUser #npLogoutBtn:hover { color: #d33 !important; background: rgba(255,90,90,.16) !important; }
  &.npp-side-light #npHud #nppListsMod .nppLt, &.npp-side-light #npHud #nppListsMod .nppLt b { color: #1c1830 !important; }
  &.npp-side-light #npHud #nppListsMod .nppLt em { background: rgba(0,0,0,.08) !important; }
  &.npp-side-light #npHud #npNp .np-chevron:hover { color: #1c1830 !important; background: var(--npp-pill-bg-h) !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppTitle a, &.npp-side-light #npHud #npActivePet #nppPetInfo .nppName, &.npp-side-light #npHud #npActivePet #nppPetInfo .nppLinks a, &.npp-side-light #npHud #npActivePet #nppPetInfo .nppLinks button { color: #1c1830 !important; text-shadow: none !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppChip:not(.gF):not(.gM) { color: rgba(28,24,48,.68) !important; }

  #npHud #npUser #nppAcctBtns { gap: 2px !important; }
  #npHud #npUser #npLogoutBtn, #npHud #npUser #npSwapBtn { width: 26px !important; height: 26px !important; border-radius: 8px !important; }
  #npHud #npUser #npLogoutBtn svg, #npHud #npUser #npSwapBtn svg { width: 14px !important; height: 14px !important; }
  #npHud > #nppListsMod { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important; }
  #npHud #nppListsMod .nppLt { box-sizing: border-box !important; min-width: 0 !important; width: 100% !important; justify-content: flex-start !important; gap: 8px !important; padding: 0 12px !important; }
  #npHud #nppListsMod .nppLt em { margin-left: auto !important; }
  #npHud > #npUser { order: 1; }
  #npHud > #npNp { order: 2; position: relative !important; z-index: 3; }
  #npHud > #nppListsMod { order: 3; }
  #npHud #npNp .np-top-row { justify-content: center !important; }
  #npHud #npNp .np-top-row .np-amounts { justify-content: center !important; }
  #npHud #npNp .np-top-row .np-amount, #npHud #npNp .np-top-row .np-nc, #npHud #npNp .np-top-row .np-bank { display: flex !important; flex: 0 0 auto !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: auto !important; min-width: 0 !important; height: 26px !important; min-height: 26px !important; margin: 0 !important; padding: 0 10px 0 22px !important; gap: 4px !important; border: 1px solid rgba(255,255,255,.10) !important; border-radius: 999px !important; background: rgba(18,16,28,.62) !important; -webkit-backdrop-filter: blur(18px) saturate(140%) !important; backdrop-filter: blur(18px) saturate(140%) !important; box-shadow: 0 4px 12px rgba(0,0,0,.25) !important; color: #fff !important; font-size: 14px !important; }
  #npHud #npNp .np-top-row .np-amount:hover, #npHud #npNp .np-top-row .np-nc:hover, #npHud #npNp .np-top-row .np-bank:hover { background: rgba(40,36,56,.78) !important; }
  #npHud #npNp .np-top-row .np-amount img, #npHud #npNp .np-top-row .np-nc img { width: 18px !important; height: 18px !important; left: 3px !important; }
  #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { font-size: 14px !important; line-height: 1 !important; }
  #npHud #npNp .np-top-row .np-bank { width: 26px !important; padding: 0 !important; text-decoration: none !important; cursor: pointer; }
  #npHud #npNp .np-top-row .np-bank img { position: static !important; transform: none !important; width: 18px !important; height: 18px !important; }
  #npHud #npNp .np-top-row .np-bank svg { width: 16px; height: 16px; display: block; }
  &.npp-side-light #npHud #npNp .np-top-row .np-amount, &.npp-side-light #npHud #npNp .np-top-row .np-nc, &.npp-side-light #npHud #npNp .np-top-row .np-bank { background: rgba(255,255,255,.72) !important; border-color: rgba(0,0,0,.08) !important; box-shadow: 0 4px 12px rgba(40,30,80,.14) !important; color: #1c1830 !important; }
  &.npp-side-light #npHud #npNp .np-top-row .np-amount:hover, &.npp-side-light #npHud #npNp .np-top-row .np-nc:hover, &.npp-side-light #npHud #npNp .np-top-row .np-bank:hover { background: rgba(255,255,255,.9) !important; }
  &.npp-side-light #npHud #npNp .np-top-row .npVal, &.npp-side-light #npHud #npNp .np-top-row .ncVal { color: #1c1830 !important; }
  #npHud #npActivePet #npPetDockBtn { top: 8px !important; right: 8px !important; }
  #nppIcons #nppNestPop { background: rgba(255,255,255,.14) !important; -webkit-backdrop-filter: blur(18px) saturate(160%) !important; backdrop-filter: blur(18px) saturate(160%) !important; }
  #nppIcons #nppNestPop::before { background: none !important; }
  #nppIcons #nppNestPop::after { transform: none !important; width: 14px !important; height: 7px !important; top: 100% !important; bottom: auto !important; margin-left: -7px !important; border: 0 !important; clip-path: polygon(0 0, 100% 0, 50% 100%); background: rgba(255,255,255,.14) !important; -webkit-backdrop-filter: blur(18px) saturate(160%) !important; backdrop-filter: blur(18px) saturate(160%) !important; }
  &.npp-side-light #nppIcons #nppNestPop, &.npp-side-light #nppIcons #nppNestPop::after { background: rgba(255,255,255,.45) !important; }
  #npHud > #npUser { padding-bottom: 22px !important; }
  #npHud > #npNp { box-sizing: border-box !important; width: calc(100% - 24px) !important; max-width: none !important; align-self: flex-start !important; margin: -15px 12px 0 !important; padding: 0 !important; background: transparent !important; border: 0 !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; min-height: 30px !important; }
  #npHud > #npNp .np-top-row { display: block !important; box-sizing: border-box !important; width: 100% !important; min-width: 0 !important; flex: none !important; background: none !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
  #npHud > #npNp .np-top-row .np-amounts { display: flex !important; width: 100% !important; max-width: 100% !important; min-width: 0 !important; flex: none !important; align-items: stretch !important; gap: 0 !important; box-sizing: border-box !important; height: 30px !important; padding: 0 !important; margin: 0 !important; overflow: hidden !important; border-radius: 999px !important; background: rgba(18,16,28,.72) !important; border: 1px solid rgba(255,255,255,.12) !important; -webkit-backdrop-filter: blur(18px) saturate(140%) !important; backdrop-filter: blur(18px) saturate(140%) !important; box-shadow: 0 4px 14px rgba(0,0,0,.28) !important; }
  #npHud > #npNp .np-top-row .np-amounts > a { position: static !important; display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; flex: 1 1 0 !important; min-width: 0 !important; width: auto !important; height: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; gap: 5px !important; border: 0 !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; color: #fff !important; font-size: 13px !important; text-decoration: none !important; }
  #npHud > #npNp .np-top-row .np-amounts > a + a { border-left: 1px solid rgba(255,255,255,.14) !important; }
  #npHud > #npNp .np-top-row .np-amounts > a.np-bank { flex: 0 0 34px !important; width: 34px !important; }
  #npHud > #npNp .np-top-row .np-amounts > a:hover { background: var(--npp-pill-bg-h) !important; }
  #npHud > #npNp .np-top-row .np-amounts > a img { position: static !important; transform: none !important; left: auto !important; width: 16px !important; height: 16px !important; margin: 0 !important; }
  #npHud > #npNp .np-top-row .np-amounts > a.np-amount img, #npHud > #npNp .np-top-row .np-amounts > a.np-nc img { order: -1; }
  #npHud > #npNp .np-top-row .np-amounts > a .npVal, #npHud > #npNp .np-top-row .np-amounts > a .ncVal { font-size: 13px !important; line-height: 1 !important; }
  #npHud > #npNp .np-top-row .np-amounts > a.np-bank svg { width: 16px !important; height: 16px !important; display: block !important; }
  &.npp-side-light #npHud > #npNp .np-top-row .np-amounts { background: rgba(255,255,255,.85) !important; border-color: rgba(0,0,0,.08) !important; box-shadow: 0 4px 14px rgba(40,30,80,.14) !important; }
  &.npp-side-light #npHud > #npNp .np-top-row .np-amounts > a, &.npp-side-light #npHud > #npNp .np-top-row .np-amounts > a .npVal, &.npp-side-light #npHud > #npNp .np-top-row .np-amounts > a .ncVal { color: #1c1830 !important; }
  &.npp-side-light #npHud > #npNp .np-top-row .np-amounts > a + a { border-left-color: rgba(0,0,0,.10) !important; }
  &.npp-side-light #npHud > #npNp .np-top-row .np-amounts > a:hover { background: var(--npp-pill-bg-h) !important; }
  #npHud #nppPinsMod .pTabs button { text-align: left !important; justify-content: flex-start !important; padding-left: 10px !important; }
  #npHud #nppPinsMod .rList li > a { padding: 0 10px !important; align-items: flex-start !important; text-align: left !important; }
  #npHud #nppPinsMod .rList li > a b { max-width: 100% !important; text-align: left !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
  #npHud #nppPinsMod .rList li .rPin { right: 3px !important; width: 22px !important; height: 22px !important; border-radius: 7px !important; background: rgba(40,36,56,.92) !important; opacity: 0 !important; pointer-events: none !important; z-index: 2; }
  #npHud #nppPinsMod .rList li:hover .rPin, #npHud #nppPinsMod .rList li .rPin:focus, #npHud #nppPinsMod .rList li .rPin:focus-visible { opacity: 1 !important; pointer-events: auto !important; }
  &.npp-side-light #npHud #nppPinsMod .rList li .rPin { background: rgba(255,255,255,.95) !important; }
  #npHud #nppPinsMod .rList li.isPinned .rPin { color: #ffd166 !important; } &.npp-side-light #npHud #nppPinsMod .rList li.isPinned .rPin { color: #d89a00 !important; }
  #npHud #npActivePet #nppPetInfo { align-items: stretch !important; }
  #npHud #npActivePet #nppPetInfo .nppChips { order: 1 !important; flex: 1 1 auto !important; min-width: 0 !important; align-items: center !important; box-sizing: border-box !important; margin: 0 0 0 calc(-1 * var(--pn-pad, 12px)) !important; padding: 6px 0 6px var(--pn-pad, 12px) !important; background: var(--npp-pill-bg) !important; }
  #npHud #npActivePet #nppPetInfo .nppLinks { order: 2 !important; flex: 0 0 auto !important; align-items: center !important; box-sizing: border-box !important; margin: 0 calc(-1 * var(--pn-pad, 12px)) 0 0 !important; padding: 6px var(--pn-pad, 12px) 6px 0 !important; gap: 4px !important; background: var(--npp-pill-bg) !important; }
  #npHud #npActivePet #nppPetInfo .nppLinks a, #npHud #npActivePet #nppPetInfo .nppLinks button { width: 26px !important; height: 26px !important; }
  #npHud #npActivePet #nppPetInfo .nppLinks a svg, #npHud #npActivePet #nppPetInfo .nppLinks button svg { width: 14px !important; height: 14px !important; }
  #npHud #npActivePet #nppPetInfo .nppDetails { order: 4 !important; }
  #npHud > #npActivePet { padding-bottom: 0 !important; gap: 0 !important; }
  #npHud #npActivePet > img { vertical-align: top !important; }
  #npHud #npActivePet #nppPetInfo { position: static !important; gap: 0 !important; margin: 0 !important; }
  #npHud #npActivePet #nppPetInfo .nppTitle { position: absolute !important; left: 10px !important; right: 10px !important; top: var(--npp-img-h, 240px) !important; transform: translateY(calc(-100% - 10px)) !important; z-index: 3 !important; display: flex !important; align-items: center !important; flex-wrap: nowrap !important; justify-content: flex-start !important; gap: 6px !important; margin: 0 !important; max-width: calc(100% - 20px) !important; text-align: left !important; }
  #npHud #npActivePet #nppPetInfo .nppTitle a { display: block !important; position: static !important; min-width: 0 !important; text-align: left !important; }
  #npHud #npActivePet #nppPetInfo .nppName { font-family: 'CafeteriaBlack', Georgia, serif !important; font-size: 26px !important; font-weight: 400 !important; line-height: 1.05 !important; letter-spacing: .02em !important; padding: 0 !important; }
  #npHud #npActivePet #nppPetInfo .nppSub, #npHud #npActivePet #nppPetInfo .nppTitle .nppCopy { opacity: 0 !important; transform: translateY(4px) !important; transition: opacity .18s ease, transform .18s ease, background .15s !important; }
  #npHud #npActivePet #nppPetInfo .nppSub { position: absolute !important; left: 0 !important; bottom: 100% !important; top: auto !important; margin: 0 0 4px !important; display: -webkit-box !important; -webkit-box-orient: vertical !important; -webkit-line-clamp: 2 !important; box-sizing: border-box !important; width: max-content !important; max-width: 100% !important; overflow: hidden !important; white-space: normal !important; pointer-events: none !important; font: 600 11.5px/1.25 'Outfit', system-ui, sans-serif !important; padding: 4px 9px !important; border-radius: 999px !important; background: rgba(20,16,32,.55) !important; -webkit-backdrop-filter: blur(10px) !important; backdrop-filter: blur(10px) !important; color: #fff !important; text-shadow: none !important; }
  #npHud #npActivePet #nppPetInfo .nppSub .nppG.gF { color: #ffb3d9 !important; text-shadow: none !important; }
  #npHud #npActivePet #nppPetInfo .nppSub .nppG.gM { color: #a8d4ff !important; text-shadow: none !important; }
  #npHud #npActivePet #nppPetInfo .nppTitle .nppCopy { position: static !important; flex: 0 0 auto !important; }
  #npHud #npActivePet:hover #nppPetInfo .nppSub, #npHud #npActivePet:focus-within #nppPetInfo .nppSub, #npHud #npActivePet:hover #nppPetInfo .nppTitle .nppCopy, #npHud #npActivePet:focus-within #nppPetInfo .nppTitle .nppCopy { opacity: 1 !important; transform: none !important; }
  #npHud #npActivePet.npp-name-dark #nppPetInfo .nppTitle a, #npHud #npActivePet.npp-name-dark #nppPetInfo .nppName, #npHud #npActivePet.npp-name-dark #nppPetInfo .nppTitle .nppCopy { color: #1c1830 !important; text-shadow: none !important; }
  #npHud #npActivePet #nppPetInfo .nppTitle a, #npHud #npActivePet #nppPetInfo .nppName, #npHud #npActivePet #nppPetInfo .nppTitle .nppCopy { transition: opacity .15s; }
  #npHud #npActivePet.npp-tone-pending #nppPetInfo .nppTitle a, #npHud #npActivePet.npp-tone-pending #nppPetInfo .nppName, #npHud #npActivePet.npp-tone-pending #nppPetInfo .nppTitle .nppCopy { opacity: 0 !important; }
  #npHud #npActivePet.npp-name-light #nppPetInfo .nppTitle a, #npHud #npActivePet.npp-name-light #nppPetInfo .nppName, #npHud #npActivePet.npp-name-light #nppPetInfo .nppTitle .nppCopy { color: #fff !important; text-shadow: 0 1px 3px rgba(0,0,0,.85), 0 1px 1px rgba(0,0,0,.6) !important; }
  #npHud #npActivePet #nppPetInfo .nppStats { box-sizing: border-box !important; width: 100% !important; margin: 0 !important; }
  #npHud #npActivePet #nppPetInfo .nppStats.open { padding: 10px 0 var(--pn-pad, 12px) !important; }
  #npHud #npActivePet #nppPetInfo .nppStatsBody, #npHud #npActivePet #nppPetInfo .nppStatsBody .nppDetails { box-sizing: border-box !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
  #npHud #npActivePet #nppPetInfo .nppStatsBody .nppDetails { display: flex !important; flex-direction: column !important; gap: 6px !important; }
  #npHud #npActivePet #nppPetInfo .nppStatsBody .nppStat { box-sizing: border-box !important; width: 100% !important; display: flex !important; justify-content: space-between !important; align-items: center !important; gap: 8px !important; margin: 0 !important; padding: 5px 10px !important; line-height: 1.3 !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppStatsBody .nppStat { background: rgba(0,0,0,.08) !important; text-shadow: none !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppStatsBody .nppStat span { color: rgba(28,24,48,.68) !important; text-shadow: none !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppStatsBody .nppStat b { color: #1c1830 !important; text-shadow: none !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppStatsBody .nppStat b.gF { color: #c2377e !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppStatsBody .nppStat b.gM { color: #2f6fc4 !important; }
  &.npp-side-light #npHud #nppListsMod .nppLt { background: #fff !important; box-shadow: 0 1px 3px rgba(40,30,80,.08) !important; }
  &.npp-side-light #npHud #nppListsMod .nppLt:hover { background: #f3f0fa !important; }
}`;

  const NC_CSS = `
html[data-np-modern-interface] {
  --np-col-width: 0px !important;
  --np-bar-inset-left: 0px !important;
  #npHud, #npLeftBar, #btnOverlay, #npxSideBtnHost, #qrDockWrap, #nppFoot, #npHudResizer, #npBgHandle, #npBgSidebar,
  .navsub-left__2020, .navsub-right__2020 { display: none !important; }
}`;

  const BAR_STYLES = ['none', 'tint', 'blur', 'solid'];
  function applyAccentContrast(hexIn) {
    let hex = hexIn || '';
    try { if (!hex) hex = NQ.getAccent() || LSget('npqol_accent_v1'); } catch {}
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) { rs.setProperty('--npp-accent-fg', '#1a1330'); rs.setProperty('--npp-accent-fg-shadow', 'none'); return; }
    const n = parseInt(m[1], 16);
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
    const white = (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.059);
    rs.setProperty('--npp-accent-fg', white ? '#ffffff' : '#1a1330');
    rs.setProperty('--npp-accent-fg-shadow', white ? '0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6)' : 'none');
  }
  function applySearchContrast() {
    const style = root.dataset.nppBar || 'blur';
    let hex = '';
    try {
      if (style === 'none') hex = NQ.getAccent() || LSget('npqol_accent_v1');
      else hex = LSget('npp_color_head') || DEF.head;
    } catch {}
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    let white = true;
    if (m) {
      const n = parseInt(m[1], 16), k = style === 'none' ? 0.34 : 0.28;
      const lt = (v) => v * (1 - k) + 255 * k;
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const L = 0.2126 * lin(lt((n >> 16) & 255)) + 0.7152 * lin(lt((n >> 8) & 255)) + 0.0722 * lin(lt(n & 255));
      white = L <= 0.38;
    }
    rs.setProperty('--npp-search-fg-auto', white ? '#ffffff' : '#000000');
    rs.setProperty('--npp-search-ts-auto', white ? '0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6)' : 'none');
    rs.setProperty('--npp-search-icon-filter', white ? 'drop-shadow(0 1px 2px rgba(0,0,0,.8))' : 'none');
  }
  function applyLogo() { rs.setProperty('--npp-logo-filter', LSget('npp_logo_white') === '1' ? 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.35))' : 'none'); }
  const applyBarStyle = (v) => { root.dataset.nppBar = BAR_STYLES.includes(v) ? v : 'blur'; applySearchContrast(); try { applyNavContrast(); } catch {} };
  const BAR_CSS = `
html[data-np-modern-interface][data-npp-bar="none"] {
  --np-bar-bg: transparent !important; --np-bar-backdrop: none !important; --np-bar-line: transparent !important; --np-bar-shadow: none !important;
  --npp-nav-shadow: 0 1px 2px rgba(0,0,0,.6), 0 2px 8px rgba(0,0,0,.45);
  --npp-nav-stroke: 3.5px rgba(46,34,62,.92);
  --npp-nav-icon-filter: drop-shadow(0 0 1.5px rgba(46,34,62,.9)) drop-shadow(0 2px 4px rgba(0,0,0,.35));
  --npp-search-bg: color-mix(in srgb, var(--np-accent, #fff) 66%, #fff); --npp-search-bg-h: color-mix(in srgb, var(--np-accent, #fff) 56%, #fff); --npp-search-bg-f: color-mix(in srgb, var(--np-accent, #fff) 50%, #fff);
  --npp-search-line: color-mix(in srgb, var(--np-accent, #fff) 58%, #000); --npp-search-line-h: color-mix(in srgb, var(--np-accent, #fff) 50%, #000); --npp-search-line-f: color-mix(in srgb, var(--np-accent, #fff) 45%, #000);
  --npp-search-ring: color-mix(in srgb, var(--np-accent, #fff) 55%, transparent);
  --npp-search-shadow: inset 0 1px 2px rgba(0,0,0,.14), 0 1px 0 rgba(255,255,255,.45);
  --npp-menu-lift: -2px; --npp-menu-caret: block; --npp-menu-radius: 16px;
}
html[data-np-modern-interface][data-npp-bar="tint"] {
  --np-bar-bg: linear-gradient(180deg, var(--npp-head-a-tint, #ff8a1fb3), var(--npp-head-b-tint, #b86316b3)) !important;
  --np-bar-backdrop: none !important; --np-bar-line: rgba(255,255,255,.16) !important; --np-bar-shadow: 0 2px 10px rgba(0,0,0,.16) !important;
}
html[data-np-modern-interface][data-npp-bar="blur"] {
  --np-bar-bg: linear-gradient(180deg, var(--npp-head-a-blur, #ff8a1f8c), var(--npp-head-b-blur, #b863168c)) !important;
  --np-bar-backdrop: blur(16px) saturate(1.35) !important; --np-bar-line: rgba(255,255,255,.26) !important; --np-bar-shadow: 0 4px 22px rgba(0,0,0,.18) !important;
}
html[data-np-modern-interface][data-npp-bar="solid"] {
  --np-bar-bg: linear-gradient(180deg, var(--npp-head-a-solid, #ff8a1f), var(--npp-head-b-solid, #b86316)) !important;
  --np-bar-backdrop: none !important; --np-bar-line: rgba(255,255,255,.18) !important; --np-bar-shadow: 0 4px 18px rgba(0,0,0,.28) !important;
}`;

  const SHADOW_CSS = `
@font-face { font-family: 'CafeteriaBlack'; src: url('https://images.neopets.com/js/fonts/cafeteria-black.otf') format('opentype'); font-display: swap; }
.npp-clock { position: absolute; top: 50%; right: calc(14px + var(--npp-ic, 44px) * 2 + var(--npp-ig, 10px) + 12px); transform: translateY(-50%); z-index: 2; font: 400 20px/1 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .02em; color: var(--npp-nav-fg, #fff) !important; text-shadow: var(--npp-nav-shadow, 0 1px 3px rgba(0,0,0,.55), 0 1px 1px rgba(0,0,0,.4)) !important; pointer-events: none; white-space: nowrap; transition: opacity .15s ease; }
:host(.npp-search-open) .npp-clock { opacity: 0; }
#menu-premium { max-height: calc(100vh - 100px); overflow-x: hidden !important; overflow-y: auto !important; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.35) transparent; }
.menu a .npp-cd { margin-left: auto; padding: 2px 8px; border-radius: 9px; background: rgba(255,255,255,.16); color: #fff; font: normal 700 11px/1.3 'Outfit', system-ui, sans-serif; white-space: nowrap; }
.menuHead { position: sticky; top: -8px; z-index: 1; margin: 0 -8px; padding: 9px 20px 4px; background: rgba(14,12,22,.55); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); font: 700 10px/1 'Outfit', system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.5); }
#menu-premium::-webkit-scrollbar { width: 8px; }
#menu-premium::-webkit-scrollbar-thumb { background: rgba(255,255,255,.3); border-radius: 4px; }
.npp-search { position: absolute; right: 60px; top: 50%; transform: translateY(-50%); z-index: 2; width: 34px; height: 34px; margin: 0; pointer-events: auto; transition: width .45s cubic-bezier(.22, 1, .36, 1); }
.npp-search:hover, .npp-search:focus-within { width: 232px; }
.npp-search input { box-sizing: border-box; width: 100%; height: 34px; padding: 0 16px 0 40px; border: 1px solid transparent; border-radius: 999px; background: transparent; box-shadow: none; color: var(--npp-search-fg-auto, #fff); font: 400 17px 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .02em; text-shadow: var(--npp-search-ts-auto, 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6)); outline: 0; cursor: pointer; text-overflow: clip; transition: background .3s, border-color .3s, box-shadow .3s; }
.npp-search:hover input, .npp-search:focus-within input { cursor: text; border-color: var(--npp-search-line, rgba(0,0,0,.3)); background: var(--npp-search-bg, rgba(255,255,255,.28)); box-shadow: var(--npp-search-shadow, inset 0 1px 2px rgba(0,0,0,.16), 0 1px 0 rgba(255,255,255,.3)); }
.npp-search input:focus { background: var(--npp-search-bg-f, rgba(255,255,255,.42)); border-color: var(--npp-search-line-f, rgba(0,0,0,.42)); box-shadow: inset 0 1px 2px rgba(0,0,0,.14), 0 0 0 3px var(--npp-search-ring, rgba(255,255,255,.35)), 0 4px 14px rgba(0,0,0,.18); }
.npp-search input::placeholder { color: var(--npp-search-fg-auto, #fff); text-shadow: var(--npp-search-ts-auto, 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6)); opacity: 0; transition: opacity .12s; }
.npp-search:hover input::placeholder, .npp-search:focus-within input::placeholder { opacity: 1; transition: opacity .3s .2s; }
.npp-search button { position: absolute; z-index: 1; left: 2px; top: 50%; transform: translateY(-50%); width: 30px; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: transparent; cursor: pointer; }
.npp-search button img { width: 30px; height: 30px; display: block; filter: var(--npp-nav-icon-filter, drop-shadow(0 1px 2px rgba(0,0,0,.3))); transition: transform .35s cubic-bezier(.22, 1, .36, 1); }
.npp-search:hover button img, .npp-search:focus-within button img { transform: scale(.82); }
.npp-premcaret { display: none; position: absolute; z-index: 6; width: 12px; height: 12px; transform: rotate(45deg); background: rgba(40,36,52,.92); border-left: 1px solid rgba(255,255,255,.2); border-top: 1px solid rgba(255,255,255,.2); pointer-events: none; }
#menu-premium::before { content: none; }
.npp-prembg { display: none; position: absolute; overflow: hidden; box-sizing: border-box; border-radius: var(--npp-menu-radius, 0 0 16px 16px); pointer-events: none; }
.npp-prembg::before { content: ""; position: absolute; inset: -24px; background: linear-gradient(rgba(14,12,22,.38), rgba(14,12,22,.38)), var(--npLeftBarImg, none) center / cover no-repeat, var(--npLeftBarSolid, #2a292e); filter: blur(14px) saturate(1.15); }
.npp-logo { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); z-index: 2; display: flex; align-items: center; text-decoration: none; pointer-events: auto; }
.npp-logo img { height: 43px; max-width: 215px; display: block; filter: var(--npp-logo-filter, none); }
.npp-logo span { display: none; font: 400 32px 'CafeteriaBlack', Georgia, serif; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.8); }
.npp-logo.txt span { display: inline; }
.np-menu-edit-btn { position: relative; display: flex; align-items: center; justify-content: flex-start; gap: 8px; box-sizing: border-box; width: 100%; height: auto; margin: 6px 0 0; padding: 9px 14px 5px; border: 0; border-top: 1px solid rgba(255,255,255,.14); border-radius: 0; background: transparent; color: rgba(255,255,255,.78); font: 600 13px/1 'Outfit', system-ui, sans-serif; text-shadow: 0 1px 3px rgba(0,0,0,.85); cursor: pointer; transition: color .15s; }
.np-menu-edit-btn svg { width: 13px; height: 13px; flex: none; filter: drop-shadow(0 1px 2px rgba(0,0,0,.7)); }
.np-menu-edit-btn:hover, .np-menu-edit-btn.active { color: #fff; }
.np-menu-edit-btn:hover span { text-decoration: underline; text-underline-offset: 3px; }
.npp-tabs { display: flex; gap: 4px; margin-bottom: 6px; padding: 3px; border-radius: 11px; background: rgba(255,255,255,.08); }
.npp-tabs button { flex: 1; height: 30px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: rgba(255,255,255,.7); font: 400 18px 'CafeteriaBlack', Georgia, serif; cursor: pointer; transition: background .15s, color .15s; }
.npp-tabs button:hover { background: rgba(255,255,255,.14); color: #fff; }
#menu-shop[data-tab="np"] .npp-tabs [data-t="np"], #menu-shop[data-tab="nc"] .npp-tabs [data-t="nc"] { background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1330); text-shadow: var(--npp-accent-fg-shadow, none); }
#menu-shop[data-tab="np"] [data-g="nc"], #menu-shop[data-tab="nc"] [data-g="np"], #menu-shop .menuSep { display: none !important; }
.menu a.nppSnowRow svg { width: 22px; height: 22px; flex: none; color: #bfe3ff; }
.nppSnowBadge { margin-left: auto; padding: 2px 8px; border-radius: 9px; background: rgba(255,255,255,.16); color: #fff; font: normal 700 11px/1.3 'Outfit', system-ui, sans-serif; white-space: nowrap; font-variant-numeric: tabular-nums; }
.nppSnowBadge.asleep { background: #22b45a; }
.nppSnowBadge.ready { background: #f0a020; color: #2a1a00; }
.nppMainHint { padding: 2px 12px 4px; font: 500 11px/1.35 'Outfit', system-ui, sans-serif; color: rgba(255,255,255,.62); }
.menu a.nppMainRow { cursor: pointer; }
.menu a.nppMainRow span { font-size: 15px !important; }
.nppAlertRow svg { color: #ffd27a !important; }
.btn.npp-alert-on::after { content: ""; position: absolute; top: 6px; left: 37px; width: 9px; height: 9px; border-radius: 50%; background: #2fd873; box-shadow: 0 0 0 2px rgba(255,255,255,.92), 0 1px 3px rgba(0,0,0,.35); pointer-events: none; z-index: 1; }
@media (max-width: 1500px) { .btn.npp-alert-on::after { left: 29px; } }
@media (max-width: 1250px) { .btn.npp-alert-on::after { left: 26px; } }
@media (max-width: 900px) { :host(:not(.nppHam)) .inner { padding-left: 12px !important; padding-right: 12px !important; } :host(:not(.nppHam)) .npp-logo { display: none; } }
@media (max-width: 1100px) {
  :host(.nppHam) .npp-clock { display: none !important; }
  :host(.nppHam) .inner { padding-left: 206px !important; padding-right: 126px !important; }
  :host(.nppHam) .npp-logo { display: flex; left: 58px; }
  :host(.nppHam) .npp-logo img { height: 34px; max-width: clamp(80px, calc(100vw - 200px), 140px); }
  :host(.nppHam) .btn { padding: 8px 5px !important; }
}
@media (max-width: 950px) {
  :host(.nppHam) .btn:has(img) span { display: none !important; }
  :host(.nppHam) .left { gap: 0 !important; }
}
@media (max-width: 820px) {
  :host(.nppHam) .inner { padding-left: 164px !important; padding-right: 118px !important; }
  :host(.nppHam) .npp-logo img { max-width: 96px; }
  :host(.nppHam) .btn { padding: 8px 3px !important; }
}
@media (max-width: 640px) {
  :host(.nppHam) .left { display: none !important; }
  :host(.nppHam) .inner { padding-left: 0 !important; padding-right: 0 !important; }
}
@media (max-width: 420px) { :host(.nppHam) .npp-logo img { max-width: clamp(70px, calc(100vw - 190px), 110px); } }
`;

  const EDITOR_CSS = `
.tab { left: calc((var(--np-col-width, 240px) + 100%) / 2) !important; width: 44px !important; height: 16px !important; border-radius: 12px 12px 0 0 !important; color: #fff; opacity: 0; transition: opacity .15s, background .12s !important; }
.tab.show, .tab:hover { opacity: 1; }
.tab svg { width: 12px; height: 12px; display: block; transform: rotate(180deg); transition: transform .15s; }
.tab.isOpen svg { transform: none; }
.tab { background: #1a1722 !important; border-color: rgba(255,255,255,.14) !important; }
.tab:hover { background: #26222f !important; }
.panel.open { box-shadow: 0 -6px 36px rgba(0,0,0,.16) !important; }
.panel { background: #1a1722 !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; border-color: rgba(255,255,255,.14) !important; }
.head .grp { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.18); padding: 4px 8px; }
.head .grpLbl { color: rgba(255,255,255,.92); font-size: 10px; letter-spacing: .08em; }
.head button { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.3); color: #fff; }
.head button:hover { background: rgba(255,255,255,.22); border-color: rgba(255,255,255,.4); }
.head .stepVal { background: transparent; border: 0; color: #fff; font-size: 12px; }
.head .stepVal:hover { background: rgba(255,255,255,.14); }
.head .close { background: transparent; border: 0; color: rgba(255,255,255,.75); }
.head .close:hover { color: #fff; background: rgba(255,255,255,.14); }
.modeSeg { background: rgba(0,0,0,.3); border-color: rgba(255,255,255,.18); }
.modeSeg .modeBtn { background: transparent; border: 0; color: rgba(255,255,255,.7); }
.modeSeg .modeBtn:hover { background: rgba(255,255,255,.14); color: #fff; }
.modeSeg .modeBtn.isOn { background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1722); box-shadow: none; }
.body { align-content: start; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.3) transparent; }
.modeNote { margin: 0; padding: 8px 12px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.16); color: rgba(255,255,255,.82); font-size: 11px; font-weight: 500; line-height: 1.4; }
.col { border-color: rgba(255,255,255,.14); border-radius: 12px; }
.item { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.16); }
.item:hover { background: rgba(255,255,255,.12); }
.item .lbl { color: #fff; font-size: 13px; font-weight: 600; }
.iconBtnMini, .iconBtnMini.dim { background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.28); color: rgba(255,255,255,.88); opacity: 1; }
.iconBtnMini:hover { background: rgba(255,255,255,.26); color: #fff; }
.iconBtnMini.del:hover { background: #ff5a5a; border-color: transparent; color: #fff; }
.add select { height: 34px; background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.3); color: #fff; font-size: 13px; }
.add select option { background: #1a1722; color: #fff; }
.add button { height: 34px; background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1722); border-color: transparent; font-size: 12px; text-shadow: var(--npp-accent-fg-shadow, none); }
.add button:hover { background: var(--np-accent, #fff); filter: brightness(1.06); }
.panel { width: 420px !important; max-width: 96vw !important; height: auto !important; max-height: min(470px, 78vh) !important; }
.head .grp, .modeNote, .col[data-side="right"], .item [data-act="swap"] { display: none !important; }
.head { align-items: center; gap: 8px; padding: 12px 14px 10px; border-bottom: 1px solid rgba(255,255,255,.1); }
.head::before { content: 'Shortcut icons'; margin-right: auto; font: 700 13px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.92); }
.body { grid-template-columns: 1fr !important; gap: 0; }
.col { background: transparent; border: 0; padding: 0; }
.items { gap: 5px; height: 340px !important; overflow-y: scroll; }
.item { grid-template-columns: 28px minmax(0, 1fr) auto auto auto !important; padding: 4px 8px; }
.nppNestBtn { width: 24px; height: 24px; padding: 0; border-radius: 8px; font-size: 14px; line-height: 1; cursor: pointer; }
.nppNestBtn.on { background: var(--np-accent, #fff) !important; color: var(--npp-accent-fg, #1a1722) !important; border-color: transparent !important; }
.nppNestBtn:disabled { opacity: .35; cursor: default; }
.item.nppNested { margin-left: 22px; opacity: .88; }
.item.nppParent .lbl::after { content: ' ▸'; opacity: .7; }
.panel.open .body { padding: 14px 18px 0 !important; }
.nppNestHint { display: none !important; margin-top: 10px; padding: 8px 12px; border: 1px solid rgba(255,255,255,.16); border-radius: 10px; background: rgba(255,255,255,.06); color: rgba(255,255,255,.8); font: 500 11px/1.4 'Outfit', system-ui, sans-serif; }
.item .lbl { text-align: left; }
.panel { bottom: 0 !important; border-bottom: 0 !important; border-radius: 16px 16px 0 0 !important; }
.body { padding: 14px 18px 24px; }
.add { margin-top: 14px; position: sticky !important; bottom: 0 !important; z-index: 3; margin: 14px -18px 0 !important; padding: 12px 18px 18px !important; background: #1a1722 !important; border-top: 1px solid rgba(255,255,255,.1); box-shadow: 0 -12px 14px -8px rgba(0,0,0,.4); }
.panel { left: calc((var(--np-col-width, 240px) + 100%) / 2) !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }
.head { flex: none; }
.body { flex: 1 1 auto !important; min-height: 0 !important; overflow-y: auto !important; overscroll-behavior: contain; }
.tab.isOpen { opacity: 0 !important; pointer-events: none; }
.nppSizeGrp { display: flex; align-items: center; gap: 4px; padding: 3px 7px; border-radius: 9px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.18); }
.nppSizeGrp .nppSizeLbl { font: 700 9px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.7); margin-right: 3px; }
.nppSizeGrp button { width: 22px; height: 22px; padding: 0; border-radius: 6px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.28); color: #fff; font: 700 14px/1 system-ui, sans-serif; cursor: pointer; }
.nppSizeGrp button:hover { background: rgba(255,255,255,.26); }
.nppSizeGrp .nppSizeVal { min-width: 44px; text-align: center; font: 700 11px/1 'Outfit', system-ui, sans-serif; color: #fff; font-variant-numeric: tabular-nums; }
`;

  const darken = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * f).toString(16).padStart(2, '0')).join('');
  };
  const hasImg = (side) => !!LSget(side === 'main' ? K.mainImg : K.leftImg);
  const saved = () => ({ main: LSget(K.main) || null, left: LSget(K.left) || null, head: LSget(K.head) || null });

  function paintMain(c) {
    if (c === null && hasImg('main')) return;
    rs.setProperty('--npWallImage', 'none');
    rs.setProperty('--npMainSolid', c || DEF.main);
  }
  function paintLeft(c) {
    if (c === null && hasImg('left')) return;
    rs.setProperty('--npLeftBarImg', 'none');
    rs.setProperty('--npLeftBarSolid', c || DEF.left);
    rs.setProperty('--npLeftBarShadeA', '0');
  }
  function paintHead(c) {
    const h = c || DEF.head, d = darken(h, .72);
    rs.setProperty('--npp-head-a', h + HEAD_ALPHA);
    rs.setProperty('--npp-head-b', d + HEAD_ALPHA);
    try { applySearchContrast(); } catch {}
    lastHeadHex = h; try { applyNavContrast(); } catch {}
    [['solid', 'ff'], ['tint', 'b3'], ['blur', '8c']].forEach(([k, a]) => {
      rs.setProperty('--npp-head-a-' + k, h + a);
      rs.setProperty('--npp-head-b-' + k, d + a);
    });
  }
  const painters = { main: paintMain, left: paintLeft, head: paintHead };
  const paintAll = (s) => { paintMain(s.main); paintLeft(s.left); paintHead(s.head); };

  let lastHeadHex = DEF.head;
  function applyNavContrast() {
    const mode = root.dataset.nppBar || 'blur', m = /^#?([0-9a-f]{6})/i.exec(String(lastHeadHex || ''));
    let light = false;
    if (m && mode !== 'none') {
      const n = parseInt(m[1], 16), lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      light = (0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)) >= 0.72;
    }
    const vars = { '--npp-nav-fg': '#111827', '--npp-nav-shadow': 'none', '--npp-nav-hover': 'rgba(0,0,0,.08)', '--npp-nav-ring': 'rgba(0,0,0,.14)' };
    Object.keys(vars).forEach(k => light ? rs.setProperty(k, vars[k]) : rs.removeProperty(k));
  }
  let draft = saved(), clearImg = { main: false, left: false }, saving = false;
  let pendingImg = { main: null, left: null };
  let accentPick = null, accentBase = '', ownAccent = false;

  function commit() {
    ['main', 'left'].forEach(k => { if (draft[k] !== null || clearImg[k]) LSset(k === 'main' ? K.mainImg : K.leftImg, ''); });
    ['main', 'left', 'head'].forEach(k => draft[k] === null ? LSdel(K[k]) : LSset(K[k], draft[k]));
    if (pendingImg.main) LSset(K.mainImg, pendingImg.main);
    if (pendingImg.left) LSset(K.leftImg, pendingImg.left);
    if (accentPick) {
      LSset('npqol_accent_v1', accentPick);
      try { ownAccent = true; NQ.applyAccent(accentPick); } catch {} finally { ownAccent = false; }
      applyAccentContrast(accentPick); applySearchContrast();
    }
  }

  const QUICK_PRESETS = {
    default:  { main: '#ffffff', left: '#2a292e', head: '#ff8a1f', accent: '#ff8a1f' },
    dark:     { main: '#121015', left: '#1a1722', head: '#2a2433', accent: '#dcb8ff' },
    contrast: { main: '#000000', left: '#000000', head: '#ffff00', accent: '#ffff00' },
  };

  function injectPicker(sb) {
    const anchor = $('.npBgSearch', sb);
    if (!anchor || $('#nppColors')) return;
    const row = document.createElement('div');
    row.id = 'nppColors';
    row.innerHTML = '<div class="npSmall">Colors</div>'
      + '<div class="nppPresets"><button type="button" data-preset="default">Default</button><button type="button" data-preset="dark">Dark</button><button type="button" data-preset="contrast">High contrast</button></div>'
      + `<div class="nppRow nppAccRow"><input type="color" data-acc="1" title="Accent colour"><span>Accent</span><button type="button" data-accreset="1" title="Reset to the default accent">Reset</button></div>`
      + [['main', 'Background'], ['left', 'Sidebar'], ['head', 'Header']].map(([k, l]) =>
      `<div class="nppRow"><span>${l}</span><input type="color" data-k="${k}"><button type="button" data-r="${k}" title="Reset to default (also removes its image)">Reset</button></div>`).join('')
      + '<label class="nppShareRow"><input type="checkbox" data-share="1"><span>Share theme on all accounts</span></label>'
      + '<div class="nppRow nppLogoRow"><i class="nppLogoDot"></i><span>Logo</span><div class="nppSeg"><button type="button" data-logo="0">Black</button><button type="button" data-logo="1">White</button></div></div>'
      + '<div class="nppRow nppLogoRow nppSideRow"><i class="nppLogoDot"></i><span>Sidebar style</span><div class="nppSeg"><button type="button" data-side="0">Dark</button><button type="button" data-side="1">Light</button></div></div>';
    anchor.before(row);
    const curAccent = () => { let a = ''; try { a = NQ.getAccent() || LSget('npqol_accent_v1') || ''; } catch {} return /^#[0-9a-f]{6}$/i.test(a) ? a : NP_ORANGE; };
    const setAccent = (hex) => {
      if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
      try { ownAccent = true; NQ.applyAccent(hex); } catch {} finally { ownAccent = false; }
      accentPick = hex;
      applyAccentContrast(hex); applySearchContrast();
      sync();
    };
    const sync = () => {
      const ai = row.querySelector('input[data-acc]'); if (ai) ai.value = curAccent();
      const sh = row.querySelector('input[data-share]'); if (sh) sh.checked = themeShared();
      row.querySelectorAll('input[data-k]').forEach(i => { i.value = draft[i.dataset.k] || DEF[i.dataset.k]; });
      const lw = LSget('npp_logo_white') === '1' ? '1' : '0';
      row.querySelectorAll('[data-logo]').forEach(b => b.classList.toggle('on', b.dataset.logo === lw));
      const lr = row.querySelector('.nppLogoRow'); if (lr) lr.dataset.logo = lw;
      const sl = document.documentElement.classList.contains('npp-side-light') ? '1' : '0';
      row.querySelectorAll('[data-side]').forEach(x => x.classList.toggle('on', x.dataset.side === sl));
    };
    row.addEventListener('click', (e) => {
      const sb = e.target.closest && e.target.closest('[data-side]'); if (!sb) return;
      const on = sb.dataset.side === '1';
      document.documentElement.classList.toggle('npp-side-light', on);
      LSset('npp_side_light', on ? '1' : '0'); sync();
    });
    row._sync = sync;
    sync();
    row.addEventListener('change', (e) => {
      if (!(e.target.dataset && e.target.dataset.share !== undefined)) return;
      LSset('npp_theme_shared', e.target.checked ? '1' : '0');
      if (!e.target.checked) {
        const base = JSON.stringify(readTheme());
        try { allAccts().forEach(n => { if (!LSget('npp_theme_' + n)) LSset('npp_theme_' + n, base); }); } catch {}
        try { const u = curUser(); if (u) LSset('npp_theme_' + u, base); } catch {}
      }
    });
    row.addEventListener('input', (e) => {
      if (e.target.dataset && e.target.dataset.acc !== undefined) { setAccent(e.target.value); return; }
      const k = e.target.dataset && e.target.dataset.k;
      if (!k) return;
      draft[k] = e.target.value;
      painters[k](draft[k]);
    });
    row.addEventListener('click', (e) => {
      const pre = e.target.dataset && e.target.dataset.preset;
      if (pre) {
        const P = QUICK_PRESETS[pre];
        if (!P) return;
        ['main', 'left', 'head'].forEach(k => { draft[k] = P[k]; painters[k](P[k]); });
        clearImg = { main: true, left: true };
        setAccent(P.accent);
        sync();
        return;
      }
      if (e.target.closest && e.target.closest('[data-accreset]')) { setAccent(NP_ORANGE); return; }
      const lg = e.target.dataset && e.target.dataset.logo;
      if (lg !== undefined) { LSset('npp_logo_white', lg === '1' ? '1' : '0'); applyLogo(); sync(); return; }
      const k = e.target.dataset && e.target.dataset.r;
      if (!k) return;
      draft[k] = null;
      if (k !== 'head') clearImg[k] = true;
      painters[k](k === 'head' ? null : DEF[k]);
      sync();
    });
  }

  const DTI_URL = 'https://impress-2020.openneo.net/api/graphql';
  const DTI_Q = 'query SearchBgs($query: String!, $offset: Int!, $limit: Int!) { itemSearch(query: $query, offset: $offset, limit: $limit) { items { id name thumbnailUrl appearanceOn(speciesId: 1, colorId: 8) { layers { id zone { id label } imageUrl(size: SIZE_600) } } } } }';
  const dtiPage = (offset, query = 'background', limit = 30) => new Promise((resolve, reject) => {
    if (typeof GM_xmlhttpRequest !== 'function') { reject(new Error('GM_xmlhttpRequest unavailable')); return; }
    GM_xmlhttpRequest({
      method: 'POST', url: DTI_URL, timeout: 20000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      data: JSON.stringify({ query: DTI_Q, variables: { query, offset, limit } }),
      onload: (r) => {
        try {
          const j = JSON.parse(r.responseText);
          if (j.errors && j.errors.length) { reject(new Error(j.errors[0].message || 'GraphQL error')); return; }
          resolve(((j.data || {}).itemSearch || {}).items || []);
        } catch (e) { reject(e); }
      },
      onerror: () => reject(new Error('network')), ontimeout: () => reject(new Error('timeout')),
    });
  });
  const BG_SKIP = [/altador cup/i, /advent/i, /birthday|anniversar|\b\d+[- ]?years?\b/i];
  async function discoverBgs() {
    let end = parseInt(LSget('npp_disc_end'), 10) || 0;
    const seenOff = new Set(), seenId = new Set(), got = [];
    for (let attempt = 0; attempt < 10 && got.length < 24; attempt++) {
      const slots = Math.max(1, Math.floor((end ? end : 2400) / 30));
      let off = Math.floor(Math.random() * slots) * 30, g = 0;
      while (seenOff.has(off) && g++ < 12) off = Math.floor(Math.random() * slots) * 30;
      seenOff.add(off);
      const items = await dtiPage(off);
      if (items.length < 30) { end = off + items.length; LSset('npp_disc_end', String(end)); }
      items.forEach((it) => {
        const layers = ((it.appearanceOn || {}).layers) || [];
        const layer = layers.find(l => ((l.zone || {}).label || '').toLowerCase().includes('background')) || layers[0];
        const url = layer && layer.imageUrl;
        const id = String(it.id);
        if (!url || seenId.has(id) ||BG_SKIP.some(re => re.test(it.name || ''))) return;
        seenId.add(id);
        got.push({ id, name: it.name || 'Background', thumb: it.thumbnailUrl || url, url });
      });
    }
    for (let i = got.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [got[i], got[j]] = [got[j], got[i]]; }
    return got.slice(0, 30);
  }
  const cssUrl = (u) => `url("${String(u).replace(/["\\\n\r]/g, '')}")`;

  function wireSidebar() {
    const sb = $('#npBgSidebar'), h = $('#npBgHandle');
    if (!sb || !h || sb.dataset.npp) return;
    sb.dataset.npp = '1';
    handleEl = h;
    h.innerHTML = CHEV;
    injectPicker(sb);
    const barSel = $('#npTopbarBg', sb);
    if (barSel) barSel.addEventListener('change', () => applyBarStyle(barSel.value));
    const rb = $('#npRecolorSite', sb);
    if (rb) rb.title = 'Turn Neopets’ built-in gold buttons, tabs and bars into your accent color';
    const bgList = $('#npBgList', sb), bgQuery = $('#npBgQuery', sb), bar = $('.npBgSearch', sb);
    let runShuffle = () => {};
    if (bgList && bgQuery && bar) {
      const HIDE_RULES = [
        [/altador cup/i, /altador|cup/i],
        [/advent/i, /advent/i],
        [/birthday|anniversar|\b\d+[- ]?years?\b/i, /birthday|anniversar|year|\d+(st|nd|rd|th)/i],
      ];
      const dbar = document.createElement('div');
      dbar.id = 'nppDiscBar'; dbar.hidden = true;
      dbar.innerHTML = '<span id="nppDiscMsg"></span>';
      bar.after(dbar);
      const dmsg = $('#nppDiscMsg', dbar);
      const SHUFFLE_MSG = 'Random selection · click Shuffle again for more';
      const busyOn = (msg) => { bgList.classList.add('nppFetching'); dbar.classList.add('loading'); dbar.hidden = false; dmsg.textContent = msg; };
      const busyOff = () => { bgList.classList.remove('nppFetching'); dbar.classList.remove('loading'); };
      const safeUrl = (u) => String(u || '').replace(/["'\\\n\r]/g, '');
      let lastShuffle = [];
      const renderDisc = (items) => {
        bgList.innerHTML = items.map((it, i) =>
          `<div class="npBgItem nppRowIn" style="--i:${i}"><div class="npBgThumb" style="background-image:url('${safeUrl(it.thumb)}')"></div><div class="npBgName" title="${esc(it.name)}">${esc(it.name)}</div>` +
          `<button type="button" class="npBgBtn npBgL" data-url="${esc(it.url)}" title="Use on LEFT decor column">L</button>` +
          `<button type="button" class="npBgBtn npBgR" data-url="${esc(it.url)}" title="Use as MAIN background">M</button></div>`).join('');
        bgList.scrollTop = 0;
      };
      bgList.addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('.npBgBtn');
        if (!b) return;
        e.preventDefault(); e.stopPropagation();
        const url = b.dataset.url, isMain = b.classList.contains('npBgR'), k = isMain ? 'main' : 'left';
        draft[k] = null; clearImg[k] = false; pendingImg[k] = url;
        if (isMain) { rs.setProperty('--npMainSolid', '#000'); rs.setProperty('--npWallImage', cssUrl(url)); }
        else { rs.setProperty('--npLeftBarImg', cssUrl(url)); rs.setProperty('--npLeftBarSolid', '#000'); rs.setProperty('--npLeftBarShadeA', '1'); }
        bgList.querySelectorAll(isMain ? '.npBgR' : '.npBgL').forEach(x => x.classList.toggle('isActive', x === b));
      });
      const KW_MAX = 100, kwEnd = {};
      let kwToken = 0, kwTimer = 0;
      const bgFromItem = (it, q) => {
        const layer = (((it.appearanceOn || {}).layers) || []).find(l => ((l.zone || {}).label || '').toLowerCase().includes('background'));
        if (!layer || !layer.imageUrl) return null;
        const id = String(it.id), name = it.name || 'Background';
        if (HIDE_RULES.some(([nameRe, queryRe]) => nameRe.test(name) && !queryRe.test(q))) return null;
        return { id, name, thumb: it.thumbnailUrl || layer.imageUrl, url: layer.imageUrl };
      };
      async function kwSearch(q, shuffle) {
        const key = q.toLowerCase(), got = [], seen = new Set();
        const take = (items) => items.forEach(it => { const b = bgFromItem(it, q); if (b && !seen.has(b.id)) { seen.add(b.id); got.push(b); } });
        const term = key.includes('background') ? q : q + ' background';
        if (!shuffle) {
          for (let page = 0; page < 6 && got.length < KW_MAX; page++) {
            const items = await dtiPage(page * 30, term, 30);
            take(items);
            if (items.length < 30) { kwEnd[key] = page * 30 + items.length; break; }
          }
          if (got.length < 10 && !key.includes('background')) {
            for (let page = 0; page < 4 && got.length < KW_MAX; page++) { const items = await dtiPage(page * 30, q, 30); take(items); if (items.length < 30) break; }
          }
          return got.slice(0, KW_MAX);
        }
        for (let attempt = 0; attempt < 5 && got.length < KW_MAX; attempt++) {
          const end = kwEnd[key], slots = Math.max(1, Math.ceil((end || 600) / 30)), off = Math.floor(Math.random() * slots) * 30;
          const items = await dtiPage(off, term, 30);
          if (items.length < 30) kwEnd[key] = off + items.length;
          take(items);
          if (kwEnd[key] !== undefined && kwEnd[key] <= 30) break;
        }
        for (let i = got.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [got[i], got[j]] = [got[j], got[i]]; }
        return got.slice(0, KW_MAX);
      }
      const runKw = async (shuffle) => {
        const q = (bgQuery.value || '').trim(), tok = ++kwToken;
        busyOn(`Searching for “${q}”…`);
        try {
          const items = await kwSearch(q, shuffle);
          if (tok !== kwToken) return;
          if (!items.length) { bgList.innerHTML = '<div class="nppDiscEmpty">No backgrounds found for “' + esc(q) + '”.</div>'; dmsg.textContent = `No backgrounds found for “${q}”.`; }
          else { renderDisc(items); dmsg.textContent = `${items.length}${items.length >= KW_MAX ? '+' : ''} for “${q}” · Shuffle for other matches`; }
        } catch (err) { if (tok === kwToken) dmsg.textContent = 'Couldn’t search DTI (' + (err && err.message || 'error') + ')'; }
        finally { if (tok === kwToken) busyOff(); }
      };
      const sh = document.createElement('button');
      sh.type = 'button'; sh.id = 'nppShuffle'; sh.title = 'Shuffle: a fresh random selection of backgrounds'; sh.innerHTML = SHUFFLE;
      bar.appendChild(sh);
      let busyDisc = false;
      runShuffle = async () => {
        if (busyDisc) return;
        busyDisc = true; sh.classList.add('busy'); sh.disabled = true;
        try {
          if (bgQuery.value.trim().length >= 2) { await runKw(true); return; }
          const tok = ++kwToken;
          busyOn('Finding new backgrounds…');
          try {
            const items = await discoverBgs();
            if (tok !== kwToken) return;
            if (!items.length) throw new Error('nothing usable came back');
            lastShuffle = items;
            renderDisc(items);
            dmsg.textContent = SHUFFLE_MSG;
          } catch (err) {
            if (tok === kwToken) dmsg.textContent = 'Couldn’t reach DTI (' + (err && err.message || 'error') + ')';
          } finally { if (tok === kwToken) busyOff(); }
        } finally { busyDisc = false; sh.classList.remove('busy'); sh.disabled = false; }
      };
      sh.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); runShuffle(); });
      bgQuery.addEventListener('input', () => {
        clearTimeout(kwTimer);
        const q = bgQuery.value.trim();
        if (q.length >= 2) { kwTimer = setTimeout(() => runKw(false), 500); return; }
        if (q || busyDisc) return;
        ++kwToken; busyOff();
        if (lastShuffle.length) { renderDisc(lastShuffle); dmsg.textContent = SHUFFLE_MSG; }
        else runShuffle();
      });
      bgQuery.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(kwTimer); if (bgQuery.value.trim().length >= 2) runKw(false); } });
    }
    let wasOpen = false;
    new MutationObserver(() => {
      const open = sb.style.transform.includes('translateX(0');
      if (open && !wasOpen) {
        draft = saved(); clearImg = { main: false, left: false }; saving = false; pendingImg = { main: null, left: null };
        accentPick = null; accentBase = LSget('npqol_accent_v1');
        const r = $('#nppColors'); if (r && r._sync) r._sync();
        if (bgList && !bgList.children.length) runShuffle();
      } else if (!open && wasOpen) {
        if (saving) commit();
        else if (accentPick) {
          try { ownAccent = true; NQ.applyAccent(accentBase || NP_ORANGE); } catch {} finally { ownAccent = false; }
          applyAccentContrast(accentBase || NP_ORANGE); applySearchContrast();
        }
        accentPick = null;
        draft = saved(); saving = false; pendingImg = { main: null, left: null };
        paintAll(draft);
      }
      h.style.visibility = open ? 'hidden' : '';
      wasOpen = open;
    }).observe(sb, { attributes: true, attributeFilter: ['style'] });
  }

  function fixNcNavLinks() {
    if (!isNc) return;
    const sr = shadow();
    if (!sr) return;
    sr.querySelectorAll('a[href]').forEach(a => {
      const h = a.getAttribute('href') || '';
      if (h.startsWith('/') && !h.startsWith('//')) a.setAttribute('href', 'https://www.neopets.com' + h);
    });
  }

  function patchShadow() {
    const sr = shadow();
    if (!sr || sr.getElementById('npp-shadow')) return !!sr;
    const st = document.createElement('style');
    st.id = 'npp-shadow';
    st.textContent = SHADOW_CSS;
    if (/[?&]type=shop\b/i.test(location.search)) st.textContent += '\n.menu { display: none !important; }';
    sr.appendChild(st);

    ['community', 'games', 'explore', 'shop'].forEach(id => {
      const menu = sr.getElementById('menu-' + id);
      if (!menu) return;
      const ensure = () => {
        if (!menu.querySelector('.np-menu-edit-btn')) {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'np-menu-edit-btn'; b.title = 'Edit links';
          const lab = (on) => { b.classList.toggle('active', on); b.innerHTML = (on ? CHECK : PENCIL) + '<span>' + (on ? 'Done editing' : 'Edit links') + '</span>'; };
          lab(menu.classList.contains('np-edit-mode'));
          b.addEventListener('click', (e) => { e.stopPropagation(); lab(menu.classList.toggle('np-edit-mode')); });
          menu.appendChild(b);
        }
        const eb = menu.querySelector('.np-menu-edit-btn');
        if (eb && menu.lastElementChild !== eb) menu.appendChild(eb);
        if (id === 'community' && !menu.querySelector('[data-np-news]')) {
          const a = document.createElement('a');
          a.href = 'https://www.neopets.com/nf.phtml'; a.dataset.npNews = '1';
          a.innerHTML = '<img src="https://images.neopets.com/themes/h5/basic/images/v3/news-icon.svg" alt=""><span>New Features</span>';
          const g = [...menu.querySelectorAll('a')].find(x => (x.getAttribute('href') || '').includes('/guilds/'));
          menu.insertBefore(a, g ? g.nextSibling : menu.querySelector('.menuAddRow'));
        }
        if (id === 'shop') {
          if (!menu.dataset.tab) menu.dataset.tab = 'np';
          if (!menu.querySelector('.npp-tabs')) {
            const bar = document.createElement('div');
            bar.className = 'npp-tabs';
            bar.innerHTML = '<button type="button" data-t="np">NP</button><button type="button" data-t="nc">NC</button>';
            bar.addEventListener('click', (e) => {
              const b = e.target.closest('button');
              if (b) { e.stopPropagation(); menu.dataset.tab = b.dataset.t; }
            });
            menu.prepend(bar);
          }
          let seps = 0;
          [...menu.children].forEach(c => {
            if (c.classList.contains('menuSep')) seps++;
            else if (c.tagName === 'A') c.dataset.g = seps === 0 ? 'np' : seps === 1 ? 'nc' : 'all';
          });
        }
      };
      ensure();
      new MutationObserver(() => { ensure(); fixNcNavLinks(); }).observe(menu, { childList: true });

      const recenter = () => {
        const b = sr.querySelector(`.btn.cat[data-id="${id}"]`);
        if (!b || menu.style.display !== 'block') return;
        const w = menu.getBoundingClientRect().width, r = b.getBoundingClientRect();
        const l = Math.max(8, Math.min(Math.round(r.left + r.width / 2 - w / 2), innerWidth - w - 8));
        if (Math.abs((parseFloat(menu.style.left) || 0) - l) > .5) menu.style.left = l + 'px';
      };
      new ResizeObserver(recenter).observe(menu);
      new MutationObserver(() => requestAnimationFrame(recenter)).observe(menu, { attributes: true, attributeFilter: ['style'] });
    });

    const bar = sr.querySelector('.bar');
    if (bar) {
      const a = document.createElement('a');
      a.className = 'npp-logo'; a.href = 'https://www.neopets.com/home';
      a.innerHTML = `<img src="${LOGO_URL}" alt="Neopets"><span>Neopets</span>`;
      const im = a.querySelector('img');
      im.addEventListener('error', () => { im.remove(); a.classList.add('txt'); });
      bar.appendChild(a);
    }

    let ct = null;
    const isNav = (t) => t && t.matches && t.matches('.btn.cat, .menu');
    sr.addEventListener('pointerenter', (e) => {
      if (!isNav(e.target)) return;
      clearTimeout(ct);
      if (e.target.classList.contains('cat') && e.target.dataset.id !== 'premium') {
        const p = sr.getElementById('menu-premium'); if (p) p.style.display = 'none';
      }
    }, true);
    sr.addEventListener('pointerleave', (e) => {
      const t = e.target;
      if (!isNav(t)) return;
      e.stopImmediatePropagation();
      const id = t.dataset.id || String(t.id).replace('menu-', '');
      clearTimeout(ct);
      ct = setTimeout(() => { const m = sr.getElementById('menu-' + id); if (m) m.style.display = 'none'; }, 200);
    }, true);
    return true;
  }

  const QASALAN_ITEM = ['Qasalan Expellibox', 'https://ncmall.neopets.com/games/giveaway/process_giveaway.phtml'];
  const PREMIUM_ITEMS = [
    '# Premium',
    ['Manage Membership', 'https://nc.neopets.com/membership/', 'icon'],
    ['Super Shop Wizard', 'https://www.neopets.com/shops/wizard.phtml', 'icon', 1],
    '# Labs & Bank',
    ['Lab Ray', 'https://www.neopets.com/lab.phtml'],
    ['Petpet Lab Ray', 'https://www.neopets.com/petpetlab.phtml'],
    ['Bank Interest', 'https://www.neopets.com/bank.phtml'],
    '# Daily rewards',
    QASALAN_ITEM,
    ['Food Club', 'https://www.neopets.com/pirates/foodclub.phtml'],
    ['Stock Market', 'https://www.neopets.com/stockmarket.phtml?type=portfolio'],
    ['Giant Omelette', 'https://www.neopets.com/prehistoric/omelette.phtml'],
    ['Giant Jelly', 'https://www.neopets.com/jelly/jelly.phtml'],
    ['Tombola', 'https://www.neopets.com/island/tombola.phtml'],
    ['Coltzan\'s Shrine', 'https://www.neopets.com/desert/shrine.phtml'],
    ['Grumpy King', 'https://www.neopets.com/medieval/grumpyking.phtml'],
    ['Trudy\'s Surprise', 'https://www.neopets.com/trudys_surprise.phtml'],
    ['Wishing Well', 'https://www.neopets.com/wishing.phtml'],
    ['Healing Springs', 'https://www.neopets.com/faerieland/springs.phtml'],
    ['Tarla\'s Toolbar', 'https://www.neopets.com/freebies/tarlastoolbar.phtml'],
    '# Wheels',
    ['Wheel of Starlight', 'https://www.neopets.com/premium/wheel.phtml', 'icon', 0, 'starlight'],
    ['Wheel of Excitement', 'https://www.neopets.com/faerieland/wheel.phtml'],
    ['Wheel of Mediocrity', 'https://www.neopets.com/prehistoric/mediocrity.phtml'],
    ['Wheel of Misfortune', 'https://www.neopets.com/halloween/wheel/index.phtml'],
    ['Wheel of Monotony', 'https://www.neopets.com/prehistoric/monotony/monotony.phtml'],
    ['Wheel of Knowledge', 'https://www.neopets.com/medieval/knowledge.phtml'],
    ['Fruit Machine', 'https://www.neopets.com/desert/fruit/index.phtml'],
    '# Scratchcards',
    ['Space Faerie', 'https://www.neopets.com/premium/sc/', 'icon', 0, 'space faerie'],
    ['Terror Mountain Kiosk', 'https://www.neopets.com/winter/kiosk.phtml'],
    ['Deserted Fairground Kiosk', 'https://www.neopets.com/halloween/scratch.phtml'],
    ['Lost Desert Kiosk', 'https://www.neopets.com/desert/sc/kiosk.phtml'],
    '# Games & activities',
    ['Faerie Quests', 'https://www.neopets.com/quests.phtml'],
    ['Fishing', 'https://www.neopets.com/water/fishing.phtml'],
    ['Coconut Shy', 'https://www.neopets.com/halloween/coconutshy.phtml'],
    ['Cheeseroller', 'https://www.neopets.com/medieval/cheeseroller.phtml'],
    ['Rubbish Dump', 'https://www.neopets.com/medieval/rubbishdump.phtml'],
    ['Symol Hole', 'https://www.neopets.com/medieval/symolhole.phtml'],
    ['Buried Treasure', 'https://www.neopets.com/pirates/buriedtreasure/index.phtml'],
    ['Anchor Management', 'https://www.neopets.com/pirates/anchormanagement.phtml'],
    ['Meteor Crash Site', 'https://www.neopets.com/moon/meteor.phtml'],
    ['Test Your Strength', 'https://www.neopets.com/halloween/strtest/index.phtml'],
    ['Apple Bobbing', 'https://www.neopets.com/halloween/applebobbing.phtml'],
    ['Edna the Witch', 'https://www.neopets.com/halloween/witchtower.phtml'],
  ];
  const PREMIUM_EXTRA = [
    '# Labs',
    ['Lab Ray', 'https://www.neopets.com/lab.phtml'],
    ['Petpet Lab Ray', 'https://www.neopets.com/petpetlab.phtml'],
  ];
  const FOOD_CLUB = ['Food Club', 'https://www.neopets.com/pirates/foodclub.phtml'], STOCK_MARKET = ['Stock Market', 'https://www.neopets.com/stockmarket.phtml?type=portfolio'];
  const MAIN_KEY = 'npp_main_account';
  const curUser = () => String(W.appInsightsUserName || LSget('npqol_hud_username') || '').trim();
  const mainAcct = () => LSget(MAIN_KEY);
  const onMainAcct = () => { const m = mainAcct().toLowerCase(); let u = ''; try { u = String(W.appInsightsUserName || '').trim(); } catch {} return !m || u.toLowerCase() === m; };

  function nativePremium() {
    const out = [];
    const a = [...document.querySelectorAll('a[href*="membership"]')].find(x => !x.closest('#npHud, #nppFoot, #npBgSidebar') && x.closest('[id*="nav"], [class*="nav"], #header'));
    let el = a && a.parentElement;
    for (let i = 0; el && i < 6; i++, el = el.parentElement) {
      const links = [...el.querySelectorAll('a[href]')].filter(x => x.textContent.trim());
      if (links.length < 2 || links.length > 14) continue;
      const seen = new Set();
      links.forEach(x => {
        const t = x.textContent.trim().replace(/\s+/g, ' ');
        if (seen.has(x.href) || t.length > 40) return;
        seen.add(x.href);
        const im = x.querySelector('img');
        out.push([t, x.href, im && im.src]);
      });
      break;
    }
    return out;
  }

  function findLink(key) {
    const re = new RegExp(key, 'i');
    const a = [...document.querySelectorAll('a[href]')].find(x => re.test(x.textContent) && !x.closest('#npHud, #nppFoot, #npBgSidebar'));
    return a ? a.href : '';
  }

  function setupPremium() {
    const sr = shadow();
    if (!sr) return;
    const btn = [...sr.querySelectorAll('.left a.btn')].find(a => /membership/.test(a.getAttribute('href') || ''));
    if (!btn) return;
    const icon = (btn.querySelector('img') || {}).src || '';
    let menuMain = true;
    const build = () => {
      let items = nativePremium(), curated = false;
      menuMain = onMainAcct();
      if (!menuMain) { items = PREMIUM_ITEMS.slice(0, PREMIUM_ITEMS.indexOf('# Daily rewards')); curated = true; }
      else if (items.length < 4) { items = PREMIUM_ITEMS; curated = true; }
      else if (!items.some(it => /starlight/i.test(it[0]))) items = [PREMIUM_ITEMS.find(it => Array.isArray(it) && it[4] === 'starlight'), ...items];
      if (!curated) { const pos = Math.min(2, items.length); items = items.slice(0, pos).concat(PREMIUM_EXTRA, items.slice(pos), [QASALAN_ITEM, FOOD_CLUB, STOCK_MARKET]); }
      return items.map(it => it === '---' ? '<div class="menuSep"></div>'
        : typeof it === 'string' ? `<div class="menuHead">${esc(it.slice(2))}</div>`
        : `<a href="${esc(it[1])}"${/^https?:\/\/(?!(www|nc|ncmall)\.neopets\.com)/i.test(it[1]) ? ' target="_blank" rel="noopener noreferrer"' : ''}${it[3] ? ' data-ssw="1"' : ''}${it[4] ? ` data-find="${esc(it[4])}"` : ''}>${(it[2] || '') ? `<img src="${esc(it[2] === 'icon' ? icon : it[2])}" alt="">` : ''}<span>${esc(it[0])}</span></a>`).join('');
    };
    const existing = sr.getElementById('menu-premium');
    if (existing) {
      if (!existing.dataset.up && nativePremium().length >= 4) { existing.innerHTML = build(); existing.dataset.up = '1'; if (NQ.dailies) NQ.dailies.decoratePremium(existing); }
      return;
    }
    const menu = document.createElement('div');
    menu.className = 'menu'; menu.id = 'menu-premium';
    menu.innerHTML = build();
    menu.addEventListener('click', (e) => {
      if (e.altKey || e.shiftKey) return;
      const st = e.target.closest('[data-find]');
      if (st) { const h = findLink(st.dataset.find); if (h) st.href = h; return; }
      if (!e.target.closest('[data-ssw]')) return;
      for (const sel of ['#sswmenu .imgmenu', '#sswmenu img', '#sswmenu', '.navsub-ssw-icon__2020', '#ssw-tab-button']) {
        const el = document.querySelector(sel);
        if (el) { e.preventDefault(); el.click(); return; }
      }
    });
    sr.appendChild(menu);
    if (NQ.dailies) NQ.dailies.decoratePremium(menu);
    { const caret = document.createElement('div'); caret.className = 'npp-premcaret'; menu.insertAdjacentElement('afterend', caret);
      const bg = document.createElement('div'); bg.className = 'npp-prembg'; menu.insertAdjacentElement('beforebegin', bg);
      const csync = () => {
        const cs = getComputedStyle(menu), open = cs.display !== 'none', vis = open && cs.getPropertyValue('--npp-menu-caret').trim() === 'block';
        caret.style.display = vis ? 'block' : 'none';
        if (vis) { caret.style.left = (menu.offsetLeft + menu.offsetWidth / 2 - 6) + 'px'; caret.style.top = (menu.offsetTop - 7) + 'px'; }
        bg.style.display = open ? 'block' : 'none';
        if (open) {
          bg.style.position = cs.position; if (cs.zIndex !== 'auto') bg.style.zIndex = cs.zIndex;
          bg.style.left = menu.offsetLeft + 'px'; bg.style.top = menu.offsetTop + 'px';
          bg.style.width = menu.offsetWidth + 'px'; bg.style.height = menu.offsetHeight + 'px';
        }
      };
      new MutationObserver(() => requestAnimationFrame(csync)).observe(menu, { attributes: true, attributeFilter: ['style', 'class'] });
      new ResizeObserver(csync).observe(menu);
      setInterval(csync, 400); }
    if (NQ.dailies) setInterval(() => NQ.dailies.updateSnow(menu, btn), 1000);
    btn.classList.add('cat'); btn.dataset.id = 'premium';

    const recenter = () => {
      if (menu.style.display !== 'block') return;
      const w = menu.getBoundingClientRect().width, r = btn.getBoundingClientRect();
      const l = Math.max(8, Math.min(Math.round(r.left + r.width / 2 - w / 2), innerWidth - w - 8));
      if (Math.abs((parseFloat(menu.style.left) || 0) - l) > .5) menu.style.left = l + 'px';
    };
    new ResizeObserver(recenter).observe(menu);
    new MutationObserver(() => requestAnimationFrame(recenter)).observe(menu, { attributes: true, attributeFilter: ['style'] });
    let closeT = null;
    const closeMenu = () => { clearTimeout(closeT); closeT = null; menu.style.display = 'none'; };
    document.addEventListener('pointermove', (e) => {
      if (menu.style.display !== 'block') return;
      const b = btn.getBoundingClientRect(), m = menu.getBoundingClientRect(), x = e.clientX, y = e.clientY;
      const inB = x >= b.left && x <= b.right && y >= b.top && y <= b.bottom + 8;
      const inM = x >= m.left && x <= m.right && y >= m.top && y <= m.bottom + 16;
      const inGap = x >= Math.min(b.left, m.left) && x <= Math.max(b.right, m.right) && y >= b.bottom && y <= m.top;
      if (inB || inM || inGap) { clearTimeout(closeT); closeT = null; }
      else if (!closeT) closeT = setTimeout(closeMenu, 200);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', closeMenu);
    window.addEventListener('blur', closeMenu);
    btn.addEventListener('pointerenter', () => {
      sr.querySelectorAll('.menu').forEach(m => { if (m !== menu) m.style.display = 'none'; });
      if (menuMain !== onMainAcct()) menu.innerHTML = build();
      if (NQ.dailies) NQ.dailies.decoratePremium(menu);
      let tall = 0;
      sr.querySelectorAll('.menu:not(#menu-premium)').forEach(m => {
        const was = m.style.display;
        if (was !== 'block') { m.style.visibility = 'hidden'; m.style.display = 'block'; }
        tall = Math.max(tall, m.getBoundingClientRect().height);
        if (was !== 'block') { m.style.display = was || 'none'; m.style.visibility = ''; }
      });
      if (tall) menu.style.maxHeight = Math.min(tall, innerHeight - 100) + 'px';
      menu.style.top = Math.round($('#npx-host').getBoundingClientRect().bottom) + 'px';
      menu.style.display = 'block';
    });
  }

  let shortcutsLocked = false;
  function lockShortcuts() {
    const A = NQ.sideBtns;
    if (!A || shortcutsLocked || isNc) return;
    shortcutsLocked = true;
    try {
      if (A.getLayout() !== 'single') A.setLayout('single');
      const cfg = A.load();
      if (cfg.right && cfg.right.length) A.save({ left: [...cfg.left, ...cfg.right], right: [] });
    } catch {}
  }

  const SEARCH_URL = 'https://www.neopets.com/search.phtml';
  const themeOf = () => NQ.getBtnTheme() || 'basic';
  const iconUrl = (name) => NQ.btnIconUrl(name, themeOf());
  function setupTools() {
    if (isNc || isPopup || $('#nppTools') || !document.body) return;
    const col = $('#btnOverlay .col.left');
    if (!col) return;
    const tools = document.createElement('div');
    tools.id = 'nppTools';
    tools.innerHTML =
      '<div class="nppSep"></div>' +
      `<form class="nppSearch" action="${SEARCH_URL}" method="get"><button type="submit" aria-label="Search" title="Search"><img alt=""></button><input name="string" placeholder="Search the site" autocomplete="off" aria-label="Search the site"></form>`;
    document.body.appendChild(tools);
    const sImg = $('.nppSearch img', tools), form = $('.nppSearch', tools), input = $('input', form);
    const host = $('#npx-host');
    const place = () => {
      if (!host) return;
      const r = host.getBoundingClientRect();
      if (!r.height) return;
      rs.setProperty('--npp-tools-top', Math.round(r.top + r.height / 2) + 'px');
      rs.setProperty('--npp-header-h', Math.round(r.height) + 'px');
    };
    place();
    if (host) { new ResizeObserver(place).observe(host); window.addEventListener('resize', place); }

    const measure = () => {
      const live = [...col.children].filter(k => !k.hasAttribute('data-npp-nested') && k.getBoundingClientRect().width > 8);
      if (!live.length) return;
      let size = 0;
      try { const A = NQ.sideBtns, v = A && A.getIconSize ? parseFloat(A.getIconSize()) : NaN; if (v >= 24 && v <= 96) size = Math.round(v); } catch {}
      if (!size) {
        const imgs = live.map(k => k.querySelector('img')).filter(Boolean);
        const boxes = imgs.length ? imgs : live, factor = imgs.length ? 1 : 0.88;
        const sizes = boxes.map(i => Math.round(Math.max(i.getBoundingClientRect().width, i.getBoundingClientRect().height))).filter(w => w > 8);
        if (!sizes.length) return;
        const tally = {}; sizes.forEach(w => { tally[w] = (tally[w] || 0) + 1; });
        size = Math.round(+Object.keys(tally).sort((x, y) => tally[y] - tally[x] || x - y)[0] * factor);
      }
      size = Math.max(28, Math.min(56, size));
      let gap = 10;
      if (live.length > 1) { const r0 = live[0].getBoundingClientRect(), r1 = live[1].getBoundingClientRect(); gap = Math.max(4, Math.min(28, Math.round(Math.abs(r1.top - r0.top) - r0.height))); }
      rs.setProperty('--npp-ic', size + 'px'); rs.setProperty('--npp-ig', gap + 'px');
      try {
        const cands = [live[0], live[0].querySelector('img')].filter(Boolean);
        const f = cands.map(c => getComputedStyle(c).filter).find(v => v && v !== 'none' && /drop-shadow/.test(v));
        if (f) rs.setProperty('--npp-ico-shadow', f);
      } catch {}
    };
    measure();
    const remeasure = () => { measure(); };
    rs.setProperty('--npp-tools-h', '0px');
    new MutationObserver(remeasure).observe(col, { childList: true });
    new ResizeObserver(remeasure).observe(col);

    const paintIcons = () => {
      const su = iconUrl('search'); if (su && sImg.getAttribute('src') !== su) sImg.src = su;
    };
    NQ.onBtnTheme(() => paintIcons());
    sImg.addEventListener('error', () => { sImg.style.display = 'none'; sImg.parentElement.classList.add('noimg'); });
    setTimeout(remeasure, 700); setTimeout(remeasure, 2500);
    paintIcons();

    const setSearch = (open) => {
      form.classList.toggle('nppOpen', open);
      if (host) host.classList.toggle('npp-search-open', open);
      if (open) input.focus();
    };
    const closeSearch = () => setSearch(false);
    input.addEventListener('focus', () => setSearch(true));
    form.addEventListener('submit', (e) => { if (!input.value.trim()) { e.preventDefault(); setSearch(true); } });
    $('button', form).addEventListener('click', (e) => {
      if (input.value.trim()) return;
      e.preventDefault();
      if (form.classList.contains('nppOpen')) { closeSearch(); input.blur(); }
      else setSearch(true);
    });
    document.addEventListener('pointerdown', (e) => {
      if (form.classList.contains('nppOpen') && !e.target.closest('#nppTools .nppSearch')) closeSearch();
    }, true);
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !form.classList.contains('nppOpen')) return;
      closeSearch(); input.blur();
    });

  }

  const NEST_KEY = 'npp_nest_v1';
  const readNest = () => { try { const o = JSON.parse(LSget(NEST_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch { return {}; } };
  const writeNest = (o) => LSset(NEST_KEY, JSON.stringify(o));
  const bgUrlOf = (el) => { try { const m = /url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(el).backgroundImage || ''); return m ? m[1] : ''; } catch { return ''; } };
  const itemKey = (el) => {
    const a = el.matches && el.matches('a[href]') ? el : (el.querySelector && el.querySelector('a[href]'));
    const href = a && a.getAttribute('href');
    if (href && href !== '#') return 'h:' + href;
    const im = el.querySelector && el.querySelector('img');
    if (im && (im.currentSrc || im.src)) return 'i:' + (im.currentSrc || im.src).split('?')[0];
    const b = bgUrlOf(el) || [...(el.querySelectorAll ? el.querySelectorAll('*') : [])].map(bgUrlOf).find(Boolean);
    if (b) return 'b:' + b.split('?')[0];
    return 't:' + String(el.getAttribute('title') || el.getAttribute('aria-label') || el.textContent || '').trim();
  };
  let nestApplyFn = null, nestKeyOf = null;
  function setupNest() {
    if (isNc || isPopup) return;
    const col = $('#btnOverlay .col.left');
    if (!col || col.dataset.nppNest) return;
    col.dataset.nppNest = '1';
    const pop = document.createElement('div'); pop.id = 'nppNestPop';
    const inner = document.createElement('div'); inner.className = 'col'; inner.style.setProperty('display', 'contents', 'important'); pop.appendChild(inner);
    const mount = () => { if (!pop.isConnected) (document.getElementById('btnOverlay') || document.body).appendChild(pop); };
    mount();
    const menu = document.createElement('div'); menu.id = 'nppNestMenu'; document.body.appendChild(menu);
    let hideT = null;

    const kidsByKey = () => { const m = new Map(); [...col.children].forEach(k => { const key = itemKey(k); if (key && !m.has(key)) m.set(key, k); }); return m; };
    const apply = () => {
      const nest = readNest(), by = kidsByKey(), kids = new Set(); Object.values(nest).forEach(a => a.forEach(c => kids.add(c)));
      [...col.children].forEach(k => {
        const key = itemKey(k);
        const isChild = kids.has(key) && !(key in nest);
        k.toggleAttribute('data-npp-nested', isChild);
        const has = key in nest && nest[key].some(c => by.has(c));
        k.classList.toggle('nppHasNest', has);
        if (has && getComputedStyle(k).position === 'static') k.style.position = 'relative';
      });
    };
    let raf = 0; const soon = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply); };
    new MutationObserver(soon).observe(col, { childList: true });
    apply();
    nestApplyFn = apply; nestKeyOf = itemKey;

    const showPop = (parent) => {
      clearTimeout(hideT);
      const key = itemKey(parent), nest = readNest(), by = kidsByKey();
      let list = (nest[key] || []).map(c => by.get(c)).filter(Boolean);
      if (!list.length) return;
      mount();
      const sig = key + '|' + list.map(itemKey).join(',');
      if (!(pop._sig === sig && inner.children.length)) {
        inner.textContent = '';
        list.forEach((orig, i) => {
          const c = orig.cloneNode(true);
          c.removeAttribute('data-npp-nested'); c.classList.remove('nppHasNest', 'nppBgIcon'); c.style.removeProperty('display');
          c.dataset.i = i; c.style.setProperty('--i', i);
          inner.appendChild(c);
        });
        pop._sig = sig;
      }
      pop._list = list;
      const modEl = col.closest('#nppIcons');
      if (modEl) { const pr = parent.getBoundingClientRect(), mr = modEl.getBoundingClientRect(); pop.style.setProperty('--tx', Math.round(pr.left + pr.width / 2 - mr.left) + 'px'); }
      const r = parent.getBoundingClientRect();
      pop.style.left = Math.round(r.right) + 'px'; pop.style.top = Math.round(r.top + r.height / 2) + 'px';
      if (!pop.classList.contains('open')) pop.classList.add('open');
    };
    const hidePop = () => { clearTimeout(hideT); hideT = setTimeout(() => pop.classList.remove('open'), 300); };
    const canHover = () => { try { return matchMedia('(hover: hover) and (pointer: fine)').matches; } catch { return true; } };
    const inMod = () => !!col.closest('#nppIcons');
    const hoverOpen = (e) => {
      if (inMod() && !canHover()) return;
      const item = [...col.children].find(k => k.contains(e.target));
      if (!item) return;
      if (item.classList.contains('nppHasNest')) { showPop(item); pop._key = itemKey(item); } else if (pop.classList.contains('open')) hidePop();
    };
    col.addEventListener('mouseover', hoverOpen);
    col.addEventListener('focusin', hoverOpen);
    col.addEventListener('focusout', () => { if (inMod()) hidePop(); });
    col.addEventListener('mouseleave', (e) => { if (e.relatedTarget && pop.contains(e.relatedTarget)) return; if (!inMod() || canHover()) hidePop(); });
    pop.addEventListener('mouseenter', () => clearTimeout(hideT)); pop.addEventListener('mouseover', () => clearTimeout(hideT)); pop.addEventListener('pointerenter', () => clearTimeout(hideT));
    pop.addEventListener('focusin', () => clearTimeout(hideT));
    pop.addEventListener('focusout', () => { if (inMod()) hidePop(); });
    pop.addEventListener('mouseleave', (e) => { if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('#nppIcons #btnOverlay .col > .nppHasNest')) return; if (!inMod() || canHover()) hidePop(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && inMod() && pop.classList.contains('open')) pop.classList.remove('open'); });
    col.addEventListener('click', (e) => {
      if (!inMod() || canHover() || pop._via || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
      const item = [...col.children].find(k => k.contains(e.target));
      if (!item || !item.classList.contains('nppHasNest')) return;
      e.preventDefault(); e.stopPropagation();
      const k = itemKey(item);
      if (pop.classList.contains('open') && pop._key === k) pop.classList.remove('open'); else { showPop(item); pop._key = k; }
    }, true);
    pop.addEventListener('click', (e) => {
      const a = e.target.closest('#nppNestPop .col > *'); if (!a) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
      e.preventDefault(); e.stopPropagation();
      const orig = pop._list && pop._list[+a.dataset.i];
      if (orig) { pop._via = true; try { orig.click(); } finally { pop._via = false; } }
      pop.classList.remove('open');
    });

    document.addEventListener('pointerdown', (e) => { if (inMod() && pop.classList.contains('open') && !e.target.closest('#nppIcons')) pop.classList.remove('open'); }, true);
    const closeMenu = () => { menu.classList.remove('open'); };
    const openMenu = (x, y, entries) => {
      menu.innerHTML = entries.map((e, i) => `<button type="button" data-i="${i}">${esc(e.label)}</button>`).join('');
      menu._entries = entries;
      menu.style.left = Math.min(x, innerWidth - 230) + 'px'; menu.style.top = Math.min(y, innerHeight - 20 - entries.length * 34) + 'px';
      menu.classList.add('open');
    };
    menu.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const en = menu._entries[+b.dataset.i]; closeMenu(); if (en) { en.run(); apply(); } });
    document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#nppNestMenu')) closeMenu(); }, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    col.addEventListener('contextmenu', (e) => {
      const item = [...col.children].find(k => k.contains(e.target));
      if (!item) return;
      const key = itemKey(item); if (!key) return;
      const nest = readNest(), top = [...col.children].filter(k => !k.hasAttribute('data-npp-nested'));
      const idx = top.indexOf(item), prev = idx > 0 ? top[idx - 1] : null, entries = [];
      if (prev && itemKey(prev)) entries.push({ label: 'Nest under the icon above', run: () => {
        const pk = itemKey(prev), o = readNest();
        o[pk] = (o[pk] || []).concat([key].concat(o[key] || [])).filter((v, i, a) => a.indexOf(v) === i && v !== pk);
        delete o[key]; writeNest(o);
      } });
      if (key in nest) entries.push({ label: `Ungroup (${nest[key].length} nested)`, run: () => { const o = readNest(); delete o[key]; writeNest(o); } });
      if (!entries.length) return;
      e.preventDefault(); openMenu(e.clientX, e.clientY, entries);
    });
    pop.addEventListener('contextmenu', (e) => {
      const a = e.target.closest('#nppNestPop .col > *'); if (!a) return;
      const orig = pop._list && pop._list[+a.dataset.i]; if (!orig) return;
      const ck = itemKey(orig);
      e.preventDefault();
      openMenu(e.clientX, e.clientY, [{ label: 'Move out of group', run: () => { const o = readNest(); Object.keys(o).forEach(pk => { o[pk] = o[pk].filter(c => c !== ck); if (!o[pk].length) delete o[pk]; }); writeNest(o); pop.classList.remove('open'); } }]);
    });
  }

  function decorateEditorNest() {
    const h = $('#npxSideBtnHost'), sr = h && h.shadowRoot, col = $('#btnOverlay .col.left');
    if (!sr || !col || !nestKeyOf || !nestApplyFn) return;
    const body = sr.querySelector('.body');
    if (!body) return;
    const rows = [...sr.querySelectorAll('.col:not([data-side="right"]) .items > .item')], kids = [...col.children];
    if (!rows.length || rows.length !== kids.length) return;
    if (!sr.querySelector('.nppNestHint')) { const hint = document.createElement('div'); hint.className = 'nppNestHint'; hint.textContent = '↳ nests an icon under the icon above it. To nest a new icon: press ADD, move it right below the icon you want to group it with, then press its ↳. Nested icons open in a pop-out when you hover the icon above.'; body.appendChild(hint); }
    const nest = readNest(), parentOf = {};
    Object.entries(nest).forEach(([pk, cs]) => cs.forEach(c => { parentOf[c] = pk; }));
    let prevTop = null;
    rows.forEach((row, i) => {
      const key = nestKeyOf(kids[i]), isChild = key in parentOf, isParent = key in nest && nest[key].length > 0;
      let btn = row.querySelector('.nppNestBtn');
      if (!btn) {
        btn = document.createElement('button'); btn.type = 'button'; btn.className = 'nppNestBtn iconBtnMini';
        btn.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          const rowsNow = [...sr.querySelectorAll('.col:not([data-side="right"]) .items > .item')], kidsNow = [...col.children];
          const idx = rowsNow.indexOf(btn.closest('.item'));
          if (idx < 0 || rowsNow.length !== kidsNow.length) return;
          const k = nestKeyOf(kidsNow[idx]), o = readNest();
          const par = Object.keys(o).find(pk => o[pk].includes(k));
          if (par) { o[par] = o[par].filter(c => c !== k); if (!o[par].length) delete o[par]; }
          else {
            const hidden = new Set(); Object.values(o).forEach(a => a.forEach(c => hidden.add(c)));
            let prev = null; for (let j = idx - 1; j >= 0; j--) { const kk = nestKeyOf(kidsNow[j]); if (!hidden.has(kk)) { prev = kk; break; } }
            if (!prev) return;
            o[prev] = (o[prev] || []).concat([k].concat(o[k] || [])).filter((v, x, arr) => arr.indexOf(v) === x && v !== prev);
            delete o[k];
          }
          writeNest(o); nestApplyFn(); decorateEditorNest();
        });
        row.appendChild(btn);
      }
      const want = isChild ? '↱' : '↳';
      if (btn.textContent !== want) btn.textContent = want;
      btn.title = isChild ? 'Move out of the group' : (prevTop ? 'Nest under the icon above' : 'Nothing above to nest under');
      btn.disabled = !isChild && !prevTop;
      btn.classList.toggle('on', isChild);
      row.classList.toggle('nppNested', isChild); row.classList.toggle('nppParent', isParent);
      if (!isChild) prevTop = key;
    });
  }

  function patchEditor() {
    const h = $('#npxSideBtnHost'), sr = h && h.shadowRoot;
    if (!sr || sr.getElementById('npp-editor')) return;
    const tab = sr.querySelector('.tab'), panel = sr.querySelector('.panel');
    if (!tab || !panel) return;
    const st = document.createElement('style');
    st.id = 'npp-editor'; st.textContent = EDITOR_CSS;
    sr.appendChild(st);
    tab.innerHTML = CHEV;
    new MutationObserver(() => tab.classList.toggle('isOpen', panel.classList.contains('open'))).observe(panel, { attributes: true, attributeFilter: ['class'] });
    tabEl = tab; panelEl = panel;

    const head = panel.querySelector('.head');
    if (head && NQ.sideBtns && !head.querySelector('.nppSizeGrp')) {
      const A = NQ.sideBtns;
      const grp = document.createElement('div');
      grp.className = 'nppSizeGrp';
      grp.innerHTML = '<span class="nppSizeLbl">Size</span><button type="button" data-d="-1" title="Smaller icons" aria-label="Smaller icons">−</button><span class="nppSizeVal"></span><button type="button" data-d="1" title="Bigger icons" aria-label="Bigger icons">+</button>';
      const paintSize = () => { grp.querySelector('.nppSizeVal').textContent = A.getIconSize() + 'px'; };
      grp.addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('button[data-d]');
        if (!b) return;
        e.preventDefault(); e.stopPropagation();
        A.setIconSize(A.getIconSize() + (+b.dataset.d) * (A.iconSizeStep || 6));
        paintSize();
      });
      head.insertBefore(grp, head.firstChild);
      paintSize();
    }

    const fixIco = (el) => {
      if (el.dataset.f) return;
      el.dataset.f = '1';
      const m = (el.style.backgroundImage || '').match(/url\(["']?([^"')]+)["']?\)/);
      const name = m && (m[1].match(/\/([^\/]+)-icon\.(svg|png)/) || [])[1];
      if (!name) return;
      const url = m[1];
      const cands = [url.replace(/\.(svg|png)$/, (e) => e === '.svg' ? '.png' : '.svg'), ...(NQ.btnFallbackChain || []).map(u => u.replace('{icon}', name))];
      const next = (i) => {
        if (i >= cands.length) return;
        const im = new Image();
        im.onload = () => { el.style.backgroundImage = `url('${cands[i]}')`; };
        im.onerror = () => next(i + 1);
        im.src = cands[i];
      };
      const probe = new Image();
      probe.onerror = () => next(0);
      probe.src = url;
    };
    let scanRaf = 0;
    const scan = () => { cancelAnimationFrame(scanRaf); scanRaf = requestAnimationFrame(() => { sr.querySelectorAll('.ico:not([data-f])').forEach(fixIco); decorateEditorNest(); }); };
    new MutationObserver(scan).observe(sr, { childList: true, subtree: true });
    scan();
  }

  const EVENTS_URL = 'https://www.neopets.com/allevents.phtml';
  const BELL_ICON = 'https://images.neopets.com/themes/h5/basic/images/v3/bell-icon.svg';
  function setupBell() {
    if (isNc || isPopup || !document.body) return;
    let box = $('#nppBell');
    const nb = $('.nav-bell-icon__2020'), dd = $('#navnewsdropdown__2020');
    if (nb && dd) {
      if (box && box.dataset.k === 'native' && box.contains(nb)) return;
      if (box) box.remove();
      box = document.createElement('div');
      box.id = 'nppBell'; box.dataset.k = 'native';
      box.append(nb, dd);
      document.body.appendChild(box);
      try { if (getComputedStyle(nb).backgroundImage === 'none') nb.style.backgroundImage = `url("${BELL_ICON}")`; } catch {}
      return;
    }
    if (box || document.readyState === 'loading') return;
    const td = $('td.eventIcon');
    const b = td && td.querySelector('b');
    const txt = td ? (td.innerText || '').replace(/»\s*See all events\s*«/i, '').trim() : '';
    const title = ((b && b.textContent) || '').trim() || txt.slice(0, 80);
    box = document.createElement('a');
    box.id = 'nppBell'; box.dataset.k = 'link'; box.href = EVENTS_URL;
    box.title = title ? 'Newest alert: ' + title : 'Alerts';
    box.setAttribute('aria-label', box.title);
    box.innerHTML = `<img src="${BELL_ICON}" alt="">` + (title ? '<i class="nppBellDot"></i>' : '');
    document.body.appendChild(box);
  }

  function buildFooter() {
    if ($('#nppFoot') || !document.body || isNc) return;
    const f = document.createElement('div');
    f.id = 'nppFoot';
    document.body.appendChild(f);
    new ResizeObserver(() => rs.setProperty('--np-hud-bottom', (f.offsetHeight + 12) + 'px')).observe(f);
  }

  let clockTimer = null;
  function setupClock() {
    if (isNc || isPopup) return;
    const sr = shadow();
    if (!sr) return;
    const bar = sr.querySelector('.bar');
    if (!bar) return;
    let nst = bar.querySelector('.npp-clock');
    if (!nst) {
      nst = document.createElement('div');
      nst.id = 'nppNst'; nst.className = 'npp-clock'; nst.textContent = '--:--:--';
      bar.appendChild(nst);
    }
    if (nst.dataset.ready === '1') return;
    nst.dataset.ready = '1';
    if (clockTimer) clearInterval(clockTimer);
    const fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
    const tick = () => { nst.textContent = fmt.format(new Date()).replace(/\s?(AM|PM)/i, (m, p) => ' ' + p.toLowerCase()) + ' NST'; };
    tick();
    clockTimer = setInterval(tick, 1000);
  }

  const ACCTS_KEY = 'npp_accounts';
  const validName = (n) => /^[A-Za-z0-9_]{3,20}$/.test(n);
  const readAccts = () => { try { const a = JSON.parse(LSget(ACCTS_KEY) || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch { return []; } };
  const writeAccts = (a) => LSset(ACCTS_KEY, JSON.stringify(a));
  function noteAccount(name) {
    name = String(name || '').trim();
    if (!validName(name)) return false;
    const a = readAccts();
    if (a.some(x => x.toLowerCase() === name.toLowerCase())) return false;
    a.push(name); writeAccts(a); return true;
  }
  function seenAccounts() {
    const out = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('npp_acct_')) out.push(k.slice(9)); } } catch {}
    return out;
  }
  const MAN_KEY = 'npp_accounts_manual';
  const readManual = () => { try { const a = JSON.parse(LSget(MAN_KEY) || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch { return []; } };
  const autoAccts = () => { const a = readAccts().slice(); [curUser(), ...seenAccounts()].forEach(n => { if (validName(n) && !a.some(x => x.toLowerCase() === n.toLowerCase())) a.push(n); }); return a; };
  const allAccts = () => { const a = autoAccts(); readManual().forEach(n => { if (!a.some(x => x.toLowerCase() === n.toLowerCase())) a.push(n); }); return a; };
  let petSig = null;
  function renderPetInfo() {
    const card = $('#npActivePet');
    if (!card) return;
    let box = $('#nppPetInfo');
    if (!box) { box = document.createElement('div'); box.id = 'nppPetInfo'; card.appendChild(box); petSig = null; }
    const raw = LSget('npqol_qr_data');
    if (raw === petSig) return;
    petSig = raw;
    let a = null;
    try { a = JSON.parse(raw || 'null')?.data?.active || null; } catch {}
    if (!a) { box.innerHTML = ''; return; }
    const title = `${a.name} - ${[a.colour, a.species].filter(Boolean).join(' ')}`;
    const gcls = /female/i.test(a.gender || '') ? 'gF' : 'gM';
    const shown = `<span class="nppName">${esc(a.name)}</span><span class="nppSub">${a.gender ? `<span class="nppG ${gcls}">${esc(a.gender)}</span> ` : ''}${esc([a.colour, a.species].filter(Boolean).join(' '))}</span>`;
    const ageN = parseInt(String(a.age || '').replace(/[^\d]/g, ''), 10);
    const ageUnit = /hour/i.test(a.age || '') ? 'hours' : /minute/i.test(a.age || '') ? 'minutes' : 'days';
    const ageShort = !Number.isFinite(ageN) ? a.age : (ageUnit === 'days' && ageN >= 1000) ? (() => { const k = Math.floor(ageN / 100) / 10; return (k % 1 ? k.toFixed(1) : k) + 'K days'; })() : ageN + ' ' + ageUnit;
    const chips = [a.level && ['', 'Lv ' + a.level, 'Level ' + a.level], a.age && ['', ageShort, a.age]].filter(Boolean);
    const rows = [['Health', a.health], ['Strength', a.strength], ['Defence', a.defence], ['Move', a.move], ['Intelligence', a.intelligence]].filter(r => r[1]);
    box.innerHTML = `<div class="nppTitle"><a href="https://www.neopets.com/petlookup.phtml?pet=${encodeURIComponent(a.name)}">${shown}</a><button type="button" class="nppCopy" title="Copy" data-copy="${esc(title)}">${COPY}</button></div><div class="nppLinks"><a href="https://www.neopets.com/~${encodeURIComponent(a.name)}" title="View petpage" aria-label="View petpage">${EYE}</a><a href="https://www.neopets.com/editpage.phtml?pet_name=${encodeURIComponent(a.name)}" title="Edit petpage" aria-label="Edit petpage">${PENCIL}</a>${rows.length ? `<button type="button" class="nppStatsBtn${LSget('npp_stats_open') === '0' ? '' : ' on'}" title="Stats" aria-label="Stats" aria-pressed="${LSget('npp_stats_open') === '0' ? 'false' : 'true'}">${STATS_ICON}</button>` : ''}</div><div class="nppChips">${chips.map(c => `<span class="nppChip ${c[0]}" title="${esc(c[2] || '')}">${esc(c[1])}</span>`).join('')}</div>${rows.length ? `<div class="nppStats${LSget('npp_stats_open') === '0' ? '' : ' open'}"><div class="nppStatsBody"><div class="nppDetails">${rows.map(r => `<div class="nppStat"><span>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('')}</div></div></div>` : ''}`;
  }
  const PET_IMG_STYLE = 'object-position:50% 50%!important;object-fit:cover!important;width:calc(100% + 2 * var(--pn-pad, 12px))!important;height:auto!important;aspect-ratio:1/1!important;max-width:none!important;max-height:none!important;transform:none!important;background:#fff!important;border-radius:var(--pn-r, 16px) var(--pn-r, 16px) 0 0!important;opacity:1!important;display:block!important;margin:calc(-1 * var(--pn-pad, 12px)) calc(-1 * var(--pn-pad, 12px)) 0!important;box-shadow:none!important';
  function syncPetImg() {
    if (Date.now() > petSyncUntil) return;
    const img = $('#npActivePet > img'), el = document.getElementById('navPetMenuIcon__2020');
    if (!img || !el) return;
    const m = (getComputedStyle(el).backgroundImage || '').match(/url\(["']?([^"')]+)["']?\)/);
    if (!m) return;
    let hu = m[1]; if (hu.startsWith('//')) hu = 'https:' + hu;
    const hh = /\/cp\/([^/]+)\//.exec(hu), cur = img.currentSrc || img.src || '', ch = /\/cp\/([^/]+)\//.exec(cur);
    if (!hh) return;
    if (ch && ch[1] === hh[1]) { petSettled = true; return; }
    const sz = (/\/(\d+)\.png/.exec(cur) || [])[1] || '9';
    const big = hu.replace(/\/\d+\.png(\?.*)?$/, '/' + sz + '.png');
    img.src = big;
    try { const o = JSON.parse(LSget('npqol_active_pet_img_v1') || 'null') || {}; o.url = big; LSset('npqol_active_pet_img_v1', JSON.stringify(o)); } catch {}
    petSettled = true;
  }
  function fixPetImg() {
    const img = $('#npActivePet > img');
    if (img && img.getAttribute('style') !== PET_IMG_STYLE) img.setAttribute('style', PET_IMG_STYLE);
    const card = $('#npActivePet');
    if (!img || !card) return;
    const h = img.offsetHeight;
    if (h > 0 && card.dataset.nppImgH !== String(h)) { card.dataset.nppImgH = String(h); card.style.setProperty('--npp-img-h', h + 'px'); }
    if (petImgRO && petImgRO.el !== img) { petImgRO.ro.disconnect(); petImgRO = null; }
    if (!petImgRO && typeof ResizeObserver === 'function') { const ro = new ResizeObserver(fixPetImg); ro.observe(img); petImgRO = { ro, el: img }; }
    const src = img.currentSrc || img.src || '';
    if (src && src !== nameToneSrc) { nameToneSrc = src; pickNameTone(card, src); }
  }
  let petImgRO = null, nameToneSrc = '';
  function npLoadBlob(src, cb) {
    try {
      if (typeof GM_xmlhttpRequest === 'undefined') return cb(null);
      GM_xmlhttpRequest({ method: 'GET', url: src, responseType: 'blob', onload: (r) => { try { cb(r.status >= 200 && r.status < 300 && r.response ? URL.createObjectURL(r.response) : null); } catch { cb(null); } }, onerror: () => cb(null), ontimeout: () => cb(null) });
    } catch { cb(null); }
  }
  const nppToneCache = new Map();
  const NPP_TONE_KEY = 'npp_pet_tone_v1';
  function nppToneRead() { try { const o = JSON.parse(localStorage.getItem(NPP_TONE_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch { return {}; } }
  function nppToneSave(src, dark) {
    try {
      const o = nppToneRead(); delete o[src]; o[src] = dark ? 'd' : 'l';
      const ks = Object.keys(o); if (ks.length > 600) ks.slice(0, ks.length - 600).forEach(k => delete o[k]);
      localStorage.setItem(NPP_TONE_KEY, JSON.stringify(o));
    } catch {}
  }
  function nppToneProbe(src, cb) {
    let fin = false, burl = null, tm = 0;
    const done = (dark, ok) => { if (fin) return; fin = true; clearTimeout(tm); if (burl) { try { URL.revokeObjectURL(burl); } catch {} } cb(!!dark, !!ok); };
    tm = setTimeout(() => done(false, false), 3000);
    try {
      const im = new Image();
      im.onerror = () => done(false, false);
      im.onload = () => {
        try {
          const W0 = 48, cv = document.createElement('canvas'); cv.width = cv.height = W0;
          const cx = cv.getContext('2d', { willReadFrequently: true });
          cx.fillStyle = '#fff'; cx.fillRect(0, 0, W0, W0); cx.drawImage(im, 0, 0, W0, W0);
          const p = 6, q = Math.round(W0 * 0.25), regs = [[0, 0], [W0 - p, 0], [0, W0 - p], [W0 - p, W0 - p], [0, W0 - q, p * 2, p * 2]];
          let white = true;
          for (const g of regs) {
            const d = cx.getImageData(g[0], g[1], g[2] || p, g[3] || p).data; let rs = 0, gs = 0, bs = 0, n = 0;
            for (let i = 0; i < d.length; i += 4) { rs += d[i]; gs += d[i + 1]; bs += d[i + 2]; n++; }
            if (!n || rs / n < 240 || gs / n < 240 || bs / n < 240) { white = false; break; }
          }
          done(white, true);
        } catch { done(false, false); }
      };
      npLoadBlob(src, (u) => { if (!u) return done(false, false); burl = u; im.src = u; });
    } catch { done(false, false); }
  }
  function pickNameTone(card, src) {
    const set = (dark) => { if (nameToneSrc !== src) return; card.classList.toggle('npp-name-dark', dark); card.classList.toggle('npp-name-light', !dark); card.classList.remove('npp-tone-pending'); };
    if (nppToneCache.has(src)) return set(nppToneCache.get(src));
    const v = nppToneRead()[src];
    if (v === 'd' || v === 'l') { nppToneCache.set(src, v === 'd'); return set(v === 'd'); }
    card.classList.remove('npp-name-dark', 'npp-name-light'); card.classList.add('npp-tone-pending');
    nppToneProbe(src, (dark, ok) => { nppToneCache.set(src, dark); if (ok) nppToneSave(src, dark); set(dark); });
  }
  function setDock(open) {
    const wrap = $('#qrDockWrap'), dock = $('#qrDock');
    if (!wrap) return;
    dockOpen = open;
    wrap.classList.toggle('open', open);
    if (dock) dock.classList.toggle('open', open);
    document.body.classList.toggle('npDockActive', open);
    if (open) wrap.querySelectorAll('.qrPet').forEach(el => {
      if (el.dataset.loaded === '1' || !el.dataset.bg) return;
      el.style.backgroundImage = `url(${el.dataset.bg})`; el.dataset.loaded = '1';
    });
    if (open) wrap.querySelectorAll('.qrPet').forEach(el => {
      const ov = el.querySelector('.qrOverlay'), nm = el.querySelector('.qrPetName');
      if (!ov || ov.querySelector('.nppPetPage')) return;
      const name = ((nm && nm.textContent) || '').trim();
      if (!/^\w+$/.test(name)) return;
      const a = document.createElement('a');
      a.className = 'nppPetPage'; a.href = 'https://www.neopets.com/~' + name; a.textContent = 'Pet Page';
      ov.appendChild(a);
    });
  }
  function petUI() {
    const card = $('#npActivePet');
    if (!card || card.dataset.npp) return;
    card.dataset.npp = '1';
    const btn = document.createElement('button');
    btn.id = 'npPetDockBtn'; btn.type = 'button'; btn.title = 'Swap Active'; btn.setAttribute('aria-label', 'Swap Active'); btn.innerHTML = SWAP + '<span>Swap Active</span>';
    card.appendChild(btn);
    renderPetInfo(); fixPetImg();
    new MutationObserver(fixPetImg).observe(card, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'src'] });
    card.addEventListener('click', (e) => {
      const sbtn = e.target.closest('.nppStatsBtn');
      if (sbtn) {
        e.stopImmediatePropagation(); e.preventDefault();
        const wrap = $('#nppPetInfo .nppStats'), open = !(wrap && wrap.classList.contains('open'));
        if (wrap) wrap.classList.toggle('open', open);
        sbtn.classList.toggle('on', open); sbtn.setAttribute('aria-pressed', open ? 'true' : 'false');
        LSset('npp_stats_open', open ? '1' : '0');
        return;
      }
      const copy = e.target.closest('.nppCopy');
      if (copy) {
        e.stopImmediatePropagation(); e.preventDefault();
        const text = copy.dataset.copy;
        const flash = (ok) => {
          clearTimeout(copy._t);
          copy.classList.remove('done', 'fail'); void copy.offsetWidth;
          copy.classList.add(ok ? 'done' : 'fail');
          copy.innerHTML = ok ? CHECK : '×';
          copy.title = ok ? 'Copied!' : 'Copy failed';
          copy._t = setTimeout(() => { copy.classList.remove('done', 'fail'); copy.innerHTML = COPY; copy.title = 'Copy'; }, 1400);
        };
        const fallback = () => {
          try {
            const t = document.createElement('textarea');
            t.value = text; t.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(t); t.select();
            const ok = document.execCommand('copy'); t.remove(); flash(ok);
          } catch { flash(false); }
        };
        try { navigator.clipboard.writeText(text).then(() => flash(true), fallback); } catch { fallback(); }
      } else if (e.target.closest('.nppTitle a, .nppLinks a')) {
        e.stopImmediatePropagation();
      } else if (e.target.closest('#npPetDockBtn')) {
        e.stopImmediatePropagation(); e.preventDefault();
        setDock(!dockOpen);
      }
    }, true);
  }

  const FOLD_KEY = 'npp_fold_v1';
  function setupDailyFold() {
    if (isNc || isPopup) return;
    let st = {}; try { st = JSON.parse(LSget(FOLD_KEY) || '{}') || {}; } catch {}
    const card = $('#nppDaily');
    if (!card || card.querySelector(':scope > .nppFold')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'nppFold nppEye'; b.title = 'Hide notices'; b.setAttribute('aria-label', 'Hide notices');
    b.innerHTML = EYE;
    const apply = () => {
      const f = !!st.daily;
      card.classList.toggle('nppFolded', f);
      b.classList.toggle('up', f);
      b.innerHTML = f ? EYE : EYE_OFF;
      b.title = f ? 'Show notices' : 'Hide notices'; b.setAttribute('aria-label', b.title);
    };
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); st.daily = !st.daily; LSset(FOLD_KEY, JSON.stringify(st)); apply(); });
    card.prepend(b);
    apply();
  }
  function setupScrollTop() {
    if (isNc || isPopup || !document.body || document.getElementById('nppTop')) return;
    const b = document.createElement('button');
    b.id = 'nppTop'; b.type = 'button'; b.title = 'Back to top'; b.setAttribute('aria-label', 'Back to top');
    b.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 9.5 8 5l4.5 4.5"/></svg>';
    b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(b);
    const sync = () => b.classList.toggle('on', window.scrollY > 400);
    window.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  function highlightShopPrices() {
    if (!/[?&]type=shop\b/i.test(location.search) || !document.body) return;
    const targets = new Set(['10,000', '25,000']);
    document.querySelectorAll('.shop-item .item-img[data-price]').forEach(img => {
      if (!targets.has((img.dataset.price || '').trim())) return;
      const cost = [...img.closest('.shop-item').querySelectorAll('.item-stock')].find(p => /Cost:/i.test(p.textContent));
      if (cost) cost.classList.add('nppBigPrice');
    });
  }

  const SHOP_LOCK_MS = 5000;
  let shopLockSet = false;
  function lockShopkeeper() {
    if (shopLockSet || !/[?&]type=shop\b/i.test(location.search)) return;
    shopLockSet = true;
    const locked = () => performance.now() < SHOP_LOCK_MS;
    const block = (e) => {
      if (!locked() || !e.target.closest || !e.target.closest('.shop-bg')) return;
      e.preventDefault(); e.stopImmediatePropagation();
    };
    ['click', 'mousedown', 'pointerdown', 'auxclick'].forEach(t => window.addEventListener(t, block, true));
    if (!locked()) return;
    document.documentElement.classList.add('npp-shop-lock');
    setTimeout(() => document.documentElement.classList.remove('npp-shop-lock'), SHOP_LOCK_MS - performance.now());
  }

  function openHeaderMenu(id) {
    const sr = shadow(); if (!sr) return;
    const b = sr.querySelector(`.btn.cat[data-id="${id}"]`);
    if (b) b.dispatchEvent(new Event('pointerenter'));
  }
  function closeAllPanels() {
    const sr = shadow();
    if (sr) sr.querySelectorAll('.menu').forEach(m => { m.style.display = 'none'; });
    document.dispatchEvent(new CustomEvent('npp:drawer', { detail: 'none' }));
    document.querySelectorAll('.bankSettingsBackdrop').forEach(el => el.remove());
    if (dockOpen) setDock(false);
  }
  function setupKeys() {
    if (isNc || isPopup) return;
    const MENUS = { Digit1: 'community', Digit2: 'games', Digit3: 'explore', Digit4: 'shop', Digit5: 'premium' };
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      const typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
      if (e.key === 'Escape') { if (typing && t.blur) t.blur(); closeAllPanels(); return; }
      if (typing) return;
      if (e.altKey && MENUS[e.code]) { e.preventDefault(); openHeaderMenu(MENUS[e.code]); }
    }, true);
  }

  function abbrNum(el) {
    const t = el.textContent.trim();
    if (!/^[\d,]+$/.test(t)) return;
    const n = parseInt(t.replace(/,/g, ''), 10);
    if (!Number.isFinite(n)) return;
    const f = (v, u) => { const x = Math.floor(v * 10) / 10; return (x % 1 ? x.toFixed(1) : String(x)) + u; };
    const out = n >= 1e9 ? f(n / 1e9, 'B') : n >= 1e6 ? f(n / 1e6, 'M') : n >= 1e3 ? f(n / 1e3, 'K') : t;
    el.title = n.toLocaleString('en-US');
    if (el.textContent !== out) el.textContent = out;
  }
  function updateNc() {
    const el = $('#npNp .ncVal');
    if (!el) return;
    const live = (($('#ncanchor') || {}).textContent || '').trim();
    if (live) LSset('npp_nc_last', live);
    const v = live || LSget('npp_nc_last');
    if (v && el.dataset.raw !== v) { el.dataset.raw = v; el.textContent = v; }
  }
  function setupBank() {
    const np = $('#npNp'), bank = $('#npBank');
    if (!np || !bank || np.dataset.acc || !$('#npBal', bank)) return;
    np.dataset.acc = '1';
    const val = $('.npVal', np), img = $('img', np);
    np.innerHTML = '';
    const top = document.createElement('div');
    top.className = 'np-top-row';
    top.innerHTML = `<div class="np-amounts"><a class="np-amount" href="https://www.neopets.com/inventory.phtml" title="Inventory"><span class="npVal">${esc(val ? val.textContent : '…')}</span>${img ? img.outerHTML : ''}</a><a class="np-nc" href="https://ncmall.neopets.com/mall/shop.phtml?layout=new" title="NC Mall"><span class="ncVal">…</span><img src="https://images.neopets.com/themes/h5/basic/images/nc-icon.svg" alt="" onerror="this.remove()"></a><a class="np-bank" href="https://www.neopets.com/bank.phtml" title="Bank" aria-label="Bank"></a></div>`;
    top.querySelector('.np-bank').innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 1 1.5 4.5V6h13V4.5z"/><rect x="2.5" y="7" width="2" height="5"/><rect x="7" y="7" width="2" height="5"/><rect x="11.5" y="7" width="2" height="5"/><rect x="1.5" y="13" width="13" height="1.8" rx=".4"/></svg>';
    np.append(top);
    updateNc();
    ['.npVal', '.ncVal'].forEach(sel => {
      const el = top.querySelector(sel);
      if (!el) return;
      new MutationObserver(() => abbrNum(el)).observe(el, { childList: true, characterData: true, subtree: true });
      abbrNum(el);
    });
    [top].forEach(el => ['click', 'auxclick', 'contextmenu'].forEach(t => el.addEventListener(t, e => e.stopPropagation())));
  }

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
    st.textContent = 'html.npp-auth #npx-host, html.npp-auth #npHud, html.npp-auth #npLeftBar, html.npp-auth #btnOverlay, html.npp-auth #npxSideBtnHost, html.npp-auth #npBgHandle, html.npp-auth #npBgSidebar, html.npp-auth #qrDockWrap, html.npp-auth #npHudResizer, html.npp-auth #npxFrameResizeR, html.npp-auth #npxFrameResizeB, html.npp-auth #npxScrollTrack, html.npp-auth #nppFoot, html.npp-auth #nppTools, html.npp-auth #nppBell,html.npp-auth #nppNestPop, html.npp-auth #nppNestMenu { display: none !important; }\nhtml.npp-auth, html.npp-auth body { visibility: visible !important; opacity: 1 !important; }';
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

  function ensureDefaults() {
    if (LSget('npp_defaults_v3')) return;
    const put = (k, v) => { if (LSget(k)) return false; LSset(k, v); return true; };
    const t = put('npqol_btn_theme_v1', 'premium'), a = put('npqol_accent_v1', NP_ORANGE);
    put('npqol_topbar_bg_v1', 'blur');
    LSset('npp_defaults_v3', '1');
    if (t) NQ.applyBtnTheme('premium');
    if (a) NQ.applyAccent(NP_ORANGE);
  }
  function applySynced() {
    if (!isNc) return;
    const A = NQ.sideBtns;
    try {
      NQ.applyAccent(LSget('npqol_accent_v1') || NP_ORANGE);
      const t = LSget('npqol_btn_theme_v1');
      if (t) NQ.applyBtnTheme(t);
      const clean = (u) => String(u).replace(/["\\\n\r]/g, '');
      const mi = LSget(K.mainImg), li = LSget(K.leftImg);
      if (mi) { rs.setProperty('--npMainSolid', '#000'); rs.setProperty('--npWallImage', `url("${clean(mi)}")`); }
      if (li) { rs.setProperty('--npLeftBarImg', `url("${clean(li)}")`); rs.setProperty('--npLeftBarSolid', '#000'); rs.setProperty('--npLeftBarShadeA', '1'); }
      root.classList.remove('np-recolor-site');
      paintAll(saved());
      if (A) {
        A.setLayout(A.getLayout()); A.setSide(A.getSide()); A.setColOffset(A.getColOffset()); A.setIconSize(A.getIconSize());
        A.setColShift(A.getColShift()); A.setColX(A.getColX()); A.rebuild();
      }
    } catch {}
  }

  const ICONS_KEY = 'npp_side_icons_v1';
  const NPP_CHEV = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6l5 5 5-5"/></svg>';
  let hudMo = null;
  let hudWait = null;
  let npFitRaf = 0, npFitMo = null;
  function fitNpVals() {
    const root = $('#npNp'); if (!root) return;
    root.querySelectorAll('.np-top-row .np-amount, .np-top-row .np-nc').forEach((tile) => {
      const v = tile.querySelector('.npVal, .ncVal'); if (!v) return;
      tile.style.flexGrow = String(Math.max(1, (v.textContent || '').trim().length));
      let px = 14; v.style.setProperty('font-size', px + 'px', 'important');
      while (px > 9 && v.scrollWidth > v.clientWidth) { px -= 1; v.style.setProperty('font-size', px + 'px', 'important'); }
    });
  }
  function scheduleNpFit() { cancelAnimationFrame(npFitRaf); npFitRaf = requestAnimationFrame(fitNpVals); }
  function watchNpFit() {
    const root = $('#npNp'); if (!root) return;
    if (!npFitMo) { npFitMo = new MutationObserver(scheduleNpFit); window.addEventListener('resize', scheduleNpFit); }
    npFitMo.disconnect(); npFitMo.observe(root, { childList: true, subtree: true, characterData: true });
    scheduleNpFit(); setTimeout(scheduleNpFit, 600); setTimeout(scheduleNpFit, 2000);
  }
  function layoutSidebar() {
    if (isNc || isPopup) return;
    const hud = $('#npHud');
    if (!hud) {
      if (!hudWait) { hudWait = new MutationObserver(() => { if ($('#npHud')) { hudWait.disconnect(); layoutSidebar(); } }); hudWait.observe(document.documentElement, { childList: true, subtree: true }); }
      return;
    }
    { const npA = $('#npNp .np-amount'), ncA = $('#npNp .np-nc'); if (npA && !npA.getAttribute('aria-label')) { npA.setAttribute('aria-label', 'Neopoints'); npA.title = 'Neopoints'; } if (ncA && !ncA.getAttribute('aria-label')) { ncA.setAttribute('aria-label', 'Neocash'); ncA.title = 'Neocash'; } }
    watchNpFit();
    let mod = $('#nppIcons');
    const ov = $('#btnOverlay');
    if (!mod && ov) {
      mod = document.createElement('div');
      mod.id = 'nppIcons';
      mod.innerHTML = `<button type="button" class="nppIcHead" aria-expanded="true"><span>Shortcuts</span>${NPP_CHEV}</button><div class="nppIcBody"></div>`;
      const shut = LSget(ICONS_KEY) === '0';
      mod.classList.toggle('nppShut', shut);
      $('.nppIcHead', mod).setAttribute('aria-expanded', shut ? 'false' : 'true');
      $('.nppIcHead', mod).addEventListener('click', () => {
        const f = mod.classList.toggle('nppShut');
        $('.nppIcHead', mod).setAttribute('aria-expanded', f ? 'false' : 'true');
        LSset(ICONS_KEY, f ? '0' : '1');
      });
    }
    if (mod && ov && !mod.contains(ov)) { $('.nppIcBody', mod).appendChild(ov); ov.classList.add('nppIn'); }
    let nav = $('#nppNavMod');
    if (!nav) { nav = document.createElement('div'); nav.id = 'nppNavMod'; }
    const foot = $('#nppFoot');
    const un = $('#npUser');
    const lists = $('#nppListsMod'), anchor = lists && lists.parentNode === hud ? lists : un;
    if (nav.parentNode !== hud) hud.insertBefore(nav, anchor && anchor.parentNode === hud ? anchor.nextSibling : hud.firstChild);
    if (foot && foot.parentNode !== hud) hud.appendChild(foot);
    if (mod && hud.lastElementChild !== mod) hud.appendChild(mod);
    if (!hudMo) {
      let raf = 0;
      hudMo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layoutSidebar); });
      hudMo.observe(hud, { childList: true });
    }
  }

  function buildNav() {
    const sr = shadow(), mod = $('#nppNavMod');
    if (!sr || !mod) return;
    const seen = new Set(), html = [];
    sr.querySelectorAll('.left .btn').forEach((b) => {
      const label = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (!label) return;
      const id = b.dataset && b.dataset.id, menu = id ? sr.getElementById('menu-' + id) : null;
      const links = menu ? [...menu.querySelectorAll('a[href]')].filter(a => { const h = a.getAttribute('href'); return h && h !== '#' && !a.closest('.menuAddRow'); }).map(a => [(a.textContent || '').replace(/\s+/g, ' ').trim(), a.href]).filter(l => l[0]) : [];
      if (links.length) html.push(`<div class="nppNavGrp"><button type="button" class="nppNavHead" aria-expanded="false"><span>${esc(label)}</span>${NPP_CHEV}</button><div class="nppNavLinks">${links.map(l => `<a href="${esc(l[1])}">${esc(l[0])}</a>`).join('')}</div></div>`);
      else if (b.href && !seen.has(b.href)) { seen.add(b.href); html.push(`<div class="nppNavGrp"><a class="nppNavSolo" href="${esc(b.href)}">${esc(label)}</a></div>`); }
    });
    const out = html.join('');
    if (mod._html === out) return;
    const open = new Set([...mod.querySelectorAll('.nppNavGrp.open .nppNavHead span')].map(x => x.textContent));
    mod.innerHTML = out; mod._html = out;
    mod.querySelectorAll('.nppNavGrp').forEach(g => { const h = $('.nppNavHead span', g); if (h && open.has(h.textContent)) g.classList.add('open'); });
    if (!mod._wired) {
      mod._wired = true;
      mod.addEventListener('click', (e) => {
        const h = e.target.closest('.nppNavHead'); if (!h) return;
        const g = h.parentNode, o = g.classList.toggle('open');
        h.setAttribute('aria-expanded', o ? 'true' : 'false');
      });
    }
  }

  function setupDrawer() {
    if (isNc || isPopup || !document.body) return;
    const host = $('#npx-host');
    if (host && !host.classList.contains('nppHam')) host.classList.add('nppHam');
    const sr0 = host && host.shadowRoot;
    if (sr0) sr0.querySelectorAll('.left .btn:not([title])').forEach(b => { const t = (b.textContent || '').replace(/\s+/g, ' ').trim(); if (t) b.title = t; });
    if ($('#nppMenuBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'nppMenuBtn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Open menu'); btn.setAttribute('aria-controls', 'npHud'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    const scrim = document.createElement('div'); scrim.id = 'nppScrim'; scrim.setAttribute('aria-hidden', 'true');
    const cls = document.createElement('button'); cls.id = 'nppDrawerClose'; cls.type = 'button'; cls.setAttribute('aria-label', 'Close menu'); cls.textContent = '\u00d7';
    document.body.append(btn, scrim, cls);
    const isOpen = () => root.classList.contains('nppDrawerOpen');
    const set = (open) => {
      if (open === isOpen()) return;
      root.classList.toggle('nppDrawerOpen', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { document.dispatchEvent(new CustomEvent('npp:drawer', { detail: 'side' })); buildNav(); setTimeout(() => cls.focus({ preventScroll: true }), 30); }
      else { const hud = $('#npHud'); if (hud && hud.contains(document.activeElement)) btn.focus({ preventScroll: true }); }
    };
    btn.addEventListener('click', () => set(!isOpen()));
    scrim.addEventListener('click', () => set(false));
    cls.addEventListener('click', () => set(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) set(false); });
    document.addEventListener('npp:drawer', (e) => { if (e.detail !== 'side') set(false); });
    const mq = window.matchMedia('(min-width: 1101px)');
    const wide = (e) => { if (e.matches) set(false); };
    if (mq.addEventListener) mq.addEventListener('change', wide); else if (mq.addListener) mq.addListener(wide);
  }

  if (!isAuth && !isNc && !isPopup) {
    root.classList.add('npp-pre');
    try { if (localStorage.getItem('npp_side_light') === '1') root.classList.add('npp-side-light'); } catch (er) {}
    const pre = document.createElement('style');
    pre.id = 'npp-pre-css';
    pre.textContent = 'html.npp-pre #npHud, html.npp-pre #nppFoot, html.npp-pre #btnOverlay, html.npp-pre #npLeftBar, html.npp-pre #qrDockWrap { opacity: 0 !important; pointer-events: none !important; } html.npp-pre #npActivePet img { max-width: 100% !important; max-height: 170px !important; object-fit: contain !important; } #npHud, #nppFoot, #btnOverlay { transition: opacity .3s ease; } @media (prefers-reduced-motion: reduce) { #npHud, #nppFoot, #btnOverlay { transition: none !important; } }';
    (document.head || root).appendChild(pre);
    setTimeout(() => root.classList.remove('npp-pre'), 5000);
  }
  function boot() {
    if (root.dataset.nppBoot) return;
    root.dataset.nppBoot = '1';
    if (isAuth) { stripUi(); document.addEventListener('DOMContentLoaded', stripUi, { once: true }); return; }
    if (isPopup) root.classList.add('npp-popup');
    if (path.startsWith('/reg/page4.phtml')) root.classList.add('npp-reg4');
    if (/^\/home(\/|$)/.test(path)) root.classList.add('npp-home');
    if (isNc) root.classList.add('npp-nc');
    if (!isNc && !isPopup) {
      root.classList.add('npp-wait');
      root.classList.remove('npp-pre');
      setTimeout(() => { petWaited = true; unwait(); }, 2200);
      setTimeout(() => root.classList.remove('npp-wait'), 3000);
    }

    const css = document.createElement('style');
    css.id = 'npp-css'; css.textContent = (isNc ? NC_CSS : PAGE_CSS + LAYOUT_CSS) + BAR_CSS;
    (document.head || root).appendChild(css);
    const font = document.createElement('link');
    font.rel = 'stylesheet'; font.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap';
    (document.head || root).appendChild(font);

    if (isNc) {
      const core = document.getElementById('np-core-layout');
      if (core) {
        const t = core.textContent, i = t.indexOf('--np-frame-shift');
        const cut = i > 0 ? t.lastIndexOf(':root', i) : -1;
        if (cut > 0) core.textContent = t.slice(0, cut);
      }
    }

    ['npqol_frame_size_v1', 'npqol_col_width_v1'].forEach(LSdel);
    ['--np-frame-minh', '--np-frame-width', '--np-col-width'].forEach(p => rs.removeProperty(p));

    ensureDefaults();
    applyBarStyle(LSget('npqol_topbar_bg_v1'));
    applyLogo();
    if (isNc) root.classList.remove('np-recolor-site'); else root.classList.toggle('np-recolor-site', LSget('npqol_recolor_site_v1') === '1');
    try { if (!rs.getPropertyValue('--np-accent-l60') ) NQ.applyAccent(NQ.getAccent() || '#ffffff'); } catch {}
    applyAccentContrast();
    NQ.onAccent((hex) => { if (!ownAccent && !saving) accentPick = null; applyAccentContrast(hex); applySearchContrast(); });
    paintAll(saved());
    applySynced();
    document.addEventListener('DOMContentLoaded', () => { paintAll(saved()); setTimeout(() => paintAll(saved()), 800); }, { once: true });

    patchShadow();
    globalListeners();
    setupKeys();
    setupClock(); fixNcNavLinks(); setupPremium(); lockShortcuts(); lockShopkeeper();
    const build = () => {
      buildFooter(); setupTools(); setupScrollTop(); setupBell(); setupNest(); patchEditor(); layoutSidebar(); setupDrawer();
      setupBank(); petUI(); setupDailyFold(); wireSidebar(); setupPremium(); highlightShopPrices(); updateNc();
      unwait();
    };
    if (document.body) build();
    else new MutationObserver((_, o) => { if (document.body) { o.disconnect(); build(); } }).observe(root, { childList: true });
    document.addEventListener('DOMContentLoaded', build, { once: true });
    window.addEventListener('load', build, { once: true });
    if (NQ.dailies && NQ.dailies.onCard) NQ.dailies.onCard(setupDailyFold);
    const petInfo = () => { if (!staleTab()) renderPetInfo(); };
    if (NQ.onQrData) NQ.onQrData(petInfo);
    window.addEventListener('storage', (e) => { if (e.key === 'npqol_qr_data') petInfo(); });
  }

  if (!isNc && !isPopup && /^\/home(\/|$)/.test(path)) {
    const fixHomeBg = () => { try { if (typeof W.bodyHeightAdjust2020 === 'function') W.bodyHeightAdjust2020(); } catch {} };
    let rz = 0; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fixHomeBg, 150); });
    window.addEventListener('load', () => { [200, 900, 2200, 4500].forEach(t => setTimeout(fixHomeBg, t)); });
  }

  if (NQ.base) boot();
})();
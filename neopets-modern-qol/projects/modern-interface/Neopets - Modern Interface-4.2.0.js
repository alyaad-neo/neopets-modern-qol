// ==UserScript==
// @name         Neopets - Modern Interface
// @namespace    neopets-qol
// @version      4.2.8
// @author       marius@clraik
// @license      MIT
// @description  Fixes Neopets.com's UI in one coherent, fully customizable skin: layout, icons, colors, backgrounds. 1) fixed top bar (search, NST clock, alerts) + drag-resizable content frame 2) left sidebar: user info, Bank graph & shortcuts, NP balance, QuickRef card 3) right sidebar: color theme + DTI backgrounds. 100% UI, zero automation. (Formerly "① Core & Layout": now absorbs "② HUD" and "③ Background & Decor" — uninstall those two, settings carry over automatically.)
// @match        *://*.neopets.com/*
// @exclude      https://www.neopets.com/~*
// @exclude      *://*.neopets.com/
// @exclude      *://*.neopets.com/faeriefragments*
// @exclude      *://*.neopets.com/talesofdacardia*
// @exclude      *://www.neopets.com/index.phtml*
// @exclude      *://www.neopets.com/login*
// @exclude      *://www.neopets.com/logout*
// @exclude      *://www.neopets.com/loginpage.phtml*
// @exclude      *://www.neopets.com/signin*
// @exclude      *://www.neopets.com/neopass*
// @exclude      https://www.neopets.com/games/game.phtml?*
// @icon         https://images.neopets.com/themes/h5/neopiantimes/images/mypets-icon.svg
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      impress.openneo.net
// @connect      impress-2020.openneo.net
// @downloadURL https://update.greasyfork.org/scripts/581877/Neopets%20-%20Modern%20Interface.user.js
// @updateURL https://update.greasyfork.org/scripts/581877/Neopets%20-%20Modern%20Interface.meta.js
// ==/UserScript==
(function () {
  'use strict';

  // Based on "Neopets - Modern Interface" by marius@clraik, MIT License.

  const PW = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

  if (window.top !== window) return;
  if (!/^(www\.|ncmall\.)?neopets\.com$/i.test(location.hostname)) return;
  {
    const p = location.pathname;
    if (p === '/' || p.startsWith('/~') || p.startsWith('/faeriefragments') ||
        p.startsWith('/talesofdacardia') ||
        (p === '/games/game.phtml' && location.search)) return;
  }

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
  if (!NP_RUN_ON_PHONES && npIsPhone()){
    let forced = false;
    try { forced = localStorage.getItem('npqol_mobile_v1') === 'on'; } catch {}
    if (!forced) return;
  }

  try { document.documentElement.dataset.npModernInterface = '1'; } catch {}
  NQ.base = true;

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

(function () {
  'use strict';
  if (document.getElementById('np-core-layout')) return;

  const KEEP_NATIVE_BG_PATHS = [
    '/inventory.phtml',
    '/bank.phtml',
  ];
  if (KEEP_NATIVE_BG_PATHS.some(p => location.pathname.startsWith(p))) {
    document.documentElement.classList.add('np-keep-native-bg');
  }

  (function exposeBtnThemes(){
    const BTN_THEMES = [
      { id:'winterholiday',     label:'Winter Holiday',     pattern:'https://images.neopets.com/themes/h5/winterholiday/images/{icon}-icon.png' },
      { id:'basic',             label:'Basic',              pattern:'https://images.neopets.com/themes/h5/basic/images/v3/{icon}-icon.svg' },
      { id:'premium',           label:'Premium',            pattern:'https://images.neopets.com/themes/h5/premium/images/{icon}-icon.svg' },
      { id:'altadorcup',        label:'Altador Cup',        pattern:'https://images.neopets.com/themes/h5/altadorcup/images/{icon}-icon.png' },
      { id:'constellations',    label:'Constellations',     pattern:'https://images.neopets.com/themes/h5/constellations/images/{icon}-icon.svg' },
      { id:'birthday',          label:'Birthday',           pattern:'https://images.neopets.com/themes/h5/birthday/images/{icon}-icon.png' },
      { id:'destroyedfestival', label:'Faerie Festival',    pattern:'https://images.neopets.com/themes/h5/destroyedfestival/images/{icon}-icon.svg' },
      { id:'neggs',             label:'Festival of Neggs',  pattern:'https://images.neopets.com/themes/h5/neggs/images/{icon}-icon.svg' },
      { id:'grey',              label:'Grey Day',           pattern:'https://images.neopets.com/themes/h5/grey/images/{icon}-icon.png' },
      { id:'newyears',          label:'New Year',           pattern:'https://images.neopets.com/themes/h5/newyears/images/{icon}-icon.png' },
      { id:'hauntedwoods',      label:'Haunted Woods',      pattern:'https://images.neopets.com/themes/h5/hauntedwoods/images/{icon}-icon.svg' },
      { id:'meridell',          label:'Meridell',           pattern:'https://images.neopets.com/themes/h5/meridell/images/{icon}-icon.svg' },
      { id:'mysteryisland',     label:'Mystery Island',     pattern:'https://images.neopets.com/themes/h5/mysteryisland/images/{icon}-icon.png' },
      { id:'neopiantimes',      label:'Neopian Times',      pattern:'https://images.neopets.com/themes/h5/neopiantimes/images/{icon}-icon.svg' },
      { id:'neggsneovia',       label:'Neovian Neggs',      pattern:'https://images.neopets.com/themes/h5/neggsneovia/images/{icon}-icon.svg' },
      { id:'tistheseason',      label:'Tis the Season',     pattern:'https://images.neopets.com/themes/h5/tistheseason/images/{icon}-icon.png' },
      { id:'tyrannia',          label:'Tyrannia',           pattern:'https://images.neopets.com/themes/h5/tyrannia/images/{icon}-icon.svg' },
      { id:'valentines',        label:'Valentines',         pattern:'https://images.neopets.com/themes/h5/valentines/images/{icon}-icon.svg' },
    ];
    const FALLBACK_PATTERN = 'https://images.neopets.com/themes/h5/basic/images/v3/{icon}-icon.svg';
    const LS_KEY = 'npqol_btn_theme_v1';
    const DEFAULT = 'constellations';

    NQ.btnThemesData = { BTN_THEMES, FALLBACK_PATTERN, LS_KEY, DEFAULT };
    NQ.btnThemes = BTN_THEMES.map(t => ({ id: t.id, label: t.label }));

    NQ.getBtnTheme = () => {
      try { return localStorage.getItem(LS_KEY) || DEFAULT; }
      catch { return DEFAULT; }
    };
    const themeListeners = [];
    NQ.onBtnTheme = (fn) => { themeListeners.push(fn); };
    NQ.applyBtnTheme = (id) => {
      themeListeners.forEach(fn => { try { fn(id); } catch {} });
    };
    NQ.saveBtnTheme = (id) => {
      try { localStorage.setItem(LS_KEY, id); } catch {}
      NQ.applyBtnTheme(id);
    };

    NQ.btnIconUrl = (iconName, themeId) => {
      const t = BTN_THEMES.find(x => x.id === themeId) || BTN_THEMES.find(x => x.id === DEFAULT);
      return (t || { pattern: FALLBACK_PATTERN }).pattern.replace('{icon}', iconName);
    };

    NQ.btnFallbackChain = [
      'https://images.neopets.com/themes/h5/basic/images/v3/{icon}-icon.svg',
      'https://images.neopets.com/themes/h5/basic/images/{icon}-icon.svg',
      'https://images.neopets.com/themes/h5/basic/images/{icon}-icon.png',
    ];
    NQ.attachBtnFallback = (img, iconName) => {
      if (!img || !iconName) return;
      const tried = new Set();
      let extSwapped = false;
      let chainStep = 0;
      img.onerror = () => {
        const current = img.src || '';
        tried.add(current);

        if (!extSwapped){
          extSwapped = true;
          const m = current.match(/^(.+\/)([^\/]+)-icon\.(svg|png)(\?.*)?$/i);
          if (m){
            const altExt = m[3].toLowerCase() === 'png' ? 'svg' : 'png';
            const altUrl = `${m[1]}${iconName}-icon.${altExt}`;
            if (!tried.has(altUrl)){
              img.src = altUrl;
              return;
            }
          }
        }

        const chain = NQ.btnFallbackChain || [];
        while (chainStep < chain.length){
          const next = chain[chainStep++].replace('{icon}', iconName);
          if (!tried.has(next)){
            img.src = next;
            return;
          }
        }
        img.onerror = null;
      };
    };
  })();

  (function exposeAccent(){
    const LS_KEY = 'npqol_accent_v1';
    const DEFAULT_HEX = '#dcb8ff';

    function hexToRgb(hex){
      let h = String(hex || '').replace('#','').trim();
      if (h.length === 3) h = h.split('').map(c => c+c).join('');
      const n = parseInt(h, 16);
      if (!Number.isFinite(n) || h.length !== 6) return { r:220, g:184, b:255 };
      return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
    }
    const rgba = (hex, a) => { const {r,g,b} = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

    function hexToHsl(hex){
      const { r, g, b } = hexToRgb(hex);
      const rr = r/255, gg = g/255, bb = b/255;
      const max = Math.max(rr,gg,bb), min = Math.min(rr,gg,bb), d = max - min;
      const l = (max + min) / 2;
      let h = 0, s = 0;
      if (d){
        s = l > 0.5 ? d/(2 - max - min) : d/(max + min);
        switch (max){
          case rr: h = (gg - bb)/d + (gg < bb ? 6 : 0); break;
          case gg: h = (bb - rr)/d + 2; break;
          default: h = (rr - gg)/d + 4; break;
        }
        h *= 60;
      }
      return { h, s, l };
    }
    const NEO_GOLD_HUE = 40;

    function setCSSVars(hex){
      const root = document.documentElement;
      root.style.setProperty('--np-accent',       hex);
      root.style.setProperty('--np-accent-bg',    rgba(hex, .14));
      root.style.setProperty('--np-accent-line',  rgba(hex, .45));
      root.style.setProperty('--np-accent-soft',  rgba(hex, .08));
      root.style.setProperty('--np-accent-hover', rgba(hex, .28));
      root.style.setProperty('--np-accent-r', String(hexToRgb(hex).r));
      root.style.setProperty('--np-accent-g', String(hexToRgb(hex).g));
      root.style.setProperty('--np-accent-b', String(hexToRgb(hex).b));

      const { h, s, l } = hexToHsl(hex);
      const sPct = Math.round(s * 100);
      const shade = (L) => `hsl(${h.toFixed(1)}, ${sPct}%, ${L}%)`;
      root.style.setProperty('--np-accent-l90', shade(90));
      root.style.setProperty('--np-accent-l75', shade(75));
      root.style.setProperty('--np-accent-l60', shade(60));
      root.style.setProperty('--np-accent-l45', shade(45));
      root.style.setProperty('--np-accent-l30', shade(30));

      const textL = Math.max(l, 0.82);
      root.style.setProperty('--np-accent-text', `hsl(${h.toFixed(1)}, ${sPct}%, ${Math.round(textL * 100)}%)`);

      const rot = ((h - NEO_GOLD_HUE) % 360 + 360) % 360;
      root.style.setProperty('--np-accent-huerot', rot.toFixed(1) + 'deg');
      root.style.setProperty('--np-accent-sat',    Math.min(6, s / 0.244).toFixed(2));
      root.style.setProperty('--np-accent-bright', (0.6 + 0.7 * l).toFixed(2));
    }

    function getAccent(){
      try { return localStorage.getItem(LS_KEY) || DEFAULT_HEX; }
      catch { return DEFAULT_HEX; }
    }
    function applyAccent(hex){
      hex = (/^#[0-9a-fA-F]{3,8}$/.test(hex||'')) ? hex : DEFAULT_HEX;
      setCSSVars(hex);
      accentListeners.forEach(fn => { try { fn(hex); } catch {} });
    }

    const accentListeners = [];
    NQ.onAccent = (fn) => { accentListeners.push(fn); };
    NQ.getAccent = getAccent;
    NQ.applyAccent = applyAccent;

    applyAccent(getAccent());
  })();

  const THEME = `
    :root{
      --np-font: system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;

      --np-accent:#dcb8ff;
      --np-accent-text:#e3c8ff;
      --np-accent-bg:rgba(220,184,255,.14);
      --np-accent-line:rgba(220,184,255,.45);
      --np-accent-soft:rgba(220,184,255,.08);
      --np-accent-hover:rgba(220,184,255,.28);

      --np-ink:#fff;
      --np-ink-soft:rgba(255,255,255,.62);

      --np-glass:rgba(0,0,0,.22);
      --np-glass-hover:rgba(0,0,0,.30);
      --np-line:rgba(255,255,255,.16);
      --np-line-hover:rgba(255,255,255,.30);

      --np-btn:rgba(255,255,255,.06);
      --np-btn-hover:rgba(255,255,255,.10);

      --np-radius:14px;
      --np-radius-sm:10px;
      --np-shadow:0 8px 24px rgba(0,0,0,.28);
      --np-blur:8px;

      --np-bar-bg:transparent;
      --np-bar-backdrop:none;
      --np-bar-line:transparent;
      --np-bar-shadow:none;
      --np-bar-inset-left:0px;

      --np-side-icon-size:60px;

      --np-gap:10px;
      --np-col-width:330px;
      --np-hud-left:20px;
      --np-hud-top:10px;
      --np-hud-bottom:10px;
      --np-hud-width:290px;

      --np-z-bg:-2147483640;
      --np-z-bar:1000;
      --np-z-hud:1000;
      --np-z-menu:2000;
    }
  `;

  const BAR_H = 60;
  const FRAME = `
    :root{
      --np-frame-shift: var(--np-col-width, 0px);
      --np-frame-width: clamp(600px, calc(100vw - var(--np-frame-shift) - 40px), 1100px);
      --np-content-drop: 0px;
      --np-top-offset: calc(100px + var(--np-content-drop, 0px));
      --np-h5-gap: 0px;
      --np-frame-radius: 30px;
      --np-frame-padding: 16px;
      --np-frame-border: 2px solid #000;
      --np-bottom-spacer: 10px;
    }

    body#neobdy{ --np-h5-gap: 0px; }

    html, body {
      -ms-overflow-style: none;
      scrollbar-width: none;
      margin-top: 0 !important;
      padding-top: 0 !important;
      scroll-padding-top: var(--np-top-offset) !important;
      padding-bottom: var(--np-bottom-spacer) !important;
    }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
    body::after{ content:""; display:block; height:var(--np-bottom-spacer); }

    #pushdown_banner,#ad-slug-wrapper,#ad-table,#ad-table-btf,
    .nl-instream-video,.nl-ads-leaderWrapper,#nl_ad_left,#nl_ad_right,
    [id^="pb-slot-"],#header,#navigation,#template_nav,#ban,#nst,
    #navtop__2020,#navbottom__2020,#footer,.footer,.footerNifty,
    .footer__2020,#nl_mobile_ad,.nl-ad-top,.nl-mobile-ad,.nl-ad-left,.nl-ad-right{
      display:none !important;
      visibility:hidden !important;
      height:0 !important;
      margin:0 !important;
      padding:0 !important;
      overflow:hidden !important;
    }

    td.sidebar, td.sidebar .sidebarModule{
      display:none !important;
      width:0 !important;
      height:0 !important;
      overflow:hidden !important;
    }

    #content, td.content{ width:100% !important; }

    body .navsub-left__2020,
    body .navsub-right__2020,
    body .navsub-fav-icon__2020,
    body .bookmark-dropdown__2020,
    body .bookmark-dropdown-shade__2020{
      display:none !important;
      width:0 !important; height:0 !important;
      margin:0 !important; padding:0 !important;
      overflow:hidden !important;
    }
    body #navsub-buffer__2020{
      display:none !important;
      height:0 !important; margin:0 !important; padding:0 !important;
    }

    body :where(
      #container__2020,#content,#pageContent,#contentContainer,
      #main,main,.inner-body,.content,#np-content,#alpha-inner
    ){
      width:var(--np-frame-width) !important;
      max-width: var(--np-frame-width) !important;
      margin-top: var(--np-top-offset) !important;
      margin-bottom: 0 !important;
      margin-right: auto !important;
      margin-left: max(
        calc((100vw - var(--np-frame-width)) / 2),
        var(--np-frame-shift)
      ) !important;
      padding:var(--np-frame-padding) !important;
      box-sizing:border-box !important;
      border:var(--np-frame-border) !important;
      border-radius:var(--np-frame-radius) !important;
      background-clip:padding-box !important;
    }
    html:not(.np-keep-native-bg) body :where(
      #container__2020,#content,#pageContent,#contentContainer,
      #main,main,.inner-body,.content,#np-content,#alpha-inner
    ){
      background-color:#fff !important;
      background-image:none !important;
    }

    html:not(.np-keep-native-bg) body .container.theme-bg,
    html:not(.np-keep-native-bg) body #container__2020.theme-bg,
    html:not(.np-keep-native-bg) body .container,
    html:not(.np-keep-native-bg) body .theme-bg{
      background-color:#fff !important;
      background-image:none !important;
    }

    body #container__2020{
      margin-top: calc(var(--np-top-offset) + var(--np-h5-gap)) !important;
    }

    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) > :first-child{
      margin-top:0 !important; padding-top:0 !important;
    }
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) > br:first-child,
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) > hr:first-child{
      display:none !important;
    }
    body .page-title__2020, body .inv-title-container { margin-top:0 !important; padding-top:0 !important; }
    body .page-title__2020 :is(h1,h2,h3), body .inv-title-container :is(h1,h2,h3){ margin-top:0 !important; }

    body #boardList, body #boardTopic, body #boardIndex, body #boardCreateTopic{
      margin-top:0 !important;
    }

    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner)
    :is(table,thead,tbody,tfoot,tr,td,th){
      border:0 !important; outline:0 !important; box-shadow:none !important;
      border-collapse:separate !important; border-spacing:0 !important;
    }
    html:not(.np-keep-native-bg) body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner)
    :is(table,thead,tbody,tfoot,tr,td,th){
      background-image:none !important;
    }
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) img{
      border:0 !important; outline:0 !important; box-shadow:none !important;
    }

    body#neobdy td.content > div[style*="float: right"][style*="width: 160px"]{
      display:none !important;
    }
    body#neobdy td.content > div[style*="width: 635px"]{
      width:auto !important; max-width:100% !important;
      margin-left:auto !important; margin-right:auto !important;
    }
    body#neobdy td.content::after{ content:""; display:block; clear:both; }

    html body .inv-menubar,
    html body .sdb-menubar,
    html body .closet-menubar,
    html body .quickstock-menubar,
    html body .gallery-menubar{
      display:flex !important;
      visibility:visible !important;
      opacity:1 !important;
      background:transparent !important;
      height:auto !important;
      width:auto !important;
      overflow:visible !important;
      pointer-events:auto !important;
    }
    html body .page-title__2020,
    html body .inv-title-container{
      position:relative !important;
    }
    html body .inv-menubar{
      position:absolute !important;
      top:50% !important;
      right:24px !important;
      transform:translateY(-50%) !important;
      gap:8px !important;
    }
    html:root body .inv-menubar{
      position:static !important;
      transform:none !important;
      flex-wrap:wrap !important;
      justify-content:flex-end !important;
      row-gap:6px !important;
      column-gap:8px !important;
      margin:0 !important;
    }
    html:root body [class*="-menulinks"]{
      margin-bottom:0 !important;
    }
    html:root body :is(.quickstock-menubar, .gallery-menubar){
      display:flex !important;
      visibility:visible !important;
      opacity:1 !important;
      height:auto !important;
      width:auto !important;
      overflow:visible !important;
      pointer-events:auto !important;
    }
    html body .inv-filtericons{
      visibility:visible !important;
      opacity:1 !important;
      position:relative !important;
      z-index:50 !important;
    }

    body :is(
      .sdb-header-back, .sdb-header-description,
      .inv-header-back, .inv-header-description,
      .closet-header-back, .closet-header-description,
      .quickstock-header-back, .quickstock-menubar, .quickstock-header-description,
      .gallery-header-back, .gallery-menubar, .gallery-header-description,
      .back-button-circle__2020,
      #pageDesc, #qs-instructions,
      #bdHeader,
      .social-links, .fb-like, .fb_iframe_widget, #fb-root,
      .twitter-share-button, .twitter-follow-button
    ){
      display:none !important;
    }
    body iframe[src*="facebook.com/plugins"],
    body iframe[src*="platform.twitter.com"],
    body iframe[title*="Facebook Social Plugin" i],
    body iframe[title*="Twitter" i]{
      display:none !important;
    }
    body [class$="-menubar"],
    body [class$="-header-back"],
    body [class$="-header-description"]{
      display:none !important;
    }
    body :is(.sdb-header, .inv-header, .closet-header, .quickstock-header, .qs-page-header){
      padding-top:0 !important;
      margin-top:0 !important;
    }
    body :is(.sdb-header-title-row, .inv-header-title-row, .closet-header-title-row, .qs-title-container){
      justify-content:center !important;
      padding-top:0 !important;
      margin-top:0 !important;
    }
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner){
      min-height:var(--np-frame-minh, calc(50vh + 80px)) !important;
      padding-bottom:var(--np-frame-padding) !important;
    }

    body .community-wood-left,
    body .community-wood-right{
      display:none !important;
    }

    body#neobdy #main #content{
      border:0 !important;
      border-radius:0 !important;
      width:100% !important;
      max-width:none !important;
      margin:0 !important;
      padding:24px !important;
    }
    body#neobdy td.content{
      border:0 !important;
      border-radius:0 !important;
      width:100% !important;
      max-width:none !important;
      margin:0 !important;
      padding:0 !important;
    }

    @media (max-width: 1100px){
      :root{ --np-frame-radius: 20px; --np-frame-padding: 12px; }
    }
    @media (max-width: 900px){
      :root{
        --np-frame-radius: 14px;
        --np-frame-padding: 10px;
        --np-top-offset: calc(80px + var(--np-content-drop, 0px));
        --np-frame-shift: 0px;
      }
    }
  `;

  const style = document.createElement('style');
  style.id = 'np-core-layout';
  style.textContent = THEME + FRAME;
  (document.head || document.documentElement).appendChild(style);

  const KILL = [
    '#pushdown_banner','#ad-slug-wrapper','#ad-table','#ad-table-btf',
    '.nl-instream-video','.nl-ads-leaderWrapper','#nl_ad_left','#nl_ad_right',
    '[id^="pb-slot-"]','#header','#navigation','#template_nav','#ban','#nst',
    '#navtop__2020','#navbottom__2020','#footer','.footer','.footerNifty','.footer__2020',
    '#nl_mobile_ad','.nl-ad-top','.nl-mobile-ad','.nl-ad-left','.nl-ad-right',
    'td.sidebar','td.sidebar .sidebarModule'
  ];
  const killStyle = document.createElement('style');
  killStyle.id = 'np-kill-native';
  killStyle.textContent = KILL.join(',\n') + `{
    display:none !important;
    visibility:hidden !important;
    height:0 !important;
    width:0 !important;
    overflow:hidden !important;
    pointer-events:none !important;
  }`;
  (document.head || document.documentElement).appendChild(killStyle);

  const mkLink = (attrs) => { const el = document.createElement('link'); Object.assign(el, attrs); (document.head || document.documentElement).append(el); };
  mkLink({ rel:'preconnect', href:'https://images.neopets.com', crossorigin:'' });
  mkLink({ rel:'dns-prefetch', href:'//images.neopets.com' });

  const host = document.createElement('div');
  host.id = 'npx-host';
  Object.assign(host.style, { position:'fixed', top:'0', left:'0', right:'0', zIndex:'2000', pointerEvents:'none' });
  const root = host.attachShadow({ mode:'open' });

  const barStyle = document.createElement('style');
  barStyle.textContent = `
    :host, :host * { box-sizing:border-box; }
    .bar, .bar *, .menu, .menu *{
      font-family: var(--np-font, system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif);
      font-size:15px; -webkit-font-smoothing:antialiased;
    }
    .bar{
      height:${BAR_H}px;
      position:relative;
      background:transparent;
      display:flex; align-items:center; justify-content:center;
      overflow:visible;
      pointer-events:none;
    }
    .bar::before{
      content:"";
      position:absolute;
      top:0; right:0; bottom:0;
      left:var(--np-bar-inset-left, 0px);
      background:var(--np-bar-bg, transparent);
      -webkit-backdrop-filter:var(--np-bar-backdrop, none);
      backdrop-filter:var(--np-bar-backdrop, none);
      border-bottom:1px solid var(--np-bar-line, transparent);
      box-shadow:var(--np-bar-shadow, none);
      pointer-events:none;
    }
    .inner{ position:relative; z-index:1; }
    .inner, .left{ pointer-events:none; }
    .left > *, .menu{ pointer-events:auto; }
    .inner{
      display:grid;
      grid-template-columns:1fr !important;
      align-items:center; width:100%;
      padding:0 18px 0 var(--np-col-width, 240px) !important; gap:10px;
    }
    .left{ grid-column:1 !important; display:flex; align-items:center; gap:2px !important; justify-content:center !important; }

    .btn{
      display:flex; align-items:center; text-decoration:none; cursor:pointer; user-select:none;
      position: relative; gap: 10px !important; padding: 9px 15px !important; border-radius: 999px !important; color: var(--npp-nav-fg, #fff) !important; text-shadow: var(--npp-nav-shadow, 0 1px 3px rgba(0,0,0,.55), 0 1px 1px rgba(0,0,0,.4)) !important; -webkit-text-stroke: var(--npp-nav-stroke, 0 transparent); paint-order: stroke fill; transition: background .18s, box-shadow .18s !important;
    }
    .btn, .btn span { font-family: 'CafeteriaBlack', Georgia, serif !important; font-size: 24px !important; font-weight: 400 !important; letter-spacing: .01em; }
    .btn span { display: inline !important; }
    .btn:hover{ background: var(--npp-nav-hover, rgba(255,255,255,.2)) !important; box-shadow: inset 0 0 0 1px var(--npp-nav-ring, rgba(255,255,255,.25)); }
    .btn img{ display:block; width: 30px !important; height: 30px !important; filter: var(--npp-nav-icon-filter, drop-shadow(0 1px 2px rgba(0,0,0,.3))); }
    .btn.cat::before { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 8px; }
    .btn.fight img{ width:68px; height:68px; }

    .menu{
      position:fixed; top:${BAR_H + 6}px; left:0; display:none;
      max-width:min(640px,92vw); z-index:2000;
      min-width: 264px !important; padding: 8px !important; overflow: visible; border: 1px solid rgba(255,255,255,.2) !important; border-radius: var(--npp-menu-radius, 0 0 16px 16px) !important; background: rgba(14,12,22,.2) !important; -webkit-backdrop-filter: blur(18px) saturate(1.2) !important; backdrop-filter: blur(18px) saturate(1.2) !important; box-shadow: 0 18px 44px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.08) !important; margin-top: var(--npp-menu-lift, 0px);
    }
    .menu::before { content: ""; position: absolute; inset: -24px; z-index: -1; background: linear-gradient(rgba(14,12,22,.38), rgba(14,12,22,.38)), var(--npLeftBarImg, none) center / cover no-repeat, var(--npLeftBarSolid, #2a292e); filter: blur(14px) saturate(1.15); clip-path: inset(24px round var(--npp-menu-radius, 0 0 16px 16px)); pointer-events: none; }
    .menu::after { content: ""; display: var(--npp-menu-caret, none); position: absolute; top: -7px; left: 50%; width: 12px; height: 12px; margin-left: -6px; transform: rotate(45deg); background: rgba(40,36,52,.92); border-left: 1px solid rgba(255,255,255,.2); border-top: 1px solid rgba(255,255,255,.2); border-radius: 3px 0 0 0; pointer-events: none; }
    .menu a{
      display:flex; align-items:center; text-decoration:none;
      gap: 14px !important; margin-bottom: 2px; padding: 11px 14px !important; border-radius: 12px !important; transition: background .18s, transform .18s cubic-bezier(.3,1.4,.5,1) !important;
    }
    .menu a, .menu a span { font-family: 'CafeteriaBlack', Georgia, serif !important; font-size: 21px !important; font-weight: 400 !important; color: #fff !important; text-shadow: 0 2px 4px rgba(0,0,0,.85), 0 1px 1px rgba(0,0,0,.9) !important; }
    .menu a:hover{ background: linear-gradient(90deg, var(--np-accent-hover, rgba(255,255,255,.14)), var(--np-accent-soft, rgba(255,255,255,.04))), rgba(255,255,255,.07) !important; transform: translateX(3px); }
    .menu a:hover span { color: #fff !important; }
    .menu a img{ display:block; flex:0 0 auto; width: 28px !important; height: 28px !important; filter: drop-shadow(0 2px 3px rgba(0,0,0,.7)); transition: transform .22s cubic-bezier(.3,1.6,.5,1); }
    .menu a:hover img { transform: scale(1.14) rotate(-5deg); }
    .menu a span{ flex:1 1 auto; white-space:nowrap; }
    .menu .menuSep{ height:1px; margin: 6px 4px !important; background: rgba(255,255,255,.1) !important; }

    .menu a{ position:relative; }
    .menu a .menuTrash{
      position:absolute; top:50%; right:6px;
      transform:translateY(-50%);
      width:22px; height:22px; padding:0;
      border:0; border-radius:50%;
      background:rgba(255,80,80,.15);
      color:#ff8080; font-size:14px; font-weight:900;
      line-height:1; cursor:pointer;
      align-items:center; justify-content:center;
    }
    .menu .menuTrash, .menu .menuAddRow { display: none !important; }
    .menu.np-edit-mode .menuTrash { display: flex !important; opacity: 1 !important; }
    .menu.np-edit-mode .menuAddRow { display: block !important; }
    .menu a .menuTrash:hover{
      background:#ff5a5a; color:#fff;
    }

    .menu .menuAddRow{
      margin-top:6px;
      padding-top:6px;
      border-top:1px solid rgba(255,255,255,.10);
    }
    .menu .menuActions{
      display:flex; gap:6px;
    }
    .menu .menuActions[hidden]{ display:none; }
    .menu .menuAddBtn,
    .menu .menuResetBtn{
      flex:1; padding:6px 8px;
      border:1px dashed rgba(255,255,255,.28);
      background:transparent;
      color:rgba(255,255,255,.7); font:inherit; font-size:11px; font-weight:700;
      border-radius:var(--np-radius-sm, 10px);
      cursor:pointer;
      text-align:center;
      box-sizing:border-box;
    }
    .menu .menuAddBtn:hover{
      background:var(--np-accent-bg);
      color:#fff;
      border-color:var(--np-accent-line);
    }
    .menu .menuResetBtn:hover{
      background:rgba(255,180,180,.10);
      color:#ffb4b4;
      border-color:rgba(255,180,180,.45);
    }
    .menu .menuAddForm{
      display:flex; flex-direction:column; gap:6px;
      padding:6px;
    }
    .menu .menuAddForm[hidden]{ display:none; }
    .menu .menuAddForm input{
      width:100%; box-sizing:border-box;
      height:28px; padding:0 8px;
      border:1px solid rgba(255,255,255,.22);
      background:rgba(0,0,0,.22);
      color:#fff; font:inherit; font-size:12px;
      border-radius:8px; outline:0;
    }
    .menu .menuAddForm input:focus{ border-color:var(--np-accent, #dcb8ff); }
    .menu .menuAddForm input::placeholder{ color:rgba(255,255,255,.4); }
    .menu .menuAddBtns{ display:flex; gap:6px; }
    .menu .menuAddBtns button{
      flex:1; height:26px; padding:0 8px;
      border:1px solid rgba(255,255,255,.22);
      background:rgba(0,0,0,.18);
      color:#fff; font:inherit; font-weight:700; font-size:11px;
      border-radius:8px; cursor:pointer;
    }
    .menu .menuAddBtns button.menuAddOk{
      background:var(--np-accent, #dcb8ff);
      color:var(--npp-accent-fg, #1a1330);
      border-color:transparent;
    }
    .menu .menuAddBtns button:hover{ filter:brightness(1.1); }

    @media (max-width: 1500px) { .btn { padding: 9px 10px !important; } .btn, .btn span { font-size: 21px !important; } .btn img { width: 26px !important; height: 26px !important; } }
    @media (max-width: 1250px) { .btn { padding: 8px 7px !important; } .btn, .btn span { font-size: 19px !important; } }
    @media (max-width: 1400px) { .left { gap: 0 !important; } .btn { gap: 6px !important; } .btn img { width: 24px !important; height: 24px !important; } }
  `;
  root.appendChild(barStyle);

  const TOPBAR_ICON_NAMES = {
    community: 'community',
    games:     'games',
    explore:   'explore',
    shop:      'shop',
    premium:   'premium',
    quests:    'quests',
    bell:      'bell',
    search:    'search',
  };

  const _initialTheme = NQ.getBtnTheme();
  const _iconUrl = NQ.btnIconUrl;
  const icons = Object.fromEntries(
    Object.entries(TOPBAR_ICON_NAMES).map(([key, iconName]) => [key, _iconUrl(iconName, _initialTheme)])
  );
  const BASIC_ICON_BASE = 'https://images.neopets.com/themes/h5/basic/images/';
  const menus = {
    community:[
      ['/community/index.phtml','Community Central','basic:communitycentral'],
      ['/neomessages.phtml','Neomail','neomail'],
      ['/neoboards/index.phtml','Neoboards','basic:neoboards'],
      ['/contests.phtml','Spotlights','basic:spotlights'],
      ['/guilds/index.phtml','Guilds','basic:guilds'],
    ],
    games:[
      ['/games/','Games Room','basicsvg:gamesroom'],
      ['/dome/','Battledome','basic:battledome'],
      ['/games/hiscores.phtml','High Scores','games'],
      ['/faeriefragments/','Faerie Fragments','basic:fragments'],
      ['/talesofdacardia/','Tales of Dacardia','basic:tada'],
    ],
    explore:[
      ['/explore.phtml','Explore Neopia','basicsvg:explore'],
      ['/tvw/','The Void Within','basic:tvw'],
      ['/giftsfromtherift/index.phtml','Gifts from the Rift','https://images.neopets.com/plots/tvw/nc/gifts-from-rift-icon.png'],
      ['/prizepass/adventure/','Adventure Pass','basic:prizepass'],
    ],
    shop:[
      ['/shops/wizard.phtml','Shop Wizard','basic:shopwizard'],
      ['/market.phtml?type=your','My Shop','basic:myshop'],
      ['/auctions.phtml','Auctions','basic:auction'],
      ['/island/tradingpost.phtml','Trading Post','basic:tradingpost'],
      ['/bank.phtml','Bank','shop'],
      ['/space/warehouse/prizecodes.phtml','Redeem Codes','basic:redeemcode'],
      '---',
      ['https://ncmall.neopets.com/mall/shop.phtml?layout=new','NC Mall','basic:ncmall'],
      ['https://secure.nc.neopets.com/get-neocash','Buy NC','basic:buync'],
      ['https://secure.nc.neopets.com/redeemnc','Redeem NC Cards','basic:redeemnc'],
      ['https://shop.neopets.com/','Merch Shop','basic:merch'],
      ['/shopping/index.phtml','Merch Partners','basic:merchshop'],
      ['/games/we/','Shenanigifts','basic:shenanigifts'],
      ['/mall/stylingstudio/','Styling Studio','basic:stylingstudio'],
      ['https://ncmall.neopets.com/mall/shop.phtml?page=wonderclaw','Wonderclaw','basic:wonderclaw'],
    ],
  };

  function resolveMenuIconSrc(spec, themeId){
    if (typeof spec !== 'string') return '';
    if (spec.startsWith('http')) return spec;
    if (spec.startsWith('basicsvg:')) return BASIC_ICON_BASE + spec.slice(9) + '-icon.svg';
    if (spec.startsWith('basic:'))    return BASIC_ICON_BASE + spec.slice(6) + '-icon.png';
    return _iconUrl(spec, themeId);
  }
  function isFixedIconSpec(spec){
    return typeof spec === 'string' && (
      spec.startsWith('http') ||
      spec.startsWith('basic:') ||
      spec.startsWith('basicsvg:')
    );
  }

  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.innerHTML = `
    <div class="inner">
      <div class="left">
        <a class="btn cat" data-id="community"><img src="${icons.community}" data-icon="community" alt=""><span>Community</span></a>
        <a class="btn cat" data-id="games"><img src="${icons.games}" data-icon="games" alt=""><span>Games</span></a>
        <a class="btn cat" data-id="explore"><img src="${icons.explore}" data-icon="explore" alt=""><span>Explore</span></a>
        <a class="btn cat" data-id="shop"><img src="${icons.shop}" data-icon="shop" alt=""><span>Shop</span></a>
        <a class="btn" href="https://nc.neopets.com/membership/"><img src="${icons.premium}" data-icon="premium" alt=""><span>Premium</span></a>
        <a class="btn" href="https://www.neopets.com/questlog/" title="Quest Log"><img src="${icons.quests}" data-icon="quests" alt="Quests"><span>Quests</span></a>
      </div>
    </div>
  `;
  root.appendChild(bar);

  function armTopbarIcons(scope){
    const attachFb = NQ.attachBtnFallback;
    const target = scope || root;
    target.querySelectorAll('img[data-icon]').forEach(img => {
      const name = img.dataset.icon;
      if (!name) return;
      if (typeof attachFb === 'function') attachFb(img, name);
      if (img.complete && img.naturalWidth === 0){
        const cur = img.getAttribute('src') || '';
        if (cur){
          img.src = '';
          img.src = cur;
        }
      }
    });
  }
  armTopbarIcons(bar);

  const TOPBAR_CUSTOM_LS = 'npqol_topbar_custom_v1';
  function loadAllCustom(){
    try {
      const raw = localStorage.getItem(TOPBAR_CUSTOM_LS);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }
  function saveAllCustom(data){
    try { localStorage.setItem(TOPBAR_CUSTOM_LS, JSON.stringify(data)); } catch {}
  }
  function getCustom(catId){
    const all = loadAllCustom();
    return all[catId] || { removed: [], added: [] };
  }
  function setCustom(catId, custom){
    const all = loadAllCustom();
    all[catId] = custom;
    saveAllCustom(all);
  }
  function effectiveMenuEntries(catId){
    const defaults = menus[catId] || [];
    const custom = getCustom(catId);
    const removed = new Set(custom.removed || []);
    const kept = defaults.filter(e => {
      if (e === '---') return true;
      return !removed.has(e[0]);
    });
    const added = (custom.added || []).map(it => [it.href, it.label, it.iconSpec || catId]);
    if (!added.length) return kept;
    const needSep = kept.length && kept[kept.length - 1] !== '---';
    return needSep ? [...kept, '---', ...added] : [...kept, ...added];
  }

  function buildMenuHTML(catId){
    const entries = effectiveMenuEntries(catId);
    const itemsHTML = entries.map(entry => {
      if (entry === '---') return `<div class="menuSep"></div>`;
      const [href, label, iconSpec] = entry;
      const safeLabel = String(label).replace(/[<>]/g, '');
      const safeHref = String(href).replace(/"/g, '&quot;');
      const fixed = isFixedIconSpec(iconSpec);
      const src = resolveMenuIconSrc(iconSpec, _initialTheme);
      const attr = fixed
        ? `data-icon-fixed="${String(iconSpec).replace(/"/g, '&quot;')}"`
        : `data-icon="${iconSpec}"`;
      return `
        <a href="${safeHref}" data-href="${safeHref}">
          <img src="${src}" ${attr} alt="">
          <span>${safeLabel}</span>
          <button type="button" class="menuTrash" title="Remove this link" aria-label="Remove">×</button>
        </a>`;
    }).join('');
    return itemsHTML + `
      <div class="menuAddRow">
        <div class="menuActions">
          <button type="button" class="menuResetBtn" data-cat="${catId}" title="Restore the default links">Reset</button>
          <button type="button" class="menuAddBtn" data-cat="${catId}" title="Add a link">+ Add link</button>
        </div>
        <form class="menuAddForm" data-cat="${catId}" hidden>
          <input type="text" name="label" placeholder="Link name" required>
          <input type="url" name="href" placeholder="https://www.neopets.com/..." required>
          <div class="menuAddBtns">
            <button type="button" class="menuAddCancel">Cancel</button>
            <button type="submit" class="menuAddOk">Add</button>
          </div>
        </form>
      </div>
    `;
  }

  function rerenderMenu(catId){
    const m = dd[catId];
    if (!m) return;
    m.innerHTML = buildMenuHTML(catId);
    wireMenuActions(catId);
    armTopbarIcons(m);
  }

  function wireMenuActions(catId){
    const m = dd[catId];
    if (!m) return;
    m.querySelectorAll('.menuTrash').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const a = btn.closest('a[data-href]');
        if (!a) return;
        const href = a.getAttribute('data-href');
        const custom = getCustom(catId);
        const inAdded = (custom.added || []).findIndex(x => x.href === href);
        if (inAdded >= 0){
          custom.added.splice(inAdded, 1);
        } else {
          custom.removed = custom.removed || [];
          if (!custom.removed.includes(href)) custom.removed.push(href);
        }
        setCustom(catId, custom);
        rerenderMenu(catId);
      });
    });
    const actions = m.querySelector('.menuActions');
    const addBtn  = m.querySelector('.menuAddBtn');
    const resetBtn = m.querySelector('.menuResetBtn');
    const form    = m.querySelector('.menuAddForm');
    const cancel  = m.querySelector('.menuAddCancel');

    if (addBtn && form && actions){
      addBtn.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        actions.hidden = true;
        form.hidden = false;
        form.querySelector('input[name="label"]')?.focus();
      });
    }
    if (resetBtn){
      resetBtn.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const custom = getCustom(catId);
        const hasChanges = (custom.removed?.length || 0) + (custom.added?.length || 0) > 0;
        if (!hasChanges) return;
        if (!confirm(`Restore the default links for "${catId}"?\nThis will also remove the custom links you added.`)) return;
        setCustom(catId, { removed: [], added: [] });
        rerenderMenu(catId);
      });
    }
    if (cancel && actions){
      cancel.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        form.hidden = true;
        actions.hidden = false;
        form.reset();
      });
    }
    if (form){
      form.addEventListener('submit', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const label = form.querySelector('input[name="label"]').value.trim();
        const href  = form.querySelector('input[name="href"]').value.trim();
        if (!label || !href) return;
        if (!/^(https?:\/\/|\/)/i.test(href)){
          alert('Link URL must start with http://, https://, or / (e.g. /shops/wizard.phtml).');
          return;
        }
        const custom = getCustom(catId);
        custom.added = custom.added || [];
        custom.added.push({ href, label, iconSpec: catId });
        setCustom(catId, custom);
        rerenderMenu(catId);
      });
    }
  }

  const dd = {};
  Object.keys(menus).forEach(id => {
    const m = document.createElement('div');
    m.className = 'menu';
    m.id = `menu-${id}`;
    m.innerHTML = buildMenuHTML(id);
    dd[id] = m;
    root.appendChild(m);
    wireMenuActions(id);
    armTopbarIcons(m);
  });

  document.documentElement.appendChild(host);

  function applyTopbarTheme(themeId){
    const iconUrl      = NQ.btnIconUrl;
    const attachFb     = NQ.attachBtnFallback;
    const all = root.querySelectorAll('img[data-icon]');
    all.forEach(img => {
      const name = img.dataset.icon;
      if (!name) return;
      if (typeof attachFb === 'function') attachFb(img, name);
      const newUrl = iconUrl(name, themeId);
      const broken = img.complete && img.naturalWidth === 0;
      if (img.src === newUrl && !broken) return;
      img.src = '';
      img.src = newUrl;
    });
  }
  NQ.onBtnTheme((id) => {
    if (id) applyTopbarTheme(id);
  });

  const rearmTopbar = () => { try { armTopbarIcons(root); } catch {} };
  window.addEventListener('pageshow', rearmTopbar);
  window.addEventListener('load',     rearmTopbar);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') rearmTopbar();
  });

  function positionMenuUnder(btnEl, menuEl){
    menuEl.style.display = 'block';
    menuEl.style.visibility = 'hidden';
    const mw = menuEl.getBoundingClientRect().width || 220;
    const b  = btnEl.getBoundingClientRect();
    const br = host.getBoundingClientRect();
    const vw = window.innerWidth;
    const pad = 8;
    let left = Math.round(b.left + b.width/2 - mw/2);
    if (left < pad) left = pad;
    if (left + mw > vw - pad) left = vw - mw - pad;
    menuEl.style.left = left + 'px';
    menuEl.style.top  = Math.round(br.bottom) + 'px';
    menuEl.style.visibility = '';
  }
  function closeAll(exceptId){
    Object.keys(dd).forEach(id => { if (id !== exceptId) dd[id].style.display = 'none'; });
  }
  let closeTimer = null;
  const TOUCH_LIKE = (() => {
    try { return window.matchMedia('(hover: none)').matches; } catch { return false; }
  })();
  function bindHover(btn){
    const id = btn.getAttribute('data-id');
    const menu = dd[id]; if (!menu) return;
    const open = () => { closeAll(id); positionMenuUnder(btn, menu); menu.style.display='block'; };
    const scheduleClose = () => { clearTimeout(closeTimer); closeTimer = setTimeout(() => { menu.style.display='none'; }, 140); };
    const cancelClose = () => { clearTimeout(closeTimer); };
    btn.addEventListener('pointerenter', open);
    btn.addEventListener('pointerleave', scheduleClose);
    menu.addEventListener('pointerenter', cancelClose);
    menu.addEventListener('pointerleave', scheduleClose);
    if (TOUCH_LIKE){
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (menu.style.display === 'block') menu.style.display = 'none';
        else open();
      });
    }
  }
  root.querySelectorAll('.btn.cat').forEach(bindHover);
  window.addEventListener('resize', () => closeAll());
  document.addEventListener('pointerdown', (ev) => {
    const path = ev.composedPath ? ev.composedPath() : [];
    if (path.some(n => n && n.classList &&
        (n.classList.contains('menu') || n.classList.contains('cat')))) return;
    closeAll();
  }, true);

  (function frameResize(){
    const LS_KEY = 'npqol_frame_size_v1';
    const MIN_W = 600, MIN_H = 200;
    const rootEl = document.documentElement;

    function loadSize(){
      try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') || {}; }
      catch { return {}; }
    }
    function saveSize(s){
      try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
    }
    const size = loadSize();

    function applyW(){
      if (Number.isFinite(size.w) && size.w >= MIN_W){
        rootEl.style.setProperty('--np-frame-width',
          `clamp(${MIN_W}px, ${Math.round(size.w)}px, calc(100vw - var(--np-frame-shift) - 40px))`);
      } else {
        rootEl.style.removeProperty('--np-frame-width');
      }
    }
    function applyH(){
      if (Number.isFinite(size.h) && size.h >= MIN_H){
        rootEl.style.setProperty('--np-frame-minh', Math.round(size.h) + 'px');
      } else {
        rootEl.style.removeProperty('--np-frame-minh');
      }
    }
    applyW(); applyH();

    const hStyle = document.createElement('style');
    hStyle.id = 'np-frame-resize-style';
    hStyle.textContent = `
      #npxFrameResizeR, #npxFrameResizeB{
        position:absolute;
        z-index:900;
        background:transparent;
        touch-action:none;
      }
      #npxFrameResizeR{ width:14px; cursor:ew-resize; }
      #npxFrameResizeB{ height:14px; cursor:ns-resize; }
      @media (pointer: coarse){
        #npxFrameResizeR{ width:26px; }
        #npxFrameResizeB{ height:26px; }
      }
      #npxFrameResizeR::after, #npxFrameResizeB::after{
        content:"";
        position:absolute;
        border-radius:3px;
        background:transparent;
        transition:background .15s ease;
        pointer-events:none;
      }
      #npxFrameResizeR::after{
        top:50%; left:50%;
        width:4px; height:64px;
        transform:translate(-50%, -50%);
      }
      #npxFrameResizeB::after{
        top:50%; left:50%;
        width:64px; height:4px;
        transform:translate(-50%, -50%);
      }
      #npxFrameResizeR:hover::after, #npxFrameResizeR.dragging::after,
      #npxFrameResizeB:hover::after, #npxFrameResizeB.dragging::after{
        background:var(--np-accent, rgba(255,255,255,.6));
        box-shadow:0 0 8px var(--np-accent, rgba(255,255,255,.4));
      }
      @media (max-width: 900px){
        #npxFrameResizeR, #npxFrameResizeB{ display:none; }
      }
    `;
    (document.head || document.documentElement).appendChild(hStyle);

    const FRAME_SEL = '#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner';
    function findFrame(){
      const cands = [...document.querySelectorAll(FRAME_SEL)];
      return cands.find(el => !cands.some(o => o !== el && o.contains(el))) || null;
    }

    const hR = document.createElement('div');
    hR.id = 'npxFrameResizeR';
    hR.title = 'Drag to resize the content width · double-click to reset';
    const hB = document.createElement('div');
    hB.id = 'npxFrameResizeB';
    hB.title = 'Drag to resize the content height · double-click to reset';

    let frame = null;
    let frameRO = null;

    function place(){
      if (!frame || !frame.isConnected) frame = findFrame();
      if (!frame){ hR.style.display = 'none'; hB.style.display = 'none'; return; }
      const r = frame.getBoundingClientRect();
      const sx = window.scrollX, sy = window.scrollY;
      hR.style.display = '';
      hB.style.display = '';
      const hw = hR.offsetWidth  || 14;
      const bh = hB.offsetHeight || 14;
      hR.style.left   = (r.right + sx - hw / 2) + 'px';
      hR.style.top    = (r.top + sy) + 'px';
      hR.style.height = Math.max(0, r.height) + 'px';
      hB.style.left   = (r.left + sx) + 'px';
      hB.style.top    = (r.bottom + sy - bh / 2) + 'px';
      hB.style.width  = Math.max(0, r.width) + 'px';
    }
    let placeQueued = false;
    function schedulePlace(){
      if (placeQueued) return;
      placeQueued = true;
      requestAnimationFrame(() => { placeQueued = false; place(); });
    }

    function watchFrame(){
      const f = findFrame();
      if (!f) return false;
      if (f !== frame){
        frame = f;
        try { frameRO?.disconnect(); } catch {}
        try {
          frameRO = new ResizeObserver(schedulePlace);
          frameRO.observe(frame);
        } catch {}
      }
      schedulePlace();
      return true;
    }

    function mountHandles(){
      if (!document.body) return false;
      if (!hR.isConnected) document.body.append(hR, hB);
      watchFrame();
      return true;
    }
    if (!mountHandles()){
      new MutationObserver((_, o) => { if (mountHandles()) o.disconnect(); })
        .observe(document.documentElement, { childList: true, subtree: true });
    }
    window.addEventListener('load', () => { watchFrame(); });
    window.addEventListener('resize', schedulePlace);
    document.addEventListener('DOMContentLoaded', () => { watchFrame(); }, { once: true });

    let drag = null;
    function beginDrag(e, axis, el){
      if (!frame) return;
      drag = { axis, pointerId: e.pointerId };
      el.classList.add('dragging');
      try { el.setPointerCapture(e.pointerId); } catch {}
      try { document.body.style.userSelect = 'none'; } catch {}
      const r = frame.getBoundingClientRect();
      if (axis === 'w' && !Number.isFinite(size.w)) size.w = Math.round(r.width);
      if (axis === 'h' && !Number.isFinite(size.h)) size.h = Math.round(r.height);
      e.preventDefault();
    }
    function moveDrag(e){
      if (!drag || !frame) return;
      const r = frame.getBoundingClientRect();
      if (drag.axis === 'w'){
        const leftGap  = r.left;
        const rightGap = window.innerWidth - r.right;
        const centered = Math.abs(leftGap - rightGap) < 4;
        const delta = (e.clientX - r.right) * (centered ? 2 : 1);
        size.w = Math.max(MIN_W, Math.round((size.w || r.width) + delta));
        applyW();
      } else {
        size.h = Math.max(MIN_H, Math.round(e.clientY - r.top));
        applyH();
      }
      schedulePlace();
    }
    function endDrag(e, el){
      if (!drag) return;
      drag = null;
      el.classList.remove('dragging');
      try { el.releasePointerCapture(e.pointerId); } catch {}
      try { document.body.style.userSelect = ''; } catch {}
      saveSize(size);
      schedulePlace();
    }
    hR.addEventListener('pointerdown', (e) => beginDrag(e, 'w', hR));
    hB.addEventListener('pointerdown', (e) => beginDrag(e, 'h', hB));
    hR.addEventListener('pointermove', moveDrag);
    hB.addEventListener('pointermove', moveDrag);
    hR.addEventListener('pointerup',     (e) => endDrag(e, hR));
    hR.addEventListener('pointercancel', (e) => endDrag(e, hR));
    hB.addEventListener('pointerup',     (e) => endDrag(e, hB));
    hB.addEventListener('pointercancel', (e) => endDrag(e, hB));
    hR.addEventListener('dblclick', () => { delete size.w; saveSize(size); applyW(); schedulePlace(); });
    hB.addEventListener('dblclick', () => { delete size.h; saveSize(size); applyH(); schedulePlace(); });
  })();

  (function firstVisibleAlign(){
    const FRAME_SEL = '#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner';
    const SKIP_TAGS = /^(STYLE|SCRIPT|LINK|META|TEMPLATE|BR|HR)$/;

    function findFrame(){
      const cands = [...document.querySelectorAll(FRAME_SEL)];
      return cands.find(el => !cands.some(o => o !== el && o.contains(el))) || null;
    }
    function align(){
      const frame = findFrame();
      if (!frame) return;
      for (const child of frame.children){
        if (SKIP_TAGS.test(child.tagName)) continue;
        const cs = getComputedStyle(child);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (cs.position === 'absolute' || cs.position === 'fixed') continue;
        child.style.setProperty('margin-top', '0', 'important');
        if (!child.matches(FRAME_SEL)){
          child.style.setProperty('padding-top', '0', 'important');
        }
        break;
      }
    }
    const run = () => { try { align(); } catch {} };
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
      run();
    }
    window.addEventListener('load', run);
    window.addEventListener('pageshow', run);
    setTimeout(run, 800);
  })();

  (function customScrollbar(){
    const M = 8;

    const track = document.createElement('div');
    track.id = 'npxScrollTrack';
    Object.assign(track.style, {
      position: 'fixed',
      right: '0px',
      top: '0px',
      bottom: '0px',
      width: '14px',
      zIndex: '800',
      background: 'transparent',
      pointerEvents: 'none',
      touchAction: 'none',
    });
    const thumb = document.createElement('div');
    thumb.id = 'npxScrollThumb';
    Object.assign(thumb.style, {
      position: 'absolute',
      right: '3px',
      top: '0px',
      width: '5px',
      height: '0px',
      borderRadius: '4px',
      background: 'var(--np-accent, #dcb8ff)',
      boxShadow: '0 0 4px rgba(0,0,0,.35)',
      opacity: '0',
      transition: 'opacity .3s ease, width .12s ease, right .12s ease',
      cursor: 'grab',
    });
    track.appendChild(thumb);

    function mount(){
      if (document.body && !track.isConnected) document.body.appendChild(track);
      return !!document.body;
    }
    if (!mount()){
      new MutationObserver((_, o) => { if (mount()) o.disconnect(); })
        .observe(document.documentElement, { childList: true, subtree: true });
    }

    let fadeT = 0, queued = false, dragging = false, hovering = false, dragOff = 0;

    function layout(){
      const doc = document.documentElement;
      const sh = Math.max(doc.scrollHeight, document.body ? document.body.scrollHeight : 0);
      const ch = window.innerHeight;
      if (sh <= ch + 2){
        thumb.style.opacity = '0';
        track.style.pointerEvents = 'none';
        return null;
      }
      track.style.pointerEvents = 'auto';
      const trackH = ch - M * 2;
      const thH = Math.max(28, Math.round(trackH * ch / sh));
      const maxScroll = sh - ch;
      const y = M + (trackH - thH) * (maxScroll > 0 ? (window.scrollY / maxScroll) : 0);
      thumb.style.top = Math.round(y) + 'px';
      thumb.style.height = thH + 'px';
      return { trackH, thH, maxScroll };
    }
    function reveal(){
      if (!layout()) return;
      thumb.style.opacity = (dragging || hovering) ? '.9' : '.55';
      clearTimeout(fadeT);
      if (!dragging && !hovering){
        fadeT = setTimeout(() => { thumb.style.opacity = '0'; }, 1100);
      }
    }
    const schedule = () => { if (!queued){ queued = true; requestAnimationFrame(() => { queued = false; reveal(); }); } };

    function moveTo(clientY, m){
      const ratio = Math.max(0, Math.min(1, (clientY - dragOff - M) / (m.trackH - m.thH || 1)));
      window.scrollTo(window.scrollX, ratio * m.maxScroll);
    }
    track.addEventListener('pointerenter', () => {
      hovering = true;
      thumb.style.width = '9px';
      thumb.style.right = '2px';
      reveal();
    });
    track.addEventListener('pointerleave', () => {
      hovering = false;
      thumb.style.width = '5px';
      thumb.style.right = '3px';
      reveal();
    });
    track.addEventListener('pointerdown', (e) => {
      const m = layout();
      if (!m) return;
      e.preventDefault();
      const r = thumb.getBoundingClientRect();
      if (e.clientY >= r.top && e.clientY <= r.bottom){
        dragOff = e.clientY - r.top;
      } else {
        dragOff = m.thH / 2;
        moveTo(e.clientY, m);
      }
      dragging = true;
      thumb.style.cursor = 'grabbing';
      try { track.setPointerCapture(e.pointerId); } catch {}
      reveal();
    });
    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const m = layout();
      if (m) moveTo(e.clientY, m);
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      thumb.style.cursor = 'grab';
      try { track.releasePointerCapture(e.pointerId); } catch {}
      reveal();
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  })();
})();

(function () {
  'use strict';
  if (document.getElementById('npHud')) return;

  const ACTIVE_IMG_LS = 'npqol_active_pet_img_v1';
  function readLastGoodPetImg(){
    try { return JSON.parse(localStorage.getItem(ACTIVE_IMG_LS) || 'null'); }
    catch { return null; }
  }
  function saveLastGoodPetImg(name, url){
    if (!name || !url || !/\/cp\//.test(url)) return;
    try { localStorage.setItem(ACTIVE_IMG_LS, JSON.stringify({ name, url })); } catch {}
  }

  function _cacheRawPetImage(url){
    try {
      const cacheKey = 'npqol_pp_png:' + url;
      if (localStorage.getItem(cacheKey)) return;
      const probe = new Image();
      probe.crossOrigin = 'anonymous';
      probe.onload = () => {
        try {
          const cv = document.createElement('canvas');
          cv.width = probe.naturalWidth;
          cv.height = probe.naturalHeight;
          cv.getContext('2d').drawImage(probe, 0, 0);
          const out = cv.toDataURL('image/png');
          if (out.length < 800000){
            try { localStorage.setItem(cacheKey, out); } catch {}
          }
        } catch {}
      };
      probe.src = url;
    } catch {}
  }

  function _resolveActivePet(){
    try {
      const homeRaw = localStorage.getItem('jb_np_homedata_v2');
      if (homeRaw){
        const home = JSON.parse(homeRaw);
        if (home && home.data && Date.now() - (home.ts||0) < 7*24*3600*1000){
          const qr = JSON.parse(localStorage.getItem('npqol_qr_data') || 'null');
          const name = qr?.data?.active?.name;
          if (name && home.data[name] && home.data[name].sci){
            return { name, sci: home.data[name].sci, mood: home.data[name].mood || '1' };
          }
        }
      }
    } catch {}
    try {
      const qrRaw = localStorage.getItem('npqol_qr_data');
      if (qrRaw){
        const qr = JSON.parse(qrRaw);
        const name = qr?.data?.active?.name;
        const pets = qr?.data?.pets || [];
        const ap   = pets.find(p => p.isActive);
        if (name && ap?.sci) return { name, sci: ap.sci, mood: '1' };
        if (name){
          const lg = readLastGoodPetImg();
          if (lg && lg.name === name){
            const m = String(lg.url || '').match(/\/cp\/([^/]+)\/(\d+)\/9\.png/);
            if (m) return { name, sci: m[1], mood: m[2] };
          }
          return { name, sci: '', mood: '1' };
        }
      }
    } catch {}
    try {
      const lg = readLastGoodPetImg();
      if (lg && lg.name){
        const m = String(lg.url || '').match(/\/cp\/([^/]+)\/(\d+)\/9\.png/);
        if (m) return { name: lg.name, sci: m[1], mood: m[2] };
      }
    } catch {}
    return { name: '', sci: '', mood: '1' };
  }

  try {
    const qr = JSON.parse(localStorage.getItem('npqol_qr_data') || 'null');
    if (qr?.data?.pets?.length && !qr.data.pets.some(p => p.sci)){
      localStorage.removeItem('npqol_qr_data_lastFetch');
    }
  } catch {}

  let _earlyActivePetImg = null;
  (function preloadActivePet(){
    try {
      const { name, sci, mood } = _resolveActivePet();
      if (!name) return;
      const url = sci
        ? `https://pets.neopets.com/cp/${sci}/${mood}/9.png`
        : `https://pets.neopets.com/cpn/${encodeURIComponent(name)}/1/4.png`;
      if (sci) saveLastGoodPetImg(name, url);
      const cacheKey = 'npqol_pp_png:' + url;

      const cached = localStorage.getItem(cacheKey);
      const initialSrc = cached || url;

      const img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      try { img.fetchPriority = 'high'; } catch {}
      img.addEventListener('load', () => img.classList.add('loaded'));
      img.addEventListener('error', () => img.classList.remove('loaded'));
      img.dataset.forName = name;
      img.dataset.cpnUrl = url;
      img.src = initialSrc;
      if (img.complete && img.naturalWidth > 0) img.classList.add('loaded');
      _earlyActivePetImg = img;

      if (!cached){
        setTimeout(() => _cacheRawPetImage(url), 1200);
      }

      const link = document.createElement('link');
      link.rel = 'preload'; link.as = 'image'; link.href = url; link.crossOrigin = 'anonymous';
      (document.head || document.documentElement).appendChild(link);

      const qrSnap = JSON.parse(localStorage.getItem('npqol_qr_data') || 'null');
      const a = qrSnap?.data?.active || {};
      [a.petpet, a.petpetpet].filter(Boolean).forEach(src => {
        const l = document.createElement('link');
        l.rel = 'preload'; l.as = 'image'; l.href = src; l.crossOrigin = 'anonymous';
        (document.head || document.documentElement).appendChild(l);
      });
    } catch {}
  })();

  const BANK_PIN = "";
  const BANK_PIN_LS = 'npqol_bank_pin_v1';
  function getBankPin(){
    try {
      const stored = (localStorage.getItem(BANK_PIN_LS) || '').replace(/[^\d]/g, '').slice(0, 4);
      if (stored.length === 4) return stored;
    } catch {}
    return String(BANK_PIN || '').replace(/[^\d]/g, '').slice(0, 4);
  }
  function promptBankPin(){
    const v = prompt(
      'Enter your 4-digit Neopets Bank PIN.\n\n' +
      'Stored in this browser only (localStorage). Never leaves your machine\n' +
      'except when you click Withdraw. Alt+click Withdraw later to clear it.\n\n' +
      'Cancel to skip.'
    );
    if (v === null) return '';
    const clean = String(v).replace(/[^\d]/g, '').slice(0, 4);
    try {
      if (clean.length === 4) localStorage.setItem(BANK_PIN_LS, clean);
    } catch {}
    return clean;
  }
  function clearBankPin(){
    try { localStorage.removeItem(BANK_PIN_LS); } catch {}
  }

  const now = () => Date.now();

  const HUD_CSS = `
  #npHud{
    z-index:var(--np-z-hud, 1000);
    -webkit-font-smoothing:antialiased;
    pointer-events:none;
    isolation:isolate;
  }
  #npHud > *{ pointer-events:auto; }
  #npHud *, #npHud *::before, #npHud *::after{ box-sizing:border-box; }

  @media (max-width: 900px){
    :root{ --np-bar-inset-left:0px !important; }
  }

  #npHudResizer{
    position:fixed;
    top:64px;
    bottom:8px;
    left: calc(var(--np-col-width, 330px) - 8px);
    width:16px;
    cursor:ew-resize;
    background:transparent;
    pointer-events:auto;
    z-index:1001;
  }
  #npHudResizer::after{
    content:"";
    position:absolute;
    top:50%; left:50%;
    width:4px; height:64px;
    border-radius:2px;
    background:rgba(255,255,255,0);
    transform:translate(-50%, -50%);
    transition:background .15s ease;
    pointer-events:none;
  }
  #npHudResizer:hover::after,
  #npHudResizer.dragging::after{
    background:var(--np-accent, rgba(255,255,255,.6));
    box-shadow:0 0 8px var(--np-accent, rgba(255,255,255,.4));
  }

  .npCard{
    width:100%;
    box-sizing:border-box;
    background:var(--np-glass, rgba(0,0,0,.22));
    border:1px solid var(--np-line, rgba(255,255,255,.16));
    border-radius:var(--np-radius, 14px);
    box-shadow:var(--np-shadow, 0 8px 24px rgba(0,0,0,.28));
    backdrop-filter:blur(var(--np-blur, 8px));
    -webkit-backdrop-filter:blur(var(--np-blur, 8px));
    color:var(--np-ink, #fff);
    position:relative;
    transition:background .16s ease, border-color .16s ease, transform .08s ease;
  }
  .npCard:hover{
    background:var(--np-glass-hover, rgba(0,0,0,.30));
    border-color:var(--np-line-hover, rgba(255,255,255,.30));
  }
  .npCard.clickable{ cursor:pointer; user-select:none; }
  .npCard.clickable:active{ transform:translateY(1px); }

  .npBtn{
    display:flex; align-items:center; justify-content:center; text-align:center;
    padding:6px 8px;
    border-radius:var(--np-radius-sm, 10px);
    background:var(--np-btn, rgba(255,255,255,.06));
    border:1px solid var(--np-line, rgba(255,255,255,.16));
    color:#fff; font-size:12px; font-weight:600; line-height:1.1;
    cursor:pointer;
    transition:background .12s ease, transform .08s ease;
  }
  .npBtn:hover{ background:var(--np-btn-hover, rgba(255,255,255,.10)); }
  .npBtn:active{ transform:translateY(1px); }

  .npSpin{
    width:16px;height:16px;border-radius:50%;
    border:2px solid rgba(255,255,255,.25);
    border-top-color:rgba(255,255,255,.85);
    animation:npSpin .8s linear infinite;
  }
  @keyframes npSpin{ to{ transform:rotate(360deg); } }

  #npUser{
    display:flex;
    align-items:stretch;
    gap:12px;
    position:relative;
  }
  #npUser.no-shield{
    align-items:center;
    justify-content:center;
  }
  #npUser.no-shield .shieldSlot{ display:none; }
  #npUser.hide-avatar .avatarSlot{ display:none; }
  #npUser.hide-username .name{ display:none; }
  #npUser.hide-avatars .meta .metaAv{ display:none; }
  #npUser.hide-stamps .meta .metaSt{ display:none; }
  #npUser.hide-avatars .meta .sep,
  #npUser.hide-stamps  .meta .sep{ display:none; }
  #npUser.hide-avatars.hide-stamps .meta{ display:none; }
  #npUser .shieldSlot{
    flex:0 0 33%;
    align-items:center; justify-content:center;
    min-width:0;
  }
  #npUser .shield{
    display:block;
    width:auto; height:100%;
    max-width:100%; max-height:120px;
    object-fit:contain;
    opacity:0; transition:opacity .18s ease;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,.45));
  }
  #npUser .shield.loaded{ opacity:1; }
  #npUser .shieldSlot:has(.shield:not([src])){
    flex:0 0 0;
    overflow:hidden;
  }
  #npUser .rightSide{
    flex:1 1 0;
    min-width:0;
    flex-direction:column; justify-content:center;
    gap:6px;
  }
  #npUser .avatarSlot{
    width:36px; height:36px;
    align-items:center; justify-content:center;
    flex-shrink:0;
  }
  #npUser .avatar{
    display:block;
    width:36px; height:36px;
    object-fit:cover;
    border-radius:9px; border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.04);
    opacity:0; transition:opacity .18s ease;
  }
  #npUser .avatar.loaded{ opacity:1; }
  #npUser .name{
    display:block;
    width:100%;
    text-decoration:none !important; color:#fff !important;
    font-size:14px; font-weight:700;
    cursor:pointer !important;
    pointer-events:auto !important;
    position:relative;
    z-index:1;
  }
  #npUser .name:hover{
    text-decoration:underline !important;
    text-decoration-color:var(--np-accent, #dcb8ff) !important;
    text-underline-offset:3px;
  }
  #npUser .meta{
    align-items:baseline; gap:6px; flex-wrap:wrap;
    justify-content:center;
    font-size:11px; font-weight:500; line-height:1.1;
    min-width:0;
  }
  #npUser .meta .metaAv,
  #npUser .meta .metaSt{
    display:inline-flex;
    align-items:baseline;
    gap:4px;
  }
  #npUser .meta .sep{ opacity:.40; padding:0 1px; }
  #npUser .spinner{ position:absolute; top:6px; right:6px; }
  #npUser.loading{ cursor:progress; }
  #npUser.loading .spinner{ display:block; }

  #npBank{ padding:10px 12px; }
  #npBank .head{
    display:grid;
    grid-template-columns: 26px 1fr 26px;
    align-items:center;
    margin:0 0 8px 0;
    gap:6px;
  }
  #npBank .title{
    grid-column:2;
    text-align:center;
    opacity:.95;
  }
  #npBank .title{ cursor:pointer; }
  #npBank .title:hover{
    text-decoration:underline;
    text-decoration-color:var(--np-accent, #dcb8ff);
    text-underline-offset:3px;
  }
  #npBank .rows{ display:flex; flex-direction:column; gap:8px; }
  #npBank .balance{
    width:100%; font-weight:700; letter-spacing:.2px; min-height:26px;
    display:flex; align-items:center; justify-content:center; gap:10px;
    flex-wrap:wrap;
  }
  #npBank .balance .balVal{ font-variant-numeric:tabular-nums; }
  #npBank .dailyDelta{
    display:inline-flex; gap:6px; align-items:baseline;
    font-size:11px; font-weight:600; line-height:1;
    font-variant-numeric:tabular-nums;
    opacity:.95;
  }
  #npBank .dailyDelta:empty{ display:none; }
  #npBank .dailyDelta .dgain{ color:#7be08e; }
  #npBank .dailyDelta .dloss{ color:#ff8a8a; }
  #npBank #npInterest{
    width:100%;
    background:rgba(255,90,90,.18);
    border:1px solid #ff5a5a;
    color:#fff; font-weight:900;
    text-shadow:
      0 1px 2px rgba(120,0,0,.95),
      0 0 4px rgba(255,40,40,.6);
    box-shadow:
      0 0 18px rgba(255,90,90,.55),
      0 0 0 0 rgba(255,90,90,.55);
    animation: npBankIntPulse 1.6s ease-in-out infinite;
  }
  #npBank #npInterest:hover{
    background:rgba(255,90,90,.32);
    filter:brightness(1.08);
  }
  @keyframes npBankIntPulse{
    0%, 100%{ box-shadow:0 0 0 0  rgba(255,90,90,.65), 0 0 18px rgba(255,90,90,.55); }
    50%     { box-shadow:0 0 0 12px rgba(255,90,90,0),  0 0 26px rgba(255,90,90,.75); }
  }
  #npBank .bankBtns{
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap:8px;
    align-items:start;
  }
  #npBank .bankBtns:empty{ display:none; }
  #npBank .bankCol{
    display:flex; flex-direction:column; gap:8px;
    min-width:0;
  }
  #npBank .bankCol:empty{ display:none; }
  #npBank .bankBtns .npBtn{ width:100%; height:30px; padding:0 8px; }
  #npBank .bankCustomForm{
    display:flex; align-items:stretch; gap:3px;
    width:100%; height:30px;
    box-sizing:border-box;
  }
  #npBank .bankCustomForm input{
    flex:1 1 0;
    min-width:0;
    width:0;
    height:100%;
    padding:0 6px;
    border:1px solid var(--np-line, rgba(255,255,255,.16));
    background:var(--np-btn, rgba(255,255,255,.06));
    color:#fff; font:inherit; font-size:12px; font-weight:600;
    border-radius:var(--np-radius-sm, 10px);
    outline:0;
    font-variant-numeric:tabular-nums;
    text-align:right;
  }
  #npBank .bankCustomForm input:focus{ border-color:var(--np-accent, #dcb8ff); }
  #npBank .bankCustomForm input::placeholder{ color:rgba(255,255,255,.4); font-weight:500; }
  #npBank .bankCustomForm .ok{
    flex:0 0 26px; width:26px; height:100%;
    padding:0;
    display:flex; align-items:center; justify-content:center;
    background:var(--np-accent, #dcb8ff);
    border:0; border-radius:var(--np-radius-sm, 10px);
    font-weight:800; font-size:13px;
    cursor:pointer;
  }
  #npBank .bankCustomForm .ok:hover{ filter:brightness(1.08); }
  #npBank .msg{ font-size:11px; opacity:.62; text-align:center; min-height:12px; }
  #npBank .msg:empty{ display:none; }
  #npBank .disabled{ opacity:.55; cursor:not-allowed; pointer-events:none; }

  #npBank .bankGraph{
    width:100%;
    height:72px;
    padding:0;
    margin:0;
  }
  #npBank .bankGraph:empty{ display:none; }
  #npBank .bankGraph svg{
    display:block;
    width:100%; height:100%;
    overflow:visible;
  }
  #npBank .bankGraph .gLine{
    fill:none;
    stroke-width:1.6;
    stroke-linecap:round;
    stroke-linejoin:round;
    filter: drop-shadow(0 1px 1px rgba(0,0,0,.4));
  }
  #npBank .bankGraph .gFill{
    fill:url(#npBankGraphFill);
    opacity:.18;
  }
  #npBank .bankGraph text{
    font-family: var(--np-font, system-ui, sans-serif);
    font-size: 7px;
    fill: rgba(255,255,255,.55);
    font-variant-numeric: tabular-nums;
  }
  #npBank .bankGraph .axisY{ text-anchor: end; }
  #npBank .bankGraph .axisX{ text-anchor: middle; }
  #npBank .bankGraph .axisXLeft{ text-anchor: start; }
  #npBank .bankGraph .axisXRight{ text-anchor: end; }
  #npBank .bankGraph .gridLine{
    stroke: rgba(255,255,255,.10);
    stroke-width: 0.5;
    stroke-dasharray: 2 2;
  }
  #npBank .bankGraph .gEmpty{
    text-align:center;
    font-size:10px;
    opacity:.5;
    padding:24px 0;
    line-height:1.2;
  }

  .bankSettingsBackdrop{
    position:fixed; inset:0;
    background:rgba(0,0,0,.55);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: calc(var(--np-z-menu, 2000) + 100);
    display:flex; align-items:center; justify-content:center;
    padding:20px;
    animation: bankModalIn .14s ease-out;
  }
  @keyframes bankModalIn{ from{ opacity:0; } to{ opacity:1; } }
  .bankSettingsBox{
    width:auto; max-width:min(480px, calc(100vw - 40px));
    background:rgba(20,14,32,.96);
    border:1px solid var(--np-line, rgba(255,255,255,.16));
    border-radius:var(--np-radius, 14px);
    box-shadow:0 14px 40px rgba(0,0,0,.55);
    color:var(--np-ink, #fff);
    font-family:var(--np-font, system-ui, sans-serif);
    overflow:hidden;
  }
  .bankSettingsHead{
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 14px;
    border-bottom:1px solid rgba(255,255,255,.10);
  }
  .bankSettingsHead h3{
    margin:0; font-size:14px; font-weight:700;
    letter-spacing:.03em;
  }
  .bankSettingsHead .closeBtn{
    width:26px; height:26px; padding:0; border:0;
    background:rgba(255,255,255,.06); color:#fff;
    border-radius:6px; cursor:pointer; font-size:16px; line-height:1;
  }
  .bankSettingsHead .closeBtn:hover{ background:rgba(255,255,255,.14); }
  .bankSettingsBody{
    padding:10px 14px;
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap:10px;
  }
  .bankSettingsCol{
    display:flex; flex-direction:column; gap:10px;
    min-width:0;
  }
  .bankSettingsColHead{
    font-size:11px; font-weight:700;
    letter-spacing:.08em; text-transform:uppercase;
    color:rgba(255,255,255,.55);
    padding:0 2px 2px;
  }
  .bankSettingsRow{
    padding:8px 10px;
    border:1px solid var(--np-line, rgba(255,255,255,.16));
    background:var(--np-btn, rgba(255,255,255,.04));
    border-radius:var(--np-radius-sm, 10px);
    display:flex; flex-direction:column; gap:8px;
  }
  .bankSettingsRow.on{
    border-color: var(--np-accent-line, rgba(220,184,255,.45));
    background: var(--np-accent-soft, rgba(220,184,255,.08));
  }
  .bankSettingsRow .topLine{
    display:flex; align-items:center; gap:8px;
  }
  .bankSettingsRow input[type="checkbox"]{
    width:16px; height:16px; cursor:pointer;
    accent-color: var(--np-accent, #dcb8ff);
    margin:0;
  }
  .bankSettingsRow .lbl{
    flex:1; font-size:13px; font-weight:600;
    cursor:pointer; user-select:none;
  }
  .bankSettingsRow .sub{
    display:flex; flex-direction:column; gap:4px;
  }
  .bankSettingsRow .sub label{
    font-size:11px; opacity:.7;
  }
  .bankSettingsRow .sub input[type="text"],
  .bankSettingsRow .sub select{
    width:100%; min-width:0; box-sizing:border-box;
    height:28px; padding:0 8px;
    border:1px solid var(--np-line, rgba(255,255,255,.16));
    background:rgba(0,0,0,.22);
    color:#fff; font:inherit; font-size:12px; font-weight:600;
    border-radius:8px; outline:0;
    font-variant-numeric:tabular-nums;
    text-align:right;
  }
  .bankSettingsRow .sub select{ text-align:left; }
  .bankSettingsRow .sub input:focus,
  .bankSettingsRow .sub select:focus{ border-color:var(--np-accent, #dcb8ff); }
  .bankSettingsRow.off .sub{ opacity:.4; pointer-events:none; }
  .bankSettingsFoot{
    display:flex; gap:8px; justify-content:flex-end;
    padding:10px 14px;
    border-top:1px solid rgba(255,255,255,.10);
  }
  .bankSettingsFoot .npBtn{
    padding:6px 14px;
    background:var(--np-btn, rgba(255,255,255,.06));
    border:1px solid var(--np-line, rgba(255,255,255,.16));
    color:#fff; font-size:12px; font-weight:700;
    border-radius:var(--np-radius-sm, 10px);
    cursor:pointer;
  }
  .bankSettingsFoot .npBtn:hover{ background:var(--np-btn-hover, rgba(255,255,255,.10)); }
  .bankSettingsFoot .npBtn.save{
    background:var(--np-accent, #dcb8ff);
    color:#1a1330; border-color:transparent;
  }
  .bankSettingsFoot .npBtn.save:hover{ filter:brightness(1.08); }

  .npCard .cardGear{
    position:absolute;
    top:6px; right:6px;
    width:26px; height:26px; padding:0;
    display:flex; align-items:center; justify-content:center;
    background:transparent; border:0;
    color:rgba(255,255,255,.45);
    font-size:16px; line-height:1; cursor:pointer;
    border-radius:6px;
    opacity:0;
    transition: opacity .14s ease, background .12s ease, color .12s ease, transform .15s ease;
    z-index:3;
  }
  .npCard:hover .cardGear{ opacity:.85; }
  .npCard .cardGear:hover{
    opacity:1 !important;
    background:var(--np-btn-hover, rgba(255,255,255,.10));
    color:#fff;
    transform: rotate(45deg);
  }

  .npCard .cardRefresh{
    position:absolute;
    top:6px; right:36px;
    width:26px; height:26px; padding:0;
    display:flex; align-items:center; justify-content:center;
    background:transparent; border:0;
    color:rgba(255,255,255,.45);
    font-size:15px; line-height:1; cursor:pointer;
    border-radius:6px;
    opacity:0;
    transition: opacity .14s ease, background .12s ease, color .12s ease, transform .2s ease;
    z-index:3;
  }
  .npCard:hover .cardRefresh{ opacity:.85; }
  .npCard .cardRefresh:hover{
    opacity:1 !important;
    background:var(--np-btn-hover, rgba(255,255,255,.10));
    color:#fff;
    transform: rotate(180deg);
  }

  .bankSettingsBody.bankSettingsBodySingle{
    grid-template-columns: 1fr;
  }
  .bankSettingsRow.toggleOnly{ padding:6px 10px; }
  .bankSettingsRow.toggleOnly .topLine{ gap:10px; }

  #npQrActive{
    min-height:150px; padding:10px 12px;
    flex-direction:column; align-items:center; justify-content:flex-start; text-align:center;
    gap:4px;
  }
  #npQrActive h3{ margin:0 0 6px 0; width:100%; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; }
  #npQrActive h3:hover{
    text-decoration:underline;
    text-decoration-color:var(--np-accent, #dcb8ff);
    text-underline-offset:3px;
  }
  .qrBadges{ display:flex; gap:6px; margin:6px 0; flex-wrap:wrap; justify-content:center; }
  .qrBadge{ font-size:11px; padding:3px 6px; border-radius:10px; background:var(--np-btn, rgba(255,255,255,.06)); border:1px solid var(--np-line, rgba(255,255,255,.16)); font-weight:600; color:#fff; opacity:.95; }
  .qrStat{ display:grid; grid-template-columns:max-content max-content; gap:4px 10px; justify-content:center; justify-items:center; font-size:12px; font-weight:500; color:#fff; }
  .qrStat b{ color:#fff; font-weight:600; opacity:.92; }
  #npQrActive .qrPP{ display:flex; gap:8px; justify-content:center; align-items:flex-end; margin-top:8px; }
  #npQrActive .qrPPimg{ height:76px; width:auto; max-width:46%; object-fit:contain; }
  #npQrActive .qrPP .qrPPimg:only-child{ max-width: 92%; height: 96px; }

  @font-face {
    font-family: 'CafeteriaBlack';
    src: url('https://images.neopets.com/js/fonts/cafeteria-black.otf') format('opentype');
    font-display: swap;
  }

  #qrDockWrap{
    position: fixed;
    left: 2px;
    width: calc(var(--np-col-width, 330px) - 4px);
    bottom: 2px;
    --collapsed-h: calc(var(--np-col-width, 330px) - 2 * var(--np-hud-left, 20px));
    top: calc(100vh - var(--collapsed-h) - 2px);
    z-index: calc(var(--np-z-hud, 1000) + 1);
    pointer-events: none;
    opacity: 0;
    overflow: hidden;
    transition:
      top .45s cubic-bezier(.22, 1, .36, 1),
      opacity .28s ease;
  }
  #qrDockWrap.open{
    top: 2px;
    opacity: 1;
    pointer-events: auto;
  }
  #qrDock{
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    margin: 0; padding: 0; gap: 0;
    list-style: none;
    background: rgba(20, 14, 32, 0.95);
    -webkit-backdrop-filter: blur(var(--np-blur, 8px));
    backdrop-filter: blur(var(--np-blur, 8px));
    overflow: hidden;
  }
  .qrPet{
    width: 100%;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    background: rgba(0,0,0,.5) no-repeat center / cover;
    min-height: 0;
    flex-grow: 0;
    flex-shrink: 1;
    flex-basis: 0;
    opacity: 0;
    transition:
      flex-grow .45s cubic-bezier(.22, 1, .36, 1),
      opacity .3s ease;
  }
  .qrPet.active{
    flex-grow: 1;
    opacity: 1;
  }
  #qrDockWrap.open .qrPet{
    flex-grow: 1;
    opacity: 1;
  }
  .qrPet.active{
    box-shadow: inset 0 0 0 2px var(--np-accent, #dcb8ff);
  }
  .qrPet + .qrPet{ border-top: 2px solid #000; }
  .qrPet:hover{ filter: brightness(1.10); }
  .qrOverlay{
    position:absolute; inset:0;
    padding: 8px;
    display:flex; flex-direction:column; gap:6px;
    justify-content: center;
    background: rgba(0,0,0,.42);
    opacity:0; pointer-events:none;
    transition: opacity .14s linear;
  }
  .qrPet:hover .qrOverlay{ opacity:1; pointer-events:auto; }
  .qrOverlay a{
    min-height:32px; display:flex; align-items:center; justify-content:center; text-align:center;
    padding:6px 8px; border-radius:var(--np-radius-sm, 10px);
    text-decoration:none !important; color:#fff !important;
    font-size:12px; font-weight:700; line-height:1.1;
    background:var(--np-btn, rgba(255,255,255,.06));
    border:1px solid var(--np-line, rgba(255,255,255,.16));
    transition:background .12s ease, transform .08s ease;
  }
  .qrOverlay a:hover{ background:var(--np-btn-hover, rgba(255,255,255,.10)); }
  .qrOverlay a:active{ transform:translateY(1px); }
  .qrPetName{
    font-family: 'CafeteriaBlack', var(--np-font, system-ui), sans-serif;
    font-size: 20px; font-weight: 400; color: #fff;
    text-align: center; padding: 0 4px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    letter-spacing: .02em;
    text-shadow: 0 1px 2px rgba(0,0,0,.7);
  }

  body.npDockActive #npUser,
  body.npDockActive #npBank,
  body.npDockActive #npNp,
  body.npDockActive #npQrActive,
  body.npDockActive #npActivePet{
    opacity: 0;
    pointer-events: none;
    transition: opacity .25s ease;
  }

  #npUser .name #npUserTitle,
  #npBank .title,
  #npQrActive h3{
    font-family: 'CafeteriaBlack', var(--np-font, system-ui), sans-serif;
    font-weight: 400;
    letter-spacing: .02em;
    font-size: 20px;
    line-height: 1.1;
  }

  #npNp{ display:flex; justify-content:center; gap:8px; font-size:14px; font-weight:700; }
  #npNp .npVal{ font-variant-numeric:tabular-nums; }
  #npNp img{ width:24px; height:24px; display:block; flex:0 0 24px; }
  #npNp.dim{ opacity:.6; }

  #npActivePet{
    cursor:pointer;
    justify-content:center;
  }
  #npActivePet:hover{
    background: transparent;
  }
  #npActivePet img{
    width:auto; height:auto;
    max-width:100%; max-height:100%;
    transform: scale(0.8);
    transform-origin: center center;
    display:block;
    opacity:0; transition:opacity .18s ease;
  }
  #npActivePet img.loaded{ opacity:1; }

  @media (hover: none){
    .npCard .cardGear, .npCard .cardRefresh{ opacity:.85; }
    .qrOverlay{
      opacity:1;
      pointer-events:auto;
      background:rgba(0,0,0,.30);
    }
  }
  @media (pointer: coarse){
    #npHudResizer{ width:28px; left: calc(var(--np-col-width, 330px) - 14px); }
  }

  #npHud > #npUser,
  #npHud > #npBank,
  #npHud > #npNp,
  #npHud > #npQrActive{
    flex: 0 0 auto;
  }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = 'npHudStyle';
  styleEl.textContent = HUD_CSS;
  (document.head || document.documentElement).prepend(styleEl);

  const hud = document.createElement('div');
  hud.id = 'npHud';

  const cardUser = document.createElement('div');
  cardUser.className = 'npCard clickable';
  cardUser.id = 'npUser';
  cardUser.innerHTML = `
    <button type="button" class="cardGear" id="npUserGear" title="Profile settings" aria-label="Settings">⚙</button>
    <button type="button" class="cardRefresh" id="npUserRefresh" title="Refresh profile data" aria-label="Refresh">↻</button>
    <div class="shieldSlot"><img class="shield" id="npUserShield" alt=""></div>
    <div class="rightSide">
      <div class="avatarSlot"><img class="avatar" id="npUserAvatar" alt="Avatar"></div>
      <a class="name" id="npUserLink" href="https://www.neopets.com/userlookup.phtml" target="_self" rel="noopener"><span id="npUserTitle">—</span></a>
      <div class="meta">
        <span class="metaAv"><span class="k">Avatars</span><span id="npAvCount">—</span></span>
        <span class="sep">·</span>
        <span class="metaSt"><span class="k">Stamps</span><span id="npStCount">—</span></span>
      </div>
    </div>
    <div class="spinner" aria-hidden="true"><div class="npSpin"></div></div>
  `;

  const cardBank = document.createElement('div');
  cardBank.className = 'npCard';
  cardBank.id = 'npBank';
  cardBank.innerHTML = `
    <button type="button" class="cardGear" id="npBankGear" title="Mini Bank settings" aria-label="Settings">⚙</button>
    <button type="button" class="cardRefresh" id="npBankRefresh" title="Refresh bank data" aria-label="Refresh">↻</button>
    <div class="head">
      <div class="title">Bank</div>
    </div>
    <div class="rows">
      <div class="npBtn balance" id="npBal" title="Click to refresh">
        <span class="balVal">—</span>
        <span class="dailyDelta" id="npBankDelta"></span>
      </div>
      <div class="bankGraph" id="npBankGraph"></div>
      <button type="button" class="npBtn" id="npInterest" style="display:none">Collect interest</button>
      <div class="bankBtns" id="npBankBtns"></div>
      <div class="msg" id="npBankMsg"></div>
    </div>
  `;

  const cardNp = document.createElement('div');
  cardNp.className = 'npCard clickable';
  cardNp.id = 'npNp';
  cardNp.title = 'Bank (Alt+click = refresh NP)';
  cardNp.innerHTML = `NP: <span class="npVal">…</span> <img src="https://images.neopets.com/themes/h5/basic/images/np-icon.svg" alt="">`;

  const cardQr = document.createElement('div');
  cardQr.className = 'npCard clickable';
  cardQr.id = 'npQrActive';
  cardQr.innerHTML = `<h3>Active Pet</h3><div class="qrStat"><div>Health</div><div><b>—</b></div><div>Strength</div><div>—</div><div>Defence</div><div>—</div></div>`;

  const cardActivePet = document.createElement('div');
  cardActivePet.className = 'npCard clickable';
  cardActivePet.id = 'npActivePet';
  cardActivePet.title = 'Hover to switch active pet · click for Quick Reference';

  if (_earlyActivePetImg){
    cardActivePet.appendChild(_earlyActivePetImg);
  }

  hud.append(cardUser, cardBank, cardNp, cardQr, cardActivePet);

  const RESIZE_LS_KEY = 'npqol_col_width_v1';
  const RESIZE_MIN = 200;
  const RESIZE_MAX = 520;
  const RESIZE_DEFAULT = 330;
  function clampColW(v){
    if (!Number.isFinite(v)) return RESIZE_DEFAULT;
    return Math.max(RESIZE_MIN, Math.min(RESIZE_MAX, v));
  }
  let resizeCurrentW = RESIZE_DEFAULT;
  try {
    const raw = localStorage.getItem(RESIZE_LS_KEY);
    const v = parseInt(raw || '', 10);
    if (Number.isFinite(v)) resizeCurrentW = clampColW(v);
  } catch {}
  try {
    document.documentElement.style.setProperty('--np-col-width', resizeCurrentW + 'px');
  } catch {}

  const dockWrap = document.createElement('div');
  dockWrap.id = 'qrDockWrap';
  const dock = document.createElement('div');
  dock.id = 'qrDock';
  dockWrap.appendChild(dock);

  function mountAll() {
    if (!document.body) return false;
    if (!hud.isConnected) document.body.appendChild(hud);
    if (!dockWrap.isConnected) document.documentElement.appendChild(dockWrap);
    return true;
  }
  if (!mountAll()) {
    new MutationObserver((_, o) => { if (mountAll()) o.disconnect(); }).observe(document.documentElement, { childList: true, subtree: true });
  }

  try {
    function saveResizeW(v){
      try { localStorage.setItem(RESIZE_LS_KEY, String(v)); } catch {}
    }
    function applyResizeW(v){
      try { document.documentElement.style.setProperty('--np-col-width', v + 'px'); } catch {}
    }

    const resizer = document.createElement('div');
    resizer.id = 'npHudResizer';
    resizer.title = 'Drag to resize the left column · double-click to reset';

    function mountResizer(){
      if (resizer.isConnected) return;
      (document.body || document.documentElement).appendChild(resizer);
    }
    if (document.body) mountResizer();
    else new MutationObserver((_, o) => {
      if (document.body){ mountResizer(); o.disconnect(); }
    }).observe(document.documentElement, { childList:true, subtree:true });

    let dragging = false;
    let startX = 0;
    let startW = 0;

    resizer.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX;
      startW = resizeCurrentW;
      try { resizer.setPointerCapture(e.pointerId); } catch {}
      resizer.classList.add('dragging');
      try { document.body.style.userSelect = 'none'; } catch {}
      e.preventDefault();
    });
    resizer.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      resizeCurrentW = clampColW(Math.round(startW + (e.clientX - startX)));
      applyResizeW(resizeCurrentW);
    });
    function endDrag(e){
      if (!dragging) return;
      dragging = false;
      try { resizer.releasePointerCapture(e.pointerId); } catch {}
      resizer.classList.remove('dragging');
      try { document.body.style.userSelect = ''; } catch {}
      saveResizeW(resizeCurrentW);
    }
    resizer.addEventListener('pointerup', endDrag);
    resizer.addEventListener('pointercancel', endDrag);

    resizer.addEventListener('dblclick', () => {
      resizeCurrentW = RESIZE_DEFAULT;
      applyResizeW(resizeCurrentW);
      saveResizeW(resizeCurrentW);
    });
  } catch (err) {
    console.warn('[npqol HUD] resize handle setup failed:', err);
  }

  (function userModule(){
    const USERNAME_KEY = 'npqol_hud_username';
    const CACHE_PREFIX = 'npqol_hud_userlookup:';
    const COOLDOWN = 60000;
    const st = { username:null, cacheKey:null, lastFetch:0 };

    const sGet = (k, f='') => { try { return String(localStorage.getItem(k) ?? f); } catch { return f; } };
    const sSet = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
    const cacheRead = (k) => { try { const r = localStorage.getItem(k); return r ? (JSON.parse(r)?.data || null) : null; } catch { return null; } };
    const cacheWrite = (k, data) => { try { localStorage.setItem(k, JSON.stringify({ data })); } catch {} };

    const titleEl = () => cardUser.querySelector('#npUserTitle');
    const linkEl = () => cardUser.querySelector('#npUserLink');
    const imgEl = () => cardUser.querySelector('#npUserAvatar');

    const img = imgEl();
    img.addEventListener('load', () => img.classList.add('loaded'));
    img.addEventListener('error', () => img.classList.remove('loaded'));

    function pickFromPage(){
      try { const u = (PW.appInsightsUserName || '').trim(); if (u) return u; } catch {}
      return null;
    }
    function applyUsername(u){
      st.username = u; st.cacheKey = CACHE_PREFIX + u; sSet(USERNAME_KEY, u);
      const l = linkEl(), t = titleEl();
      if (l) l.href = `https://www.neopets.com/userlookup.phtml?user=${encodeURIComponent(u)}`;
      if (t) t.textContent = u;
    }
    function ensureUsername(){
      if (st.username) return st.username;
      const p = pickFromPage(); if (p){ applyUsername(p); return st.username; }
      const c = (sGet(USERNAME_KEY, '') || '').trim(); if (c){ applyUsername(c); return st.username; }
      return null;
    }
    function waitForGlobal(maxMs=6000, step=200){
      const start = now();
      const tick = () => {
        let u=''; try { u=(PW.appInsightsUserName||'').trim(); } catch {}
        if (u){ if (u !== st.username){ applyUsername(u); hydrate(); } return; }
        if (now()-start < maxMs) setTimeout(tick, step);
      };
      tick();
    }
    const USER_SETTINGS_LS = 'npqol_user_settings_v1';
    const DEFAULT_USER_SETTINGS = {
      avatar: true,
      username: true,
      avatars: true,
      stamps: true,
      shield: true,
    };
    function loadUserSettings(){
      try {
        const raw = localStorage.getItem(USER_SETTINGS_LS);
        if (!raw) return { ...DEFAULT_USER_SETTINGS };
        const p = JSON.parse(raw) || {};
        return { ...DEFAULT_USER_SETTINGS, ...p };
      } catch { return { ...DEFAULT_USER_SETTINGS }; }
    }
    function saveUserSettings(s){
      try { localStorage.setItem(USER_SETTINGS_LS, JSON.stringify(s||{})); } catch {}
    }
    function applyUserSettings(){
      const s = loadUserSettings();
      cardUser.classList.toggle('hide-avatar',   !s.avatar);
      cardUser.classList.toggle('hide-username', !s.username);
      cardUser.classList.toggle('hide-avatars',  !s.avatars);
      cardUser.classList.toggle('hide-stamps',   !s.stamps);
      cardUser.classList.toggle('no-shield',     !s.shield);
    }

    function openUserSettings(){
      document.querySelector('.bankSettingsBackdrop')?.remove();
      const backdrop = document.createElement('div');
      backdrop.className = 'bankSettingsBackdrop';
      backdrop.innerHTML = `
        <div class="bankSettingsBox" role="dialog" aria-modal="true" aria-label="Profile settings">
          <div class="bankSettingsHead">
            <h3>Profile Settings</h3>
            <button type="button" class="closeBtn" aria-label="Close">×</button>
          </div>
          <div class="bankSettingsBody bankSettingsBodySingle"></div>
          <div class="bankSettingsFoot">
            <button type="button" class="npBtn cancel">Cancel</button>
            <button type="button" class="npBtn save">Save</button>
          </div>
        </div>
      `;
      const body  = backdrop.querySelector('.bankSettingsBody');
      const draft = loadUserSettings();
      const fields = [
        ['avatar',   'Avatar'],
        ['username', 'Username'],
        ['avatars',  'Avatar count'],
        ['stamps',   'Stamp count'],
        ['shield',   'Years shield'],
      ];
      fields.forEach(([k, label]) => {
        const r = document.createElement('div');
        r.className = 'bankSettingsRow toggleOnly ' + (draft[k] ? 'on' : 'off');
        r.innerHTML =
          `<div class="topLine">` +
            `<input type="checkbox" id="us_${k}" ${draft[k] ? 'checked' : ''}>` +
            `<label class="lbl" for="us_${k}">${label}</label>` +
          `</div>`;
        const cb = r.querySelector('input[type="checkbox"]');
        cb.addEventListener('change', () => {
          draft[k] = cb.checked;
          r.classList.toggle('on',  cb.checked);
          r.classList.toggle('off', !cb.checked);
        });
        body.appendChild(r);
      });
      const close = () => { backdrop.remove(); document.removeEventListener('keydown', onKey, true); };
      function onKey(ev){ if (ev.key === 'Escape'){ ev.preventDefault(); close(); } }
      document.addEventListener('keydown', onKey, true);
      backdrop.querySelector('.closeBtn').addEventListener('click', close);
      backdrop.querySelector('.cancel').addEventListener('click', close);
      backdrop.querySelector('.save').addEventListener('click', () => {
        saveUserSettings(draft);
        applyUserSettings();
        close();
      });
      backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(); });
      document.body.appendChild(backdrop);
    }

    function render(data){
      const i = imgEl(), av = cardUser.querySelector('#npAvCount'), stc = cardUser.querySelector('#npStCount');
      if (i){ const src = data?.avatarUrl || ''; i.classList.remove('loaded'); if (src && i.src !== src) i.src = src; if (src && i.complete) requestAnimationFrame(() => i.classList.add('loaded')); }
      if (av) av.textContent = (data?.avatars ?? '—');
      if (stc) stc.textContent = (data?.stamps ?? '—');
      const sh = cardUser.querySelector('#npUserShield');
      const shSrc = data?.shieldUrl || '';
      if (sh){
        if (!shSrc){
          sh.removeAttribute('src');
          sh.classList.remove('loaded');
        } else {
          sh.classList.remove('loaded');
          if (sh.src !== shSrc) sh.src = shSrc;
          sh.addEventListener('load', () => sh.classList.add('loaded'), { once:true });
          const tryClean = (n=0) => {
            const fn = NQ.cleanImg;
            if (typeof fn === 'function'){ try { fn(shSrc, sh); } catch {} return; }
            if (n < 30) setTimeout(() => tryClean(n+1), 60);
          };
          setTimeout(tryClean, 0);
        }
      }
    }
    function hydrate(){ if (!st.cacheKey) return; const c = cacheRead(st.cacheKey); if (c) render(c); }
    function mayFetch(){ const t = now(); if (t - st.lastFetch < COOLDOWN) return false; st.lastFetch = t; return true; }
    function setLoading(on){ cardUser.classList.toggle('loading', !!on); }

    function parse(html){
      let avatarUrl = null;
      const m = html.match(/<img[^>]+src="([^"]+\/neoboards\/avatars\/[^"]+)"[^>]*>/i) || html.match(/<img[^>]+src="([^"]+\/images\/avatars\/[^"]+)"[^>]*>/i);
      if (m) avatarUrl = m[1];
      let shieldUrl = null;
      const sm = html.match(/<img[^>]+src="([^"]+\/images\/shields\/[^"]+\.gif[^"]*)"[^>]*>/i);
      if (sm) shieldUrl = sm[1];
      const text = html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
      const rc = (re) => { const mm = re.exec(text); return mm ? Number(mm[1].replace(/,/g,'')) : null; };
      return { avatarUrl, shieldUrl, avatars: rc(/Avatars\s*:?\s*(\d[\d,]*)/i), stamps: rc(/Stamps\s*:?\s*(\d[\d,]*)/i) };
    }
    async function refresh(){
      if (np403BackoffActive()) return;
      if (!mayFetch()) return;
      setLoading(true);
      try {
        const u = ensureUsername(); if (!u) return;
        const r = await fetch(`https://www.neopets.com/userlookup.phtml?user=${encodeURIComponent(u)}`, { credentials:'include', cache:'no-store' });
        npNote403(r);
        const data = parse(await r.text());
        if (data){ cacheWrite(st.cacheKey, data); render(data); }
      } catch {} finally { setLoading(false); }
    }

    cardUser.addEventListener('click', (e) => {
      if (e.target?.closest?.('#npUserLink, button, a, input, select')) return;
      const href = userLinkUrl();
      if (href) window.location.assign(href);
    });
    const userRefreshBtn = cardUser.querySelector('#npUserRefresh');
    if (userRefreshBtn){
      userRefreshBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        refresh();
      });
    }
    function userLinkUrl(){
      const a = cardUser.querySelector('#npUserLink');
      return a ? (a.getAttribute('href') || '') : '';
    }
    document.addEventListener('click', (e) => {
      const a = e.target?.closest?.('#npUserLink');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href) return;
      e.preventDefault(); e.stopPropagation();
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) window.open(href, '_blank', 'noopener');
      else window.location.assign(href);
    }, true);
    document.addEventListener('auxclick', (e) => {
      if (e.button !== 1) return;
      const a = e.target?.closest?.('#npUserLink');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href) return;
      e.preventDefault(); e.stopPropagation();
      window.open(href, '_blank', 'noopener');
    }, true);
    document.addEventListener('contextmenu', (e) => {
      const a = e.target?.closest?.('#npUserLink');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href) return;
      e.preventDefault(); e.stopPropagation();
      window.open(href, '_blank', 'noopener');
    }, true);
    applyUserSettings();
    const userGear = cardUser.querySelector('#npUserGear');
    if (userGear){
      userGear.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        openUserSettings();
      });
    }

    ensureUsername(); hydrate(); waitForGlobal();
  })();

  (function bankModule(){
    const STORE = 'npqol_bank_state_v2';
    const SETTINGS_LS = 'npqol_bank_btn_settings_v1';
    const DAILY_LS    = 'npqol_bank_daily_v1';
    const FORM_TTL = 5*60*1000;
    const RECHECK_MS = 5*60*1000;
    const load = () => { try { return JSON.parse(localStorage.getItem(STORE) || 'null') || {}; } catch { return {}; } };
    const save = (s) => { try { localStorage.setItem(STORE, JSON.stringify(s || {})); } catch {} };
    const state = Object.assign({
      bank_balance:'',
      bank_forms:{},
      bank_interest:null,
      bank_dailyInterest:'',
      bank_rate:'',
      bank_updatedAt:0,
      bank_msg:'',
    }, load());

    const ROUND_OPTIONS = [
      { value: 0,        label: 'Total (deposit all)' },
      { value: 10,       label: '10 NP' },
      { value: 100,      label: '100 NP' },
      { value: 1000,     label: '1,000 NP' },
      { value: 10000,    label: '10,000 NP' },
      { value: 100000,   label: '100,000 NP' },
      { value: 1000000,  label: '1,000,000 NP' },
    ];
    const DEFAULT_SETTINGS = {
      rounded:        { enabled: true,  round: 100000 },
      customDeposit:  { enabled: false },
      autoDeposit:    { enabled: false, amount: 5000 },
      customWithdraw: { enabled: false },
      autoWithdraw:   { enabled: true,  amount: 500000 },
      graph:          { enabled: false },
    };
    function loadSettings(){
      try {
        const raw = localStorage.getItem(SETTINGS_LS);
        if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        const p = JSON.parse(raw) || {};
        return {
          rounded:        Object.assign({}, DEFAULT_SETTINGS.rounded,        p.rounded||{}),
          customDeposit:  Object.assign({}, DEFAULT_SETTINGS.customDeposit,  p.customDeposit||{}),
          autoDeposit:    Object.assign({}, DEFAULT_SETTINGS.autoDeposit,    p.autoDeposit||{}),
          customWithdraw: Object.assign({}, DEFAULT_SETTINGS.customWithdraw, p.customWithdraw||{}),
          autoWithdraw:   Object.assign({}, DEFAULT_SETTINGS.autoWithdraw,   p.autoWithdraw||{}),
          graph:          Object.assign({}, DEFAULT_SETTINGS.graph,          p.graph||{}),
        };
      } catch { return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); }
    }
    function saveSettings(s){ try { localStorage.setItem(SETTINGS_LS, JSON.stringify(s||{})); } catch {} }
    let settings = loadSettings();

    const HISTORY_LS = 'npqol_bank_history_v1';
    const HISTORY_MAX = 180;
    function loadHistory(){
      try {
        const j = JSON.parse(localStorage.getItem(HISTORY_LS) || '[]');
        return Array.isArray(j) ? j : [];
      } catch { return []; }
    }
    function saveHistory(arr){
      try { localStorage.setItem(HISTORY_LS, JSON.stringify(arr.slice(-HISTORY_MAX))); } catch {}
    }
    function pushHistory(dateKey, balance){
      if (!dateKey || !Number.isFinite(balance)) return;
      const hist = loadHistory();
      const idx = hist.findIndex(e => e.d === dateKey);
      if (idx >= 0) hist[idx] = { d: dateKey, b: balance };
      else hist.push({ d: dateKey, b: balance });
      saveHistory(hist);
    }

    function nstDateKey(ms){
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
        year:'numeric', month:'2-digit', day:'2-digit',
      }).formatToParts(new Date(ms || Date.now()));
      const get = (t) => parts.find(p => p.type === t).value;
      return `${get('year')}-${get('month')}-${get('day')}`;
    }
    function loadDaily(){
      try { const j = JSON.parse(localStorage.getItem(DAILY_LS) || 'null'); if (j && typeof j === 'object') return j; } catch {}
      return { date:'', baseline:null, gained:0, lost:0, lastSeen:null };
    }
    function saveDaily(){ try { localStorage.setItem(DAILY_LS, JSON.stringify(daily)); } catch {} }
    let daily = loadDaily();
    function noteBalance(rawDigits){
      const n = parseInt(String(rawDigits||'').replace(/[^\d]/g,''), 10);
      if (!Number.isFinite(n)) return;
      const today = nstDateKey();
      if (daily.date !== today){
        if (daily.date && daily.lastSeen != null){
          pushHistory(daily.date, daily.lastSeen);
        }
        pushHistory(today, n);
        daily = { date: today, baseline: n, gained: 0, lost: 0, lastSeen: n };
        saveDaily();
        return;
      }
      pushHistory(today, n);
      if (daily.lastSeen == null){
        daily.baseline = (daily.baseline == null) ? n : daily.baseline;
        daily.lastSeen = n;
        saveDaily();
        return;
      }
      const diff = n - daily.lastSeen;
      if (diff > 0) daily.gained += diff;
      else if (diff < 0) daily.lost += -diff;
      daily.lastSeen = n;
      saveDaily();
    }

    function parisDateParts(ms){
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Paris',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', hour12: false,
      }).formatToParts(new Date(ms));
      const get = (t) => parts.find(p => p.type === t).value;
      return { year:+get('year'), month:+get('month'), day:+get('day'), hour:+get('hour') };
    }
    function bankDayKey(ms){
      const p = parisDateParts(ms);
      if (p.hour < 9){
        const d = new Date(p.year, p.month - 1, p.day - 1);
        return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
      }
      return `${p.year}-${p.month}-${p.day}`;
    }
    function crossedDailyReset(lastMs, nowMs){
      if (!lastMs) return true;
      return bankDayKey(lastMs) !== bankDayKey(nowMs);
    }

    const $ = (id) => cardBank.querySelector(id);
    const balEl  = $('#npBal');
    const balValEl = $('#npBal .balVal');
    const deltaEl  = $('#npBankDelta');
    const intBtn = $('#npInterest');
    const msgEl  = $('#npBankMsg');
    const btnsEl = $('#npBankBtns');
    const gearBtn= $('#npBankGear');
    const graphEl= $('#npBankGraph');

    let busy = false, lastAct = 0;
    const gate = () => { const n = now(); if (n - lastAct < 450) return false; lastAct = n; return true; };
    const strip = (s) => String(s||'').replace(/\s+/g,' ').trim();
    const cleanDigits = (s) => (String(s||'').match(/[\d,]+/) || [])[0] || '';
    const numComma = (x) => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const setBusy = (v) => { busy = !!v; cardBank.style.opacity = busy ? '.7' : ''; };
    const setMsg = (t) => { state.bank_msg = String(t||''); msgEl.textContent = state.bank_msg; save(state); };
    const tryJSON = (t) => { try { return JSON.parse(t); } catch { return null; } };

    function formatShort(n){
      n = Math.round(Number(n) || 0);
      if (n < 1000) return String(n);
      if (n < 1_000_000){
        const v = n / 1000;
        return (v >= 100 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/,'')) + 'k';
      }
      const v = n / 1_000_000;
      return (v >= 100 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/,'')) + 'M';
    }
    function renderDelta(){
      if (daily.date && daily.date !== nstDateKey()){
        daily = { date: nstDateKey(), baseline: daily.lastSeen, gained: 0, lost: 0, lastSeen: daily.lastSeen };
        saveDaily();
      }
      const net = daily.gained - daily.lost;
      if (net === 0){
        deltaEl.innerHTML = '';
        return;
      }
      const sign     = net > 0 ? '+' : '−';
      const cls      = net > 0 ? 'dgain' : 'dloss';
      const absVal   = Math.abs(net);
      const compact  = formatShort(absVal);
      const exact    = numComma(absVal);
      deltaEl.innerHTML = `<span class="${cls}" title="Net today: ${sign}${exact} NP">${sign}${compact}</span>`;
    }

    function render(){
      balValEl.textContent = state.bank_balance ? `${state.bank_balance} NP` : '—';
      renderDelta();
      renderGraph();
      msgEl.textContent = state.bank_msg || '';
      if (state.bank_interest){
        intBtn.style.display = '';
        const amount = state.bank_dailyInterest ? `Collect ${state.bank_dailyInterest} NP` : 'Collect interest';
        intBtn.textContent = state.bank_rate ? `${amount} @ ${state.bank_rate}` : amount;
      } else {
        intBtn.style.display = 'none';
        intBtn.textContent = 'Collect interest';
      }
      renderButtons();
    }

    function renderGraph(){
      if (!graphEl) return;
      if (!settings?.graph?.enabled){
        graphEl.innerHTML = '';
        return;
      }
      const hist = loadHistory();
      const points = [];
      hist.forEach(e => {
        const b = Number(e.b);
        if (Number.isFinite(b)) points.push({ d: e.d, b });
      });
      points.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
      if (points.length === 0){
        graphEl.innerHTML = '<div class="gEmpty">Open your bank once to start recording — one point is added per day.</div>';
        return;
      }

      const W = 220, H = 72;
      const ML = 36, MR = 4, MT = 6, MB = 11;
      const innerW = W - ML - MR;
      const innerH = H - MT - MB;

      const balances = points.map(p => p.b);
      const min = Math.min(...balances);
      const max = Math.max(...balances);
      const range = (max - min) || 1;
      const isUp  = balances[balances.length - 1] >= balances[0];
      const stroke = isUp ? '#7be08e' : '#ff8a8a';
      const nDays = points.length;
      const tip = `${nDays} day${nDays > 1 ? 's' : ''} · ${numComma(min)} – ${numComma(max)} NP`;
      const fmtDate = (d) => {
        const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
        return m ? `${m[2]}/${m[3]}` : '';
      };

      const yMaxText = formatShort(max);
      const yMinText = formatShort(min);
      const yLabelsSvg = (max === min)
        ? `<text class="axisY" x="${ML - 3}" y="${MT + innerH/2 + 2.5}">${yMaxText}</text>`
        : (
          `<text class="axisY" x="${ML - 3}" y="${MT + 3}">${yMaxText}</text>` +
          `<text class="axisY" x="${ML - 3}" y="${MT + innerH}">${yMinText}</text>`
        );

      const firstDate = fmtDate(points[0].d);
      const lastDate  = fmtDate(points[points.length - 1].d);
      const xLabelsSvg = (firstDate === lastDate)
        ? `<text class="axisX" x="${ML + innerW/2}" y="${H - 2}">${firstDate}</text>`
        : (
          `<text class="axisXLeft" x="${ML}" y="${H - 2}">${firstDate}</text>` +
          `<text class="axisXRight" x="${ML + innerW}" y="${H - 2}">${lastDate}</text>`
        );

      const gridSvg = (max === min)
        ? `<line class="gridLine" x1="${ML}" y1="${MT + innerH/2}" x2="${ML + innerW}" y2="${MT + innerH/2}"/>`
        : (
          `<line class="gridLine" x1="${ML}" y1="${MT}" x2="${ML + innerW}" y2="${MT}"/>` +
          `<line class="gridLine" x1="${ML}" y1="${MT + innerH}" x2="${ML + innerW}" y2="${MT + innerH}"/>`
        );

      if (points.length === 1){
        graphEl.innerHTML =
          `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Bank balance trend"><title>${tip}</title>` +
          gridSvg +
          yLabelsSvg +
          xLabelsSvg +
          `<circle cx="${ML + innerW/2}" cy="${MT + innerH/2}" r="3" fill="${stroke}"/>` +
          `</svg>`;
        return;
      }

      const coords = points.map((p, i) => {
        const x = ML + (i / (points.length - 1)) * innerW;
        const y = MT + innerH - ((p.b - min) / range) * innerH;
        return [x.toFixed(1), y.toFixed(1)];
      });
      const linePts = coords.map(c => c.join(',')).join(' ');
      const fillPts = `${ML},${MT + innerH} ${linePts} ${ML + innerW},${MT + innerH}`;
      graphEl.innerHTML =
        `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Bank balance trend"><title>${tip}</title>` +
        `<defs><linearGradient id="npBankGraphFill" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0%" stop-color="${stroke}" stop-opacity=".6"/>` +
        `<stop offset="100%" stop-color="${stroke}" stop-opacity="0"/>` +
        `</linearGradient></defs>` +
        gridSvg +
        yLabelsSvg +
        xLabelsSvg +
        `<polygon class="gFill" points="${fillPts}"/>` +
        `<polyline class="gLine" points="${linePts}" stroke="${stroke}"/>` +
        `</svg>`;
    }

    function npOnHand(){
      let raw = '';
      const el = document.querySelector('#npanchor');
      if (el) raw = el.textContent;
      if (!raw){ try { raw = localStorage.getItem('npqol_np_last') || ''; } catch {} }
      const n = parseInt(String(raw).replace(/[^\d]/g,''), 10);
      return Number.isFinite(n) ? n : 0;
    }
    function applyServer(j){
      if (!j) return;
      const np = (j.new_neopoints != null) ? numComma(j.new_neopoints) : null;
      const bal = (j.final_balance != null) ? j.final_balance : j.new_balance;
      if (np != null){ const el = document.querySelector('#npanchor'); if (el) el.textContent = np; try { localStorage.setItem('npqol_np_last', np); } catch {} }
      if (bal != null){
        state.bank_balance = numComma(bal);
        noteBalance(bal);
      }
    }

    function grabForm(formEl, type){
      if (!formEl) return null;
      const action = formEl.getAttribute('action') || '/np-templates/ajax/process_bank.php';
      const hidden = {};
      formEl.querySelectorAll('input[name]').forEach(inp => { const n = inp.getAttribute('name'); if (n) hidden[n] = inp.value || ''; });
      if (type) hidden.type = type;
      return { action, hidden };
    }
    function parseBank(htmlText){
      const out = { balance:null, forms:{}, interest:null, dailyInterest:'', rate:'' };
      const doc = new DOMParser().parseFromString(htmlText, 'text/html');
      const balNode = doc.querySelector('#txtCurrentBalance1, #txtCurrentBalance');
      if (balNode) out.balance = cleanDigits(strip(balNode.textContent));
      else { const m = htmlText.match(/Current\s*Balance:\s*([\d,]+)\s*NP/i); if (m) out.balance = m[1]; }
      const depF = doc.querySelector('form input[name="type"][value="deposit"]')?.closest('form');
      const wdF  = doc.querySelector('form input[name="type"][value="withdraw"]')?.closest('form');
      const dep = grabForm(depF, 'deposit'); if (dep) out.forms.deposit = dep;
      const wd  = grabForm(wdF, 'withdraw');  if (wd) out.forms.withdraw = wd;
      const intF = doc.querySelector('#frmCollectInterest');
      if (intF) out.interest = grabForm(intF, null);
      const dailyEl = doc.querySelector('#txtDailyInterest');
      if (dailyEl){
        const m = strip(dailyEl.textContent).match(/([\d,]+)\s*NP/i);
        if (m) out.dailyInterest = m[1];
      }
      const rateEl = doc.querySelector('#txtAnnualInterestRate');
      if (rateEl){
        const m = strip(rateEl.textContent).match(/[\d.]+\s*%/);
        if (m) out.rate = m[0];
      }
      return out;
    }
    async function fetchBank(){ if (np403BackoffActive()) throw new Error('bank 403 backoff'); const r = await fetch('/bank.phtml', { credentials:'include', cache:'no-store' }); npNote403(r); if (!r.ok) throw new Error('bank '+r.status); return await r.text(); }
    async function refreshBank(){
      const p = parseBank(await fetchBank());
      if (p.balance){ state.bank_balance = p.balance; noteBalance(p.balance); }
      state.bank_forms = p.forms || {};
      state.bank_interest = p.interest || null;
      state.bank_dailyInterest = p.dailyInterest || '';
      state.bank_rate = p.rate || '';
      state.bank_updatedAt = now();
      save(state); render();
    }
    async function bankPost(action, dataObj){
      const url = new URL(action, location.origin).toString();
      const body = new URLSearchParams();
      Object.entries(dataObj || {}).forEach(([k,v]) => body.set(k, v ?? ''));
      const r = await fetch(url, { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With':'XMLHttpRequest', 'Accept':'*/*' }, body });
      npNote403(r);
      return { ok:r.ok, status:r.status, text: await r.text() };
    }
    const extractMsg = (t) => { const s = strip(String(t||'')); if (!s) return 'ok'; const j = tryJSON(s); if (j) return strip(j.message||j.msg||j.error||j.status||'ok'); return s.length>90 ? s.slice(0,90)+'…' : s; };
    async function ensureForms(){ if (!state.bank_forms?.deposit?.action || (now()-state.bank_updatedAt) > FORM_TTL) await refreshBank(); }

    async function doDepositAmount(amount){
      setBusy(true);
      try {
        await ensureForms();
        let amt = Math.max(0, Math.floor(Number(amount) || 0));
        if (amount === 'ALL') amt = npOnHand();
        if (amt < 1){ setMsg('Enter an amount ≥ 1'); return; }
        if (amt > npOnHand()){ setMsg(`Only ${numComma(npOnHand())} NP on hand`); return; }
        const form = state.bank_forms?.deposit; if (!form?.action){ setMsg('no deposit form'); return; }
        const r = await bankPost(form.action, { ...(form.hidden||{}), type:'deposit', amount:String(amt) });
        const j = tryJSON(r.text);
        if (j?.success){ applyServer(j); setMsg(''); render(); }
        else setMsg(extractMsg(r.text));
      } catch { setMsg('deposit error'); } finally { setBusy(false); }
    }
    async function doWithdrawAmount(amount){
      setBusy(true);
      try {
        await ensureForms();
        const amt = Math.max(0, Math.floor(Number(amount) || 0));
        if (amt < 1){ setMsg('Enter an amount ≥ 1'); return; }
        const form = state.bank_forms?.withdraw; if (!form?.action){ setMsg('no withdraw form'); return; }

        const post = { ...(form.hidden||{}), type:'withdraw', amount:String(amt) };
        if (form.hidden && Object.prototype.hasOwnProperty.call(form.hidden, 'pin')){
          let pin = getBankPin();
          if (pin.length !== 4){
            pin = promptBankPin();
            if (pin.length !== 4){ setMsg('PIN required (4 digits)'); return; }
          }
          post.pin = pin;
        }

        const r = await bankPost(form.action, post);
        const j = tryJSON(r.text);
        if (j?.success){ applyServer(j); setMsg(''); render(); }
        else setMsg(extractMsg(r.text));
      } catch { setMsg('withdraw error'); } finally { setBusy(false); }
    }
    async function collectInterest(){
      setBusy(true);
      try {
        if (!state.bank_interest?.action || (now()-state.bank_updatedAt) > FORM_TTL){
          await refreshBank();
        }
        const form = state.bank_interest; if (!form?.action){ setMsg('no interest to collect'); return; }
        const r = await bankPost(form.action, { ...(form.hidden||{}) });
        const j = tryJSON(r.text);
        if (j?.success){
          applyServer(j);
          state.bank_interest = null;
          state.bank_dailyInterest = '';
          setMsg(''); save(state); render();
        } else {
          setMsg(extractMsg(r.text));
          try { await refreshBank(); } catch {}
        }
      } catch { setMsg('interest error'); } finally { setBusy(false); }
    }

    function renderButtons(){
      btnsEl.innerHTML = '';
      const colDep = document.createElement('div'); colDep.className = 'bankCol bankColDep';
      const colWd  = document.createElement('div'); colWd.className  = 'bankCol bankColWd';
      btnsEl.append(colDep, colWd);

      if (settings.rounded.enabled)        addBtn(colDep, 'rounded',        'Rounded Deposit');
      if (settings.customDeposit.enabled)  addBtn(colDep, 'customDeposit',  'Custom Deposit');
      if (settings.autoDeposit.enabled)    addBtn(colDep, 'autoDeposit',    `Deposit ${formatShort(settings.autoDeposit.amount)}`);
      if (settings.customWithdraw.enabled) addBtn(colWd,  'customWithdraw', 'Custom Withdraw');
      if (settings.autoWithdraw.enabled)   addBtn(colWd,  'autoWithdraw',   `Withdraw ${formatShort(settings.autoWithdraw.amount)}`);
    }
    function addBtn(parent, key, label){
      const b = document.createElement('div');
      b.className = 'npBtn bankBtn';
      b.dataset.key = key;
      b.textContent = label;
      if (key === 'rounded'){
        const r = settings.rounded.round;
        b.title = r === 0
          ? 'Deposit all NP on hand'
          : `Deposit NP on hand, rounded down to ${numComma(r)}`;
      } else if (key === 'customDeposit'){
        b.title = 'Type a custom deposit amount';
      } else if (key === 'autoDeposit'){
        b.title = `Deposit ${numComma(settings.autoDeposit.amount)} NP`;
      } else if (key === 'customWithdraw'){
        b.title = 'Type a custom withdraw amount · Alt+click to clear the stored PIN';
      } else if (key === 'autoWithdraw'){
        b.title = `Withdraw ${numComma(settings.autoWithdraw.amount)} NP · Alt+click to clear the stored PIN`;
      }
      b.addEventListener('click', (e) => onButtonClick(e, key, b));
      parent.appendChild(b);
    }

    function onButtonClick(e, key, btnEl){
      e.preventDefault(); e.stopPropagation();
      const isWithdraw = (key === 'autoWithdraw' || key === 'customWithdraw');
      if (isWithdraw && e.altKey){ clearBankPin(); setMsg('PIN cleared'); return; }
      if (busy || !gate()) return;

      if (key === 'rounded'){
        const r = settings.rounded.round;
        if (r === 0){ doDepositAmount('ALL'); return; }
        const amt = Math.floor(npOnHand() / r) * r;
        if (amt < r){ setMsg(`< ${numComma(r)} NP on hand`); return; }
        doDepositAmount(amt);
        return;
      }
      if (key === 'autoDeposit'){ doDepositAmount(settings.autoDeposit.amount); return; }
      if (key === 'autoWithdraw'){ doWithdrawAmount(settings.autoWithdraw.amount); return; }
      if (key === 'customDeposit' || key === 'customWithdraw'){
        openCustomInput(btnEl, key);
        return;
      }
    }

    function openCustomInput(btnEl, key){
      const isWithdraw = (key === 'customWithdraw');
      const form = document.createElement('div');
      form.className = 'bankCustomForm';
      form.innerHTML = `
        <input type="text" inputmode="numeric" autocomplete="off" placeholder="amount">
        <button type="button" class="ok" title="${isWithdraw ? 'Withdraw' : 'Deposit'}">✓</button>
      `;
      btnEl.replaceWith(form);
      const input = form.querySelector('input');
      const ok    = form.querySelector('.ok');
      input.focus();

      input.addEventListener('input', () => {
        input.value = input.value.replace(/[^\d, ]/g, '');
      });
      const close = () => renderButtons();
      const submit = async () => {
        const raw = input.value.replace(/[^\d]/g, '');
        const amt = parseInt(raw, 10);
        if (!Number.isFinite(amt) || amt < 1){ input.focus(); input.select(); return; }
        close();
        if (isWithdraw) await doWithdrawAmount(amt);
        else            await doDepositAmount(amt);
      };
      ok.addEventListener('click', submit);
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter'){ ev.preventDefault(); submit(); }
        else if (ev.key === 'Escape'){ ev.preventDefault(); close(); }
      });
      const outside = (ev) => {
        if (!form.isConnected){ document.removeEventListener('pointerdown', outside, true); return; }
        if (form.contains(ev.target)) return;
        document.removeEventListener('pointerdown', outside, true);
        close();
      };
      setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
    }

    function openSettings(){
      document.querySelector('.bankSettingsBackdrop')?.remove();

      const backdrop = document.createElement('div');
      backdrop.className = 'bankSettingsBackdrop';
      backdrop.innerHTML = `
        <div class="bankSettingsBox" role="dialog" aria-modal="true" aria-label="Mini Bank settings">
          <div class="bankSettingsHead">
            <h3>Mini Bank Settings</h3>
            <button type="button" class="closeBtn" aria-label="Close">×</button>
          </div>
          <div class="bankSettingsBody"></div>
          <div class="bankSettingsFoot">
            <button type="button" class="npBtn cancel">Cancel</button>
            <button type="button" class="npBtn save">Save</button>
          </div>
        </div>
      `;
      const body = backdrop.querySelector('.bankSettingsBody');
      const draft = JSON.parse(JSON.stringify(settings));

      const colDep = document.createElement('div'); colDep.className = 'bankSettingsCol';
      const colWd  = document.createElement('div'); colWd.className  = 'bankSettingsCol';
      colDep.innerHTML = `<div class="bankSettingsColHead">Deposits</div>`;
      colWd.innerHTML  = `<div class="bankSettingsColHead">Withdraws</div>`;
      body.append(colDep, colWd);

      function row(key, label, subHTML){
        const r = document.createElement('div');
        r.className = 'bankSettingsRow ' + (draft[key].enabled ? 'on' : 'off');
        r.innerHTML = `
          <div class="topLine">
            <input type="checkbox" id="bs_${key}" ${draft[key].enabled ? 'checked' : ''}>
            <label class="lbl" for="bs_${key}">${label}</label>
          </div>
          ${subHTML ? `<div class="sub">${subHTML}</div>` : ''}
        `;
        const cb = r.querySelector('input[type="checkbox"]');
        cb.addEventListener('change', () => {
          draft[key].enabled = cb.checked;
          r.classList.toggle('on', cb.checked);
          r.classList.toggle('off', !cb.checked);
        });
        return r;
      }
      function wireAmountInput(inputEl, draftSlot){
        inputEl.addEventListener('input', () => {
          inputEl.value = inputEl.value.replace(/[^\d, ]/g, '');
        });
        inputEl.addEventListener('blur', () => {
          const n = parseInt(inputEl.value.replace(/[^\d]/g,''), 10);
          if (Number.isFinite(n) && n > 0){
            draftSlot.amount = n;
            inputEl.value = numComma(n);
          } else {
            inputEl.value = numComma(draftSlot.amount);
          }
        });
      }

      const roundOpts = ROUND_OPTIONS.map(o =>
        `<option value="${o.value}" ${draft.rounded.round === o.value ? 'selected' : ''}>${o.label}</option>`
      ).join('');
      const roundedRow = row('rounded', 'Rounded Deposit', `
        <label for="bs_rounded_round">Round to:</label>
        <select id="bs_rounded_round">${roundOpts}</select>
      `);
      roundedRow.querySelector('#bs_rounded_round').addEventListener('change', (ev) => {
        draft.rounded.round = parseInt(ev.target.value, 10) || 0;
      });
      colDep.appendChild(roundedRow);

      colDep.appendChild(row('customDeposit', 'Custom Deposit'));

      const autoDepRow = row('autoDeposit', 'Auto Deposit', `
        <label for="bs_autoDep_amt">Amount:</label>
        <input type="text" inputmode="numeric" id="bs_autoDep_amt" value="${numComma(draft.autoDeposit.amount)}">
      `);
      const autoDepInp = autoDepRow.querySelector('#bs_autoDep_amt');
      wireAmountInput(autoDepInp, draft.autoDeposit);
      colDep.appendChild(autoDepRow);

      colWd.appendChild(row('customWithdraw', 'Custom Withdraw'));

      const autoWdRow = row('autoWithdraw', 'Auto Withdraw', `
        <label for="bs_autoWd_amt">Amount:</label>
        <input type="text" inputmode="numeric" id="bs_autoWd_amt" value="${numComma(draft.autoWithdraw.amount)}">
      `);
      const autoWdInp = autoWdRow.querySelector('#bs_autoWd_amt');
      wireAmountInput(autoWdInp, draft.autoWithdraw);
      colWd.appendChild(autoWdRow);

      const graphRow = row('graph', 'Show balance trend graph');
      graphRow.style.gridColumn = '1 / -1';
      body.appendChild(graphRow);

      const close = () => {
        backdrop.remove();
        document.removeEventListener('keydown', onKey, true);
      };
      function onKey(ev){
        if (ev.key === 'Escape'){ ev.preventDefault(); close(); }
      }
      document.addEventListener('keydown', onKey, true);
      backdrop.querySelector('.closeBtn').addEventListener('click', close);
      backdrop.querySelector('.cancel').addEventListener('click', close);
      backdrop.querySelector('.save').addEventListener('click', () => {
        autoDepInp.dispatchEvent(new Event('blur'));
        autoWdInp.dispatchEvent(new Event('blur'));
        settings = draft;
        saveSettings(settings);
        render();
        close();
      });
      backdrop.addEventListener('click', (ev) => {
        if (ev.target === backdrop) close();
      });

      document.body.appendChild(backdrop);
    }

    balEl.addEventListener('click', async (e) => { e.preventDefault(); e.stopPropagation(); if (busy || !gate()) return; setBusy(true); try { await refreshBank(); setMsg(''); } catch { setMsg('refresh error'); } finally { setBusy(false); } });
    gearBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openSettings(); });
    intBtn.addEventListener('click', async (e) => { e.preventDefault(); e.stopPropagation(); if (busy || !gate()) return; await collectInterest(); });
    const bankRefreshBtn = $('#npBankRefresh');
    if (bankRefreshBtn){
      bankRefreshBtn.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (busy || !gate()) return;
        setBusy(true);
        try { await refreshBank(); setMsg(''); } catch { setMsg('refresh error'); } finally { setBusy(false); }
      });
    }
    cardBank.addEventListener('click', (e) => {
      if (e.target?.closest?.('button, a, input, select, .npBtn, .bankCustomForm')) return;
      window.location.assign('https://www.neopets.com/bank.phtml');
    });

    if (crossedDailyReset(state.bank_updatedAt, now())){
      state.bank_interest = null;
      state.bank_dailyInterest = '';
      save(state);
    }

    render();

    npWhenBgAllowed(() => {
      const stale = !state.bank_updatedAt || (now() - state.bank_updatedAt) > FORM_TTL;
      const onBankPage = /^\/bank\.phtml/.test(location.pathname);
      if (!state.bank_balance || crossedDailyReset(state.bank_updatedAt, now()) || stale || onBankPage){
        refreshBank().catch(() => {});
      }
    });

    setInterval(() => {
      if (busy || document.hidden) return;
      if (crossedDailyReset(state.bank_updatedAt, now())){
        refreshBank().catch(() => {});
      }
    }, RECHECK_MS);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || busy) return;
      if (crossedDailyReset(state.bank_updatedAt, now())){
        refreshBank().catch(() => {});
      }
    });
  })();

  (function qrModule(){
    const FETCH_URL = 'https://www.neopets.com/quickref.phtml';
    const COOLDOWN = 5 * 60 * 1000, PETS_MAX = 20;
    const LS_DATA = 'npqol_qr_data';
    const BLOCK_RE = /(customi[sz]e|view abilities|equip)/i;
    const state = { data:null, loading:false, closeT:0, wantOpen:false, imagesLoaded:false };
    const cpn = (n) => `https://pets.neopets.com/cpn/${encodeURIComponent(n)}/1/4.png`;

    const readCache = () => { try { const s = localStorage.getItem(LS_DATA); return s ? JSON.parse(s) : null; } catch { return null; } };
    const qrListeners = [];
    NQ.onQrData = (fn) => { qrListeners.push(fn); };
    const writeCache = (data) => { try { localStorage.setItem(LS_DATA, JSON.stringify({ ts:now(), data })); } catch {} qrListeners.forEach(fn => { try { fn(); } catch {} }); };
    const readLast = () => { try { return ((localStorage.getItem(LS_DATA+'_lastFetch')||0)|0); } catch { return 0; } };
    const writeLast = () => { try { localStorage.setItem(LS_DATA+'_lastFetch', String(now())); } catch {} };

    function parse(html){
      const dom = new DOMParser().parseFromString(html, 'text/html');
      const pets = [...dom.querySelectorAll('#nav td.active_pet, #nav td.inactive_pet')].slice(0, PETS_MAX).map(td => {
        const img = td.querySelector('img[id$="_thumb"]');
        const name = img?.getAttribute('title') || img?.alt || 'Pet';
        const thumbSrc = img?.getAttribute('src') || '';
        const sciMatch = thumbSrc.match(/\/cp\/([^/]+)\//);
        const sci = sciMatch ? sciMatch[1] : '';
        const idBase = td.querySelector('.pet_menu_launcher')?.id?.replace('_menu_launcher','');
        const ul = idBase ? dom.querySelector(`#${CSS.escape(idBase)}_menu`) : null;
        const actions = ul ? [...ul.querySelectorAll('a')].map(a => { const href = a.getAttribute('href')||''; const abs = href.startsWith('http') ? href : new URL(href,'https://www.neopets.com/').href; return { href:abs, text:(a.textContent||'').replace(/»\s*/,'').trim() }; }) : [];
        return { name, sci, actions, isActive: td.classList.contains('active_pet') };
      });
      const ai = pets.findIndex(p => p.isActive); if (ai > 0) pets.unshift(pets.splice(ai,1)[0]);
      const activeDiv = [...dom.querySelectorAll('div[id$="_details"]')].find(d => (d.getAttribute('style')||'').includes('display: block')) || dom.querySelector('div[id$="_details"]');
      let a = null;
      if (activeDiv){
        const headerTh = activeDiv.querySelector('th[class^="contentModuleHeader"]');
        const name = headerTh?.querySelector('a')?.textContent?.trim() || 'Active';
        const kv = {};
        activeDiv.querySelectorAll('.pet_stats tr').forEach(tr => { const th = tr.querySelector('th'), td = tr.querySelector('td'); if (!th||!td) return; kv[(th.textContent||'').replace(':','').trim().toLowerCase()] = (td.textContent||'').trim(); });
        a = {
          name,
          species:      kv['species']      || '',
          colour:       kv['colour']       || '',
          gender:       kv['gender']       || '',
          age:          kv['age']          || '',
          level:        kv['level']        || '',
          health:       kv['health']       || '',
          mood:         kv['mood']         || '',
          strength:     kv['strength']     || '',
          defence:      kv['defence']      || '',
          move:         kv['move']         || '',
          intelligence: kv['intelligence'] || '',
        };
        const pp = [...activeDiv.querySelectorAll('a[href*="neopetpet.phtml"] img')].map(im => im.getAttribute('src') || '').filter(Boolean);
        a.petpet = pp[0] || ''; a.petpetpet = pp[1] || '';
      }
      return { pets, active:a };
    }
    const statNum = (s) => { if (!s) return ''; let m = /\$?([\d,]+)$/.exec(s); if (m) return m[1].replace(/,/g,''); m = /(\d[\d,]*)/.exec(s); return m ? m[1].replace(/,/g,'') : ''; };
    const hpInline = (s) => { if (!s) return ''; const t = s.replace(/\s+/g,' ').trim(); const m = /(\d[\d,]*)\s*\/\s*(\d[\d,]*)/.exec(t); return m ? `${m[1].replace(/,/g,'')} / ${m[2].replace(/,/g,'')}` : t; };

    const QR_SETTINGS_LS = 'npqol_qr_settings_v1';
    const DEFAULT_QR_SETTINGS = {
      colour: true, species: true, gender: false, age: false,
      level: true, mood: false,
      health: true, strength: true, defence: true,
      move: false, intelligence: false,
      petpet: true, petpetpet: true,
    };
    function loadQrSettings(){
      try {
        const raw = localStorage.getItem(QR_SETTINGS_LS);
        if (!raw) return { ...DEFAULT_QR_SETTINGS };
        const p = JSON.parse(raw) || {};
        return { ...DEFAULT_QR_SETTINGS, ...p };
      } catch { return { ...DEFAULT_QR_SETTINGS }; }
    }
    function saveQrSettings(s){
      try { localStorage.setItem(QR_SETTINGS_LS, JSON.stringify(s||{})); } catch {}
    }

    function openQrSettings(){
      document.querySelector('.bankSettingsBackdrop')?.remove();
      const backdrop = document.createElement('div');
      backdrop.className = 'bankSettingsBackdrop';
      backdrop.innerHTML = `
        <div class="bankSettingsBox" role="dialog" aria-modal="true" aria-label="QuickRef settings">
          <div class="bankSettingsHead">
            <h3>QuickRef Settings</h3>
            <button type="button" class="closeBtn" aria-label="Close">×</button>
          </div>
          <div class="bankSettingsBody bankSettingsBodySingle"></div>
          <div class="bankSettingsFoot">
            <button type="button" class="npBtn cancel">Cancel</button>
            <button type="button" class="npBtn save">Save</button>
          </div>
        </div>
      `;
      const body  = backdrop.querySelector('.bankSettingsBody');
      const draft = loadQrSettings();

      const fields = [
        ['colour',       'Colour'],
        ['species',      'Species'],
        ['gender',       'Gender'],
        ['age',          'Age'],
        ['level',        'Level'],
        ['mood',         'Mood'],
        ['health',       'Health'],
        ['strength',     'Strength'],
        ['defence',      'Defence'],
        ['move',         'Move (Agility)'],
        ['intelligence', 'Intelligence'],
        ['petpet',       'Petpet image'],
        ['petpetpet',    'Petpetpet image'],
      ];

      fields.forEach(([k, label]) => {
        const r = document.createElement('div');
        r.className = 'bankSettingsRow toggleOnly ' + (draft[k] ? 'on' : 'off');
        r.innerHTML =
          `<div class="topLine">` +
            `<input type="checkbox" id="qs_${k}" ${draft[k] ? 'checked' : ''}>` +
            `<label class="lbl" for="qs_${k}">${label}</label>` +
          `</div>`;
        const cb = r.querySelector('input[type="checkbox"]');
        cb.addEventListener('change', () => {
          draft[k] = cb.checked;
          r.classList.toggle('on',  cb.checked);
          r.classList.toggle('off', !cb.checked);
        });
        body.appendChild(r);
      });

      const close = () => { backdrop.remove(); document.removeEventListener('keydown', onKey, true); };
      function onKey(ev){ if (ev.key === 'Escape'){ ev.preventDefault(); close(); } }
      document.addEventListener('keydown', onKey, true);
      backdrop.querySelector('.closeBtn').addEventListener('click', close);
      backdrop.querySelector('.cancel').addEventListener('click', close);
      backdrop.querySelector('.save').addEventListener('click', () => {
        saveQrSettings(draft);
        if (state.data?.active) renderActive(state.data.active);
        close();
      });
      backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(); });
      document.body.appendChild(backdrop);
    }

    function renderActive(a){
      if (!a){ cardQr.style.display = 'none'; return; }
      cardQr.style.display = '';
      const qs = loadQrSettings();
      const lv = statNum(a.level), str = statNum(a.strength), def = statNum(a.defence);
      const mv = statNum(a.move), intel = statNum(a.intelligence);
      const hp = hpInline(a.health);

      const badgeHTML = [];
      if (qs.colour && a.colour)   badgeHTML.push(`<div class="qrBadge">${a.colour}</div>`);
      if (qs.species && a.species) badgeHTML.push(`<div class="qrBadge">${a.species}</div>`);
      if (qs.gender && a.gender)   badgeHTML.push(`<div class="qrBadge">${a.gender}</div>`);
      if (qs.age && a.age)         badgeHTML.push(`<div class="qrBadge">${a.age}</div>`);
      if (qs.level && lv)          badgeHTML.push(`<div class="qrBadge">Level ${lv}</div>`);
      if (qs.mood && a.mood)       badgeHTML.push(`<div class="qrBadge">${a.mood}</div>`);

      const statHTML = [];
      if (qs.health && hp)            statHTML.push(`<div>Health</div><div><b>${hp}</b></div>`);
      if (qs.strength && str)         statHTML.push(`<div>Strength</div><div>${str}</div>`);
      if (qs.defence && def)          statHTML.push(`<div>Defence</div><div>${def}</div>`);
      if (qs.move && mv)              statHTML.push(`<div>Move</div><div>${mv}</div>`);
      if (qs.intelligence && intel)   statHTML.push(`<div>Intelligence</div><div>${intel}</div>`);

      const showPP   = qs.petpet && a.petpet;
      const showPPP  = qs.petpetpet && a.petpetpet;
      const hasPP    = showPP || showPPP;

      cardQr.innerHTML =
        `<h3>${a.name || 'Active'}</h3>` +
        `<button type="button" class="cardGear" id="npQrGear" title="QuickRef settings" aria-label="Settings">⚙</button>` +
        `<button type="button" class="cardRefresh" id="npQrRefresh" title="Refresh pet data" aria-label="Refresh">↻</button>` +
        (badgeHTML.length ? `<div class="qrBadges">${badgeHTML.join('')}</div>` : '') +
        (statHTML.length  ? `<div class="qrStat">${statHTML.join('')}</div>`   : '') +
        (hasPP ? `<div class="qrPP">${showPP ? `<img class="qrPPimg" alt="petpet">` : ''}${showPPP ? `<img class="qrPPimg" alt="petpetpet">` : ''}</div>` : '');
      if (hasPP){
        const imgs = [...cardQr.querySelectorAll('.qrPPimg')];
        const urls = [showPP ? a.petpet : null, showPPP ? a.petpetpet : null].filter(Boolean);
        imgs.forEach((im, i) => cleanImg(urls[i], im));
      }
      const gear = cardQr.querySelector('#npQrGear');
      if (gear) gear.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        openQrSettings();
      });
      const rfr = cardQr.querySelector('#npQrRefresh');
      if (rfr) rfr.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        refresh({ force: true });
      });
    }

    function removeWhiteBg(id){
      const d = id.data, w = id.width, h = id.height;
      const BG_MIN = 216, BG_CHROMA = 44;
      const isBg = (i) => { const r=d[i],g=d[i+1],b=d[i+2], mn=Math.min(r,g,b), mx=Math.max(r,g,b); return d[i+3] > 0 && mn >= BG_MIN && (mx - mn) <= BG_CHROMA; };

      const seen = new Uint8Array(w*h), st = [];
      const push = (x,y) => { if (x>=0 && y>=0 && x<w && y<h){ const p=y*w+x; if (!seen[p]) st.push(p); } };
      for (let x=0;x<w;x++){ push(x,0); push(x,h-1); }
      for (let y=0;y<h;y++){ push(0,y); push(w-1,y); }
      while (st.length){
        const p = st.pop(); if (seen[p]) continue; seen[p] = 1;
        const i = p*4;
        if (d[i+3] !== 0 && !isBg(i)) continue;
        if (isBg(i)) d[i+3] = 0;
        const x = p % w, y = (p / w)|0;
        push(x+1,y); push(x-1,y); push(x,y+1); push(x,y-1);
      }

      const DARK = 110;
      const DARK_FRAC = 0.55;
      const seen2 = new Uint8Array(w*h);
      for (let p0=0;p0<w*h;p0++){
        if (seen2[p0]) continue;
        const i0 = p0*4;
        if (d[i0+3] === 0 || !isBg(i0)) continue;
        const region = [], q = [p0]; seen2[p0] = 1;
        let borderTotal = 0, borderDark = 0;
        while (q.length){
          const p = q.pop(); region.push(p);
          const x = p % w, y = (p / w)|0;
          const visit = (np) => {
            if (np<0 || np>=w*h || seen2[np]) return;
            const ni = np*4;
            if (d[ni+3] === 0) return;
            if (isBg(ni)){ seen2[np]=1; q.push(np); }
            else { seen2[np]=1; borderTotal++; if (Math.max(d[ni],d[ni+1],d[ni+2]) < DARK) borderDark++; }
          };
          if (x>0) visit(p-1); if (x<w-1) visit(p+1); if (y>0) visit(p-w); if (y<h-1) visit(p+w);
        }
        if (borderTotal > 0 && (borderDark / borderTotal) >= DARK_FRAC)
          for (const p of region) d[p*4+3] = 0;
      }

      const a0 = new Uint8ClampedArray(w*h);
      for (let p=0;p<w*h;p++) a0[p] = d[p*4+3];
      const LO = 120, HI = 238;
      const transN = (p,x,y) =>
        (x>0 && a0[p-1]===0) || (x<w-1 && a0[p+1]===0) ||
        (y>0 && a0[p-w]===0) || (y<h-1 && a0[p+w]===0) ||
        (x>0 && y>0 && a0[p-w-1]===0) || (x<w-1 && y>0 && a0[p-w+1]===0) ||
        (x>0 && y<h-1 && a0[p+w-1]===0) || (x<w-1 && y<h-1 && a0[p+w+1]===0);
      for (let y=0;y<h;y++){
        for (let x=0;x<w;x++){
          const p = y*w+x; if (a0[p] === 0) continue;
          if (!transN(p,x,y)) continue;
          const i = p*4, L = Math.min(d[i], d[i+1], d[i+2]);
          if (L >= HI) d[i+3] = 0;
          else if (L > LO) d[i+3] = Math.round(d[i+3] * (HI - L) / (HI - LO));
        }
      }
    }

    function addWhiteOutline(id, ss){
      const d = id.data, w = id.width, h = id.height, OPAQUE = 128;
      const RAMP = (ss === 2)
        ? [0, 255, 255, 230, 190, 140, 90, 45, 15]
        : [0, 255, 130, 45];
      const MAXD = RAMP.length - 1;
      const A = new Uint8Array(w*h);
      for (let p=0;p<w*h;p++) A[p] = d[p*4+3] >= OPAQUE ? 1 : 0;

      const ext = new Uint8Array(w*h), q = [];
      const seed = (x,y) => { const p=y*w+x; if (!A[p] && !ext[p]){ ext[p]=1; q.push(p); } };
      for (let x=0;x<w;x++){ seed(x,0); seed(x,h-1); }
      for (let y=0;y<h;y++){ seed(0,y); seed(w-1,y); }
      let head = 0;
      while (head < q.length){
        const p = q[head++], x = p % w, y = (p / w)|0;
        if (x>0 && !A[p-1] && !ext[p-1]){ ext[p-1]=1; q.push(p-1); }
        if (x<w-1 && !A[p+1] && !ext[p+1]){ ext[p+1]=1; q.push(p+1); }
        if (y>0 && !A[p-w] && !ext[p-w]){ ext[p-w]=1; q.push(p-w); }
        if (y<h-1 && !A[p+w] && !ext[p+w]){ ext[p+w]=1; q.push(p+w); }
      }

      const dist = new Int16Array(w*h), q2 = [];
      const near8 = (x,y) => {
        for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++){
          if (!dx && !dy) continue;
          const nx=x+dx, ny=y+dy;
          if (nx>=0 && ny>=0 && nx<w && ny<h && A[ny*w+nx]) return true;
        }
        return false;
      };
      for (let p=0;p<w*h;p++){ if (ext[p] && near8(p % w, (p / w)|0)){ dist[p]=1; q2.push(p); } }
      head = 0;
      while (head < q2.length){
        const p = q2[head++], dp = dist[p]; if (dp >= MAXD) continue;
        const x = p % w, y = (p / w)|0;
        for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++){
          if (!dx && !dy) continue;
          const nx=x+dx, ny=y+dy; if (nx<0||ny<0||nx>=w||ny>=h) continue;
          const np = ny*w+nx;
          if (ext[np] && dist[np]===0){ dist[np]=dp+1; q2.push(np); }
        }
      }
      for (let p=0;p<w*h;p++){
        const dp = dist[p]; if (dp <= 0) continue;
        const i = p*4; d[i]=255; d[i+1]=255; d[i+2]=255; d[i+3]=RAMP[dp];
      }
    }

    const PP_VER_KEY = 'npqol_pp_ver';
    try {
      if (localStorage.getItem(PP_VER_KEY) !== '2'){
        const kill = [];
        for (let i = 0; i < localStorage.length; i++){
          const k = localStorage.key(i);
          if (k && k.startsWith('npqol_pp_png')) kill.push(k);
        }
        kill.forEach(k => { try { localStorage.removeItem(k); } catch {} });
        localStorage.setItem(PP_VER_KEY, '2');
      }
    } catch {}

    const PP_INDEX_KEY = 'npqol_pp_png_index';
    const PP_MAX = 30;
    function ppIndexRead(){
      try { const r = localStorage.getItem(PP_INDEX_KEY); return r ? (JSON.parse(r) || []) : []; }
      catch { return []; }
    }
    function ppIndexWrite(arr){
      try { localStorage.setItem(PP_INDEX_KEY, JSON.stringify(arr.slice(-PP_MAX*2))); } catch {}
    }
    function ppCachePut(key, dataUrl){
      try { localStorage.setItem(key, dataUrl); } catch { return; }
      const idx = ppIndexRead().filter(k => k !== key);
      idx.push(key);
      while (idx.length > PP_MAX){
        const old = idx.shift();
        try { localStorage.removeItem(old); } catch {}
      }
      ppIndexWrite(idx);
    }

    function cleanImg(url, imgEl){
      if (!url || !imgEl) return;
      const KEY = 'npqol_pp_png:' + url;
      let cached = null; try { cached = localStorage.getItem(KEY); } catch {}
      if (cached){ imgEl.src = cached; return; }
      const probe = new Image();
      probe.crossOrigin = 'anonymous';
      probe.onload = () => {
        try {
          const PAD = 4;
          const w = probe.naturalWidth, h = probe.naturalHeight;
          const SS = (w * h <= 60000) ? 2 : 1;
          const cw = (w + PAD*2) * SS, ch = (h + PAD*2) * SS;
          const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
          const cx = cv.getContext('2d');
          cx.imageSmoothingEnabled = true;
          cx.imageSmoothingQuality = 'high';
          cx.drawImage(probe, PAD*SS, PAD*SS, w*SS, h*SS);
          const id = cx.getImageData(0, 0, cw, ch);
          removeWhiteBg(id);
          addWhiteOutline(id, SS);
          cx.putImageData(id, 0, 0);
          const out = cv.toDataURL('image/png');
          ppCachePut(KEY, out);
          imgEl.src = out;
        } catch { imgEl.src = url; }
      };
      probe.onerror = () => { imgEl.src = url; };
      probe.src = url;
    }
    try { NQ.cleanImg = cleanImg; } catch {}

    function renderDock(data){
      const TXT_RE = /(make\s*active|set\s*(?:as\s*)?active|make\s*this\s*pet\s*active|set\s*active)/i;
      const URL_RE = /(process_changetpet|new_active_pet=|setactive|makeactive|active_pet)/i;
      const pets = (data.pets || []).slice(0, PETS_MAX);
      const inactive = pets.filter(p => !p.isActive);
      const active   = pets.find(p => p.isActive);
      const ordered = active ? [...inactive, active] : inactive;
      dock.innerHTML = '';
      if (!ordered.length) return;
      for (const p of ordered){
        const el = document.createElement('div');
        el.className = 'qrPet' + (p.isActive ? ' active' : '');
        el.title = p.name || '';
        el.dataset.bg = cpn(p.name);
        el.dataset.name = p.name || '';

        const overlay = document.createElement('div');
        overlay.className = 'qrOverlay';
        const nameEl = document.createElement('div');
        nameEl.className = 'qrPetName';
        nameEl.textContent = p.name || '';
        overlay.appendChild(nameEl);

        if (p.isActive){
          const link = document.createElement('a');
          link.href = 'https://www.neopets.com/quickref.phtml';
          link.textContent = 'Quick Ref';
          link.target = '_self';
          overlay.appendChild(link);
        } else {
          const make = (p.actions||[])
            .filter(a => !BLOCK_RE.test(a.text||''))
            .find(a => TXT_RE.test(a.text||'') || URL_RE.test(a.href||''));
          if (make?.href){
            const link = document.createElement('a');
            link.href = make.href;
            link.textContent = 'Make Active';
            link.target = '_self';
            link.rel = 'nofollow';
            link.addEventListener('click', async (e) => {
              if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
              e.preventDefault();
              e.stopPropagation();
              const href = make.href;
              try {
                const mkRes = await fetch(href, { credentials: 'include', cache: 'no-store' });
                npNote403(mkRes);
                try { localStorage.removeItem(LS_DATA + '_lastFetch'); } catch {}
                try { await refresh({ force: true }); } catch {}
                try { setOpen(false); } catch {}
              } catch {
                window.location.assign(href);
              }
            });
            overlay.appendChild(link);
          }
        }

        el.appendChild(overlay);
        dock.appendChild(el);
      }
    }
    function petImgUrl(name, sci){
      if (!name) return '';
      let mood = '1';
      if (!sci){
        try {
          const homeRaw = localStorage.getItem('jb_np_homedata_v2');
          if (homeRaw){
            const home = JSON.parse(homeRaw);
            const entry = home && home.data && home.data[name];
            if (entry && entry.sci){
              sci = entry.sci;
              if (entry.mood) mood = String(entry.mood);
            }
          }
        } catch {}
      }
      if (sci){
        const url = `https://pets.neopets.com/cp/${sci}/${mood}/9.png`;
        saveLastGoodPetImg(name, url);
        return url;
      }
      try {
        const lg = readLastGoodPetImg();
        if (lg && lg.name === name && /\/cp\//.test(lg.url)) return lg.url;
      } catch {}
      return `https://pets.neopets.com/cpn/${encodeURIComponent(name)}/1/4.png`;
    }

    function renderActivePetImage(name, sci){
      if (!name) return;
      const url = petImgUrl(name, sci);
      let img = cardActivePet.querySelector('img');

      if (!img && _earlyActivePetImg
          && _earlyActivePetImg.dataset.forName === name
          && _earlyActivePetImg.dataset.cpnUrl === url){
        img = _earlyActivePetImg;
        _earlyActivePetImg = null;
        cardActivePet.prepend(img);
        return;
      }

      if (!img){
        img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        try { img.fetchPriority = 'high'; } catch {}
        img.addEventListener('load', () => img.classList.add('loaded'));
        img.addEventListener('error', () => img.classList.remove('loaded'));
        cardActivePet.prepend(img);
      }
      if (img.dataset.forName === name && img.dataset.cpnUrl === url && img.src){
        return;
      }
      img.dataset.forName = name;
      img.dataset.cpnUrl = url;

      img.classList.remove('loaded');
      img.src = url;

      setTimeout(() => _cacheRawPetImage(url), 1200);
    }

    function applyData(data){
      if (!data) return;
      state.data = data;
      if (data.active){
        renderActive(data.active);
        const activePet = (data.pets || []).find(p => p.isActive);
        renderActivePetImage(data.active.name, activePet?.sci || '');
      }
      if (data.pets?.length) renderDock(data);
    }

    function loadImagesNow(){
      if (state.imagesLoaded) return; state.imagesLoaded = true;
      dock.querySelectorAll('.qrPet').forEach(el => {
        if (el.dataset.loaded === '1') return;
        const bg = el.dataset.bg;
        if (!bg) return;
        el.style.backgroundImage = `url(${bg})`;
        el.dataset.loaded = '1';
      });
    }
    async function fetchQr(){
      if (np403BackoffActive()) throw new Error('qr 403 backoff');
      const r = await fetch(FETCH_URL, { credentials:'include', cache:'no-store', headers:{ 'Cache-Control':'no-cache, no-store, must-revalidate', 'Pragma':'no-cache', 'Expires':'0' } });
      npNote403(r);
      const data = parse(await r.text());
      if ((data.pets && data.pets.length) || data.active){ writeCache(data); writeLast(); return data; }
      throw new Error('QuickRef parse failed');
    }
    async function refresh({ force=false } = {}){
      if (state.loading) return;
      if (!force && now() - readLast() < COOLDOWN) return;
      state.loading = true;
      try { const data = await fetchQr(); state.imagesLoaded = false; applyData(data); } catch {} finally { state.loading = false; }
    }
    function setOpen(on){
      dock.classList.toggle('open', !!on);
      dockWrap.classList.toggle('open', !!on);
      try { document.body.classList.toggle('npDockActive', !!on); } catch {}
    }
    function wantOpen(on){
      state.wantOpen = !!on; clearTimeout(state.closeT);
      if (on){ setOpen(true); loadImagesNow(); return; }
      state.closeT = setTimeout(() => { if (!state.wantOpen && !dock.matches(':hover')) setOpen(false); }, 110);
    }
    cardActivePet.addEventListener('mouseenter', () => wantOpen(true));
    cardActivePet.addEventListener('mouseleave', () => wantOpen(false));
    dock.addEventListener('mouseenter', () => wantOpen(true));
    dock.addEventListener('mouseleave', () => wantOpen(false));
    const QR_URL = 'https://www.neopets.com/quickref.phtml';
    function navQuickRef(e){
      if (e.altKey){ refresh({ force: true }); return; }
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1){
        window.open(QR_URL, '_blank', 'noopener');
      } else {
        window.location.href = QR_URL;
      }
    }
    function navQuickRefMiddle(e){
      if (e.button !== 1) return;
      e.preventDefault();
      window.open(QR_URL, '_blank', 'noopener');
    }
    function navQuickRefMenu(e){
      e.preventDefault();
      window.open(QR_URL, '_blank', 'noopener');
    }
    cardQr.addEventListener('click', navQuickRef);
    cardQr.addEventListener('auxclick', navQuickRefMiddle);
    cardQr.addEventListener('contextmenu', navQuickRefMenu);
    cardActivePet.addEventListener('click', navQuickRef);
    cardActivePet.addEventListener('auxclick', navQuickRefMiddle);
    cardActivePet.addEventListener('contextmenu', navQuickRefMenu);

    const snap = readCache(); if (snap?.data){ try { applyData(snap.data); } catch {} }
    npWhenBgAllowed(() => refresh({ force: false }));
    window.addEventListener('pageshow', (e) => {
      if (!e.persisted) return;
      state.imagesLoaded = false;
      const s = readCache(); if (s?.data) applyData(s.data);
      npWhenBgAllowed(() => refresh({ force: false }));
    });
  })();

  (function npModule(){
    const LS_KEY = 'npqol_np_last';
    const SELECTORS = ['#npanchor', '.navsub-np-meter__2020 #npanchor', '.navsub-np-meter__2020 .np-text__2020', 'span.np-text__2020'];
    const st = { last:null, anchor:null, watch:null, obs:null, fastTimer:0, fastUntil:0, lastManual:0 };
    const valEl = () => cardNp.querySelector('.npVal');
    const sGet = () => { try { return localStorage.getItem(LS_KEY) || ''; } catch { return ''; } };
    const sSet = (v) => { try { localStorage.setItem(LS_KEY, v); } catch {} };
    const clean = (t) => (t||'').replace(/\s+/g,' ').trim();
    function setText(val, fromCache=false){
      const v = clean(val); if (!v || v === st.last) return;
      st.last = v; const el = valEl(); if (el) el.textContent = v;
      if (!fromCache) sSet(v);
    }
    const findAnchor = () => { for (const s of SELECTORS){ const el = document.querySelector(s); if (el) return el; } return null; };
    const readNP = () => { const a = findAnchor(); return a ? clean(a.textContent) : ''; };
    const refresh = () => { const v = readNP(); if (v) setText(v, false); return !!v; };
    function bindWatcher(){
      const a = findAnchor(); if (!a) return;
      const watch = a.closest('.navsub-np-meter__2020') || a.parentElement || a;
      if (st.anchor === a && st.watch === watch && st.obs) return;
      st.anchor = a; st.watch = watch;
      try { st.obs?.disconnect(); } catch {}
      st.obs = new MutationObserver(() => refresh());
      st.obs.observe(watch, { childList:true, subtree:true, characterData:true });
      refresh();
      try { st.docObs?.disconnect(); st.docObs = null; } catch {}
    }
    function startFast(ms=4500){
      const until = now()+ms; if (until > st.fastUntil) st.fastUntil = until;
      if (st.fastTimer) return;
      st.fastTimer = window.setInterval(() => { bindWatcher(); refresh(); if (now() > st.fastUntil){ clearInterval(st.fastTimer); st.fastTimer = 0; } }, 80);
    }
    if (!findAnchor()){
      st.docObs = new MutationObserver((muts) => {
        for (const m of muts){
          if (m.type === 'childList' && [...m.addedNodes].some(n => n.nodeType === 1)){
            bindWatcher();
            if (!st.docObs) return;
            break;
          }
        }
      });
      st.docObs.observe(document.documentElement, { childList:true, subtree:true });
    }
    const fire = () => startFast(4500);
    window.addEventListener('focus', fire, true);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) fire(); }, true);
    const _hist = PW.history;
    const _push = _hist.pushState, _rep = _hist.replaceState;
    _hist.pushState = function(){ const r = _push.apply(this, arguments); fire(); return r; };
    _hist.replaceState = function(){ const r = _rep.apply(this, arguments); fire(); return r; };
    window.addEventListener('popstate', fire, true);
    const BANK_URL = 'https://www.neopets.com/bank.phtml';
    cardNp.addEventListener('click', (e) => {
      if (e.altKey){ e.preventDefault(); const t = now(); if (t - st.lastManual < 350) return; st.lastManual = t; cardNp.classList.add('dim'); refresh(); cardNp.classList.remove('dim'); return; }
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1){ window.open(BANK_URL, '_blank', 'noopener'); return; }
      window.location.href = BANK_URL;
    });
    cardNp.addEventListener('auxclick', (e) => {
      if (e.button !== 1) return;
      e.preventDefault();
      window.open(BANK_URL, '_blank', 'noopener');
    });
    cardNp.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      window.open(BANK_URL, '_blank', 'noopener');
    });
    const cached = sGet(); if (cached) setText(cached, true);
    startFast(6000);
    window.setInterval(bindWatcher, 8000);
  })();

  (function colsModule(){
    if (document.getElementById('btnOverlay')) return;

    const SHARED = NQ.btnThemesData;
    const BTN_THEMES = SHARED.BTN_THEMES || [];
    const FALLBACK_PATTERN = SHARED.FALLBACK_PATTERN || 'https://images.neopets.com/themes/h5/basic/images/v3/{icon}-icon.svg';
    const LS_BTN_THEME = SHARED.LS_KEY || 'npqol_btn_theme_v1';
    const DEFAULT_THEME = SHARED.DEFAULT || 'constellations';

    const getTheme = () => {
      try { return localStorage.getItem(LS_BTN_THEME) || DEFAULT_THEME; }
      catch { return DEFAULT_THEME; }
    };
    const themeById = (id) => BTN_THEMES.find(t => t.id === id) || BTN_THEMES.find(t => t.id === DEFAULT_THEME) || BTN_THEMES[0];
    const iconUrl = (iconName, themeId) => {
      const t = themeById(themeId);
      return t ? t.pattern.replace('{icon}', iconName) : fallbackUrl(iconName);
    };
    const fallbackUrl = (iconName) => FALLBACK_PATTERN.replace('{icon}', iconName);

    const attachIconFallback = NQ.attachBtnFallback;

    function applyBtnTheme(themeId){
      const overlay = document.getElementById('btnOverlay');
      if (!overlay) return;
      overlay.querySelectorAll('img[data-icon]').forEach(img => {
        const name = img.dataset.icon || '';
        if (!name) return;
        img.dataset.fbDone = '';
        attachIconFallback(img, name);
        img.src = iconUrl(name, themeId);
      });
    }

    NQ.onBtnTheme((id) => {
      if (id) applyBtnTheme(id);
    });

    const reapplyBrokenIcons = () => {
      try {
        const overlay = document.getElementById('btnOverlay');
        if (!overlay) return;
        const tid = getTheme();
        overlay.querySelectorAll('img[data-icon]').forEach(img => {
          if (img.complete && img.naturalWidth > 0) return;
          const name = img.dataset.icon || '';
          if (!name) return;
          attachIconFallback(img, name);
          const url = iconUrl(name, tid);
          img.src = '';
          img.src = url;
        });
      } catch {}
    };
    window.addEventListener('pageshow', reapplyBrokenIcons);
    window.addEventListener('load',     reapplyBrokenIcons);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reapplyBrokenIcons();
    });

    const ICON_CATALOG = [
      { id:'profile',        label:'My Profile',         link:'https://www.neopets.com/settings/profile/' },
      { id:'neopass',        label:'My NeoPass',         link:'https://account.neopets.com/' },
      { id:'petcentral',     icon:'mypets',         label:'My Pets',            link:'https://www.neopets.com/home/index.phtml' },
      { id:'customise',      label:'Customise',          link:'https://www.neopets.com/customise/' },
      { id:'stylingchamber', icon:'chamber',        label:'Styling Chamber',    link:'https://www.neopets.com/stylingchamber/' },
      { id:'createpet',      label:'Create a Pet',       link:'https://www.neopets.com/reg/page4.phtml' },
      { id:'adopt',          icon:'adoptpet',       label:'Adopt a Pet',        link:'https://www.neopets.com/pound/' },
      { id:'inventory',      label:'Inventory',          link:'https://www.neopets.com/inventory.phtml' },
      { id:'sdb',            icon:'safetydeposit',  label:'Safety Deposit Box', link:'https://www.neopets.com/safetydeposit.phtml' },
      { id:'quickstock',     label:'Quick Stock',        link:'https://www.neopets.com/quickstock.phtml' },
      { id:'transferlog',    label:'Item Transfer Log',  link:'https://www.neopets.com/items/transfer_list.phtml' },
      { id:'gallery',        label:'Gallery',            link:'https://www.neopets.com/gallery/index.phtml' },
      { id:'stamps',         label:'Stamps',             link:'https://www.neopets.com/stamps.phtml?type=album' },
      { id:'tcg',            icon:'tradingcards',   label:'Trading Cards',      link:'https://www.neopets.com/tcg/album.phtml' },
      { id:'ncalbum',        label:'NC Mall Album',      link:'https://www.neopets.com/ncma/' },
      { id:'bookshelf',      label:'Archived Books',     link:'https://www.neopets.com/bookshelf/archive-bookshelf.phtml' },
      { id:'settings',       label:'Settings',           link:'https://www.neopets.com/settings/' },
      { id:'signout',        label:'Sign Out',           link:'https://www.neopets.com/logout.phtml' },
      { id:'shopwizard',     label:'Shop Wizard',        link:'https://www.neopets.com/shops/wizard.phtml',
        fixedSrc:'https://images.neopets.com/themes/h5/basic/images/shopwizard-icon.png' },
      { id:'ssw',            label:'Super Shop Wizard (premium)', link:'https://www.neopets.com/shops/wizard.phtml',
        fixedSrc:'https://images.neopets.com/premium/shopwizard/ssw-icon.svg', premiumSSW:true },
    ];
    const CATALOG_BY_ID = Object.fromEntries(ICON_CATALOG.map(it => [it.id, it]));

    const DEFAULT_CFG = {
      left:  ['customise', 'stylingchamber', 'settings'],
      right: ['inventory', 'quickstock', 'sdb', 'shopwizard'],
    };
    const LS_BTNS_KEY = 'npqol_side_btns_v2';

    function resolveItem(entry){
      if (typeof entry === 'string'){
        return CATALOG_BY_ID[entry] || null;
      }
      if (entry && typeof entry === 'object' && entry.id && entry.link){
        const base = CATALOG_BY_ID[entry.id] || {};
        return { ...base, ...entry };
      }
      return null;
    }
    function loadConfig(){
      try {
        const raw = localStorage.getItem(LS_BTNS_KEY);
        if (raw){
          const j = JSON.parse(raw);
          return {
            left:  (j.left  || []).map(resolveItem).filter(Boolean),
            right: (j.right || []).map(resolveItem).filter(Boolean),
          };
        }
      } catch {}
      return {
        left:  DEFAULT_CFG.left.map(id => CATALOG_BY_ID[id]).filter(Boolean),
        right: DEFAULT_CFG.right.map(id => CATALOG_BY_ID[id]).filter(Boolean),
      };
    }
    function saveConfig(cfg){
      try { localStorage.setItem(LS_BTNS_KEY, JSON.stringify(cfg)); } catch {}
    }

    const COL_OFFSET_LS = 'npqol_col_offset_v1';
    const COL_OFFSET_MIN = -60, COL_OFFSET_MAX = 300, COL_OFFSET_STEP = 6;
    function getColOffset(){
      try {
        const v = parseInt(localStorage.getItem(COL_OFFSET_LS) || '', 10);
        if (Number.isFinite(v)) return Math.max(COL_OFFSET_MIN, Math.min(COL_OFFSET_MAX, v));
      } catch {}
      return 0;
    }
    function setColOffset(v){
      v = Math.max(COL_OFFSET_MIN, Math.min(COL_OFFSET_MAX, Math.round(v)));
      try { localStorage.setItem(COL_OFFSET_LS, String(v)); } catch {}
      applyColOffset(v);
      return v;
    }
    function applyColOffset(v){
      try { document.documentElement.style.setProperty('--np-side-col-offset', v + 'px'); } catch {}
    }
    applyColOffset(getColOffset());

    const ICON_SIZE_LS = 'npqol_side_icon_size_v1';
    const ICON_SIZE_MIN = 36, ICON_SIZE_MAX = 84, ICON_SIZE_STEP = 6, ICON_SIZE_DEFAULT = 60;
    function getIconSize(){
      try {
        const v = parseInt(localStorage.getItem(ICON_SIZE_LS) || '', 10);
        if (Number.isFinite(v)) return Math.max(ICON_SIZE_MIN, Math.min(ICON_SIZE_MAX, v));
      } catch {}
      return ICON_SIZE_DEFAULT;
    }
    function applyIconSize(v){
      try { document.documentElement.style.setProperty('--np-side-icon-size', v + 'px'); } catch {}
    }
    function setIconSize(v){
      v = Math.max(ICON_SIZE_MIN, Math.min(ICON_SIZE_MAX, Math.round(v)));
      try { localStorage.setItem(ICON_SIZE_LS, String(v)); } catch {}
      applyIconSize(v);
      return v;
    }
    applyIconSize(getIconSize());

    const st = document.createElement('style');
    st.textContent = `
      #btnOverlay{
        position:fixed !important; inset:0 !important;
        z-index:calc(var(--np-z-hud, 1000) + 2) !important;
        pointer-events:none !important;
        --frame-left: max(
          calc((100vw - var(--np-frame-width, 1100px)) / 2),
          var(--np-frame-shift, 0px)
        ) !important;
        --frame-right: calc(var(--frame-left) + var(--np-frame-width, 1100px)) !important;
      }
      #btnOverlay .center{ display:contents !important; }
      #btnOverlay .col{
        position:absolute !important;
        top:50% !important;
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        gap:14px !important;
        pointer-events:none !important;
        flex-wrap:wrap !important;
        max-height:calc(100vh - 96px) !important;
        align-content:center !important;
        transform: translate(-50%, calc(-50% + var(--np-side-col-shift, 0px))) !important;
      }
      #btnOverlay .col .iconBtn{ pointer-events:auto !important; }
      #btnOverlay .col.left{ left: calc(var(--frame-left) - var(--np-side-col-offset, 0px)) !important; }
      #btnOverlay .col.right{ left: calc(var(--frame-right) + var(--np-side-col-offset, 0px)) !important; }

      #btnOverlay[data-mode="single"] .col.right,
      #btnOverlay[data-mode="row"] .col.right{ display:none !important; }

      #btnOverlay[data-mode="single"] .col.left{
        left: calc(var(--frame-left) + var(--np-side-col-x, 0px)) !important;
      }
      #btnOverlay[data-mode="single"][data-side="right"] .col.left{
        left: calc(var(--frame-right) + var(--np-side-col-x, 0px)) !important;
      }

      #btnOverlay[data-mode="row"] .col.left{
        flex-direction:row !important;
        flex-wrap:wrap !important;
        justify-content:center !important;
        width:max-content !important;
        --row-center: calc((var(--frame-left) + min(var(--frame-right), 100vw)) / 2 + var(--np-side-col-x, 0px));
        max-width:min(94vw, calc(2 * min(var(--row-center), 100vw - var(--row-center)) - 8px)) !important;
        left: var(--row-center) !important;
        top: 76px !important;
        transform: translate(-50%, var(--np-side-col-shift, 0px)) !important;
      }
      #btnOverlay .iconBtn{ display:inline-block !important; text-decoration:none !important; background:transparent !important; border:none !important; box-shadow:none !important; padding:0 !important; margin:0 !important; line-height:0 !important; -webkit-tap-highlight-color:transparent; opacity:1 !important; visibility:visible !important; }
      #btnOverlay .iconBtn img{ width:var(--np-side-icon-size, 60px) !important; height:var(--np-side-icon-size, 60px) !important; max-width:none !important; display:block !important; transform:scale(1); transition:transform .12s ease; will-change:transform; transform-origin:center center; filter:drop-shadow(0 1px 4px rgba(0,0,0,.45)); opacity:1 !important; visibility:visible !important; }
      #btnOverlay .iconBtn:hover img{ transform:scale(1.08) !important; }
      #btnOverlay .iconBtn:active img{ transform:scale(1.02) !important; }

    `;
    (document.head || document.documentElement).appendChild(st);

    const overlay = document.createElement('div'); overlay.id = 'btnOverlay';
    const center = document.createElement('div'); center.className = 'center';
    const leftCol = document.createElement('div'); leftCol.className = 'col left';
    const rightCol = document.createElement('div'); rightCol.className = 'col right';
    center.append(leftCol, rightCol);
    overlay.appendChild(center);

    function tryOpenSSW(){
      const openers = ['#sswmenu .imgmenu', '#sswmenu img', '#sswmenu', '.navsub-ssw-icon__2020', '#ssw-tab-button'];
      for (const sel of openers){
        const el = document.querySelector(sel);
        if (el){ try { el.click(); return true; } catch {} }
      }
      const panel = document.querySelector('#ssw__2020, #ssw_tabs_pane');
      if (panel){
        panel.style.display = 'block';
        try { panel.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch {}
        return true;
      }
      return false;
    }

    const makeBtn = (iconName, href, themeId, fixedSrc, item) => {
      const a = document.createElement('a');
      a.className='iconBtn'; a.href=href; a.target='_self'; a.rel='noopener';
      if (item && item.premiumSSW){
        a.title = 'Super Shop Wizard (premium) — falls back to the Shop Wizard';
        a.addEventListener('click', (e) => {
          if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
          if (tryOpenSSW()){ e.preventDefault(); e.stopPropagation(); }
        });
      }
      const img = new Image();
      img.decoding='async'; img.loading='eager';
      if (fixedSrc){
        img.src = fixedSrc;
      } else {
        img.dataset.icon = iconName;
        attachIconFallback(img, iconName);
        img.src = iconUrl(iconName, themeId);
      }
      a.appendChild(img);
      return a;
    };

    const LAYOUT_LS = 'npqol_side_layout_v1';
    const SIDE_LS   = 'npqol_side_side_v1';
    const SHIFT_LS  = 'npqol_side_shift_v1';
    const XPOS_LS   = 'npqol_side_x_v1';
    const LAYOUTS = ['cols', 'single', 'row'];
    const SHIFT_MIN = -400, SHIFT_MAX = 400, SHIFT_STEP = 10;
    const XPOS_MIN = -700, XPOS_MAX = 700, XPOS_STEP = 6;
    const ROW_TOP = 76, FRAME_TOP = 100, DROP_MAX = 360;
    function getLayout(){
      try { const v = localStorage.getItem(LAYOUT_LS); if (LAYOUTS.indexOf(v) >= 0) return v; } catch {}
      return 'cols';
    }
    function getSide(){
      try { return localStorage.getItem(SIDE_LS) === 'right' ? 'right' : 'left'; } catch {}
      return 'left';
    }
    function getColShift(){
      try {
        const v = parseInt(localStorage.getItem(SHIFT_LS) || '', 10);
        if (Number.isFinite(v)) return Math.max(SHIFT_MIN, Math.min(SHIFT_MAX, v));
      } catch {}
      return 0;
    }
    function getColX(){
      try {
        const v = parseInt(localStorage.getItem(XPOS_LS) || '', 10);
        if (Number.isFinite(v)) return Math.max(XPOS_MIN, Math.min(XPOS_MAX, v));
      } catch {}
      return 0;
    }
    function syncContentDrop(){
      const rs = document.documentElement.style;
      if (getLayout() !== 'row'){ rs.setProperty('--np-content-drop', '0px'); return; }
      const h = leftCol.offsetHeight || 0;
      if (!h){ rs.setProperty('--np-content-drop', '0px'); return; }
      const bottom = ROW_TOP + getColShift() + h + 14;
      const drop = Math.max(0, Math.min(DROP_MAX, Math.round(bottom - FRAME_TOP)));
      rs.setProperty('--np-content-drop', drop + 'px');
    }
    function applyLayout(){
      try {
        overlay.dataset.mode = getLayout();
        overlay.dataset.side = getSide();
        const rs = document.documentElement.style;
        rs.setProperty('--np-side-col-shift', getColShift() + 'px');
        rs.setProperty('--np-side-col-x', getColX() + 'px');
      } catch {}
      try { requestAnimationFrame(syncContentDrop); } catch { syncContentDrop(); }
    }
    function setLayout(v){
      if (LAYOUTS.indexOf(v) < 0) v = 'cols';
      try { localStorage.setItem(LAYOUT_LS, v); } catch {}
      applyLayout(); rebuildColumns();
      return v;
    }
    function setSide(v){
      v = (v === 'right') ? 'right' : 'left';
      try { localStorage.setItem(SIDE_LS, v); } catch {}
      applyLayout();
      return v;
    }
    function setColShift(v){
      v = Math.max(SHIFT_MIN, Math.min(SHIFT_MAX, Math.round(v)));
      try { localStorage.setItem(SHIFT_LS, String(v)); } catch {}
      applyLayout();
      return v;
    }
    function setColX(v){
      v = Math.max(XPOS_MIN, Math.min(XPOS_MAX, Math.round(v)));
      try { localStorage.setItem(XPOS_LS, String(v)); } catch {}
      applyLayout();
      return v;
    }
    let dropT = 0;
    window.addEventListener('resize', () => {
      clearTimeout(dropT);
      dropT = setTimeout(syncContentDrop, 120);
    });

    function rebuildColumns(){
      const cfg = loadConfig();
      const t = getTheme();
      leftCol.innerHTML = '';
      rightCol.innerHTML = '';
      const first  = (getLayout() === 'cols') ? cfg.left  : [...cfg.left, ...cfg.right];
      const second = (getLayout() === 'cols') ? cfg.right : [];
      first .forEach(it => leftCol .appendChild(makeBtn(it.icon || it.id, it.link, t, it.fixedSrc, it)));
      second.forEach(it => rightCol.appendChild(makeBtn(it.icon || it.id, it.link, t, it.fixedSrc, it)));
      try { requestAnimationFrame(syncContentDrop); } catch { syncContentDrop(); }
    }
    applyLayout();
    rebuildColumns();

    const mountOv = () => { if (!document.body) return false; if (!overlay.isConnected) document.body.appendChild(overlay); return true; };
    let bodyObs = null;
    const watchBody = () => {
      if (bodyObs || !document.body) return;
      bodyObs = new MutationObserver(() => { if (!overlay.isConnected) document.body.appendChild(overlay); });
      bodyObs.observe(document.body, { childList: true });
    };
    if (mountOv()) watchBody();
    else new MutationObserver((_, o) => { if (mountOv()){ watchBody(); o.disconnect(); } }).observe(document.documentElement, { childList:true, subtree:true });

    NQ.sideBtns = {
      catalog: ICON_CATALOG,
      catalogById: CATALOG_BY_ID,
      defaults: DEFAULT_CFG,
      load: loadConfig,
      save: (cfg) => { saveConfig(cfg); rebuildColumns(); },
      reset: () => { try { localStorage.removeItem(LS_BTNS_KEY); } catch {}; rebuildColumns(); },
      rebuild: rebuildColumns,
      iconUrl, fallbackUrl, getTheme,
      getColOffset, setColOffset,
      colOffsetStep: COL_OFFSET_STEP,
      getIconSize, setIconSize,
      iconSizeStep: ICON_SIZE_STEP,
      iconSizeDefault: ICON_SIZE_DEFAULT,
      getLayout, setLayout, getSide, setSide,
      getColShift, setColShift,
      getColX, setColX,
      colShiftStep: SHIFT_STEP,
      colXStep: XPOS_STEP,
      layouts: LAYOUTS,
    };
  })();

  (function sideBtnEditor(){
    if (document.getElementById('npxSideBtnHost')) return;
    const API = NQ.sideBtns;
    if (!API) return;

    const TAB_W = 96, TAB_H = 22;
    const PANEL_W = 720, PANEL_H = 470;

    const host = document.createElement('div');
    host.id = 'npxSideBtnHost';
    Object.assign(host.style, {
      position:'fixed', left:'0', right:'0', bottom:'0',
      zIndex: 'calc(var(--np-z-hud, 1000) + 3)',
      pointerEvents:'none',
    });
    const root = host.attachShadow({ mode:'open' });

    const css = document.createElement('style');
    css.textContent = `
      :host, :host * { box-sizing:border-box; font-family: var(--np-font, system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif); }

      .tab{
        position:absolute; left:50%; bottom:0; transform:translateX(-50%);
        width:${TAB_W}px; height:${TAB_H}px;
        background: var(--np-glass, rgba(0,0,0,.45));
        backdrop-filter: blur(var(--np-blur, 8px));
        -webkit-backdrop-filter: blur(var(--np-blur, 8px));
        border:1px solid var(--np-line, rgba(255,255,255,.18));
        border-bottom:0;
        border-radius:12px 12px 0 0;
        color: #fff;
        font:700 14px/1 system-ui,sans-serif;
        display:flex; align-items:center; justify-content:center;
        cursor:pointer; pointer-events:auto;
        box-shadow: none;
        transition: background .12s ease;
      }
      .tab:hover{ background: rgba(20,14,32,.7); }
      .tab span{ transform: translateY(-1px); display:inline-block; }

      .panel{
        position:absolute; left:50%; bottom:${TAB_H}px;
        transform:translateX(-50%) translateY(${PANEL_H + 40}px);
        width:${PANEL_W}px; max-width:96vw;
        height:min(${PANEL_H}px, 78vh);
        background:rgba(20,14,32,.96);
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        border:1px solid var(--np-line, rgba(255,255,255,.16));
        border-radius:14px 14px 0 0;
        color:#fff; pointer-events:auto;
        box-shadow:none;
        transition: transform .22s cubic-bezier(.2,.7,.2,1), box-shadow .12s ease;
        display:flex; flex-direction:column;
      }
      .panel.open{
        transform:translateX(-50%) translateY(0);
        box-shadow:0 -14px 40px rgba(0,0,0,.55);
      }

      .head{
        display:flex; align-items:center; justify-content:flex-end;
        gap:6px; padding:6px 8px 4px;
        flex-wrap:wrap;
      }
      .head button{
        background:rgba(255,255,255,.06); color:rgba(255,255,255,.8);
        border:1px solid rgba(255,255,255,.14); border-radius:6px;
        padding:3px 8px; font:600 10px/1 system-ui,sans-serif; cursor:pointer;
        letter-spacing:.04em; text-transform:uppercase;
      }
      .head button:hover{ background:var(--np-accent-bg); border-color:var(--np-accent-line); color:#fff; }
      .head .close{ background:transparent; border:0; color:rgba(255,255,255,.65); font-size:16px; padding:0 6px; }
      .head .close:hover{ color:#fff; }
      .head .grp{
        display:flex; align-items:center; gap:3px;
        padding:3px 7px;
        border-radius:9px;
        background:rgba(255,255,255,.035);
        border:1px solid rgba(255,255,255,.08);
      }
      .head .grp:last-of-type{ margin-right:auto; }
      .head .grpLbl{
        font:700 9px/1 system-ui,sans-serif;
        color:rgba(255,255,255,.5);
        letter-spacing:.06em; text-transform:uppercase;
        margin-right:3px;
      }
      .head .stepBtn{
        width:20px; height:20px; padding:0;
        display:flex; align-items:center; justify-content:center;
        font:700 13px/1 system-ui,sans-serif;
        border-radius:6px;
      }
      .head .stepVal{
        min-width:48px; height:20px; padding:0 2px;
        background:transparent; border:0; border-radius:6px;
        font:700 10px/20px system-ui,sans-serif;
        font-variant-numeric:tabular-nums;
        color:rgba(255,255,255,.9);
        text-transform:none; letter-spacing:0;
        cursor:pointer;
      }
      .head .stepVal:hover{ background:rgba(255,255,255,.12); color:#fff; }
      .head .sideBtn{ width:22px; height:20px; padding:0; font-size:12px; line-height:1; }
      .head .sideBtn[hidden]{ display:none; }

      .modeSeg{
        display:flex; gap:2px; padding:2px;
        border-radius:7px;
        background:rgba(0,0,0,.28);
        border:1px solid rgba(255,255,255,.10);
      }
      .modeSeg .modeBtn{
        display:flex; align-items:center; justify-content:center;
        width:28px; height:20px; padding:0;
        border:0; border-radius:5px;
        background:transparent; color:rgba(255,255,255,.55);
        cursor:pointer;
        transition:background .12s ease, color .12s ease, box-shadow .12s ease;
      }
      .modeSeg .modeBtn:hover{
        background:rgba(255,255,255,.10);
        border-color:transparent;
        color:#fff;
      }
      .modeSeg .modeBtn.isOn{
        background:var(--np-accent-bg, rgba(220,184,255,.14));
        color:var(--np-accent, #dcb8ff);
        box-shadow:inset 0 0 0 1px var(--np-accent-line, rgba(220,184,255,.45));
      }
      .modeSeg .modeBtn svg{ display:block; }

      .modeNote{
        grid-column:1 / -1;
        margin:0 0 2px;
        padding:6px 9px;
        border-radius:8px;
        background:var(--np-accent-bg, rgba(220,184,255,.12));
        border:1px solid var(--np-accent-line, rgba(220,184,255,.35));
        font:600 10px/1.35 system-ui,sans-serif;
        color:rgba(255,255,255,.82);
      }
      .modeNote[hidden]{ display:none; }

      .body{
        flex:1 1 auto; min-height:0;
        overflow-y:auto; overflow-x:hidden;
        display:grid; grid-template-columns: 1fr 1fr; gap:10px;
        padding:4px 12px 12px;
      }
      .col{
        display:flex; flex-direction:column;
        background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08);
        border-radius:10px; padding:8px; min-height:0;
      }
      .items{ display:flex; flex-direction:column; gap:4px; min-height:60px; }
      .item{
        display:grid; grid-template-columns: 28px minmax(0, 1fr) auto auto auto; gap:8px;
        align-items:center;
        padding:6px 8px; border-radius:7px;
        background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.06);
      }
      .item:hover{ background:var(--np-accent-soft); }
      .item .ico{ width:24px; height:24px; background:center/contain no-repeat; filter:drop-shadow(0 1px 2px rgba(0,0,0,.6)); }
      .item .lbl{ min-width:0; font-size:12px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .iconBtnMini{
        width:22px; height:22px; padding:0; border:0;
        background:rgba(255,255,255,.06); color:rgba(255,255,255,.75);
        border-radius:5px; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        font:700 12px/1 system-ui,sans-serif;
      }
      .iconBtnMini:hover{ background:var(--np-accent-bg); color:#fff; }
      .iconBtnMini.dim{ opacity:.55; }
      .iconBtnMini.dim:hover{ opacity:1; }
      .iconBtnMini.del:hover{ background:#ff5a5a; color:#fff; }

      .add{
        margin-top:8px; display:flex; flex-direction:column; gap:6px;
      }
      .add select{
        background:rgba(0,0,0,.35); color:#fff;
        border:1px solid rgba(255,255,255,.16); border-radius:6px;
        padding:5px 8px; font-size:12px; outline:none;
      }
      .add .row{ display:flex; gap:6px; }
      .add .row > *{ flex:1; min-width:0; }
      .add button{
        background:var(--np-accent-bg); color:#fff;
        border:1px solid var(--np-accent-line); border-radius:6px;
        padding:5px 10px; font:700 11px/1 system-ui,sans-serif; cursor:pointer;
        white-space:nowrap; letter-spacing:.08em;
      }
      .add button:hover{ background:var(--np-accent-hover); }

      @media (max-width: 820px){
        .body{ grid-template-columns: 1fr; }
      }
    `;
    root.appendChild(css);

    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.title = 'Customize the side buttons';
    tab.innerHTML = `<span>˄</span>`;
    root.appendChild(tab);

    const SVG_COLS = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
      '<rect x="4.6" y="2.5" width="6.8" height="11" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".5"/>' +
      '<line x1="2" y1="4.5" x2="2" y2="11.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>' +
      '<line x1="14" y1="4.5" x2="14" y2="11.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
    const SVG_SINGLE = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
      '<rect x="5.4" y="2.5" width="8.1" height="11" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".5"/>' +
      '<line x1="2.4" y1="4.5" x2="2.4" y2="11.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
    const SVG_ROW = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">' +
      '<rect x="2.5" y="5.4" width="11" height="8.1" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".5"/>' +
      '<line x1="4.5" y1="2.6" x2="11.5" y2="2.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="head">
        <div class="grp" title="Icon layout — two columns, one vertical column, or one horizontal row">
          <span class="grpLbl">Layout</span>
          <div class="modeSeg" id="modeSeg">
            <button type="button" class="modeBtn" data-layout="cols" title="Two columns, one on each side of the content">${SVG_COLS}</button>
            <button type="button" class="modeBtn" data-layout="single" title="One vertical column">${SVG_SINGLE}</button>
            <button type="button" class="modeBtn" data-layout="row" title="One horizontal row above the content">${SVG_ROW}</button>
          </div>
          <button type="button" class="sideBtn" id="sideFlip" title="Put the column on the other side of the content">⇄</button>
        </div>
        <div class="grp">
          <span class="grpLbl" id="posLbl">Spread</span>
          <button type="button" class="stepBtn" data-k="pos" data-d="-1" id="posDown">−</button>
          <button type="button" class="stepVal" id="posVal" title="Click to reset">0px</button>
          <button type="button" class="stepBtn" data-k="pos" data-d="1" id="posUp">+</button>
        </div>
        <div class="grp" title="Move the icons up or down">
          <span class="grpLbl">Height</span>
          <button type="button" class="stepBtn" data-k="hgt" data-d="-1" title="Move the icons up">−</button>
          <button type="button" class="stepVal" id="hgtVal" title="Click to reset">0px</button>
          <button type="button" class="stepBtn" data-k="hgt" data-d="1" title="Move the icons down">+</button>
        </div>
        <div class="grp" title="Shortcut icon size">
          <span class="grpLbl">Size</span>
          <button type="button" class="stepBtn" data-k="siz" data-d="-1" title="Smaller icons">−</button>
          <button type="button" class="stepVal" id="sizVal" title="Click to reset">60px</button>
          <button type="button" class="stepBtn" data-k="siz" data-d="1" title="Bigger icons">+</button>
        </div>
        <button type="button" id="resetBtn" title="Restore the default config">Reset</button>
        <button type="button" class="close" id="closeBtn" aria-label="Close">×</button>
      </div>
      <div class="body">
        <div class="modeNote" id="modeNote" hidden>Both lists are shown as one strip in this layout — left list first, then right. Your two-column setup is kept and comes back untouched when you switch to ▮▮.</div>
        <div class="col" data-side="left">
          <div class="items" id="itemsLeft"></div>
          <div class="add">
            <div class="row">
              <select id="addSelLeft"></select>
              <button type="button" data-add="left">ADD</button>
            </div>
          </div>
        </div>
        <div class="col" data-side="right">
          <div class="items" id="itemsRight"></div>
          <div class="add">
            <div class="row">
              <select id="addSelRight"></select>
              <button type="button" data-add="right">ADD</button>
            </div>
          </div>
        </div>
      </div>
    `;
    root.appendChild(panel);

    const esc = (s) => String(s||'').replace(/[&<>"']/g, c => (
      { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
    ));
    function iconPreviewUrl(item){
      if (item.fixedSrc) return item.fixedSrc;
      return API.iconUrl(item.icon || item.id, API.getTheme());
    }
    function paint(){
      const cfg = API.load();
      const itemsLeft  = panel.querySelector('#itemsLeft');
      const itemsRight = panel.querySelector('#itemsRight');
      const render = (arr, side) => arr.map((it, i) => `
        <div class="item" data-side="${side}" data-idx="${i}" title="${esc(it.link)}">
          <div class="ico" style="background-image:url('${esc(iconPreviewUrl(it))}')"></div>
          <div class="lbl">${esc(it.label || it.id)}</div>
          <button type="button" class="iconBtnMini dim" data-act="up"    title="Move up">▲</button>
          <button type="button" class="iconBtnMini dim" data-act="swap"  title="${side==='left'?'Move to right':'Move to left'}">${side==='left'?'→':'←'}</button>
          <button type="button" class="iconBtnMini del"  data-act="del"   title="Remove">🗑</button>
        </div>
      `).join('');
      itemsLeft.innerHTML  = render(cfg.left, 'left')   || `<div style="opacity:.5;font-size:12px;text-align:center;padding:14px">(empty)</div>`;
      itemsRight.innerHTML = render(cfg.right, 'right') || `<div style="opacity:.5;font-size:12px;text-align:center;padding:14px">(empty)</div>`;

      const usedIds = new Set([...cfg.left, ...cfg.right].map(it => it.id));
      const opts = API.catalog
        .filter(it => !usedIds.has(it.id))
        .map(it => `<option value="${esc(it.id)}">${esc(it.label)}</option>`)
        .join('') || `<option value="" disabled>(everything is placed)</option>`;
      panel.querySelector('#addSelLeft').innerHTML  = opts;
      panel.querySelector('#addSelRight').innerHTML = opts;
    }

    let open = false;
    function setOpen(o){
      open = !!o;
      panel.classList.toggle('open', open);
      if (open) paint();
    }
    tab.addEventListener('click', () => setOpen(!open));
    panel.querySelector('#closeBtn').addEventListener('click', () => setOpen(false));
    panel.querySelector('#resetBtn').addEventListener('click', () => {
      if (confirm('Restore the default config?')){
        API.reset();
        paint();
      }
    });

    (function wireToolbar(){
      const seg  = panel.querySelector('#modeSeg');
      const note = panel.querySelector('#modeNote');
      const flip = panel.querySelector('#sideFlip');
      const posLbl = panel.querySelector('#posLbl');
      const els = {
        pos: panel.querySelector('#posVal'),
        hgt: panel.querySelector('#hgtVal'),
        siz: panel.querySelector('#sizVal'),
      };
      if (!seg || typeof API.setLayout !== 'function') return;

      const isCols = () => API.getLayout() === 'cols';
      const signed = (v) => (v > 0 ? '+' : '') + v + 'px';
      const CTL = {
        pos: {
          get:  () => isCols() ? API.getColOffset() : API.getColX(),
          set:  (v) => isCols() ? API.setColOffset(v) : API.setColX(v),
          step: () => isCols() ? (API.colOffsetStep || 6) : (API.colXStep || 6),
          zero: 0,
          text: (v) => signed(v),
        },
        hgt: {
          get: () => API.getColShift(), set: (v) => API.setColShift(v),
          step: () => API.colShiftStep || 10, zero: 0, text: (v) => signed(v),
        },
        siz: {
          get: () => API.getIconSize(), set: (v) => API.setIconSize(v),
          step: () => API.iconSizeStep || 6, zero: API.iconSizeDefault || 60,
          text: (v) => v + 'px',
        },
      };

      const paint = () => {
        const mode = API.getLayout();
        seg.querySelectorAll('.modeBtn').forEach(b => b.classList.toggle('isOn', b.dataset.layout === mode));
        if (note) note.hidden = (mode === 'cols');
        if (flip){
          flip.hidden = (mode !== 'single');
          flip.title = (API.getSide() === 'right')
            ? 'Column is on the right — click to move it left'
            : 'Column is on the left — click to move it right';
        }
        if (posLbl) posLbl.textContent = isCols() ? 'Spread' : 'Position';
        const posDown = panel.querySelector('#posDown'), posUp = panel.querySelector('#posUp');
        if (posDown) posDown.title = isCols() ? 'Bring the columns closer' : 'Move the icons left';
        if (posUp)   posUp.title   = isCols() ? 'Push the columns apart'   : 'Move the icons right';
        Object.keys(CTL).forEach(k => { if (els[k]) els[k].textContent = CTL[k].text(CTL[k].get()); });
      };
      paint();

      seg.addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('.modeBtn');
        if (!b) return;
        API.setLayout(b.dataset.layout);
        paint();
      });
      if (flip) flip.addEventListener('click', () => {
        API.setSide(API.getSide() === 'right' ? 'left' : 'right');
        paint();
      });
      panel.querySelector('.head').addEventListener('click', (e) => {
        const t = e.target.closest && e.target.closest('.stepBtn, .stepVal');
        if (!t) return;
        if (t.classList.contains('stepVal')){
          const k = t.id.slice(0, 3);
          if (CTL[k]) CTL[k].set(CTL[k].zero);
        } else {
          const k = t.dataset.k, d = +t.dataset.d || 0;
          if (CTL[k]) CTL[k].set(CTL[k].get() + d * CTL[k].step());
        }
        paint();
      });
    })();

    panel.addEventListener('click', (e) => {
      const t = e.target;
      const addBtn = t.closest('button[data-add]');
      if (addBtn){
        const side = addBtn.dataset.add;
        const sel  = panel.querySelector(side === 'left' ? '#addSelLeft' : '#addSelRight');
        const id   = sel.value;
        if (!id) return;
        const item = API.catalogById[id]; if (!item) return;
        const cfg = API.load();
        cfg[side] = [...cfg[side], { id: item.id, icon: item.icon, label: item.label, link: item.link, fixedSrc: item.fixedSrc }];
        API.save(cfg); paint();
        return;
      }
      const itemEl = t.closest('.item');
      const actBtn = t.closest('button[data-act]');
      if (itemEl && actBtn){
        const side = itemEl.dataset.side;
        const idx  = +itemEl.dataset.idx;
        const act  = actBtn.dataset.act;
        const cfg  = API.load();
        const arr  = cfg[side];
        if (act === 'del'){
          arr.splice(idx, 1);
        } else if (act === 'up'){
          if (idx > 0){ const [it] = arr.splice(idx, 1); arr.splice(idx - 1, 0, it); }
          else if (arr.length > 1){ const [it] = arr.splice(0, 1); arr.push(it); }
        } else if (act === 'swap'){
          const other = side === 'left' ? 'right' : 'left';
          const [it]  = arr.splice(idx, 1);
          cfg[other]  = [...cfg[other], it];
        }
        API.save(cfg); paint();
        return;
      }
    });

    document.addEventListener('pointerdown', (ev) => {
      if (!open) return;
      const path = ev.composedPath ? ev.composedPath() : [];
      if (path.some(n => n === tab || n === panel)) return;
      setOpen(false);
    }, true);

    NQ.onBtnTheme(() => { if (open) paint(); });

    (function mount(){
      if (document.body) document.body.appendChild(host);
      else new MutationObserver((_, o) => { if (document.body){ document.body.appendChild(host); o.disconnect(); } })
            .observe(document.documentElement, { childList:true, subtree:true });
    })();
  })();

})();

(() => {
  'use strict';
  if (document.documentElement.dataset.npBgBoot === '1') return;
  document.documentElement.dataset.npBgBoot = '1';

  const W = PW;

  const LEFT_BAR_PX = 330;
  const TOP_BAR_PX  = 0;

  const LS = {
    mainBgId:  'npqol_bg_main_v3',
    leftBarBg: 'npqol_bg_left_v3',
    recolor:   'npqol_recolor_site_v1',
    topbarBg:  'npqol_topbar_bg_v1',
  };
  ['npqol_dti_bgs_v6', 'npqol_bg_favs_v1', 'npqol_bg_hidden_v1', 'npqol_inv_menubar_v1'].forEach(k => { try { localStorage.removeItem(k); } catch {} });

  const BG_COLOR = '#000';

  const UI_Z = 2147483000;
  const HANDLE_W = 20;
  const HANDLE_H = 90;
  const SIDEBAR_W = 320;

  const safeUrl = (u) => String(u || '').replace(/["\\\n\r]/g, '');
  const LSget = (k, fallback = '') => { try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; } };
  const LSset = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };

  function applyMainBg(url){
    if (!url){
      document.documentElement.style.setProperty('--npWallImage', 'none');
      document.documentElement.style.setProperty('--npMainSolid', 'transparent');
      return;
    }
    document.documentElement.style.setProperty('--npMainSolid', BG_COLOR);
    document.documentElement.style.setProperty('--npWallImage', `url("${safeUrl(url)}")`);
  }
  function applyLeftBg(url){
    if (!url){
      document.documentElement.style.setProperty('--npLeftBarImg', 'none');
      document.documentElement.style.setProperty('--npLeftBarSolid', 'transparent');
      document.documentElement.style.setProperty('--npLeftBarShadeA', '0');
      return;
    }
    document.documentElement.style.setProperty('--npLeftBarImg', `url("${safeUrl(url)}")`);
    document.documentElement.style.setProperty('--npLeftBarSolid', '#000');
    document.documentElement.style.setProperty('--npLeftBarShadeA', '1');
  }

  applyMainBg(LSget(LS.mainBgId, ''));
  applyLeftBg(LSget(LS.leftBarBg, ''));

  function pageClass(){
    const p = location.pathname.toLowerCase();
    if (p.includes('/inventory.phtml'))     return 'np-page-inventory';
    if (p.includes('/safetydeposit.phtml')) return 'np-page-sdb';
    if (p.includes('/shop.phtml') || p.includes('/market.phtml')) return 'np-page-shop';
    if (p.includes('/quickstock.phtml'))    return 'np-page-quickstock';
    return '';
  }
  const _pc = pageClass();
  if (_pc) document.documentElement.classList.add(_pc);
  document.documentElement.classList.toggle('np-recolor-site', LSget(LS.recolor, '0') === '1');

  const style = document.createElement('style');
  style.textContent = `
    :root{
      --npWallImage:none;
      --npMainSolid:${BG_COLOR};

      --npLeftBarImg:none;
      --npLeftBarSolid:#000;
      --npLeftBarShadeA:1;
    }

    html,body{
      background:transparent!important;
      background-image:none!important;
    }

    :root::before{
      content:"";
      position:fixed;
      inset:${TOP_BAR_PX}px 0 0 var(--np-col-width, ${LEFT_BAR_PX}px);
      z-index:-2147483647;
      pointer-events:none;

      background-color:var(--npMainSolid)!important;
      background-image:var(--npWallImage) !important;
      background-repeat:no-repeat!important;
      background-position:right top!important;
      background-size:cover!important;
    }

    .nav-top-pattern__2020,.nav-bottom-pattern__2020,.footer-pattern__2020{
      background:transparent!important;
      background-image:none!important;
    }

    #npLeftBar{
      position:fixed!important; top:0; left:0;
      width: var(--np-col-width, ${LEFT_BAR_PX}px); height:100vh;
      z-index:18;
      pointer-events:none;
      overflow:hidden;
      box-sizing:border-box;
      border:2px solid #000;
      background:transparent;
      contain:paint;
      visibility:visible!important;
      opacity:1!important;
    }
    #npLeftBarBg{
      position:absolute; inset:0;
      background-color:var(--npLeftBarSolid);
      background-image:var(--npLeftBarImg);
      background-size:cover;
      background-position:center;
      opacity:1!important;
      visibility:visible!important;
    }
    #npLeftBarShade{
      position:absolute; inset:0;
      background:linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.28));
      opacity:var(--npLeftBarShadeA);
      visibility:visible!important;
    }

    @media (max-width: 900px){
      #npLeftBar{ display:none; }
      :root::before{ inset:${TOP_BAR_PX}px 0 0 0; }
    }

    #npBgHandle{
      position:fixed;
      right:0;
      top:calc(${TOP_BAR_PX}px + (100vh - ${TOP_BAR_PX}px - ${HANDLE_H}px)/2);
      width:${HANDLE_W}px;
      height:${HANDLE_H}px;
      border-radius:12px 0 0 12px;
      background: var(--np-glass, rgba(0,0,0,.45));
      backdrop-filter: blur(var(--np-blur, 8px));
      -webkit-backdrop-filter: blur(var(--np-blur, 8px));
      border:1px solid var(--np-line, rgba(255,255,255,.18));
      border-right:0;
      color:#fff;
      display:flex; align-items:center; justify-content:center;
      font-weight:700; font-size:14px; line-height:1;
      z-index:${UI_Z};
      cursor:pointer;
      pointer-events:auto;
      box-shadow:none;
      user-select:none;
      transition: background .12s ease;
    }
    #npBgHandle:hover{ background: rgba(20,14,32,.7); }
    #npBgHandle span{ transform:translateX(-1px); }

    #npBgSidebar{
      position:fixed;
      right:0;
      top:${TOP_BAR_PX}px;
      width:${SIDEBAR_W}px;
      max-width: min(${SIDEBAR_W}px, 90vw);
      height:calc(100vh - ${TOP_BAR_PX}px);
      background:var(--np-glass, rgba(0,0,0,.22));
      backdrop-filter:blur(var(--np-blur, 8px));
      -webkit-backdrop-filter:blur(var(--np-blur, 8px));
      box-shadow:var(--np-shadow, -2px 0 10px rgba(0,0,0,.28));
      z-index:${UI_Z-2};
      transition:transform .20s ease;
      transform:translateX(100%);
      display:flex;
      flex-direction:column;
      overflow:hidden;
      box-sizing:border-box;
    }

    #npBgBody{
      flex:1 1 auto;
      min-height:0;
      overflow:auto;
      padding:12px;
      box-sizing:border-box;
      scrollbar-width:thin;
      scrollbar-color: rgba(255,255,255,.35) rgba(0,0,0,.12);
    }
    #npBgBody::-webkit-scrollbar{ width:10px; }
    #npBgBody::-webkit-scrollbar-thumb{
      background:rgba(255,255,255,.28);
      border-radius:10px;
      border:2px solid rgba(0,0,0,.12);
    }
    #npBgBody::-webkit-scrollbar-track{ background:rgba(0,0,0,.10); }

    #npBgFooter{
      flex:0 0 auto;
      padding:10px 12px;
      display:flex; gap:8px;
      border-top:1px solid rgba(255,255,255,.18);
      background:rgba(0,0,0,.22);
    }
    .npFooterBtn{
      flex:1;
      border-radius:10px;
      border:1px solid rgba(255,255,255,.32);
      background:rgba(0,0,0,.22);
      color:#fff; font-weight:900;
      padding:10px 8px; cursor:pointer; font-size:12px;
    }
    .npFooterBtn:hover{ filter:brightness(1.08); }
    .npFooterBtn.primary{
      background:var(--np-accent, #dcb8ff);
      color:#1a1330;
      border-color:transparent;
    }

    .npThemeBlock{ margin:0 0 10px 0; }
    .npThemeSelect{
      width:100%;
      height:32px;
      border-radius:8px;
      border:1px solid rgba(255,255,255,.32);
      background:rgba(0,0,0,.22);
      color:#fff; font-weight:700; font-size:12px;
      padding:0 10px;
      cursor:pointer;
      appearance:none;
      -webkit-appearance:none;
      background-image:linear-gradient(45deg, transparent 50%, rgba(255,255,255,.6) 50%),
                       linear-gradient(135deg, rgba(255,255,255,.6) 50%, transparent 50%);
      background-position:calc(100% - 14px) center, calc(100% - 9px) center;
      background-size:5px 5px;
      background-repeat:no-repeat;
    }
    .npThemeSelect:focus{ outline:2px solid var(--np-accent, #dcb8ff); }
    .npThemeSelect option{ background:#1a1330; color:#fff; }

    .npRecolorBlock{ margin:0 0 12px 0; }
    .npRecolorBtn{
      width:100%;
      height:46px;
      border-radius:12px;
      cursor:pointer;
      font-family:"Cafeteria","TP Cafeteria","CafeteriaBlack","Museo Sans Rounded Bold",system-ui,sans-serif;
      font-size:20px;
      font-weight:400;
      background:rgba(255,255,255,.07);
      color:rgba(255,255,255,.42);
      border:1px solid rgba(255,255,255,.16);
      transition:filter .15s ease, transform .1s ease, box-shadow .2s ease, color .2s ease;
    }
    .npRecolorBtn:hover{ filter:brightness(1.1); }
    .npRecolorBtn:active{ transform:translateY(1px); }
    .npRecolorBtn.isOn{
      color:#4a3d55;
      border-color:transparent;
      background:linear-gradient(90deg,
        #ffb8d4, #ffb3ab, #ffce9e, #f0dd7a, #b6e6c1, #a8e0ea, #b6c6ff, #dcb8ff, #ffb8d4);
      background-size:200% 100%;
      animation:npRainbow 10s linear infinite;
      box-shadow:0 3px 14px rgba(0,0,0,.26);
      text-shadow:0 1px 0 rgba(255,255,255,.5);
    }
    @keyframes npRainbow{
      0%{ background-position:0% 50%; }
      100%{ background-position:200% 50%; }
    }
    @media (prefers-reduced-motion: reduce){
      .npRecolorBtn.isOn{ animation:none; }
    }

    .npBgSearch{
      display:flex; gap:6px; padding:2px;
    }
    .npBgSearch input{
      flex:1; min-width:0; height:28px; padding:0 8px;
      border:1px solid rgba(255,255,255,.32);
      background:rgba(0,0,0,.18); color:#fff;
      border-radius:8px; outline:none; font-size:12px;
    }
    .npBgSearch input::placeholder{ color:rgba(255,255,255,.45); }
    .npBgSearch input:focus{ border-color:rgba(255,255,255,.55); }
    .npBgSearch button{
      width:32px; height:28px; padding:0;
      border:1px solid rgba(255,255,255,.32);
      background:rgba(0,0,0,.18); color:#fff;
      border-radius:8px; cursor:pointer; font-size:14px;
    }
    #npBgList{
      display:flex; flex-direction:column; gap:6px; margin-top:8px;
    }
    .npBgItem{
      display:grid; grid-template-columns:44px 1fr auto auto;
      gap:6px; align-items:center;
      padding:4px 6px; border-radius:10px;
      background:rgba(0,0,0,.12);
      border:1px solid rgba(255,255,255,.12);
    }
    .npBgThumb{
      width:44px; height:44px; border-radius:6px;
      background:#fff no-repeat center/cover;
      border:1px solid rgba(255,255,255,.16);
    }
    .npBgName{
      color:rgba(255,255,255,.92); font-size:11px; line-height:1.2;
      overflow:hidden; text-overflow:ellipsis; display:-webkit-box;
      -webkit-line-clamp:2; -webkit-box-orient:vertical; word-break:break-word;
    }
    .npBgBtn{
      width:30px; height:28px; padding:0;
      border:1px solid rgba(255,255,255,.32);
      background:rgba(0,0,0,.20); color:#fff; font-weight:900;
      border-radius:8px; cursor:pointer; font-size:12px;
    }
    .npBgBtn:hover{ filter:brightness(1.08); }
    .npBgBtn.isActive{ outline:2px solid var(--np-accent, #dcb8ff); }
    .npSmall{
      font:800 10px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
      color:rgba(255,255,255,.82);
      letter-spacing:.04em;
      margin-bottom:6px;
    }

  `;
  (document.head || document.documentElement).appendChild(style);

  const recolorStyle = document.createElement('style');
  recolorStyle.id = 'npRecolorSite';
  recolorStyle.textContent = `
    html.np-recolor-site.np-page-inventory .inv-tabs-container{
      background-color: var(--np-accent-l60, #e8a41d) !important;
    }
    html.np-recolor-site.np-page-inventory .inv-tabs-container::-webkit-scrollbar-track{
      background: var(--np-accent-l60, #e8a41c) !important;
    }
    html.np-recolor-site.np-page-inventory .inv-tabs-container::-webkit-scrollbar-thumb{
      background: var(--np-accent-l45, #c28001) !important;
    }
    html.np-recolor-site.np-page-inventory .inv-tabs-container::-webkit-scrollbar-thumb:hover{
      background: var(--np-accent-l75, #FFB529) !important;
    }
    html.np-recolor-site.np-page-inventory ul.invTabs li.invTab-selected,
    html.np-recolor-site.np-page-inventory .invTabsCarousel .invTab-selected{
      background-color: var(--np-accent-l45, #c18000) !important;
    }
    html.np-recolor-site.np-page-inventory .item-count{
      background-color: var(--np-accent-l60, #de911a) !important;
    }
    html.np-recolor-site.np-page-inventory .inv-menulinks{
      background: var(--np-accent-l45, #9F9786) !important;
    }
    html.np-recolor-site.np-page-inventory .container{
      background: linear-gradient(0deg,
        var(--np-accent-l90, rgba(197,182,155,1)) 0%, #fff 100%) !important;
    }

    html.np-recolor-site .nptoggle,
    html.np-recolor-site .filtertoggle,
    html.np-recolor-site .stacktoggle{
      filter:
        grayscale(1) sepia(1)
        hue-rotate(var(--np-accent-huerot, 0deg))
        saturate(var(--np-accent-sat, 1))
        brightness(var(--np-accent-bright, 1));
    }

    html.np-recolor-site .button-yellow__2020{
      background: linear-gradient(
        var(--np-accent-l75, #f6e250), var(--np-accent-l60, #ebb233)) !important;
      box-shadow:
        inset 0 0 0 1px var(--np-accent-l75, rgba(246,226,80,1)),
        inset 0 -3px 2px 3px var(--np-accent-l45, rgba(196,124,25,1)),
        inset 0 2px 0 1px rgba(253,249,220,1),
        0 0 0 2px rgba(0,0,0,1) !important;
    }
    html.np-recolor-site .button-yellow__2020:hover,
    html.np-recolor-site .button-yellow__2020:focus{
      background: linear-gradient(
        var(--np-accent-l90, #ffff54), var(--np-accent-l75, #ffd328)) !important;
    }
    html.np-recolor-site .button-yellow__2020:active{
      background: linear-gradient(
        var(--np-accent-l60, #ebb233), var(--np-accent-l75, #f6e250)) !important;
    }
    html.np-recolor-site .popup-header__2020,
    html.np-recolor-site .popup-footer__2020{
      background: var(--np-accent-l60, #fed123) !important;
    }

    html.np-recolor-site .bsp-navlist,
    html.np-recolor-site .bsp-subnav,
    html.np-recolor-site .mkt-navlist,
    html.np-recolor-site .mkt-subnav{
      background: linear-gradient(var(--np-accent-l60,#e8a41d), var(--np-accent-l45,#c18000)) !important;
    }
    html.np-recolor-site .bsp-navlist a,
    html.np-recolor-site .bsp-subnav__link,
    html.np-recolor-site .mkt-navlist a,
    html.np-recolor-site .mkt-subnav__link{
      background: linear-gradient(var(--np-accent-l75,#f5c030), var(--np-accent-l60,#e8a41d)) !important;
    }
    html.np-recolor-site .bsp-navlist a:hover,
    html.np-recolor-site .bsp-subnav__link:hover,
    html.np-recolor-site .mkt-navlist a:hover,
    html.np-recolor-site .mkt-subnav__link:hover{
      background: linear-gradient(var(--np-accent-l90,#fdd040), var(--np-accent-l75,#f5c030)) !important;
    }
    html.np-recolor-site .mkt-navlist a.is-active,
    html.np-recolor-site .mkt-subnav__link.is-active,
    html.np-recolor-site .bsp-subnav__link.is-active{
      background: linear-gradient(var(--np-accent-l30,#7a5500), var(--np-accent-l30,#5a3d00)) !important;
    }
    html.np-recolor-site .mkt-navlist a.is-active:hover,
    html.np-recolor-site .mkt-subnav__link.is-active:hover,
    html.np-recolor-site .bsp-subnav__link.is-active:hover{
      background: linear-gradient(var(--np-accent-l45,#8a6200), var(--np-accent-l30,#6a4800)) !important;
    }

    html.np-recolor-site [class*="menulinks"]{
      background: var(--np-accent-l45, #9f9786) !important;
    }
    html.np-recolor-site [class*="menulinks"] a:hover{
      color: var(--np-accent-l75, #fde68a) !important;
    }
    html.np-recolor-site [class*="stats-bar"],
    html.np-recolor-site [class*="header-bar"],
    html.np-recolor-site [class*="headerbar"],
    html.np-recolor-site .np-stepper-btn,
    html.np-recolor-site .mkt-stepper .mkt-stepper__btn{
      background: var(--np-accent-l60, #faa819) !important;
    }
    html.np-recolor-site [class*="count-badge"]{
      background: var(--np-accent-l60, #e8a41d) !important;
    }
    html.np-recolor-site [class*="tick-icon"].selected,
    html.np-recolor-site [class*="pin-btn"].is-pinned{
      background: var(--np-accent-l60, #faa819) !important;
    }
    html.np-recolor-site [class*="pagination-btn"]{
      background: var(--np-accent-l90, #ffeeaf) !important;
      border-color: var(--np-accent-l60, #c8a951) !important;
    }
    html.np-recolor-site [class*="pagination-btn"]:hover,
    html.np-recolor-site [class*="pagination-btn"].active,
    html.np-recolor-site [class*="pagination-btn"].is-active,
    html.np-recolor-site [class*="pagination-btn-active"]{
      background: var(--np-accent-l60, #fed123) !important;
      border-color: var(--np-accent-l45, #a07828) !important;
    }
    html.np-recolor-site [class*="-drawer"],
    html.np-recolor-site [class*="pin-inactive-text"]{
      background: var(--np-accent-l90, #fcee95) !important;
    }

    html.np-recolor-site .sdb-item-star.is-fav,
    html.np-recolor-site .sdb-grid-fav.is-fav{
      color: var(--np-accent-l60, #faa819) !important;
    }
    html.np-recolor-site .sdb-item-checkbox,
    html.np-recolor-site .sdb-auction-checkbox-row input{
      accent-color: var(--np-accent-l60, #faa819) !important;
    }
    html.np-recolor-site .sdb-row-selected{
      box-shadow: inset 4px 0 0 var(--np-accent-l60, #faa819) !important;
    }
    html.np-recolor-site .sdb-grid-item.is-selected{
      box-shadow: 0 0 0 2px var(--np-accent-l60, #faa819) !important;
    }
    html.np-recolor-site .sdb-as-item.is-selected{
      background: var(--np-accent-l90, #ffe9b8) !important;
    }
    html.np-recolor-site .shop__head{
      background: var(--np-accent-l75, #dddd77) !important;
    }
    html.np-recolor-site .mkt-lessons__dot.is-active{
      background: var(--np-accent-l60, #f5c400) !important;
    }
    html.np-recolor-site .mkt-help-tab.is-active{
      border-bottom-color: var(--np-accent-l60, #f5c400) !important;
    }

    html.np-recolor-site .quickstock-thead tr,
    html.np-recolor-site .quickstock-table.np-table thead th,
    html.np-recolor-site .quickstock-table.np-table thead th:first-child{
      background-color: var(--np-accent-l60, #e8a41d) !important;
    }
    html.np-recolor-site .quickstock-table.np-table thead th{
      border-bottom-color: var(--np-accent-l45, #c48a10) !important;
    }
    html.np-recolor-site .quickstock-table.np-table .np-table-row-even{
      background-color: var(--np-accent-l90, #fef0ba) !important;
    }
    html.np-recolor-site .quickstock-table.np-table tbody tr:last-child,
    html.np-recolor-site .quickstock-table.np-table tbody tr:last-child.np-table-row-even{
      background-color: var(--np-accent-l75, #fde68a) !important;
      border-top-color: var(--np-accent-l45, #c48a10) !important;
    }
    html.np-recolor-site .qs-menulinks a:hover{
      color: var(--np-accent-l75, #fde68a) !important;
    }
    html.np-recolor-site .quickstock-table input[type="radio"]{
      accent-color: var(--np-accent-l45, #c48a10) !important;
    }
  `;
  (document.head || document.documentElement).appendChild(recolorStyle);

  function mountLeftBar(){
    if (document.getElementById('npLeftBar')) return;
    const bar = document.createElement('div');
    bar.id = 'npLeftBar';
    bar.innerHTML = `<div id="npLeftBarBg"></div><div id="npLeftBarShade"></div>`;
    (document.body || document.documentElement).appendChild(bar);
  }
  if (document.body) mountLeftBar();
  else new MutationObserver((_, o) => { if (document.body){ mountLeftBar(); o.disconnect(); } })
    .observe(document.documentElement, { childList:true, subtree:true });

  function onReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  }

  onReady(() => {
    if (document.getElementById('npBgHandle')) return;

    const handle = document.createElement('div');
    handle.id = 'npBgHandle';
    handle.title = 'Click to open';
    handle.innerHTML = '<span>❮</span>';

    const sidebar = document.createElement('div');
    sidebar.id = 'npBgSidebar';
    sidebar.innerHTML = `
      <div id="npBgBody">
        <div class="npThemeBlock">
          <div class="npSmall" style="margin-bottom:4px">Button style</div>
          <select id="npBtnTheme" class="npThemeSelect"></select>
        </div>

        <div class="npThemeBlock">
          <div class="npSmall" style="margin-bottom:4px">Top bar</div>
          <select id="npTopbarBg" class="npThemeSelect">
            <option value="none">Transparent</option>
            <option value="tint">Tinted</option>
            <option value="blur">Frosted (default)</option>
            <option value="solid">Solid</option>
          </select>
        </div>

        <div class="npRecolorBlock">
          <button type="button" id="npRecolorSite" class="npRecolorBtn" aria-pressed="false">Recolor Site</button>
        </div>

        <div class="npBgSearch">
          <input id="npBgQuery" type="text" placeholder="Search backgrounds…" />
        </div>
        <div id="npBgList"></div>
      </div>
      <div id="npBgFooter">
        <button class="npFooterBtn" id="npBgCancel" type="button">Cancel</button>
        <button class="npFooterBtn primary" id="npBgSave" type="button">Save</button>
      </div>
    `;

    (document.body || document.documentElement).append(sidebar, handle);

    const OPEN_X = 'translateX(0)';
    const CLOSED_X = 'translateX(100%)';

    let built = false;
    let isOpen = false;
    let snapshot = null;
    let session  = null;

    function openBar(){
      if (isOpen) return;
      isOpen = true;
      snapshot = {
        mainBg:   LSget(LS.mainBgId, ''),
        leftBg:   LSget(LS.leftBarBg, ''),
        btnTheme: NQ.getBtnTheme(),
      };
      session = { ...snapshot };
      sidebar.style.transform = OPEN_X;
      if (!built) buildUI();
      refreshThemeSelect();
    }

    function closeBar(){
      isOpen = false;
      sidebar.style.transform = CLOSED_X;
      snapshot = null;
      session = null;
    }

    function saveAndClose(){
      if (session && session.btnTheme) NQ.saveBtnTheme(session.btnTheme);
      closeBar();
    }

    function cancelAndClose(){
      if (snapshot){
        applyMainBg(snapshot.mainBg);
        applyLeftBg(snapshot.leftBg);
        if (snapshot.btnTheme) NQ.applyBtnTheme(snapshot.btnTheme);
      }
      closeBar();
    }

    handle.addEventListener('click', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      openBar();
    });

    document.addEventListener('pointerdown', (ev) => {
      if (!isOpen) return;
      const t = ev.target;
      if (!t) return;
      if (t.closest && (t.closest('#npBgSidebar') || t.closest('#npBgHandle'))) return;
      cancelAndClose();
    }, true);

    function refreshThemeSelect(){
      const sel = sidebar.querySelector('#npBtnTheme');
      if (!sel) return;
      const themes = NQ.btnThemes;
      if (sel.options.length !== themes.length){
        sel.innerHTML = themes.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
      }
      const cur = (session && session.btnTheme) || NQ.getBtnTheme();
      if (cur) sel.value = cur;
    }

    function buildUI(){
      built = true;

      const saveBtn   = sidebar.querySelector('#npBgSave');
      const cancelBtn = sidebar.querySelector('#npBgCancel');
      const themeSel  = sidebar.querySelector('#npBtnTheme');

      themeSel?.addEventListener('change', () => {
        if (!session) return;
        session.btnTheme = themeSel.value;
        NQ.applyBtnTheme(themeSel.value);
      });
      refreshThemeSelect();

      const topbarSel = sidebar.querySelector('#npTopbarBg');
      if (topbarSel){
        topbarSel.value = LSget(LS.topbarBg, '') || 'blur';
        topbarSel.addEventListener('change', () => LSset(LS.topbarBg, topbarSel.value));
      }

      const recolorBtn = sidebar.querySelector('#npRecolorSite');
      if (recolorBtn){
        const paintRecolorBtn = (on) => {
          recolorBtn.classList.toggle('isOn', on);
          recolorBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        };
        paintRecolorBtn(LSget(LS.recolor, '0') === '1');
        recolorBtn.addEventListener('click', (ev) => {
          ev.preventDefault(); ev.stopPropagation();
          const on = LSget(LS.recolor, '0') !== '1';
          document.documentElement.classList.toggle('np-recolor-site', on);
          LSset(LS.recolor, on ? '1' : '0');
          paintRecolorBtn(on);
        });
      }

      saveBtn  .addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); saveAndClose(); });
      cancelBtn.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); cancelAndClose(); });
    }
  });

})();

})();

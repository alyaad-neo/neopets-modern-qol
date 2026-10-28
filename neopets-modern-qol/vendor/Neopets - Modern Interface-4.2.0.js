// ==UserScript==
// @name         Neopets - Modern Interface
// @namespace    neopets-qol
// @version      4.2.0
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

  /* =========================================================
     FUSION ①+②+③ — this file merges the former "Core & Layout",
     "HUD" and "Background & Decor" scripts. Each part keeps its own
     IIFE (verbatim scopes, zero variable collisions) and its own
     idempotence guard; the iframe/host gates are shared here.

     PW = the real PAGE window. The script runs in the Tampermonkey
     sandbox (GM_xmlhttpRequest is required for the DTI background
     API, which does not allow CORS from neopets.com), so everything
     meant to be visible to page scripts and to the standalone tab
     scripts (6-9: Quest Log, TVW, …) — the __np* APIs — must live on
     unsafeWindow, not on the sandbox window.
  ========================================================= */
  const PW = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

  // Never in iframes (game.phtml, NCMall embeds…): the frame + HUD would
  // be injected into every embedded frame. Main-host gate: the NC sub-apps
  // (ncmall., secure.nc., …) ship unrelated markup.
  if (window.top !== window) return;
  if (!/^(www\.|ncmall\.)?neopets\.com$/i.test(location.hostname)) return;

  /* =========================================================
     PHONE GUARD (4.2.0)
     This interface is built for desktop and tablet: a fixed
     60px top bar, a 330px side rail and a centered content
     frame have nowhere to go on a 400px-wide phone. Rather
     than render a broken layout (reported by users running
     Violentmonkey on Firefox for Android), bail out entirely
     on phones. TABLETS ARE NOT PHONES — iPad and Android
     tablets keep the full interface, including the touch
     affordances added in 4.0.

     To run it on a phone anyway, either flip the constant
     below to true, or run this once in that phone's browser:
       localStorage.setItem('npqol_mobile_v1','on')
  ========================================================= */
  const NP_RUN_ON_PHONES = false;
  const npIsPhone = () => {
    // Client Hints are authoritative where available (Chromium): Android
    // TABLETS report mobile:false, which is exactly the split we want.
    try {
      const uad = navigator.userAgentData;
      if (uad && typeof uad.mobile === 'boolean') return uad.mobile === true;
    } catch {}
    // Fallback UA sniff. "Android" alone also matches tablets, so the
    // "Mobile" token is required; iPad is deliberately absent.
    try {
      return /iPhone|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini|Android.*Mobile/i.test(navigator.userAgent || '');
    } catch { return false; }
  };
  if (!NP_RUN_ON_PHONES && npIsPhone()){
    let forced = false;
    try { forced = localStorage.getItem('npqol_mobile_v1') === 'on'; } catch {}
    if (!forced) return;
  }

  // Presence marker for the DEPRECATION releases of the three legacy
  // scripts (Core & Layout / HUD / Background & Decor): when they see this
  // flag they bail out entirely and skip their migration banner — the
  // merged script owns the page.
  try { document.documentElement.dataset.npModernInterface = '1'; } catch {}

  /* =========================================================
     ANTI RATE-LIMIT GUARD (Neopets 403 "You don't have
     permission to access …"). Neopets throttles per-IP request
     bursts; our background fetches (alerts, userlookup, bank,
     quickref) add up on top of the user's own browsing. The
     moment ANY of them gets a 403, we pause every background
     fetch of the whole suite for 10 minutes so the block can
     clear instead of being re-triggered. The key is shared
     with the standalone QuickRef Pet Card script on purpose.
     Declared in the fusion prelude → visible to all 3 parts.
  ========================================================= */
  const NP_BACKOFF_KEY = 'npqol_403_backoff_until_v1';
  const NP_STRIKE_KEY  = 'npqol_403_strikes_v1';
  /* 4.2.0 — ESCALATING backoff. A single unlucky 403 costs 10
     minutes, but an IP that is genuinely being throttled used to
     get re-poked every 10 minutes forever, which is what kept the
     "You don't have permission to access" page alive for the users
     who reported it. Each further 403 within the same streak backs
     off harder; three quiet hours forget the streak. */
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
  /* Gate for AUTOMATIC page-load refreshes only — the hover ↻ buttons
     and every bank action deliberately bypass it, an explicit click
     must still do something.

     Besides the 403 backoff it defers HIDDEN tabs: opening a handful
     of Neopets links in background tabs used to fire one full set of
     background fetches per tab, all at once. Now a background tab
     waits until the user actually looks at it. */
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

  /* ╔══════════════════════════════════════════════════════════════╗
     ║  PART ① — CORE & LAYOUT (frame, top bar, theme tokens)       ║
     ╚══════════════════════════════════════════════════════════════╝ */
(function () {
  'use strict';
  // (iframe + host gates hoisted to the fusion prelude)
  if (document.getElementById('np-core-layout')) return;

  /* =========================================================
     PAGES WITH A NATIVE THEMED CONTENT BACKGROUND
     Some Neopets pages (inventory, bank, etc.) ship a gradient
     or themed background inside the content frame that we want
     to KEEP visible. We tag <html> early so the CSS below can
     skip the white-bg override on those paths only — without
     affecting any other page.
     Edit this list to add/remove pages.
  ========================================================= */
  const KEEP_NATIVE_BG_PATHS = [
    '/inventory.phtml',
    '/bank.phtml',   // keep the Bank's native bg-pattern.png (common/bank.css on .theme-bg)
  ];
  if (KEEP_NATIVE_BG_PATHS.some(p => location.pathname.startsWith(p))) {
    document.documentElement.classList.add('np-keep-native-bg');
  }

  /* =========================================================
     BUTTON-THEME API (icon set used by the top bar and HUD).
     Exposed early so any consumer script can read the list,
     read the current theme, or dispatch `np:btn-theme` to
     refresh icons.
  ========================================================= */
  (function exposeBtnThemes(){
    if (PW.__npBtnThemesData) return;

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

    PW.__npBtnThemesData = { BTN_THEMES, FALLBACK_PATTERN, LS_KEY, DEFAULT };
    PW.__npBtnThemes = BTN_THEMES.map(t => ({ id: t.id, label: t.label }));

    PW.__npGetBtnTheme = () => {
      try { return localStorage.getItem(LS_KEY) || DEFAULT; }
      catch { return DEFAULT; }
    };
    // apply (no persist) → fires event so each script can refresh its icons.
    PW.__npApplyBtnTheme = (id) => {
      document.dispatchEvent(new CustomEvent('np:btn-theme', { detail: { themeId: id } }));
    };
    // save (persist + apply)
    PW.__npSaveBtnTheme = (id) => {
      try { localStorage.setItem(LS_KEY, id); } catch {}
      document.dispatchEvent(new CustomEvent('np:btn-theme', { detail: { themeId: id } }));
    };

    PW.__npBtnIconUrl = (iconName, themeId) => {
      const t = BTN_THEMES.find(x => x.id === themeId) || BTN_THEMES.find(x => x.id === DEFAULT);
      return (t || { pattern: FALLBACK_PATTERN }).pattern.replace('{icon}', iconName);
    };
    PW.__npBtnFallbackUrl = (iconName) => FALLBACK_PATTERN.replace('{icon}', iconName);

    /* Cascade fallback for icons. Neopets' themes aren't consistent:
       - basic/images/v3/*.svg has: profile, mypets, customise, inventory,
         safetydeposit, quickstock, transferlog, gallery, stamps, tradingcards,
         ncalbum, settings, signout, adoptpet, createpet…
       - basic/images/*.svg has different icons that v3 DOESN'T have:
         chamber, bookshelf, neopass, shopwizard…
       - basic/images/*.png is the last resort (shopwizard is PNG-only).
       So when a theme is missing an icon, fall back through this chain
       instead of a single URL — that's the only way `chamber`,`bookshelf`,
       `neopass` survive on themes that don't ship them. */
    PW.__npBtnFallbackChain = [
      'https://images.neopets.com/themes/h5/basic/images/v3/{icon}-icon.svg',
      'https://images.neopets.com/themes/h5/basic/images/{icon}-icon.svg',
      'https://images.neopets.com/themes/h5/basic/images/{icon}-icon.png',
    ];
    PW.__npAttachBtnFallback = (img, iconName) => {
      if (!img || !iconName) return;
      const tried = new Set();
      let extSwapped = false;
      let chainStep = 0;
      img.onerror = () => {
        const current = img.src || '';
        tried.add(current);

        // 1) Same theme, opposite extension. Grey Day's chamber/bookshelf/
        //    neopass live as SVG even though the theme's default pattern is
        //    PNG — without this step we'd skip straight to basic and show
        //    the wrong theme's icon. Generalized so any PNG/SVG mismatch
        //    in any future theme is auto-recovered.
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

        // 2) Static cascade: basic/v3 → basic root SVG → basic root PNG.
        //    Dedup against `tried` so we never re-fetch an URL the browser
        //    has already 404'd on (otherwise the cascade would freeze on
        //    no-op src assignments).
        const chain = PW.__npBtnFallbackChain || [];
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

  /* =========================================================
     ACCENT API — single accent color shared by every script
     via CSS custom properties (--np-accent*). The picker in
     the BG script calls __npApplyAccent(hex) to re-tint the
     entire HUD on the fly.
  ========================================================= */
  (function exposeAccent(){
    if (PW.__npAccentApi) return;

    const LS_KEY = 'npqol_accent_v1';
    const DEFAULT_HEX = '#dcb8ff';

    // Two rows of 8. Row 1 = soft pastels (vivid), row 2 = muted/dusty
    // versions + neutrals — the muted tones keep the "recolor site yellows"
    // module from looking garish. The hex goes straight into `--np-accent`;
    // derived bg/line/etc. come from rgba() via hexToRgb() below, and the
    // light→dark ramp (--np-accent-l*) from hexToHsl() in setCSSVars().
    const PALETTE = [
      // Row 1 — soft
      { id:'lila',    hex:'#dcb8ff', label:'Lila' },
      { id:'rose',    hex:'#ffb8d4', label:'Rose' },
      { id:'coral',   hex:'#ffb3ab', label:'Coral' },
      { id:'peach',   hex:'#ffce9e', label:'Peach' },
      { id:'yellow',  hex:'#f0dd7a', label:'Yellow' },
      { id:'mint',    hex:'#b6e6c1', label:'Mint' },
      { id:'cyan',    hex:'#a8e0ea', label:'Cyan' },
      { id:'blue',    hex:'#b6c6ff', label:'Blue' },
      // Row 2 — muted / neutral
      { id:'dustylila', hex:'#bcb0c8', label:'Dusty lila' },
      { id:'dustyrose', hex:'#d6bcc6', label:'Dusty rose' },
      { id:'clay',      hex:'#cdb2a8', label:'Clay' },
      { id:'sand',      hex:'#d3c6a8', label:'Sand' },
      { id:'sage',      hex:'#bccbb4', label:'Sage' },
      { id:'steel',     hex:'#b2c0cf', label:'Steel' },
      { id:'black',     hex:'#000000', label:'Black' },
      { id:'white',     hex:'#ffffff', label:'White' },
    ];

    function hexToRgb(hex){
      let h = String(hex || '').replace('#','').trim();
      if (h.length === 3) h = h.split('').map(c => c+c).join('');
      const n = parseInt(h, 16);
      if (!Number.isFinite(n) || h.length !== 6) return { r:220, g:184, b:255 };
      return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
    }
    const rgba = (hex, a) => { const {r,g,b} = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

    // HSL of the accent — used to build a fixed-lightness ramp that keeps the
    // accent's hue+saturation. Lets other scripts recolor Neopets' native gold
    // surfaces (which run light→dark) with shades of the chosen accent.
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
    // Neopets' native "gold" surfaces sit around this hue; a hue-rotate of
    // (accentHue - GOLD) remaps baked-in gold images/sprites toward the accent.
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

      // Monochrome ramp (same hue/sat, stepped lightness). Consumed by the
      // Background script's "recolor site yellows" module. Grey accents
      // (black/white, sat 0) naturally yield a neutral ramp.
      const { h, s, l } = hexToHsl(hex);
      const sPct = Math.round(s * 100);
      const shade = (L) => `hsl(${h.toFixed(1)}, ${sPct}%, ${L}%)`;
      root.style.setProperty('--np-accent-l90', shade(90));
      root.style.setProperty('--np-accent-l75', shade(75));
      root.style.setProperty('--np-accent-l60', shade(60));
      root.style.setProperty('--np-accent-l45', shade(45));
      root.style.setProperty('--np-accent-l30', shade(30));

      // Readable-text variant of the accent: same hue/sat, lightness floored
      // at 82% so typography stays LIGHT on the dark top bar / glass panels
      // whatever accent is picked (black/dusty accents used to make the bar
      // text unreadably dark). Consumed by the top bar and available to the
      // other scripts as --np-accent-text.
      const textL = Math.max(l, 0.82);
      root.style.setProperty('--np-accent-text', `hsl(${h.toFixed(1)}, ${sPct}%, ${Math.round(textL * 100)}%)`);

      // Filter pipeline for recoloring image/SVG surfaces (toggle pills) that
      // can't be recolored in CSS. Used as:
      //   grayscale(1) sepia(1) hue-rotate(huerot) saturate(sat) brightness(bright)
      // sepia's neutral base sits at ~hue 40 (≈ NEO_GOLD_HUE) with saturation
      // ≈0.244, so the SAME hue-rotate remaps it to the accent hue; `sat`
      // scales chroma to the accent (0 → grey for black/white, fixing the old
      // "red pill" bug) and `bright` tracks the accent's lightness so muted
      // accents no longer leave the pills over-saturated.
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
      document.dispatchEvent(new CustomEvent('np:accent', { detail: { hex } }));
    }
    function saveAccent(hex){
      try { localStorage.setItem(LS_KEY, hex); } catch {}
      applyAccent(hex);
    }
    function resetAccent(){
      try { localStorage.removeItem(LS_KEY); } catch {}
      applyAccent(DEFAULT_HEX);
    }

    PW.__npAccentApi     = true;
    PW.__npAccentPalette = PALETTE;
    PW.__npAccentDefault = DEFAULT_HEX;
    PW.__npGetAccent     = getAccent;
    PW.__npApplyAccent   = applyAccent;   // preview (no persist)
    PW.__npSaveAccent    = saveAccent;    // persist + apply
    PW.__npResetAccent   = resetAccent;

    // Apply at document-start so the rest of the page sees the color.
    applyAccent(getAccent());
  })();

  /* =========================================================
     FLOATING TABS API — shared dimensions + auto-stack.
     Each tab script (Quest Log, etc.) calls __npRegisterTab(id)
     at mount and gets the `bottom` offset to use:
       - 1st tab → at the very bottom-right
       - 2nd tab → stacked above
       - 3rd → above that
     Order = Tampermonkey execution order (alphabetical by default).
  ========================================================= */
  (function exposeTabsAPI(){
    if (PW.__npTabConfig) return;
    PW.__npTabConfig = {
      H: 110,           // tab height
      W: 220,           // tab width
      PEEK: 80,         // visible part when collapsed
      HOVER_PEEK: 220,  // visible part on hover (= W → tab fully out)
      BORDER: 3,
      GAP: 18,          // vertical gap between two stacked tabs
      BASE_BOTTOM: 30,  // bottom margin for the first tab
      ACCENT: '#dcb8ff',
      ZINDEX: 100000,
    };
    PW.__npTabs = PW.__npTabs || [];
    PW.__npRegisterTab = function(id){
      const cfg = PW.__npTabConfig;
      if (!PW.__npTabs.includes(id)) PW.__npTabs.push(id);
      const idx = PW.__npTabs.indexOf(id);
      return cfg.BASE_BOTTOM + idx * (cfg.H + cfg.GAP);
    };
  })();

  /* =========================================================
     SHARED THEME TOKENS — also consumed by HUD and BACKGROUND
     scripts. Other scripts reference them via var(--np-*, fallback)
     so they keep working even if this script is disabled.
  ========================================================= */
  const THEME = `
    :root{
      --np-font: system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;

      /* Accent — overridden by exposeAccent() from localStorage.
         These values are just fallbacks (default lila). */
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

      /* Top-bar surface (right panel → "Top bar"). Defaults reproduce
         the original fully transparent bar exactly. */
      --np-bar-bg:transparent;
      --np-bar-backdrop:none;
      --np-bar-line:transparent;
      --np-bar-shadow:none;
      /* Left edge of the bar's PAINTED surface. The bar element itself
         stays full-width (its menus must keep centring on the viewport);
         only its background starts after the side rail, so the rail and
         the user card sit in front of it instead of under a tint. */
      --np-bar-inset-left:0px;

      /* Shortcut icon size (bottom editor → "Icons"). */
      --np-side-icon-size:60px;

      --np-gap:10px;
      --np-col-width:330px;          /* width of the left decor column */
      --np-hud-left:20px;            /* left margin inside the column */
      --np-hud-top:10px;
      --np-hud-bottom:10px;
      --np-hud-width:290px;          /* 20 + 290 + 20 = 330 → balanced margins */

      --np-z-bg:-2147483640;
      --np-z-bar:1000;
      --np-z-hud:1000;
      --np-z-menu:2000;
    }
  `;

  /* =========================================================
     LAYOUT (frame + kill native + offsets)
  ========================================================= */
  const BAR_H = 60;
  const FRAME = `
    :root{
      /* --np-frame-shift mirrors --np-col-width (the HUD's left rail) so
         the frame width and position both adapt when the user drags the
         resize handle. When the HUD is hidden (narrow viewport media
         query below), we reset --np-frame-shift to 0 so the frame can
         use the full viewport. The fallback (var(..., 0px)) keeps things
         working even when the HUD script isn't loaded. */
      --np-frame-shift: var(--np-col-width, 0px);
      /* Responsive frame width: never wider than 1100px, never wider than
         the space remaining after the HUD column, never narrower than
         600px (below that, content readability collapses anyway).
         The 40px subtracted = 20px breathing room on each side. */
      --np-frame-width: clamp(600px, calc(100vw - var(--np-frame-shift) - 40px), 1100px);
      /* Clearance below the top bar. --np-content-drop is added by the
         horizontal icon-row layout, which needs the page to start BELOW
         the row rather than underneath it; the column layouts live in the
         side margins and leave it at 0. Kept as its own token so the
         media query below inherits the behaviour. */
      --np-content-drop: 0px;
      --np-top-offset: calc(100px + var(--np-content-drop, 0px));
      --np-h5-gap: 0px;           /* 0 = BETA aligned with CLASSIC (top position) */
      --np-frame-radius: 30px;
      --np-frame-padding: 16px;
      --np-frame-border: 2px solid #000;
      --np-bottom-spacer: 10px;
    }

    /* CLASSIC: no H5 gap */
    body#neobdy{ --np-h5-gap: 0px; }

    /* Native scrollbars hidden. The previous "stable both-edges" gutter
       reserved a strip on BOTH viewport edges (the two ugly black bars),
       and a native bar can neither be transparent nor sit BEHIND the BG
       picker tab. Scroll position feedback comes from a custom
       accent-tinted indicator instead (#npxScrollThumb, pointer-events:
       none, z-index below every panel/tab) — see customScrollbar() at the
       end of PART ①. */
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

    /* ===== HIDE NATIVE (nav + ads + footer + sidebar) ===== */
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

    /* Classic sidebar */
    td.sidebar, td.sidebar .sidebarModule{
      display:none !important;
      width:0 !important;
      height:0 !important;
      overflow:hidden !important;
    }

    /* Classic content full width */
    #content, td.content{ width:100% !important; }

    /* H5 subnav (favorites / NP / NC) */
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

    /* Main content frame — viewport-centered on wide screens, pushed past
       the HUD's right edge when the viewport gets narrow enough that the
       natural center would collide with the HUD.
       The max() picks whichever is larger between:
         - the symmetric viewport-centered margin ((100vw - frame_width) / 2)
         - the HUD's right edge (var(--np-frame-shift))
       On wide viewports the first wins → behavior unchanged.
       On narrow viewports the second wins → frame docks against the HUD
       and the right side absorbs the remaining margin via margin-right
       auto. This combined with the adaptive --np-frame-width clamp above
       guarantees zero overlap at every viewport size.
       Layout part (width/padding/border) always applies; the white-bg part
       below is gated so KEEP_NATIVE_BG_PATHS pages keep their themed gradient. */
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

    /* Override Neopets' sand/cream gradient on H5 containers
       (.theme-bg, .container) — otherwise the background goes beige.
       Skipped on pages flagged via KEEP_NATIVE_BG_PATHS (inventory, etc.)
       so their native gradient stays visible. */
    html:not(.np-keep-native-bg) body .container.theme-bg,
    html:not(.np-keep-native-bg) body #container__2020.theme-bg,
    html:not(.np-keep-native-bg) body .container,
    html:not(.np-keep-native-bg) body .theme-bg{
      background-color:#fff !important;
      background-image:none !important;
    }

    /* BETA/H5 : adds the "removed bar" gap */
    body #container__2020{
      margin-top: calc(var(--np-top-offset) + var(--np-h5-gap)) !important;
    }

    /* Anti-blank top */
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) > :first-child{
      margin-top:0 !important; padding-top:0 !important;
    }
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) > br:first-child,
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) > hr:first-child{
      display:none !important;
    }
    body .page-title__2020, body .inv-title-container { margin-top:0 !important; padding-top:0 !important; }
    body .page-title__2020 :is(h1,h2,h3), body .inv-title-container :is(h1,h2,h3){ margin-top:0 !important; }

    /* Neoboards containers ship "margin:20px auto" (neoboards.css) — the
       anti-blank-top rule above misses them because the frame's LITERAL
       first child on those pages is a hidden ad/buffer div, so the first
       VISIBLE element keeps its top margin and the content starts lower
       than on other pages. Kill the top margin here (sides stay auto for
       centering); the generic firstVisibleAlign() module below covers any
       page with the same hidden-first-child pattern. */
    body #boardList, body #boardTopic, body #boardIndex, body #boardCreateTopic{
      margin-top:0 !important;
    }

    /* Remove decorative borders / table chrome inside the frame.
       NOTE: background-image:none is gated behind :not(.np-keep-native-bg)
       below so themed pages (inventory, …) keep their native gradients
       even when those live on a <table>/<td>. */
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

    /* CLASSIC: kill the 160px floated column blocking the content */
    body#neobdy td.content > div[style*="float: right"][style*="width: 160px"]{
      display:none !important;
    }
    /* CLASSIC: free the 635px-forced main block */
    body#neobdy td.content > div[style*="width: 635px"]{
      width:auto !important; max-width:100% !important;
      margin-left:auto !important; margin-right:auto !important;
    }
    /* CLASSIC: cleanup floats */
    body#neobdy td.content::after{ content:""; display:block; clear:both; }

    /* ===== Modern BETA pages: hide redundant chrome =====
       Recently rebuilt pages (SDB, Inventory, Closet, Quickstock…)
       duplicate things that already live in the HUD:
         - "Back to Neopia Central" button
         - inter-page nav (Inventory / Closet / SDB / ...)
         - verbose descriptions ("Your Safety Deposit Box holds...")
       Hide all of it so the nav stays clean.

       .inv-menubar is the parent of .inv-filtericons (NP/NC toggles,
       sort A-Z, stack/unstack). It can't be display:none without
       killing its useful children. Strategy:
         - keep .inv-menubar visible
         - hide ALL its direct children EXCEPT .inv-filtericons
       Same for .sdb-menubar and .closet-menubar.

       Specificity (0,1,2) with 'html body' beats the fallback
       [class$="-menubar"] (0,1,1) that comes later in source order. */
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
    /* Position the menubar absolutely (to the right of the page title)
       so it doesn't stack at the top-left. */
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
    /* 4.2.0 — the trim is now opt-out. html.np-inv-menubar-full (right
       panel → "Full inventory bar") keeps Neopets' own menu-bar links —
       Quick Stock, Transfer Log, Item Search… — beside the NP/NC filter
       icons, for the users who navigate from there. Default behaviour is
       unchanged: filters only. */
    html:not(.np-inv-menubar-full) body .inv-menubar > *:not(.inv-filtericons),
    html:not(.np-inv-menubar-full) body .sdb-menubar > *:not(.sdb-filtericons),
    html:not(.np-inv-menubar-full) body .closet-menubar > *:not(.closet-filtericons),
    html:not(.np-inv-menubar-full) body .quickstock-menubar > *:not(.quickstock-filtericons),
    html:not(.np-inv-menubar-full) body .gallery-menubar > *:not(.gallery-filtericons){
      display:none !important;
    }
    /* With every link shown the bar no longer fits the absolute slot to
       the right of the page title, so it goes back into the flow and wraps
       across the full width. */
    html.np-inv-menubar-full body .inv-menubar{
      position:static !important;
      transform:none !important;
      flex-wrap:wrap !important;
      justify-content:flex-end !important;
      row-gap:6px !important;
      column-gap:8px !important;
      margin:0 !important;
    }
    /* Neopets gives .inv-menulinks a 140px BOTTOM MARGIN: in their own
       layout the link row floats over the item grid, and that margin is
       what pushes the grid clear of it. Ours is in the flow, so the margin
       became a 140px empty band between the bar and the category tabs —
       measured on the live page: bar height 230px = 34 (filter pills) + 6
       (row gap) + 50 (links) + 140 (this margin). */
    html.np-inv-menubar-full body [class*="-menulinks"]{
      margin-bottom:0 !important;
    }
    /* Quickstock / Gallery hide their WHOLE bar further down (the shared
       :is() cleanup list) — bring it back for the same setting. */
    html.np-inv-menubar-full body :is(.quickstock-menubar, .gallery-menubar){
      display:flex !important;
      visibility:visible !important;
      opacity:1 !important;
      height:auto !important;
      width:auto !important;
      overflow:visible !important;
      pointer-events:auto !important;
    }
    /* Force visibility of .inv-filtericons only. No display:flex on its
       children — let Neopets size the icons (containers + bg sizing). */
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
      /* GENERIC "Back" button used by every rebuilt beta page */
      .back-button-circle__2020,
      /* per-page descriptions / instructions */
      #pageDesc, #qs-instructions,
      /* Battledome header (Board/FAQ + iframe FB) */
      #bdHeader,
      /* social widgets (FB Like, Twitter Share/Follow) */
      .social-links, .fb-like, .fb_iframe_widget, #fb-root,
      .twitter-share-button, .twitter-follow-button
    ){
      display:none !important;
    }
    /* social plugin iframes wherever they get injected */
    body iframe[src*="facebook.com/plugins"],
    body iframe[src*="platform.twitter.com"],
    body iframe[title*="Facebook Social Plugin" i],
    body iframe[title*="Twitter" i]{
      display:none !important;
    }
    /* Generic fallback: every "*-menubar"/"*-header-back"/"*-header-description"
       follows the same naming pattern. Covers beta pages we don't know
       about yet (closet, stamps, tcg, etc.). */
    body [class$="-menubar"],
    body [class$="-header-back"],
    body [class$="-header-description"]{
      display:none !important;
    }
    /* Remove the empty space left above the page title once Back and the
       menu are gone (the title-row has nothing left to balance). */
    body :is(.sdb-header, .inv-header, .closet-header, .quickstock-header, .qs-page-header){
      padding-top:0 !important;
      margin-top:0 !important;
    }
    body :is(.sdb-header-title-row, .inv-header-title-row, .closet-header-title-row, .qs-title-container){
      justify-content:center !important;
      padding-top:0 !important;
      margin-top:0 !important;
    }
    /* Frame: cancel the calc(2em+15px+2em) bottom padding from Neopets, but
       guarantee a min-height that covers the central icon-column area so it
       stays visually INSIDE the frame on short pages. */
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner){
      /* --np-frame-minh is set by the frame-resize module when the user drags
         the bottom edge (persisted); default = the historical 50vh+80px. */
      min-height:var(--np-frame-minh, calc(50vh + 80px)) !important;
      padding-bottom:var(--np-frame-padding) !important;
    }

    /* Community Central: decorative wood planks flanking the content — they
       stick out of the frame, remove them. */
    body .community-wood-left,
    body .community-wood-right{
      display:none !important;
    }

    /* CLASSIC: avoid the DOUBLE frame. #main stays as THE single frame (it
       carries the top offset). Nested elements get their border removed but
       keep their internal padding so the content breathes. */
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

    /* Narrow viewports: reduce frame radius/padding so it doesn't look
       chunky at smaller widths. */
    @media (max-width: 1100px){
      :root{ --np-frame-radius: 20px; --np-frame-padding: 12px; }
    }
    @media (max-width: 900px){
      /* HUD is display:none below 900px (set by the HUD script) → we also
         zero out --np-frame-shift so the frame doesn't keep a 330px gap
         on the left where the HUD used to be. We override --np-frame-shift
         specifically (not --np-col-width) so the Dailies sidebar still
         uses the persisted column width for its open-state layout. */
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

  /* ===== HIDE NATIVE (CSS only — NOT removed from DOM) =====
     We don't .remove() these because Neopets scripts then try to
     query them (setDotOnBellIcon, manageProfileMenuSize2020, etc.)
     and crash when they're missing — which breaks page init
     (e.g. inventory NP/NC filters never bind).
     Solution: keep them in the DOM, just visually hidden.
  */
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

  /* =========================================================
     TOP BAR (Shadow DOM, hover-open menus)
  ========================================================= */
  const mkLink = (attrs) => { const el = document.createElement('link'); Object.assign(el, attrs); (document.head || document.documentElement).append(el); };
  mkLink({ rel:'preconnect', href:'https://images.neopets.com', crossorigin:'' });
  mkLink({ rel:'dns-prefetch', href:'//images.neopets.com' });

  const host = document.createElement('div');
  host.id = 'npx-host';
  /* pointer-events:none on the HOST (4.2.0). The bar is a full-width
     60px fixed strip, so its empty left third sat directly on top of
     the HUD's user card. That is the whole "I can't click the ⚙ and ↻
     on the username / avatar count card — they show on hover but
     vanish as soon as I leave the words" report: the buttons live at
     the card's top-right corner, INSIDE that strip, so the cursor left
     the card before it ever reached them. Only the controls inside the
     bar take pointer events now; the empty strip between them lets
     everything underneath — HUD cards and page content alike — through. */
  /* Z-ORDER of the whole suite, for reference:
        18   #npLeftBar   decor column
        1000 #npHud       HUD cards
        1001 #npHudResizer rail drag strip
        1002 #btnOverlay  shortcut icons   (above the drag strip)
        1005 #npxSideBtnHost  bottom editor (above the icons)
        2000 #npx-host    top bar + its dropdown menus (above everything)
     The bar host has to win because its menus live INSIDE it: they open
     at y=66px and would otherwise be covered by the icons in the
     horizontal-row layout, which is exactly what happened when the
     overlay was first lifted above the drag strip. The host is
     pointer-events:none and its painted surface starts after the side
     rail, so sitting on top costs nothing. */
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
    /* The painted surface is a separate layer so it can START AFTER the
       left rail (--np-bar-inset-left) while the bar element itself stays
       full-width — the menu row keeps centring on the viewport exactly as
       before. User-selectable in the right panel → "Top bar"; the token
       defaults reproduce the original fully transparent bar. */
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
    /* Controls ride above the painted layer. */
    .inner{ position:relative; z-index:1; }
    /* Companion to the host's pointer-events:none — see there. Only the
       controls themselves are interactive; the grid columns they sit in
       stay transparent to the cursor, which is what gives the HUD cards
       under the bar their top-right corner back. */
    .inner, .left, .right{ pointer-events:none; }
    .left > *, .right > *, .menu, .bellMenu{ pointer-events:auto; }
    .inner{
      display:grid;
      grid-template-columns: 1fr auto 1fr;
      align-items:center; width:100%;
      padding:0 10px; gap:10px;
    }
    .left{ grid-column:2; display:flex; align-items:center; gap:8px; justify-content:center; }
    .right{ grid-column:3; display:flex; align-items:center; gap:10px; justify-content:flex-end; }

    .btn{
      display:flex; align-items:center; gap:8px;
      text-decoration:none; cursor:pointer; user-select:none;
      padding:4px 8px; border-radius:10px;
      color:var(--np-accent-text, var(--np-accent, #dcb8ff)); font-weight:700;
      text-shadow:0 1px 3px rgba(0,0,0,.9), 0 0 8px rgba(0,0,0,.5);
      transition: background .15s ease;
    }
    .btn:hover{ background:var(--np-accent-bg, var(--np-accent-bg)); }
    .btn img{ width:34px; height:34px; display:block; }
    .btn.fight img{ width:68px; height:68px; }

    .menu{
      position:fixed; top:${BAR_H + 6}px; left:0; display:none;
      background:rgba(20,14,32,.96);
      backdrop-filter: blur(var(--np-blur, 8px));
      -webkit-backdrop-filter: blur(var(--np-blur, 8px));
      border:1px solid var(--np-line, rgba(255,255,255,.16));
      border-radius:var(--np-radius, 14px);
      box-shadow:0 10px 28px rgba(0,0,0,.45);
      padding:8px; min-width:220px; max-width:min(640px,92vw);
      z-index:2000;
    }
    .menu a{
      display:flex; align-items:center; gap:10px;
      padding:8px 10px; border-radius:var(--np-radius-sm, 10px);
      text-decoration:none; color:var(--np-accent-text, var(--np-accent, #dcb8ff)); font-weight:600;
    }
    .menu a:hover{ background:var(--np-accent-bg, var(--np-accent-bg)); color:#fff; }
    .menu a img{ width:24px; height:24px; display:block; flex:0 0 auto; }
    .menu a span{ flex:1 1 auto; white-space:nowrap; }
    .menu .menuSep{
      height:1px;
      background:rgba(255,255,255,.14);
      margin:6px 8px;
    }

    /* Trash button: hidden by default, appears on row hover */
    .menu a{ position:relative; }
    .menu a .menuTrash{
      position:absolute; top:50%; right:6px;
      transform:translateY(-50%);
      width:22px; height:22px; padding:0;
      border:0; border-radius:50%;
      background:rgba(255,80,80,.15);
      color:#ff8080; font-size:14px; font-weight:900;
      line-height:1; cursor:pointer;
      opacity:0; transition:opacity .12s ease;
      display:flex; align-items:center; justify-content:center;
    }
    .menu a:hover .menuTrash{ opacity:1; }
    .menu a .menuTrash:hover{
      background:#ff5a5a; color:#fff;
    }

    /* Add row: + button + inline form */
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
      color:#1a1330;
      border-color:transparent;
    }
    .menu .menuAddBtns button:hover{ filter:brightness(1.1); }

    /* Top bar: search button (toggle) */
    .searchBtn{ cursor:pointer; }

    /* Search form: hidden by default, appears when the magnifier is clicked */
    .searchForm{
      display:none;
      align-items:center;
      height:34px; padding:0 4px 0 10px;
      border-radius:18px;
      background:rgba(255,255,255,.10);
      border:1px solid rgba(255,255,255,.20);
      transition:border-color .12s ease, background .12s ease;
    }
    .searchForm.open{ display:flex; }
    .searchForm:focus-within{
      border-color:var(--np-accent, #dcb8ff);
      background:rgba(255,255,255,.14);
    }
    .searchInput{
      width:200px; min-width:0; height:30px; padding:0 6px;
      border:0; background:transparent; outline:0;
      color:#fff; font:inherit; font-weight:500; font-size:13px;
    }
    .searchInput::placeholder{ color:rgba(255,255,255,.45); }
    .searchGo{
      height:26px; padding:0 12px;
      border:0; border-radius:13px;
      background:var(--np-accent, #dcb8ff);
      color:#1a1330; font:inherit; font-weight:800; font-size:12px;
      cursor:pointer;
    }
    .searchGo:hover{ filter:brightness(1.08); }

    /* Top bar: NST clock */
    .nst{
      display:flex; align-items:baseline; gap:4px;
      color:var(--np-accent-text, var(--np-accent, #dcb8ff)); font-weight:600; font-size:13px;
      font-variant-numeric:tabular-nums;
      text-shadow:0 1px 3px rgba(0,0,0,.9);
      padding:0 4px; white-space:nowrap;
    }
    .nst .nstLabel{ font-size:11px; opacity:.7; }

    /* Bell button + notification badge */
    .bellBtn{ position:relative; cursor:pointer; }
    .bellBtn .bellDot{
      position:absolute; top:-2px; right:-2px;
      min-width:18px; height:18px; padding:0 5px;
      border-radius:10px; background:#ff5a5a; color:#fff;
      font-size:10px; font-weight:900; line-height:18px;
      text-align:center; box-shadow:0 1px 3px rgba(0,0,0,.6);
    }
    .bellBtn .bellDot[hidden]{ display:none !important; }

    /* Bell dropdown */
    .bellMenu{
      position:fixed; top:${BAR_H + 6}px; right:10px; display:none;
      background:rgba(20,14,32,.96);
      backdrop-filter: blur(var(--np-blur, 8px));
      -webkit-backdrop-filter: blur(var(--np-blur, 8px));
      border:1px solid var(--np-line, rgba(255,255,255,.16));
      border-radius:var(--np-radius, 14px);
      box-shadow:0 10px 28px rgba(0,0,0,.45);
      padding:8px; width:340px; max-width:92vw; max-height:60vh; overflow:auto;
      z-index:2000;
    }
    .bellMenu .bellHead{
      display:flex; justify-content:space-between; align-items:center;
      padding:4px 8px 8px 8px;
      border-bottom:1px solid rgba(255,255,255,.10);
      margin-bottom:6px;
    }
    .bellMenu .bellHead h3{
      margin:0; font:900 12px/1 system-ui,sans-serif;
      letter-spacing:.05em; text-transform:uppercase;
      color:rgba(255,255,255,.7);
    }
    .bellMenu .bellHead a{
      font-size:11px; color:var(--np-accent-text, var(--np-accent, #dcb8ff));
      text-decoration:none; padding:2px 6px; border-radius:6px;
    }
    .bellMenu .bellHead a:hover{ background:var(--np-accent-bg); }
    .bellMenu .bellList{ display:flex; flex-direction:column; gap:4px; }
    .bellMenu .bellItem{
      position:relative;
      display:grid;
      grid-template-columns: 32px 1fr;
      grid-template-rows: auto auto;
      grid-column-gap:10px;
      align-items:start;
      padding:8px 28px 8px 10px; border-radius:10px;
      text-decoration:none; color:#fff;
    }
    .bellMenu .bellItem:hover{ background:var(--np-accent-soft); }
    .bellMenu .bellItem .bellIcon{
      grid-row: 1 / span 2;
      width:32px; height:32px; align-self:center;
      background:center/contain no-repeat;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,.5));
    }
    .bellMenu .bellItem .bellTitle{
      font-size:13px; font-weight:800; color:#fff;
      line-height:1.2;
      margin:0;
    }
    .bellMenu .bellItem .bellText{
      font-size:11px; color:rgba(255,255,255,.78);
      line-height:1.3; margin:2px 0 0;
    }
    .bellMenu .bellItem .bellTime{
      grid-column: 2; margin:3px 0 0;
      font-size:10px; font-weight:600;
      color:var(--np-accent-text, var(--np-accent));
      letter-spacing:.02em;
    }
    .bellMenu .bellItem .bellX{
      position:absolute; top:6px; right:6px;
      width:22px; height:22px; padding:0; border:0;
      background:rgba(255,255,255,.06);
      color:rgba(255,255,255,.75);
      border-radius:6px; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      opacity:.55; transition:opacity .12s ease, background .12s ease, color .12s ease;
    }
    .bellMenu .bellItem:hover .bellX{ opacity:1; }
    .bellMenu .bellItem .bellX:hover{
      background:#ff5a5a; color:#fff;
    }
    .bellMenu .bellItem .bellX svg{
      width:13px; height:13px; display:block;
      pointer-events:none;
    }
    .bellMenu .bellEmpty{
      padding:18px 8px; text-align:center;
      color:rgba(255,255,255,.55); font-size:12px;
    }

    /* Smaller top bar on narrow screens */
    @media (max-width: 900px){
      .left{ gap:6px; }
      .right{ gap:8px; }
      .nst{ display:none; }  /* drop the clock first */
      .btn span{ display:none; } /* keep only icons */
    }
    @media (max-width: 700px){
      .btn img{ width:28px; height:28px; }
      .searchInput{ width:120px; }
    }
  `;
  root.appendChild(barStyle);

  // Mapping key → Neopets icon name (used in data-icon + URL pattern).
  // Structure mirrors the original Neopets nav (Community / Games /
  // Explore / Shop + Premium on the right, Quests + Bell at the far right).
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

  const _initialTheme = (typeof PW.__npGetBtnTheme === 'function') ? PW.__npGetBtnTheme() : 'constellations';
  const _iconUrl = (typeof PW.__npBtnIconUrl === 'function')
    ? PW.__npBtnIconUrl
    : (name, theme) => `https://images.neopets.com/themes/h5/${theme}/images/${name}-icon.svg`;
  const icons = Object.fromEntries(
    Object.entries(TOPBAR_ICON_NAMES).map(([key, iconName]) => [key, _iconUrl(iconName, _initialTheme)])
  );
  // Each item: [href, label, iconSpec].
  // Special element: '---' = visual separator between groups.
  // iconSpec:
  //   - "name"        → follows current theme via __npBtnIconUrl
  //   - "basic:name"  → fixed icon basic/images/<name>-icon.png (sub-icons)
  //   - "basicsvg:name" → fixed icon basic/images/<name>-icon.svg
  //   - "https://..." → fixed URL, ignored by theme switching
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
      // NP section
      ['/shops/wizard.phtml','Shop Wizard','basic:shopwizard'],
      ['/market.phtml?type=your','My Shop','basic:myshop'],
      ['/auctions.phtml','Auctions','basic:auction'],
      ['/island/tradingpost.phtml','Trading Post','basic:tradingpost'],
      ['/bank.phtml','Bank','shop'],
      ['/space/warehouse/prizecodes.phtml','Redeem Codes','basic:redeemcode'],
      '---',
      // NC section
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
      </div>
      <div class="right">
        <div class="btn searchBtn" id="npxSearchToggle" title="Search ( / )">
          <img src="${icons.search}" data-icon="search" alt="Search">
        </div>
        <form class="searchForm" id="npxSearch" action="https://www.neopets.com/search.phtml" method="get" role="search">
          <input class="searchInput" id="npxSearchInput" name="string" autocomplete="off" placeholder="Search Neopets…">
          <button class="searchGo" type="submit" aria-label="Go">Go</button>
        </form>
        <div class="nst" id="npxNst"><span class="nstTime">--:--:--</span> <span class="nstLabel">NST</span></div>
        <a class="btn" href="https://www.neopets.com/questlog/" title="Quest Log"><img src="${icons.quests}" data-icon="quests" alt="Quests"></a>
        <div class="btn bellBtn" id="npxBell" title="Alerts">
          <img src="${icons.bell}" data-icon="bell" alt="Alerts">
          <span class="bellDot" id="npxBellDot" hidden>0</span>
        </div>
        <a class="btn" id="npxNews" href="https://www.neopets.com/nf.phtml" title="New Features">
          <img src="https://images.neopets.com/themes/h5/basic/images/v3/news-icon.svg" alt="News">
        </a>
      </div>
    </div>
  `;
  root.appendChild(bar);

  /* Arm the cascade fallback on every themed icon in the top bar.
     The `<img>` tags were built via template literal `src=` strings,
     which means they fetch immediately at parse time WITHOUT any
     onerror handler. The previous applyTopbarTheme() was the only
     spot that attached the fallback — and it only ran on theme-
     CHANGE (np:btn-theme event). So if any of the initial URLs 404,
     the icon stayed broken forever. This helper:
       1. attaches __npAttachBtnFallback so future errors cascade
          through basic/v3 → basic root → basic png
       2. force re-fetches icons that already errored before the
          fallback was attached (otherwise src=sameURL is a no-op
          and the broken state is permanent)
     Called immediately on the freshly-built bar, on every menu
     (initial + rerender), and on pageshow/load/visibilitychange. */
  function armTopbarIcons(scope){
    const attachFb = PW.__npAttachBtnFallback;
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

  /* =========================================================
     TOP-BAR MENU CUSTOMIZATION (per category):
       - users can remove an item (trash on hover)
       - users can add a custom link (+ at the end of the menu)
     Persisted in localStorage as
       { [catId]: { removed:[href], added:[{href,label,iconSpec}] } }
  ========================================================= */
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
        // If the item is a default → add it to "removed".
        // If it's a previously added item → drop it from "added".
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
        // Whitelist URL schemes: only http(s) absolute URLs or site-relative paths.
        // Blocks javascript:, data:, vbscript:, file:, etc. which would otherwise
        // run with the page's privileges when the user clicks the saved link.
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

  /* =========================================================
     NST CLOCK — Neopian Standard Time (America/Los_Angeles),
     ticks every second in the top bar.
  ========================================================= */
  (function nstClock(){
    const nstEl = root.querySelector('#npxNst');
    if (!nstEl) return;
    const timeEl  = nstEl.querySelector('.nstTime');
    const labelEl = nstEl.querySelector('.nstLabel');
    const fmt = new Intl.DateTimeFormat('en-US', {
      hour:'numeric', minute:'2-digit', second:'2-digit',
      hour12:true, timeZone:'America/Los_Angeles'
    });
    function tick(){
      const parts = fmt.formatToParts(new Date());
      let h='--', m='--', s='--', dp='am';
      for (const p of parts){
        if (p.type === 'hour') h = p.value;
        else if (p.type === 'minute') m = p.value;
        else if (p.type === 'second') s = p.value;
        else if (p.type === 'dayPeriod') dp = String(p.value || 'am').toLowerCase();
      }
      timeEl.textContent = `${h}:${m}:${s}`;
      labelEl.textContent = `${dp} NST`;
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* =========================================================
     SEARCH — toggle on magnifier click + "/" keyboard shortcut.
  ========================================================= */
  (function searchToggle(){
    const toggle = root.querySelector('#npxSearchToggle');
    const form   = root.querySelector('#npxSearch');
    const inp    = root.querySelector('#npxSearchInput');
    if (!toggle || !form || !inp) return;

    let open = false;
    function setOpen(o){
      open = !!o;
      form.classList.toggle('open', open);
      if (open){
        setTimeout(() => { inp.focus(); inp.select(); }, 0);
      } else {
        inp.blur();
      }
    }
    toggle.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      setOpen(!open);
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Escape'){ e.preventDefault(); setOpen(false); }
    });
    document.addEventListener('pointerdown', (ev) => {
      if (!open) return;
      const path = ev.composedPath ? ev.composedPath() : [];
      if (path.some(n => n === toggle || n === form)) return;
      setOpen(false);
    }, true);
    document.addEventListener('keydown', (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      const isField = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (isField) return;
      e.preventDefault();
      setOpen(true);
    }, true);
  })();

  /* =========================================================
     BELL DROPDOWN — beta-style icon + title + text + time + X.
     Sources tried in order:
       1) Current DOM: #alerts li / #alertstab__2020 ul li (META — reliable)
       2) Fetch /nf.phtml (sometimes empty depending on context)
       3) Fetch / (H5 homepage, contains #alerts if logged in)
     5-minute cache in sessionStorage. Up to 8 alerts. X = local dismiss
     + tries to click the native .alert-x if present.
  ========================================================= */
  (function bellNotif(){
    const CACHE_KEY  = 'npqol_notifs_v2';
    const HIDDEN_KEY = 'npqol_notifs_hidden_v1';
    const CACHE_TTL  = 5 * 60 * 1000;
    const MAX_ITEMS  = 8;
    const FALLBACK_ICON = 'https://images.neopets.com/themes/h5/basic/images/bell-icon.svg';
    const bell = root.querySelector('#npxBell');
    const dot  = root.querySelector('#npxBellDot');
    if (!bell || !dot) return;

    const menu = document.createElement('div');
    menu.className = 'bellMenu';
    menu.innerHTML = `
      <div class="bellHead">
        <h3>Alerts</h3>
        <a href="https://www.neopets.com/allevents.phtml">See all</a>
      </div>
      <div class="bellList" id="npxBellList">
        <div class="bellEmpty">Loading…</div>
      </div>
    `;
    root.appendChild(menu);

    function cleanText(t){
      return (t||'')
        .replace(/»\s*See all alerts\s*«/i,'')
        .replace(/\s+/g,' ').trim();
    }
    function esc(s){
      return String(s||'').replace(/[&<>"']/g, c => (
        { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
      ));
    }
    function readHidden(){
      try { return new Set(JSON.parse(sessionStorage.getItem(HIDDEN_KEY) || '[]')); }
      catch { return new Set(); }
    }
    function writeHidden(set){
      try { sessionStorage.setItem(HIDDEN_KEY, JSON.stringify([...set])); } catch {}
    }
    function alertKey(a){
      return a.delid || a.href || (a.title + '|' + a.text);
    }
    /* Adds &delevent=yes (or ?delevent=yes) to a Neopets href —
       that's the native CLASSIC mechanism to delete the event when
       the user follows the link. */
    function withDelevent(href){
      if (!href || /[?&]delevent=yes\b/i.test(href)) return href;
      const sep = href.includes('?') ? '&' : '?';
      return href + sep + 'delevent=yes';
    }
    /* Dismiss an alert server-side — best-effort.
       Strategies tried in parallel (cheap, silent):
        - GET <href>&delevent=yes  (classic — also works on META)
        - If data-delid is present: click the native
          .alert-x[data-delid=...] element (on META, that triggers
          the official AJAX handler) */
    function dismissOnServer(a){
      try {
        const rawHref = a.href.startsWith('http') ? a.href : ('https://www.neopets.com' + (a.href.startsWith('/') ? '' : '/') + a.href);
        // Only fire the dismiss request against neopets.com itself — otherwise
        // a malformed/injected href could be turned into an outbound request
        // against an arbitrary domain.
        const u = new URL(rawHref);
        if (/(^|\.)neopets\.com$/i.test(u.hostname)){
          fetch(withDelevent(rawHref), { credentials:'same-origin', cache:'no-store', method:'GET' })
            .then(r => npNote403(r))
            .catch(() => {});
        }
      } catch {}
      if (a.delid){
        try {
          // CSS.escape guards against attribute injection if delid contains quotes.
          const native = document.querySelector(`.alert-x[data-delid="${CSS.escape(a.delid)}"]`);
          if (native) native.click();
        } catch {}
      }
    }
    const TRASH_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1.08l-1.2 12.03A3 3 0 0 1 14.74 22H9.26a3 3 0 0 1-2.98-2.97L5.08 7H4a1 1 0 1 1 0-2h4V4a1 1 0 0 1 1-1Zm1 2h4V4h-4v1Zm-2.92 2l1.17 11.77A1 1 0 0 0 9.26 20h5.48a1 1 0 0 0 1-1.03L16.92 7H7.08ZM10 9a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0v-7a1 1 0 0 1 1-1Z"/></svg>';

    /* Extract a <li> into an alert object.
       `live=true` → we're reading the current page: we can use
       getComputedStyle to grab the real icon URL (beta icons
       come from background-image on the element). */
    function extractAlertFromLi(li, live){
      const a    = li.querySelector('a[href]');
      const h4   = li.querySelector('h4');
      const p    = li.querySelector('p');
      const h5   = li.querySelector('h5');
      const iconEl = li.querySelector('.alerts-tab-item-icon__2020, [class*="alerts-tab-eventcode-"]');
      const xEl  = li.querySelector('.alert-x');

      let iconUrl = '';
      if (iconEl && live){
        const bg = getComputedStyle(iconEl).backgroundImage || '';
        const m  = bg.match(/url\((['"]?)(.*?)\1\)/);
        if (m && m[2] && m[2] !== 'none') iconUrl = m[2];
      }
      if (!iconUrl && iconEl){
        const titleStr = (h4?.textContent || '').trim().toLowerCase();
        const known = ['neomail','events','battledome','guild','trade','auction','council'];
        const hit = known.find(k => titleStr.includes(k));
        if (hit) iconUrl = `https://images.neopets.com/alerts/${hit}.png`;
      }

      return {
        href:  a?.getAttribute('href') || 'https://www.neopets.com/allevents.phtml',
        title: (h4?.textContent || 'Notification').trim(),
        text:  cleanText(p?.textContent || ''),
        time:  (h5?.textContent || '').trim(),
        icon:  iconUrl || FALLBACK_ICON,
        delid: xEl?.getAttribute('data-delid') || '',
      };
    }

    function readFromCurrentPage(){
      const lis = document.querySelectorAll('#alerts li, #alertstab__2020 ul li');
      if (!lis.length) return null;
      return [...lis].slice(0, MAX_ITEMS).map(li => extractAlertFromLi(li, true));
    }
    function readFromClassicPage(){
      // CLASSIC only exposes a single alert (the last one) via td.eventIcon.
      const td = document.querySelector('td.eventIcon, td.eventIcon.sf');
      if (!td) return null;
      const a   = td.querySelector('a[href]');
      const img = td.querySelector('img');
      const bld = td.querySelector('b');
      const raw = (td.innerText || '');
      const title = (bld?.textContent || '').trim();
      const text = cleanText(raw.replace(bld?.textContent || '', '').replace(/»\s*See all events\s*«/i,''));
      // Some classic pages ship an EMPTY td.eventIcon cell even with zero
      // events. Rendering it produced a phantom red dot for the 1-2s until
      // the network refresh replaced it with the real (empty) list. Only
      // treat the cell as an alert when it carries actual content.
      if (!title && !text) return null;
      return [{
        href:  a?.getAttribute('href') || 'https://www.neopets.com/allevents.phtml',
        title: title || 'Notification',
        text:  text,
        time:  '',
        icon:  img?.getAttribute('src') || FALLBACK_ICON,
        delid: '',
      }];
    }
    function parseHtmlForAlerts(html){
      const dom = new DOMParser().parseFromString(html, 'text/html');
      const lis = dom.querySelectorAll('#alerts li, #alertstab__2020 ul li');
      if (!lis.length){
        // Distinguish "alerts module present but EMPTY" (a definitive
        // "no alerts" answer → []) from "alerts markup absent from this
        // page" (null → the caller may probe another page).
        const container = dom.querySelector('#alerts, #alertstab__2020');
        return container ? [] : null;
      }
      return [...lis].slice(0, MAX_ITEMS).map(li => extractAlertFromLi(li, false));
    }
    async function fetchUrl(url){
      if (np403BackoffActive()) return null;
      try {
        const res = await fetch(url, { credentials:'same-origin', cache:'no-store' });
        npNote403(res);
        if (!res.ok) return null;
        return await res.text();
      } catch { return null; }
    }
    async function fetchNotifs(){
      let html = await fetchUrl('/nf.phtml');
      let alerts = html ? parseHtmlForAlerts(html) : null;
      // [] is truthy here — the alerts module was found and it is empty.
      // That's a real answer: do NOT burn a second request on '/'.
      if (alerts) return alerts;
      html = await fetchUrl('/');
      alerts = html ? parseHtmlForAlerts(html) : null;
      return alerts || [];
    }

    function readCache(){
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const j = JSON.parse(raw);
        if (!j?.t || (Date.now() - j.t) > CACHE_TTL) return null;
        return j.alerts;
      } catch { return null; }
    }
    function writeCache(alerts){
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), alerts })); } catch {}
    }

    function render(alerts){
      const list = menu.querySelector('#npxBellList');
      const hidden = readHidden();
      const visible = (alerts || []).filter(a => !hidden.has(alertKey(a)));

      if (!visible.length){
        list.innerHTML = `<div class="bellEmpty">No notifications.</div>`;
        dot.hidden = true;
        return;
      }
      list.innerHTML = visible.map((a, i) => `
        <a class="bellItem" href="${esc(withDelevent(a.href))}" data-idx="${i}">
          <div class="bellIcon" style="background-image:url('${esc(a.icon)}')"></div>
          <h4 class="bellTitle">${esc(a.title)}</h4>
          <p class="bellText">${esc(a.text)}</p>
          ${a.time ? `<h5 class="bellTime">${esc(a.time)}</h5>` : ''}
          <button type="button" class="bellX" title="Dismiss this notification" aria-label="Dismiss">${TRASH_SVG}</button>
        </a>
      `).join('');
      dot.textContent = String(visible.length);
      dot.hidden = false;

      list.querySelectorAll('.bellItem').forEach(item => {
        const idx = +item.dataset.idx;
        const alert = visible[idx];
        item.querySelector('.bellX').addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          dismissOnServer(alert);
          const h = readHidden();
          h.add(alertKey(alert));
          writeHidden(h);
          try { sessionStorage.removeItem(CACHE_KEY); } catch {}
          item.remove();
          if (!list.querySelector('.bellItem')){
            render(alerts);
          } else {
            const left = list.querySelectorAll('.bellItem').length;
            if (left > 0){ dot.textContent = String(left); }
            else { dot.hidden = true; }
          }
        });
      });
    }

    async function refresh(force = false){
      // 1) Current page (META)
      const fromPage = readFromCurrentPage();
      if (fromPage && fromPage.length){
        writeCache(fromPage);
        render(fromPage);
        return;
      }
      // 2) Current page (CLASSIC, single top alert)
      const fromClassic = readFromClassicPage();
      if (fromClassic && fromClassic.length){
        // Not written to cache (incomplete), just rendered.
        render(fromClassic);
        // Continue in the background to fetch the full list.
      }
      // 3) Cache — an EMPTY cached list is a valid result ("no alerts").
      // Treating [] as a miss made zero-alert users hit the network on
      // every single page load (up to 2 page fetches each time) — enough
      // extra traffic to trip Neopets' per-IP rate limiter, which then
      // serves 403 "You don't have permission to access" pages.
      if (!force){
        const cached = readCache();
        if (cached){
          if (!fromClassic) render(cached);
          return;
        }
      }
      // 4) Network
      const alerts = await fetchNotifs();
      writeCache(alerts);
      render(alerts);
    }

    let open = false;
    function setOpen(o){
      open = !!o;
      menu.style.display = open ? 'block' : 'none';
      if (open) refresh(false);
    }
    bell.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      setOpen(!open);
    });
    document.addEventListener('pointerdown', (ev) => {
      if (!open) return;
      const path = ev.composedPath ? ev.composedPath() : [];
      if (path.some(n => n === bell || n === menu)) return;
      setOpen(false);
    }, true);

    refresh(false);
  })();

  /* =========================================================
     Theme listener → refresh top-bar icons.
     <img data-icon="..."> tags get their src swapped; <img> tags
     without data-icon (e.g. fight = battledome) stay untouched.
  ========================================================= */
  function applyTopbarTheme(themeId){
    const iconUrl      = PW.__npBtnIconUrl;
    const attachFb     = PW.__npAttachBtnFallback;
    if (typeof iconUrl !== 'function') return;
    const all = root.querySelectorAll('img[data-icon]');
    all.forEach(img => {
      const name = img.dataset.icon;
      if (!name) return;
      if (typeof attachFb === 'function') attachFb(img, name);
      const newUrl = iconUrl(name, themeId);
      const broken = img.complete && img.naturalWidth === 0;
      // Skip the assignment if the URL is unchanged AND the image
      // is already painted — avoids a useless flicker on theme
      // change. Otherwise force a fresh fetch (clearing src first
      // because browsers no-op img.src = sameURL).
      if (img.src === newUrl && !broken) return;
      img.src = '';
      img.src = newUrl;
    });
  }
  document.addEventListener('np:btn-theme', (ev) => {
    const id = ev?.detail?.themeId;
    if (id) applyTopbarTheme(id);
  });

  /* Re-arm broken topbar icons on bfcache restore, full load, and
     tab visibility regain. Same rationale as #btnOverlay over in
     the HUD script: navigations can leave <img> nodes in a pending
     state that no event reports, and we want a passive recovery
     instead of "user opens the BG sidebar to make icons appear". */
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
  // Touch devices have no hover → the category menus must toggle on tap.
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
  // Tap/click anywhere outside the bar's buttons/menus closes every category
  // menu — pointerleave never fires on touch, so without this the menus
  // stayed open until a navigation.
  document.addEventListener('pointerdown', (ev) => {
    const path = ev.composedPath ? ev.composedPath() : [];
    if (path.some(n => n && n.classList &&
        (n.classList.contains('menu') || n.classList.contains('cat')))) return;
    closeAll();
  }, true);

  /* =========================================================
     FRAME RESIZE — drag the frame's RIGHT edge to set the content
     width, drag the BOTTOM edge to set the frame's min-height.
     Both persisted (npqol_frame_size_v1) and re-applied on every
     page. Double-click a handle to reset that axis to default.
     The width override still goes through the same clamp as the
     default --np-frame-width, so the frame can never overlap the
     HUD column or overflow the viewport.
  ========================================================= */
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
    // Apply persisted size at document-start so the very first paint uses it.
    applyW(); applyH();

    // Handle chrome lives in the page (not the shadow bar) — small style tag.
    const hStyle = document.createElement('style');
    hStyle.id = 'np-frame-resize-style';
    hStyle.textContent = `
      #npxFrameResizeR, #npxFrameResizeB{
        position:absolute;
        /* Below the HUD's icon columns (#btnOverlay, z 1000): the right
           column sits exactly ON the frame edge, and the icons must win
           the pointer over the resize strip. The handle stays usable on
           the rest of the edge. */
        z-index:900;
        background:transparent;
        touch-action:none;
      }
      #npxFrameResizeR{ width:14px; cursor:ew-resize; }
      #npxFrameResizeB{ height:14px; cursor:ns-resize; }
      /* Touch devices: widen the grab strips. */
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
    // The frame styling applies to every match; the VISIBLE frame is the
    // outermost one (e.g. classic: #main contains #content — pick #main).
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
      // Center each strip on the frame border using its LIVE width — the
      // old hardcoded -7 assumed the 14px desktop size and drifted off the
      // border with the 26px touch size (and any future width change).
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

    /* Width drag — the right edge follows the cursor. Incremental with a
       fresh rect each move (self-correcting): when the frame is centered a
       1px cursor move shifts the edge by 0.5px (both margins share the
       slack), so we scale the delta ×2 in that case. */
    let drag = null; // { axis:'w'|'h', pointerId }
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

  /* =========================================================
     FIRST-VISIBLE-CHILD ALIGNMENT — the CSS anti-blank-top rule
     zeroes `> :first-child`, but on many pages (neoboards, forum
     index…) the frame's literal first children are HIDDEN nodes
     (#navsub-buffer__2020, ad wrappers, <style>/<script>) — so the
     first VISIBLE element keeps its own top margin and the content
     starts lower than elsewhere. This walks the frame's children,
     finds the first one that actually renders in-flow, and zeroes
     its top margin (inline + !important, per the frame gotcha).
     padding-top is preserved on nested frame-list containers
     (classic #content keeps its interior 24px padding).
  ========================================================= */
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
        // Out-of-flow elements (popups, overlays) don't define the content top.
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
    // Late re-renders (Vue pages swap content after load).
    setTimeout(run, 800);
  })();

  /* =========================================================
     CUSTOM SCROLLBAR — replaces the hidden native bar.
     Accent-tinted, z-index below every panel/handle (the BG
     picker tab sits ABOVE it and stays clickable). Fully
     interactive: drag the thumb, click the track to jump,
     hovering the right edge reveals + widens it; it fades out
     when idle and unhovered. Wheel/keyboard scrolling untouched.
  ========================================================= */
  (function customScrollbar(){
    const M = 8; // track margins top/bottom (px)

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
      // Enabled in layout() only when the page actually scrolls, so the
      // strip never eats clicks on non-scrolling pages.
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

    /* Position + size the thumb; returns the geometry (null when the page
       doesn't scroll). Also flips the track's pointer-events accordingly. */
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
        dragOff = e.clientY - r.top;   // grab: keep the offset inside the thumb
      } else {
        dragOff = m.thH / 2;           // track click: center the thumb on it
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

  /* ╔══════════════════════════════════════════════════════════════╗
     ║  PART ② — HUD (user, bank, NP, quickref card, icon columns)  ║
     ╚══════════════════════════════════════════════════════════════╝ */
(function () {
  'use strict';
  // (iframe + host gates hoisted to the fusion prelude)
  if (document.getElementById('npHud')) return;

  /* =========================================================
     EARLY PRELOAD — fire the active pet image fetch at document-start
     so the network round-trip is in flight BEFORE the rest of the HUD
     (CSS, DOM mounting, qrModule init) blocks the main thread.

     We actually create a REAL <img> element here (not just a <link
     rel=preload>) and set its src right away. The browser starts the
     network fetch + image decode immediately. Later, when qrModule
     renders the active-pet card, it doesn't re-create the img — it
     just MOVES this pre-loaded element into the card (no second
     fetch, no decode, no transition delay).
  ========================================================= */
  /* Background-cache a CPN pet image as a data URL in localStorage.
     Called from preloadActivePet (first visit on this device) and from
     renderActivePetImage (when the active pet changes mid-session, e.g.
     after "Make Active"). The data URL becomes the FAST PATH on the
     next page load — no network, no DNS, no decode-from-bytes loop,
     just LS read + image-from-string decode in a single frame. */
  /* Last KNOWN-GOOD active-pet image URL (/cp/<sci>/<mood>/9.png form).
     Written every time we successfully resolve a sci-based URL; read as a
     fallback when the shared caches are missing. This is what keeps the HUD
     image stable when script 5's sandbox "refresh cache" button wipes
     jb_np_homedata_v2 — without it the HUD regressed to the cpn/<name>
     customised render (pet WITH its custom background) and cached that. */
  const ACTIVE_IMG_LS = 'npqol_active_pet_img_v1';
  function readLastGoodPetImg(){
    try { return JSON.parse(localStorage.getItem(ACTIVE_IMG_LS) || 'null'); }
    catch { return null; }
  }
  function saveLastGoodPetImg(name, url){
    if (!name || !url || !/\/cp\//.test(url)) return; // only sci-based URLs qualify
    try { localStorage.setItem(ACTIVE_IMG_LS, JSON.stringify({ name, url })); } catch {}
  }

  function _cacheRawPetImage(url){
    try {
      const cacheKey = 'npqol_pp_png:' + url;
      if (localStorage.getItem(cacheKey)) return; // already cached
      const probe = new Image();
      probe.crossOrigin = 'anonymous';
      probe.onload = () => {
        try {
          const cv = document.createElement('canvas');
          cv.width = probe.naturalWidth;
          cv.height = probe.naturalHeight;
          cv.getContext('2d').drawImage(probe, 0, 0);
          const out = cv.toDataURL('image/png');
          // Sanity cap so a freak-large image doesn't fill LS.
          if (out.length < 800000){
            try { localStorage.setItem(cacheKey, out); } catch {}
          }
        } catch {}  // canvas tainted (CORS denied) → silent fail; img still works
      };
      probe.src = url;
    } catch {}
  }

  // Resolve the active pet's SCI (Stored Customisation ID) by trying
  // every place the suite caches it, in order of recency. The SCI lets
  // us use the /cp/<sci>/<mood>/9.png URL — the exact one used by the
  // home page carousel AND by script 5's dollhouse, which renders the
  // pet WITHOUT its custom background (transparent PNG of just the pet
  // character). Smaller, faster, and HTTP-cache-shared with those pages.
  function _resolveActivePet(){
    // 1) Script 5's home-page snapshot — most reliable source, populated
    //    every time the user visits /quickref.phtml.
    try {
      const homeRaw = localStorage.getItem('jb_np_homedata_v2');
      if (homeRaw){
        const home = JSON.parse(homeRaw);
        if (home && home.data && Date.now() - (home.ts||0) < 7*24*3600*1000){
          // Find the active pet — we need its name from somewhere first.
          const qr = JSON.parse(localStorage.getItem('npqol_qr_data') || 'null');
          const name = qr?.data?.active?.name;
          if (name && home.data[name] && home.data[name].sci){
            return { name, sci: home.data[name].sci, mood: home.data[name].mood || '1' };
          }
        }
      }
    } catch {}
    // 2) Our own qr cache — populated by qrModule.refresh() after parse()
    //    extracts SCI from the quickref thumbnails.
    try {
      const qrRaw = localStorage.getItem('npqol_qr_data');
      if (qrRaw){
        const qr = JSON.parse(qrRaw);
        const name = qr?.data?.active?.name;
        const pets = qr?.data?.pets || [];
        const ap   = pets.find(p => p.isActive);
        if (name && ap?.sci) return { name, sci: ap.sci, mood: '1' };
        // No SCI in the qr cache → try the last known-good URL before
        // giving up (step 3), so a wiped homedata cache never downgrades
        // the image to the cpn customised render.
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
    // 3) Last known-good URL alone (caches wiped but we remember the pet).
    try {
      const lg = readLastGoodPetImg();
      if (lg && lg.name){
        const m = String(lg.url || '').match(/\/cp\/([^/]+)\/(\d+)\/9\.png/);
        if (m) return { name: lg.name, sci: m[1], mood: m[2] };
      }
    } catch {}
    return { name: '', sci: '', mood: '1' };
  }

  // If the qr cache was written by an older script version that didn't
  // include SCI (or that scanned the wrong attribute), invalidate the
  // fetch cooldown so qrModule re-fetches and rebuilds the cache with
  // SCI on the next refresh. We keep the stale DATA so the HUD can
  // still preload by name (otherwise the active card sits blank until
  // the fresh fetch completes 1-3s later). The user accepts a brief
  // /cpn/<name>/1/4.png customised render on the very first boot
  // after upgrade; subsequent boots use the SCI-rich cache.
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
      // Build the URL: /cp/<sci>/<mood>/9.png when SCI is known (the
      // "raw character pose" used by the home carousel & dollhouse,
      // no custom background, transparent PNG). Falls back to
      // /cpn/<name>/ only on the very first visit when no cache has
      // populated yet — with the parse() SCI extraction fixed, this
      // fallback path is rare in practice.
      const url = sci
        ? `https://pets.neopets.com/cp/${sci}/${mood}/9.png`
        : `https://pets.neopets.com/cpn/${encodeURIComponent(name)}/1/4.png`;
      if (sci) saveLastGoodPetImg(name, url);
      const cacheKey = 'npqol_pp_png:' + url;

      // FAST PATH — data URL cached in LS from a previous visit.
      // Loading a data URL is purely client-side: no network, no DNS,
      // no TCP/TLS, no HTTP. The image decodes in <50ms and paints in
      // the same frame as the rest of the HUD.
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

      // FIRST-VISIT CACHE WRITE — delay so it doesn't compete with the
      // visible img's fetch (which uses the same URL → HTTP cache reuse).
      if (!cached){
        setTimeout(() => _cacheRawPetImage(url), 1200);
      }

      // <link rel=preload> as a network-priority hint for first-visit
      // case (when cached is null). crossorigin="anonymous" matches the
      // probe above so they share the HTTP fetch.
      const link = document.createElement('link');
      link.rel = 'preload'; link.as = 'image'; link.href = url; link.crossOrigin = 'anonymous';
      (document.head || document.documentElement).appendChild(link);

      // Pre-warm petpet / petpetpet (rendered in the stats card).
      // (was `j?.data?.active` — `j` never existed in this scope, the
      // ReferenceError was silently swallowed by the try/catch and the
      // prewarm never ran. Read the qr cache it always meant to read.)
      const qrSnap = JSON.parse(localStorage.getItem('npqol_qr_data') || 'null');
      const a = qrSnap?.data?.active || {};
      [a.petpet, a.petpetpet].filter(Boolean).forEach(src => {
        const l = document.createElement('link');
        l.rel = 'preload'; l.as = 'image'; l.href = src; l.crossOrigin = 'anonymous';
        (document.head || document.documentElement).appendChild(l);
      });
    } catch {}
  })();

  /* =========================================================
     The shared icon-theme API (PW.__npBtnThemes*, helpers,
     np:btn-theme event) is exposed by the Core script which
     runs before the HUD. This script only listens to the event
     to refresh its central-column icons (see colsModule below).
  ========================================================= */

  /* ==========================================================
     BANK PIN.
     RECOMMENDED: leave this empty. The first time you click
     Withdraw, the script will prompt for your 4-digit PIN and
     store it in localStorage (this browser only). To clear it
     later, Alt+click the Withdraw button.
     You CAN hardcode it here for convenience, but if you ever
     share your script file you'll leak it — the LS path is
     safer and survives across script updates.
     In both cases the PIN never leaves your browser except
     when *you* click Withdraw.
  ========================================================== */
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

  /* =========================================================
     SHARED STYLE (glass + accent) — falls back if Core is absent.
  ========================================================= */
  const HUD_CSS = `
  #npHud{
    position:fixed;
    top:var(--np-hud-top, 10px);
    bottom:var(--np-hud-bottom, 10px);
    /* +6px on the left so the Dailies sidebar tab (left screen edge) never
       touches the cards — the right edge of the cards stays where it was. */
    left: calc(var(--np-hud-left, 20px) + 6px);
    /* HUD card width = decor column width minus left+right margins inside it
       (minus the 6px Dailies-tab clearance). Width updates live when the
       user drags the resize handle below. */
    width: calc(var(--np-col-width, 330px) - 2 * var(--np-hud-left, 20px) - 6px);
    z-index:var(--np-z-hud, 1000);
    display:flex;
    flex-direction:column;
    justify-content:space-between;
    gap:var(--np-gap, 10px);
    font-family:var(--np-font, system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif);
    color:var(--np-ink, #fff);
    -webkit-font-smoothing:antialiased;
    pointer-events:none;
    isolation:isolate;
  }
  #npHud > *{ pointer-events:auto; }
  #npHud *, #npHud *::before, #npHud *::after{ box-sizing:border-box; }

  /* Narrow viewports: hide entirely (no auto-shrink anymore — the user
     controls width via the resize handle). */
  @media (max-width: 900px){
    /* No side rail below this width, so the bar's painted surface goes
       back to full width. !important beats the inline value that
       applyTopbarBg() writes on the root. */
    :root{ --np-bar-inset-left:0px !important; }
    #npHud{ display: none; }
  }

  /* Resize handle — sits ON the decor bar's right border (the black 2px
     line separating the left column from the central content). The CSS
     left: calc(--np-col-width - 8px) keeps the 16px-wide hover zone
     centered exactly on that border at all times. */
  #npHudResizer{
    position:fixed;
    top:64px;          /* clears the top bar */
    bottom:8px;
    left: calc(var(--np-col-width, 330px) - 8px);
    width:16px;
    cursor:ew-resize;
    background:transparent;
    pointer-events:auto;
    z-index:1001;
  }
  #npHudResizer::after{
    /* Subtle vertical bar visible on hover/drag — sits on top of the
       decor bar's existing black border. */
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
  /* Hide the handle when the HUD is hidden — no point dragging an
     invisible column. */
  @media (max-width: 900px){
    #npHudResizer{ display:none; }
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

  /* ============ USER ============
     Two-column layout: the "X years played" shield occupies the LEFT 1/3
     of the card at full height (so the trophy reads big and prominent),
     and the RIGHT 2/3 stacks avatar / username / counts. The shield is
     fetched from /userlookup.phtml and cleaned via the same canvas
     pipeline used for petpets (transparent bg + soft outline). */
  #npUser{
    padding:10px;
    display:flex;
    align-items:stretch;
    gap:12px;
    min-height:110px;
    position:relative;
  }
  /* When the Years shield is hidden via Mini User settings, the card
     collapses to a single centered column. */
  #npUser.no-shield{
    align-items:center;
    justify-content:center;
  }
  #npUser.no-shield .shieldSlot{ display:none; }
  /* Individual info toggles. Each section can be hidden independently
     via Mini User settings; the others stay centered. */
  #npUser.hide-avatar .avatarSlot{ display:none; }
  #npUser.hide-username .name{ display:none; }
  /* Specificity trap fixed: the display:inline-flex rule further down
     (#npUser .meta .metaAv, 1-2-0) tied with the previous
     #npUser.hide-avatars .metaAv form (also 1-2-0) and, coming later in
     the sheet, silently WON — hiding a single count did nothing, and
     unchecking the second one nuked the whole row via the both-hidden
     rule below. That read as "avatar and stamp counts are linked". The
     .meta hop bumps these to 1-3-0 so they always win. */
  #npUser.hide-avatars .meta .metaAv{ display:none; }
  #npUser.hide-stamps .meta .metaSt{ display:none; }
  /* Hide the "·" separator when either side of it is hidden. */
  #npUser.hide-avatars .meta .sep,
  #npUser.hide-stamps  .meta .sep{ display:none; }
  /* Hide the whole meta row when BOTH counts are off. */
  #npUser.hide-avatars.hide-stamps .meta{ display:none; }
  #npUser .shieldSlot{
    flex:0 0 33%;
    display:flex; align-items:center; justify-content:center;
    min-width:0;
  }
  #npUser .shield{
    display:block;
    width:auto; height:100%;
    max-width:100%; max-height:120px;
    object-fit:contain;       /* shield asset is non-square (100×150) → keep aspect */
    opacity:0; transition:opacity .18s ease;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,.45));
  }
  #npUser .shield.loaded{ opacity:1; }
  /* If the shield image isn't available yet, collapse the left slot so
     the right side takes the full card width — no awkward empty column. */
  #npUser .shieldSlot:has(.shield:not([src])){
    flex:0 0 0;
    overflow:hidden;
  }
  #npUser .rightSide{
    flex:1 1 0;
    min-width:0;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:6px;
  }
  #npUser .avatarSlot{
    width:36px; height:36px;
    display:flex; align-items:center; justify-content:center;
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
    text-align:center;
    text-decoration:none !important; color:#fff !important;
    font-size:14px; font-weight:700;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    cursor:pointer !important;
    /* Defensive: ensure clicks land on this anchor even on beta pages
       where Vue overlays might sit at higher z-index than the HUD card. */
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
    display:flex; align-items:baseline; gap:6px; flex-wrap:wrap;
    justify-content:center;
    font-size:11px; font-weight:500; line-height:1.1;
    min-width:0;
  }
  /* Inner inline-flex so label and value have their own gap and don't
     glue together ("Avatars449" → "Avatars 449"). */
  #npUser .meta .metaAv,
  #npUser .meta .metaSt{
    display:inline-flex;
    align-items:baseline;
    gap:4px;
  }
  #npUser .meta .k{ opacity:.62; }
  #npUser .meta .sep{ opacity:.40; padding:0 1px; }
  #npUser .spinner{ position:absolute; top:6px; right:6px; display:none; }
  #npUser.loading{ cursor:progress; }
  #npUser.loading .spinner{ display:block; }

  /* ============ BANK ============ */
  #npBank{ padding:10px 12px; }
  /* 3-column grid: empty spacer | centered title | gear. The spacer
     mirrors the gear's width so the title sits dead center. */
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
    font-size:14px; font-weight:600; line-height:1; opacity:.95;
  }
  /* ⚙ + ↻ use the shared absolute top-right .cardGear/.cardRefresh pair
     (same placement as the User and QuickRef cards — the head grid keeps
     its empty 26px side columns so the title stays dead center). */
  /* Title behaves like the username: hover underline + the card click
     opens /bank.phtml. Same affordance on the QuickRef pet name below. */
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
  /* Daily delta — green for net deposits today, red for net withdrawals.
     Hidden via empty content (no margin reserved). */
  #npBank .dailyDelta{
    display:inline-flex; gap:6px; align-items:baseline;
    font-size:11px; font-weight:600; line-height:1;
    font-variant-numeric:tabular-nums;
    opacity:.95;
  }
  #npBank .dailyDelta:empty{ display:none; }
  #npBank .dailyDelta .dgain{ color:#7be08e; }
  #npBank .dailyDelta .dloss{ color:#ff8a8a; }
  /* Collect interest = important alert (daily reset at 9am Paris time).
     Red border + pulse + glow, animation pauses when display:none. */
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
  /* Dynamic two-column button layout — deposit-class buttons stack
     in the left column, withdraw-class buttons in the right column.
     User-resizable HUD width: the columns just keep splitting 50/50,
     which is more predictable than auto-fit ever was. */
  #npBank .bankBtns{
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap:8px;
    align-items:start;
  }
  #npBank .bankBtns:empty{ display:none; }
  #npBank .bankCol{
    display:flex; flex-direction:column; gap:8px;
    min-width:0; /* allow children to shrink (required for inline custom form) */
  }
  #npBank .bankCol:empty{ display:none; }
  /* Force a fixed height on every button cell so the custom-amount form
     (when it replaces a button) doesn't push siblings or wrap. */
  #npBank .bankBtns .npBtn{ width:100%; height:30px; padding:0 8px; }
  /* Inline custom-amount form — fills the SINGLE cell the button used
     to occupy. No grid-column expansion, no row jump: input + ✓ button
     share the cell's 100% width via flex with min-width:0 on the input. */
  #npBank .bankCustomForm{
    display:flex; align-items:stretch; gap:3px;
    width:100%; height:30px;
    box-sizing:border-box;
  }
  #npBank .bankCustomForm input{
    flex:1 1 0;            /* basis 0 + grow 1 → fills only the remaining space */
    min-width:0;           /* required, or the input refuses to shrink below content */
    width:0;               /* paired with flex:1 1 0, keeps it strictly fluid */
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
    color:#1a1330;
    border:0; border-radius:var(--np-radius-sm, 10px);
    font-weight:800; font-size:13px;
    cursor:pointer;
  }
  #npBank .bankCustomForm .ok:hover{ filter:brightness(1.08); }
  #npBank .msg{ font-size:11px; opacity:.62; text-align:center; min-height:12px; }
  #npBank .msg:empty{ display:none; }
  #npBank .disabled{ opacity:.55; cursor:not-allowed; pointer-events:none; }

  /* Optional NP-balance line chart under the balance row. Hidden when
     the user hasn't enabled it in Mini Bank settings (settings.graph
     .enabled=false → JS leaves the div empty → :empty rule below
     collapses it so no extra vertical space is taken). */
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
  /* Axis labels — small monospaced numerics so they don't bounce around
     when the value goes from "1k" to "1.2k". */
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
  /* Faint baseline grid for min/max so the user can read the values. */
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

  /* ============ BANK SETTINGS MODAL ============ */
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
    /* No max-height / overflow: the modal sizes to its content so every
       option is visible without scrolling. The popup is centered in a
       flex backdrop so it stays on screen even on short viewports. */
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
  /* Sub-fields stack VERTICALLY (label above field) so the field always
     gets the row's full width — labels like "Round to:" never wrap, and
     no horizontal scroll appears when the column is narrow. */
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

  /* Generic per-card "⚙ settings" button used by #npUser and
     #npQrActive. Tucked in the top-right corner, fades in on hover,
     rotates on hover for a touch of feedback. */
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

  /* Companion "↻ refresh cache" button — same hover-reveal treatment as the
     gear, sitting just left of it. Every card (User / Bank / QuickRef) gets
     the same pair on hover: ↻ refetch + ⚙ settings. */
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

  /* Compact-row variant for settings modals that only need a single
     column of toggles (User and QuickRef). */
  .bankSettingsBody.bankSettingsBodySingle{
    grid-template-columns: 1fr;
  }
  .bankSettingsRow.toggleOnly{ padding:6px 10px; }
  .bankSettingsRow.toggleOnly .topLine{ gap:10px; }

  /* ============ QUICKREF (active card) ============ */
  /* No max-height: the card grows to fit ALL its content. flex:0 0 auto
     (set below in the global rule) keeps the card from being squeezed
     by the active-pet card's growth at wide sidebar widths. The active
     pet image absorbs the slack via flex:1 1 auto + min-height:0. */
  #npQrActive{
    min-height:150px; padding:10px 12px;
    display:flex; flex-direction:column; align-items:center; justify-content:flex-start; text-align:center;
    gap:4px;
  }
  #npQrActive h3{ margin:0 0 6px 0; font-size:14px; font-weight:600; width:100%; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; }
  /* Pet name = link affordance, like the username: hover underline, and
     the card click already opens /quickref.phtml. */
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
  /* When only one of petpet / petpetpet is shown (the other was
     unchecked in QR settings) the 46% cap was inherited from the
     2-image layout and made the single image look tiny. With
     :only-child we relax the cap so it occupies the room it has. */
  #npQrActive .qrPP .qrPPimg:only-child{ max-width: 92%; height: 96px; }

  /* Neopets-themed display font, loaded once for the HUD. Used for the
     labels the user marked as "important": username, Bank title, and
     pet names in the dock overlay. */
  @font-face {
    font-family: 'CafeteriaBlack';
    src: url('https://images.neopets.com/js/fonts/cafeteria-black.otf') format('opentype');
    font-display: swap;
  }

  /* QUICKREF hover dock — full-sidebar gallery that emerges from the
     active pet's position. Two synchronized animations:
       1) the dock GROWS upward from its initial "active-pet-sized" footprint
          to the full sidebar height (height transition on #qrDockWrap),
       2) the tiles INSIDE redistribute (active tile shrinks, others
          expand from 0) via flex-grow transitions on .qrPet.
     The result reads as "active pet image fluidly resizes to its tile
     size, others unfold above it" — exactly what the user asked for. */
  #qrDockWrap{
    position: fixed;
    /* Sits INSIDE the decor sidebar's 2px black border (defined in script
       3 on #npLeftBar). The 2px inset on all four sides preserves the
       sidebar's black frame around the dock. */
    left: 2px;
    width: calc(var(--np-col-width, 330px) - 4px);
    bottom: 2px;
    /* Top is animated, bottom stays anchored → the dock grows upward from
       its initial "active-pet-sized" footprint. Initial top is calculated
       so that the collapsed dock sits exactly where #npActivePet was. */
    --collapsed-h: calc(var(--np-col-width, 330px) - 2 * var(--np-hud-left, 20px));
    top: calc(100vh - var(--collapsed-h) - 2px);
    z-index: calc(var(--np-z-hud, 1000) + 1);  /* above HUD cards */
    pointer-events: none;
    opacity: 0;
    overflow: hidden;
    transition:
      top .45s cubic-bezier(.22, 1, .36, 1),
      opacity .28s ease;
  }
  #qrDockWrap.open{
    /* Open: top docks to 2px (inside the sidebar top border) — full
       vertical span minus 4px (2px each for top + bottom borders). */
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
    background: rgba(20, 14, 32, 0.95);  /* near-opaque so HUD cards behind don't bleed through */
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
    /* Initial state: collapsed (no height, invisible). Only the active
       tile (rule below) defaults to flex-grow:1 so it occupies the entire
       initial dock height (= same footprint as #npActivePet). */
    flex-grow: 0;
    flex-shrink: 1;
    flex-basis: 0;
    opacity: 0;
    transition:
      flex-grow .45s cubic-bezier(.22, 1, .36, 1),
      opacity .3s ease;
  }
  .qrPet.active{
    /* Active tile owns 100% of the collapsed dock height. Once .open is
       applied, all tiles share flex-grow:1 → active shrinks to 1/N. */
    flex-grow: 1;
    opacity: 1;
  }
  #qrDockWrap.open .qrPet{
    flex-grow: 1;
    opacity: 1;
  }
  /* Subtle accent ring on the active tile. */
  .qrPet.active{
    box-shadow: inset 0 0 0 2px var(--np-accent, #dcb8ff);
  }
  /* 2px black divider between consecutive pet tiles — matches the
     sidebar's outer border thickness so the dock reads as one block
     divided by the same line weight throughout. */
  .qrPet + .qrPet{ border-top: 2px solid #000; }
  .qrPet:hover{ filter: brightness(1.10); }
  .qrOverlay{
    position:absolute; inset:0;
    padding: 8px;
    display:flex; flex-direction:column; gap:6px;
    justify-content: center;
    /* Lower opacity vs previous .72 so the pet image stays readable under
       the "Make Active" prompt. */
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
    /* Neopets-themed font for pet names in the overlay. */
    font-family: 'CafeteriaBlack', var(--np-font, system-ui), sans-serif;
    font-size: 20px; font-weight: 400; color: #fff;
    text-align: center; padding: 0 4px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    letter-spacing: .02em;
    text-shadow: 0 1px 2px rgba(0,0,0,.7);
  }

  /* When the dock is open, fade out the OTHER HUD cards (User, Bank,
     NP, Stats) and the original active pet card. The dock itself takes
     over the visible sidebar surface, giving the impression that the
     entire sidebar transformed into the pet gallery. */
  body.npDockActive #npUser,
  body.npDockActive #npBank,
  body.npDockActive #npNp,
  body.npDockActive #npQrActive,
  body.npDockActive #npActivePet{
    opacity: 0;
    pointer-events: none;
    transition: opacity .25s ease;
  }

  /* Neopets-themed font applied ONLY to the labels the user designates
     as "titles": username, Bank header, active pet name in stats card.
     Numeric/operational text (bank balance, interest, NP on hand) keeps
     the system font so digits stay tightly readable. */
  #npUser .name #npUserTitle,
  #npBank .title,
  #npQrActive h3{
    font-family: 'CafeteriaBlack', var(--np-font, system-ui), sans-serif;
    font-weight: 400;
    letter-spacing: .02em;
    font-size: 20px;
    line-height: 1.1;
  }

  /* ============ NP (neopoints) ============ */
  #npNp{ padding:8px 12px; display:flex; align-items:center; justify-content:center; gap:8px; font-size:14px; font-weight:700; }
  #npNp .npVal{ font-variant-numeric:tabular-nums; }
  #npNp img{ width:24px; height:24px; display:block; flex:0 0 24px; }
  #npNp.dim{ opacity:.6; }

  /* ============ ACTIVE PET IMAGE ============
     The active pet card is the visual "slack" of the HUD: it fills
     whatever vertical space the info cards (user / bank / NP / stats)
     leave free, with the pet image floating on the decor sidebar (no
     surrounding glass box).
     SIZING — capped to the image's INTRINSIC pixel size so a small
     pet (e.g. baby/petpet-sized PNG) is never upscaled and never
     blurs. width/height:auto + max-w/h:100% lets the image shrink
     when the container is smaller than its natural size, but never
     grow past its natural pixels. The parent is a flex centering
     container so the image stays centered regardless of size. */
  #npActivePet{
    flex: 1 1 auto;
    min-height: 0;
    padding:0;
    overflow:hidden;
    cursor:pointer;
    position:relative;
    display:flex;
    align-items:center;
    justify-content:center;
    /* Strip .npCard inherited chrome — pet is transparent, it should
       float on the decor sidebar, not sit in a glass box. */
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  #npActivePet:hover{
    background: transparent;
    border-color: transparent;
  }
  #npActivePet img{
    /* width/height:auto + max-w/h:100% = "shrink to fit, never grow
       past natural size". Combined with the flex centering above this
       gives perfect proportional scaling with no upscale blur.
       transform:scale(.8) reduces the visible pet by 20% across the
       board (big pets, small pets, all consistent) without breaking
       the no-upscale logic above — the image still picks its own
       natural pixel size first, the transform just shrinks the paint. */
    width:auto; height:auto;
    max-width:100%; max-height:100%;
    transform: scale(0.8);
    transform-origin: center center;
    display:block;
    opacity:0; transition:opacity .18s ease;
  }
  #npActivePet img.loaded{ opacity:1; }

  /* ============ TOUCH / TABLET (no hover) ============
     Hover-revealed controls are unreachable on touch screens — show them
     at rest instead. The pet-switch overlay ("Make Active") also becomes
     visible so the dock stays usable on iPad. */
  @media (hover: none){
    .npCard .cardGear, .npCard .cardRefresh{ opacity:.85; }
    .qrOverlay{
      opacity:1;
      pointer-events:auto;
      background:rgba(0,0,0,.30);
    }
  }
  /* Wider grab strip for the column resize handle on touch devices. */
  @media (pointer: coarse){
    #npHudResizer{ width:28px; left: calc(var(--np-col-width, 330px) - 14px); }
  }

  /* The four info cards lock to their natural content height — flex:0 0 auto
     prevents them from being squeezed below their min-height when the active
     pet card (flex:1 1 auto above) tries to grow. This is what keeps every
     label / value visible regardless of the user-resized sidebar width. */
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

  /* =========================================================
     CONTAINER + MOUNT
  ========================================================= */
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

  // EARLY ADOPT: if we created a pre-loaded <img> at document-start
  // (preloadActivePet), attach it to the active-pet card RIGHT NOW so
  // it's already in the DOM tree by the time mountAll appends the HUD
  // to <body>. When the Stylus FOUC rule reveals body at ~150ms, the
  // image is already painted — no "appears then disappears" flicker
  // waiting for qrModule's applyData() to run.
  if (_earlyActivePetImg){
    cardActivePet.appendChild(_earlyActivePetImg);
    // Don't null it yet — qrModule's renderActivePetImage checks the
    // existing img by dataset.forName and skips re-setting src if it
    // already matches the cached active pet (avoids the late flicker).
  }

  hud.append(cardUser, cardBank, cardNp, cardQr, cardActivePet);

  /* ====== Resize-state bootstrap (run BEFORE anything else) ======
     Read the persisted column width from LS and apply it to :root, so
     that the rest of the page (HUD card width, decor bar, etc.) renders
     at the right size on the very first frame. Wrapped in try/catch so a
     storage error can never block the rest of the HUD from rendering. */
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
  // Tiles are created dynamically in renderDock() based on the actual
  // number of inactive pets — no need to pre-allocate placeholders.
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

  /* ====== Resize handle (UI portion) ======
     Runs AFTER mountAll so a bug here can never prevent the HUD from
     mounting. Everything inside is wrapped in try/catch for safety.
     The persisted width was already applied to --np-col-width above. */
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

    // Double-click on the handle = reset to default.
    resizer.addEventListener('dblclick', () => {
      resizeCurrentW = RESIZE_DEFAULT;
      applyResizeW(resizeCurrentW);
      saveResizeW(resizeCurrentW);
    });
  } catch (err) {
    // Resize UI failed to set up — the HUD itself still works.
    console.warn('[npqol HUD] resize handle setup failed:', err);
  }

  /* =========================================================
     USER MODULE
     Reads the logged-in username from PW.appInsightsUserName.
     We deliberately NEVER scan ?user= in the URL — that gives
     other people's usernames when looking at their lookups.
  ========================================================= */
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
      // Only reliable signal of the LOGGED-IN user. We don't scan ?user=.
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
    /* ===== Mini User settings — which info segments show inside
       #npUser. Defaults: everything on. Persisted to LS. */
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
      // Shield ("X years badge"). The raw image is a JPEG-on-white from
      // images.neopets.com, so we show it raw first and then try to swap
      // in a cleaned PNG (transparent bg + soft outline) via the same
      // pipeline used for petpets. cleanImg is exposed on window by
      // qrModule once it has initialised; we poll briefly in case the
      // first render happens before qrModule runs.
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
            const fn = PW.__npCleanImg;
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
      // "Years played" shield. URL pattern on classic userlookup is
      //   https://images.neopets.com/images/shields/XX_X_years.gif?v=2
      // where XX = age in years and X = sub-version. We capture the
      // full URL (with query string) to preserve cache-busting.
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

    // Uniform card behavior: clicking the card (or the title) OPENS the
    // page it represents — here the user's own lookup. The data refetch
    // moved to the hover ↻ button (same pattern on Bank and QuickRef).
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
    // Force navigation when the username is clicked. Bound on `document`
    // at capture phase rather than on cardUser so the handler still
    // fires on beta pages where Vue/React overlays sometimes sit on top
    // of #npHud and would otherwise eat the click before it bubbles up.
    // Also handles middle-click (auxclick) and right-click (contextmenu)
    // → both open the userlookup in a new tab.
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
      if (e.button !== 1) return; // middle button only
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
    // Apply persisted user-card visibility prefs at boot.
    applyUserSettings();
    // Wire the ⚙ button on cardUser.
    const userGear = cardUser.querySelector('#npUserGear');
    if (userGear){
      userGear.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        openUserSettings();
      });
    }

    ensureUsername(); hydrate(); waitForGlobal();
  })();

  /* =========================================================
     BANK MODULE
     Fully user-configurable Mini Bank: enable/disable any of
     five button types (Rounded Deposit / Custom Deposit / Auto
     Deposit / Custom Withdraw / Auto Withdraw) from a settings
     modal (⚙ button in the card header).
     Daily balance delta (+gained / -lost) is shown next to the
     bank balance and resets at midnight NST. All actions are
     explicit clicks — no polling, no scheduled actions.
  ========================================================= */
  (function bankModule(){
    const STORE = 'npqol_bank_state_v2';
    const SETTINGS_LS = 'npqol_bank_btn_settings_v1';
    const DAILY_LS    = 'npqol_bank_daily_v1';
    const FORM_TTL = 5*60*1000;      // refetch forms older than this (fresh _ref_ck token)
    const RECHECK_MS = 5*60*1000;    // periodic re-check (cross-reset)
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

    /* ===== Button settings (which buttons appear, with what params) =====
       Defaults reproduce the legacy two-button setup: Rounded Deposit
       (100k) + Auto Withdraw (500k). Anything else is opt-in. */
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
      // Optional inline SVG line chart of the bank balance over the
      // last ~30 daily snapshots. Off by default to keep the card
      // minimal; the user enables it via the ⚙ settings modal.
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

    // History of daily bank balances for the optional graph — one entry per
    // NST calendar day, the last one kept live for "today". Kept to ~180
    // entries → ~6 months of data, well under LS limits even with bigint
    // balances. Format: [{ d:'YYYY-MM-DD', b:Number }, …].
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
      // Replace the entry for this date if it already exists (multiple
      // observations same day → only the last balance matters).
      const idx = hist.findIndex(e => e.d === dateKey);
      if (idx >= 0) hist[idx] = { d: dateKey, b: balance };
      else hist.push({ d: dateKey, b: balance });
      saveHistory(hist);
    }

    /* ===== Daily delta (resets at midnight NST = America/Los_Angeles) =====
       Tracks every observed bank-balance change between two refreshBank()
       calls, including interest and transactions made directly on
       /bank.phtml outside this script. */
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
        // Day rollover. Persist YESTERDAY's final balance into the
        // history log before resetting — this is what the optional graph
        // feeds on. We also push TODAY's first balance so even brand-new
        // installs get at least one data point.
        if (daily.date && daily.lastSeen != null){
          pushHistory(daily.date, daily.lastSeen);
        }
        pushHistory(today, n);
        // First observation of a new NST day → set baseline, no delta yet.
        daily = { date: today, baseline: n, gained: 0, lost: 0, lastSeen: n };
        saveDaily();
        return;
      }
      // Same-day re-observation — keep the history entry for "today"
      // current with the most recent balance so the graph's right edge
      // reflects the live value, not a stale morning snapshot.
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

    /* "Bank day" helper (Paris time). Interest resets at 9am Europe/Paris.
       A bank day starts at 9am Paris and ends at 9am Paris the next day.
       If bankDayKey(lastFetch) != bankDayKey(now), a reset happened in
       between → refetch /bank.phtml to check whether Collect is available. */
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
      // If we're before 9am Paris, attribute to the previous bank day.
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

    // Compact number formatter for the daily delta. 12345 → "12.3k", 1500000 → "1.5M".
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
      // Day rollover at NST midnight — reset if we crossed.
      if (daily.date && daily.date !== nstDateKey()){
        daily = { date: nstDateKey(), baseline: daily.lastSeen, gained: 0, lost: 0, lastSeen: daily.lastSeen };
        saveDaily();
      }
      // Net = total deposited today minus total withdrawn today.
      // Captures everything that moves the bank balance, including
      // interest collected and transactions made on /bank.phtml itself.
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
      // Interest button — now includes the annual rate when known, so the
      // rate has a home without the standalone "12.5%" hint that lived in
      // the card header (replaced by the ⚙ settings button).
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

    /* Optional inline SVG line chart of the bank balance with min/max
       NP labels on the left and date labels at the bottom. Driven
       entirely by client-side state (HISTORY_LS in localStorage,
       populated by noteBalance on each day rollover), so no network
       calls are added.
       To make the graph visible IMMEDIATELY on first install we don't
       wait for a multi-day history — we synthesize today's curve from
       (baseline at first observation) + (current balance), giving at
       least 1 point on day-zero with 0 transactions and 2 points on
       day-zero with any movement. Past days then accumulate one entry
       each from the history log. */
    function renderGraph(){
      if (!graphEl) return;
      if (!settings?.graph?.enabled){
        graphEl.innerHTML = '';
        return;
      }
      // One point per NST calendar day. noteBalance() keeps the history log
      // current — including a live-updating entry for TODAY — so we can plot
      // it directly, in order.
      //
      // This is the fix for the "3 arbitrary points / forgets older data"
      // report: the old code plotted the history AND then appended TWO extra
      // points for today (baseline + current balance). On a 2-day-old install
      // that produced exactly 3 points, two of them stacked on "today" with
      // index-based spacing, which looked like a random cutoff. Plotting the
      // day log straight makes the axis uniform (1 slot = 1 day) and the line
      // grows by one point each day the user opens their bank.
      const hist = loadHistory();
      const points = [];
      hist.forEach(e => {
        const b = Number(e.b);
        if (Number.isFinite(b)) points.push({ d: e.d, b });
      });
      // Guarantee left-to-right chronological order (YYYY-MM-DD sorts lexically
      // = chronologically) so the line never zig-zags if entries were stored
      // out of order.
      points.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
      if (points.length === 0){
        graphEl.innerHTML = '<div class="gEmpty">Open your bank once to start recording — one point is added per day.</div>';
        return;
      }

      // SVG viewport reserves space for the axes: 36px left for NP
      // labels (formatShort outputs up to 5 chars like "1.2M"), 11px
      // bottom for date labels, 6px top + 4px right for breathing room.
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

      // Y-axis labels — min at the baseline, max at the top. When
      // min===max (flat) we draw a single label in the middle so the
      // user still sees the current value as scale reference.
      const yMaxText = formatShort(max);
      const yMinText = formatShort(min);
      const yLabelsSvg = (max === min)
        ? `<text class="axisY" x="${ML - 3}" y="${MT + innerH/2 + 2.5}">${yMaxText}</text>`
        : (
          `<text class="axisY" x="${ML - 3}" y="${MT + 3}">${yMaxText}</text>` +
          `<text class="axisY" x="${ML - 3}" y="${MT + innerH}">${yMinText}</text>`
        );

      // X-axis labels: first date on the left, last date on the right.
      const firstDate = fmtDate(points[0].d);
      const lastDate  = fmtDate(points[points.length - 1].d);
      const xLabelsSvg = (firstDate === lastDate)
        ? `<text class="axisX" x="${ML + innerW/2}" y="${H - 2}">${firstDate}</text>`
        : (
          `<text class="axisXLeft" x="${ML}" y="${H - 2}">${firstDate}</text>` +
          `<text class="axisXRight" x="${ML + innerW}" y="${H - 2}">${lastDate}</text>`
        );

      // Dashed grid lines at top and bottom for the min/max anchor.
      const gridSvg = (max === min)
        ? `<line class="gridLine" x1="${ML}" y1="${MT + innerH/2}" x2="${ML + innerW}" y2="${MT + innerH/2}"/>`
        : (
          `<line class="gridLine" x1="${ML}" y1="${MT}" x2="${ML + innerW}" y2="${MT}"/>` +
          `<line class="gridLine" x1="${ML}" y1="${MT + innerH}" x2="${ML + innerW}" y2="${MT + innerH}"/>`
        );

      // Single-point graph → centered dot, axes still drawn for context.
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

      // 2+ points → polyline + area fill anchored in the inner area.
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

    // NP on hand: native counter (still present even though Core hides it),
    // falling back to last cached value.
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
        noteBalance(bal); // feed the daily delta tracker
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
      // #frmCollectInterest only exists in the page when there's something to collect.
      const intF = doc.querySelector('#frmCollectInterest');
      if (intF) out.interest = grabForm(intF, null);
      // Daily amount — always present in #txtDailyInterest, format e.g. "Daily Interest: 206,754 NP"
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
      // User-initiated money action: never blocked by the backoff, but a
      // 403 answer still arms it (the site is throttling this IP).
      npNote403(r);
      return { ok:r.ok, status:r.status, text: await r.text() };
    }
    const extractMsg = (t) => { const s = strip(String(t||'')); if (!s) return 'ok'; const j = tryJSON(s); if (j) return strip(j.message||j.msg||j.error||j.status||'ok'); return s.length>90 ? s.slice(0,90)+'…' : s; };
    async function ensureForms(){ if (!state.bank_forms?.deposit?.action || (now()-state.bank_updatedAt) > FORM_TTL) await refreshBank(); }

    /* ===== Generic deposit / withdraw — amount is a positive integer in NP.
       doDepositAmount accepts the special value 0 to mean "all NP on hand"
       (Total mode for Rounded Deposit). */
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

        // Only require a PIN when the bank form actually has a `pin`
        // input — accounts without a configured bank PIN don't, and
        // forcing a 4-digit entry on them blocks withdrawals entirely.
        // We check by looking at the form's parsed hidden fields (built
        // by grabForm: every input[name] from the form gets a key).
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
        // Refresh if no form, or if forms are stale (the _ref_ck token might be expired).
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
          // The POST didn't return the success JSON we expect. This happens
          // when the interest was actually already collected (e.g. on
          // /bank.phtml directly, or a double-click) — the server rejects the
          // second collect and our cached button would otherwise stay lit red.
          // Reconcile against the live bank so the button reflects reality:
          // refreshBank() re-parses the page and, finding no #frmCollectInterest,
          // clears bank_interest → render() hides the button.
          setMsg(extractMsg(r.text));
          try { await refreshBank(); } catch {}
        }
      } catch { setMsg('interest error'); } finally { setBusy(false); }
    }

    /* ===== Dynamic button rendering based on settings =====
       Two columns: deposit-class buttons on the LEFT, withdraw-class
       buttons on the RIGHT. The slot of each button is fixed by its
       type, not by toggle order — turning a button on/off doesn't
       shuffle the other side. */
    function renderButtons(){
      btnsEl.innerHTML = '';
      const colDep = document.createElement('div'); colDep.className = 'bankCol bankColDep';
      const colWd  = document.createElement('div'); colWd.className  = 'bankCol bankColWd';
      btnsEl.append(colDep, colWd);

      // Deposit column (top-to-bottom in fixed order)
      if (settings.rounded.enabled)        addBtn(colDep, 'rounded',        'Rounded Deposit');
      if (settings.customDeposit.enabled)  addBtn(colDep, 'customDeposit',  'Custom Deposit');
      if (settings.autoDeposit.enabled)    addBtn(colDep, 'autoDeposit',    `Deposit ${formatShort(settings.autoDeposit.amount)}`);
      // Withdraw column (top-to-bottom in fixed order)
      if (settings.customWithdraw.enabled) addBtn(colWd,  'customWithdraw', 'Custom Withdraw');
      if (settings.autoWithdraw.enabled)   addBtn(colWd,  'autoWithdraw',   `Withdraw ${formatShort(settings.autoWithdraw.amount)}`);
    }
    function addBtn(parent, key, label){
      const b = document.createElement('div');
      b.className = 'npBtn bankBtn';
      b.dataset.key = key;
      b.textContent = label;
      // Tooltips — full-precision amount for the Auto buttons (since the
      // label uses the compact "500k" form), PIN hint for any withdraw.
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
      // Alt+click on any withdraw button = forget the stored PIN.
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

    /* ===== Inline custom-amount form =====
       Replaces the clicked button IN-PLACE in its single grid cell.
       Layout is locked: input flex-grows, ✓ is a fixed-width button,
       both share the cell's 30px height — no row jump, no expansion.
       Escape or click-outside cancels (no × button to save space). */
    function openCustomInput(btnEl, key){
      const isWithdraw = (key === 'customWithdraw');
      const form = document.createElement('div');
      form.className = 'bankCustomForm';
      // Empty placeholder — the surrounding context (just clicked
      // "Custom Deposit"/"Custom Withdraw") makes the intent obvious.
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

    /* ===== Settings modal ===== */
    function openSettings(){
      // One open at a time.
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
      // Working copy — committed only on Save.
      const draft = JSON.parse(JSON.stringify(settings));

      // Two columns mirroring the Mini Bank layout: deposits left, withdraws right.
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
      // Same wiring for both Auto amount inputs.
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

      // ----- LEFT COLUMN: deposits -----
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

      // ----- RIGHT COLUMN: withdraws -----
      colWd.appendChild(row('customWithdraw', 'Custom Withdraw'));

      const autoWdRow = row('autoWithdraw', 'Auto Withdraw', `
        <label for="bs_autoWd_amt">Amount:</label>
        <input type="text" inputmode="numeric" id="bs_autoWd_amt" value="${numComma(draft.autoWithdraw.amount)}">
      `);
      const autoWdInp = autoWdRow.querySelector('#bs_autoWd_amt');
      wireAmountInput(autoWdInp, draft.autoWithdraw);
      colWd.appendChild(autoWdRow);

      // ----- BOTTOM ROW: misc options spanning both columns -----
      const graphRow = row('graph', 'Show balance trend graph');
      graphRow.style.gridColumn = '1 / -1';
      body.appendChild(graphRow);

      // Wire close/save/cancel + outside click + Escape
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
        // Force-commit any pending blur on focused inputs.
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
    // Hover ↻ button — same refetch as clicking the balance, in the uniform
    // "↻ + ⚙ on hover" spot shared by every HUD card.
    const bankRefreshBtn = $('#npBankRefresh');
    if (bankRefreshBtn){
      bankRefreshBtn.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (busy || !gate()) return;
        setBusy(true);
        try { await refreshBank(); setMsg(''); } catch { setMsg('refresh error'); } finally { setBusy(false); }
      });
    }
    // Uniform card behavior: clicking the card body / title (anything that
    // isn't an action button or the custom-amount form) opens /bank.phtml.
    cardBank.addEventListener('click', (e) => {
      if (e.target?.closest?.('button, a, input, select, .npBtn, .bankCustomForm')) return;
      window.location.assign('https://www.neopets.com/bank.phtml');
    });

    // If we crossed the 9am Paris reset since the last fetch, the interest
    // cache is necessarily stale → nuke it before the first render so we
    // don't transiently display a button bound to a dead token.
    if (crossedDailyReset(state.bank_updatedAt, now())){
      state.bank_interest = null;
      state.bank_dailyInterest = '';
      save(state);
    }

    render();

    // Silent fetch: first visit, after a reset, stale forms, or whenever the
    // user is looking AT the bank page itself. The "stale" criterion catches
    // reloads after a long session; the on-bank-page criterion is what fixes
    // the "collected interest on /bank.phtml but the HUD button stayed red"
    // report — the classic bank page reloads after a collect, so re-syncing
    // on that reload clears the stale cached button immediately.
    npWhenBgAllowed(() => {
      const stale = !state.bank_updatedAt || (now() - state.bank_updatedAt) > FORM_TTL;
      const onBankPage = /^\/bank\.phtml/.test(location.pathname);
      if (!state.bank_balance || crossedDailyReset(state.bank_updatedAt, now()) || stale || onBankPage){
        refreshBank().catch(() => {});
      }
    });

    setInterval(() => {
      // Skip in background tabs: the visibilitychange listener below already
      // catches up on focus return, so this tick is just wasted work.
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

  /* =========================================================
     QUICKREF MODULE (active card + hover rail)
  ========================================================= */
  (function qrModule(){
    const FETCH_URL = 'https://www.neopets.com/quickref.phtml';
    // 5 min — this fetch fires on (nearly) every page load; at the old
    // 7 s it re-fetched quickref.phtml on almost every navigation, which
    // stacked with the user's own browsing and helped trip Neopets' rate
    // limiter (403). Freshness paths are unaffected: "Make Active" clears
    // the cooldown key and the ↻ button forces.
    // PETS_MAX was 6, which silently dropped pets 7+ from the hover
    // switcher for anyone with a bigger family ("I have 8 pets, but the
    // hover-over active pet selector only allows me to choose from six").
    // 20 is Neopets' own per-account ceiling, so the cap is now a guard
    // against malformed markup rather than a real limit.
    const COOLDOWN = 5 * 60 * 1000, PETS_MAX = 20;
    const LS_DATA = 'npqol_qr_data';
    const BLOCK_RE = /(customi[sz]e|view abilities|equip)/i;
    const state = { data:null, loading:false, closeT:0, wantOpen:false, imagesLoaded:false };
    const cpn = (n) => `https://pets.neopets.com/cpn/${encodeURIComponent(n)}/1/4.png`;

    const readCache = () => { try { const s = localStorage.getItem(LS_DATA); return s ? JSON.parse(s) : null; } catch { return null; } };
    const writeCache = (data) => { try { localStorage.setItem(LS_DATA, JSON.stringify({ ts:now(), data })); } catch {} };
    const readLast = () => { try { return ((localStorage.getItem(LS_DATA+'_lastFetch')||0)|0); } catch { return 0; } };
    const writeLast = () => { try { localStorage.setItem(LS_DATA+'_lastFetch', String(now())); } catch {} };

    function parse(html){
      const dom = new DOMParser().parseFromString(html, 'text/html');
      const pets = [...dom.querySelectorAll('#nav td.active_pet, #nav td.inactive_pet')].slice(0, PETS_MAX).map(td => {
        const img = td.querySelector('img[id$="_thumb"]');
        const name = img?.getAttribute('title') || img?.alt || 'Pet';
        // SCI (Stored Customisation ID) is embedded in the thumbnail's
        // src URL: `//pets.neopets.com/cp/<sci>/<mood>/<size>.png`.
        // We extract it so the HUD active pet image can use the cp/<sci>
        // URL (same one script 5's dollhouse + the home page use) which
        // skips the server-side name→sci lookup and shares the browser
        // HTTP cache with /home/index.phtml and /quickref.phtml.
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

    /* ===== Mini QuickRef settings — which info lines / images show
       inside #npQrActive. All toggleable via the ⚙ button injected
       next to the pet name; persisted to LS so the choices stick
       across sessions. */
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
        // Re-render the active card with the new field choices.
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

      // Badges row — short-form info (colour, species, gender, age,
      // level, mood). Each one is gated on its setting.
      const badgeHTML = [];
      if (qs.colour && a.colour)   badgeHTML.push(`<div class="qrBadge">${a.colour}</div>`);
      if (qs.species && a.species) badgeHTML.push(`<div class="qrBadge">${a.species}</div>`);
      if (qs.gender && a.gender)   badgeHTML.push(`<div class="qrBadge">${a.gender}</div>`);
      if (qs.age && a.age)         badgeHTML.push(`<div class="qrBadge">${a.age}</div>`);
      if (qs.level && lv)          badgeHTML.push(`<div class="qrBadge">Level ${lv}</div>`);
      if (qs.mood && a.mood)       badgeHTML.push(`<div class="qrBadge">${a.mood}</div>`);

      // Stats grid — numeric stats. Same gating.
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
      // Wire the gear + refresh buttons (innerHTML wiped the previous ones).
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

    /* Cut out the white background via a canvas, in two passes:
       1) FLOOD-FILL from the edges: only removes white pixels CONNECTED
          to the background → preserves INTERNAL white (e.g. striped paws).
       2) ANTI-HALO: along the contour, fade LIGHT pixels (halo) based on
          their lightness while keeping dark strokes and fine details.
       Depends on CORS from images.neopets.com: if blocked, falls back to
       the original image. */
    function removeWhiteBg(id){
      const d = id.data, w = id.width, h = id.height;
      const BG_MIN = 216, BG_CHROMA = 44; // background candidate: light AND low chroma
      const isBg = (i) => { const r=d[i],g=d[i+1],b=d[i+2], mn=Math.min(r,g,b), mx=Math.max(r,g,b); return d[i+3] > 0 && mn >= BG_MIN && (mx - mn) <= BG_CHROMA; };

      // 1) 4-connected flood-fill from the edges
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

      // 2) Remove ENCLOSED white voids — only those whose border is mostly
      //    DARK/BLACK (= object outline). Highlights bordered by LIGHT color
      //    are preserved.
      const DARK = 110;        // max(r,g,b) < DARK → "dark/black" pixel
      const DARK_FRAC = 0.55;  // fraction of dark border to qualify as a void
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

      // 3) Anti-halo: 1-pixel ring, opaque pixels touching transparent
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

    /* White sticker outline around the silhouette, on the OUTSIDE only.
       Thin + smoothed: 8-neighborhood (rounder contour) + alpha ramp
       (anti-aliasing). */
    function addWhiteOutline(id, ss){
      const d = id.data, w = id.width, h = id.height, OPAQUE = 128;
      // Alpha by outside-distance ring. At 2× supersampling (see cleanImg)
      // the ramp is longer with a soft falloff: after the browser downsamples
      // the data-URL for display, the edge reads as anti-aliased instead of
      // the jagged 3-hard-rings sticker border. 1× keeps the legacy ramp.
      const RAMP = (ss === 2)
        ? [0, 255, 255, 230, 190, 140, 90, 45, 15]
        : [0, 255, 130, 45];
      const MAXD = RAMP.length - 1;
      const A = new Uint8Array(w*h);
      for (let p=0;p<w*h;p++) A[p] = d[p*4+3] >= OPAQUE ? 1 : 0;

      // outside = non-object pixels reachable from the image border
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

      // outside distance to object boundary (8-neighborhood = rounder)
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

    // Bounded cache for canvas-cleaned petpet/pet PNGs. Each entry is a base64
    // dataURL (~10-40KB), so without eviction the LS quota gets eaten quickly
    // (every outfit change creates a new URL). Keep at most 30 entries, FIFO.
    // One-time purge when the render pipeline changes: v2 = supersampled
    // smooth outlines — cached v1 renders (jagged edges) must not be served.
    // Covers npqol_pp_png:<url> entries, the index, and the raw active-pet
    // cache (same prefix; it just re-populates on next load).
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
          // 2× SUPERSAMPLING for small sources (years shield, petpets…):
          // the mask + sticker outline are computed on a doubled bitmap and
          // the browser downsamples at paint time → smooth edge instead of
          // jagged 1px stair-steps. Large sources stay 1× (canvas + LS cost
          // would quadruple for no visible gain at their display size).
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
        } catch { imgEl.src = url; } // canvas tainted (CORS) → original image
      };
      probe.onerror = () => { imgEl.src = url; };
      probe.src = url;
    }
    // Expose cleanImg so other modules (userModule, etc.) can reuse the
    // same white-bg removal pipeline without re-implementing the canvas
    // flood-fill + halo cleanup.
    try { PW.__npCleanImg = cleanImg; } catch {}

    /* Render the dock as a vertical column of ALL pets — active pet at
       the BOTTOM (so it visually anchors at the position where
       #npActivePet sits in the HUD stack), inactive pets stacked above
       in their original quickref order. Flex 1/1/0 distributes the dock
       height equally; each tile is (HUD_width × HUD_height/N). Pet
       portraits use background-size:cover → cropped to fit, never
       distorted. */
    function renderDock(data){
      const TXT_RE = /(make\s*active|set\s*(?:as\s*)?active|make\s*this\s*pet\s*active|set\s*active)/i;
      const URL_RE = /(process_changetpet|new_active_pet=|setactive|makeactive|active_pet)/i;
      const pets = (data.pets || []).slice(0, PETS_MAX);
      const inactive = pets.filter(p => !p.isActive);
      const active   = pets.find(p => p.isActive);
      // Order: inactive on top, active at the bottom of the column.
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
          // Active pet tile: link goes straight to Quick Reference.
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
            // Plain click → fire the "make active" request silently (in
            // the background) and refresh the HUD data, instead of
            // letting the browser navigate to the process URL (which
            // would redirect to /quickref.phtml and yank the user off
            // their current page).
            // Ctrl/Shift/⌘/middle-click → fall through to native anchor
            // behaviour (opens in a new tab), useful if the user does
            // want the quickref page.
            link.addEventListener('click', async (e) => {
              if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
              e.preventDefault();
              e.stopPropagation();
              const href = make.href;
              try {
                // Server-side switch. Same-origin so credentials are
                // attached automatically; we ignore the response body
                // (it's the quickref redirect).
                const mkRes = await fetch(href, { credentials: 'include', cache: 'no-store' });
                npNote403(mkRes);
                // Invalidate the QR fetch cooldown so the very next
                // refresh actually goes to the network for fresh data.
                try { localStorage.removeItem(LS_DATA + '_lastFetch'); } catch {}
                // Refetch HUD data so the new active pet shows up
                // immediately in the stats card and the dock.
                try { await refresh({ force: true }); } catch {}
                // Close the dock so the user sees the new active pet
                // settle in #npActivePet's slot.
                try { setOpen(false); } catch {}
              } catch {
                // If something blocks the silent fetch, fall back to
                // the natural navigation so the action still happens.
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
    // Build the active pet image URL. Prefer the /cp/<sci>/<mood>/9.png
    // form — that's the exact URL script 5's dollhouse and the home page
    // carousel use, so the browser HTTP cache is SHARED across all three
    // surfaces. The /9 pose returns the pet character WITHOUT its custom
    // background (transparent PNG), matching what the user sees in the
    // dollhouse scene. Resolution order for SCI:
    //   1) explicit param (most recent — straight from qr parse)
    //   2) jb_np_homedata_v2 (script 5's home snapshot, reliable across pages)
    //   3) fallback to /cpn/<name>/ if no SCI is known
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
      // No SCI anywhere (e.g. script 5's sandbox refresh just wiped
      // jb_np_homedata_v2) → reuse the last known-good /cp/ URL for this
      // pet instead of regressing to the cpn customised render.
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

      // PRIORITY PATH: if we created a real <img> at document-start
      // (preloadActivePet, top of the main IIFE) and it's for THIS pet
      // with THIS exact url, adopt it directly into #npActivePet.
      if (!img && _earlyActivePetImg
          && _earlyActivePetImg.dataset.forName === name
          && _earlyActivePetImg.dataset.cpnUrl === url){
        img = _earlyActivePetImg;
        _earlyActivePetImg = null;
        cardActivePet.appendChild(img);
        return;
      }

      if (!img){
        img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        try { img.fetchPriority = 'high'; } catch {}
        img.addEventListener('load', () => img.classList.add('loaded'));
        img.addEventListener('error', () => img.classList.remove('loaded'));
        cardActivePet.appendChild(img);
      }
      // SAME PET + SAME URL? Don't touch src — avoids the flicker
      // (src swap → re-decode) when refresh() re-renders identical data.
      if (img.dataset.forName === name && img.dataset.cpnUrl === url && img.src){
        return;
      }
      img.dataset.forName = name;
      img.dataset.cpnUrl = url;

      img.classList.remove('loaded');
      img.src = url;

      // Background-cache the data URL for next visit's instant paint.
      setTimeout(() => _cacheRawPetImage(url), 1200);
    }

    function applyData(data){
      if (!data) return;
      state.data = data;
      if (data.active){
        renderActive(data.active);
        // Find the active pet in the list to get its SCI (extracted by
        // parse() from the thumbnail src). Falls back to '' which makes
        // renderActivePetImage use the cpn-by-name URL.
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
      // Body class drives the fade-out of the OTHER HUD cards while the
      // dock is open (handled in CSS, see body.npDockActive rules).
      try { document.body.classList.toggle('npDockActive', !!on); } catch {}
    }
    function wantOpen(on){
      state.wantOpen = !!on; clearTimeout(state.closeT);
      if (on){ setOpen(true); loadImagesNow(); return; }
      state.closeT = setTimeout(() => { if (!state.wantOpen && !dock.matches(':hover')) setOpen(false); }, 110);
    }
    // Hover lives on the active-pet image at the bottom (closer to the rail).
    // The stats card above still refreshes on click.
    cardActivePet.addEventListener('mouseenter', () => wantOpen(true));
    cardActivePet.addEventListener('mouseleave', () => wantOpen(false));
    dock.addEventListener('mouseenter', () => wantOpen(true));
    dock.addEventListener('mouseleave', () => wantOpen(false));
    // Stats card + active pet card: plain click → Quick Reference; Alt+click
    // → force refresh; Ctrl/Shift/⌘ click, middle-click and right-click → open
    // /quickref.phtml in a NEW TAB. Both cards share the same behavior so the
    // whole pet area feels like one consistent shortcut.
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
    // No resize handler needed — the dock now sizes itself purely from CSS
    // (100vh and the --qrColWidth custom property set per pet-count).

    const snap = readCache(); if (snap?.data){ try { applyData(snap.data); } catch {} }
    // Trigger a background refresh on every page load. Respects COOLDOWN
    // (5 min) so it doesn't fetch on every navigation, but if the
    // "Make Active" click invalidated the cooldown, this fires fresh and
    // the active pet image / stats update right away.
    npWhenBgAllowed(() => refresh({ force: false }));
    window.addEventListener('pageshow', (e) => {
      if (!e.persisted) return;
      state.imagesLoaded = false;
      const s = readCache(); if (s?.data) applyData(s.data);
      npWhenBgAllowed(() => refresh({ force: false }));
    });
  })();

  /* The GIF module was replaced by the active-pet image rendered above
     inside qrModule (renderActivePetImage). Hover on that image opens the
     pet rail for switching the active pet. */

  /* =========================================================
     NP MODULE — reads the native NP counter, no fetching.
  ========================================================= */
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
      // Anchor found → we no longer need the documentElement-wide observer.
      try { st.docObs?.disconnect(); st.docObs = null; } catch {}
    }
    function startFast(ms=4500){
      const until = now()+ms; if (until > st.fastUntil) st.fastUntil = until;
      if (st.fastTimer) return;
      st.fastTimer = window.setInterval(() => { bindWatcher(); refresh(); if (now() > st.fastUntil){ clearInterval(st.fastTimer); st.fastTimer = 0; } }, 80);
    }
    // Wide observer for the case where the NP anchor lands LATE (slow page
    // init). Self-disconnects in bindWatcher() once an anchor is found, so
    // it doesn't run forever on subtree:true (= major perf hit).
    if (!findAnchor()){
      st.docObs = new MutationObserver((muts) => {
        for (const m of muts){
          if (m.type === 'childList' && [...m.addedNodes].some(n => n.nodeType === 1)){
            bindWatcher();
            if (!st.docObs) return; // bindWatcher disconnects on success
            break;
          }
        }
      });
      st.docObs.observe(document.documentElement, { childList:true, subtree:true });
    }
    const fire = () => startFast(4500);
    window.addEventListener('focus', fire, true);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) fire(); }, true);
    // Patch the PAGE's history (PW), not the sandbox wrapper — we want to
    // detect the page's own SPA navigations, and the page only ever calls
    // its own history object.
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

  /* =========================================================
     CENTRAL ICON COLUMNS — two columns of shortcut icons that
     follow the current button theme (set in the BG picker).
     Editable via the bottom-center handle (see editor below).
  ========================================================= */
  (function colsModule(){
    if (document.getElementById('btnOverlay')) return;

    const SHARED = PW.__npBtnThemesData || {};
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

    /* Cascade fallback for icons — DELEGATED to PART ①'s implementation
       (__npAttachBtnFallback). The full duplicate that lived here when the
       HUD shipped as a standalone script (and couldn't rely on Core's load
       order) was removed by the fusion: PART ① always runs first in this
       file, so the API is guaranteed to exist. */
    function attachIconFallback(img, name){
      const fn = PW.__npAttachBtnFallback;
      if (typeof fn === 'function') fn(img, name);
    }

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

    document.addEventListener('np:btn-theme', (ev) => {
      const id = ev?.detail?.themeId;
      if (id) applyBtnTheme(id);
    });

    /* Re-arm icons after bfcache restore, visibility regain, and on
       load. Tampermonkey re-runs the script on a fresh navigation,
       but the browser's back/forward cache can restore the previous
       DOM with <img> nodes in a "pending" state (their original load
       was interrupted by the navigation). Setting img.src to the
       same URL is a no-op for the browser, so we clear src first to
       force a fresh fetch — and only on icons that are actually
       broken (complete with naturalWidth=0) or never started, so
       already-loaded icons don't flash. */
    const reapplyBrokenIcons = () => {
      try {
        const overlay = document.getElementById('btnOverlay');
        if (!overlay) return;
        const tid = getTheme();
        overlay.querySelectorAll('img[data-icon]').forEach(img => {
          // Already loaded successfully → leave alone.
          if (img.complete && img.naturalWidth > 0) return;
          const name = img.dataset.icon || '';
          if (!name) return;
          // Re-arm the cascade fallback (fresh `tried` Set inside)
          // and force the browser to re-fetch via a src round-trip.
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

    /* Icon catalog — slugs mirror the H5 profile dropdown (nav-XXX-icon).
       `id` is the persistent key in user configs — DO NOT rename it lightly
       or saved configs break. `icon` overrides the slug when the displayed
       name differs from the Neopets file name on images.neopets.com.
       `fixedSrc` = immutable URL (ignores theme switching).
       Cross-theme behaviour: when a theme is missing an icon, the cascade
       fallback in Core (basic/v3/*.svg → basic/images/*.svg → *.png) takes
       over. That's how chamber/bookshelf/neopass keep showing on themes
       that don't ship them. */
    const ICON_CATALOG = [
      { id:'profile',        label:'My Profile',         link:'https://www.neopets.com/settings/profile/' },
      // neopass lives only at basic/images/ (root), so v3-pattern themes
      // (basic, etc.) miss it. The cascade fallback handles it.
      { id:'neopass',        label:'My NeoPass',         link:'https://account.neopets.com/' },
      // Real slug is 'mypets' — 'petcentral' was a leftover from the H5 menu
      // ID and never matched a real icon file.
      { id:'petcentral',     icon:'mypets',         label:'My Pets',            link:'https://www.neopets.com/home/index.phtml' },
      { id:'customise',      label:'Customise',          link:'https://www.neopets.com/customise/' },
      // chamber is at basic/images/ (root), not basic/v3/. Cascade handles it.
      { id:'stylingchamber', icon:'chamber',        label:'Styling Chamber',    link:'https://www.neopets.com/stylingchamber/' },
      { id:'createpet',      label:'Create a Pet',       link:'https://www.neopets.com/reg/page4.phtml' },
      // Real slug is 'adoptpet' — 'adopt' (and 'pound') return 404.
      { id:'adopt',          icon:'adoptpet',       label:'Adopt a Pet',        link:'https://www.neopets.com/pound/' },
      { id:'inventory',      label:'Inventory',          link:'https://www.neopets.com/inventory.phtml' },
      { id:'sdb',            icon:'safetydeposit',  label:'Safety Deposit Box', link:'https://www.neopets.com/safetydeposit.phtml' },
      { id:'quickstock',     label:'Quick Stock',        link:'https://www.neopets.com/quickstock.phtml' },
      { id:'transferlog',    label:'Item Transfer Log',  link:'https://www.neopets.com/items/transfer_list.phtml' },
      { id:'gallery',        label:'Gallery',            link:'https://www.neopets.com/gallery/index.phtml' },
      { id:'stamps',         label:'Stamps',             link:'https://www.neopets.com/stamps.phtml?type=album' },
      // Real slug is 'tradingcards'.
      { id:'tcg',            icon:'tradingcards',   label:'Trading Cards',      link:'https://www.neopets.com/tcg/album.phtml' },
      { id:'ncalbum',        label:'NC Mall Album',      link:'https://www.neopets.com/ncma/' },
      // bookshelf is at basic/images/ (root), not basic/v3/. Cascade handles it.
      { id:'bookshelf',      label:'Archived Books',     link:'https://www.neopets.com/bookshelf/archive-bookshelf.phtml' },
      { id:'settings',       label:'Settings',           link:'https://www.neopets.com/settings/' },
      { id:'signout',        label:'Sign Out',           link:'https://www.neopets.com/logout.phtml' },
      { id:'shopwizard',     label:'Shop Wizard',        link:'https://www.neopets.com/shops/wizard.phtml',
        fixedSrc:'https://images.neopets.com/themes/h5/basic/images/shopwizard-icon.png' },
      // Super Shop Wizard — premium-only OVERLAY panel (#ssw__2020 / old
      // #ssw_tabs_pane), present on every page for premium accounts, not a
      // standalone URL. Clicking tries to open that panel via the premium
      // toolbar button; non-premium accounts fall through to the anchor's
      // href = the classic Shop Wizard.
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
      // entry can be either:
      //   - string (catalog id)
      //   - {id, label, link, fixedSrc?} (user custom)
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

    /* ===== Column spread offset =====
       User-tunable horizontal offset (px) pushing the two icon columns
       AWAY from the frame edges (positive) or INTO the content (negative).
       Applied as a CSS var inside the same calc() that anchors the columns
       to the frame edges, so the fluid/zoom-adaptive tracking is untouched —
       the offset just shifts the anchor point symmetrically. */
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

    /* ===== Shortcut icon size =====
       Same shape as the column offset above: a plain CSS var consumed by
       the #btnOverlay .iconBtn img rule, so resizing costs one custom
       property write and never touches the layout code. 60px is the
       historical size and stays the default. */
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
      /* !important everywhere: on some pages (SDB Vue + Tailwind runtime),
         the Tailwind preflight applies generic resets to * (transform:
         translate(var(--tw-translate-x,0),...)) that neutralize our
         transforms/positions. Force it to stay immune. */
      #btnOverlay{
        position:fixed !important; inset:0 !important;
        /* 4.2.0 — one notch ABOVE #npHudResizer (z-index 1001). At the
           frame widths where the frame docks against the side rail, that
           16px drag strip lands right on the left icon column and used to
           swallow every click meant for those icons ("the ability to
           adjust the sidebar size by dragging the edge interferes with
           clicking the left column of shortcut icons"). The overlay is
           pointer-events:none, so the strip stays grabbable in the 14px
           gaps between icons and everywhere above/below the column. */
        z-index:calc(var(--np-z-hud, 1000) + 2) !important;
        pointer-events:none !important;
        /* Frame's actual left edge in viewport px — mirrors the Core's
           margin-left calc EXACTLY so the icon columns track the frame
           even when the frame is docked against the HUD on narrow
           viewports. Fallback values keep things sane if Core isn't loaded. */
        --frame-left: max(
          calc((100vw - var(--np-frame-width, 1100px)) / 2),
          var(--np-frame-shift, 0px)
        ) !important;
        --frame-right: calc(var(--frame-left) + var(--np-frame-width, 1100px)) !important;
      }
      /* Legacy wrapper from previous positioning scheme — neutralize it
         so the cols size to their content and position from #btnOverlay. */
      #btnOverlay .center{ display:contents !important; }
      #btnOverlay .col{
        position:absolute !important;
        top:50% !important;
        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        gap:14px !important;
        /* The column CONTAINER lets pointer events through (the 14px gaps
           between icons must reach the frame's resize handle underneath);
           only the icon buttons themselves are interactive. */
        pointer-events:none !important;
        /* Safety net for long lists — a strip taller than the screen wraps
           into a second column instead of running off the top and bottom.
           Below that height nothing changes. */
        flex-wrap:wrap !important;
        max-height:calc(100vh - 96px) !important;
        align-content:center !important;
        /* --np-side-col-shift (editor → "Height") nudges the whole block
           up or down from its natural anchor, in every layout mode. */
        transform: translate(-50%, calc(-50% + var(--np-side-col-shift, 0px))) !important;
      }
      #btnOverlay .col .iconBtn{ pointer-events:auto !important; }
      /* Anchored to the frame's left/right edges (centered on the edge,
         so half the icon sits inside the frame margin and half outside).
         --np-side-col-offset (user setting, editor panel) spreads the two
         columns symmetrically: positive = apart, negative = into content.
         Because it lives INSIDE the same calc(), zoom/resize tracking of
         the frame edges keeps working exactly as before. */
      #btnOverlay .col.left{ left: calc(var(--frame-left) - var(--np-side-col-offset, 0px)) !important; }
      #btnOverlay .col.right{ left: calc(var(--frame-right) + var(--np-side-col-offset, 0px)) !important; }

      /* ===== LAYOUT MODES — data-mode / data-side on #btnOverlay =====
           cols   : the historical two columns hugging the frame edges.
           single : one vertical column, on either side.
           row    : one horizontal row centred on the frame, under the bar.
         Only the ANCHORING changes between modes — the buttons, the icon
         theme and the size token are shared, and the stored two-list
         config is never rewritten, so switching back to "cols" restores
         the previous setup untouched. The two other modes simply render
         both lists concatenated into the left strip (see rebuildColumns). */
      #btnOverlay[data-mode="single"] .col.right,
      #btnOverlay[data-mode="row"] .col.right{ display:none !important; }

      /* The single-strip layouts get their OWN horizontal setting
         (--np-side-col-x, a plain rightward offset) instead of borrowing
         the two-column spread: "push the columns apart" and "slide this
         strip sideways" are different gestures, and a user who tunes one
         shouldn't lose the other. */
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
        /* The centre is computed against the VISIBLE span of the frame —
           min(--frame-right, 100vw) — not its nominal right edge: below
           ~1400px the 1100px-wide frame runs past the viewport, and
           centring on its true middle would push the row off-screen. On a
           wide screen the frame is viewport-centred anyway, so this is the
           plain centre there. */
        --row-center: calc((var(--frame-left) + min(var(--frame-right), 100vw)) / 2 + var(--np-side-col-x, 0px));
        /* The row is centred on --row-center, so its half-width can never
           exceed the gap to the NEARER viewport edge — otherwise a long
           list wraps to a width that still overflows on one side. */
        max-width:min(94vw, calc(2 * min(var(--row-center), 100vw - var(--row-center)) - 8px)) !important;
        /* Just under the 60px top bar. "Offset" shifts it sideways,
           "Height" moves it up or down. */
        left: var(--row-center) !important;
        top: 76px !important;
        transform: translate(-50%, var(--np-side-col-shift, 0px)) !important;
      }
      #btnOverlay .iconBtn{ display:inline-block !important; text-decoration:none !important; background:transparent !important; border:none !important; box-shadow:none !important; padding:0 !important; margin:0 !important; line-height:0 !important; -webkit-tap-highlight-color:transparent; opacity:1 !important; visibility:visible !important; }
      #btnOverlay .iconBtn img{ width:var(--np-side-icon-size, 60px) !important; height:var(--np-side-icon-size, 60px) !important; max-width:none !important; display:block !important; transform:scale(1); transition:transform .12s ease; will-change:transform; transform-origin:center center; filter:drop-shadow(0 1px 4px rgba(0,0,0,.45)); opacity:1 !important; visibility:visible !important; }
      #btnOverlay .iconBtn:hover img{ transform:scale(1.08) !important; }
      #btnOverlay .iconBtn:active img{ transform:scale(1.02) !important; }

      /* The icon columns stay visible at every viewport size: they're the
         primary nav for the site. The 900px HUD-hide media query no longer
         hides them — only the user/bank/np HUD cards collapse below 900px,
         the nav stays so the user can keep navigating. */
    `;
    (document.head || document.documentElement).appendChild(st);

    const overlay = document.createElement('div'); overlay.id = 'btnOverlay';
    const center = document.createElement('div'); center.className = 'center';
    const leftCol = document.createElement('div'); leftCol.className = 'col left';
    const rightCol = document.createElement('div'); rightCol.className = 'col right';
    center.append(leftCol, rightCol);
    overlay.appendChild(center);

    /* Open the premium Super Shop Wizard overlay if it exists on this page.
       Tried in order: the premium toolbar opener button, then forcing the
       panel itself visible. Returns false when no SSW is present (non-
       premium account) so the caller can fall back to normal navigation. */
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
          // Modified clicks keep native anchor behavior (open in new tab).
          if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
          if (tryOpenSSW()){ e.preventDefault(); e.stopPropagation(); }
          // else: plain navigation to href (classic Shop Wizard).
        });
      }
      const img = new Image();
      // EAGER loading. These are 60×60 nav icons (a few KB each) so
      // there's no benefit to deferring. The previous `loading='lazy'`
      // caused intermittent "broken icon" symptoms: the <img> was built
      // detached, src was assigned, then it was attached to #btnOverlay
      // — and the browser's IntersectionObserver sometimes resolved to
      // "not visible yet" before first paint and never fetched. Opening
      // the BG sidebar forced a layout shift that re-triggered the IO
      // check, which is why icons "appeared" after opening it. Eager
      // skips that race entirely.
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

    /* ===== Layout mode =====
       'cols' (two columns — the historical layout, and the default),
       'single' (one vertical column) or 'row' (one horizontal row).
       Mode and side live on #btnOverlay as data attributes, so switching
       is one attribute write plus a rebuild; every position rule keys off
       them. The vertical nudge is a plain CSS var, like the spread. */
    const LAYOUT_LS = 'npqol_side_layout_v1';
    const SIDE_LS   = 'npqol_side_side_v1';
    const SHIFT_LS  = 'npqol_side_shift_v1';
    const XPOS_LS   = 'npqol_side_x_v1';
    const LAYOUTS = ['cols', 'single', 'row'];
    const SHIFT_MIN = -400, SHIFT_MAX = 400, SHIFT_STEP = 10;
    const XPOS_MIN = -700, XPOS_MAX = 700, XPOS_STEP = 6;
    // Where the horizontal row sits before the Height nudge, and the
    // frame's own default top margin — both needed to work out how far
    // the page has to drop to clear the row.
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
    /* The horizontal row is the only layout that sits ON the page rather
       than in its margins, so the content frame has to start below it.
       Measured rather than assumed: the row wraps to two or three lines on
       a narrow screen, and the icon size is user-tunable. */
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
      // The row's height depends on the layout that was just applied, so
      // measure on the next frame rather than this one.
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
    // A viewport change can re-wrap the row onto another line.
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
      // Two columns → one list each. One column / one row → a single strip,
      // so the two lists are concatenated (left first, then right) rather
      // than half the icons silently disappearing. loadConfig() is left
      // alone, which is what makes switching back lossless.
      const first  = (getLayout() === 'cols') ? cfg.left  : [...cfg.left, ...cfg.right];
      const second = (getLayout() === 'cols') ? cfg.right : [];
      first .forEach(it => leftCol .appendChild(makeBtn(it.icon || it.id, it.link, t, it.fixedSrc, it)));
      second.forEach(it => rightCol.appendChild(makeBtn(it.icon || it.id, it.link, t, it.fixedSrc, it)));
      // Icon count changed → the row may have gained or lost a line.
      try { requestAnimationFrame(syncContentDrop); } catch { syncContentDrop(); }
    }
    applyLayout();
    rebuildColumns();

    /* Mount + body watcher: on some "modern" pages (SDB in Vue/Tailwind),
       the overlay is inserted early but vanishes after Vue re-renders or
       teleports to <body>. If #btnOverlay leaves the DOM, re-mount it. */
    const mountOv = () => { if (!document.body) return false; if (!overlay.isConnected) document.body.appendChild(overlay); return true; };
    let bodyObs = null;
    const watchBody = () => {
      if (bodyObs || !document.body) return;
      bodyObs = new MutationObserver(() => { if (!overlay.isConnected) document.body.appendChild(overlay); });
      bodyObs.observe(document.body, { childList: true });
    };
    if (mountOv()) watchBody();
    else new MutationObserver((_, o) => { if (mountOv()){ watchBody(); o.disconnect(); } }).observe(document.documentElement, { childList:true, subtree:true });

    // Public API used by the editor below.
    PW.__npSideBtns = {
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

  /* =========================================================
     SIDE-BUTTON EDITOR — bottom-center handle + slide-up panel
     Click the handle to add / remove / move (left↔right) the
     central column buttons. Persisted via __npSideBtns.
  ========================================================= */
  (function sideBtnEditor(){
    if (document.getElementById('npxSideBtnHost')) return;
    const API = PW.__npSideBtns;
    if (!API) return;

    const TAB_W = 96, TAB_H = 22;
    const PANEL_W = 720, PANEL_H = 470;

    const host = document.createElement('div');
    host.id = 'npxSideBtnHost';
    Object.assign(host.style, {
      position:'fixed', left:'0', right:'0', bottom:'0',
      // Above #btnOverlay (+2): the icon columns are vertically centred
      // and would otherwise fall across the open editor panel.
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

      /* Panel slides up from the handle.
         box-shadow off while closed (otherwise it bleeds below the viewport
         since the panel is only translated, not unmounted). */
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
        /* Four control groups + Reset + × don't fit on one 560px row at
           every zoom level — let them wrap instead of squashing. */
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
      /* ONE flat toolbar: the layout switch, then three identical
         steppers. Every numeric setting has the same shape — label, −,
         value, + — so there is a single control to learn, and clicking
         the value resets it (which removed four ↺ buttons from the row). */
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

      /* Segmented layout switch: three mutually exclusive pictograms. */
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

      /* Shown in the body whenever the two lists render as one strip, so
         nobody thinks their icons were dropped. */
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
        /* overflow-x:hidden — a long label used to widen the grid and add
           a horizontal scrollbar under the panel; it ellipsises now. */
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
      /* The destination URL moved to the row's tooltip: every one of them
         started with the same "https://www.neopets.com" and the second
         line was what pushed the panel into a scrollbar. */
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

    /* Pictograms for the layout switch: a content frame plus the icon
       strips around it, so the three options read at a glance. */
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

    /* ===== Toolbar =====
       One handler for the layout switch and the three steppers. Each
       stepper reads and writes through the colsModule API, so every
       change applies live while the panel stays open, and clicking a
       value resets that one setting.

       "Spread" and "Position" share a slot but NOT a stored value: in the
       two-column layout it spreads the columns apart (--np-side-col-offset),
       in the single-strip layouts it slides the strip sideways
       (--np-side-col-x). Tuning one no longer destroys the other. */
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
      // Each stepper: current value, setter, step, reset target, label.
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
          // Only a single vertical column has a side to choose.
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
          const k = t.id.slice(0, 3);            // posVal → pos, hgtVal → hgt…
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

    document.addEventListener('np:btn-theme', () => { if (open) paint(); });

    (function mount(){
      if (document.body) document.body.appendChild(host);
      else new MutationObserver((_, o) => { if (document.body){ document.body.appendChild(host); o.disconnect(); } })
            .observe(document.documentElement, { childList:true, subtree:true });
    })();
  })();

})();

  /* ╔══════════════════════════════════════════════════════════════╗
     ║  PART ③ — BACKGROUND & DECOR (bg picker, accent/theme UI)    ║
     ╚══════════════════════════════════════════════════════════════╝ */
(() => {
  'use strict';
  // (iframe + host gates hoisted to the fusion prelude)
  if (document.documentElement.dataset.npBgBoot === '1') return;
  document.documentElement.dataset.npBgBoot = '1';

  // Cross-part access: PART ① exposes the theme/accent APIs on the page
  // window (PW) — same bridge here, kept as `W` (historical local name).
  const W = PW;

  // ---------- Layout ----------
  const LEFT_BAR_PX = 330;
  const TOP_BAR_PX  = 0;

  // ---------- Storage keys ----------
  const LS = {
    mainBgId:  'npqol_bg_main_v3',     // DTI URL or '' (transparent)
    leftBarBg: 'npqol_bg_left_v3',     // DTI URL or '' (transparent)
    favorites: 'npqol_bg_favs_v1',     // JSON array of DTI ids
    hidden:    'npqol_bg_hidden_v1',   // JSON array of DTI ids
    recolor:   'npqol_recolor_site_v1',// '1'/'0' — recolor native gold → accent
    topbarBg:  'npqol_topbar_bg_v1',   // 'none' | 'tint' | 'blur' | 'solid'
    invBar:    'npqol_inv_menubar_v1', // '1'/'0' — keep Neopets' inventory menu links
  };

  // ---------- Background base color ----------
  const BG_COLOR = '#000';

  // ---------- Right-side picker UI ----------
  const UI_Z = 2147483000;
  const HANDLE_W = 20;
  const HANDLE_H = 90;
  const SIDEBAR_W = 320;

  // ---------- Utils ----------
  const safeUrl = (u) => String(u || '').replace(/["\\\n\r]/g, '');
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const LSget = (k, fallback = '') => { try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; } };
  const LSset = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };

  // ---------- DTI background list (GraphQL on impress-2020.openneo.net) ----------
  const DTI_CACHE_KEY = 'npqol_dti_bgs_v6';
  const DTI_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
  const DTI_PAGE_SIZE = 30;
  // Hard safety cap — the loop in fetchDTIBackgrounds breaks naturally when a
  // page returns fewer items than DTI_PAGE_SIZE (last page reached), so this
  // value is only here to prevent an infinite loop if the DTI API ever
  // misbehaves. 30 × 5000 = 150 000 backgrounds, way above what DTI hosts.
  const DTI_MAX_PAGES = 5000;
  const DTI_ENDPOINT  = 'https://impress-2020.openneo.net/api/graphql';

  const gqlQuery = (query, variables = {}) => new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    if (typeof GM_xmlhttpRequest === 'function') {
      GM_xmlhttpRequest({
        method: 'POST',
        url: DTI_ENDPOINT,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        data: body,
        timeout: 20000,
        onload: (r) => {
          try { resolve(JSON.parse(r.responseText)); }
          catch (e) { reject(new Error('JSON parse: ' + e.message)); }
        },
        onerror: () => reject(new Error('network')),
        ontimeout: () => reject(new Error('timeout')),
      });
    } else {
      fetch(DTI_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
        .then(r => r.json()).then(resolve).catch(reject);
    }
  });

  const DTI_QUERY = `
    query SearchBgs($query: String!, $offset: Int!, $limit: Int!) {
      itemSearch(query: $query, offset: $offset, limit: $limit) {
        items {
          id
          name
          thumbnailUrl
          appearanceOn(speciesId: 1, colorId: 8) {
            layers {
              id
              zone { id label }
              imageUrl(size: SIZE_600)
            }
          }
        }
      }
    }
  `;

  async function fetchDTIBackgrounds(progressCb){
    const all = [];
    const seen = new Set();
    let skippedNoImage = 0;
    for (let p = 0; p < DTI_MAX_PAGES; p++){
      progressCb?.(p + 1, all.length);
      const offset = p * DTI_PAGE_SIZE;
      let resp;
      try {
        resp = await gqlQuery(DTI_QUERY, { query: 'background', offset, limit: DTI_PAGE_SIZE });
      } catch (e) {
        if (p === 0) throw e;
        break;
      }
      if (resp?.errors?.length){
        throw new Error('GraphQL: ' + (resp.errors[0]?.message || JSON.stringify(resp.errors[0])));
      }
      const items = resp?.data?.itemSearch?.items || [];
      if (!items.length) break;
      for (const it of items){
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        const layers = it.appearanceOn?.layers || [];
        const pickBg = layers.find(l => (l?.zone?.label || '').toLowerCase().includes('background')) || layers[0];
        const url = pickBg?.imageUrl || '';
        if (!url){ skippedNoImage++; continue; }
        all.push({
          id: String(it.id),
          name: it.name,
          thumbnailUrl: it.thumbnailUrl || '',
          url,
        });
      }
      if (items.length < DTI_PAGE_SIZE) break;
    }
    if (skippedNoImage) console.info(`[BG] DTI fetch: ${all.length} usable backgrounds, ${skippedNoImage} skipped (no PNG render).`);
    return all;
  }

  function readDTICached(){
    try {
      const raw = localStorage.getItem(DTI_CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !Array.isArray(obj.items) || (Date.now() - obj.ts) > DTI_CACHE_TTL) return null;
      return obj.items;
    } catch { return null; }
  }
  function writeDTICached(items){
    try { localStorage.setItem(DTI_CACHE_KEY, JSON.stringify({ ts: Date.now(), items })); } catch {}
  }

  // ---------- Favorites + hidden (DTI id sets) ----------
  function readIdSet(key){
    try {
      const raw = LSget(key, '');
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr.map(String) : []);
    } catch { return new Set(); }
  }
  function writeIdSet(key, set){
    try { LSset(key, JSON.stringify([...set])); } catch {}
  }
  const readFavs    = () => readIdSet(LS.favorites);
  const writeFavs   = (s) => writeIdSet(LS.favorites, s);
  const readHidden  = () => readIdSet(LS.hidden);
  const writeHidden = (s) => writeIdSet(LS.hidden, s);

  // ---------- Apply (bare URLs — no opacity/tint) ----------
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

  // Apply saved values right away, before any rendering.
  applyMainBg(LSget(LS.mainBgId, ''));
  applyLeftBg(LSget(LS.leftBarBg, ''));

  // ---------- Site recolor (native gold → accent) ----------
  // Tag the current page family so the recolor rules can be scoped tightly
  // (generic classes like `.container` must not leak to other pages).
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
  // Toggle state: a single class on <html> flips the whole module on/off.
  document.documentElement.classList.toggle('np-recolor-site', LSget(LS.recolor, '0') === '1');

  /* ---------- Top-bar surface ----------
     The bar lives in a shadow root, so it can't be reached by a class on
     <html> — but custom properties DO inherit across the shadow boundary,
     so four tokens set on the root restyle it. 'none' is the historical
     see-through bar and stays the default.

     The bar is a 60px fixed strip across the whole viewport, so a painted
     one would sit over the top of the side rail and the user card. Rather
     than push the HUD down (which would waste the top of the rail), the
     painted surface simply STARTS after the rail: the bar passes behind
     the sidebar, the rail's own decor and the user card stay in front. */
  const TOPBAR_INSET = 'var(--np-col-width, 330px)';
  const TOPBAR_STYLES = {
    none:  { bg:'transparent',          backdrop:'none',                        line:'transparent',            shadow:'none',                        inset:'0px' },
    tint:  { bg:'rgba(20,14,32,.55)',   backdrop:'none',                        line:'rgba(255,255,255,.10)',  shadow:'none',                        inset:TOPBAR_INSET },
    blur:  { bg:'rgba(20,14,32,.30)',   backdrop:'blur(10px) saturate(1.1)',    line:'rgba(255,255,255,.12)',  shadow:'0 4px 18px rgba(0,0,0,.32)',  inset:TOPBAR_INSET },
    solid: { bg:'rgba(20,14,32,.97)',   backdrop:'none',                        line:'rgba(255,255,255,.14)',  shadow:'0 4px 18px rgba(0,0,0,.45)',  inset:TOPBAR_INSET },
  };
  function applyTopbarBg(id){
    const v = TOPBAR_STYLES[id] ? id : 'none';
    const st = TOPBAR_STYLES[v];
    try {
      const rs = document.documentElement.style;
      rs.setProperty('--np-bar-bg', st.bg);
      rs.setProperty('--np-bar-backdrop', st.backdrop);
      rs.setProperty('--np-bar-line', st.line);
      rs.setProperty('--np-bar-shadow', st.shadow);
      rs.setProperty('--np-bar-inset-left', st.inset);
      // 4.2.0 shipped an earlier approach that pushed the HUD down instead;
      // clear it so an upgrading profile doesn't keep the gap.
      rs.removeProperty('--np-hud-top');
    } catch {}
    return v;
  }
  applyTopbarBg(LSget(LS.topbarBg, 'none'));

  /* ---------- Inventory menu bar ---------- */
  function applyInvMenubar(on){
    try { document.documentElement.classList.toggle('np-inv-menubar-full', !!on); } catch {}
  }
  applyInvMenubar(LSget(LS.invBar, '0') === '1');

  // ---------- CSS (early) ----------
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
      /* Anchored to the (user-resizable) decor column right edge. */
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

    /* Left decor column. visibility:visible escapes a body{visibility:hidden}
       anti-FOUC injected by some other extensions (e.g. Stylus). */
    #npLeftBar{
      position:fixed!important; top:0; left:0;
      /* Tracks --np-col-width set by the HUD resize handle. */
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

    /* The decor column tracks --np-col-width (user-controlled via the HUD
       resize handle), so no automatic shrink rules — only hide on tiny
       screens where the HUD itself is hidden. */
    @media (max-width: 900px){
      #npLeftBar{ display:none; }
      :root::before{ inset:${TOP_BAR_PX}px 0 0 0; }
    }

    /* Right-side BG picker — slide-in panel */
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

    .npAccentBlock{ margin:0 0 12px 0; }
    .npAccentPastilles{
      display:grid;
      grid-template-columns:repeat(8, 1fr);
      gap:8px;
      justify-items:center;
      padding:6px 2px 2px;
    }
    .npAccentDot{
      width:24px; height:24px;
      border-radius:50%; cursor:pointer;
      border:2px solid rgba(255,255,255,.18);
      box-shadow: 0 1px 3px rgba(0,0,0,.5), inset 0 0 0 1px rgba(0,0,0,.2);
      transition: transform .12s ease, border-color .12s ease, box-shadow .12s ease;
      padding:0;
    }
    .npAccentDot:hover{
      transform: scale(1.12);
      border-color: rgba(255,255,255,.55);
    }
    .npAccentDot.isActive{
      border-color: #fff;
      box-shadow: 0 0 0 2px rgba(0,0,0,.55), 0 1px 6px rgba(0,0,0,.55), inset 0 0 0 1px rgba(0,0,0,.2);
      transform: scale(1.1);
    }

    .npRecolorBlock{ margin:0 0 12px 0; }
    .npRecolorBtn{
      width:100%;
      height:46px;
      border-radius:12px;
      cursor:pointer;
      /* Typical Neopets typography (Cafeteria), loaded by the site's own CSS. */
      font-family:"Cafeteria","TP Cafeteria","CafeteriaBlack","Museo Sans Rounded Bold",system-ui,sans-serif;
      font-size:20px;
      font-weight:400;
      /* Inactive: greyed out */
      background:rgba(255,255,255,.07);
      color:rgba(255,255,255,.42);
      border:1px solid rgba(255,255,255,.16);
      transition:filter .15s ease, transform .1s ease, box-shadow .2s ease, color .2s ease;
    }
    .npRecolorBtn:hover{ filter:brightness(1.1); }
    .npRecolorBtn:active{ transform:translateY(1px); }
    /* Active: soft PASTEL rainbow drawn from the accent palette, gently animated */
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
    .npBgSearch button.isOn{
      background:var(--np-accent, #dcb8ff); color:#1a1330;
      border-color:transparent;
    }
    #npBgList{
      display:flex; flex-direction:column; gap:6px; margin-top:8px;
    }
    .npBgItem{
      display:grid; grid-template-columns:44px 1fr auto auto auto auto;
      gap:6px; align-items:center;
      padding:4px 6px; border-radius:10px;
      background:rgba(0,0,0,.12);
      border:1px solid rgba(255,255,255,.12);
    }
    .npBgItem.isHidden{
      opacity:.55;
      background:rgba(255,80,80,.06);
      border-color:rgba(255,80,80,.18);
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
    .npFavBtn, .npHideBtn{
      width:24px; height:28px; padding:0;
      border:none; background:transparent;
      color:rgba(255,255,255,.45); cursor:pointer; font-size:14px;
      line-height:1;
    }
    .npFavBtn:hover, .npHideBtn:hover{ color:rgba(255,255,255,.85); }
    .npFavBtn.isOn{ color:#ffd166; }
    .npHideBtn.isOn{ color:#ff6b6b; }
    .npFavBtn{ font-size:16px; }
    #npBgStatus{
      padding:6px 4px; font-size:11px; color:rgba(255,255,255,.7);
    }

    .npSmall{
      font:800 10px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
      color:rgba(255,255,255,.82);
      letter-spacing:.04em;
      margin-bottom:6px;
    }

    /* Plain on/off rows for the interface options that don't deserve a
       whole block of their own. */
    .npOptBlock{ margin:0 0 12px 0; }
    .npOptRow{
      display:flex; align-items:flex-start; gap:8px;
      padding:8px 10px;
      border:1px solid rgba(255,255,255,.14);
      border-radius:10px;
      background:rgba(255,255,255,.04);
      cursor:pointer;
    }
    .npOptRow:hover{ background:rgba(255,255,255,.07); border-color:var(--np-accent-line, rgba(255,255,255,.3)); }
    .npOptRow input[type="checkbox"]{
      width:15px; height:15px; margin:1px 0 0 0;
      accent-color:var(--np-accent, #dcb8ff);
      flex:0 0 auto; cursor:pointer;
    }
    .npOptText{
      font:700 11px/1.25 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
      color:rgba(255,255,255,.9);
    }
    .npOptText small{
      display:block; margin-top:3px;
      font:500 10px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
      color:rgba(255,255,255,.55);
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  // ---------- Site recolor stylesheet ----------
  // All rules gated behind `html.np-recolor-site` (flipped by the picker
  // toggle) AND a per-page class, so generic selectors never leak across
  // pages. Shade vars come from Core (--np-accent-l*/--np-accent-huerot);
  // each fallback equals the ORIGINAL Neopets value, so with Core absent (or
  // the toggle off) nothing changes. Scoped per page family — start: INVENTORY.
  const recolorStyle = document.createElement('style');
  recolorStyle.id = 'npRecolorSite';
  recolorStyle.textContent = `
    /* ===== INVENTORY (/inventory.phtml) ===== */
    /* Tab bar + its scrollbar */
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
    /* Selected tab (darker step) */
    html.np-recolor-site.np-page-inventory ul.invTabs li.invTab-selected,
    html.np-recolor-site.np-page-inventory .invTabsCarousel .invTab-selected{
      background-color: var(--np-accent-l45, #c18000) !important;
    }
    /* Quantity badge + menu strip */
    html.np-recolor-site.np-page-inventory .item-count{
      background-color: var(--np-accent-l60, #de911a) !important;
    }
    html.np-recolor-site.np-page-inventory .inv-menulinks{
      background: var(--np-accent-l45, #9F9786) !important;
    }
    /* Page container gradient (tan → white) */
    html.np-recolor-site.np-page-inventory .container{
      background: linear-gradient(0deg,
        var(--np-accent-l90, rgba(197,182,155,1)) 0%, #fff 100%) !important;
    }
    /* Category icon sprites are white glyphs — they read fine on any accent,
       so leave them untouched. */

    /* Filter toggle pills (NP/NC, time/A-Z, stack) — a SHARED inv-filter widget
       that appears on inventory AND other item pages, so this is global (not
       page-scoped). Their gold is baked into SVG border-images (toggle-backing
       / toggle-button.svg), so CSS can't recolor them. Run a luminance→accent
       filter pipeline that tracks the accent's HUE, SATURATION and LIGHTNESS
       (plain hue-rotate couldn't: it left muted accents over-saturated and
       turned black/white pills red). grayscale→sepia normalises to a neutral
       gold base (~hue 40, same NEO_GOLD reference), hue-rotate swings it to the
       accent hue, saturate scales chroma (0 = grey for black/white), brightness
       tracks lightness. */
    html.np-recolor-site .nptoggle,
    html.np-recolor-site .filtertoggle,
    html.np-recolor-site .stacktoggle{
      filter:
        grayscale(1) sepia(1)
        hue-rotate(var(--np-accent-huerot, 0deg))
        saturate(var(--np-accent-sat, 1))
        brightness(var(--np-accent-bright, 1));
    }

    /* ===== SITE-WIDE (not page-scoped) — shared components from template.css ===== */
    /* 2020 yellow button — CSS gradient + warm insets, used across the whole
       site (inventory "Submit", claim buttons, popups…). Recolor all three
       states + warm shadow rings; keep the cream top highlight + black outline. */
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
    /* Popup header/footer bars (item-info + generic __2020 popups) — solid #fed123 */
    html.np-recolor-site .popup-header__2020,
    html.np-recolor-site .popup-footer__2020{
      background: var(--np-accent-l60, #fed123) !important;
    }

    /* ===== ECONOMY PAGES — shared warm palette =====
       Self-scoped by unique class prefixes (.sdb-* Safety Deposit, .bsp-* shop
       browsing, .mkt-* your shop / market), so these can be global without
       leaking. All warm values are CSS (no images). Grouped by NATIVE color so
       each fallback stays exactly native when Core is absent. Recurring hexes:
       #e8a41d→#c18000 (amber bars), #f5c030 (gold pills), #faa819 (orange),
       #fed123 (golden), #ffeeaf/#fcee95/#ffe9b8 (pales). */

    /* Amber nav BARS (gradient #e8a41d→#c18000). Shared across the whole shop
       cluster: .mkt-navlist (hub) + .mkt-subnav ("Jump to:" bar on market /
       quickstock / SDB / gallery / …) + .bsp-* (shop browsing). */
    html.np-recolor-site .bsp-navlist,
    html.np-recolor-site .bsp-subnav,
    html.np-recolor-site .mkt-navlist,
    html.np-recolor-site .mkt-subnav{
      background: linear-gradient(var(--np-accent-l60,#e8a41d), var(--np-accent-l45,#c18000)) !important;
    }
    /* Gold nav PILLS (gradient #f5c030→#e8a41d) + hover (#fdd040→#f5c030) */
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
    /* Active nav pill (dark amber #7a5500→#5a3d00), incl. hover (#8a6200→#6a4800) */
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

    /* ===== GENERALIZED ITEM-PAGE COMPONENTS =====
       The item pages (inventory, safety deposit, quick stock, closet, …) share
       ONE design system with page-PREFIXED classes: [prefix]-menulinks,
       -stats-bar, -header-bar, -pagination-btn, -count-badge, -tick-icon,
       -pin-btn, -drawer… Target the FAMILY via [class*=…] so a single rule
       covers every current AND future page that reuses this markup. */

    /* Tan menu bar (#9f9786) + its hover link (#fde68a) — inv/sdb/qs/closet/… */
    html.np-recolor-site [class*="menulinks"]{
      background: var(--np-accent-l45, #9f9786) !important;
    }
    html.np-recolor-site [class*="menulinks"] a:hover{
      color: var(--np-accent-l75, #fde68a) !important;
    }
    /* Orange stat/header bars (#faa819) + quantity steppers */
    html.np-recolor-site [class*="stats-bar"],
    html.np-recolor-site [class*="header-bar"],
    html.np-recolor-site [class*="headerbar"],
    html.np-recolor-site .np-stepper-btn,
    html.np-recolor-site .mkt-stepper .mkt-stepper__btn{
      background: var(--np-accent-l60, #faa819) !important;
    }
    /* Count badge (#e8a41d) — e.g. quick stock ×3 */
    html.np-recolor-site [class*="count-badge"]{
      background: var(--np-accent-l60, #e8a41d) !important;
    }
    /* Selection tick (#ffd700/#faa819) + pinned pin (#ffaa00) */
    html.np-recolor-site [class*="tick-icon"].selected,
    html.np-recolor-site [class*="pin-btn"].is-pinned{
      background: var(--np-accent-l60, #faa819) !important;
    }
    /* Pagination pills — default (#ffeeaf/#fff8e7) + active/hover (#fed123/#c8a951).
       Covers page-prefixed .xxx-pagination-btn AND the shared .np-pagination-btn
       library (incl. .np-pagination-btn-active). */
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
    /* Pale drawers / PIN banners (#fcee95) */
    html.np-recolor-site [class*="-drawer"],
    html.np-recolor-site [class*="pin-inactive-text"]{
      background: var(--np-accent-l90, #fcee95) !important;
    }

    /* --- SDB-specific bits (unique classes, kept explicit) --- */
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
    /* Market shop-card header (mustard #dddd77) + gold accents (#f5c400) */
    html.np-recolor-site .shop__head{
      background: var(--np-accent-l75, #dddd77) !important;
    }
    html.np-recolor-site .mkt-lessons__dot.is-active{
      background: var(--np-accent-l60, #f5c400) !important;
    }
    html.np-recolor-site .mkt-help-tab.is-active{
      border-bottom-color: var(--np-accent-l60, #f5c400) !important;
    }

    /* Quick Stock (quickstock.phtml) — gold table defined in a page-inline
       style block (SDB-style palette), classes quickstock- + qs- (unique). The
       header uses !important; our html.np-recolor-site prefix raises specificity
       so our !important wins. */
    /* Amber header (#e8a41d) — incl. sticky first cell */
    html.np-recolor-site .quickstock-thead tr,
    html.np-recolor-site .quickstock-table.np-table thead th,
    html.np-recolor-site .quickstock-table.np-table thead th:first-child{
      background-color: var(--np-accent-l60, #e8a41d) !important;
    }
    html.np-recolor-site .quickstock-table.np-table thead th{
      border-bottom-color: var(--np-accent-l45, #c48a10) !important;
    }
    /* Even rows (#fef0ba pale) */
    html.np-recolor-site .quickstock-table.np-table .np-table-row-even{
      background-color: var(--np-accent-l90, #fef0ba) !important;
    }
    /* "Check All" row (#fde68a) + its top separator (#c48a10) */
    html.np-recolor-site .quickstock-table.np-table tbody tr:last-child,
    html.np-recolor-site .quickstock-table.np-table tbody tr:last-child.np-table-row-even{
      background-color: var(--np-accent-l75, #fde68a) !important;
      border-top-color: var(--np-accent-l45, #c48a10) !important;
    }
    /* Menulink hover (#fde68a) + radio accent (#c48a10) */
    html.np-recolor-site .qs-menulinks a:hover{
      color: var(--np-accent-l75, #fde68a) !important;
    }
    html.np-recolor-site .quickstock-table input[type="radio"]{
      accent-color: var(--np-accent-l45, #c48a10) !important;
    }
  `;
  (document.head || document.documentElement).appendChild(recolorStyle);

  // ---------- Left decor column mount ----------
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

  // ---------- Right-side picker (slide-in) ----------
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
            <option value="none">Transparent (default)</option>
            <option value="tint">Tinted</option>
            <option value="blur">Frosted</option>
            <option value="solid">Solid</option>
          </select>
        </div>

        <div class="npAccentBlock">
          <div class="npSmall" style="margin-bottom:4px">Accent color</div>
          <div class="npAccentPastilles" id="npAccentPastilles"></div>
        </div>

        <div class="npRecolorBlock">
          <button type="button" id="npRecolorSite" class="npRecolorBtn" aria-pressed="false">Recolor Site</button>
        </div>

        <div class="npOptBlock">
          <label class="npOptRow">
            <input type="checkbox" id="npInvMenubar">
            <span class="npOptText">Full inventory bar
              <small>Keep Neopets' own Quick Stock / Transfer Log links beside the NP·NC filters.</small>
            </span>
          </label>
        </div>

        <div class="npSmall" id="npBgStatus">Empty list — please wait while it loads…</div>
        <div class="npBgSearch">
          <input id="npBgQuery" type="text" placeholder="Filter by name…" />
          <button id="npBgFavOnly" type="button" title="Show favorites only">★</button>
          <button id="npBgHiddenOnly" type="button" title="Show hidden backgrounds (to restore them)">🗑</button>
          <button id="npBgReload" type="button" title="Reload from DTI">↻</button>
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
    let snapshot = null; // LS state captured on open
    let session  = null; // live preview state during editing

    function openBar(){
      if (isOpen) return;
      isOpen = true;
      snapshot = {
        mainBg:   LSget(LS.mainBgId, ''),
        leftBg:   LSget(LS.leftBarBg, ''),
        btnTheme: (typeof W.__npGetBtnTheme === 'function') ? W.__npGetBtnTheme() : '',
        accent:   (typeof W.__npGetAccent === 'function') ? W.__npGetAccent() : '#dcb8ff',
      };
      session = { ...snapshot };
      sidebar.style.transform = OPEN_X;
      if (!built) buildUI();
      refreshActives();
      refreshThemeSelect();
      refreshAccentPastilles();
    }

    function closeBar(){
      isOpen = false;
      sidebar.style.transform = CLOSED_X;
      snapshot = null;
      session = null;
    }

    function saveAndClose(){
      if (!session) { closeBar(); return; }
      LSset(LS.mainBgId,  session.mainBg);
      LSset(LS.leftBarBg, session.leftBg);
      if (session.btnTheme && typeof W.__npSaveBtnTheme === 'function'){
        W.__npSaveBtnTheme(session.btnTheme);
      }
      if (session.accent && typeof W.__npSaveAccent === 'function'){
        W.__npSaveAccent(session.accent);
      }
      closeBar();
    }

    function cancelAndClose(){
      if (snapshot){
        applyMainBg(snapshot.mainBg);
        applyLeftBg(snapshot.leftBg);
        if (snapshot.btnTheme && typeof W.__npApplyBtnTheme === 'function'){
          W.__npApplyBtnTheme(snapshot.btnTheme);
        }
        if (snapshot.accent && typeof W.__npApplyAccent === 'function'){
          W.__npApplyAccent(snapshot.accent);
        }
      }
      closeBar();
    }

    handle.addEventListener('click', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      openBar();
    });

    // Click anywhere outside the panel (and not on the handle) reverts + closes.
    document.addEventListener('pointerdown', (ev) => {
      if (!isOpen) return;
      const t = ev.target;
      if (!t) return;
      if (t.closest && (t.closest('#npBgSidebar') || t.closest('#npBgHandle'))) return;
      cancelAndClose();
    }, true);

    function refreshActives(){
      if (!session) return;
      sidebar.querySelectorAll('.npBgR').forEach(b => {
        b.classList.toggle('isActive', b.getAttribute('data-url') === session.mainBg);
      });
      sidebar.querySelectorAll('.npBgL').forEach(b => {
        b.classList.toggle('isActive', b.getAttribute('data-url') === session.leftBg);
      });
    }

    // (Re)populate the button-theme <select> — runs on each open so we pick up
    // the API in case the HUD script wasn't loaded yet on first build.
    function refreshThemeSelect(){
      const sel = sidebar.querySelector('#npBtnTheme');
      if (!sel) return;
      const themes = Array.isArray(W.__npBtnThemes) ? W.__npBtnThemes : [];
      if (!themes.length){
        sel.innerHTML = `<option value="">(HUD script not loaded)</option>`;
        sel.disabled = true;
        return;
      }
      sel.disabled = false;
      if (sel.options.length !== themes.length || sel.options[0]?.value === ''){
        sel.innerHTML = themes.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
      }
      const cur = (session && session.btnTheme)
        || (typeof W.__npGetBtnTheme === 'function' ? W.__npGetBtnTheme() : '');
      if (cur) sel.value = cur;
    }

    function refreshAccentPastilles(){
      const box = sidebar.querySelector('#npAccentPastilles');
      if (!box) return;
      const palette = Array.isArray(W.__npAccentPalette) ? W.__npAccentPalette : [];
      if (!palette.length){
        box.innerHTML = `<div class="npSmall" style="opacity:.6">(Core script not loaded)</div>`;
        return;
      }
      if (box.children.length !== palette.length){
        box.innerHTML = palette.map(p =>
          `<button type="button" class="npAccentDot" data-hex="${p.hex}" title="${p.label}" style="background:${p.hex}"></button>`
        ).join('');
      }
      const cur = (session && session.accent)
        || (typeof W.__npGetAccent === 'function' ? W.__npGetAccent() : '#dcb8ff');
      box.querySelectorAll('.npAccentDot').forEach(el => {
        el.classList.toggle('isActive', el.getAttribute('data-hex').toLowerCase() === String(cur).toLowerCase());
      });
    }

    function buildUI(){
      built = true;

      const bgList       = sidebar.querySelector('#npBgList');
      const bgStatus     = sidebar.querySelector('#npBgStatus');
      const bgQuery      = sidebar.querySelector('#npBgQuery');
      const bgReload     = sidebar.querySelector('#npBgReload');
      const bgFavOnly    = sidebar.querySelector('#npBgFavOnly');
      const bgHiddenOnly = sidebar.querySelector('#npBgHiddenOnly');
      const saveBtn      = sidebar.querySelector('#npBgSave');
      const cancelBtn    = sidebar.querySelector('#npBgCancel');
      const bodyEl       = sidebar.querySelector('#npBgBody');
      const themeSel     = sidebar.querySelector('#npBtnTheme');

      themeSel?.addEventListener('change', () => {
        if (!session) return;
        session.btnTheme = themeSel.value;
        if (typeof W.__npApplyBtnTheme === 'function') W.__npApplyBtnTheme(themeSel.value);
      });
      refreshThemeSelect();

      const accentBox = sidebar.querySelector('#npAccentPastilles');
      accentBox?.addEventListener('click', (e) => {
        const btn = e.target.closest('.npAccentDot');
        if (!btn || !session) return;
        const hex = btn.getAttribute('data-hex');
        if (!hex) return;
        session.accent = hex;
        if (typeof W.__npApplyAccent === 'function') W.__npApplyAccent(hex);
        accentBox.querySelectorAll('.npAccentDot').forEach(el => {
          el.classList.toggle('isActive', el === btn);
        });
      });
      refreshAccentPastilles();

      // Site-recolor toggle — global on/off, applied + persisted instantly
      // (independent of the panel's Save/Cancel; it only flips a body class).
      // The button shows an animated rainbow when active, greyed when off.
      /* Top-bar surface — applied + persisted instantly, like the recolor
         toggle below and unlike the background/accent picks, which go
         through the panel's Save/Cancel. */
      const topbarSel = sidebar.querySelector('#npTopbarBg');
      if (topbarSel){
        topbarSel.value = LSget(LS.topbarBg, 'none');
        topbarSel.addEventListener('change', () => {
          const v = applyTopbarBg(topbarSel.value);
          topbarSel.value = v;
          LSset(LS.topbarBg, v);
        });
      }

      // Inventory menu bar — same instant contract.
      const invBox = sidebar.querySelector('#npInvMenubar');
      if (invBox){
        invBox.checked = LSget(LS.invBar, '0') === '1';
        invBox.addEventListener('change', () => {
          applyInvMenubar(invBox.checked);
          LSset(LS.invBar, invBox.checked ? '1' : '0');
        });
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

      let dtiAll = [];
      let dtiFiltered = [];
      let renderCount = 0;
      const RENDER_STEP = 30;
      let favs   = readFavs();
      let hidden = readHidden();
      let favOnly    = false;
      let hiddenOnly = false;

      function syncFilterBtns(){
        bgFavOnly.classList.toggle('isOn', favOnly);
        bgHiddenOnly.classList.toggle('isOn', hiddenOnly);
      }

      function renderMore(){
        const slice = dtiFiltered.slice(renderCount, renderCount + RENDER_STEP);
        for (const it of slice){
          const row = document.createElement('div');
          row.className = 'npBgItem';
          const isFav = favs.has(it.id);
          const isHid = hidden.has(it.id);
          if (isHid) row.classList.add('isHidden');
          row.innerHTML = `
            <div class="npBgThumb" style="background-image:url('${safeUrl(it.thumbnailUrl)}')"></div>
            <div class="npBgName" title="${it.name.replace(/"/g,'&quot;')}">${it.name}</div>
            <button type="button" class="npFavBtn ${isFav?'isOn':''}" title="Favorite">★</button>
            <button type="button" class="npBgBtn npBgL" data-url="${safeUrl(it.url)}" title="Use on LEFT decor column">L</button>
            <button type="button" class="npBgBtn npBgR" data-url="${safeUrl(it.url)}" title="Use as MAIN background">M</button>
            <button type="button" class="npHideBtn ${isHid?'isOn':''}" title="${isHid?'Restore':'Hide this background'}">🗑</button>
          `;
          const favBtn  = row.querySelector('.npFavBtn');
          const btnL    = row.querySelector('.npBgL');
          const btnR    = row.querySelector('.npBgR');
          const hideBtn = row.querySelector('.npHideBtn');
          /* Fav/hide toggles update IN PLACE (row removed/adjusted, filtered
             list spliced) instead of re-running applyFilter() — the full
             re-render reset the list to the top 30 rows, which made the
             sidebar visually "scroll through" backgrounds before settling
             whenever an item far down the list was hidden. */
          const dropRowInPlace = () => {
            const idx = dtiFiltered.indexOf(it);
            if (idx >= 0){
              dtiFiltered.splice(idx, 1);
              if (idx < renderCount) renderCount--;
            }
            row.remove();
            updateStatus();
          };
          favBtn.addEventListener('click', (ev) => {
            ev.preventDefault(); ev.stopPropagation();
            if (favs.has(it.id)) favs.delete(it.id); else favs.add(it.id);
            writeFavs(favs);
            favBtn.classList.toggle('isOn', favs.has(it.id));
            // In favorites-only view, unfavoriting removes the row.
            if (favOnly && !favs.has(it.id)) dropRowInPlace();
          });
          hideBtn.addEventListener('click', (ev) => {
            ev.preventDefault(); ev.stopPropagation();
            if (hidden.has(it.id)) hidden.delete(it.id); else hidden.add(it.id);
            writeHidden(hidden);
            const nowHidden = hidden.has(it.id);
            // The row leaves the CURRENT view when: hidden in normal view,
            // or restored in trash view. Otherwise just repaint its state.
            const leavesView = hiddenOnly ? !nowHidden : nowHidden;
            if (leavesView){
              dropRowInPlace();
            } else {
              row.classList.toggle('isHidden', nowHidden);
              hideBtn.classList.toggle('isOn', nowHidden);
              hideBtn.title = nowHidden ? 'Restore' : 'Hide this background';
            }
          });
          btnL.addEventListener('click', (ev) => {
            ev.preventDefault(); ev.stopPropagation();
            if (!session) return;
            session.leftBg = it.url;
            applyLeftBg(it.url);
            refreshActives();
          });
          btnR.addEventListener('click', (ev) => {
            ev.preventDefault(); ev.stopPropagation();
            if (!session) return;
            session.mainBg = it.url;
            applyMainBg(it.url);
            refreshActives();
          });
          bgList.appendChild(row);
        }
        renderCount += slice.length;
        refreshActives();
      }

      function applyFilter(){
        const q = (bgQuery.value || '').trim().toLowerCase();
        dtiFiltered = dtiAll.filter(it => {
          const isHid = hidden.has(it.id);
          if (hiddenOnly){
            if (!isHid) return false;
          } else {
            if (isHid) return false;
            if (favOnly && !favs.has(it.id)) return false;
          }
          if (q && !it.name.toLowerCase().includes(q)) return false;
          return true;
        });
        bgList.innerHTML = '';
        renderCount = 0;
        renderMore();
        updateStatus();
      }

      function updateStatus(){
        if (!dtiAll.length){
          bgStatus.textContent = 'No backgrounds loaded. Click ↻ to fetch from DTI.';
        } else if (!dtiFiltered.length){
          if (hiddenOnly) bgStatus.textContent = '0 hidden backgrounds (trash is empty).';
          else if (favOnly) bgStatus.textContent = `0 favorite${favs.size ? ' matching' : ''} (out of ${dtiAll.length} backgrounds).`;
          else bgStatus.textContent = `No results (out of ${dtiAll.length} cached backgrounds).`;
        } else {
          const note = hiddenOnly ? ' (trash)' : (favOnly ? ' (favorites)' : '');
          bgStatus.textContent = `${dtiFiltered.length} background${dtiFiltered.length > 1 ? 's' : ''}${note} shown (${Math.min(renderCount, dtiFiltered.length)} rendered).`;
        }
      }

      bodyEl.addEventListener('scroll', () => {
        if (renderCount >= dtiFiltered.length) return;
        if (bodyEl.scrollTop + bodyEl.clientHeight >= bodyEl.scrollHeight - 120) renderMore();
      });

      bgQuery.addEventListener('input', applyFilter);
      bgFavOnly.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        favOnly = !favOnly;
        if (favOnly) hiddenOnly = false;
        syncFilterBtns();
        applyFilter();
      });
      bgHiddenOnly.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        hiddenOnly = !hiddenOnly;
        if (hiddenOnly) favOnly = false;
        syncFilterBtns();
        applyFilter();
      });

      async function loadDTI(force = false){
        if (!force){
          const cached = readDTICached();
          if (cached && cached.length){
            dtiAll = cached;
            applyFilter();
            return;
          }
        }
        bgStatus.textContent = 'Loading from DTI…';
        try {
          const items = await fetchDTIBackgrounds((page, count) => {
            bgStatus.textContent = `Loading from DTI… (page ${page}, ${count} backgrounds)`;
          });
          if (items.length){
            dtiAll = items;
            writeDTICached(items);
            applyFilter();
            bgStatus.textContent = `${items.length} backgrounds loaded from DTI.`;
          } else {
            bgStatus.textContent = 'No backgrounds returned by DTI.';
          }
        } catch (err) {
          bgStatus.textContent = 'DTI fetch failed: ' + (err.message || err);
        }
      }

      bgReload.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); loadDTI(true); });

      const cached = readDTICached();
      if (cached && cached.length){
        dtiAll = cached;
        applyFilter();
      } else {
        updateStatus();
        setTimeout(() => loadDTI(false), 60);
      }
    }
  });

})();

})();

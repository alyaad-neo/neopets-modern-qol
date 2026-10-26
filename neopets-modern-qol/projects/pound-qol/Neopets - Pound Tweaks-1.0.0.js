// ==UserScript==
// @name         Neopets - Pound Tweaks
// @namespace    neopets-qol-patcher
// @version      1.0.0
// @description  Neopets Pound: modern layout, Show more Neopets, search header, pet card chips (Painted / Well named / New), visited pet purple names, report row, adopt button.
// @match        *://*.neopets.com/pound*
// @match        *://*.neopets.com/transfer*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  if (window.top !== window) return;
  if (!/^(www\.|ncmall\.)?neopets\.com$/i.test(location.hostname)) return;

  const root = document.documentElement;
  const LSget = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
  const LSset = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const LSdel = (k) => { try { localStorage.removeItem(k); } catch {} };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const isPopup = /popup/.test(location.pathname) || (!!window.opener && window.outerWidth < 900);
  const isNc = location.hostname.toLowerCase() === 'ncmall.neopets.com';
  if (isNc || isPopup) return;    // pound tweaks are for the classic pages only

  const POUND_PATH = /\/(pound|transfer)(\/|\.|$)/i;
  if (!POUND_PATH.test(location.pathname)) return;

  /* ─────────────────────────────────────────────── icons ─────────────────────────────────────────────── */
  const CHEV = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M3.5 6.2l4.5 4.5 4.5-4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const REFRESH_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.2 6.2A5.3 5.3 0 0 0 3.3 5M2.8 2.4V5.2h2.8M2.8 9.8A5.3 5.3 0 0 0 12.7 11M13.2 13.6V10.8h-2.8"/></svg>';
  const ARROW_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8h10.5M9 3.8 13.2 8 9 12.2"/></svg>';
  const COPY_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5.2" y="5.2" width="8" height="8" rx="2"/><path d="M10.8 5.2V4.2a2 2 0 0 0-2-2H4.2a2 2 0 0 0-2 2v4.6a2 2 0 0 0 2 2h1"/></svg>';
  const CHECK_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.2 8.6 6.6 12 13 4.6"/></svg>';

  /* ─────────────────────────────────────────── pound CSS ─────────────────────────────────────────────── */
  const POUND_CSS = `#nppPoundRefresh { position: fixed; top: 74px; right: 28px; z-index: 900; display: flex; align-items: center; gap: 9px; height: 46px; padding: 0 22px 0 17px; border: 1px solid rgba(0,0,0,.2); border-radius: 999px; background: linear-gradient(180deg, color-mix(in srgb, var(--np-accent, #fff) 80%, #fff) 0%, var(--np-accent, #fff) 50%, color-mix(in srgb, var(--np-accent, #fff) 86%, #000) 100%); color: var(--npp-accent-fg, #1a1330); text-shadow: var(--npp-accent-fg-shadow, none); box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 2px 6px rgba(0,0,0,.14); cursor: pointer; transition: transform .15s, filter .15s; }
#nppPoundRefresh span { font: 400 19px/1 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .02em; }
#nppPoundRefresh svg { width: 20px; height: 20px; transition: transform .5s cubic-bezier(.22, 1, .36, 1); }
#nppPoundRefresh:hover { filter: brightness(1.06); transform: translateY(-1px); }
#nppPoundRefresh:hover svg { transform: rotate(180deg); }
#nppPoundRefresh:active { transform: translateY(1px) scale(.98); }
#nppPoundRefresh.inline { position: static; top: auto; right: auto; display: inline-flex; margin: 8px 0; }
@font-face { font-family: 'CafeteriaBlack'; src: url('https://images.neopets.com/js/fonts/cafeteria-black.otf') format('opentype'); font-display: swap; }
html.npp-pound .page_header, html.npp-pound #page_header { font: 400 42px/1.05 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .01em; margin: 4px 0 8px !important; text-shadow: 0 2px 0 rgba(0,0,0,.06); }
html.npp-pound #page_header + p { display: none !important; }
html.npp-pound #search { display: flex !important; align-items: center; gap: 16px; flex-wrap: wrap; height: auto !important; margin: 0 0 24px !important; padding: 12px 14px 12px 24px; border: 1px solid rgba(0,0,0,.07); border-radius: 20px; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04); }
html.npp-pound #search form { display: flex; align-items: center; gap: 16px; flex: 1 1 420px; margin: 0; }
html.npp-pound #search form > span { color: #111827; font-size: 17px !important; font-weight: 700 !important; letter-spacing: .01em; white-space: nowrap; }
html.npp-pound #search.nppSearchMoved { display: none !important; }
html.npp-pound .contentModuleHeader.nppHeadBar { padding: 14px 20px !important; }
html.npp-pound .nppHeadInner { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
html.npp-pound .nppHeadInner form { display: flex; align-items: center; gap: 14px; flex: 1 1 380px; margin: 0; min-width: 0; }
html.npp-pound .nppHeadInner form > span { color: var(--npp-accent-fg, #1a1330); font-size: 19px !important; font-weight: 700 !important; letter-spacing: .01em; text-shadow: var(--npp-accent-fg-shadow, none); white-space: nowrap; }
html.npp-pound .nppHeadInner input[type="submit"] { display: none !important; }
html.npp-pound .nppHeadInner #search_name { background: #fff; border-color: rgba(0,0,0,.08); box-shadow: 0 1px 3px rgba(0,0,0,.12); }
html.npp-pound .nppHeadInner #search_name:hover { background: #fff; border-color: rgba(0,0,0,.16); }
html.npp-pound .nppHeadInner #nppPoundRefresh { height: 48px; margin: 0; padding: 0 24px 0 20px; border: 0; background: #fff !important; color: #1f2937 !important; text-shadow: none !important; box-shadow: 0 1px 3px rgba(0,0,0,.18); }
html.npp-pound .nppHeadInner #nppPoundRefresh:hover { background: #f3f4f6 !important; filter: none; transform: translateY(-1px); }
html.npp-pound .nppHeadInner #nppPoundRefresh span { font-size: 18px !important; }
html.npp-pound .nppSearchWrap { position: relative; display: flex; flex: 1 1 260px; min-width: 0; }
html.npp-pound #search_name { width: 100% !important; height: 48px; box-sizing: border-box; margin: 0 !important; padding: 0 58px 0 22px !important; border: 1px solid #e5e7eb; border-radius: 999px; background: #f6f7f9; box-shadow: none; font: 500 16px 'Outfit', system-ui, sans-serif; outline: 0; transition: border-color .15s, box-shadow .15s, background .15s; }
html.npp-pound #search_name { color: #111827; }
html.npp-pound #search_name::placeholder { color: #9ca3af; font-weight: 500; opacity: 1; }
html.npp-pound #search_name:not(:placeholder-shown) { text-transform: lowercase; }
html.npp-pound #search_name:hover { border-color: #d1d5db; background: #f3f4f6; }
html.npp-pound #search_name:focus { border-color: var(--np-accent, #8b5cf6); background: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--np-accent, #8b5cf6) 24%, transparent); }
html.npp-pound .nppSearchGo { position: absolute; right: 6px; top: 50%; width: 38px; height: 38px; padding: 0; display: flex; align-items: center; justify-content: center; transform: translateY(-50%); border: 0; border-radius: 50%; background: transparent; cursor: pointer; transition: background .15s, transform .2s cubic-bezier(.3, 1.4, .5, 1); }
html.npp-pound .nppSearchGo:hover { background: color-mix(in srgb, var(--np-accent, #8b5cf6) 22%, transparent); transform: translateY(-50%) scale(1.08); }
html.npp-pound .nppSearchGo img { width: 30px; height: 30px; display: block; filter: var(--npp-ico-shadow, drop-shadow(0 2px 3px rgba(0,0,0,.35))); }
html.npp-search-go #search input[type="submit"] { display: none !important; }
html.npp-pound #view_more { visibility: visible !important; float: none !important; margin: 0 0 0 auto !important; }
html.npp-pound #nppPoundRefresh.inline { height: 48px; margin: 0; padding: 0 24px 0 20px; border-color: rgba(0,0,0,.1); }
html.npp-pound #nppPoundRefresh.inline span { font-size: 18px !important; }
html.npp-pound .contentModule { height: auto !important; border: 0 !important; border-radius: 22px; background: #fff; box-shadow: 0 10px 34px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.06); overflow: hidden; }
html.npp-pound .contentModuleTable { width: 100%; border-collapse: collapse; border: 0; }
html.npp-pound .contentModuleHeader { padding: 14px 24px !important; background: linear-gradient(180deg, color-mix(in srgb, var(--np-accent, #8b5cf6) 78%, #fff), var(--np-accent, #8b5cf6)) !important; color: var(--npp-accent-fg, #1a1330) !important; font: 400 22px/1 'CafeteriaBlack', Georgia, serif !important; text-shadow: var(--npp-accent-fg-shadow, none); }
html.npp-pound .contentModuleContent { padding: 26px 24px 28px !important; background: transparent !important; }
html.npp-pound table[style*="801px"] { display: block !important; width: 100% !important; }
html.npp-pound table[style*="801px"] > tbody { display: block !important; }
html.npp-pound table[style*="801px"] > tbody > tr { display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; }
html.npp-pound table[style*="801px"] > tbody > tr > td { display: block !important; width: auto !important; }
html.npp-pound #pet0, html.npp-pound #pet1, html.npp-pound #pet2 { box-sizing: border-box; width: auto !important; height: 100%; margin: 0 !important; border: 2px solid rgba(0,0,0,.08) !important; border-radius: 18px !important; background: #fff !important; box-shadow: 0 4px 16px rgba(0,0,0,.06); position: relative; padding: 14px 20px 18px !important; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
html.npp-pound #pet0:hover, html.npp-pound #pet1:hover, html.npp-pound #pet2:hover { transform: translateY(-3px); box-shadow: 0 10px 26px rgba(0,0,0,.12); }
html.npp-pound #pet0[style*="solid green"], html.npp-pound #pet1[style*="solid green"], html.npp-pound #pet2[style*="solid green"] { border-color: #2e9e4f !important; box-shadow: 0 0 0 4px rgba(46,158,79,.28), 0 12px 30px rgba(0,0,0,.14); }
html.npp-pound #pet0 *:not(img), html.npp-pound #pet1 *:not(img), html.npp-pound #pet2 *:not(img) { background-color: transparent !important; }
html.npp-pound img.pound_neopet { filter: drop-shadow(0 8px 10px rgba(0,0,0,.2)); transition: transform .25s cubic-bezier(.3, 1.4, .5, 1); }
html.npp-pound #pet0:hover img.pound_neopet, html.npp-pound #pet1:hover img.pound_neopet, html.npp-pound #pet2:hover img.pound_neopet { transform: scale(1.05); }
html.npp-pound #pet0 *:not(img)[style*="height"], html.npp-pound #pet1 *:not(img)[style*="height"], html.npp-pound #pet2 *:not(img)[style*="height"] { height: auto !important; min-height: 0 !important; }
html.npp-pound #pet0 table, html.npp-pound #pet1 table, html.npp-pound #pet2 table { width: 100%; margin-top: 10px; border-spacing: 0; border-collapse: collapse; }
html.npp-pound #pet0 td, html.npp-pound #pet1 td, html.npp-pound #pet2 td { padding: 4px 0; vertical-align: top; text-align: left; }
html.npp-pound #pet0 td:first-child:not(:last-child), html.npp-pound #pet1 td:first-child:not(:last-child), html.npp-pound #pet2 td:first-child:not(:last-child) { width: 38%; padding-right: 10px; color: #6b7280; }
html.npp-pound #pet0 td:last-child:not(:first-child), html.npp-pound #pet1 td:last-child:not(:first-child), html.npp-pound #pet2 td:last-child:not(:first-child) { color: #111827; font-weight: 700; }
html.npp-pound #pet0 tr + tr td, html.npp-pound #pet1 tr + tr td, html.npp-pound #pet2 tr + tr td { border-top: 1px solid rgba(0,0,0,.06); }
html.npp-pound #pet0 [style*="color: green"], html.npp-pound #pet1 [style*="color: green"], html.npp-pound #pet2 [style*="color: green"] { color: #1e7a3d !important; }
html.npp-pound [id^="pet"] .nppHideRow { display: none !important; }
html.npp-pound #pet0.nppPainted:not([style*="solid green"]), html.npp-pound #pet1.nppPainted:not([style*="solid green"]), html.npp-pound #pet2.nppPainted:not([style*="solid green"]) { border-color: #e2b43c !important; box-shadow: 0 0 0 3px rgba(226,180,60,.22), 0 6px 20px rgba(0,0,0,.08); }
html.npp-pound table[style*="801px"] > tbody > tr { min-height: 470px; }
html.npp-pound #pet0.nppEmpty, html.npp-pound #pet1.nppEmpty, html.npp-pound #pet2.nppEmpty { display: flex; align-items: center; justify-content: center; text-align: center; border-color: transparent !important; background: transparent !important; box-shadow: none !important; cursor: default; transform: none !important; }
html.npp-pound .nppPoundCopy { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; margin: 0 0 3px 10px; padding: 0; vertical-align: middle; border: 1px solid rgba(0,0,0,.14); border-radius: 8px; background: #fff; color: #4b5563; cursor: pointer; transition: background .15s, color .15s, border-color .15s; }
html.npp-pound .nppPoundCopy:hover { background: #f3f4f6; color: #111827; }
html.npp-pound .nppPoundCopy.done { border-color: #2e9e4f; background: #ecfdf3; color: #1e7a3d; }
html.npp-pound .nppPoundCopy svg { width: 15px; height: 15px; display: block; }
html.npp-pound .nppPoundChips { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); z-index: 2; display: flex; gap: 8px; white-space: nowrap; pointer-events: none; }
html.npp-pound .nppPoundChip { padding: 4px 14px; border-radius: 999px; font: 700 11px/1.3 'Outfit', system-ui, sans-serif; letter-spacing: .04em; text-transform: uppercase; box-shadow: 0 2px 6px rgba(0,0,0,.16); }
html.npp-pound .nppPoundChip.painted { background: linear-gradient(180deg, #f6d56a, #e2b43c); color: #4a3500; }
html.npp-pound .nppPoundChip.well { background: linear-gradient(180deg, #9ccbff, #4f9bf0); color: #0b2a55; }
html.npp-pound .nppPoundChip.new { background: linear-gradient(180deg, #7ee0a2, #35b96a); color: #06331b; }
html.npp-pound .nppPetName { margin: 14px 0 8px; text-align: center; overflow-wrap: anywhere; }
html.npp-pound .nppPetName.visited { color: #7c3aed; }
html.npp-pound .nppPetName.visited, html.npp-pound .nppPetName.visited * { text-decoration: underline; text-decoration-color: currentColor; text-decoration-thickness: 2px; text-underline-offset: 3px; }
html.npp-pound .nppPetName, html.npp-pound .nppPetName * { font: 400 clamp(20px, 1.9vw, 27px)/1.15 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .01em; }
html.npp-pound .nppReportRow { display: flex !important; flex-wrap: wrap; align-items: center; gap: 10px 12px; margin: 22px 0 0; padding: 12px 14px 12px 20px; border: 1px solid rgba(0,0,0,.07); border-radius: 18px; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04); color: #374151; font: 500 14px 'Outfit', system-ui, sans-serif; }
html.npp-pound .nppReportRow::before { content: ""; width: 20px; height: 20px; flex: none; background: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 21V4m0 0h11l-2 4 2 4H5'/%3E%3C/svg%3E") center / contain no-repeat; }
html.npp-pound .nppReportRow br { display: none; }
html.npp-pound .nppReportRow > b, html.npp-pound .nppReportRow > strong { margin-right: 6px; color: #111827; font-size: 15px; font-weight: 700; letter-spacing: .01em; }
html.npp-pound .nppRepItem { display: inline-flex; align-items: center; gap: 9px; padding: 7px 16px 7px 11px; border: 1px solid #e5e7eb; border-radius: 999px; background: #f6f7f9; color: #1f2937; font-size: 14px; font-weight: 600; cursor: pointer; transition: border-color .15s, background .15s; }
html.npp-pound .nppRepItem:hover { border-color: #d1d5db; background: #f3f4f6; }
html.npp-pound .nppRepItem:has(input:checked) { border-color: #dc2626; background: #fef2f2; color: #991b1b; }
html.npp-pound .nppReportRow input[type="checkbox"] { -webkit-appearance: none; appearance: none; display: grid; place-content: center; width: 18px; height: 18px; margin: 0; border: 2px solid rgba(0,0,0,.3); border-radius: 6px; background: #fff; cursor: pointer; transition: background .15s, border-color .15s; }
html.npp-pound .nppReportRow input[type="checkbox"]:checked { border-color: #dc2626; background: #dc2626; }
html.npp-pound .nppReportRow input[type="checkbox"]:checked::after { content: ""; width: 5px; height: 9px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg) translate(-1px, -1px); }
html.npp-pound .nppReportRow input[value="Report!"] { margin-left: auto; }
html.npp-pound input[value="Report!"] { height: 38px; padding: 0 20px; border: 1px solid rgba(0,0,0,.16); border-radius: 999px; background: #fff; color: #374151; font: 700 14px 'Outfit', system-ui, sans-serif; cursor: pointer; transition: background .15s, border-color .15s, color .15s; }
html.npp-pound input[value="Report!"]:hover { background: #fef2f2; border-color: #dc2626; color: #991b1b; }
html.npp-pound .contentModuleContent div[style*="background-color: green"] { display: none !important; }
html.npp-adopt-btn #processAdoptBtn { display: none !important; }
#nppAdoptBtn:disabled { background: #d9dce1 !important; color: #8b919c !important; border-color: rgba(0,0,0,.08); text-shadow: none; box-shadow: none; cursor: not-allowed; filter: none; transform: none; }
#nppAdoptBtn:disabled:hover { filter: none; transform: none; }
#nppAdoptBtn:disabled:hover svg { transform: none; }
#nppAdoptBtn { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 24px 0 0 auto; height: 54px; padding: 0 36px; border: 1px solid rgba(0,0,0,.2); border-radius: 999px; background: linear-gradient(180deg, color-mix(in srgb, var(--np-accent, #8b5cf6) 80%, #fff) 0%, var(--np-accent, #8b5cf6) 50%, color-mix(in srgb, var(--np-accent, #8b5cf6) 86%, #000) 100%); color: var(--npp-accent-fg, #1a1330); text-shadow: var(--npp-accent-fg-shadow, none); box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 8px 22px rgba(0,0,0,.22); cursor: pointer; transition: transform .15s, filter .15s; }
#nppAdoptBtn span { font: 400 22px/1 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .02em; }
#nppAdoptBtn svg { width: 20px; height: 20px; transition: transform .25s cubic-bezier(.3, 1.4, .5, 1); }
#nppAdoptBtn:hover { filter: brightness(1.06); transform: translateY(-2px); }
#nppAdoptBtn:hover svg { transform: translateX(4px); }
@media (max-width: 900px) { html.npp-pound table[style*="801px"] > tbody > tr { grid-template-columns: 1fr; } }
input[value*="view more neopets" i] { display: none !important; }`;

  // Inject CSS and the root class immediately (before body exists, we drop the style into <head>).
  const styleEl = document.createElement('style');
  styleEl.id = 'npp-pound-css';
  styleEl.textContent = POUND_CSS;
  (document.head || root).appendChild(styleEl);
  root.classList.add('npp-pound');

  /* ───────────────────────────────────── pound storage & helpers ──────────────────────────────────────── */
  const BASIC_COLOURS = ['green', 'blue', 'red', 'yellow'];

  const SEEN_PETS_KEY = 'npp_seen_pets_v1';
  const SEEN_PETS_MAX = 5000;
  const VISITED_KEY = 'npp_visited_pets_v1';
  const VISITED_MAX = 5000;
  let _seenCache = { raw: null, arr: [] }, _visCache = { raw: null, arr: [] };
  function seenPetsLoad() { const raw = LSget(SEEN_PETS_KEY); if (raw !== _seenCache.raw) { try { _seenCache = { raw, arr: JSON.parse(raw || '[]') || [] }; } catch { _seenCache = { raw, arr: [] }; } } return _seenCache.arr; }
  function seenPetsSave(arr) { LSset(SEEN_PETS_KEY, JSON.stringify(arr)); _seenCache.raw = null; }
  function seenPetsCheck(name) {
    const key = String(name || '').trim().toLowerCase();
    if (!key) return true;
    const arr = seenPetsLoad();
    const had = arr.includes(key);
    if (!had) {
      arr.push(key);
      if (arr.length > SEEN_PETS_MAX) arr.splice(0, arr.length - SEEN_PETS_MAX);
      seenPetsSave(arr);
    }
    return had;
  }
  function visitedLoad() { const raw = LSget(VISITED_KEY); if (raw !== _visCache.raw) { try { _visCache = { raw, arr: JSON.parse(raw || '[]') || [] }; } catch { _visCache = { raw, arr: [] }; } } return _visCache.arr; }
  function visitedSave(a) { LSset(VISITED_KEY, JSON.stringify(a)); _visCache.raw = null; }
  function visitedHas(name) { const k = String(name || '').trim().toLowerCase(); return !!k && visitedLoad().includes(k); }
  function visitedAdd(name) {
    const k = String(name || '').trim().toLowerCase();
    if (!k) return;
    const a = visitedLoad();
    if (a.includes(k)) return;
    a.push(k);
    if (a.length > VISITED_MAX) a.splice(0, a.length - VISITED_MAX);
    visitedSave(a);
  }
  const looksLikePetName = (n) => /^[A-Za-z0-9_]{2,30}$/.test(n) && !/^(likes|attitude|habitat|colour|color|gender|age|level)$/i.test(n);

  const COMMON_TRIPLES = new Set(['str', 'spr', 'spl', 'scr', 'shr', 'thr', 'chr', 'sch', 'sph', 'nch', 'tch', 'rst', 'lst', 'nst', 'ngs', 'nds', 'rds', 'lds', 'mpt', 'mps', 'rch', 'lch', 'ght', 'rth', 'nth', 'rng', 'ngr', 'ndr', 'ntr', 'ckl', 'ckn', 'rsh', 'nsh', 'lsh', 'rns', 'lms', 'rms', 'dst', 'nks']);
  const KEYBOARD_RUNS = ['asd', 'sdf', 'dfg', 'fgh', 'ghj', 'hjk', 'jkl', 'qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio', 'iop', 'zxc', 'xcv', 'cvb', 'vbn', 'bnm'];
  const petNameFrom = (el) => {
    if (!el) return '';
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return n.textContent.trim();
    return (el.textContent || '').split(/\r?\n/)[0].trim();
  };
  function isWellNamed(raw) {
    const n = String(raw || '').trim();
    if (!n) return false;
    // Strict definition: capitalised, letters only, no digits or underscores, 3–9 letters long.
    if (!/^[A-Z][a-z]{2,8}$/.test(n)) return false;
    const l = n.toLowerCase(), isV = (c) => 'aeiouy'.includes(c);
    if (KEYBOARD_RUNS.some(k => l.includes(k))) return false;
    if (/(.)\1\1/.test(l)) return false;
    const vowels = [...l].filter(isV).length;
    if (!vowels || vowels / l.length < 0.25) return false;
    if (/[aeiouy]{4,}/.test(l)) return false;
    if ((l.match(/[^aeiouy]+/g) || []).some(r => r.length >= 4 || (r.length === 3 && !COMMON_TRIPLES.has(r)))) return false;
    return true;
  }
  async function copyPlain(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    try { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch { return false; }
  }
  const searchIconUrl = () => {
    try { if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.__npBtnIconUrl === 'function') return unsafeWindow.__npBtnIconUrl('search', (typeof unsafeWindow.__npGetBtnTheme === 'function' && unsafeWindow.__npGetBtnTheme()) || 'basic'); } catch {}
    return 'https://images.neopets.com/themes/h5/basic/images/v3/search-icon.svg';
  };

  /* ───────────────────────────────────────── pound DOM taggers ────────────────────────────────────────── */
  function poundSearchActive() { const i = document.getElementById('search_name'); return !!(i && (i.dataset.nppWas || location.search)); }
  function poundReload() {
    const i = document.getElementById('search_name');
    if (i && !i.value.trim() && poundSearchActive()) location.assign(location.pathname); else location.reload();
  }
  function poundPlace() {
    if (!document.body || document.getElementById('nppPoundRefresh')) return !!document.getElementById('nppPoundRefresh');
    const native = [...document.querySelectorAll('input[type="submit"], input[type="button"], button, a')].find(el => {
      const t = String(el.value || el.textContent || '').trim();
      return t.length < 40 && /view\s*more\s*neopets/i.test(t);
    });
    const make = () => {
      const b = document.createElement('button');
      b.id = 'nppPoundRefresh'; b.type = 'button';
      b.title = 'Show a new batch of Neopets (reloads the page once, same as F5)';
      b.innerHTML = REFRESH_ICON + '<span>Show more Neopets</span>';
      b.addEventListener('click', poundReload);
      return b;
    };
    if (native) {
      const b = make(); b.classList.add('inline');
      native.insertAdjacentElement('beforebegin', b);
      native.style.setProperty('display', 'none', 'important');
      return true;
    }
    return false;
  }
  function placeAdopt() {
    const img = document.getElementById('processAdoptBtn');
    if (!img) return false;
    if (document.getElementById('nppAdoptBtn')) return true;
    const b = document.createElement('button');
    b.id = 'nppAdoptBtn'; b.type = 'button'; b.title = 'Adopt the selected Neopet';
    b.innerHTML = '<span>Adopt this Neopet</span>' + ARROW_ICON;
    b.addEventListener('click', () => img.click());
    img.insertAdjacentElement('beforebegin', b);
    root.classList.add('npp-adopt-btn');
    return true;
  }
  function tagSearch() {
    const inp = document.getElementById('search_name'), form = inp && inp.closest('form');
    if (!form || !inp) return;
    const lab = form.querySelector('span');
    if (lab && /search/i.test(lab.textContent)) lab.remove();
    if (inp.dataset.nppPh !== '1') {
      inp.dataset.nppPh = '1';
      inp.removeAttribute('onfocus'); inp.removeAttribute('onblur');
      inp.placeholder = 'Search the pound...'; inp.setAttribute('aria-label', 'Search the pound');
      if (/^enter search text/i.test(inp.value)) inp.value = '';
      inp.dataset.nppWas = inp.value.trim() ? '1' : '';
      inp.style.removeProperty('color'); inp.style.removeProperty('text-transform');
      form.addEventListener('submit', (e) => {
        if (inp.value.trim()) return;
        e.preventDefault();
        if (poundSearchActive()) location.assign(location.pathname); else inp.focus();
      });
    }
    let wrap = inp.closest('.nppSearchWrap');
    if (!wrap) {
      wrap = document.createElement('div'); wrap.className = 'nppSearchWrap';
      inp.parentNode.insertBefore(wrap, inp); wrap.appendChild(inp);
      const btn = document.createElement('button'); btn.type = 'submit'; btn.className = 'nppSearchGo'; btn.title = 'Search'; btn.setAttribute('aria-label', 'Search');
      btn.innerHTML = '<img alt="">'; wrap.appendChild(btn);
      root.classList.add('npp-search-go');
    }
    const img = wrap.querySelector('img'), u = searchIconUrl();
    if (img && img.getAttribute('src') !== u) img.src = u;
  }
  function updateChips(card, painted, well, isNew) {
    let box = card.querySelector(':scope > .nppPoundChips');
    const want = (isNew ? '<span class="nppPoundChip new">New</span>' : '') + (painted ? '<span class="nppPoundChip painted">Painted</span>' : '') + (well ? '<span class="nppPoundChip well">Well named</span>' : '');
    if (!want) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement('div'); box.className = 'nppPoundChips'; card.appendChild(box); }
    if (box.innerHTML !== want) box.innerHTML = want;
  }
  function syncAdopt() {
    const btn = document.getElementById('nppAdoptBtn');
    if (!btn) return;
    const sel = ['pet0', 'pet1', 'pet2'].some(id => { const c = document.getElementById(id); return c && !c.classList.contains('nppEmpty') && /solid\s+green/i.test(c.getAttribute('style') || ''); });
    if (btn.disabled === sel) { btn.disabled = !sel; btn.title = sel ? 'Adopt the selected Neopet' : 'Select a Neopet first'; }
  }
  function layoutPoundHeader() {
    const head = document.querySelector('.contentModuleHeader'), inp = document.getElementById('search_name'), form = inp && inp.closest('form');
    if (!head || !form) return;
    let wrap = head.querySelector(':scope > .nppHeadInner');
    if (!wrap) {
      head.textContent = '';
      head.classList.add('nppHeadBar');
      wrap = document.createElement('div'); wrap.className = 'nppHeadInner';
      head.appendChild(wrap); wrap.appendChild(form);
      const old = document.getElementById('search'); if (old) old.classList.add('nppSearchMoved');
    }
    const btn = document.getElementById('nppPoundRefresh');
    if (btn && !wrap.contains(btn)) wrap.appendChild(btn);
  }
  function tagPetNames() {
    ['pet0', 'pet1', 'pet2'].forEach(id => {
      const card = document.getElementById(id);
      if (!card) return;
      let colour = '';
      card.querySelectorAll('tr').forEach(tr => {
        const c = tr.cells; if (!c || !c.length) return;
        const label = c[0].textContent.trim();
        if (/^(likes|attitude|habitat)\b/i.test(label)) tr.classList.add('nppHideRow');
        else if (c.length > 1 && /^colou?r\b/i.test(label)) colour = c[1].textContent.trim();
      });
      const painted = !!colour && !BASIC_COLOURS.includes(colour.toLowerCase());
      if (!card.querySelector('.nppPetName')) {
        const img = card.querySelector('img.pound_neopet') || [...card.querySelectorAll('img')].find(i => !/load|anim/i.test(i.getAttribute('src') || ''));
        if (img) {
          let blk = img; while (blk.parentElement && blk.parentElement !== card) blk = blk.parentElement;
          let n = blk.nextElementSibling;
          while (n && (!n.textContent.trim() || n.tagName === 'TABLE' || n.querySelector('table') || n.classList.contains('nppPoundChips'))) n = n.nextElementSibling;
          if (!n) {
            n = [...blk.querySelectorAll('div, b, strong, span, a')].find(e => !e.contains(img) && e.textContent.trim() && !e.querySelector('img, table') && (img.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING));
          }
          if (n) n.classList.add('nppPetName');
        }
      }
      card.classList.toggle('nppEmpty', !card.querySelector('table, img.pound_neopet'));
      const nameEl = card.querySelector('.nppPetName');
      const petName = petNameFrom(nameEl);
      const well = !!petName && isWellNamed(petName);
      if (petName && looksLikePetName(petName) && card.dataset.nppSeen !== '1') {
        card.dataset.nppSeen = '1';
        card.dataset.nppNew = seenPetsCheck(petName) ? '' : '1';
      }
      const isNew = card.dataset.nppNew === '1';
      const visited = !!petName && visitedHas(petName);
      if (nameEl) nameEl.classList.toggle('visited', visited);
      card.classList.toggle('nppPainted', painted && well);
      updateChips(card, painted && well, well, isNew);
      if (nameEl) {
        let cb = nameEl.querySelector('.nppPoundCopy');
        if (painted || well) {
          if (!cb) { cb = document.createElement('button'); cb.type = 'button'; cb.className = 'nppPoundCopy'; cb.innerHTML = COPY_SVG; nameEl.appendChild(cb); }
          cb.title = `Copy "!p ${petName}"`; cb.setAttribute('aria-label', cb.title);
        } else if (cb) cb.remove();
      }
    });
  }
  function tagReportRow() {
    const btn = document.querySelector('input[value="Report!"]'), boxes = [...document.querySelectorAll('input[type="checkbox"]')];
    if (!btn || !boxes.length || document.querySelector('.nppReportRow')) return;
    const P = btn.parentNode;
    if (!P) return;
    const top = (el) => { while (el && el.parentNode !== P) el = el.parentNode; return el; };
    if (boxes.some(x => !top(x))) return;
    const nodes = [...P.childNodes];
    const label = [...P.children].find(n => /report\s+inappropriate/i.test(n.textContent) && !n.querySelector('input, table, img, div'));
    const iS = nodes.indexOf(label || top(boxes[0])), iE = nodes.indexOf(top(btn));
    if (iS < 0 || iE < iS) return;
    const row = document.createElement('div'); row.className = 'nppReportRow';
    P.insertBefore(row, nodes[iS]);
    nodes.slice(iS, iE + 1).forEach(n => row.appendChild(n));
    boxes.forEach(box => {
      if (box.closest('.nppRepItem')) return;
      const t = box.nextSibling;
      if (t && t.nodeType === 3 && t.textContent.trim()) { const lab = document.createElement('label'); lab.className = 'nppRepItem'; box.parentNode.insertBefore(lab, box); lab.append(box, t); }
    });
  }

  /* ────────────────────────────────────────── boot & observers ────────────────────────────────────────── */
  document.addEventListener('click', async (e) => {
    const b = e.target.closest && e.target.closest('.nppPoundCopy');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const el = b.closest('.nppPetName'), name = petNameFrom(el);
    if (!name) return;
    const ok = await copyPlain('!p ' + name);
    b.classList.toggle('done', ok); b.innerHTML = ok ? CHECK_SVG : COPY_SVG;
    setTimeout(() => { b.classList.remove('done'); b.innerHTML = COPY_SVG; }, 1300);
  }, true);

  function retagNow() {
    try { tagSearch(); layoutPoundHeader(); tagPetNames(); tagReportRow(); syncAdopt(); } catch {}
  }
  poundPlace(); placeAdopt();
  let tagRaf = 0;
  const retag = () => { cancelAnimationFrame(tagRaf); tagRaf = requestAnimationFrame(retagNow); };
  new MutationObserver(retag).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  retag();

  const mo = new MutationObserver(() => { poundPlace(); placeAdopt(); });
  mo.observe(root, { childList: true, subtree: true });
  const last = () => { poundPlace(); placeAdopt(); mo.disconnect(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(last, 400), { once: true }); else setTimeout(last, 400);

  // "View more Neopets" → reload, in case the page builds it after load.
  document.addEventListener('click', (e) => {
    let el = e.target;
    for (let i = 0; el && el !== document.body && i < 4; i++, el = el.parentElement) {
      const t = String(el.value || el.textContent || '').trim();
      if (t.length < 40 && /view\s*more\s*neopets/i.test(t)) { e.preventDefault(); e.stopImmediatePropagation(); poundReload(); return; }
    }
  }, true);

  // Petlookup visits → remember for the purple+underline marker.
  if (/\/petlookup\.phtml$/i.test(location.pathname)) {
    const tryRecord = () => {
      const u = new URL(location.href), raw = u.searchParams.get('pet') || u.searchParams.get('pet_name') || '';
      let name = ''; try { name = decodeURIComponent(raw).trim(); } catch { name = raw.trim(); }
      if (!looksLikePetName(name)) return true;
      const body = document.body ? (document.body.innerText || '') : '';
      const title = (document.title || '').toLowerCase();
      const shown = title.includes(name.toLowerCase()) ||
                    new RegExp('(^|[^A-Za-z0-9_])' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^A-Za-z0-9_]|$)', 'i').test(body);
      if (!shown) return false;
      visitedAdd(name);
      return true;
    };
    let n = 0;
    const iv = setInterval(() => { if (tryRecord() || ++n > 20) clearInterval(iv); }, 400);
  }

  // Console helper: nppResetSeenPets() clears the "New" memory.
  try { unsafeWindow.nppResetSeenPets = () => { LSdel(SEEN_PETS_KEY); location.reload(); }; } catch {}
})();
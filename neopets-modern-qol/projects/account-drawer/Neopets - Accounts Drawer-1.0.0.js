// ==UserScript==
// @name         Neopets - Accounts Drawer
// @namespace    neopets-qol-patcher
// @version      1.3.20
// @description  Neopets account switcher: list your accounts, pick a main, sync from NeoPass, swap session. Works standalone or alongside the Modern Interface patcher.
// @match        *://*.neopets.com/*
// @run-at       document-start
// @exclude      *://www.neopets.com/
// @exclude      *://www.neopets.com/index.phtml*
// @exclude      *://www.neopets.com/login*
// @exclude      *://www.neopets.com/logout*
// @exclude      *://www.neopets.com/loginpage.phtml*
// @exclude      *://www.neopets.com/signin*
// @exclude      *://www.neopets.com/neopass*
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      pets.neopets.com
// @connect      images.neopets.com
// @connect      account.neopets.com
// ==/UserScript==

(function () {
  'use strict';

  if (window.top !== window) return;
  if (!/^(www\.|ncmall\.)?neopets\.com$/i.test(location.hostname)) return;

  const W = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
  const root = document.documentElement;
  const path = location.pathname.toLowerCase();
  const $ = (s, r = document) => r.querySelector(s);
  const LSget = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
  const LSset = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const LSdel = (k) => { try { localStorage.removeItem(k); } catch {} };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const isNc = location.hostname.toLowerCase() === 'ncmall.neopets.com';
  const isPopup = /popup/.test(path) || (!!window.opener && window.outerWidth < 900);
  if (isNc || isPopup) return;

  // Auth pages have no user card and no session to manage.
  if (/^\/(log(in|out)[^/]*|loginpage\.phtml|signin|neopass|hub\/login|index\.phtml)(\/|\.|$)/i.test(path)) return;

  /* ───────────────────────────────── constants ───────────────────────────────── */
  const USERS_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="5.4" r="2.3"/><path d="M1.8 13.6c0-2.3 1.9-4.2 4.2-4.2s4.2 1.9 4.2 4.2"/><path d="M10.2 3.5a2.1 2.1 0 0 1 0 3.9M11.4 9.6c1.7.4 2.9 1.8 2.9 4"/></svg>';
  const LOGOUT_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.2 2.5H3.8a1.3 1.3 0 0 0-1.3 1.3v8.4a1.3 1.3 0 0 0 1.3 1.3h2.4M10 5.2L13 8l-3 2.8M13 8H6.4"/></svg>';
  const SWAP_URL = 'https://account.neopets.com/classic/login';
  const MAIN_KEY = 'npp_main_account';
  const ACCTS_KEY = 'npp_accounts';
  const MAN_KEY = 'npp_accounts_manual';
  const NP_KEY = 'npp_neopass_accts';
  const PROF_KEY = (u) => 'npp_prof_v1:' + u;
  const DIRTY_KEY = 'npp_prof_dirty';

  const validName = (n) => /^[A-Za-z0-9_]{3,20}$/.test(n);
  const curUser = () => String(W.appInsightsUserName || LSget('npqol_hud_username') || '').trim();
  const mainAcct = () => LSget(MAIN_KEY);

  /* ───────────────────────────────── CSS ───────────────────────────────── */
  // The panel CSS is duplicated here so the drawer looks right without the core.
  // When the core is installed, its copies of the same selectors win (loaded earlier,
  // higher specificity from the html[data-np-modern-interface] scope); this block
  // exists purely so standalone mode gets the same visual.
  const ACCT_CSS = `
#nppAcctTab { position: absolute; top: 8px; right: 8px; z-index: 3; width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.28); border-radius: 50%; background: rgba(255,255,255,.14); color: #fff; cursor: pointer; transition: background .15s, transform .15s, color .15s; }
#nppAcctTab svg { width: 14px; height: 14px; display: block; }
#nppAcctTab:hover, #nppAcctTab.on { background: var(--np-accent, #ff8a1f); color: var(--npp-accent-fg, #1a1330); border-color: transparent; }
#nppAcctTab.on { transform: scale(1.06); }
#nppAcctTab.attn::after { content: ""; position: absolute; top: -3px; right: -3px; width: 9px; height: 9px; border-radius: 50%; background: #2fd873; box-shadow: 0 0 0 2px rgba(255,255,255,.92), 0 1px 3px rgba(0,0,0,.35); }
#nppAcctDrawer { position: fixed; left: 244px; top: 70px; z-index: 1002; box-sizing: border-box; width: 252px; height: min(500px, calc(100vh - 100px)); display: flex; flex-direction: column; padding: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,.14); border-radius: 14px; background: #3a3350; color: #fff; opacity: 0; transform: translateX(-18px) scale(.97); transform-origin: left top; pointer-events: none; transition: opacity .22s ease, transform .32s cubic-bezier(.22, 1, .36, 1); }
#nppAcctDrawer.open { opacity: 1; transform: none; pointer-events: auto; }
#nppAcctDrawer .nppAcctHead { display: flex; align-items: center; justify-content: space-between; padding: 0 4px 10px; }
#nppAcctDrawer .nppAcctHeadL { display: flex; align-items: center; gap: 8px; min-width: 0; }
#nppAcctDrawer .nppAcctTitle { font: 400 21px/1 'CafeteriaBlack', Georgia, serif; }
#nppAcctDrawer .nppAcctSwap { flex: none; display: flex; align-items: center; justify-content: center; gap: 6px; height: 26px; padding: 0 13px; border-radius: 999px; background: linear-gradient(180deg, #52525e 0%, #3b3b46 50%, #2b2b34 100%); color: #fff !important; text-decoration: none !important; transition: filter .15s, transform .15s; }
#nppAcctDrawer .nppAcctSwap svg { width: 13px; height: 13px; flex: none; }
#nppAcctDrawer .nppAcctSwap span { font: 400 14px/1 'CafeteriaBlack', Georgia, serif; letter-spacing: .02em; }
#nppAcctDrawer .nppAcctSwap:hover { filter: brightness(1.18); transform: translateY(-1px); }
#nppAcctDrawer .nppAcctSwap.busy { opacity: .75; pointer-events: none; }
#nppAcctDrawer .nppAcctHint { margin: 0 2px 10px; padding: 8px 10px; border: 1px solid rgba(255,209,102,.35); border-radius: 10px; background: rgba(255,209,102,.13); color: #ffe7a8; font: 500 11.5px/1.35 'Outfit', system-ui, sans-serif; }
#nppAcctDrawer .nppAcctHint:empty { display: none; }
#nppAcctDrawer .nppAcctBody { flex: 1 1 auto; min-height: 0; padding-right: 6px; overflow-x: hidden; overflow-y: scroll; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.42) rgba(255,255,255,.07); }
#nppAcctDrawer .nppAcctSec + .nppAcctSec { margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.12); }
#nppAcctDrawer .nppAcctSecHead { display: flex; align-items: center; gap: 8px; padding: 0 4px 6px; }
#nppAcctDrawer .nppAcctSecHead span { font: 700 11px/1 'Outfit', system-ui, sans-serif; letter-spacing: .09em; text-transform: uppercase; color: rgba(255,255,255,.78); }
#nppAcctDrawer .nppAcctSecHead em { padding: 1px 7px; border-radius: 999px; background: rgba(255,255,255,.12); font: normal 700 10px/1.4 'Outfit', system-ui, sans-serif; }
#nppAcctDrawer .nppAcctSecHead em:empty { display: none; }
#nppAcctDrawer .nppAcctList { display: flex; flex-direction: column; gap: 4px; }
#nppAcctDrawer .nppAcctRow { display: flex; align-items: center; gap: 2px; padding: 3px 0 3px 3px; border-radius: 14px; transition: background .18s; }
#nppAcctDrawer .nppAcctRow:hover { background: rgba(255,255,255,.06); }
#nppAcctDrawer .nppAcctRow.me { box-shadow: inset 0 0 0 1px var(--np-accent-line, rgba(255,255,255,.35)); }
#nppAcctDrawer .nppAcctLink { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 3px 4px; border-radius: 12px; color: #fff !important; text-decoration: none !important; }
#nppAcctDrawer .nppAcctAv { flex: none; width: 34px; height: 34px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,.55); border-radius: 50%; background: rgba(255,255,255,.16) center / cover no-repeat; font: normal 400 16px/1 'CafeteriaBlack', Georgia, serif; }
#nppAcctDrawer .nppAcctTxt { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 1px; text-align: left; }
#nppAcctDrawer .nppAcctTxt b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 600 14px/1.2 'Outfit', system-ui, sans-serif; }
#nppAcctDrawer .nppAcctTxt small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 500 11px/1.2 'Outfit', system-ui, sans-serif; color: rgba(255,255,255,.68); }
#nppAcctDrawer .nppAcctStar { flex: none; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: rgba(255,255,255,.55); font-size: 17px; line-height: 1; cursor: pointer; transition: color .15s, background .15s; }
#nppAcctDrawer .nppAcctStar:hover { color: #ffd166; background: rgba(255,255,255,.1); }
#nppAcctDrawer .nppAcctRow.main .nppAcctStar { color: #ffd166; }
#nppAcctDrawer .nppAcctX { flex: none; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; background: rgba(0,0,0,.3); color: rgba(255,255,255,.85); font-size: 15px; line-height: 1; cursor: pointer; opacity: 0; transition: opacity .15s, background .15s; }
#nppAcctDrawer .nppAcctRow:hover .nppAcctX { opacity: 1; }
#nppAcctDrawer .nppAcctX:hover { background: #e0535f; color: #fff; }
#nppAcctDrawer .nppAcctNote { margin-top: 8px; padding: 8px 10px; border: 1px solid rgba(255,255,255,.18); border-radius: 10px; background: rgba(255,255,255,.07); color: rgba(255,255,255,.8); font: 500 11.5px/1.4 'Outfit', system-ui, sans-serif; }
#nppAcctDrawer .nppAcctNote:empty { display: none; }
#nppAcctDrawer .nppAcctSync { display: block; width: 100%; margin-top: 8px; height: 32px; border: 1px solid rgba(255,255,255,.3); border-radius: 999px; background: rgba(255,255,255,.1); color: #fff; font: 600 12.5px 'Outfit', system-ui, sans-serif; cursor: pointer; transition: background .15s, color .15s, border-color .15s; }
#nppAcctDrawer .nppAcctSync:hover:not(:disabled) { background: var(--np-accent, #ff8a1f); color: var(--npp-accent-fg, #1a1330); border-color: transparent; }
#nppAcctDrawer .nppAcctSync.busy { opacity: .7; cursor: progress; }
#nppAcctDrawer .nppAcctSec[hidden], #nppAcctDrawer .nppAcctAdd[hidden], #nppAcctDrawer .nppAcctAddBtn[hidden] { display: none !important; }
#nppAcctDrawer .nppAcctAddWrap { margin-top: 10px; }
#nppAcctDrawer .nppAcctAddBtn { height: 26px; padding: 0 12px; border: 1px dashed rgba(255,255,255,.34); border-radius: 999px; background: transparent; color: rgba(255,255,255,.85); font: 600 12px 'Outfit', system-ui, sans-serif; cursor: pointer; transition: background .15s, border-color .15s, color .15s; }
#nppAcctDrawer .nppAcctAddBtn:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.6); color: #fff; }
#nppAcctDrawer .nppAcctAdd { display: flex; align-items: center; gap: 5px; }
#nppAcctDrawer .nppAcctAdd input { flex: 1; min-width: 0; height: 28px; padding: 0 12px; border: 1px solid rgba(255,255,255,.28); border-radius: 999px; background: rgba(255,255,255,.1); color: #fff; font: 500 12.5px 'Outfit', system-ui, sans-serif; outline: 0; }
#nppAcctDrawer .nppAcctAdd input::placeholder { color: rgba(255,255,255,.6); }
#nppAcctDrawer .nppAcctAdd input:focus { border-color: var(--np-accent, #ff8a1f); background: rgba(255,255,255,.16); }
#nppAcctDrawer .nppAcctAddOk { flex: none; height: 28px; padding: 0 12px; border: 0; border-radius: 999px; background: var(--np-accent, #ff8a1f); color: var(--npp-accent-fg, #1a1330); font: 700 12px 'Outfit', system-ui, sans-serif; cursor: pointer; }
#nppAcctDrawer .nppAcctAddOk:hover { filter: brightness(1.07); }
#nppAcctDrawer .nppAcctAddCancel { flex: none; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 50%; background: rgba(255,255,255,.12); color: rgba(255,255,255,.85); font-size: 15px; line-height: 1; cursor: pointer; transition: background .15s; }
#nppAcctDrawer .nppAcctAddCancel:hover { background: rgba(255,255,255,.24); }
#nppAcctDrawer .nppAcctMsg { text-align: center; padding: 6px 6px 0; font: 500 11px/1.35 'Outfit', system-ui, sans-serif; color: rgba(255,255,255,.7); }
#nppAcctDrawer .nppAcctMsg:empty { display: none; }
#nppAcctDrawer .nppAcctStandaloneFoot { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.12); }
#nppAcctDrawer .nppAcctStandaloneFoot a { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; height: 26px; padding: 0 12px; border-radius: 999px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.28); color: #fff !important; text-decoration: none !important; font: 400 14px/1 'CafeteriaBlack', Georgia, serif; }
#nppAcctDrawer .nppAcctStandaloneFoot a:hover { background: rgba(255,255,255,.18); }
#nppAcctDrawer .nppAcctStandaloneFoot a.nppLogout { background: var(--np-accent, #ff8a1f); color: #fff !important; text-shadow: 0 1px 2px rgba(0,0,0,.35); border-color: transparent; }
#nppAcctDrawer .nppAcctStandaloneFoot a.nppLogout:hover { filter: brightness(1.07); }
#nppAcctDrawer .nppAcctStandaloneFoot svg { width: 13px; height: 13px; flex: none; }
/* restyle: match All Pets overlay */
#nppAcctDrawer { --ap-bg: #fbf7ee; --ap-line: #e6dcf5; --ap-text: #392d5c; --ap-mute: #6c6290; --ap-acc: #7c5cf0; --ap-soft: #efe8ff; z-index: 2147482000; padding: 0; border: 3px solid #fff; border-radius: 24px; background: var(--ap-bg); color: var(--ap-text); font-family: 'Outfit', system-ui, sans-serif; box-shadow: 0 24px 70px rgba(70,52,110,.35); transform: scale(.97) translateY(8px); transform-origin: left top; transition: opacity .2s ease, transform .22s cubic-bezier(.2,.8,.2,1); }
#nppAcctDrawer.open { transform: none; }
#nppAcctDrawer :focus-visible { outline: 3px solid #5b8def; outline-offset: 2px; }
#nppAcctDrawer .nppAcctHead { padding: 14px 14px 10px 18px; background: linear-gradient(180deg, #f3ecff 0%, #fbf7ee 100%); border-bottom: 1px solid var(--ap-line); }
#nppAcctDrawer .nppAcctTitle { font: 800 22px/30px 'Outfit', system-ui, sans-serif; letter-spacing: -.02em; color: var(--ap-text); }
#nppAcctDrawer .nppAcctCount { font-size: 13px; font-weight: 500; color: var(--ap-mute); }
#nppAcctDrawer .nppAcctHeadR { display: flex; align-items: center; gap: 6px; }
#nppAcctDrawer .nppAcctHeadL { align-items: baseline; }
#nppAcctDrawer .nppAcctSwap { height: 34px; padding: 0 14px; background: #fff; border: 1px solid var(--ap-line); color: var(--ap-text) !important; box-shadow: none; }
#nppAcctDrawer .nppAcctSwap span { font: 700 13px/20px 'Outfit', system-ui, sans-serif; letter-spacing: 0; }
#nppAcctDrawer .nppAcctSwap:hover { filter: none; transform: none; background: var(--ap-soft); border-color: #cbbaf2; box-shadow: 0 2px 8px rgba(124,92,240,.18); }
#nppAcctDrawer .nppAcctClose { flex: none; width: 34px; height: 34px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--ap-line); border-radius: 999px; background: #fff; color: var(--ap-text); font: 700 20px/1 'Outfit', system-ui, sans-serif; cursor: pointer; transition: background .15s, border-color .15s, box-shadow .15s; }
#nppAcctDrawer .nppAcctClose:hover { background: var(--ap-soft); border-color: #cbbaf2; box-shadow: 0 2px 8px rgba(124,92,240,.18); }
#nppAcctDrawer .nppAcctHint { margin: 10px 12px 0; border-color: #f0d28a; background: #fff4d6; color: #7a5200; }
#nppAcctDrawer .nppAcctBody { padding: 10px 6px 12px 12px; scrollbar-color: #cbbaf2 transparent; }
#nppAcctDrawer .nppAcctSec + .nppAcctSec { border-top-color: var(--ap-line); }
#nppAcctDrawer .nppAcctSecHead span { color: var(--ap-mute); }
#nppAcctDrawer .nppAcctSecHead em { background: var(--ap-soft); color: var(--ap-acc); }
#nppAcctDrawer .nppAcctRow:hover { background: var(--ap-soft); }
#nppAcctDrawer .nppAcctRow.me { box-shadow: inset 0 0 0 1px #cbbaf2; background: #fff; }
#nppAcctDrawer .nppAcctLink { color: var(--ap-text) !important; }
#nppAcctDrawer .nppAcctAv { border-color: #fff; background-color: var(--ap-soft); color: var(--ap-text); box-shadow: 0 0 0 1px var(--ap-line); }
#nppAcctDrawer .nppAcctTxt small { color: var(--ap-mute); }
#nppAcctDrawer .nppAcctStar { color: #c9c2dc; }
#nppAcctDrawer .nppAcctStar:hover, #nppAcctDrawer .nppAcctRow.main .nppAcctStar { color: #f5a623; background: #fff; }
#nppAcctDrawer .nppAcctX { background: #fff; border: 1px solid var(--ap-line); color: var(--ap-mute); }
#nppAcctDrawer .nppAcctRow:focus-within .nppAcctX { opacity: 1; }
#nppAcctDrawer .nppAcctNote { border-color: var(--ap-line); background: var(--ap-soft); color: var(--ap-mute); }
#nppAcctDrawer .nppAcctSync, #nppAcctDrawer .nppAcctStandaloneFoot a { border: 1px solid var(--ap-line); background: #fff; color: var(--ap-text) !important; font-weight: 700; }
#nppAcctDrawer .nppAcctSync:hover:not(:disabled), #nppAcctDrawer .nppAcctStandaloneFoot a:hover { background: var(--ap-soft); border-color: #cbbaf2; color: var(--ap-text); box-shadow: 0 2px 8px rgba(124,92,240,.18); }
#nppAcctDrawer .nppAcctStandaloneFoot { border-top-color: var(--ap-line); }
#nppAcctDrawer .nppAcctAddBtn { border-color: #cbbaf2; color: var(--ap-mute); }
#nppAcctDrawer .nppAcctAddBtn:hover { background: #fff; border-color: var(--ap-acc); color: var(--ap-text); }
#nppAcctDrawer .nppAcctAdd input { border-color: var(--ap-line); background: #fff; color: var(--ap-text); }
#nppAcctDrawer .nppAcctAdd input::placeholder { color: var(--ap-mute); opacity: .8; }
#nppAcctDrawer .nppAcctAdd input:focus { border-color: var(--ap-acc); background: #fff; }
#nppAcctDrawer .nppAcctAddOk, #nppAcctDrawer .nppAcctStandaloneFoot a.nppLogout { background: var(--ap-acc); color: #fff !important; text-shadow: none; }
#nppAcctDrawer .nppAcctAddCancel { background: #fff; border: 1px solid var(--ap-line); color: var(--ap-mute); }
#nppAcctDrawer .nppAcctAddCancel:hover { background: var(--ap-soft); }
#nppAcctDrawer .nppAcctMsg { color: var(--ap-mute); }
@media (prefers-reduced-motion: reduce) { #nppAcctDrawer, #nppAcctDrawer.open { transition: none; transform: none; } }

#nppStandaloneAcct { position: fixed; right: 20px; bottom: 20px; z-index: 2140; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; font: 500 13px 'Outfit', system-ui, sans-serif; }
#nppStandaloneAcct.aboveDailies { bottom: 74px; }
#nppStandaloneAcctToggle { display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(0,0,0,.16); background: #fff; color: #1f2937; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.18); }
#nppStandaloneAcctToggle:hover { background: #f3f4f6; }
#nppStandaloneAcctToggle svg { width: 18px; height: 18px; }

#nppAvatar { grid-column: 1; grid-row: 1 / span 2; position: relative; text-decoration: none !important; cursor: pointer; width: 48px; height: 48px; border-radius: 50%; background: center / cover no-repeat rgba(255,255,255,.14); border: 2px solid rgba(255,255,255,.55); box-shadow: 0 2px 8px rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; font: 400 24px/1 'CafeteriaBlack', Georgia, serif; color: #fff; transition: border-color .15s, transform .15s; }
#nppAvatar:hover { border-color: #fff; transform: scale(1.06); }
#nppAvatar .nppAvInit { pointer-events: none; }
#nppAcctBtns { grid-column: 1 / -1; grid-row: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px; }
#npLogoutBtn, #npSwapBtn { box-sizing: border-box; display: flex !important; align-items: center; justify-content: center; gap: 6px; width: 100%; height: 30px; padding: 0 8px !important; border: 1px solid var(--npp-card-line, rgba(255,255,255,.14)) !important; border-radius: 10px !important; font: 600 12px/1 'Outfit', system-ui, sans-serif !important; letter-spacing: 0; text-decoration: none !important; white-space: nowrap; cursor: pointer; transition: background .15s, border-color .15s, color .15s; }
#npLogoutBtn svg, #npSwapBtn svg { width: 13px; height: 13px; flex: none; }
#npLogoutBtn span, #npSwapBtn span { display: inline !important; font: inherit !important; letter-spacing: inherit; }
#npLogoutBtn, #npSwapBtn { background: rgba(255,255,255,.07) !important; color: rgba(255,255,255,.82) !important; text-shadow: none; box-shadow: none; }
#nppListsMod { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; font-family: 'Outfit', system-ui, sans-serif; }
#nppListsMod .nppLt { box-sizing: border-box; min-width: 0; display: grid; grid-template-columns: auto 1fr; column-gap: 7px; align-items: center; padding: 9px 10px; text-align: left; background: var(--npp-card, rgba(20,18,28,.42)); border: 1px solid var(--npp-card-line, rgba(255,255,255,.14)); border-radius: 14px; color: #fff; cursor: pointer; font: inherit; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); transition: border-color .15s, background .15s; }
#nppListsMod .nppLt:hover { border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.1); }
#nppListsMod .nppLt:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
#nppListsMod .nppLt svg { grid-row: 1 / span 2; width: 18px; height: 18px; }
#nppListsMod .nppLt b { font-weight: 700; font-size: 13px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#nppListsMod .nppLt em { font-style: normal; font-size: 11px; line-height: 1.2; color: rgba(255,255,255,.6); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-height: 820px) { #nppListsMod { gap: 6px; margin-bottom: 6px; } #nppListsMod .nppLt { padding: 6px 8px; } }
#nppAcctTab { display: none !important; }
#npSwapBtn:hover { background: rgba(255,255,255,.16) !important; border-color: rgba(255,255,255,.3) !important; }
#npLogoutBtn:hover { background: rgba(255,90,90,.18) !important; border-color: rgba(255,120,120,.5) !important; color: #ff8a8a !important; }
#npLogoutBtn:focus-visible, #npSwapBtn:focus-visible { outline: 2px solid #fff; outline-offset: 1px; }
#npSwapBtn.busy svg { animation: nppSpinAcct .8s linear infinite; }
@keyframes nppSpinAcct { to { transform: rotate(360deg); } }
/* dark mode (follows sidebar toggle) */
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer { --ap-bg: #1d1a2b; --ap-panel: #272238; --ap-line: rgba(255,255,255,.12); --ap-text: #f1ecff; --ap-mute: rgba(241,236,255,.62); --ap-acc: #a58bff; --ap-soft: rgba(165,139,255,.16); border-color: rgba(255,255,255,.14); color-scheme: dark; box-shadow: 0 24px 70px rgba(0,0,0,.55); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctHead { background: linear-gradient(180deg, #2a2440 0%, #1d1a2b 100%); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctSwap, html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctClose, html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctX, html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctSync, html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctStandaloneFoot a, html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctAddCancel, html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctAdd input, html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctRow.me { background: var(--ap-panel); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctSwap:hover, html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctClose:hover, html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctSync:hover:not(:disabled), html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctStandaloneFoot a:hover { background: var(--ap-soft); border-color: rgba(165,139,255,.45); box-shadow: 0 2px 8px rgba(0,0,0,.35); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctAddCancel:hover { background: var(--ap-soft); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctAddBtn { border-color: rgba(165,139,255,.45); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctAddBtn:hover, html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctAdd input:focus { background: var(--ap-panel); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctRow.me { box-shadow: inset 0 0 0 1px rgba(165,139,255,.45); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctHint { background: rgba(255,209,102,.12); border-color: rgba(255,209,102,.3); color: #ffe2a0; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctBody { scrollbar-color: rgba(165,139,255,.45) transparent; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctAv { border-color: rgba(255,255,255,.14); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctStar { color: rgba(255,255,255,.28); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctStar:hover, html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctRow.main .nppAcctStar { background: var(--ap-panel); color: #f5a623; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctAdd input::placeholder { color: var(--ap-mute); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAcctDrawer .nppAcctAddOk { color: #1d1a2b !important; }
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'npp-acct-css';
  styleEl.textContent = ACCT_CSS;
  (document.head || root).appendChild(styleEl);

  /* ───────────────────────────────── storage ───────────────────────────────── */
  const readAccts = () => { try { const a = JSON.parse(LSget(ACCTS_KEY) || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch { return []; } };
  const writeAccts = (a) => LSset(ACCTS_KEY, JSON.stringify(a));
  function noteAccount(name) {
    name = String(name || '').trim();
    if (!validName(name) || apBlocked().has(name.toLowerCase())) return false;
    const a = readAccts();
    if (a.some(x => x.toLowerCase() === name.toLowerCase())) return false;
    a.push(name); writeAccts(a); return true;
  }
  function seenAccounts() {
    const out = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('npp_acct_')) out.push(k.slice(9)); } } catch {}
    return out;
  }
  const readNP = () => { try { const a = JSON.parse(LSget(NP_KEY) || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch { return []; } };
  const readManual = () => { try { const a = JSON.parse(LSget(MAN_KEY) || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch { return []; } };
  const writeManual = (a) => LSset(MAN_KEY, JSON.stringify(a));
  const autoAccts = () => { const a = readAccts().slice(), bl = apBlocked(); [curUser(), ...seenAccounts().filter(n => !bl.has(n.toLowerCase()))].forEach(n => { if (validName(n) && !a.some(x => x.toLowerCase() === n.toLowerCase())) a.push(n); }); return a; };
  const allAccts = () => { const a = autoAccts(); readManual().forEach(n => { if (!a.some(x => x.toLowerCase() === n.toLowerCase())) a.push(n); }); return a; };

  /* ───────────────────────────────── avatar cache ───────────────────────────────── */
  const readProf = (u) => { try { return JSON.parse(LSget(PROF_KEY(u)) || 'null'); } catch { return null; } };

  /* ───────────────────────────────── NeoPass sync ───────────────────────────────── */
  function parseNeoPass(html) {
    const t = String(html || '').replace(/\\"/g, '"');
    const i = t.indexOf('"linkage":[');
    if (i < 0) return null;
    const j = t.indexOf('"invalid_linkage"', i);
    const seg = t.slice(i, j > i ? j : i + 4000);
    const out = [], re = /"user_identifier":"([A-Za-z0-9_]{3,20})","extra":\{"main":(true|false)/g;
    let m;
    while ((m = re.exec(seg))) if (!out.some(o => o.name.toLowerCase() === m[1].toLowerCase())) out.push({ name: m[1], main: m[2] === 'true' });
    return out.length ? out : null;
  }
  function neoPassFetch() {
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== 'function') { reject(new Error('GM_xmlhttpRequest unavailable')); return; }
      GM_xmlhttpRequest({ method: 'GET', url: 'https://account.neopets.com/', timeout: 20000, headers: { Accept: 'text/html' },
        onload: (r) => resolve(r.responseText || ''), onerror: () => reject(new Error('network')), ontimeout: () => reject(new Error('timeout')) });
    });
  }
  async function syncNeoPass() {
    const list = parseNeoPass(await neoPassFetch());
    if (!list) throw new Error('no account list found — sign in to NeoPass (account.neopets.com) in this browser and try again');
    list.forEach(a => noteAccount(a.name));
    LSset(NP_KEY, JSON.stringify(list.map(a => a.name)));
    const main = list.find(a => a.main);
    if (main) LSset(MAIN_KEY, main.name);
    writeManual(readManual().filter(n => !list.some(a => a.name.toLowerCase() === n.toLowerCase())));
    LSset('npp_neopass_ts', String(Date.now()));
    return { list, main };
  }

  /* ───────────────────────────────── swap session ───────────────────────────────── */
  let swapBusy = false;
  function swapAccount(onBusy, onDone) {
    apCollect();   // save this account's pets before leaving it
    if (swapBusy) return;
    swapBusy = true;
    if (onBusy) onBusy();
    let w = null; try { w = window.open('about:blank', '_blank'); } catch {}
    const go = () => {
      if (w && !w.closed) { try { w.location.href = SWAP_URL; } catch { window.open(SWAP_URL, '_blank'); } }
      else if (!window.open(SWAP_URL, '_blank')) location.assign(SWAP_URL);
      swapBusy = false; if (onDone) onDone();
    };
    try {
      Promise.race([
        fetch('https://www.neopets.com/logout.phtml', { credentials: 'include', cache: 'no-store', redirect: 'manual' }),
        new Promise(r => setTimeout(r, 2500)),
      ]).catch(() => {}).then(go);
    } catch { go(); }
  }

  /* ───────────────────────────────── All Pets ─────────────────────────────────
     Passive and offline: ZERO extra network requests. Pets of the logged-in account are read from data the
     Modern Interface patcher already stores (localStorage npqol_qr_data) and from its pet dock (.qrPet),
     then cached per account in GM storage. Other accounts appear after you log in to them once. */
  const AP_KEY = 'npp_allpets_v1';
  const AP_TAGS = 'npp_allpets_tags_v1';
  const gmGet = (k, d) => { try { const v = typeof GM_getValue === 'function' ? GM_getValue(k, null) : JSON.parse(LSget(k) || 'null'); return v && typeof v === 'object' ? v : d; } catch { return d; } };
  const gmSet = (k, v) => { try { if (typeof GM_setValue === 'function') GM_setValue(k, v); else LSset(k, JSON.stringify(v)); } catch {} if (k === AP_KEY || k === AP_TAGS) LSset(k + '_bak', JSON.stringify(v)); };
  // GM storage belongs to one installed script (lost on reinstall, not shared with a second copy), so All Pets data is
  // mirrored to localStorage and merged back on read. Per account the newer save wins; deletes write both copies.
  const apMerge = (k, g) => {
    let b = null; try { b = JSON.parse(LSget(k + '_bak') || 'null'); } catch {}
    if (!b || typeof b !== 'object') return g;
    const o = { ...b, ...g };
    if (k === AP_KEY) Object.keys(b).forEach(a => { const gk = Object.keys(g).find(x => x.toLowerCase() === a.toLowerCase()); if (!gk) return; const keep = ((b[a] && b[a].t) || 0) > ((g[gk] && g[gk].t) || 0) ? [a, b[a]] : [gk, g[gk]]; delete o[a]; delete o[gk]; o[keep[0]] = keep[1]; });
    return o;
  };
  const apRead = () => apMerge(AP_KEY, gmGet(AP_KEY, {}));
  const apTags = () => apMerge(AP_TAGS, gmGet(AP_TAGS, {}));
  // Cache keys are matched case-insensitively (curUser and the account list can differ in case).
  // Always draw the crisp 600px name-based image; saved URLs can be small sizes (fallback via onerror).
  const apPetUrl = (n) => 'https://www.neopets.com/petlookup.phtml?pet=' + encodeURIComponent(n);
  const apUserUrl = (n) => 'https://www.neopets.com/userlookup.phtml?user=' + encodeURIComponent(n);
  const apLk = (url, txt) => `<a class="apLk" href="${esc(url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(txt)}</a>`;
  const apPetLk = (n) => apLk(apPetUrl(n), n), apUserLk = (n) => apLk(apUserUrl(n), n);
  const apHiRes = (p) => `https://pets.neopets.com/cpn/${encodeURIComponent(p.name)}/1/7.png`;
  const apOf = (c, a) => { const l = String(a).toLowerCase(), k = Object.keys(c).find(x => x.toLowerCase() === l); return k ? c[k] : null; };
  const apOrdered = () => { const m = mainAcct().toLowerCase(), bl = apBlocked(), list = allAccts().slice(); Object.keys(apRead()).forEach(k => { if (!list.some(x => x.toLowerCase() === k.toLowerCase())) list.push(k); }); return list.filter(x => !bl.has(x.toLowerCase())).sort((a, b) => (b.toLowerCase() === m) - (a.toLowerCase() === m)); };
  const AP_I = (d) => '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  const AP_COPY = AP_I('<rect x="5.5" y="5.5" width="8" height="8" rx="1.6"/><path d="M10.5 3.5v-.4A1.6 1.6 0 0 0 8.9 1.5H3.6a1.6 1.6 0 0 0-1.6 1.6v5.3a1.6 1.6 0 0 0 1.6 1.6h.4"/>'), AP_PAGE = AP_I('<path d="M9 2.5h4.5V7M13.5 2.5L7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/>'), AP_ACTIVE = AP_I('<circle cx="8" cy="8" r="6"/><path d="M5.5 8.2l1.7 1.7 3.4-3.6"/>');
  const AP_TRASH = AP_I('<path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 8.5h5.6l.7-8.5"/>'), AP_BLOCK_I = AP_I('<circle cx="8" cy="8" r="5.5"/><path d="M4.1 11.9l7.8-7.8"/>');
  const AP_SWAP = AP_I('<path d="M2.5 5.5h10M10 3l2.5 2.5L10 8M13.5 10.5h-10M6 8l-2.5 2.5L6 13"/>'), AP_PENCIL = AP_I('<path d="M10.5 3l2.5 2.5L5.5 13H3v-2.5z"/>');
  const APO = [['perm', 'Keeping'], ['uft', 'Up for trade'], ['maybe', 'Maybe'], ['', 'None']];
  const ST = { uft: 'Up for Trade', perm: 'Permanent', maybe: 'Maybe' };
  const ST_LBL = { uft: 'UFT', perm: 'Permie', maybe: 'Maybe' };

  // Collect the current account's pets from the patcher's cached Quick Ref data (tolerant: any objects with a
  // name plus species/colour/level found under data) and from the pet dock DOM (.qrPet name + image).
  function apCollect(force) {
    const me = curUser();
    if (!validName(me) || apBlocked().has(me.toLowerCase())) return;
    const byName = new Map();
    const put = (o) => {
      const name = String(o.name || '').trim();
      if (!/^[A-Za-z0-9_]{3,20}$/.test(name)) return;
      const k = name.toLowerCase(), p = byName.get(k) || { name, img: '', species: '', color: '', gender: '', level: 0, active: false };
      p.gender = p.gender || o.gender || ''; p.img = p.img || o.img || ''; p.species = p.species || o.species || ''; p.color = p.color || o.color || ''; p.level = p.level || o.level || 0; p.active = p.active || !!o.active;
      byName.set(k, p);
    };
    let activeName = '';
    try {
      const d = JSON.parse(LSget('npqol_qr_data') || 'null');
      const data = d && d.data;
      if (data && data.active && data.active.name) activeName = String(data.active.name);
      const walk = (v, depth) => {
        if (!v || typeof v !== 'object' || depth > 3) return;
        if (Array.isArray(v)) { v.forEach(x => walk(x, depth + 1)); return; }
        // Quick Ref pets are { name, isActive, actions }; only data.active carries colour/species/level.
        if (typeof v.name === 'string' && ('isActive' in v || v.species || v.colour || v.color || v.level)) put({ name: v.name, gender: v.gender, species: v.species, color: v.colour || v.color, level: parseInt(v.level, 10) || 0, img: v.image || v.img || v.imageUrl || '', active: !!v.isActive });
        else Object.values(v).forEach(x => walk(x, depth + 1));
      };
      walk(data, 0);
    } catch {}
    document.querySelectorAll('#qrDock .qrPet, .qrPet').forEach(el => {
      const nm = el.querySelector('.qrPetName');
      const name = nm ? nm.textContent.trim() : '';
      let img = el.dataset.bg || '';
      const im = !img && el.querySelector('img[src*="pets.neopets.com"]'); if (im) img = im.getAttribute('src') || '';
      if (!img) { const bg = (el.getAttribute('style') || '') + (nm ? '' : ''); const m = bg.match(/url\(["']?([^"')]+pets\.neopets\.com[^"')]+)/i); if (m) img = m[1]; }
      put({ name, img });
    });
    // Home page carousel (visited by the user): elements carry data-species/-color/-level. Each one's pet name is found by
    // walking up until exactly one known pet name appears, so pets that aren't on this account are skipped.
    const known = [...byName.values()].map(p => p.name);
    const hasName = (k, t) => new RegExp('(^|[^A-Za-z0-9_])' + k + '([^A-Za-z0-9_]|$)', 'i').test(t);
    document.querySelectorAll('[data-species][data-color]').forEach(el => {
      if (el.closest('.slick-cloned')) return;
      // The carousel puts data-name on each pet; fall back to searching nearby text.
      let name = known.find(k => k.toLowerCase() === String(el.dataset.name || '').trim().toLowerCase()) || '';
      for (let box = el, i = 0; !name && box && i < 4; i++, box = box.parentElement) {
        const hits = known.filter(k => hasName(k, [box.dataset.name || '', box.getAttribute('title') || '', box.textContent || ''].join(' ')));
        if (hits.length === 1) name = hits[0]; else if (hits.length > 1) break;
      }
      if (name) put({ name, gender: el.dataset.gender || '', species: el.dataset.species || '', color: el.dataset.color || '', level: parseInt(el.dataset.level, 10) || 0 });
    });
    // Live sources beat the Quick Ref cache (the core restores a per-account snapshot on swap, which can be stale):
    // a just-clicked "Make Active" link (kept 10 min), then the home carousel, which marks the real active pet.
    try { const pa = JSON.parse(LSget('npp_ap_newactive') || 'null'); if (pa && pa.u === me.toLowerCase() && Date.now() - pa.t < 10 * 60e3 && byName.has(String(pa.n).toLowerCase())) activeName = pa.n; } catch {}
    const homeActive = document.querySelector('.hp-carousel-pet[data-active="true"][data-name]');
    if (homeActive && byName.has(homeActive.dataset.name.toLowerCase())) activeName = homeActive.dataset.name;
    if (activeName) put({ name: activeName, active: true });
    if (!byName.size) return;
    const c = apRead(), old = apOf(c, me);
    // Keep colour/species/level learned earlier (each pet's details arrive while it is the active pet).
    const prev = new Map(((old && old.pets) || []).map(p => [p.name.toLowerCase(), p]));
    const pets = [...byName.values()].map(p => { const o = prev.get(p.name.toLowerCase()) || {}; return { ...p,
      img: /^(https?:)?\/\/pets\.neopets\.com\//i.test(p.img) ? p.img.replace(/^\/\//, 'https://') : `https://pets.neopets.com/cpn/${encodeURIComponent(p.name)}/1/4.png`,
      gender: p.gender || o.gender || '', species: p.species || o.species || '', color: p.color || o.color || '', level: p.level || o.level || 0,
      active: activeName ? p.name.toLowerCase() === activeName.toLowerCase() : p.active }; });
    // Stale-cache guard: pet names are unique, so when half or more of these pets are saved under another account the
    // Quick Ref cache still holds that account's snapshot (restored on swap). Saving it would let apDedupe move those pets
    // here for good, so skip; a later pass reads fresh data. A home carousel that shows one of these pets is live, so trust it.
    const live = [...document.querySelectorAll('.hp-carousel-pet[data-name]')].some(el => byName.has(el.dataset.name.toLowerCase()));
    if (!live) { let other = 0; Object.keys(c).forEach(k => { if (k.toLowerCase() !== me.toLowerCase()) ((c[k] && c[k].pets) || []).forEach(p => { if (byName.has(String(p.name).toLowerCase())) other++; }); }); if (other && other * 2 >= byName.size) return; }
    const same = old && JSON.stringify(old.pets) === JSON.stringify(pets);
    if (same && !force && Date.now() - old.t < 10 * 60e3) return;
    Object.keys(c).forEach(k => { if (k.toLowerCase() === me.toLowerCase()) delete c[k]; });
    c[me] = { t: Date.now(), pets }; apDedupe(c); gmSet(AP_KEY, c);
    if (apEl && apEl.classList.contains('open') && !same) apRender();
  }

  // A pet name can only exist once: dedupe inside each account, and when the same name sits under two accounts
  // (pet transfer, stale cache) keep the entry from the most recently collected account. Returns true if changed.
  function apDedupe(c) {
    let ch = false;
    const keys = Object.keys(c).filter(k => c[k] && Array.isArray(c[k].pets));
    keys.forEach(k => {
      const seen = new Set(), out = [];
      c[k].pets.forEach(p => { const n = p && String(p.name || '').toLowerCase(); if (!n) { ch = true; return; } if (seen.has(n)) { ch = true; const i = out.findIndex(x => x.name.toLowerCase() === n); if (p.active && i >= 0) out[i] = { ...out[i], active: true }; return; } seen.add(n); out.push(p); });
      if (out.length !== c[k].pets.length) c[k] = { ...c[k], pets: out };
    });
    // Cross-account duplicates are NOT deleted here (a stale save would erase the real owner's pets for good);
    // apRender shows each name once, under the newest-collected account.
    keys.forEach(k => { if (!c[k].pets.length && keys.some(o => o !== k && o.toLowerCase() === k.toLowerCase())) { delete c[k]; ch = true; } });
    return ch;
  }

  // Blocked accounts (localStorage, lowercase names): never collected, listed or auto-added. Unblock from the All Pets footer.
  // Function declarations (hoisted): the account list code above calls apBlocked().
  function apBlocked() { try { const a = JSON.parse(LSget('npp_ap_block_v1') || '[]'); return new Set(Array.isArray(a) ? a.map(x => String(x).toLowerCase()) : []); } catch { return new Set(); } }
  function apSetBlock(n, on) { const s = apBlocked(); on ? s.add(n.toLowerCase()) : s.delete(n.toLowerCase()); LSset('npp_ap_block_v1', JSON.stringify([...s])); }
  // Remove an account from this computer: drawer lists, NeoPass, seen/profile caches, main, its All Pets data and orphaned tags.
  function removeAccount(nm) {
    const low = nm.toLowerCase(), ne = (n) => String(n).toLowerCase() !== low;
    writeManual(readManual().filter(ne));
    writeAccts(readAccts().filter(ne));
    try { LSset(NP_KEY, JSON.stringify(readNP().filter(ne))); } catch {}
    seenAccounts().filter(n => !ne(n)).forEach(n => { try { localStorage.removeItem('npp_acct_' + n); localStorage.removeItem(PROF_KEY(n)); } catch {} });
    if (mainAcct().toLowerCase() === low) LSset(MAIN_KEY, '');
    const pc = apRead(), gone = [];
    Object.keys(pc).filter(k => !ne(k)).forEach(k => { ((pc[k] && pc[k].pets) || []).forEach(p => gone.push(String(p.name).toLowerCase())); delete pc[k]; });
    gmSet(AP_KEY, pc);
    apDropTags(pc, gone);
    apState.only.delete(nm);
    if (apEl && apEl.classList.contains('open')) apRender();
  }
  // Delete tags/notes of removed pet names that no saved account still has.
  function apDropTags(pc, gone) {
    const still = new Set(); Object.keys(pc).forEach(k => ((pc[k] && pc[k].pets) || []).forEach(p => still.add(String(p.name).toLowerCase())));
    const tg = apTags(); let tch = false; gone.forEach(k => { if (!still.has(k) && tg[k]) { delete tg[k]; tch = true; } }); if (tch) gmSet(AP_TAGS, tg);
  }

  // Name colour per card: white over art, dark when the pet image has a plain white background (mirrors the sidebar).
function npLoadBlob(src, cb) {
  // Fetch bytes via GM (no CORS needed) and hand back a same-origin blob URL; cb(null) on any failure.
  try {
    if (typeof GM_xmlhttpRequest === 'undefined') return cb(null);
    GM_xmlhttpRequest({ method: 'GET', url: src, responseType: 'blob', onload: (r) => { try { cb(r.status >= 200 && r.status < 300 && r.response ? URL.createObjectURL(r.response) : null); } catch { cb(null); } }, onerror: () => cb(null), ontimeout: () => cb(null) });
  } catch { cb(null); }
}
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
    // cb(dark, ok): ok=false on failure/timeout (resolves light, not persisted).
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
  const apToneCache = new Map(), apInflight = new Map(), apQueue = [];
  let apToneIO = null, apActive = 0;
  function apPump() {
    while (apActive < 4 && apQueue.length) {
      const src = apQueue.shift(); apActive++;
      nppToneProbe(src, (dark, ok) => {
        apActive--; apToneCache.set(src, dark); if (ok) nppToneSave(src, dark);
        const ws = apInflight.get(src) || []; apInflight.delete(src);
        ws.forEach(c => { c.classList.toggle('apNameDark', dark); c.classList.remove('apTonePending'); });
        apPump();
      });
    }
  }
  function apTone(root) {
    const cards = [...root.querySelectorAll('.apCard')], stored = nppToneRead();
    const apply = (card, dark) => { card.classList.toggle('apNameDark', !!dark); card.classList.remove('apTonePending'); };
    const srcOf = (card) => { const img = card.querySelector('.apPic img'); return img ? (img.currentSrc || img.getAttribute('src') || '') : ''; };
    const run = (card, src) => {
      if (apToneCache.has(src)) return apply(card, apToneCache.get(src));
      const w = apInflight.get(src); if (w) { w.push(card); return; }
      apInflight.set(src, [card]); apQueue.push(src); apPump();
    };
    if (apToneIO) apToneIO.disconnect();
    apToneIO = typeof IntersectionObserver === 'function' ? new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { apToneIO.unobserve(e.target); const s = srcOf(e.target); if (s) run(e.target, s); else apply(e.target, false); } }), { root: $('.apBody', root) || null, rootMargin: '600px' }) : null;
    cards.forEach(cd => {
      const src = srcOf(cd); if (!src) return;
      const v = stored[src];
      if (v === 'd' || v === 'l') { apToneCache.set(src, v === 'd'); apply(cd, v === 'd'); return; }
      if (apToneCache.has(src)) { apply(cd, apToneCache.get(src)); return; }
      cd.classList.add('apTonePending');
      if (apToneIO) apToneIO.observe(cd); else run(cd, src);
    });
  }

  const AP_CSS = `
#nppAP { --ap-bg: #fbf7ee; --ap-panel: #fffdf8; --ap-line: #e6dcf5; --ap-text: #392d5c; --ap-mute: #6c6290; --ap-acc: #7c5cf0; --ap-soft: #efe8ff; position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: stretch; justify-content: center; padding: 24px; background: rgba(70,52,110,.38); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); font-family: 'Outfit', system-ui, sans-serif; color: var(--ap-text); opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .2s ease, visibility 0s linear .2s; }
#nppAP.open { opacity: 1; visibility: visible; pointer-events: auto; transition: opacity .2s ease; }
#nppAP *, #nppAP *::before, #nppAP *::after { box-sizing: border-box; }
#nppAP .apWin { width: min(1240px, 100%); display: flex; flex-direction: column; min-height: 0; background: var(--ap-bg); border: 3px solid #fff; border-radius: 28px; box-shadow: 0 24px 70px rgba(70,52,110,.35); overflow: hidden; position: relative; transform: scale(.97) translateY(8px); transition: transform .22s cubic-bezier(.2,.8,.2,1); }
#nppAP.open .apWin { transform: none; }
#nppAP .apTop { position: sticky; top: 0; z-index: 5; background: linear-gradient(180deg, #f3ecff 0%, #fbf7ee 100%); border-bottom: 1px solid var(--ap-line); }
#nppAP .apBar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 16px 20px 8px; }
#nppAP .apBar h2 { margin: 0 10px 0 0; font-size: 24px; line-height: 32px; font-weight: 800; letter-spacing: -.02em; color: var(--ap-text); }
#nppAP .apStar { display: inline-block; color: #f5a623; margin-left: 6px; font-size: 18px; vertical-align: 2px; }
#nppAP input[type=search], #nppAP input[type=text], #nppAP select { font: inherit; font-size: 14px; line-height: 20px; color: var(--ap-text); background: #fff; border: 1px solid var(--ap-line); border-radius: 999px; padding: 8px 16px; min-width: 0; }
#nppAP input::placeholder { color: var(--ap-mute); opacity: .8; }
#nppAP .apSearch { flex: 1 1 200px; }
#nppAP button, #nppAP a.apBtn { font: inherit; font-size: 13px; font-weight: 700; line-height: 20px; cursor: pointer; color: var(--ap-text); background: #fff; border: 1px solid var(--ap-line); border-radius: 999px; padding: 7px 14px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: background .15s, transform .15s, border-color .15s, box-shadow .15s; }
#nppAP button:hover, #nppAP a.apBtn:hover { background: var(--ap-soft); border-color: #cbbaf2; box-shadow: 0 2px 8px rgba(124,92,240,.18); }
#nppAP .apPrimary { background: var(--ap-acc); color: #fff; border-color: transparent; }
#nppAP .apPrimary:hover { background: #6a49e0; border-color: transparent; }
#nppAP :focus-visible { outline: 3px solid #5b8def; outline-offset: 2px; }
#nppAP svg { width: 16px; height: 16px; flex: none; }
#nppAP .apIcon { width: 34px; height: 34px; padding: 0; }
#nppAP .apGroup { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--ap-mute); cursor: pointer; padding: 0 6px; }
#nppAP .apGroup input { accent-color: var(--ap-acc); width: 16px; height: 16px; margin: 0; }
#nppAP .apRow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 4px 20px 12px; }
#nppAP .apSeg { display: inline-flex; padding: 3px; gap: 2px; background: var(--ap-soft); border-radius: 999px; max-width: 100%; overflow-x: auto; }
#nppAP .apSeg button { border: 0; background: transparent; padding: 5px 14px; color: var(--ap-mute); white-space: nowrap; box-shadow: none; }
#nppAP .apSeg button:hover { background: rgba(255,255,255,.7); color: var(--ap-text); box-shadow: none; }
#nppAP .apSeg button.on { background: #fff; color: var(--ap-acc); box-shadow: 0 1px 4px rgba(124,92,240,.25); }
#nppAP .apChip { padding: 3px 12px; font-size: 12px; color: var(--ap-mute); background: transparent; border-style: dashed; }
#nppAP .apChip.on { color: var(--ap-text); background: #fff; border-style: solid; border-color: #cbbaf2; }
#nppAP .apStatus { padding: 8px 20px 0; font-size: 13px; color: var(--ap-mute); min-height: 28px; }
#nppAP .apBody { flex: 1; overflow: auto; padding: 0 20px 28px; background: radial-gradient(circle, #ddd2f7 1.2px, transparent 1.6px) 0 0 / 20px 20px; }
#nppAP .apHead { display: flex; align-items: center; gap: 8px; margin: 26px 0 6px; font-weight: 800; font-size: 16px; line-height: 24px; flex-wrap: wrap; color: var(--ap-text); }
#nppAP .apHead small { font-weight: 500; color: var(--ap-mute); font-size: 13px; }
#nppAP .apHead .apMain { color: #f5a623; }
#nppAP .apFoot .apWipe { border: 0; background: none; padding: 0; font: inherit; font-size: 13px; font-weight: 600; color: #d9534f; cursor: pointer; }
#nppAP .apFoot .apWipe:hover { text-decoration: underline; }
#nppAP .apFoot .apUnblk { border: 1px solid var(--ap-line); border-radius: 999px; background: none; padding: 1px 9px; font: inherit; font-size: 12px; font-weight: 600; color: var(--ap-mute); cursor: pointer; }
#nppAP .apFoot .apUnblk:hover { color: #d9534f; border-color: #d9534f; }
#nppAP .apAcRow { display: flex; align-items: center; gap: 2px; }
#nppAP .apAcRow .apOpt { flex: 1; min-width: 0; }
#nppAP .apAcRow .apAcX { flex: none; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--ap-mute); cursor: pointer; opacity: .55; }
#nppAP .apAcRow .apAcX svg { width: 14px; height: 14px; }
#nppAP .apAcRow:hover .apAcX, #nppAP .apAcRow .apAcX:focus-visible { opacity: 1; }
#nppAP .apAcRow .apAcX:hover { background: var(--ap-soft); color: #d9534f; }
#nppAP .apOv .apIco.apDel:hover { color: #d9534f; }
#nppAP .apGrid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 18px 14px; padding-top: 14px; }
#nppAP .apCard { position: relative; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
#nppAP .apImg { position: relative; aspect-ratio: 1 / 1; border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 0 0 1px var(--ap-line); transition: box-shadow .15s; }
#nppAP:not(.apEditing) .apCard:hover .apImg, #nppAP:not(.apEditing) .apCard:focus-within .apImg, #nppAP .apCard.tap .apImg { box-shadow: 0 0 0 1px #cbbaf2, 0 8px 22px rgba(124,92,240,.2); }
#nppAP .apCard.sel .apImg { box-shadow: 0 0 0 2px var(--ap-acc); }
#nppAP .apPic { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 38%, #fff 0%, #f6f0ff 58%, #e7dcff 100%); }
#nppAP .apPic img { width: 100%; height: 100%; object-fit: contain; display: block; transition: transform .25s ease; }
#nppAP:not(.apEditing) .apCard:hover .apPic img { transform: scale(1.04); }
#nppAP .apOv { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; display: flex; flex-direction: column; gap: 6px; padding: 26px 10px 8px; color: #fff; background: linear-gradient(to top, rgba(38,26,68,.86) 0%, rgba(38,26,68,.55) 60%, rgba(38,26,68,0) 100%); opacity: 0; transform: translateY(6px); pointer-events: none; transition: opacity .16s ease, transform .18s ease; }
#nppAP:not(.apEditing) .apCard:hover .apOv, #nppAP:not(.apEditing) .apCard:focus-within .apOv, #nppAP:not(.apEditing) .apCard.tap .apOv { opacity: 1; transform: none; pointer-events: auto; }
#nppAP .apInfo { min-width: 0; line-height: 15px; }
#nppAP .apInfo b { display: block; font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#nppAP .apInfo small { display: block; font-size: 11px; opacity: .72; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#nppAP .apIcos { display: flex; gap: 6px; }
#nppAP .apOv .apIco { width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%; background: rgba(255,255,255,.92); color: var(--ap-text); box-shadow: none; }
#nppAP .apOv .apIco:hover { background: #fff; color: var(--ap-acc); box-shadow: none; }
#nppAP .apOv .apIco svg { width: 14px; height: 14px; }
#nppAP .apCap { display: flex; align-items: center; gap: 8px; min-height: 20px; padding: 0 2px; }
#nppAP .apLk { color: inherit; text-decoration: none; } #nppAP .apLk:hover { text-decoration: underline; }
#nppAP .apCard.apTonePending .apName { opacity: 0 !important; }
#nppAP .apName { transition: opacity .15s; position: absolute; left: 10px; right: 10px; bottom: 8px; z-index: 4; font-family: 'CafeteriaBlack', Georgia, serif; font-size: 20px; line-height: 24px; font-weight: 400; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.85), 0 1px 1px rgba(0,0,0,.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
#nppAP .apName .apLk { pointer-events: auto; color: #fff; }
#nppAP:not(.apEditing) .apCard:hover .apName, #nppAP:not(.apEditing) .apCard:focus-within .apName, #nppAP .apCard.tap .apName { opacity: 0; }
#nppAP .apBadges { position: absolute; top: 8px; right: 8px; z-index: 5; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; pointer-events: none; }
#nppAP .apTb { font-size: 10px; line-height: 14px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #fff; border-radius: 999px; padding: 1px 8px; box-shadow: 0 1px 4px rgba(0,0,0,.25); }
#nppAP .apTb.uft { background: #f0a92e; } #nppAP .apTb.perm { background: #4cc784; } #nppAP .apTb.maybe { background: #4a9be8; }
#nppAP .apCard.apNameDark .apName, #nppAP .apCard.apNameDark .apName .apLk { color: #1c1830; text-shadow: none; }
#nppAP .apInfo b, #nppAP .apInfo small, #nppAP .apInfo b *, #nppAP .apInfo small *, #nppAP .apInfo .apLk { font-family: 'CafeteriaBlack', Georgia, serif !important; font-weight: 400; }
#nppAP .apName, #nppAP .apName .apLk, #nppAP .apCard .apName a { font-family: 'CafeteriaBlack', Georgia, serif !important; }
#nppAP .apInfo b { font-size: 14px; } #nppAP .apInfo small { font-size: 12px; }
#nppAP .apAct { box-shadow: 0 1px 4px rgba(0,0,0,.25); font-size: 10px; line-height: 14px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #1c8f55; background: #e3f7ec; border-radius: 4px; padding: 1px 6px; }
#nppAP .apNote { margin: -4px 2px 0; font-size: 12px; line-height: 16px; color: var(--ap-mute); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#nppAP .apChk { position: absolute; top: 8px; left: 8px; z-index: 4; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.92); border-radius: 6px; box-shadow: 0 0 0 1px var(--ap-line); cursor: pointer; }
#nppAP .apChk input { accent-color: var(--ap-acc); width: 16px; height: 16px; margin: 0; cursor: pointer; }
#nppAP .apEd { display: flex; flex-direction: column; gap: 6px; padding: 8px; background: #fff; border: 1px solid var(--ap-line); border-radius: 12px; }
#nppAP .apSegT { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
#nppAP .apTg { height: 30px; padding: 0 8px; border-radius: 8px; font-size: 12px; font-weight: 600; gap: 6px; box-shadow: none; white-space: nowrap; }
#nppAP .apTg::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #c9c2dc; flex: none; }
#nppAP .apTg.uft::before { background: #f0a92e; } #nppAP .apTg.perm::before { background: #4cc784; } #nppAP .apTg.maybe::before { background: #4a9be8; }
#nppAP .apTg:hover { box-shadow: none; }
#nppAP .apTg.on { color: var(--ap-text); border-color: #bdb4d6; background: #e8e4f1; }
#nppAP .apTg.on.uft { background: #ffd57d; border-color: #f0a92e; } #nppAP .apTg.on.perm { background: #9fe6b9; border-color: #4cc784; } #nppAP .apTg.on.maybe { background: #a5d6ff; border-color: #4a9be8; }
#nppAP .apEd input[type=text] { width: 100%; height: 30px; border-radius: 8px; padding: 0 10px; font-size: 13px; }
#nppAP .apEd input[type=text]:focus { outline: none; border-color: var(--ap-acc); box-shadow: 0 0 0 3px rgba(124,92,240,.18); }
#nppAP .apSaved { font-size: 11px; line-height: 14px; height: 14px; color: #1c8f55; opacity: 0; }
#nppAP .apSaved.show { animation: apSv 1.6s ease forwards; }
@keyframes apSv { 0% { opacity: 0; } 12%, 70% { opacity: 1; } 100% { opacity: 0; } }
#nppAP .apBulk { position: sticky; top: 0; z-index: 6; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; padding: 8px 10px; background: #fff; border: 1px solid var(--ap-line); border-radius: 10px; box-shadow: 0 4px 14px rgba(70,52,110,.12); }
#nppAP .apBulk button { height: 34px; border-radius: 8px; padding: 0 12px; font-weight: 600; box-shadow: none; }
#nppAP .apBulk .apTg { height: 34px; }
#nppAP .apBulk button:hover { box-shadow: none; }
#nppAP .apSelN { font-size: 13px; font-weight: 700; min-width: 84px; }
#nppAP .apBulkL { font-size: 13px; color: var(--ap-mute); }
#nppAP .apBulkT { display: flex; flex-wrap: wrap; gap: 4px; }
#nppAP .apSp { flex: 1 1 0; }
#nppAP .apGrid { padding-top: 14px; }
#nppAP .apBulk + .apGrid, #nppAP .apBulk + .apHead { margin-top: 0; }
#nppAP .apTop .apEditBtn.on { background: var(--ap-acc); border-color: transparent; color: #fff; }
#nppAP .apTop .apEditBtn.on:hover { background: #6a49e0; }
#nppAP .apNoImg { font-size: 48px; font-weight: 800; color: #a595d6; }
#nppAP .sk .apPic { background: linear-gradient(110deg, #f1eafc 30%, #fff 50%, #f1eafc 70%); background-size: 200% 100%; animation: apSk 1.6s linear infinite; }
#nppAP .sk .apLine { height: 12px; border-radius: 6px; background: #ece7f7; }
@keyframes apSk { to { background-position: -200% 0; } }
#nppAP .apNone { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 12px 16px; font-size: 14px; color: var(--ap-mute); border: 2px dashed #cbbaf2; border-radius: 18px; background: rgba(255,255,255,.6); }
#nppAP .apEmpty { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 56px 16px; text-align: center; color: var(--ap-mute); font-size: 15px; }
#nppAP .apFace { position: relative; width: 84px; height: 76px; border-radius: 50% 50% 46% 46%; background: #e7dcff; box-shadow: inset 0 -6px 0 rgba(124,92,240,.12); }
#nppAP .apFace::before, #nppAP .apFace::after { content: ""; position: absolute; top: -12px; width: 26px; height: 26px; background: #e7dcff; border-radius: 6px 22px 6px 22px; }
#nppAP .apFace::before { left: 6px; transform: rotate(-8deg); } #nppAP .apFace::after { right: 6px; transform: rotate(98deg); }
#nppAP .apFace i { position: absolute; top: 32px; width: 9px; height: 11px; border-radius: 50%; background: #392d5c; } #nppAP .apFace i:nth-child(1) { left: 24px; } #nppAP .apFace i:nth-child(2) { right: 24px; }
#nppAP .apFace b { position: absolute; left: 50%; top: 50px; width: 16px; height: 8px; margin-left: -8px; border-bottom: 3px solid #392d5c; border-radius: 0 0 16px 16px; }
#nppAP .apToast { position: absolute; left: 50%; bottom: 24px; transform: translate(-50%, 8px); padding: 8px 18px; border-radius: 999px; background: #392d5c; color: #fff; font-size: 13px; font-weight: 600; opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; z-index: 9; }
#nppAP .apToast.on { opacity: 1; transform: translate(-50%, 0); }
.nppAcctAllPets { width: 100%; margin: 8px 0 0; }
#nppAP .apTop .apBar { flex-wrap: nowrap; gap: 10px; padding: 16px 20px 10px; }
#nppAP .apTop .apBar h2 { display: flex; align-items: baseline; gap: 10px; margin: 0 6px 0 0; font-family: 'CafeteriaBlack', Georgia, serif !important; font-size: 30px; line-height: 1.1; font-weight: 400; white-space: nowrap; }
#nppAP .apBar h2 .apCount { font-family: inherit; }
#nppAP .apCount { font-size: 13px; font-weight: 500; color: var(--ap-mute); }
#nppAP .apTop input[type=search] { height: 34px; border-radius: 8px; padding: 0 12px; flex: 1 1 auto; }
#nppAP .apTop input[type=search]:focus { outline: none; border-color: var(--ap-acc); box-shadow: 0 0 0 3px rgba(124,92,240,.18); }
#nppAP .apTop button { height: 34px; border-radius: 8px; padding: 0 12px; font-weight: 600; box-shadow: none; }
#nppAP .apTop button:hover { box-shadow: none; }
#nppAP .apTop .apIcon { width: 34px; padding: 0; color: var(--ap-mute); }
#nppAP .apTop .apIcon:hover { color: var(--ap-text); }
#nppAP .apTop .apRow { position: relative; flex-wrap: wrap; justify-content: space-between; gap: 8px 12px; padding: 0 20px 12px; }
#nppAP .apTop .apSeg { padding: 3px; gap: 2px; border-radius: 10px; height: 38px; align-items: center; }
#nppAP .apTop .apSeg button { height: 30px; border-radius: 7px; padding: 0 10px; gap: 7px; color: var(--ap-mute); }
#nppAP .apTop .apSeg button.on { color: var(--ap-text); background: #fff; box-shadow: 0 0 0 1px var(--ap-line), 0 1px 2px rgba(70,52,110,.12); }
#nppAP .apTop .apSeg button.on .apN { color: var(--ap-acc); }
#nppAP .apN { font-weight: 500; font-size: 12px; color: var(--ap-mute); opacity: .9; }
#nppAP .apTd { width: 8px; height: 8px; border-radius: 50%; flex: none; }
#nppAP .apTd.uft { background: #f0a92e; } #nppAP .apTd.perm { background: #4cc784; } #nppAP .apTd.maybe { background: #4a9be8; }
#nppAP .apTools { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
#nppAP .apPopWrap { position: relative; }
#nppAP .apTop .apDd { gap: 6px; }
#nppAP .apDdl { color: var(--ap-mute); font-weight: 500; }
#nppAP .apDd b { font-weight: 600; }
#nppAP .apDd svg:last-child { width: 14px; height: 14px; color: var(--ap-mute); }
#nppAP .apDd[aria-expanded=true] { border-color: var(--ap-acc); background: var(--ap-soft); }
#nppAP .apTop .apTrade { color: var(--ap-text); }
#nppAP .apTop .apTrade.hot { background: var(--ap-acc); border-color: transparent; color: #fff; }
#nppAP .apTop .apTrade.hot:hover { background: #6a49e0; }
#nppAP .apPop { position: absolute; top: calc(100% + 6px); right: 0; z-index: 10; min-width: 220px; max-width: calc(100vw - 24px); max-height: 60vh; overflow-y: auto; padding: 6px; background: #fff; border: 1px solid var(--ap-line); border-radius: 10px; box-shadow: 0 10px 30px rgba(70,52,110,.22); }
#nppAP .apPop[hidden] { display: none; }
#nppAP .apPopHead { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px 6px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ap-mute); }
#nppAP .apTop .apLink { height: auto; border: 0; background: none; padding: 0; font-size: 12px; text-transform: none; letter-spacing: 0; color: var(--ap-acc); }
#nppAP .apTop .apLink:hover { background: none; text-decoration: underline; }
#nppAP .apOpt { display: flex; align-items: center; gap: 10px; padding: 7px 8px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; }
#nppAP .apOpt:hover { background: var(--ap-soft); }
#nppAP .apOpt input[type=checkbox], #nppAP .apOpt input[type=radio] { accent-color: var(--ap-acc); width: 16px; height: 16px; margin: 0; flex: none; }
#nppAP .apMainS { margin-left: auto; font-style: normal; color: #f5a623; }
#nppAP .apSep { height: 1px; margin: 6px 4px; background: var(--ap-line); }
#nppAP .apSw { justify-content: space-between; position: relative; }
#nppAP .apSw input { position: absolute; opacity: 0; width: 1px; height: 1px; }
#nppAP .apTrack { position: relative; width: 32px; height: 18px; border-radius: 999px; background: #d6cfe6; transition: background .15s; flex: none; }
#nppAP .apTrack::after { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.25); transition: transform .15s; }
#nppAP .apSw input:checked ~ .apTrack { background: var(--ap-acc); }
#nppAP .apSw input:checked ~ .apTrack::after { transform: translateX(14px); }
#nppAP .apSw input:focus-visible ~ .apTrack { outline: 3px solid #5b8def; outline-offset: 2px; }
@media (max-width: 600px) {
  #nppAP { padding: 0; }
  #nppAP .apWin { border-radius: 0; border: 0; width: 100%; }
  #nppAP .apTop .apBar { flex-wrap: wrap; padding: 12px 12px 8px; }
  #nppAP .apTop .apBar h2 { flex: 1; }
  #nppAP .apTop .apSearch { order: 5; flex-basis: 100%; }
  #nppAP .apTop .apRow { padding: 0 12px 10px; }
  #nppAP .apTop .apSeg { width: 100%; }
  #nppAP .apTools { width: 100%; }
  #nppAP .apTools .apTrade { margin-left: auto; }
  #nppAP .apPopWrap { position: static; }
  #nppAP .apPop { left: 12px; right: 12px; top: auto; margin-top: 6px; }
  #nppAP .apBody { padding: 0 12px 24px; }
  #nppAP .apGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px 12px; }
}
@media (min-width: 601px) and (max-width: 900px) { #nppAP .apGrid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (prefers-reduced-motion: reduce) { #nppAP, #nppAP *, #nppAP .apWin { transition: none !important; animation: none !important; } #nppAP .apWin, #nppAP .apCard, #nppAP .apPic img, #nppAP .apOv { transform: none !important; } }
/* dark mode (follows sidebar toggle) */
html[data-np-modern-interface]:not(.npp-side-light) #nppAP { --ap-bg: #1d1a2b; --ap-panel: #272238; --ap-line: rgba(255,255,255,.12); --ap-text: #f1ecff; --ap-mute: rgba(241,236,255,.62); --ap-acc: #a58bff; --ap-soft: rgba(165,139,255,.16); color-scheme: dark; background: rgba(8,6,16,.6); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apWin { border-color: rgba(255,255,255,.14); box-shadow: 0 24px 70px rgba(0,0,0,.55); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTop { background: linear-gradient(180deg, #2a2440 0%, #1d1a2b 100%); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP input[type=search], html[data-np-modern-interface]:not(.npp-side-light) #nppAP input[type=text], html[data-np-modern-interface]:not(.npp-side-light) #nppAP select, html[data-np-modern-interface]:not(.npp-side-light) #nppAP button, html[data-np-modern-interface]:not(.npp-side-light) #nppAP a.apBtn, html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apEd, html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apBulk, html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apPop { background: var(--ap-panel); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP select option { background: #272238; color: #f1ecff; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP button:hover, html[data-np-modern-interface]:not(.npp-side-light) #nppAP a.apBtn:hover { background: var(--ap-soft); border-color: rgba(165,139,255,.45); box-shadow: 0 2px 8px rgba(0,0,0,.35); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apPrimary, html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTop .apEditBtn.on, html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTop .apTrade.hot { background: var(--ap-acc); color: #1d1a2b; border-color: transparent; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apPrimary:hover, html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTop .apEditBtn.on:hover, html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTop .apTrade.hot:hover { background: #b8a2ff; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apSeg button { background: transparent; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apSeg button:hover { background: rgba(255,255,255,.08); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apSeg button.on, html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTop .apSeg button.on { background: var(--ap-panel); color: var(--ap-acc); box-shadow: 0 0 0 1px var(--ap-line), 0 1px 4px rgba(0,0,0,.35); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTop .apSeg button.on { color: var(--ap-text); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apChip { background: transparent; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apChip.on { background: var(--ap-panel); border-color: rgba(165,139,255,.45); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apBody { background: radial-gradient(circle, rgba(255,255,255,.08) 1.2px, transparent 1.6px) 0 0 / 20px 20px; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP:not(.apEditing) .apCard:hover .apImg, html[data-np-modern-interface]:not(.npp-side-light) #nppAP:not(.apEditing) .apCard:focus-within .apImg, html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apCard.tap .apImg { box-shadow: 0 0 0 1px rgba(165,139,255,.45), 0 8px 22px rgba(0,0,0,.45); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apCard.sel .apImg { box-shadow: 0 0 0 2px var(--ap-acc); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apOv .apIco { background: rgba(255,255,255,.92); color: #392d5c; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apOv .apIco:hover { background: #fff; color: #7c5cf0; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apAct { background: rgba(76,199,132,.18); color: #7be0a6; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apSaved { color: #7be0a6; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apChk { background: rgba(39,34,56,.92); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTg::before { background: rgba(255,255,255,.3); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTg.uft::before { background: #f0a92e; } html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTg.perm::before { background: #4cc784; } html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTg.maybe::before { background: #4a9be8; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTg.on { color: var(--ap-text); border-color: rgba(255,255,255,.25); background: rgba(255,255,255,.1); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTg.on.uft { background: rgba(240,169,46,.22); border-color: #f0a92e; color: #ffe2a0; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTg.on.perm { background: rgba(76,199,132,.2); border-color: #4cc784; color: #b5f0cd; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTg.on.maybe { background: rgba(74,155,232,.22); border-color: #4a9be8; color: #bfe0ff; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apEd input[type=text]:focus, html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTop input[type=search]:focus { box-shadow: 0 0 0 3px rgba(165,139,255,.25); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apBulk { box-shadow: 0 4px 14px rgba(0,0,0,.4); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apNoImg { color: rgba(255,255,255,.35); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .sk .apPic { background: linear-gradient(110deg, rgba(255,255,255,.06) 30%, rgba(255,255,255,.14) 50%, rgba(255,255,255,.06) 70%); background-size: 200% 100%; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .sk .apLine { background: rgba(255,255,255,.08); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apNone { border-color: rgba(165,139,255,.45); background: rgba(255,255,255,.04); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apFace, html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apFace::before, html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apFace::after { background: rgba(255,255,255,.08); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apFace i { background: var(--ap-text); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apFace b { border-bottom-color: var(--ap-text); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apToast { background: #f1ecff; color: #1d1a2b; }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apTrack { background: rgba(255,255,255,.18); }
html[data-np-modern-interface]:not(.npp-side-light) #nppAP .apSw input:checked ~ .apTrack { background: var(--ap-acc); }
`;

  let apEl = null, apToastT = null;
  const apState = { q: '', sort: 'account', group: false, tab: 'all', only: new Set(), edit: false, sel: new Set(), saved: '', shown: [], pick: false, picked: new Set() };
  // Trade pick mode: checkboxes on Up for Trade cards; the copy button then copies only the picked pets.
  function apTradeLbl() {
    if (!apEl) return;
    const pb = $('.apPickBtn', apEl), tb = $('.apTrade span', apEl), n = apState.picked.size;
    if (pb) { pb.classList.toggle('on', apState.pick); pb.setAttribute('aria-pressed', String(apState.pick)); $('span', pb).textContent = apState.pick ? 'Done picking' : 'Pick pets'; }
    if (tb) tb.textContent = apState.pick && n ? 'Copy ' + n + ' picked' : 'Copy trade list';
  }
  try { const pr = JSON.parse(LSget('npp_ap_prefs') || 'null'); if (pr) { if (['account', 'name', 'species', 'tag'].includes(pr.sort)) apState.sort = pr.sort; apState.group = !!pr.group; } } catch {}
  const apSavePrefs = () => { try { LSset('npp_ap_prefs', JSON.stringify({ sort: apState.sort, group: apState.group })); } catch {} };
  const fmtAgo = (t) => { if (!t) return 'never'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
  const apToast = (m) => { if (!apEl) return; const t = $('.apToast', apEl); t.textContent = m; t.classList.add('on'); clearTimeout(apToastT); apToastT = setTimeout(() => t.classList.remove('on'), 1800); };
  const apStatus = (m) => { if (apEl) $('.apStatus', apEl).textContent = m || ''; };
  async function apCopy(text, msg) {
    try { await navigator.clipboard.writeText(text); apToast(msg); }
    catch { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} ta.remove(); apToast(ok ? msg : 'Copy failed'); }
  }

  function openAllPets() {
    if (drawerSetOpen) drawerSetOpen(false);
    apCollect();
    if (!apEl) {
      const st = document.createElement('style'); st.textContent = AP_CSS; (document.head || root).appendChild(st);
      apEl = document.createElement('div'); apEl.id = 'nppAP'; apEl.setAttribute('role', 'dialog'); apEl.setAttribute('aria-label', 'My pets');
      apEl.innerHTML = '<div class="apWin"><div class="apTop"><div class="apBar"><h2>All Pets<small class="apCount"></small></h2><input class="apSearch" type="search" placeholder="Search name, species, colour, note…" aria-label="Search pets"><button type="button" class="apRefresh apIcon" title="Refresh this account" aria-label="Refresh this account">' + AP_I('<path d="M13.5 8a5.5 5.5 0 1 1-1.8-4.1M13.5 2.5v3h-3"/>') + '</button><button type="button" class="apClose apIcon" aria-label="Close" title="Close (Esc)">' + AP_I('<path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/>') + '</button></div><div class="apRow"><div class="apSeg apTabs" role="tablist"></div><div class="apTools"><div class="apPopWrap"><button type="button" class="apDd apAcctBtn" aria-haspopup="true" aria-expanded="false"><span class="apDdl">Accounts</span><b class="apAcctVal">All accounts</b>' + AP_I('<path d="M4 6l4 4 4-4"/>') + '</button><div class="apPop apAcctPop" hidden><div class="apPopHead"><span>Accounts</span><button type="button" class="apLink" data-all="1">Show all</button></div><div class="apAcctList"></div></div></div><div class="apPopWrap"><button type="button" class="apDd apSortBtn" aria-haspopup="true" aria-expanded="false"><span class="apDdl">Sort</span><b class="apSortVal">Account</b>' + AP_I('<path d="M4 6l4 4 4-4"/>') + '</button><div class="apPop apSortPop" hidden><div class="apPopHead"><span>Sort by</span></div><label class="apOpt"><input type="radio" name="apSortR" value="account"><span>Account</span></label><label class="apOpt"><input type="radio" name="apSortR" value="name"><span>Name</span></label><label class="apOpt"><input type="radio" name="apSortR" value="species"><span>Species</span></label><label class="apOpt"><input type="radio" name="apSortR" value="tag"><span>Tag</span></label><div class="apSep"></div><label class="apOpt apSw"><span>Group by account</span><input type="checkbox" class="apGroupCb" role="switch"><i class="apTrack" aria-hidden="true"></i></label></div></div><button type="button" class="apEditBtn" data-act="editmode" aria-pressed="false" title="Edit tags and notes">' + AP_PENCIL + '<span>Edit tags</span></button><button type="button" class="apEditBtn apPickBtn" data-act="pick" aria-pressed="false" title="Pick which Up for Trade pets go in the copied list">' + AP_ACTIVE + '<span>Pick pets</span></button><button type="button" class="apTrade" title="Copy Up for Trade pets as text">' + AP_COPY + '<span>Copy trade list</span></button></div></div></div><div class="apStatus" aria-live="polite"></div><div class="apBody"></div><div class="apToast" role="status"></div></div>';
      document.body.appendChild(apEl);
      apEl.addEventListener('mousedown', (e) => { if (e.target === apEl) closeAllPets(); });
      $('.apClose', apEl).addEventListener('click', closeAllPets);
      $('.apSearch', apEl).addEventListener('input', (e) => { apState.q = e.target.value.trim().toLowerCase(); apRender(); });
      const apClosePops = () => { apEl.querySelectorAll('.apPop').forEach(p => { p.hidden = true; }); apEl.querySelectorAll('.apDd').forEach(x => x.setAttribute('aria-expanded', 'false')); };
      apEl.addEventListener('click', (e) => {
        const dd = e.target.closest('.apDd');
        if (dd) { const pop = $('.apPop', dd.parentNode), was = !pop.hidden; apClosePops(); if (!was) { pop.hidden = false; dd.setAttribute('aria-expanded', 'true'); } return; }
        if (e.target.closest('[data-all]')) { apState.only.clear(); apRender(); }
      });
      apEl.addEventListener('mousedown', (e) => { if (!e.target.closest('.apPopWrap')) apClosePops(); });
      apEl.addEventListener('change', (e) => { if (e.target.name === 'apSortR') { apState.sort = e.target.value; apSavePrefs(); apRender(); } });
      $('.apGroupCb', apEl).addEventListener('change', (e) => { apState.group = e.target.checked; apSavePrefs(); apRender(); });
      $('.apRefresh', apEl).addEventListener('click', () => { apCollect(true); apRender(); apStatus('Updated ' + (curUser() || 'this account') + '.'); });
      $('.apTrade', apEl).addEventListener('click', () => {
        const c = apRead(), tags = apTags(), lines = [], only = apState.pick && apState.picked.size ? apState.picked : null;
        apOrdered().forEach(a => ((apOf(c, a) || {}).pets || []).forEach(p => { if ((tags[p.name.toLowerCase()] || {}).s === 'uft' && (!only || only.has(p.name.toLowerCase())) && !lines.some(l => l.startsWith(p.name + ' - '))) lines.push(p.name + ' - ' + ([p.color, p.species].filter(Boolean).join(' ') || '?')); }));
        if (!lines.length) { apToast('No Up for Trade pets yet'); return; }
        apCopy(lines.join('\n'), 'Copied ' + lines.length + ' pet' + (lines.length === 1 ? '' : 's'));
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && apEl.classList.contains('open')) { e.stopPropagation(); if (apEl.querySelector('.apPop:not([hidden])')) apClosePops(); else if (apState.edit) apSetEdit(false); else closeAllPets(); } }, true);
      const apSaveTag = (k, patch) => {
        const t = apTags(), cur = t[k] || {};
        if ('s' in patch) cur.s = patch.s;
        if ('n' in patch) cur.n = patch.n.trim().slice(0, 60);
        if (!cur.s && !cur.n) delete t[k]; else t[k] = cur;
        gmSet(AP_TAGS, t);
      };
      const apNote = (e) => { const el = e.target.closest('input[data-tag]'); if (el) apSaveTag(el.dataset.tag, { n: el.value }); };
      apEl.addEventListener('input', apNote);
      apEl.addEventListener('change', (e) => {
        apNote(e);
        const el = e.target.closest('input[data-tag]'); if (el) apFlash(el.dataset.tag);
        const sk = e.target.dataset && e.target.dataset.sel;
        if (sk) { e.target.checked ? apState.sel.add(sk) : apState.sel.delete(sk); e.target.closest('.apCard').classList.toggle('sel', e.target.checked); const sn = $('.apSelN', apEl); if (sn) sn.textContent = apState.sel.size + ' selected'; }
        const pk = e.target.dataset && e.target.dataset.pick;
        if (pk) { e.target.checked ? apState.picked.add(pk) : apState.picked.delete(pk); e.target.closest('.apCard').classList.toggle('sel', e.target.checked); apTradeLbl(); }
      });
      apEl.addEventListener('click', (e) => {
        const tab = e.target.closest('[data-tab]'); if (tab) { apState.tab = tab.dataset.tab; apRender(); return; }
        const b = e.target.closest('button[data-act]');
        if (!b) {
          const cd = e.target.closest('.apCard');
          if (cd && !apState.edit && !e.target.closest('a, input')) { const on = !cd.classList.contains('tap'); apEl.querySelectorAll('.apCard.tap').forEach(x => x.classList.remove('tap')); cd.classList.toggle('tap', on); }
          return;
        }
        const n = b.dataset.n, acct = b.dataset.a;
        if (b.dataset.act === 'copy') apCopy(n, 'Copied ' + n);
        else if (b.dataset.act === 'tag') { apSaveTag(b.dataset.k, { s: b.dataset.v }); apState.saved = b.dataset.k; apRender(); }
        else if (b.dataset.act === 'bulk') {
          if (!apState.sel.size) { apToast('Select some pets first'); return; }
          const t = apTags(); apState.sel.forEach(k => { const cur = t[k] || {}; cur.s = b.dataset.v; if (!cur.s && !cur.n) delete t[k]; else t[k] = cur; });
          gmSet(AP_TAGS, t); apToast('Updated ' + apState.sel.size + ' pet' + (apState.sel.size === 1 ? '' : 's')); apRender();
        } else if (b.dataset.act === 'selall') { apState.shown.forEach(k => apState.sel.add(k)); apRender(); }
        else if (b.dataset.act === 'selclr') { apState.sel.clear(); apRender(); }
        else if (b.dataset.act === 'pick') {
          apState.pick = !apState.pick;
          if (apState.pick) { if (apState.edit) apSetEdit(false); apState.tab = 'uft'; } else apState.picked.clear();
          apRender(); apTradeLbl();
        }
        else if (b.dataset.act === 'wipe') {
          if (!confirm('Delete all saved All Pets data for every account, including tags and notes? This cannot be undone.')) return;
          gmSet(AP_KEY, {}); gmSet(AP_TAGS, {}); apState.sel.clear(); apRender(); apToast('All Pets data deleted');
        } else if (b.dataset.act === 'delpet') {
          if (!confirm('Delete ' + n + ' from All Pets? If ' + n + ' is still on ' + acct + ', it comes back the next time you log in there.')) return;
          const pc = apRead(), low = n.toLowerCase();
          Object.keys(pc).forEach(k => { if (pc[k] && Array.isArray(pc[k].pets)) pc[k] = { ...pc[k], pets: pc[k].pets.filter(p => String(p.name).toLowerCase() !== low) }; });
          gmSet(AP_KEY, pc); apDropTags(pc, [low]); apState.sel.delete(low); apRender(); apToast('Deleted ' + n);
        } else if (b.dataset.act === 'acdel') {
          if (acct.toLowerCase() === curUser().toLowerCase()) { apStatus('You are logged in as ' + acct + ', so its pets would come straight back. Block it instead, or log in to another account first.'); return; }
          if (!confirm('Delete ' + acct + ' from this computer? Its saved pets, tags and notes are deleted too. It is added again if you log in to it.')) return;
          removeAccount(acct); apToast('Deleted ' + acct);
        } else if (b.dataset.act === 'acblock') {
          if (!confirm('Block ' + acct + '? Its saved pets are deleted and it is never tracked or listed again, even if you log in to it. You can unblock it at the bottom of All Pets.')) return;
          apSetBlock(acct, true); removeAccount(acct); apRender(); apToast('Blocked ' + acct);
        } else if (b.dataset.act === 'unblock') {
          apSetBlock(acct, false); apRender(); apToast('Unblocked ' + acct + '. Log in to it once to add its pets.');
        }
        else if (b.dataset.act === 'editmode') {
          apSetEdit(!apState.edit);
        } else if (b.dataset.act === 'active') {
          const a = [...document.querySelectorAll('#qrDock .qrOverlay a')].find(x => /make active/i.test(x.textContent) && (x.getAttribute('href') || '').toLowerCase().includes(n.toLowerCase()));
          if (a) { b.disabled = true; a.click(); } else apStatus('Open your Quick Ref / pet menu on Neopets to make ' + n + ' active.');
        } else if (b.dataset.act === 'switch') {
          swapAccount(() => { b.disabled = true; }, () => { b.disabled = false; apStatus('Log in as ' + acct + ' in the new tab. Nothing happens automatically.'); });
        }
      });
    }
    apEl.querySelectorAll('input[name=apSortR]').forEach(r => { r.checked = r.value === apState.sort; }); $('.apGroupCb', apEl).checked = apState.group;
    document.dispatchEvent(new CustomEvent('npp:drawer', { detail: 'allpets' }));
    apEl.classList.add('open');
    apStatus('');
    apRender();
  }
  function closeAllPets() { if (apEl) { apEl.classList.remove('open'); apSetEdit(false); } }
  function apSetEdit(on) {
    if (!apEl) return;
    apState.edit = on; if (!on) apState.sel.clear();
    if (on && apState.pick) { apState.pick = false; apState.picked.clear(); apTradeLbl(); }
    apEl.classList.toggle('apEditing', on);
    const b = $('.apEditBtn', apEl); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); $('span', b).textContent = on ? 'Done' : 'Edit tags';
    apEl.querySelectorAll('.apPop').forEach(p => { p.hidden = true; });
    if (apEl.classList.contains('open')) apRender();
  }
  function apFlash(k) {
    if (!apEl) return;
    const c = [...apEl.querySelectorAll('.apCard')].find(x => x.dataset.k === k), sv = c && $('.apSaved', c);
    if (sv) { sv.classList.remove('show'); void sv.offsetWidth; sv.classList.add('show'); }
  }

  function apRender() {
    if (!apEl) return;
    const c = apRead(), tags = apTags(), accts = apOrdered(), me = curUser().toLowerCase();
    const inAcct = (n) => !apState.only.size || apState.only.has(n);
    const cnt = { all: 0, uft: 0, perm: 0, maybe: 0, none: 0 };
    // Safety net: one card per pet name; if a name sits under several accounts, the newest-collected account owns it.
    const owner = new Map();
    accts.forEach(a => { const e = apOf(c, a); if (e) (e.pets || []).forEach(p => { const n = String(p.name).toLowerCase(), o = owner.get(n); if (!o || (e.t || 0) > o.t) owner.set(n, { a: a.toLowerCase(), t: e.t || 0 }); }); });
    const petsOf = (e, a) => { const seen = new Set(); return (e.pets || []).filter(p => { const n = String(p.name).toLowerCase(); if (seen.has(n) || (owner.get(n) || {}).a !== a.toLowerCase()) return false; seen.add(n); return true; }); };
    accts.filter(inAcct).forEach(a => { const e = apOf(c, a); if (e) petsOf(e, a).forEach(p => { cnt.all++; cnt[(tags[p.name.toLowerCase()] || {}).s || 'none']++; }); });
    const tabs = [['all', 'All'], ['uft', 'Up for trade'], ['perm', 'Keeping'], ['maybe', 'Maybe'], ['none', 'Untagged']];
    $('.apTabs', apEl).innerHTML = tabs.map(t => `<button type="button" role="tab" aria-selected="${apState.tab === t[0]}" class="${apState.tab === t[0] ? 'on' : ''}" data-tab="${t[0]}">${t[0] === 'all' || t[0] === 'none' ? '' : `<i class="apTd ${t[0]}"></i>`}${t[1]}<span class="apN">${cnt[t[0]] || 0}</span></button>`).join('');
    $('.apCount', apEl).textContent = cnt.all + ' pet' + (cnt.all === 1 ? '' : 's');
    $('.apAcctVal', apEl).textContent = apState.only.size ? apState.only.size + ' of ' + accts.length : 'All accounts';
    $('.apSortVal', apEl).textContent = { account: 'Account', name: 'Name', species: 'Species', tag: 'Tag' }[apState.sort] || 'Account';
    $('.apTrade', apEl).classList.toggle('hot', apState.tab === 'uft');
    const mainA = mainAcct().toLowerCase();
    $('.apAcctList', apEl).innerHTML = accts.map(n => `<div class="apAcRow"><label class="apOpt"><input type="checkbox" data-n="${esc(n)}"${inAcct(n) ? ' checked' : ''}><span>${esc(n)}</span>${n.toLowerCase() === mainA ? '<em class="apMainS" title="Main account" aria-label="Main account">★</em>' : ''}</label><button type="button" class="apAcX" data-act="acdel" data-a="${esc(n)}" title="Delete ${esc(n)} and its pets" aria-label="Delete account ${esc(n)}">${AP_TRASH}</button><button type="button" class="apAcX" data-act="acblock" data-a="${esc(n)}" title="Block ${esc(n)} (delete and never track again)" aria-label="Block account ${esc(n)}">${AP_BLOCK_I}</button></div>`).join('');
    $('.apAcctList', apEl).onchange = (e) => { const n = e.target.dataset.n; if (!n) return; apState.only.has(n) ? apState.only.delete(n) : apState.only.add(n); apRender(); };
    const tagOf = (p) => tags[p.name.toLowerCase()] || {};
    const match = (p) => {
      const s = tagOf(p).s || '';
      if (apState.tab === 'none' ? s : apState.tab !== 'all' && s !== apState.tab) return false;
      return !apState.q || [p.name, p.species, p.color, tagOf(p).n || '', ST[s] || ''].join(' ').toLowerCase().includes(apState.q);
    };
    const card = (p, a) => {
      const mine = a.toLowerCase() === me, t = tagOf(p), k = p.name.toLowerCase();
      const sub = [p.color, p.species].filter(Boolean).join(' ');
      const tip = mine ? 'Make ' + p.name + ' your active pet' : 'Switch to ' + a;
      const g = /^f/i.test(p.gender || '') ? '♀' : /^m/i.test(p.gender || '') ? '♂' : (p.gender || '');
      const line = [sub, p.level ? 'Lv ' + p.level : '', g].filter(Boolean).join(' · ') || p.name;
      const sw = mine ? (p.active ? '' : `<button type="button" class="apIco" data-act="active" data-n="${esc(p.name)}" title="${esc(tip)}" aria-label="${esc(tip)}">${AP_SWAP}</button>`) : `<button type="button" class="apIco" data-act="switch" data-a="${esc(a)}" title="${esc(tip)}" aria-label="${esc(tip)}">${AP_SWAP}</button>`;
      const tg = APO.map(o => `<button type="button" class="apTg ${o[0]}${(t.s || '') === o[0] ? ' on' : ''}" data-act="tag" data-v="${o[0]}" data-k="${esc(k)}" aria-pressed="${(t.s || '') === o[0]}">${o[1]}</button>`).join('');
      const pic = `<div class="apPic">${p.img ? `<img src="${esc(apHiRes(p))}" data-fb="${esc(p.img)}" onerror="if(this.dataset.fb&&this.src!==this.dataset.fb)this.src=this.dataset.fb" alt="${esc(p.name + (sub ? ', ' + sub : ''))}" loading="lazy">` : `<span class="apNoImg">${esc(p.name.charAt(0).toUpperCase())}</span>`}</div>`;
      const top = apState.edit
        ? `<label class="apChk"><input type="checkbox" data-sel="${esc(k)}"${apState.sel.has(k) ? ' checked' : ''} aria-label="Select ${esc(p.name)}"></label>`
        : (apState.pick && t.s === 'uft' ? `<label class="apChk"><input type="checkbox" data-pick="${esc(k)}"${apState.picked.has(k) ? ' checked' : ''} aria-label="Add ${esc(p.name)} to the trade list"></label>` : '') + `<div class="apOv"><div class="apInfo"><b>${esc(line)}</b><small>${apUserLk(a)}</small></div><div class="apIcos"><a class="apIco apBtn" href="https://www.neopets.com/~${encodeURIComponent(p.name)}" target="_blank" rel="noopener" title="Pet Page" aria-label="Pet Page for ${esc(p.name)}">${AP_PAGE}</a>${sw}<button type="button" class="apIco" data-act="copy" data-n="${esc(p.name)}" title="Copy name" aria-label="Copy name ${esc(p.name)}">${AP_COPY}</button><button type="button" class="apIco apDel" data-act="delpet" data-n="${esc(p.name)}" data-a="${esc(a)}" title="Delete from All Pets" aria-label="Delete ${esc(p.name)} from All Pets">${AP_TRASH}</button></div></div>`;
      const ed = apState.edit ? `<div class="apEd" role="group" aria-label="Edit ${esc(p.name)}"><div class="apSegT">${tg}</div><input type="text" data-tag="${esc(k)}" value="${esc(t.n || '')}" maxlength="60" placeholder="Add a note…" aria-label="Note for ${esc(p.name)}"><span class="apSaved" aria-live="polite">Saved ✓</span></div>` : (t.n ? `<div class="apNote" title="${esc(t.n)}">${esc(t.n)}</div>` : '');
      return `<div class="apCard${apState.sel.has(k) ? ' sel' : ''}" data-k="${esc(k)}"><div class="apImg">${pic}${top}${(p.active || t.s) ? `<div class="apBadges">${p.active ? '<span class="apAct">active</span>' : ''}${t.s && ST_LBL[t.s] ? `<span class="apTb ${t.s}">${ST_LBL[t.s]}</span>` : ''}</div>` : ''}<span class="apName ${t.s || ''}">${apPetLk(p.name)}</span></div><div class="apCap"></div>${ed}</div>`;
    };
    const shown = accts.filter(a => !apState.only.size || apState.only.has(a));
    const rank = { uft: 0, perm: 1, maybe: 2 };
    const byName = (x, y) => x[0].name.toLowerCase() < y[0].name.toLowerCase() ? -1 : 1;
    const cmp = apState.sort === 'species' ? (x, y) => (x[0].species + ' ' + x[0].name).toLowerCase() < (y[0].species + ' ' + y[0].name).toLowerCase() ? -1 : 1
      : apState.sort === 'tag' ? (x, y) => ((rank[tagOf(x[0]).s] ?? 3) - (rank[tagOf(y[0]).s] ?? 3)) || byName(x, y) : byName;
    const grid = (l) => `<div class="apGrid">${l.map(x => card(x[0], x[1])).join('')}</div>`;
    const mainL = mainAcct().toLowerCase();
    let html = '';
    const unseen = [], all = [], secs = [];
    shown.forEach(a => {
      const e = apOf(c, a);
      if (!e) { unseen.push(a); return; }
      const l = petsOf(e, a).filter(match).map(p => [p, a]).sort(cmp);
      if (!l.length) return;
      secs.push([a, e, l]); l.forEach(x => all.push(x));
    });
    if (apState.group) {
      html = secs.map(s => `<div class="apHead"><span>${apUserLk(s[0])}</span>${s[0].toLowerCase() === mainL ? '<span class="apMain" title="Main account" aria-label="Main account">★</span>' : ''}<small>${s[2].length} pet${s[2].length === 1 ? '' : 's'} · seen ${fmtAgo(s[1].t)}</small></div>${grid(s[2])}`).join('');
    } else {
      if (apState.sort !== 'account') all.sort(cmp);
      html = all.length ? (apState.sort === 'account' ? '' : `<div class="apHead">${all.length} pets</div>`) + grid(all) : '';
    }
    const blk = [...apBlocked()];
    if (html || unseen.length || blk.length) html += `<div class="apHead apFoot"><small>${unseen.length ? `Not seen yet: ${unseen.map(apUserLk).join(', ')}. Log in once to add their pets.` : 'Pets stay saved on this computer until you delete them.'}</small><button type="button" class="apWipe" data-act="wipe" title="Delete all saved All Pets data">Delete data</button></div>`
      + (blk.length ? `<div class="apHead apFoot"><small>Blocked:</small>${blk.map(n => `<button type="button" class="apUnblk" data-act="unblock" data-a="${esc(n)}" title="Unblock ${esc(n)}">${esc(n)} ×</button>`).join('')}</div>` : '');
    apState.shown = all.map(x => x[0].name.toLowerCase());
    if (apState.edit && html) html = `<div class="apBulk"><span class="apSelN">${apState.sel.size} selected</span><span class="apBulkL">Set selected to:</span><div class="apBulkT">${APO.map(o => `<button type="button" class="apTg ${o[0]}" data-act="bulk" data-v="${o[0]}">${o[1]}</button>`).join('')}</div><span class="apSp"></span><button type="button" data-act="selall">Select all shown</button><button type="button" data-act="selclr">Clear</button></div>` + html;
    $('.apBody', apEl).innerHTML = html || '<div class="apEmpty"><div class="apFace" aria-hidden="true"><i></i><i></i><b></b></div><div>No pets here yet. Try another filter, or clear the search.</div></div>';
    if (apState.saved) { apFlash(apState.saved); apState.saved = ''; }
    try { apTone(apEl); } catch {}
  }

  // Passive collection: local reads only (no network). Runs shortly after load and when the data changes.
  // Login / account swap: a new user in this tab gets extra passes while the page's pet data loads.
  const apNewUser = () => { const u = curUser().toLowerCase(); let was = ''; try { was = sessionStorage.getItem('npp_ap_user') || ''; sessionStorage.setItem('npp_ap_user', u); } catch {} return !!u && u !== was; };
  try { const dc = apRead(); if (apDedupe(dc)) gmSet(AP_KEY, dc); } catch {}   // one-time cleanup of stored duplicates
  // Only on login/swap (a new user in this tab), not on a timer.
  // Home page: read once when the pet carousel (colour/species/level) has loaded.
  if (['/home', '/home/', '/home/index.phtml'].includes(location.pathname.toLowerCase())) { let n = 0; const iv = setInterval(() => { if (document.querySelector('.hp-carousel-pet[data-species]') || ++n > 30) { clearInterval(iv); apCollect(true); } }, 500); }
  // Every other page load gets one local pass (no network; unchanged data within 10 min is not rewritten).
  setTimeout(() => { if (apNewUser()) [0, 2500, 9500, 19500].forEach(ms => setTimeout(apCollect, ms)); else setTimeout(apCollect, 2000); }, 2500);
  // Logout: save the current account's pets right before the logout link navigates away.
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('a[href*="logout"]')) apCollect(); }, true);
  // Remember a "Make Active" click for this account so the tag updates before Quick Ref refreshes.
  document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href*="new_active_pet="]'); const m = a && a.href.match(/new_active_pet=([A-Za-z0-9_]+)/); if (m) LSset('npp_ap_newactive', JSON.stringify({ u: curUser().toLowerCase(), n: m[1], t: Date.now() })); }, true);

  /* ───────────────────────────────── drawer ───────────────────────────────── */
  let MODE = 'standalone';
  const detectMode = () => {
    MODE = document.getElementById('npUser') ? 'modern' : 'standalone';   // main script present (with or without the core)
    return MODE;
  };

  let drawerEl = null, tabEl = null, open = false, acctTabRefresh = null, drawerSetOpen = null;

  function buildDrawer() {
    const drawer = document.createElement('div');
    drawer.id = 'nppAcctDrawer';
    drawer.innerHTML =
      '<div class="nppAcctHead"><div class="nppAcctHeadL"><span class="nppAcctTitle">Accounts</span><small class="nppAcctCount"></small></div><div class="nppAcctHeadR">' +
      (MODE === 'modern'
        ? '<a class="nppAcctSwap" href="' + SWAP_URL + '" target="_blank" rel="noopener" title="Swap account: log out and go straight to the login page">' + USERS_ICON + '<span>Swap</span></a>'
        : '') +
      '<button type="button" class="nppAcctClose" aria-label="Close" title="Close">&times;</button></div></div>' +
      '<div class="nppAcctHint"></div>' +
      '<div class="nppAcctBody">' +
        '<section class="nppAcctSec"><div class="nppAcctSecHead"><span>NeoPass</span><em class="nppCntNp"></em></div><div class="nppAcctList" data-list="np"></div><div class="nppAcctNote" data-note="np"></div><button type="button" class="nppAcctSync">Sync from NeoPass</button><div class="nppAcctMsg" data-msg="np"></div></section>' +
        '<section class="nppAcctSec" data-sec="ex" hidden><div class="nppAcctSecHead"><span>Additional accounts</span><em class="nppCntEx"></em></div><div class="nppAcctList" data-list="ex"></div></section>' +
        '<div class="nppAcctAddWrap"><button type="button" class="nppAcctAddBtn">+ Add account</button><form class="nppAcctAdd" autocomplete="off" hidden><input type="text" placeholder="Account name…" aria-label="Account name" spellcheck="false"><button type="submit" class="nppAcctAddOk">Add</button><button type="button" class="nppAcctAddCancel" aria-label="Cancel" title="Cancel">×</button></form><div class="nppAcctMsg" data-msg="ex"></div></div>' +
      '</div>' +
      (MODE === 'standalone'
        ? '<div class="nppAcctStandaloneFoot"><a class="nppLogout" href="https://www.neopets.com/logout.phtml">' + LOGOUT_ICON + '<span>Log Out</span></a><a class="nppSwap" href="' + SWAP_URL + '" target="_blank" rel="noopener">' + USERS_ICON + '<span>Swap</span></a></div>'
        : '');
    document.body.appendChild(drawer);
    return drawer;
  }

  function wireDrawer(drawer) {
    const q = (sel) => $(sel, drawer);
    const input = q('input'), hint = q('.nppAcctHint');
    const listNp = q('[data-list="np"]'), listEx = q('[data-list="ex"]'), noteNp = q('[data-note="np"]'), secEx = q('[data-sec="ex"]'), addBtn = q('.nppAcctAddBtn'), addForm = q('.nppAcctAdd'), msgNp = q('[data-msg="np"]'), msgEx = q('[data-msg="ex"]');
    const card = $('#npUser');

    acctTabRefresh = () => { if (tabEl) tabEl.classList.toggle('attn', !mainAcct() && allAccts().length > 1); };

    const render = () => {
      noteAccount(curUser()); seenAccounts().forEach(noteAccount);
      const me = curUser().toLowerCase(), main = mainAcct().toLowerCase();
      const autoSet = new Set(autoAccts().map(n => n.toLowerCase()));
      const all = allAccts(), npNames = readNP().filter(n => all.some(x => x.toLowerCase() === n.toLowerCase()));
      const npSet = new Set(npNames.map(n => n.toLowerCase()));
      const extra = all.filter(n => !npSet.has(n.toLowerCase()));
      const row = (n) => {
        const mine = n.toLowerCase() === me, isMain = n.toLowerCase() === main, removable = !mine;
        const pr = readProf(n), av = pr && pr.avatar ? pr.avatar.replace(/["'\\\n\r()]/g, '') : '';
        const sub = mine ? (isMain ? 'You · Main account' : 'You') : (isMain ? 'Main account' : 'View profile');
        return `<div class="nppAcctRow${mine ? ' me' : ''}${isMain ? ' main' : ''}"><a class="nppAcctLink" href="https://www.neopets.com/userlookup.phtml?user=${encodeURIComponent(n)}" target="_blank" rel="noopener" title="View ${esc(n)}'s profile"><span class="nppAcctAv"${av ? ` style="background-image:url('${esc(av)}')"` : ''}>${av ? '' : esc(n.charAt(0).toUpperCase())}</span><span class="nppAcctTxt"><b>${esc(n)}</b><small>${esc(sub)}</small></span></a>${removable ? `<button type="button" class="nppAcctX" data-n="${esc(n)}" title="Remove from this computer" aria-label="Remove ${esc(n)}">×</button>` : ''}<button type="button" class="nppAcctStar" data-n="${esc(n)}" title="${isMain ? 'Main account (click to unset)' : 'Make this my main account'}" aria-label="${isMain ? 'Unset main account' : 'Make main account'}">${isMain ? '★' : '☆'}</button></div>`;
      };
      q('.nppCntNp').textContent = npNames.length || '';
      q('.nppCntEx').textContent = extra.length || '';
      hint.textContent = (!main && all.length > 1) ? 'Sync from NeoPass to find your main account, or pick it with the ☆.' : '';
      listNp.innerHTML = npNames.map(row).join('');
      listEx.innerHTML = extra.map(row).join('');
      const synced = !!LSget('npp_neopass_ts');
      noteNp.textContent = npNames.length === 0
        ? (synced ? 'Press “Sync from NeoPass” again to fill this list.' : 'Not synced yet. Use “Sync from NeoPass” to list every account connected to your NeoPass.')
        : (npNames.length === 1 && synced) ? 'This is the only account connected to your NeoPass.' : '';
      secEx.hidden = extra.length === 0;
      acctTabRefresh();
    };

    const closeAdd = () => { addForm.hidden = true; addBtn.hidden = false; input.value = ''; };
    addBtn.addEventListener('click', () => { addBtn.hidden = true; addForm.hidden = false; msgEx.textContent = ''; input.focus(); });
    $('.nppAcctAddCancel', drawer).addEventListener('click', () => { closeAdd(); msgEx.textContent = ''; });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeAdd(); } });

    let autoErr = '';
    const place = () => {
      if (MODE === 'standalone') { drawer.style.left = 'auto'; drawer.style.right = '20px'; drawer.style.top = 'auto'; drawer.style.bottom = '76px'; drawer.style.width = '280px'; drawer.style.height = 'min(500px, calc(100vh - 120px))'; return; }
      if (!card) return;
      const r = card.getBoundingClientRect();
      drawer.style.left = ''; drawer.style.right = ''; drawer.style.bottom = ''; drawer.style.width = ''; drawer.style.height = '';
      drawer.style.top = Math.max(64, r.top) + 'px';
    };
    const setOpen = (o) => {
      open = !!o;
      if (open) { closeAllPets(); document.dispatchEvent(new CustomEvent('npp:drawer', { detail: 'accts' })); closeAdd(); try { const cn = drawer.querySelector('.nppAcctCount'); if (cn) cn.textContent = allAccts().length; } catch (er) {} render(); place(); msgNp.textContent = autoErr; msgEx.textContent = ''; }
      drawer.classList.toggle('open', open);
      if (tabEl) tabEl.classList.toggle('on', open);
    };

    drawerSetOpen = setOpen;
    drawer.querySelector('.nppAcctClose').addEventListener('click', () => setOpen(false));
    tabEl.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); });
    document.addEventListener('pointerdown', (e) => { if (open && !e.target.closest('#nppAcctDrawer, #nppAcctTab, #nppListsMod, #nppStandaloneAcctToggle')) setOpen(false); }, true);
    document.addEventListener('keydown', (e) => { if (open && e.key === 'Escape') setOpen(false); });
    document.addEventListener('npp:drawer', (e) => { if (open && e.detail !== 'accts') setOpen(false); });
    window.addEventListener('resize', () => { if (open) place(); });

    if (MODE === 'modern') {
      const swapLink = q('.nppAcctSwap');
      if (swapLink) swapLink.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        swapAccount(() => { swapLink.lastElementChild.textContent = 'Swapping…'; swapLink.classList.add('busy'); }, () => { swapLink.lastElementChild.textContent = 'Swap'; swapLink.classList.remove('busy'); });
      });
    } else {
      const swapLink = q('.nppAcctStandaloneFoot a.nppSwap');
      if (swapLink) swapLink.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        swapAccount(() => { swapLink.classList.add('busy'); }, () => { swapLink.classList.remove('busy'); });
      });
    }

    const syncBtn = q('.nppAcctSync:not(.nppAcctAllPets)');
    syncBtn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      if (syncBtn.disabled) return;
      syncBtn.disabled = true; syncBtn.classList.add('busy'); syncBtn.textContent = 'Syncing…';
      try {
        const { list, main } = await syncNeoPass();
        render(); document.dispatchEvent(new CustomEvent('npp:main'));
        msgNp.textContent = `Synced ${list.length} account${list.length === 1 ? '' : 's'}${main ? ' · main: ' + main.name : ''}.`;
      } catch (err) { msgNp.textContent = 'Couldn’t sync: ' + (err && err.message || 'error'); }
      finally { syncBtn.disabled = false; syncBtn.classList.remove('busy'); syncBtn.textContent = 'Sync from NeoPass'; }
    });

    drawer.addEventListener('click', (e) => {
      const st = e.target.closest('.nppAcctStar');
      if (st) {
        const n = st.dataset.n;
        LSset(MAIN_KEY, mainAcct().toLowerCase() === n.toLowerCase() ? '' : n);
        render(); document.dispatchEvent(new CustomEvent('npp:main'));
        return;
      }
      const x = e.target.closest('.nppAcctX');
      if (!x || !x.dataset.n) return;
      const nm = x.dataset.n;
      if (nm.toLowerCase() === curUser().toLowerCase()) return;
      if (!confirm('Remove ' + nm + ' from this computer? Their saved pets will be deleted too.')) return;
      removeAccount(nm);
      render();
    });

    q('.nppAcctAdd').addEventListener('submit', (e) => {
      e.preventDefault();
      const names = input.value.split(/[\s,;]+/).filter(Boolean);
      if (!names.length) return;
      const bad = names.filter(n => !validName(n));
      let added = 0;
      names.forEach(n => {
        if (!validName(n) || allAccts().some(x => x.toLowerCase() === n.toLowerCase())) return;
        const m = readManual(); m.push(n); writeManual(m); added++;
      });
      input.value = bad.join(' ');
      msgEx.textContent = bad.length ? 'Names use letters, numbers and _ (3–20 characters): ' + bad.join(', ') : (added ? `Added ${added}.` : 'Already in the list.');
      if (added && !bad.length) closeAdd();
      render();
    });

    // First-time auto-sync: once per day if nothing has been saved yet.
    const AUTO_KEY = 'npp_np_auto_ts';
    if (!readNP().length && Date.now() - (parseInt(LSget(AUTO_KEY), 10) || 0) > 24 * 3600e3) {
      LSset(AUTO_KEY, String(Date.now()));
      syncNeoPass()
        .then(() => { autoErr = ''; render(); document.dispatchEvent(new CustomEvent('npp:main')); if (open) msgNp.textContent = ''; })
        .catch(() => { autoErr = 'Couldn’t sync automatically. Sign in to NeoPass in this browser, then press Sync.'; if (open) msgNp.textContent = autoErr; });
    }

    acctTabRefresh();
    render();
    return { setOpen, render };
  }

  /* ───────────────────────────────── sidebar lists widget ───────────────────────────────── */
  function mountLists(card) {
    const hud = document.getElementById('npHud');
    if (!hud || $('#nppListsMod') || !card || card.parentNode !== hud) return;
    const mod = document.createElement('div');
    mod.id = 'nppListsMod';
    const tile = (cls, label, icon) => '<button type="button" class="nppLt ' + cls + '" aria-label="' + label + '">' + icon + '<b>' + label + '</b></button>';
    mod.innerHTML =
      tile('nppLtAcct', 'Accounts', '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="5.5" r="2.5"/><path d="M1.5 13c.3-2.4 2.2-3.8 4.5-3.8s4.2 1.4 4.5 3.8M10.8 3.4a2.3 2.3 0 0 1 0 4.2M12.5 9.6c1.2.5 2 1.6 2.2 3.1"/></svg>') +
      tile('nppLtPets', 'All Pets', '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="4" cy="6.5" r="1.6"/><circle cx="7" cy="3.8" r="1.6"/><circle cx="10.5" cy="3.8" r="1.6"/><circle cx="13" cy="6.5" r="1.6"/><path d="M8.7 7.6c2 0 4 2 4 3.9 0 1.4-1.2 2-2.2 2-.9 0-1.3-.5-1.8-.5s-.9.5-1.8.5c-1 0-2.2-.6-2.2-2 0-1.9 2-3.9 4-3.9z"/></svg>');
    card.after(mod);
    const upd = () => {
      const nmEl = $('#npUserTitle'); if (nmEl) nmEl.title = nmEl.textContent.trim();
      const uc = $('#npUser'); if (uc) uc.dataset.main = (mainAcct() && mainAcct().toLowerCase() === curUser().toLowerCase()) ? '1' : '0';
    };
    upd(); setInterval(upd, 3000);
    mod.querySelector('.nppLtAcct').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (apEl && apEl.classList.contains('open')) closeAllPets(); if (drawerSetOpen) drawerSetOpen(!open); else if (tabEl) tabEl.click(); });
    mod.querySelector('.nppLtPets').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openAllPets(); });
  }

  /* ───────────────────────────────── mounts ───────────────────────────────── */
  function mountModern() {
    const card = $('#npUser');
    if (!card || $('#nppAcctTab')) return;
    const side = card.querySelector('.rightSide');
    if (!side) return;

    if (LSget('npp_accts_v2') !== '1') {
      const seen = new Set([curUser(), ...seenAccounts()].map(x => x.toLowerCase()));
      const old = readAccts();
      writeManual(old.filter(n => !seen.has(n.toLowerCase())));
      writeAccts(old.filter(n => seen.has(n.toLowerCase())));
      LSset('npp_accts_v2', '1');
    }

    // Add the tab button to the user card.
    const tab = document.createElement('button');
    tab.id = 'nppAcctTab'; tab.type = 'button'; tab.title = 'Your accounts'; tab.setAttribute('aria-label', 'Your accounts');
    tab.innerHTML = USERS_ICON;
    card.appendChild(tab);
    tabEl = tab;

    // Add the avatar (if not already there from the core).
    if (!$('#nppAvatar')) {
      const av = document.createElement('a');
      av.id = 'nppAvatar'; av.href = 'https://www.neopets.com/settings/neoboards'; av.title = 'Neoboard settings';
      av.innerHTML = '<span class="nppAvInit"></span>';
      side.prepend(av);
    }

    // Log Out / Swap pill (if not already there from the core).
    if (!$('#npLogoutBtn')) {
      const wrap = document.createElement('div');
      wrap.id = 'nppAcctBtns';
      const lo = document.createElement('a');
      lo.id = 'npLogoutBtn'; lo.href = 'https://www.neopets.com/logout.phtml'; lo.innerHTML = LOGOUT_ICON + '<span>Log Out</span>';
      const sw = document.createElement('a');
      sw.id = 'npSwapBtn'; sw.href = SWAP_URL; sw.target = '_blank'; sw.rel = 'noopener'; sw.title = 'Swap account: log out and go straight to the login page';
      sw.innerHTML = USERS_ICON + '<span>Swap</span>';
      sw.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        swapAccount(() => { sw.lastElementChild.textContent = 'Swapping…'; sw.classList.add('busy'); }, () => { sw.lastElementChild.textContent = 'Swap'; sw.classList.remove('busy'); });
      });
      wrap.append(lo, sw);
      lo.setAttribute('aria-label', 'Log out'); lo.title = 'Log out'; sw.setAttribute('aria-label', 'Swap account');
      side.appendChild(wrap);
    }

    drawerEl = buildDrawer();
    wireDrawer(drawerEl);
    mountLists(card);

    // Avatar updater — reads the cached profile image, and refreshes it occasionally.
    updateAvatar();
    setInterval(updateAvatar, 1500);

    // Also react to the core reporting an account change.
    document.addEventListener('npp:main', () => updateAvatar());

    // Refresh the tab attention dot if the drawer's data changes.
    return true;
  }

  function mountStandalone() {
    if (document.getElementById('nppStandaloneAcct')) return;
    if (!document.body) return;

    // The drawer is the same component; build it now that we have a body.
    drawerEl = buildDrawer();
    const api = wireDrawer(drawerEl);

    // A floating "Accounts" button bottom-right. Above the dailies button if it's there.
    const wrap = document.createElement('div');
    wrap.id = 'nppStandaloneAcct';
    if (document.getElementById('nppDailiesRoot')) wrap.classList.add('aboveDailies');
    wrap.innerHTML = '<button type="button" id="nppStandaloneAcctToggle" title="Your accounts">' + USERS_ICON + '<span>Accounts</span></button>';
    document.body.appendChild(wrap);
    const toggle = wrap.querySelector('#nppStandaloneAcctToggle');
    toggle.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); api.setOpen(true); });

    // Tab button is used only for the drawer's internal open/close logic in modern mode.
    // For standalone mode, we spoof a tabEl so the drawer's setOpen works.
    tabEl = toggle;

    // React to the dailies button appearing later.
    watchDoc(() => {
      wrap.classList.toggle('aboveDailies', !!document.getElementById('nppDailiesRoot'));
    });

    setInterval(() => { try { api.render(); } catch {} }, 4000);   // (in case the account list changes elsewhere)
  }

  function updateAvatar() {
    const av = $('#nppAvatar');
    if (!av) return;
    const user = String(W.appInsightsUserName || LSget('npqol_hud_username') || '').trim();
    let url = '';
    const prof = user ? readProf(user) : null;
    if (prof && prof.avatar) url = prof.avatar;
    if (!url) {
      try {
        const el = document.getElementById('navPetMenuIcon__2020');
        const m = el && (getComputedStyle(el).backgroundImage || '').match(/url\(["']?([^"']+)["']?\)/);
        if (m) url = m[1];
      } catch {}
    }
    if (!url) {
      try { const lg = JSON.parse(LSget('npqol_active_pet_img_v1') || 'null'); if (lg && /\/cp\//.test(lg.url || '')) url = lg.url.replace(/\/9\.png/, '/1.png'); } catch {}
    }
    if (url.startsWith('//')) url = 'https:' + url;
    const init = av.querySelector('.nppAvInit');
    if (url) {
      if (av.dataset.u !== url) { av.dataset.u = url; av.style.backgroundImage = `url("${url.replace(/["\\\n\r]/g, '')}")`; if (init) init.textContent = ''; }
    } else if (init && !init.textContent) {
      init.textContent = (user || '?').charAt(0).toUpperCase();
    }
  }

  /* ───────────────────────────────── profile fetch (occasional, cached) ───────────────────────────────── */
  const ABS_URL = (src) => { try { return new URL(src, 'https://www.neopets.com/').href; } catch { return ''; } };
  function pickProfImgs(doc) {
    const srcs = [...doc.querySelectorAll('img')].map(i => i.getAttribute('src') || '');
    const find = (re) => { const x = srcs.find(v => re.test(v)); return x ? ABS_URL(x) : ''; };
    return { avatar: find(/\/neoboards\/avatars\//i) };
  }
  function profFromFrame(user) {
    return new Promise((resolve) => {
      const f = document.createElement('iframe');
      f.style.cssText = 'position:fixed;left:-9999px;top:0;width:900px;height:900px;border:0;visibility:hidden';
      let done = false;
      const finish = (v) => { if (done) return; done = true; try { f.remove(); } catch {} resolve(v); };
      f.onload = () => setTimeout(() => { try { finish(pickProfImgs(f.contentDocument)); } catch { finish({ avatar: '' }); } }, 1500);
      f.onerror = () => finish({ avatar: '' });
      setTimeout(() => finish({ avatar: '' }), 12000);
      f.src = '/userlookup.phtml?user=' + encodeURIComponent(user);
      document.documentElement.appendChild(f);
    });
  }
  function profDirtyDue() { try { const d = JSON.parse(LSget(DIRTY_KEY) || 'null'); return d && Date.now() - d.t >= 3000 ? d : null; } catch { return null; } }
  function markProfDirty(first) {
    try { if (JSON.parse(LSget(DIRTY_KEY) || 'null')) return; } catch {}
    LSset(DIRTY_KEY, JSON.stringify({ t: Date.now() - (first ? 3000 : 0), n: first ? 2 : 0 }));
  }
  let profBusy = false;
  async function refreshProfile(user) {
    profBusy = true;
    const old = readProf(user) || { avatar: '' };
    try {
      let res = { avatar: '' };
      const r = await fetch('/userlookup.phtml?user=' + encodeURIComponent(user), { credentials: 'include', cache: 'no-store' });
      if (r.status === 403) { LSset('npqol_403_backoff_until_v1', String(Date.now() + 10 * 60 * 1000)); throw new Error('403'); }
      if (r.ok) res = pickProfImgs(new DOMParser().parseFromString(await r.text(), 'text/html'));
      if (!res.avatar && Date.now() - (parseInt(LSget('npp_prof_frame_ts'), 10) || 0) > 24 * 3600e3) { LSset('npp_prof_frame_ts', String(Date.now())); res = await profFromFrame(user); }
      LSset(PROF_KEY(user), JSON.stringify({ avatar: res.avatar || old.avatar, ts: Date.now() }));
    } catch {
      LSset(PROF_KEY(user), JSON.stringify({ avatar: old.avatar, ts: Date.now() }));
    } finally { profBusy = false; }
  }
  function maybeRefreshProfile() {
    const user = String(W.appInsightsUserName || LSget('npqol_hud_username') || '').trim();
    if (!user || profBusy || document.visibilityState !== 'visible') return;
    if (Date.now() < (parseInt(LSget('npqol_403_backoff_until_v1'), 10) || 0)) return;
    const prof = readProf(user);
    const age = prof ? Date.now() - (prof.ts || 0) : Infinity;
    const dirty = profDirtyDue();
    if (age > (prof && prof.avatar ? 24 * 3600e3 : 6 * 3600e3) || dirty) {
      if (dirty) { if (dirty.n >= 2) LSdel(DIRTY_KEY); else LSset(DIRTY_KEY, JSON.stringify({ t: Date.now(), n: dirty.n + 1 })); }
      refreshProfile(user);
    }
  }
  function watchSettingsForAvatar() {
    if (!path.startsWith('/settings')) return;
    markProfDirty(true);
    document.addEventListener('submit', () => markProfDirty(false), true);
    document.addEventListener('click', (e) => {
      const el = e.target.closest && e.target.closest('button, input[type="submit"], input[type="button"], a, label, img');
      if (!el) return;
      const txt = String(el.value || el.textContent || el.alt || el.title || '').toLowerCase();
      if (/save|update|change|select|choose|confirm|apply|submit|avatar/.test(txt) || (el.matches && el.matches('img[src*="/neoboards/avatars/"]'))) markProfDirty(false);
    }, true);
  }
  watchSettingsForAvatar();
  setInterval(maybeRefreshProfile, 30000);        // cheap check every 30s
  setTimeout(maybeRefreshProfile, 3000);

  /* ───────────────────────────────── boot ───────────────────────────────── */
  function mount() {
    detectMode();
    if (MODE === 'modern') mountModern();
    else mountStandalone();
  }
  // One shared whole-document observer for the idempotent mount/check callbacks below (rAF-throttled).
  const docFns = []; let docRaf = 0; let docMo = null;
  function watchDoc(fn) {
    docFns.push(fn);
    if (docMo) return;
    docMo = new MutationObserver(() => { if (docRaf) return; docRaf = requestAnimationFrame(() => { docRaf = 0; docFns.slice().forEach(f => f()); }); });
    docMo.observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();

  // If the main script arrives later (e.g. on a client-side navigation), re-mount in modern mode.
  watchDoc(() => {
    if ($('#nppAcctTab') || !document.getElementById('npUser')) return;
    const floating = document.getElementById('nppStandaloneAcct');
    const oldDrawer = floating ? drawerEl : null;
    MODE = 'modern';
    if (!mountModern()) return;
    if (oldDrawer) oldDrawer.remove();
    if (floating) floating.remove();
  });
})();

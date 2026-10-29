// ==UserScript==
// @name         Neopets - Accounts Drawer
// @namespace    neopets-qol-patcher
// @version      1.3.29
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
  const MAIN_KEY = 'nq_main_account';
  const ACCTS_KEY = 'nq_accounts';
  const MAN_KEY = 'nq_accounts_manual';
  const NP_KEY = 'nq_neopass_accts';
  const PROF_KEY = (u) => 'nq_prof_v1:' + u;
  const DIRTY_KEY = 'nq_prof_dirty';

  const validName = (n) => /^[A-Za-z0-9_]{3,20}$/.test(n);
  const curUser = () => String(W.appInsightsUserName || LSget('nq_hud_username') || '').trim();
  const mainAcct = () => LSget(MAIN_KEY);

  /* ───────────────────────────────── CSS ───────────────────────────────── */
  // The panel CSS is duplicated here so the drawer looks right without the core.
  // When the core is installed, its copies of the same selectors win (loaded earlier,
  // higher specificity from the html[data-nq-modern-interface] scope); this block
  // exists purely so standalone mode gets the same visual.
  const ACCT_CSS = `
#nqAcctTab { position: absolute; top: 8px; right: 8px; z-index: 3; width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.28); border-radius: 50%; background: rgba(255,255,255,.14); color: #fff; cursor: pointer; transition: background .15s, transform .15s, color .15s; }
#nqAcctTab svg { width: 14px; height: 14px; display: block; }
#nqAcctTab:hover, #nqAcctTab.on { background: var(--nq-accent, #ff8a1f); color: var(--nq-accent-fg, #1a1330); border-color: transparent; }
#nqAcctTab.on { transform: scale(1.06); }
#nqAcctTab.attn::after { content: ""; position: absolute; top: -3px; right: -3px; width: 9px; height: 9px; border-radius: 50%; background: #2fd873; box-shadow: 0 0 0 2px rgba(255,255,255,.92), 0 1px 3px rgba(0,0,0,.35); }
#nqAcctDrawer { position: fixed; left: 244px; top: 70px; z-index: 1002; box-sizing: border-box; width: 252px; height: min(500px, calc(100vh - 100px)); display: flex; flex-direction: column; padding: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,.14); border-radius: 14px; background: #3a3350; color: #fff; opacity: 0; transform: translateX(-18px) scale(.97); transform-origin: left top; pointer-events: none; transition: opacity .22s ease, transform .32s cubic-bezier(.22, 1, .36, 1); }
#nqAcctDrawer.open { opacity: 1; transform: none; pointer-events: auto; }
#nqAcctDrawer .nqAcctHead { display: flex; align-items: center; justify-content: space-between; padding: 0 4px 10px; }
#nqAcctDrawer .nqAcctHeadL { display: flex; align-items: center; gap: 8px; min-width: 0; }
#nqAcctDrawer .nqAcctTitle { font: 400 21px/1 'CafeteriaBlack', Georgia, serif; }
#nqAcctDrawer .nqAcctSwap { flex: none; display: flex; align-items: center; justify-content: center; gap: 6px; height: 26px; padding: 0 13px; border-radius: 999px; background: linear-gradient(180deg, #52525e 0%, #3b3b46 50%, #2b2b34 100%); color: #fff !important; text-decoration: none !important; transition: filter .15s, transform .15s; }
#nqAcctDrawer .nqAcctSwap svg { width: 13px; height: 13px; flex: none; }
#nqAcctDrawer .nqAcctSwap span { font: 400 14px/1 'CafeteriaBlack', Georgia, serif; letter-spacing: .02em; }
#nqAcctDrawer .nqAcctSwap:hover { filter: brightness(1.18); transform: translateY(-1px); }
#nqAcctDrawer .nqAcctSwap.busy { opacity: .75; pointer-events: none; }
#nqAcctDrawer .nqAcctHint { margin: 0 2px 10px; padding: 8px 10px; border: 1px solid rgba(255,209,102,.35); border-radius: 10px; background: rgba(255,209,102,.13); color: #ffe7a8; font: 500 11.5px/1.35 'Outfit', system-ui, sans-serif; }
#nqAcctDrawer .nqAcctHint:empty { display: none; }
#nqAcctDrawer .nqAcctBody { flex: 1 1 auto; min-height: 0; padding-right: 6px; overflow-x: hidden; overflow-y: scroll; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.42) rgba(255,255,255,.07); }
#nqAcctDrawer .nqAcctSec + .nqAcctSec { margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.12); }
#nqAcctDrawer .nqAcctSecHead { display: flex; align-items: center; gap: 8px; padding: 0 4px 6px; }
#nqAcctDrawer .nqAcctSecHead span { font: 700 11px/1 'Outfit', system-ui, sans-serif; letter-spacing: .09em; text-transform: uppercase; color: rgba(255,255,255,.78); }
#nqAcctDrawer .nqAcctSecHead em { padding: 1px 7px; border-radius: 999px; background: rgba(255,255,255,.12); font: normal 700 10px/1.4 'Outfit', system-ui, sans-serif; }
#nqAcctDrawer .nqAcctSecHead em:empty { display: none; }
#nqAcctDrawer .nqAcctList { display: flex; flex-direction: column; gap: 4px; }
#nqAcctDrawer .nqAcctRow { display: flex; align-items: center; gap: 2px; padding: 3px 0 3px 3px; border-radius: 14px; transition: background .18s; }
#nqAcctDrawer .nqAcctRow:hover { background: rgba(255,255,255,.06); }
#nqAcctDrawer .nqAcctRow.me { box-shadow: inset 0 0 0 1px var(--nq-accent-line, rgba(255,255,255,.35)); }
#nqAcctDrawer .nqAcctLink { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 3px 4px; border-radius: 12px; color: #fff !important; text-decoration: none !important; }
#nqAcctDrawer .nqAcctAv { flex: none; width: 34px; height: 34px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,.55); border-radius: 50%; background: rgba(255,255,255,.16) center / cover no-repeat; font: normal 400 16px/1 'CafeteriaBlack', Georgia, serif; }
#nqAcctDrawer .nqAcctTxt { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 1px; text-align: left; }
#nqAcctDrawer .nqAcctTxt b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 600 14px/1.2 'Outfit', system-ui, sans-serif; }
#nqAcctDrawer .nqAcctTxt small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 500 11px/1.2 'Outfit', system-ui, sans-serif; color: rgba(255,255,255,.68); }
#nqAcctDrawer .nqAcctStar { flex: none; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: rgba(255,255,255,.55); font-size: 17px; line-height: 1; cursor: pointer; transition: color .15s, background .15s; }
#nqAcctDrawer .nqAcctStar:hover { color: #ffd166; background: rgba(255,255,255,.1); }
#nqAcctDrawer .nqAcctRow.main .nqAcctStar { color: #ffd166; }
#nqAcctDrawer .nqAcctX { flex: none; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; background: rgba(0,0,0,.3); color: rgba(255,255,255,.85); font-size: 15px; line-height: 1; cursor: pointer; opacity: 0; transition: opacity .15s, background .15s; }
#nqAcctDrawer .nqAcctRow:hover .nqAcctX { opacity: 1; }
#nqAcctDrawer .nqAcctX:hover { background: #e0535f; color: #fff; }
#nqAcctDrawer .nqAcctNote { margin-top: 8px; padding: 8px 10px; border: 1px solid rgba(255,255,255,.18); border-radius: 10px; background: rgba(255,255,255,.07); color: rgba(255,255,255,.8); font: 500 11.5px/1.4 'Outfit', system-ui, sans-serif; }
#nqAcctDrawer .nqAcctNote:empty { display: none; }
#nqAcctDrawer .nqAcctSync { display: block; width: 100%; margin-top: 8px; height: 32px; border: 1px solid rgba(255,255,255,.3); border-radius: 999px; background: rgba(255,255,255,.1); color: #fff; font: 600 12.5px 'Outfit', system-ui, sans-serif; cursor: pointer; transition: background .15s, color .15s, border-color .15s; }
#nqAcctDrawer .nqAcctSync:hover:not(:disabled) { background: var(--nq-accent, #ff8a1f); color: var(--nq-accent-fg, #1a1330); border-color: transparent; }
#nqAcctDrawer .nqAcctSync.busy { opacity: .7; cursor: progress; }
#nqAcctDrawer .nqAcctSec[hidden], #nqAcctDrawer .nqAcctAdd[hidden], #nqAcctDrawer .nqAcctAddBtn[hidden] { display: none !important; }
#nqAcctDrawer .nqAcctAddWrap { margin-top: 10px; }
#nqAcctDrawer .nqAcctAddBtn { height: 26px; padding: 0 12px; border: 1px dashed rgba(255,255,255,.34); border-radius: 999px; background: transparent; color: rgba(255,255,255,.85); font: 600 12px 'Outfit', system-ui, sans-serif; cursor: pointer; transition: background .15s, border-color .15s, color .15s; }
#nqAcctDrawer .nqAcctAddBtn:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.6); color: #fff; }
#nqAcctDrawer .nqAcctAdd { display: flex; align-items: center; gap: 5px; }
#nqAcctDrawer .nqAcctAdd input { flex: 1; min-width: 0; height: 28px; padding: 0 12px; border: 1px solid rgba(255,255,255,.28); border-radius: 999px; background: rgba(255,255,255,.1); color: #fff; font: 500 12.5px 'Outfit', system-ui, sans-serif; outline: 0; }
#nqAcctDrawer .nqAcctAdd input::placeholder { color: rgba(255,255,255,.6); }
#nqAcctDrawer .nqAcctAdd input:focus { border-color: var(--nq-accent, #ff8a1f); background: rgba(255,255,255,.16); }
#nqAcctDrawer .nqAcctAddOk { flex: none; height: 28px; padding: 0 12px; border: 0; border-radius: 999px; background: var(--nq-accent, #ff8a1f); color: var(--nq-accent-fg, #1a1330); font: 700 12px 'Outfit', system-ui, sans-serif; cursor: pointer; }
#nqAcctDrawer .nqAcctAddOk:hover { filter: brightness(1.07); }
#nqAcctDrawer .nqAcctAddCancel { flex: none; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 50%; background: rgba(255,255,255,.12); color: rgba(255,255,255,.85); font-size: 15px; line-height: 1; cursor: pointer; transition: background .15s; }
#nqAcctDrawer .nqAcctAddCancel:hover { background: rgba(255,255,255,.24); }
#nqAcctDrawer .nqAcctMsg { text-align: center; padding: 6px 6px 0; font: 500 11px/1.35 'Outfit', system-ui, sans-serif; color: rgba(255,255,255,.7); }
#nqAcctDrawer .nqAcctMsg:empty { display: none; }
#nqAcctDrawer .nqAcctStandaloneFoot { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.12); }
#nqAcctDrawer .nqAcctStandaloneFoot a { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; height: 26px; padding: 0 12px; border-radius: 999px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.28); color: #fff !important; text-decoration: none !important; font: 400 14px/1 'CafeteriaBlack', Georgia, serif; }
#nqAcctDrawer .nqAcctStandaloneFoot a:hover { background: rgba(255,255,255,.18); }
#nqAcctDrawer .nqAcctStandaloneFoot a.nqLogout { background: var(--nq-accent, #ff8a1f); color: #fff !important; text-shadow: 0 1px 2px rgba(0,0,0,.35); border-color: transparent; }
#nqAcctDrawer .nqAcctStandaloneFoot a.nqLogout:hover { filter: brightness(1.07); }
#nqAcctDrawer .nqAcctStandaloneFoot svg { width: 13px; height: 13px; flex: none; }
/* restyle: match All Pets overlay */
#nqAcctDrawer { --ap-bg: #fbf7ee; --ap-line: #e6dcf5; --ap-text: #392d5c; --ap-mute: #6c6290; --ap-acc: #7c5cf0; --ap-soft: #efe8ff; z-index: 2147482000; padding: 0; border: 3px solid #fff; border-radius: 24px; background: var(--ap-bg); color: var(--ap-text); font-family: 'Outfit', system-ui, sans-serif; box-shadow: 0 24px 70px rgba(70,52,110,.35); transform: scale(.97) translateY(8px); transform-origin: left top; transition: opacity .2s ease, transform .22s cubic-bezier(.2,.8,.2,1); }
#nqAcctDrawer.open { transform: none; }
#nqAcctDrawer :focus-visible { outline: 3px solid #5b8def; outline-offset: 2px; }
#nqAcctDrawer .nqAcctHead { padding: 14px 14px 10px 18px; background: linear-gradient(180deg, #f3ecff 0%, #fbf7ee 100%); border-bottom: 1px solid var(--ap-line); }
#nqAcctDrawer .nqAcctTitle { font: 800 22px/30px 'Outfit', system-ui, sans-serif; letter-spacing: -.02em; color: var(--ap-text); }
#nqAcctDrawer .nqAcctCount { font-size: 13px; font-weight: 500; color: var(--ap-mute); }
#nqAcctDrawer .nqAcctHeadR { display: flex; align-items: center; gap: 6px; }
#nqAcctDrawer .nqAcctHeadL { align-items: baseline; }
#nqAcctDrawer .nqAcctSwap { height: 34px; padding: 0 14px; background: #fff; border: 1px solid var(--ap-line); color: var(--ap-text) !important; box-shadow: none; }
#nqAcctDrawer .nqAcctSwap span { font: 700 13px/20px 'Outfit', system-ui, sans-serif; letter-spacing: 0; }
#nqAcctDrawer .nqAcctSwap:hover { filter: none; transform: none; background: var(--ap-soft); border-color: #cbbaf2; box-shadow: 0 2px 8px rgba(124,92,240,.18); }
#nqAcctDrawer .nqAcctClose { flex: none; width: 34px; height: 34px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--ap-line); border-radius: 999px; background: #fff; color: var(--ap-text); font: 700 20px/1 'Outfit', system-ui, sans-serif; cursor: pointer; transition: background .15s, border-color .15s, box-shadow .15s; }
#nqAcctDrawer .nqAcctClose:hover { background: var(--ap-soft); border-color: #cbbaf2; box-shadow: 0 2px 8px rgba(124,92,240,.18); }
#nqAcctDrawer .nqAcctHint { margin: 10px 12px 0; border-color: #f0d28a; background: #fff4d6; color: #7a5200; }
#nqAcctDrawer .nqAcctBody { padding: 10px 6px 12px 12px; scrollbar-color: #cbbaf2 transparent; }
#nqAcctDrawer .nqAcctSec + .nqAcctSec { border-top-color: var(--ap-line); }
#nqAcctDrawer .nqAcctSecHead span { color: var(--ap-mute); }
#nqAcctDrawer .nqAcctSecHead em { background: var(--ap-soft); color: var(--ap-acc); }
#nqAcctDrawer .nqAcctRow:hover { background: var(--ap-soft); }
#nqAcctDrawer .nqAcctRow.me { box-shadow: inset 0 0 0 1px #cbbaf2; background: #fff; }
#nqAcctDrawer .nqAcctLink { color: var(--ap-text) !important; }
#nqAcctDrawer .nqAcctAv { border-color: #fff; background-color: var(--ap-soft); color: var(--ap-text); box-shadow: 0 0 0 1px var(--ap-line); }
#nqAcctDrawer .nqAcctTxt small { color: var(--ap-mute); }
#nqAcctDrawer .nqAcctStar { color: #c9c2dc; }
#nqAcctDrawer .nqAcctStar:hover, #nqAcctDrawer .nqAcctRow.main .nqAcctStar { color: #f5a623; background: #fff; }
#nqAcctDrawer .nqAcctX { background: #fff; border: 1px solid var(--ap-line); color: var(--ap-mute); }
#nqAcctDrawer .nqAcctRow:focus-within .nqAcctX { opacity: 1; }
#nqAcctDrawer .nqAcctNote { border-color: var(--ap-line); background: var(--ap-soft); color: var(--ap-mute); }
#nqAcctDrawer .nqAcctSync, #nqAcctDrawer .nqAcctStandaloneFoot a { border: 1px solid var(--ap-line); background: #fff; color: var(--ap-text) !important; font-weight: 700; }
#nqAcctDrawer .nqAcctSync:hover:not(:disabled), #nqAcctDrawer .nqAcctStandaloneFoot a:hover { background: var(--ap-soft); border-color: #cbbaf2; color: var(--ap-text); box-shadow: 0 2px 8px rgba(124,92,240,.18); }
#nqAcctDrawer .nqAcctStandaloneFoot { border-top-color: var(--ap-line); }
#nqAcctDrawer .nqAcctAddBtn { border-color: #cbbaf2; color: var(--ap-mute); }
#nqAcctDrawer .nqAcctAddBtn:hover { background: #fff; border-color: var(--ap-acc); color: var(--ap-text); }
#nqAcctDrawer .nqAcctAdd input { border-color: var(--ap-line); background: #fff; color: var(--ap-text); }
#nqAcctDrawer .nqAcctAdd input::placeholder { color: var(--ap-mute); opacity: .8; }
#nqAcctDrawer .nqAcctAdd input:focus { border-color: var(--ap-acc); background: #fff; }
#nqAcctDrawer .nqAcctAddOk, #nqAcctDrawer .nqAcctStandaloneFoot a.nqLogout { background: var(--ap-acc); color: #fff !important; text-shadow: none; }
#nqAcctDrawer .nqAcctAddCancel { background: #fff; border: 1px solid var(--ap-line); color: var(--ap-mute); }
#nqAcctDrawer .nqAcctAddCancel:hover { background: var(--ap-soft); }
#nqAcctDrawer .nqAcctMsg { color: var(--ap-mute); }
@media (prefers-reduced-motion: reduce) { #nqAcctDrawer, #nqAcctDrawer.open { transition: none; transform: none; } }

#nqStandaloneAcct { position: fixed; right: 20px; bottom: 20px; z-index: 2140; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; font: 500 13px 'Outfit', system-ui, sans-serif; }
#nqStandaloneAcct.aboveDailies { bottom: 74px; }
#nqStandaloneAcctToggle { display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(0,0,0,.16); background: #fff; color: #1f2937; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.18); }
#nqStandaloneAcctToggle:hover { background: #f3f4f6; }
#nqStandaloneAcctToggle svg { width: 18px; height: 18px; }

#nqAvatar { grid-column: 1; grid-row: 1 / span 2; position: relative; text-decoration: none !important; cursor: pointer; width: 48px; height: 48px; border-radius: 50%; background: center / cover no-repeat rgba(255,255,255,.14); border: 2px solid rgba(255,255,255,.55); box-shadow: 0 2px 8px rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; font: 400 24px/1 'CafeteriaBlack', Georgia, serif; color: #fff; transition: border-color .15s, transform .15s; }
#nqAvatar:hover { border-color: #fff; transform: scale(1.06); }
#nqAvatar .nqAvInit { pointer-events: none; }
#nqAcctBtns { grid-column: 1 / -1; grid-row: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px; }
#nqLogoutBtn, #nqSwapBtn { box-sizing: border-box; display: flex !important; align-items: center; justify-content: center; gap: 6px; width: 100%; height: 30px; padding: 0 8px !important; border: 1px solid var(--nq-card-line, rgba(255,255,255,.14)) !important; border-radius: 10px !important; font: 600 12px/1 'Outfit', system-ui, sans-serif !important; letter-spacing: 0; text-decoration: none !important; white-space: nowrap; cursor: pointer; transition: background .15s, border-color .15s, color .15s; }
#nqLogoutBtn svg, #nqSwapBtn svg { width: 13px; height: 13px; flex: none; }
#nqLogoutBtn span, #nqSwapBtn span { display: inline !important; font: inherit !important; letter-spacing: inherit; }
#nqLogoutBtn, #nqSwapBtn { background: rgba(255,255,255,.07) !important; color: rgba(255,255,255,.82) !important; text-shadow: none; box-shadow: none; }
#nqListsMod { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; font-family: 'Outfit', system-ui, sans-serif; }
#nqListsMod .nqLt { box-sizing: border-box; min-width: 0; display: grid; grid-template-columns: auto 1fr; column-gap: 7px; align-items: center; padding: 9px 10px; text-align: left; background: var(--nq-card, rgba(20,18,28,.42)); border: 1px solid var(--nq-card-line, rgba(255,255,255,.14)); border-radius: 14px; color: #fff; cursor: pointer; font: inherit; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); transition: border-color .15s, background .15s; }
#nqListsMod .nqLt:hover { border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.1); }
#nqListsMod .nqLt:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
#nqListsMod .nqLt svg { grid-row: 1 / span 2; width: 18px; height: 18px; }
#nqListsMod .nqLt b { font-weight: 700; font-size: 13px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#nqListsMod .nqLt em { font-style: normal; font-size: 11px; line-height: 1.2; color: rgba(255,255,255,.6); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-height: 820px) { #nqListsMod { gap: 6px; margin-bottom: 6px; } #nqListsMod .nqLt { padding: 6px 8px; } }
#nqAcctTab { display: none !important; }
#nqSwapBtn:hover { background: rgba(255,255,255,.16) !important; border-color: rgba(255,255,255,.3) !important; }
#nqLogoutBtn:hover { background: rgba(255,90,90,.18) !important; border-color: rgba(255,120,120,.5) !important; color: #ff8a8a !important; }
#nqLogoutBtn:focus-visible, #nqSwapBtn:focus-visible { outline: 2px solid #fff; outline-offset: 1px; }
#nqSwapBtn.busy svg { animation: nqSpinAcct .8s linear infinite; }
@keyframes nqSpinAcct { to { transform: rotate(360deg); } }
/* dark mode (follows sidebar toggle) */
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer { --ap-bg: #1d1a2b; --ap-panel: #272238; --ap-line: rgba(255,255,255,.12); --ap-text: #f1ecff; --ap-mute: rgba(241,236,255,.62); --ap-acc: #a58bff; --ap-soft: rgba(165,139,255,.16); border-color: rgba(255,255,255,.14); color-scheme: dark; box-shadow: 0 24px 70px rgba(0,0,0,.55); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctHead { background: linear-gradient(180deg, #2a2440 0%, #1d1a2b 100%); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctSwap, html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctClose, html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctX, html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctSync, html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctStandaloneFoot a, html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctAddCancel, html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctAdd input, html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctRow.me { background: var(--ap-panel); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctSwap:hover, html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctClose:hover, html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctSync:hover:not(:disabled), html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctStandaloneFoot a:hover { background: var(--ap-soft); border-color: rgba(165,139,255,.45); box-shadow: 0 2px 8px rgba(0,0,0,.35); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctAddCancel:hover { background: var(--ap-soft); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctAddBtn { border-color: rgba(165,139,255,.45); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctAddBtn:hover, html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctAdd input:focus { background: var(--ap-panel); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctRow.me { box-shadow: inset 0 0 0 1px rgba(165,139,255,.45); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctHint { background: rgba(255,209,102,.12); border-color: rgba(255,209,102,.3); color: #ffe2a0; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctBody { scrollbar-color: rgba(165,139,255,.45) transparent; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctAv { border-color: rgba(255,255,255,.14); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctStar { color: rgba(255,255,255,.28); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctStar:hover, html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctRow.main .nqAcctStar { background: var(--ap-panel); color: #f5a623; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctAdd input::placeholder { color: var(--ap-mute); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAcctDrawer .nqAcctAddOk { color: #1d1a2b !important; }
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'nq-acct-css';
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
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('nq_acct_')) out.push(k.slice(8)); } } catch {}
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
    LSset('nq_neopass_ts', String(Date.now()));
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
     Modern Interface patcher already stores (localStorage nq_qr_data) and from its pet dock (.qrPet),
     then cached per account in GM storage. Other accounts appear after you log in to them once. */
  const AP_KEY = 'nq_allpets_v1';
  const AP_TAGS = 'nq_allpets_tags_v1';
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
      const d = JSON.parse(LSget('nq_qr_data') || 'null');
      const data = d && d.data;
      if (data && data.active && data.active.name) activeName = String(data.active.name);
      const walk = (v, depth) => {
        if (!v || typeof v !== 'object' || depth > 3) return;
        if (Array.isArray(v)) { v.forEach(x => walk(x, depth + 1)); return; }
        // Quick Ref pets are { name, isActive, actions, species, colour, gender, level }.
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
    try { const pa = JSON.parse(LSget('nq_ap_newactive') || 'null'); if (pa && pa.u === me.toLowerCase() && Date.now() - pa.t < 10 * 60e3 && byName.has(String(pa.n).toLowerCase())) activeName = pa.n; } catch {}
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
  function apBlocked() { try { const a = JSON.parse(LSget('nq_ap_block_v1') || '[]'); return new Set(Array.isArray(a) ? a.map(x => String(x).toLowerCase()) : []); } catch { return new Set(); } }
  function apSetBlock(n, on) { const s = apBlocked(); on ? s.add(n.toLowerCase()) : s.delete(n.toLowerCase()); LSset('nq_ap_block_v1', JSON.stringify([...s])); }
  // Remove an account from this computer: drawer lists, NeoPass, seen/profile caches, main, its All Pets data and orphaned tags.
  function removeAccount(nm) {
    const low = nm.toLowerCase(), ne = (n) => String(n).toLowerCase() !== low;
    writeManual(readManual().filter(ne));
    writeAccts(readAccts().filter(ne));
    try { LSset(NP_KEY, JSON.stringify(readNP().filter(ne))); } catch {}
    seenAccounts().filter(n => !ne(n)).forEach(n => { try { localStorage.removeItem('nq_acct_' + n); localStorage.removeItem(PROF_KEY(n)); } catch {} });
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

  // Name colour per card: dark over a plain white background, white over art, dark until checked (mirrors the sidebar).
  const { read: toneRead, save: toneSave, probe: toneProbe } = NQ.tone;
  const apToneCache = new Map(), apInflight = new Map(), apQueue = [];
  let apToneIO = null, apActive = 0;
  function apPump() {
    while (apActive < 4 && apQueue.length) {
      const src = apQueue.shift(); apActive++;
      toneProbe(src, (dark, ok) => {
        apActive--; apToneCache.set(src, dark); if (ok) toneSave(src, dark);
        const ws = apInflight.get(src) || []; apInflight.delete(src);
        ws.forEach(c => { c.classList.toggle('apNameDark', dark); c.classList.remove('apTonePending'); });
        apPump();
      });
    }
  }
  function apTone(root) {
    const cards = [...root.querySelectorAll('.apCard')], stored = toneRead();
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
      cd.classList.add('apNameDark');
      if (apToneIO) apToneIO.observe(cd); else run(cd, src);
    });
  }

  const AP_CSS = `
#nqAP { --ap-bg: #fbf7ee; --ap-panel: #fffdf8; --ap-line: #e6dcf5; --ap-text: #392d5c; --ap-mute: #6c6290; --ap-acc: #7c5cf0; --ap-soft: #efe8ff; position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: stretch; justify-content: center; padding: 24px; background: rgba(70,52,110,.38); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); font-family: 'Outfit', system-ui, sans-serif; color: var(--ap-text); opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .2s ease, visibility 0s linear .2s; }
#nqAP.open { opacity: 1; visibility: visible; pointer-events: auto; transition: opacity .2s ease; }
#nqAP *, #nqAP *::before, #nqAP *::after { box-sizing: border-box; }
#nqAP .apWin { width: min(1240px, 100%); display: flex; flex-direction: column; min-height: 0; background: var(--ap-bg); border: 3px solid #fff; border-radius: 28px; box-shadow: 0 24px 70px rgba(70,52,110,.35); overflow: hidden; position: relative; transform: scale(.97) translateY(8px); transition: transform .22s cubic-bezier(.2,.8,.2,1); }
#nqAP.open .apWin { transform: none; }
#nqAP .apTop { position: sticky; top: 0; z-index: 5; background: linear-gradient(180deg, #f3ecff 0%, #fbf7ee 100%); border-bottom: 1px solid var(--ap-line); }
#nqAP .apBar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 16px 20px 8px; }
#nqAP .apBar h2 { margin: 0 10px 0 0; font-size: 24px; line-height: 32px; font-weight: 800; letter-spacing: -.02em; color: var(--ap-text); }
#nqAP .apStar { display: inline-block; color: #f5a623; margin-left: 6px; font-size: 18px; vertical-align: 2px; }
#nqAP input[type=search], #nqAP input[type=text], #nqAP select { font: inherit; font-size: 14px; line-height: 20px; color: var(--ap-text); background: #fff; border: 1px solid var(--ap-line); border-radius: 999px; padding: 8px 16px; min-width: 0; }
#nqAP input::placeholder { color: var(--ap-mute); opacity: .8; }
#nqAP .apSearch { flex: 1 1 200px; }
#nqAP button, #nqAP a.apBtn { font: inherit; font-size: 13px; font-weight: 700; line-height: 20px; cursor: pointer; color: var(--ap-text); background: #fff; border: 1px solid var(--ap-line); border-radius: 999px; padding: 7px 14px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: background .15s, transform .15s, border-color .15s, box-shadow .15s; }
#nqAP button:hover, #nqAP a.apBtn:hover { background: var(--ap-soft); border-color: #cbbaf2; box-shadow: 0 2px 8px rgba(124,92,240,.18); }
#nqAP .apPrimary { background: var(--ap-acc); color: #fff; border-color: transparent; }
#nqAP .apPrimary:hover { background: #6a49e0; border-color: transparent; }
#nqAP :focus-visible { outline: 3px solid #5b8def; outline-offset: 2px; }
#nqAP svg { width: 16px; height: 16px; flex: none; }
#nqAP .apIcon { width: 34px; height: 34px; padding: 0; }
#nqAP .apGroup { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--ap-mute); cursor: pointer; padding: 0 6px; }
#nqAP .apGroup input { accent-color: var(--ap-acc); width: 16px; height: 16px; margin: 0; }
#nqAP .apRow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 4px 20px 12px; }
#nqAP .apSeg { display: inline-flex; padding: 3px; gap: 2px; background: var(--ap-soft); border-radius: 999px; max-width: 100%; overflow-x: auto; }
#nqAP .apSeg button { border: 0; background: transparent; padding: 5px 14px; color: var(--ap-mute); white-space: nowrap; box-shadow: none; }
#nqAP .apSeg button:hover { background: rgba(255,255,255,.7); color: var(--ap-text); box-shadow: none; }
#nqAP .apSeg button.on { background: #fff; color: var(--ap-acc); box-shadow: 0 1px 4px rgba(124,92,240,.25); }
#nqAP .apChip { padding: 3px 12px; font-size: 12px; color: var(--ap-mute); background: transparent; border-style: dashed; }
#nqAP .apChip.on { color: var(--ap-text); background: #fff; border-style: solid; border-color: #cbbaf2; }
#nqAP .apStatus { padding: 8px 20px 0; font-size: 13px; color: var(--ap-mute); min-height: 28px; }
#nqAP .apBody { flex: 1; overflow: auto; padding: 0 20px 28px; background: radial-gradient(circle, #ddd2f7 1.2px, transparent 1.6px) 0 0 / 20px 20px; }
#nqAP .apHead { display: flex; align-items: center; gap: 8px; margin: 26px 0 6px; font-weight: 800; font-size: 16px; line-height: 24px; flex-wrap: wrap; color: var(--ap-text); }
#nqAP .apHead small { font-weight: 500; color: var(--ap-mute); font-size: 13px; }
#nqAP .apHead .apMain { color: #f5a623; }
#nqAP .apFoot .apWipe { border: 0; background: none; padding: 0; font: inherit; font-size: 13px; font-weight: 600; color: #d9534f; cursor: pointer; }
#nqAP .apFoot .apWipe:hover { text-decoration: underline; }
#nqAP .apFoot .apUnblk { border: 1px solid var(--ap-line); border-radius: 999px; background: none; padding: 1px 9px; font: inherit; font-size: 12px; font-weight: 600; color: var(--ap-mute); cursor: pointer; }
#nqAP .apFoot .apUnblk:hover { color: #d9534f; border-color: #d9534f; }
#nqAP .apAcRow { display: flex; align-items: center; gap: 2px; }
#nqAP .apAcRow .apOpt { flex: 1; min-width: 0; }
#nqAP .apAcRow .apAcX { flex: none; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--ap-mute); cursor: pointer; opacity: .55; }
#nqAP .apAcRow .apAcX svg { width: 14px; height: 14px; }
#nqAP .apAcRow:hover .apAcX, #nqAP .apAcRow .apAcX:focus-visible { opacity: 1; }
#nqAP .apAcRow .apAcX:hover { background: var(--ap-soft); color: #d9534f; }
#nqAP .apOv .apIco.apDel:hover { color: #d9534f; }
#nqAP .apGrid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 18px 14px; padding-top: 14px; }
#nqAP .apCard { position: relative; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
#nqAP .apImg { position: relative; aspect-ratio: 1 / 1; border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 0 0 1px var(--ap-line); transition: box-shadow .15s; }
#nqAP:not(.apEditing) .apCard:hover .apImg, #nqAP:not(.apEditing) .apCard:focus-within .apImg, #nqAP .apCard.tap .apImg { box-shadow: 0 0 0 1px #cbbaf2, 0 8px 22px rgba(124,92,240,.2); }
#nqAP .apCard.sel .apImg { box-shadow: 0 0 0 2px var(--ap-acc); }
#nqAP .apPic { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 38%, #fff 0%, #f6f0ff 58%, #e7dcff 100%); }
#nqAP .apPic img { width: 100%; height: 100%; object-fit: contain; display: block; transition: transform .25s ease; }
#nqAP:not(.apEditing) .apCard:hover .apPic img { transform: scale(1.04); }
#nqAP .apOv { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; display: flex; flex-direction: column; gap: 6px; padding: 26px 10px 8px; color: #fff; background: linear-gradient(to top, rgba(38,26,68,.86) 0%, rgba(38,26,68,.55) 60%, rgba(38,26,68,0) 100%); opacity: 0; transform: translateY(6px); pointer-events: none; transition: opacity .16s ease, transform .18s ease; }
#nqAP:not(.apEditing) .apCard:hover .apOv, #nqAP:not(.apEditing) .apCard:focus-within .apOv, #nqAP:not(.apEditing) .apCard.tap .apOv { opacity: 1; transform: none; pointer-events: auto; }
#nqAP .apInfo { min-width: 0; line-height: 15px; }
#nqAP .apInfo b { display: block; font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#nqAP .apInfo small { display: block; font-size: 11px; opacity: .72; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#nqAP .apIcos { display: flex; gap: 6px; }
#nqAP .apOv .apIco { width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%; background: rgba(255,255,255,.92); color: var(--ap-text); box-shadow: none; }
#nqAP .apOv .apIco:hover { background: #fff; color: var(--ap-acc); box-shadow: none; }
#nqAP .apOv .apIco svg { width: 14px; height: 14px; }
#nqAP .apCap { display: flex; align-items: center; gap: 8px; min-height: 20px; padding: 0 2px; }
#nqAP .apLk { color: inherit; text-decoration: none; } #nqAP .apLk:hover { text-decoration: underline; }
#nqAP .apCard.apTonePending .apName { opacity: 0 !important; }
#nqAP .apName { transition: opacity .15s; position: absolute; left: 10px; right: 10px; bottom: 8px; z-index: 4; font-family: 'CafeteriaBlack', Georgia, serif; font-size: 20px; line-height: 24px; font-weight: 400; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.85), 0 1px 1px rgba(0,0,0,.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
#nqAP .apName .apLk { pointer-events: auto; color: #fff; }
#nqAP:not(.apEditing) .apCard:hover .apName, #nqAP:not(.apEditing) .apCard:focus-within .apName, #nqAP .apCard.tap .apName { opacity: 0; }
#nqAP .apBadges { position: absolute; top: 8px; right: 8px; z-index: 5; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; pointer-events: none; }
#nqAP .apTb { font-size: 10px; line-height: 14px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #fff; border-radius: 999px; padding: 1px 8px; box-shadow: 0 1px 4px rgba(0,0,0,.25); }
#nqAP .apTb.uft { background: #f0a92e; } #nqAP .apTb.perm { background: #4cc784; } #nqAP .apTb.maybe { background: #4a9be8; }
#nqAP .apCard.apNameDark .apName, #nqAP .apCard.apNameDark .apName .apLk { color: #1c1830; text-shadow: none; }
#nqAP .apInfo b, #nqAP .apInfo small, #nqAP .apInfo b *, #nqAP .apInfo small *, #nqAP .apInfo .apLk { font-family: 'CafeteriaBlack', Georgia, serif !important; font-weight: 400; }
#nqAP .apName, #nqAP .apName .apLk, #nqAP .apCard .apName a { font-family: 'CafeteriaBlack', Georgia, serif !important; }
#nqAP .apInfo b { font-size: 14px; } #nqAP .apInfo small { font-size: 12px; }
#nqAP .apAct { box-shadow: 0 1px 4px rgba(0,0,0,.25); font-size: 10px; line-height: 14px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #1c8f55; background: #e3f7ec; border-radius: 4px; padding: 1px 6px; }
#nqAP .apNote { margin: -4px 2px 0; font-size: 12px; line-height: 16px; color: var(--ap-mute); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#nqAP .apChk { position: absolute; top: 8px; left: 8px; z-index: 4; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.92); border-radius: 6px; box-shadow: 0 0 0 1px var(--ap-line); cursor: pointer; }
#nqAP .apChk input { accent-color: var(--ap-acc); width: 16px; height: 16px; margin: 0; cursor: pointer; }
#nqAP .apEd { display: flex; flex-direction: column; gap: 6px; padding: 8px; background: #fff; border: 1px solid var(--ap-line); border-radius: 12px; }
#nqAP .apSegT { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
#nqAP .apTg { height: 30px; padding: 0 8px; border-radius: 8px; font-size: 12px; font-weight: 600; gap: 6px; box-shadow: none; white-space: nowrap; }
#nqAP .apTg::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #c9c2dc; flex: none; }
#nqAP .apTg.uft::before { background: #f0a92e; } #nqAP .apTg.perm::before { background: #4cc784; } #nqAP .apTg.maybe::before { background: #4a9be8; }
#nqAP .apTg:hover { box-shadow: none; }
#nqAP .apTg.on { color: var(--ap-text); border-color: #bdb4d6; background: #e8e4f1; }
#nqAP .apTg.on.uft { background: #ffd57d; border-color: #f0a92e; } #nqAP .apTg.on.perm { background: #9fe6b9; border-color: #4cc784; } #nqAP .apTg.on.maybe { background: #a5d6ff; border-color: #4a9be8; }
#nqAP .apEd input[type=text] { width: 100%; height: 30px; border-radius: 8px; padding: 0 10px; font-size: 13px; }
#nqAP .apEd input[type=text]:focus { outline: none; border-color: var(--ap-acc); box-shadow: 0 0 0 3px rgba(124,92,240,.18); }
#nqAP .apSaved { font-size: 11px; line-height: 14px; height: 14px; color: #1c8f55; opacity: 0; }
#nqAP .apSaved.show { animation: apSv 1.6s ease forwards; }
@keyframes apSv { 0% { opacity: 0; } 12%, 70% { opacity: 1; } 100% { opacity: 0; } }
#nqAP .apBulk { position: sticky; top: 0; z-index: 6; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; padding: 8px 10px; background: #fff; border: 1px solid var(--ap-line); border-radius: 10px; box-shadow: 0 4px 14px rgba(70,52,110,.12); }
#nqAP .apBulk button { height: 34px; border-radius: 8px; padding: 0 12px; font-weight: 600; box-shadow: none; }
#nqAP .apBulk .apTg { height: 34px; }
#nqAP .apBulk button:hover { box-shadow: none; }
#nqAP .apSelN { font-size: 13px; font-weight: 700; min-width: 84px; }
#nqAP .apBulkL { font-size: 13px; color: var(--ap-mute); }
#nqAP .apBulkT { display: flex; flex-wrap: wrap; gap: 4px; }
#nqAP .apSp { flex: 1 1 0; }
#nqAP .apGrid { padding-top: 14px; }
#nqAP .apBulk + .apGrid, #nqAP .apBulk + .apHead { margin-top: 0; }
#nqAP .apTop .apEditBtn.on { background: var(--ap-acc); border-color: transparent; color: #fff; }
#nqAP .apTop .apEditBtn.on:hover { background: #6a49e0; }
#nqAP .apNoImg { font-size: 48px; font-weight: 800; color: #a595d6; }
#nqAP .sk .apPic { background: linear-gradient(110deg, #f1eafc 30%, #fff 50%, #f1eafc 70%); background-size: 200% 100%; animation: apSk 1.6s linear infinite; }
#nqAP .sk .apLine { height: 12px; border-radius: 6px; background: #ece7f7; }
@keyframes apSk { to { background-position: -200% 0; } }
#nqAP .apNone { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 12px 16px; font-size: 14px; color: var(--ap-mute); border: 2px dashed #cbbaf2; border-radius: 18px; background: rgba(255,255,255,.6); }
#nqAP .apEmpty { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 56px 16px; text-align: center; color: var(--ap-mute); font-size: 15px; }
#nqAP .apFace { position: relative; width: 84px; height: 76px; border-radius: 50% 50% 46% 46%; background: #e7dcff; box-shadow: inset 0 -6px 0 rgba(124,92,240,.12); }
#nqAP .apFace::before, #nqAP .apFace::after { content: ""; position: absolute; top: -12px; width: 26px; height: 26px; background: #e7dcff; border-radius: 6px 22px 6px 22px; }
#nqAP .apFace::before { left: 6px; transform: rotate(-8deg); } #nqAP .apFace::after { right: 6px; transform: rotate(98deg); }
#nqAP .apFace i { position: absolute; top: 32px; width: 9px; height: 11px; border-radius: 50%; background: #392d5c; } #nqAP .apFace i:nth-child(1) { left: 24px; } #nqAP .apFace i:nth-child(2) { right: 24px; }
#nqAP .apFace b { position: absolute; left: 50%; top: 50px; width: 16px; height: 8px; margin-left: -8px; border-bottom: 3px solid #392d5c; border-radius: 0 0 16px 16px; }
#nqAP .apToast { position: absolute; left: 50%; bottom: 24px; transform: translate(-50%, 8px); padding: 8px 18px; border-radius: 999px; background: #392d5c; color: #fff; font-size: 13px; font-weight: 600; opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; z-index: 9; }
#nqAP .apToast.on { opacity: 1; transform: translate(-50%, 0); }
#nqAP .apTop .apBar { flex-wrap: nowrap; gap: 10px; padding: 16px 20px 10px; }
#nqAP .apTop .apBar h2 { display: flex; align-items: baseline; gap: 10px; margin: 0 6px 0 0; font-family: 'CafeteriaBlack', Georgia, serif !important; font-size: 30px; line-height: 1.1; font-weight: 400; white-space: nowrap; }
#nqAP .apBar h2 .apCount { font-family: inherit; }
#nqAP .apCount { font-size: 13px; font-weight: 500; color: var(--ap-mute); }
#nqAP .apTop input[type=search] { height: 34px; border-radius: 8px; padding: 0 12px; flex: 1 1 auto; }
#nqAP .apTop input[type=search]:focus { outline: none; border-color: var(--ap-acc); box-shadow: 0 0 0 3px rgba(124,92,240,.18); }
#nqAP .apTop button { height: 34px; border-radius: 8px; padding: 0 12px; font-weight: 600; box-shadow: none; }
#nqAP .apTop button:hover { box-shadow: none; }
#nqAP .apTop .apIcon { width: 34px; padding: 0; color: var(--ap-mute); }
#nqAP .apTop .apIcon:hover { color: var(--ap-text); }
#nqAP .apTop .apRow { position: relative; flex-wrap: wrap; justify-content: space-between; gap: 8px 12px; padding: 0 20px 12px; }
#nqAP .apTop .apSeg { padding: 3px; gap: 2px; border-radius: 10px; height: 38px; align-items: center; }
#nqAP .apTop .apSeg button { height: 30px; border-radius: 7px; padding: 0 10px; gap: 7px; color: var(--ap-mute); }
#nqAP .apTop .apSeg button.on { color: var(--ap-text); background: #fff; box-shadow: 0 0 0 1px var(--ap-line), 0 1px 2px rgba(70,52,110,.12); }
#nqAP .apTop .apSeg button.on .apN { color: var(--ap-acc); }
#nqAP .apN { font-weight: 500; font-size: 12px; color: var(--ap-mute); opacity: .9; }
#nqAP .apTd { width: 8px; height: 8px; border-radius: 50%; flex: none; }
#nqAP .apTd.uft { background: #f0a92e; } #nqAP .apTd.perm { background: #4cc784; } #nqAP .apTd.maybe { background: #4a9be8; }
#nqAP .apTools { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
#nqAP .apPopWrap { position: relative; }
#nqAP .apTop .apDd { gap: 6px; }
#nqAP .apDdl { color: var(--ap-mute); font-weight: 500; }
#nqAP .apDd b { font-weight: 600; }
#nqAP .apDd svg:last-child { width: 14px; height: 14px; color: var(--ap-mute); }
#nqAP .apDd[aria-expanded=true] { border-color: var(--ap-acc); background: var(--ap-soft); }
#nqAP .apTop .apTrade { color: var(--ap-text); }
#nqAP .apTop .apTrade.hot { background: var(--ap-acc); border-color: transparent; color: #fff; }
#nqAP .apTop .apTrade.hot:hover { background: #6a49e0; }
#nqAP .apPop { position: absolute; top: calc(100% + 6px); right: 0; z-index: 10; min-width: 220px; max-width: calc(100vw - 24px); max-height: 60vh; overflow-y: auto; padding: 6px; background: #fff; border: 1px solid var(--ap-line); border-radius: 10px; box-shadow: 0 10px 30px rgba(70,52,110,.22); }
#nqAP .apPop[hidden] { display: none; }
#nqAP .apPopHead { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px 6px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ap-mute); }
#nqAP .apTop .apLink { height: auto; border: 0; background: none; padding: 0; font-size: 12px; text-transform: none; letter-spacing: 0; color: var(--ap-acc); }
#nqAP .apTop .apLink:hover { background: none; text-decoration: underline; }
#nqAP .apOpt { display: flex; align-items: center; gap: 10px; padding: 7px 8px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; }
#nqAP .apOpt:hover { background: var(--ap-soft); }
#nqAP .apOpt input[type=checkbox], #nqAP .apOpt input[type=radio] { accent-color: var(--ap-acc); width: 16px; height: 16px; margin: 0; flex: none; }
#nqAP .apMainS { margin-left: auto; font-style: normal; color: #f5a623; }
#nqAP .apSep { height: 1px; margin: 6px 4px; background: var(--ap-line); }
#nqAP .apSw { justify-content: space-between; position: relative; }
#nqAP .apSw input { position: absolute; opacity: 0; width: 1px; height: 1px; }
#nqAP .apTrack { position: relative; width: 32px; height: 18px; border-radius: 999px; background: #d6cfe6; transition: background .15s; flex: none; }
#nqAP .apTrack::after { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.25); transition: transform .15s; }
#nqAP .apSw input:checked ~ .apTrack { background: var(--ap-acc); }
#nqAP .apSw input:checked ~ .apTrack::after { transform: translateX(14px); }
#nqAP .apSw input:focus-visible ~ .apTrack { outline: 3px solid #5b8def; outline-offset: 2px; }
@media (max-width: 600px) {
  #nqAP { padding: 0; }
  #nqAP .apWin { border-radius: 0; border: 0; width: 100%; }
  #nqAP .apTop .apBar { flex-wrap: wrap; padding: 12px 12px 8px; }
  #nqAP .apTop .apBar h2 { flex: 1; }
  #nqAP .apTop .apSearch { order: 5; flex-basis: 100%; }
  #nqAP .apTop .apRow { padding: 0 12px 10px; }
  #nqAP .apTop .apSeg { width: 100%; }
  #nqAP .apTools { width: 100%; }
  #nqAP .apTools .apTrade { margin-left: auto; }
  #nqAP .apPopWrap { position: static; }
  #nqAP .apPop { left: 12px; right: 12px; top: auto; margin-top: 6px; }
  #nqAP .apBody { padding: 0 12px 24px; }
  #nqAP .apGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px 12px; }
}
@media (min-width: 601px) and (max-width: 900px) { #nqAP .apGrid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (prefers-reduced-motion: reduce) { #nqAP, #nqAP *, #nqAP .apWin { transition: none !important; animation: none !important; } #nqAP .apWin, #nqAP .apCard, #nqAP .apPic img, #nqAP .apOv { transform: none !important; } }
/* dark mode (follows sidebar toggle) */
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP { --ap-bg: #1d1a2b; --ap-panel: #272238; --ap-line: rgba(255,255,255,.12); --ap-text: #f1ecff; --ap-mute: rgba(241,236,255,.62); --ap-acc: #a58bff; --ap-soft: rgba(165,139,255,.16); color-scheme: dark; background: rgba(8,6,16,.6); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apWin { border-color: rgba(255,255,255,.14); box-shadow: 0 24px 70px rgba(0,0,0,.55); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTop { background: linear-gradient(180deg, #2a2440 0%, #1d1a2b 100%); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP input[type=search], html[data-nq-modern-interface]:not(.nq-side-light) #nqAP input[type=text], html[data-nq-modern-interface]:not(.nq-side-light) #nqAP select, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP button, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP a.apBtn, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apEd, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apBulk, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apPop { background: var(--ap-panel); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP select option { background: #272238; color: #f1ecff; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP button:hover, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP a.apBtn:hover { background: var(--ap-soft); border-color: rgba(165,139,255,.45); box-shadow: 0 2px 8px rgba(0,0,0,.35); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apPrimary, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTop .apEditBtn.on, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTop .apTrade.hot { background: var(--ap-acc); color: #1d1a2b; border-color: transparent; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apPrimary:hover, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTop .apEditBtn.on:hover, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTop .apTrade.hot:hover { background: #b8a2ff; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apSeg button { background: transparent; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apSeg button:hover { background: rgba(255,255,255,.08); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apSeg button.on, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTop .apSeg button.on { background: var(--ap-panel); color: var(--ap-acc); box-shadow: 0 0 0 1px var(--ap-line), 0 1px 4px rgba(0,0,0,.35); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTop .apSeg button.on { color: var(--ap-text); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apChip { background: transparent; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apChip.on { background: var(--ap-panel); border-color: rgba(165,139,255,.45); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apBody { background: radial-gradient(circle, rgba(255,255,255,.08) 1.2px, transparent 1.6px) 0 0 / 20px 20px; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP:not(.apEditing) .apCard:hover .apImg, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP:not(.apEditing) .apCard:focus-within .apImg, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apCard.tap .apImg { box-shadow: 0 0 0 1px rgba(165,139,255,.45), 0 8px 22px rgba(0,0,0,.45); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apCard.sel .apImg { box-shadow: 0 0 0 2px var(--ap-acc); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apOv .apIco { background: rgba(255,255,255,.92); color: #392d5c; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apOv .apIco:hover { background: #fff; color: #7c5cf0; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apAct { background: rgba(76,199,132,.18); color: #7be0a6; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apSaved { color: #7be0a6; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apChk { background: rgba(39,34,56,.92); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTg::before { background: rgba(255,255,255,.3); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTg.uft::before { background: #f0a92e; } html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTg.perm::before { background: #4cc784; } html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTg.maybe::before { background: #4a9be8; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTg.on { color: var(--ap-text); border-color: rgba(255,255,255,.25); background: rgba(255,255,255,.1); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTg.on.uft { background: rgba(240,169,46,.22); border-color: #f0a92e; color: #ffe2a0; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTg.on.perm { background: rgba(76,199,132,.2); border-color: #4cc784; color: #b5f0cd; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTg.on.maybe { background: rgba(74,155,232,.22); border-color: #4a9be8; color: #bfe0ff; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apEd input[type=text]:focus, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTop input[type=search]:focus { box-shadow: 0 0 0 3px rgba(165,139,255,.25); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apBulk { box-shadow: 0 4px 14px rgba(0,0,0,.4); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apNoImg { color: rgba(255,255,255,.35); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .sk .apPic { background: linear-gradient(110deg, rgba(255,255,255,.06) 30%, rgba(255,255,255,.14) 50%, rgba(255,255,255,.06) 70%); background-size: 200% 100%; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .sk .apLine { background: rgba(255,255,255,.08); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apNone { border-color: rgba(165,139,255,.45); background: rgba(255,255,255,.04); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apFace, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apFace::before, html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apFace::after { background: rgba(255,255,255,.08); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apFace i { background: var(--ap-text); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apFace b { border-bottom-color: var(--ap-text); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apToast { background: #f1ecff; color: #1d1a2b; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apTrack { background: rgba(255,255,255,.18); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqAP .apSw input:checked ~ .apTrack { background: var(--ap-acc); }
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
  try { const pr = JSON.parse(LSget('nq_ap_prefs') || 'null'); if (pr) { if (['account', 'name', 'species', 'tag'].includes(pr.sort)) apState.sort = pr.sort; apState.group = !!pr.group; } } catch {}
  const apSavePrefs = () => { try { LSset('nq_ap_prefs', JSON.stringify({ sort: apState.sort, group: apState.group })); } catch {} };
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
      apEl = document.createElement('div'); apEl.id = 'nqAP'; apEl.setAttribute('role', 'dialog'); apEl.setAttribute('aria-label', 'My pets');
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
    document.dispatchEvent(new CustomEvent('nq:drawer', { detail: 'allpets' }));
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
  const apNewUser = () => { const u = curUser().toLowerCase(); let was = ''; try { was = sessionStorage.getItem('nq_ap_user') || ''; sessionStorage.setItem('nq_ap_user', u); } catch {} return !!u && u !== was; };
  try { const dc = apRead(); if (apDedupe(dc)) gmSet(AP_KEY, dc); } catch {}   // one-time cleanup of stored duplicates
  // Only on login/swap (a new user in this tab), not on a timer.
  // Home page: read once when the pet carousel (colour/species/level) has loaded.
  if (['/home', '/home/', '/home/index.phtml'].includes(location.pathname.toLowerCase())) { let n = 0; const iv = setInterval(() => { if (document.querySelector('.hp-carousel-pet[data-species]') || ++n > 30) { clearInterval(iv); apCollect(true); } }, 500); }
  // Every other page load gets one local pass (no network; unchanged data within 10 min is not rewritten).
  setTimeout(() => { if (apNewUser()) [0, 2500, 9500, 19500].forEach(ms => setTimeout(apCollect, ms)); else setTimeout(apCollect, 2000); }, 2500);
  // Logout: save the current account's pets right before the logout link navigates away.
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('a[href*="logout"]')) apCollect(); }, true);
  // Remember a "Make Active" click for this account so the tag updates before Quick Ref refreshes.
  document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href*="new_active_pet="]'); const m = a && a.href.match(/new_active_pet=([A-Za-z0-9_]+)/); if (m) LSset('nq_ap_newactive', JSON.stringify({ u: curUser().toLowerCase(), n: m[1], t: Date.now() })); }, true);

  /* ───────────────────────────────── drawer ───────────────────────────────── */
  let MODE = 'standalone';
  const detectMode = () => {
    MODE = document.getElementById('nqUser') ? 'modern' : 'standalone';   // main script present (with or without the core)
    return MODE;
  };

  let drawerEl = null, tabEl = null, open = false, acctTabRefresh = null, drawerSetOpen = null;

  function buildDrawer() {
    const drawer = document.createElement('div');
    drawer.id = 'nqAcctDrawer';
    drawer.innerHTML =
      '<div class="nqAcctHead"><div class="nqAcctHeadL"><span class="nqAcctTitle">Accounts</span><small class="nqAcctCount"></small></div><div class="nqAcctHeadR">' +
      (MODE === 'modern'
        ? '<a class="nqAcctSwap" href="' + SWAP_URL + '" target="_blank" rel="noopener" title="Swap account: log out and go straight to the login page">' + USERS_ICON + '<span>Swap</span></a>'
        : '') +
      '<button type="button" class="nqAcctClose" aria-label="Close" title="Close">&times;</button></div></div>' +
      '<div class="nqAcctHint"></div>' +
      '<div class="nqAcctBody">' +
        '<section class="nqAcctSec"><div class="nqAcctSecHead"><span>NeoPass</span><em class="nqCntNp"></em></div><div class="nqAcctList" data-list="np"></div><div class="nqAcctNote" data-note="np"></div><button type="button" class="nqAcctSync">Sync from NeoPass</button><div class="nqAcctMsg" data-msg="np"></div></section>' +
        '<section class="nqAcctSec" data-sec="ex" hidden><div class="nqAcctSecHead"><span>Additional accounts</span><em class="nqCntEx"></em></div><div class="nqAcctList" data-list="ex"></div></section>' +
        '<div class="nqAcctAddWrap"><button type="button" class="nqAcctAddBtn">+ Add account</button><form class="nqAcctAdd" autocomplete="off" hidden><input type="text" placeholder="Account name…" aria-label="Account name" spellcheck="false"><button type="submit" class="nqAcctAddOk">Add</button><button type="button" class="nqAcctAddCancel" aria-label="Cancel" title="Cancel">×</button></form><div class="nqAcctMsg" data-msg="ex"></div></div>' +
      '</div>' +
      (MODE === 'standalone'
        ? '<div class="nqAcctStandaloneFoot"><a class="nqLogout" href="https://www.neopets.com/logout.phtml">' + LOGOUT_ICON + '<span>Log Out</span></a><a class="nqSwap" href="' + SWAP_URL + '" target="_blank" rel="noopener">' + USERS_ICON + '<span>Swap</span></a></div>'
        : '');
    document.body.appendChild(drawer);
    return drawer;
  }

  function wireDrawer(drawer) {
    const q = (sel) => $(sel, drawer);
    const input = q('input'), hint = q('.nqAcctHint');
    const listNp = q('[data-list="np"]'), listEx = q('[data-list="ex"]'), noteNp = q('[data-note="np"]'), secEx = q('[data-sec="ex"]'), addBtn = q('.nqAcctAddBtn'), addForm = q('.nqAcctAdd'), msgNp = q('[data-msg="np"]'), msgEx = q('[data-msg="ex"]');
    const card = $('#nqUser');

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
        return `<div class="nqAcctRow${mine ? ' me' : ''}${isMain ? ' main' : ''}"><a class="nqAcctLink" href="https://www.neopets.com/userlookup.phtml?user=${encodeURIComponent(n)}" target="_blank" rel="noopener" title="View ${esc(n)}'s profile"><span class="nqAcctAv"${av ? ` style="background-image:url('${esc(av)}')"` : ''}>${av ? '' : esc(n.charAt(0).toUpperCase())}</span><span class="nqAcctTxt"><b>${esc(n)}</b><small>${esc(sub)}</small></span></a>${removable ? `<button type="button" class="nqAcctX" data-n="${esc(n)}" title="Remove from this computer" aria-label="Remove ${esc(n)}">×</button>` : ''}<button type="button" class="nqAcctStar" data-n="${esc(n)}" title="${isMain ? 'Main account (click to unset)' : 'Make this my main account'}" aria-label="${isMain ? 'Unset main account' : 'Make main account'}">${isMain ? '★' : '☆'}</button></div>`;
      };
      q('.nqCntNp').textContent = npNames.length || '';
      q('.nqCntEx').textContent = extra.length || '';
      hint.textContent = (!main && all.length > 1) ? 'Sync from NeoPass to find your main account, or pick it with the ☆.' : '';
      listNp.innerHTML = npNames.map(row).join('');
      listEx.innerHTML = extra.map(row).join('');
      const synced = !!LSget('nq_neopass_ts');
      noteNp.textContent = npNames.length === 0
        ? (synced ? 'Press “Sync from NeoPass” again to fill this list.' : 'Not synced yet. Use “Sync from NeoPass” to list every account connected to your NeoPass.')
        : (npNames.length === 1 && synced) ? 'This is the only account connected to your NeoPass.' : '';
      secEx.hidden = extra.length === 0;
      acctTabRefresh();
    };

    const closeAdd = () => { addForm.hidden = true; addBtn.hidden = false; input.value = ''; };
    addBtn.addEventListener('click', () => { addBtn.hidden = true; addForm.hidden = false; msgEx.textContent = ''; input.focus(); });
    $('.nqAcctAddCancel', drawer).addEventListener('click', () => { closeAdd(); msgEx.textContent = ''; });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); closeAdd(); } });

    const place = () => {
      if (MODE === 'standalone') { drawer.style.left = 'auto'; drawer.style.right = '20px'; drawer.style.top = 'auto'; drawer.style.bottom = '76px'; drawer.style.width = '280px'; drawer.style.height = 'min(500px, calc(100vh - 120px))'; return; }
      if (!card) return;
      const r = card.getBoundingClientRect();
      drawer.style.left = ''; drawer.style.right = ''; drawer.style.bottom = ''; drawer.style.width = ''; drawer.style.height = '';
      drawer.style.top = Math.max(64, r.top) + 'px';
    };
    const setOpen = (o) => {
      open = !!o;
      if (open) { closeAllPets(); document.dispatchEvent(new CustomEvent('nq:drawer', { detail: 'accts' })); closeAdd(); try { const cn = drawer.querySelector('.nqAcctCount'); if (cn) cn.textContent = allAccts().length; } catch (er) {} render(); place(); msgNp.textContent = ''; msgEx.textContent = ''; }
      drawer.classList.toggle('open', open);
      if (tabEl) tabEl.classList.toggle('on', open);
    };

    drawerSetOpen = setOpen;
    drawer.querySelector('.nqAcctClose').addEventListener('click', () => setOpen(false));
    tabEl.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); });
    document.addEventListener('pointerdown', (e) => { if (open && !e.target.closest('#nqAcctDrawer, #nqAcctTab, #nqListsMod, #nqStandaloneAcctToggle')) setOpen(false); }, true);
    document.addEventListener('keydown', (e) => { if (open && e.key === 'Escape') setOpen(false); });
    document.addEventListener('nq:drawer', (e) => { if (open && e.detail !== 'accts') setOpen(false); });
    window.addEventListener('resize', () => { if (open) place(); });

    if (MODE === 'modern') {
      const swapLink = q('.nqAcctSwap');
      if (swapLink) swapLink.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        swapAccount(() => { swapLink.lastElementChild.textContent = 'Swapping…'; swapLink.classList.add('busy'); }, () => { swapLink.lastElementChild.textContent = 'Swap'; swapLink.classList.remove('busy'); });
      });
    } else {
      const swapLink = q('.nqAcctStandaloneFoot a.nqSwap');
      if (swapLink) swapLink.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        swapAccount(() => { swapLink.classList.add('busy'); }, () => { swapLink.classList.remove('busy'); });
      });
    }

    const syncBtn = q('.nqAcctSync:not(.nqAcctAllPets)');
    syncBtn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      if (syncBtn.disabled) return;
      syncBtn.disabled = true; syncBtn.classList.add('busy'); syncBtn.textContent = 'Syncing…';
      try {
        const { list, main } = await syncNeoPass();
        render(); document.dispatchEvent(new CustomEvent('nq:main'));
        msgNp.textContent = `Synced ${list.length} account${list.length === 1 ? '' : 's'}${main ? ' · main: ' + main.name : ''}.`;
      } catch (err) { msgNp.textContent = 'Couldn’t sync: ' + (err && err.message || 'error'); }
      finally { syncBtn.disabled = false; syncBtn.classList.remove('busy'); syncBtn.textContent = 'Sync from NeoPass'; }
    });

    drawer.addEventListener('click', (e) => {
      const st = e.target.closest('.nqAcctStar');
      if (st) {
        const n = st.dataset.n;
        LSset(MAIN_KEY, mainAcct().toLowerCase() === n.toLowerCase() ? '' : n);
        render(); document.dispatchEvent(new CustomEvent('nq:main'));
        return;
      }
      const x = e.target.closest('.nqAcctX');
      if (!x || !x.dataset.n) return;
      const nm = x.dataset.n;
      if (nm.toLowerCase() === curUser().toLowerCase()) return;
      if (!confirm('Remove ' + nm + ' from this computer? Their saved pets will be deleted too.')) return;
      removeAccount(nm);
      render();
    });

    q('.nqAcctAdd').addEventListener('submit', (e) => {
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

    acctTabRefresh();
    render();
    return { setOpen, render };
  }

  /* ───────────────────────────────── sidebar lists widget ───────────────────────────────── */
  function mountLists(card) {
    const hud = document.getElementById('nqHud');
    if (!hud || $('#nqListsMod') || !card || card.parentNode !== hud) return;
    const mod = document.createElement('div');
    mod.id = 'nqListsMod';
    const tile = (cls, label, icon) => '<button type="button" class="nqLt ' + cls + '" aria-label="' + label + '">' + icon + '<b>' + label + '</b></button>';
    mod.innerHTML =
      tile('nqLtAcct', 'Accounts', '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="5.5" r="2.5"/><path d="M1.5 13c.3-2.4 2.2-3.8 4.5-3.8s4.2 1.4 4.5 3.8M10.8 3.4a2.3 2.3 0 0 1 0 4.2M12.5 9.6c1.2.5 2 1.6 2.2 3.1"/></svg>') +
      tile('nqLtPets', 'All Pets', '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="4" cy="6.5" r="1.6"/><circle cx="7" cy="3.8" r="1.6"/><circle cx="10.5" cy="3.8" r="1.6"/><circle cx="13" cy="6.5" r="1.6"/><path d="M8.7 7.6c2 0 4 2 4 3.9 0 1.4-1.2 2-2.2 2-.9 0-1.3-.5-1.8-.5s-.9.5-1.8.5c-1 0-2.2-.6-2.2-2 0-1.9 2-3.9 4-3.9z"/></svg>');
    card.after(mod);
    const upd = () => {
      const nmEl = $('#nqUserTitle'); if (nmEl) nmEl.title = nmEl.textContent.trim();
      const uc = $('#nqUser'); if (uc) uc.dataset.main = (mainAcct() && mainAcct().toLowerCase() === curUser().toLowerCase()) ? '1' : '0';
    };
    upd(); setInterval(upd, 3000);
    mod.querySelector('.nqLtAcct').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (apEl && apEl.classList.contains('open')) closeAllPets(); if (drawerSetOpen) drawerSetOpen(!open); else if (tabEl) tabEl.click(); });
    mod.querySelector('.nqLtPets').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openAllPets(); });
  }

  /* ───────────────────────────────── mounts ───────────────────────────────── */
  function mountModern() {
    const card = $('#nqUser');
    if (!card || $('#nqAcctTab')) return;
    const side = card.querySelector('.rightSide');
    if (!side) return;

    if (LSget('nq_accts_v2') !== '1') {
      const seen = new Set([curUser(), ...seenAccounts()].map(x => x.toLowerCase()));
      const old = readAccts();
      writeManual(old.filter(n => !seen.has(n.toLowerCase())));
      writeAccts(old.filter(n => seen.has(n.toLowerCase())));
      LSset('nq_accts_v2', '1');
    }

    // Add the tab button to the user card.
    const tab = document.createElement('button');
    tab.id = 'nqAcctTab'; tab.type = 'button'; tab.title = 'Your accounts'; tab.setAttribute('aria-label', 'Your accounts');
    tab.innerHTML = USERS_ICON;
    card.appendChild(tab);
    tabEl = tab;

    // Add the avatar (if not already there from the core).
    if (!$('#nqAvatar')) {
      const av = document.createElement('a');
      av.id = 'nqAvatar'; av.href = 'https://www.neopets.com/settings/neoboards'; av.title = 'Neoboard settings';
      av.innerHTML = '<span class="nqAvInit"></span>';
      side.prepend(av);
    }

    // Log Out / Swap pill (if not already there from the core).
    if (!$('#nqLogoutBtn')) {
      const wrap = document.createElement('div');
      wrap.id = 'nqAcctBtns';
      const lo = document.createElement('a');
      lo.id = 'nqLogoutBtn'; lo.href = 'https://www.neopets.com/logout.phtml'; lo.innerHTML = LOGOUT_ICON + '<span>Log Out</span>';
      const sw = document.createElement('a');
      sw.id = 'nqSwapBtn'; sw.href = SWAP_URL; sw.target = '_blank'; sw.rel = 'noopener'; sw.title = 'Swap account: log out and go straight to the login page';
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
    document.addEventListener('nq:main', () => updateAvatar());

    // Refresh the tab attention dot if the drawer's data changes.
    return true;
  }

  function mountStandalone() {
    if (document.getElementById('nqStandaloneAcct')) return;
    if (!document.body) return;

    // The drawer is the same component; build it now that we have a body.
    drawerEl = buildDrawer();
    const api = wireDrawer(drawerEl);

    // A floating "Accounts" button bottom-right. Above the dailies button if it's there.
    const wrap = document.createElement('div');
    wrap.id = 'nqStandaloneAcct';
    if (document.getElementById('nqDailiesRoot')) wrap.classList.add('aboveDailies');
    wrap.innerHTML = '<button type="button" id="nqStandaloneAcctToggle" title="Your accounts">' + USERS_ICON + '<span>Accounts</span></button>';
    document.body.appendChild(wrap);
    const toggle = wrap.querySelector('#nqStandaloneAcctToggle');
    toggle.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); api.setOpen(true); });

    // Tab button is used only for the drawer's internal open/close logic in modern mode.
    // For standalone mode, we spoof a tabEl so the drawer's setOpen works.
    tabEl = toggle;

    // React to the dailies button appearing later.
    watchDoc(() => {
      wrap.classList.toggle('aboveDailies', !!document.getElementById('nqDailiesRoot'));
    });

    setInterval(() => { try { api.render(); } catch {} }, 4000);   // (in case the account list changes elsewhere)
  }

  function updateAvatar() {
    const av = $('#nqAvatar');
    if (!av) return;
    const user = String(W.appInsightsUserName || LSget('nq_hud_username') || '').trim();
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
      try { const lg = JSON.parse(LSget('nq_active_pet_img_v1') || 'null'); if (lg && /\/cp\//.test(lg.url || '')) url = lg.url.replace(/\/9\.png/, '/1.png'); } catch {}
    }
    if (url.startsWith('//')) url = 'https:' + url;
    const init = av.querySelector('.nqAvInit');
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
      if (r.status === 403) { LSset('nq_403_backoff_until_v1', String(Date.now() + 10 * 60 * 1000)); throw new Error('403'); }
      if (r.ok) res = pickProfImgs(new DOMParser().parseFromString(await r.text(), 'text/html'));
      LSset(PROF_KEY(user), JSON.stringify({ avatar: res.avatar || old.avatar, ts: Date.now() }));
    } catch {
      LSset(PROF_KEY(user), JSON.stringify({ avatar: old.avatar, ts: Date.now() }));
    } finally { profBusy = false; }
  }
  function maybeRefreshProfile() {
    const user = String(W.appInsightsUserName || LSget('nq_hud_username') || '').trim();
    if (!user || profBusy || document.visibilityState !== 'visible') return;
    if (Date.now() < (parseInt(LSget('nq_403_backoff_until_v1'), 10) || 0)) return;
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
  ['nq_np_auto_ts', 'nq_prof_frame_ts'].forEach(LSdel);

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
    if ($('#nqAcctTab') || !document.getElementById('nqUser')) return;
    const floating = document.getElementById('nqStandaloneAcct');
    const oldDrawer = floating ? drawerEl : null;
    MODE = 'modern';
    if (!mountModern()) return;
    if (oldDrawer) oldDrawer.remove();
    if (floating) floating.remove();
  });
})();

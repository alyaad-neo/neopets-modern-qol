// ==UserScript==
// @name         Neopets - Accounts Drawer
// @namespace    neopets-qol-patcher
// @version      1.2.4
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

#nppStandaloneAcct { position: fixed; right: 20px; bottom: 20px; z-index: 2140; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; font: 500 13px 'Outfit', system-ui, sans-serif; }
#nppStandaloneAcct.aboveDailies { bottom: 74px; }
#nppStandaloneAcctToggle { display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(0,0,0,.16); background: #fff; color: #1f2937; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.18); }
#nppStandaloneAcctToggle:hover { background: #f3f4f6; }
#nppStandaloneAcctToggle svg { width: 18px; height: 18px; }

#nppAvatar { grid-column: 1; grid-row: 1 / span 2; position: relative; text-decoration: none !important; cursor: pointer; width: 48px; height: 48px; border-radius: 50%; background: center / cover no-repeat rgba(255,255,255,.14); border: 2px solid rgba(255,255,255,.55); box-shadow: 0 2px 8px rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; font: 400 24px/1 'CafeteriaBlack', Georgia, serif; color: #fff; transition: border-color .15s, transform .15s; }
#nppAvatar:hover { border-color: #fff; transform: scale(1.06); }
#nppAvatar .nppAvInit { pointer-events: none; }
#nppAcctBtns { position: absolute; left: 50%; bottom: -13px; transform: translateX(-50%); z-index: 3; display: flex; flex-wrap: nowrap; gap: 0; width: max-content; height: 26px; border-radius: 999px; overflow: hidden; box-shadow: 0 0 0 1px rgba(0,0,0,.25), 0 3px 10px rgba(0,0,0,.3); }
#npLogoutBtn, #npSwapBtn { box-sizing: border-box; display: flex !important; align-items: center; justify-content: center; gap: 6px; width: auto; height: 26px; padding: 0 12px !important; border: 0 !important; border-radius: 0 !important; font: 400 14px/1 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .02em; text-decoration: none !important; white-space: nowrap; }
#npLogoutBtn svg, #npSwapBtn svg { width: 13px; height: 13px; flex: none; }
#npLogoutBtn span, #npSwapBtn span { display: inline !important; font: inherit !important; letter-spacing: inherit; }
#npLogoutBtn { background: linear-gradient(180deg, color-mix(in srgb, var(--np-accent, #ff8a1f) 80%, #fff) 0%, var(--np-accent, #ff8a1f) 50%, color-mix(in srgb, var(--np-accent, #ff8a1f) 86%, #000) 100%) !important; color: #fff !important; text-shadow: 0 1px 2px rgba(0,0,0,.35); box-shadow: inset 0 1px 0 rgba(255,255,255,.35); }
#npSwapBtn { background: linear-gradient(180deg, #52525e 0%, #3b3b46 50%, #2b2b34 100%) !important; color: #fff !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.18); }
#npLogoutBtn:hover { filter: brightness(1.07); }
#npSwapBtn:hover { background: linear-gradient(180deg, #5f5f6c 0%, #494956 50%, #373742 100%) !important; }
#npSwapBtn.busy svg { animation: nppSpinAcct .8s linear infinite; }
@keyframes nppSpinAcct { to { transform: rotate(360deg); } }
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
  const readNP = () => { try { const a = JSON.parse(LSget(NP_KEY) || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch { return []; } };
  const readManual = () => { try { const a = JSON.parse(LSget(MAN_KEY) || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch { return []; } };
  const writeManual = (a) => LSset(MAN_KEY, JSON.stringify(a));
  const autoAccts = () => { const a = readAccts().slice(); [curUser(), ...seenAccounts()].forEach(n => { if (validName(n) && !a.some(x => x.toLowerCase() === n.toLowerCase())) a.push(n); }); return a; };
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
  function clearNotifCaches() {
    try {
      const keys = [];
      for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); if (k && /notif/i.test(k)) keys.push(k); }
      keys.forEach(k => sessionStorage.removeItem(k));
    } catch {}
  }
  function swapAccount(onBusy, onDone) {
    if (swapBusy) return;
    swapBusy = true;
    clearNotifCaches();
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
  const gmSet = (k, v) => { try { if (typeof GM_setValue === 'function') GM_setValue(k, v); else LSset(k, JSON.stringify(v)); } catch {} };
  const apRead = () => gmGet(AP_KEY, {});
  const apTags = () => gmGet(AP_TAGS, {});
  const apOrdered = () => { const m = mainAcct().toLowerCase(); return allAccts().slice().sort((a, b) => (b.toLowerCase() === m) - (a.toLowerCase() === m)); };
  const AP_I = (d) => '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  const AP_COPY = AP_I('<rect x="5.5" y="5.5" width="8" height="8" rx="1.6"/><path d="M10.5 3.5v-.4A1.6 1.6 0 0 0 8.9 1.5H3.6a1.6 1.6 0 0 0-1.6 1.6v5.3a1.6 1.6 0 0 0 1.6 1.6h.4"/>'), AP_PAGE = AP_I('<path d="M9 2.5h4.5V7M13.5 2.5L7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/>'), AP_ACTIVE = AP_I('<circle cx="8" cy="8" r="6"/><path d="M5.5 8.2l1.7 1.7 3.4-3.6"/>');
  const ST = { uft: 'Up for Trade', perm: 'Permanent', maybe: 'Maybe' };

  // Collect the current account's pets from the patcher's cached Quick Ref data (tolerant: any objects with a
  // name plus species/colour/level found under data) and from the pet dock DOM (.qrPet name + image).
  function apCollect() {
    const me = curUser();
    if (!validName(me)) return;
    const byName = new Map();
    const put = (o) => {
      const name = String(o.name || '').trim();
      if (!/^[A-Za-z0-9_]{3,20}$/.test(name)) return;
      const k = name.toLowerCase(), p = byName.get(k) || { name, img: '', species: '', color: '', level: 0, active: false };
      p.img = p.img || o.img || ''; p.species = p.species || o.species || ''; p.color = p.color || o.color || ''; p.level = p.level || o.level || 0; p.active = p.active || !!o.active;
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
        if (typeof v.name === 'string' && ('isActive' in v || v.species || v.colour || v.color || v.level)) put({ name: v.name, species: v.species, color: v.colour || v.color, level: parseInt(v.level, 10) || 0, img: v.image || v.img || v.imageUrl || '', active: !!v.isActive });
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
    // Home page carousel (visited by the user): each .hp-carousel-nameplate carries data-species/-color/-level.
    // Only pets already in this account's list get details, so a stray pet never enters the tracker.
    document.querySelectorAll('.hp-carousel-nameplate[data-species]').forEach(el => {
      const name = (el.dataset.name || el.textContent || '').trim();
      if (!byName.has(name.toLowerCase())) return;
      put({ name, species: el.dataset.species || '', color: el.dataset.color || '', level: parseInt(el.dataset.level, 10) || 0, img: el.dataset.petimage || '' });
    });
    if (activeName) put({ name: activeName, active: true });
    if (!byName.size) return;
    const c = apRead(), old = c[me];
    // Keep colour/species/level learned earlier (each pet's details arrive while it is the active pet).
    const prev = new Map(((old && old.pets) || []).map(p => [p.name.toLowerCase(), p]));
    const pets = [...byName.values()].map(p => { const o = prev.get(p.name.toLowerCase()) || {}; return { ...p,
      img: /^(https?:)?\/\/pets\.neopets\.com\//i.test(p.img) ? p.img.replace(/^\/\//, 'https://') : `https://pets.neopets.com/cpn/${encodeURIComponent(p.name)}/1/4.png`,
      species: p.species || o.species || '', color: p.color || o.color || '', level: p.level || o.level || 0,
      active: p.active || p.name.toLowerCase() === activeName.toLowerCase() }; });
    const same = old && JSON.stringify(old.pets) === JSON.stringify(pets);
    if (same && Date.now() - old.t < 10 * 60e3) return;
    c[me] = { t: Date.now(), pets }; gmSet(AP_KEY, c);
    if (apEl && apEl.classList.contains('open') && !same) apRender();
  }

  const AP_CSS = `
#nppAP { --ap-bg: #15111f; --ap-panel: #1c1730; --ap-line: rgba(255,255,255,.1); --ap-text: #f4f0fb; --ap-mute: #b4acc8; --ap-acc: var(--np-accent, #ff8a1f); position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: stretch; justify-content: center; padding: 24px; background: rgba(8,6,16,.66); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); font-family: 'Outfit', system-ui, sans-serif; color: var(--ap-text); opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .2s ease, visibility 0s linear .2s; }
#nppAP.open { opacity: 1; visibility: visible; pointer-events: auto; transition: opacity .2s ease; }
#nppAP *, #nppAP *::before, #nppAP *::after { box-sizing: border-box; }
#nppAP .apWin { width: min(1240px, 100%); display: flex; flex-direction: column; min-height: 0; background: var(--ap-bg); border: 1px solid var(--ap-line); border-radius: 20px; box-shadow: 0 24px 80px rgba(0,0,0,.6); overflow: hidden; position: relative; transform: scale(.97) translateY(8px); transition: transform .22s cubic-bezier(.2,.8,.2,1); }
#nppAP.open .apWin { transform: none; }
#nppAP .apTop { position: sticky; top: 0; z-index: 2; background: var(--ap-panel); border-bottom: 1px solid var(--ap-line); }
#nppAP .apBar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 16px 16px 8px; }
#nppAP .apBar h2 { margin: 0 8px 0 0; font-size: 20px; line-height: 28px; font-weight: 700; letter-spacing: -.01em; color: var(--ap-text); }
#nppAP input, #nppAP select { font: inherit; font-size: 14px; line-height: 20px; color: var(--ap-text); background: rgba(255,255,255,.06); border: 1px solid var(--ap-line); border-radius: 10px; padding: 8px 12px; min-width: 0; }
#nppAP input::placeholder { color: var(--ap-mute); }
#nppAP select option { color: #111; }
#nppAP .apSearch { flex: 1 1 200px; }
#nppAP button, #nppAP a.apBtn { font: inherit; font-size: 13px; font-weight: 600; line-height: 20px; cursor: pointer; color: var(--ap-text); background: rgba(255,255,255,.07); border: 1px solid var(--ap-line); border-radius: 10px; padding: 7px 12px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: background .15s, transform .15s, border-color .15s; }
#nppAP button:hover, #nppAP a.apBtn:hover { background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.22); }
#nppAP .apPrimary { background: var(--ap-acc); color: #1a1330; border-color: transparent; }
#nppAP .apPrimary:hover { background: var(--ap-acc); filter: brightness(1.08); }
#nppAP :focus-visible { outline: 2px solid #8ab4ff; outline-offset: 2px; }
#nppAP svg { width: 16px; height: 16px; flex: none; }
#nppAP .apIcon { width: 32px; height: 32px; padding: 0; }
#nppAP .apRow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 4px 16px 12px; }
#nppAP .apSeg { display: inline-flex; padding: 3px; gap: 2px; background: rgba(255,255,255,.06); border: 1px solid var(--ap-line); border-radius: 12px; max-width: 100%; overflow-x: auto; }
#nppAP .apSeg button { border: 0; background: transparent; padding: 5px 12px; border-radius: 9px; color: var(--ap-mute); white-space: nowrap; }
#nppAP .apSeg button:hover { background: rgba(255,255,255,.08); color: var(--ap-text); }
#nppAP .apSeg button.on { background: var(--ap-acc); color: #1a1330; }
#nppAP .apChip { padding: 4px 12px; font-size: 12px; border-radius: 999px; color: var(--ap-mute); }
#nppAP .apChip.on { color: var(--ap-text); background: rgba(255,255,255,.16); border-color: rgba(255,255,255,.3); }
#nppAP .apStatus { padding: 8px 16px 0; font-size: 13px; color: var(--ap-mute); min-height: 28px; }
#nppAP .apBody { flex: 1; overflow: auto; padding: 0 16px 24px; }
#nppAP .apHead { display: flex; align-items: baseline; gap: 8px; margin: 24px 0 12px; font-weight: 700; font-size: 16px; line-height: 24px; flex-wrap: wrap; }
#nppAP .apHead small { font-weight: 400; color: var(--ap-mute); font-size: 13px; }
#nppAP .apGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
#nppAP .apCard { position: relative; display: flex; flex-direction: column; align-items: stretch; gap: 8px; padding: 12px; background: var(--ap-panel); border: 1px solid var(--ap-line); border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.25); transition: transform .18s ease, box-shadow .18s ease, border-color .18s; }
#nppAP .apCard:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,.4); border-color: rgba(255,255,255,.22); }
#nppAP .apPic { display: flex; align-items: center; justify-content: center; aspect-ratio: 1 / 1; border-radius: 12px; background: radial-gradient(circle at 50% 35%, #fff 0%, #ece6fb 60%, #d7cdf2 100%); overflow: hidden; }
#nppAP .apPic img { width: 100%; height: 100%; object-fit: contain; display: block; }
#nppAP .apNoImg { font-size: 44px; font-weight: 700; color: #6d5fa0; }
#nppAP .apBadge { position: absolute; top: 20px; left: 20px; font-size: 11px; line-height: 16px; font-weight: 700; padding: 2px 8px; border-radius: 999px; color: #fff; background: #5e5875; box-shadow: 0 1px 4px rgba(0,0,0,.3); }
#nppAP .apBadge.uft { background: #f5a623; color: #2a1a00; } #nppAP .apBadge.perm { background: #22a45d; } #nppAP .apBadge.maybe { background: #3b82f6; }
#nppAP .apCopy { position: absolute; top: 20px; right: 20px; width: 28px; height: 28px; padding: 0; border-radius: 8px; background: rgba(20,16,32,.75); }
#nppAP .apInfo { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
#nppAP .apInfo b { font-size: 15px; line-height: 20px; font-weight: 700; overflow-wrap: anywhere; }
#nppAP .apInfo small { font-size: 12px; line-height: 16px; color: var(--ap-mute); }
#nppAP .apCard select, #nppAP .apCard input { width: 100%; font-size: 13px; padding: 6px 10px; }
#nppAP .apAct { display: flex; gap: 8px; }
#nppAP .apAct .apIcon { flex: 1; }
#nppAP .sk .apPic { background: linear-gradient(110deg, rgba(255,255,255,.05) 30%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.05) 70%); background-size: 200% 100%; animation: apSk 1.6s linear infinite; }
#nppAP .sk .apLine { height: 12px; border-radius: 6px; background: rgba(255,255,255,.07); }
@keyframes apSk { to { background-position: -200% 0; } }
#nppAP .apNone { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 12px 16px; font-size: 14px; color: var(--ap-mute); border: 1px dashed rgba(255,255,255,.2); border-radius: 14px; }
#nppAP .apEmpty { padding: 48px 16px; text-align: center; color: var(--ap-mute); font-size: 15px; }
#nppAP .apToast { position: absolute; left: 50%; bottom: 24px; transform: translate(-50%, 8px); padding: 8px 16px; border-radius: 999px; background: #2a2342; border: 1px solid rgba(255,255,255,.25); font-size: 13px; opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; }
#nppAP .apToast.on { opacity: 1; transform: translate(-50%, 0); }
.nppAcctAllPets { width: 100%; margin: 8px 0 0; }
@media (max-width: 600px) {
  #nppAP { padding: 0; }
  #nppAP .apWin { border-radius: 0; border: 0; width: 100%; }
  #nppAP .apBar { padding: 12px 12px 6px; }
  #nppAP .apBar h2 { flex: 1; font-size: 18px; }
  #nppAP .apSearch { order: 5; flex-basis: 100%; }
  #nppAP .apRow { flex-wrap: nowrap; overflow-x: auto; padding: 4px 12px 10px; }
  #nppAP .apBody { padding: 0 12px 24px; }
  #nppAP .apGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
}
@media (prefers-reduced-motion: reduce) { #nppAP, #nppAP *, #nppAP .apWin { transition: none !important; animation: none !important; transform: none !important; } }
`;

  let apEl = null, apToastT = null;
  const apState = { q: '', sort: 'account', tab: 'all', only: new Set() };
  const fmtAgo = (t) => { if (!t) return 'never'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
  const apToast = (m) => { if (!apEl) return; const t = $('.apToast', apEl); t.textContent = m; t.classList.add('on'); clearTimeout(apToastT); apToastT = setTimeout(() => t.classList.remove('on'), 1800); };
  const apStatus = (m) => { if (apEl) $('.apStatus', apEl).textContent = m || ''; };
  async function apCopy(text, msg) {
    try { await navigator.clipboard.writeText(text); apToast(msg); }
    catch { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} ta.remove(); apToast(ok ? msg : 'Copy failed'); }
  }

  function openAllPets() {
    apCollect();
    if (!apEl) {
      const st = document.createElement('style'); st.textContent = AP_CSS; (document.head || root).appendChild(st);
      apEl = document.createElement('div'); apEl.id = 'nppAP'; apEl.setAttribute('role', 'dialog'); apEl.setAttribute('aria-label', 'All pets');
      apEl.innerHTML = '<div class="apWin"><div class="apTop"><div class="apBar"><h2>All Pets</h2><input class="apSearch" type="search" placeholder="Search name, species, colour, note…" aria-label="Search pets"><select class="apSort" aria-label="Sort"><option value="account">Sort: account</option><option value="name">Sort: name</option><option value="species">Sort: species</option></select><button type="button" class="apTrade apPrimary" title="Copy Up for Trade pets as text">' + AP_COPY + '<span>Copy trade list</span></button><button type="button" class="apClose apIcon" aria-label="Close" title="Close (Esc)">' + AP_I('<path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/>') + '</button></div><div class="apRow"><div class="apSeg apTabs" role="tablist"></div></div><div class="apRow apChips"></div></div><div class="apStatus" aria-live="polite"></div><div class="apBody"></div><div class="apToast" role="status"></div></div>';
      document.body.appendChild(apEl);
      apEl.addEventListener('mousedown', (e) => { if (e.target === apEl) closeAllPets(); });
      $('.apClose', apEl).addEventListener('click', closeAllPets);
      $('.apSearch', apEl).addEventListener('input', (e) => { apState.q = e.target.value.trim().toLowerCase(); apRender(); });
      $('.apSort', apEl).addEventListener('change', (e) => { apState.sort = e.target.value; apRender(); });
      $('.apTrade', apEl).addEventListener('click', () => {
        const c = apRead(), tags = apTags(), lines = [];
        apOrdered().forEach(a => ((c[a] && c[a].pets) || []).forEach(p => { if ((tags[p.name.toLowerCase()] || {}).s === 'uft') lines.push(p.name + ' - ' + ([p.color, p.species].filter(Boolean).join(' ') || '?') + ' (' + a + ')'); }));
        if (!lines.length) { apToast('No Up for Trade pets yet'); return; }
        apCopy(lines.join('\n'), 'Copied ' + lines.length + ' pet' + (lines.length === 1 ? '' : 's'));
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && apEl.classList.contains('open')) { e.stopPropagation(); closeAllPets(); } }, true);
      apEl.addEventListener('change', (e) => {
        const el = e.target.closest('[data-tag]'); if (!el) return;
        const k = el.dataset.tag, t = apTags(), cur = t[k] || {};
        if (el.tagName === 'SELECT') cur.s = el.value; else cur.n = el.value.trim().slice(0, 60);
        if (!cur.s && !cur.n) delete t[k]; else t[k] = cur;
        gmSet(AP_TAGS, t); apRender();
      });
      apEl.addEventListener('click', (e) => {
        const tab = e.target.closest('[data-tab]'); if (tab) { apState.tab = tab.dataset.tab; apRender(); return; }
        const b = e.target.closest('button[data-act]'); if (!b) return;
        const n = b.dataset.n, acct = b.dataset.a;
        if (b.dataset.act === 'copy') apCopy(n, 'Copied ' + n);
        else if (b.dataset.act === 'active') {
          const a = [...document.querySelectorAll('#qrDock .qrOverlay a')].find(x => /make active/i.test(x.textContent) && (x.getAttribute('href') || '').toLowerCase().includes(n.toLowerCase()));
          if (a) { b.disabled = true; a.click(); } else apStatus('Open your Quick Ref / pet menu on Neopets to make ' + n + ' active.');
        } else if (b.dataset.act === 'switch') {
          swapAccount(() => { b.disabled = true; }, () => { b.disabled = false; apStatus('Log in as ' + acct + ' in the new tab. Nothing happens automatically.'); });
        }
      });
    }
    document.dispatchEvent(new CustomEvent('npp:drawer', { detail: 'allpets' }));
    apEl.classList.add('open');
    apStatus('');
    apRender();
  }
  function closeAllPets() { if (apEl) apEl.classList.remove('open'); }

  function apRender() {
    if (!apEl) return;
    const c = apRead(), tags = apTags(), accts = apOrdered(), me = curUser().toLowerCase();
    const tabs = [['all', 'All'], ['uft', 'UFT'], ['perm', 'Permanent'], ['maybe', 'Maybe'], ['none', 'Untagged']];
    $('.apTabs', apEl).innerHTML = tabs.map(t => `<button type="button" role="tab" aria-selected="${apState.tab === t[0]}" class="${apState.tab === t[0] ? 'on' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('');
    const chips = $('.apChips', apEl);
    chips.innerHTML = accts.map(n => `<button type="button" class="apChip${!apState.only.size || apState.only.has(n) ? ' on' : ''}" data-n="${esc(n)}">${esc(n)}</button>`).join('');
    chips.onclick = (e) => { const b = e.target.closest('.apChip'); if (!b) return; const n = b.dataset.n; apState.only.has(n) ? apState.only.delete(n) : apState.only.add(n); apRender(); };
    const tagOf = (p) => tags[p.name.toLowerCase()] || {};
    const match = (p) => {
      const s = tagOf(p).s || '';
      if (apState.tab === 'none' ? s : apState.tab !== 'all' && s !== apState.tab) return false;
      return !apState.q || [p.name, p.species, p.color, tagOf(p).n || '', ST[s] || ''].join(' ').toLowerCase().includes(apState.q);
    };
    const card = (p, a) => {
      const mine = a.toLowerCase() === me, t = tagOf(p), sub = [p.color, p.species].filter(Boolean).join(' ') + (p.level ? (p.color || p.species ? ' · ' : '') + 'Lv ' + p.level : '');
      const tip = mine ? 'Make ' + p.name + ' your active pet' : 'Switch to ' + a;
      return `<div class="apCard"><span class="apBadge ${t.s || ''}">${esc(ST[t.s] || 'Untagged')}</span><button type="button" class="apCopy" data-act="copy" data-n="${esc(p.name)}" title="Copy name" aria-label="Copy ${esc(p.name)}">${AP_COPY}</button><div class="apPic">${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">` : `<span class="apNoImg">${esc(p.name.charAt(0).toUpperCase())}</span>`}</div><div class="apInfo"><b>${esc(p.name)}${p.active ? ' ●' : ''}</b><small>${esc(sub || '—')}</small><small>${esc(a)}</small></div><select data-tag="${esc(p.name.toLowerCase())}" aria-label="Status"><option value="">Untagged</option>${Object.keys(ST).map(k => `<option value="${k}"${t.s === k ? ' selected' : ''}>${ST[k]}</option>`).join('')}</select><input type="text" data-tag="${esc(p.name.toLowerCase())}" value="${esc(t.n || '')}" maxlength="60" placeholder="Note…" aria-label="Note"><div class="apAct"><a class="apBtn apIcon" href="https://www.neopets.com/~${encodeURIComponent(p.name)}" target="_blank" rel="noopener" title="Pet Page" aria-label="Pet Page for ${esc(p.name)}">${AP_PAGE}</a>${mine ? (p.active ? '' : `<button type="button" class="apIcon" data-act="active" data-n="${esc(p.name)}" title="${esc(tip)}" aria-label="Swap Active: ${esc(p.name)}">${AP_ACTIVE}</button>`) : `<button type="button" class="apIcon" data-act="switch" data-a="${esc(a)}" title="${esc(tip)}" aria-label="Switch to account ${esc(a)}">${USERS_ICON}</button>`}</div></div>`;
    };
    const shown = accts.filter(a => !apState.only.size || apState.only.has(a));
    let html = '';
    if (apState.sort === 'account') {
      shown.forEach(a => {
        const e = c[a], pets = e ? e.pets.filter(match) : [];
        const star = a.toLowerCase() === mainAcct().toLowerCase() ? ' ★' : '';
        if (!e) html += `<div class="apHead">${esc(a)}${star}<small>not seen yet</small></div><div class="apGrid"><div class="apCard sk" aria-hidden="true"><div class="apPic"></div><div class="apLine" style="width:60%"></div><div class="apLine" style="width:40%"></div></div><div class="apNone" style="grid-column:span 2">Log in to this account once to add its pets. <button type="button" data-act="switch" data-a="${esc(a)}" title="Switch to ${esc(a)}">${USERS_ICON}<span>Switch account</span></button></div></div>`;
        else html += `<div class="apHead">${esc(a)}${star}<small>${pets.length}${pets.length !== e.pets.length ? ' / ' + e.pets.length : ''} pets · last seen ${fmtAgo(e.t)}</small></div>` + (pets.length ? `<div class="apGrid">${pets.map(p => card(p, a)).join('')}</div>` : '');
      });
    } else {
      const all = [];
      shown.forEach(a => (c[a] ? c[a].pets : []).forEach(p => match(p) && all.push([p, a])));
      const k = apState.sort === 'species' ? (x) => (x[0].species + ' ' + x[0].name).toLowerCase() : (x) => x[0].name.toLowerCase();
      all.sort((x, y) => k(x) < k(y) ? -1 : k(x) > k(y) ? 1 : 0);
      html = all.length ? `<div class="apHead">${all.length} pets</div><div class="apGrid">${all.map(x => card(x[0], x[1])).join('')}</div>` : '';
    }
    $('.apBody', apEl).innerHTML = html || '<div class="apEmpty">No pets match. Try another filter, or clear the search.</div>';
  }

  // Passive collection: local reads only (no network). Runs shortly after load and when the data changes.
  setTimeout(apCollect, 2500); setTimeout(apCollect, 9000);
  setInterval(() => { if (!document.hidden) apCollect(); }, 30000);

  /* ───────────────────────────────── drawer ───────────────────────────────── */
  let MODE = 'standalone';
  const detectMode = () => {
    MODE = document.getElementById('npUser') ? 'modern' : 'standalone';   // main script present (with or without the core)
    return MODE;
  };

  let drawerEl = null, tabEl = null, open = false, acctTabRefresh = null;

  function buildDrawer() {
    const drawer = document.createElement('div');
    drawer.id = 'nppAcctDrawer';
    drawer.innerHTML =
      '<div class="nppAcctHead"><div class="nppAcctHeadL"><span class="nppAcctTitle">Accounts</span></div>' +
      (MODE === 'modern'
        ? '<a class="nppAcctSwap" href="' + SWAP_URL + '" target="_blank" rel="noopener" title="Swap account: log out and go straight to the login page">' + USERS_ICON + '<span>Swap</span></a>'
        : '') +
      '</div>' +
      '<div class="nppAcctHint"></div>' +
      '<div class="nppAcctBody">' +
        '<section class="nppAcctSec"><div class="nppAcctSecHead"><span>NeoPass</span><em class="nppCntNp"></em></div><div class="nppAcctList" data-list="np"></div><div class="nppAcctNote" data-note="np"></div><button type="button" class="nppAcctSync">Sync from NeoPass</button><button type="button" class="nppAcctSync nppAcctAllPets">All Pets</button><div class="nppAcctMsg" data-msg="np"></div></section>' +
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
        const mine = n.toLowerCase() === me, isMain = n.toLowerCase() === main, removable = !autoSet.has(n.toLowerCase()) && !npSet.has(n.toLowerCase());
        const pr = readProf(n), av = pr && pr.avatar ? pr.avatar.replace(/["'\\\n\r()]/g, '') : '';
        const sub = mine ? (isMain ? 'You · Main account' : 'You') : (isMain ? 'Main account' : 'View profile');
        return `<div class="nppAcctRow${mine ? ' me' : ''}${isMain ? ' main' : ''}"><a class="nppAcctLink" href="https://www.neopets.com/userlookup.phtml?user=${encodeURIComponent(n)}" target="_blank" rel="noopener" title="View ${esc(n)}'s profile"><span class="nppAcctAv"${av ? ` style="background-image:url('${esc(av)}')"` : ''}>${av ? '' : esc(n.charAt(0).toUpperCase())}</span><span class="nppAcctTxt"><b>${esc(n)}</b><small>${esc(sub)}</small></span></a>${removable ? `<button type="button" class="nppAcctX" data-n="${esc(n)}" title="Remove (added by hand)" aria-label="Remove ${esc(n)}">×</button>` : ''}<button type="button" class="nppAcctStar" data-n="${esc(n)}" title="${isMain ? 'Main account (click to unset)' : 'Make this my main account'}" aria-label="${isMain ? 'Unset main account' : 'Make main account'}">${isMain ? '★' : '☆'}</button></div>`;
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
      if (open) { document.dispatchEvent(new CustomEvent('npp:drawer', { detail: 'accts' })); closeAdd(); render(); place(); msgNp.textContent = autoErr; msgEx.textContent = ''; }
      drawer.classList.toggle('open', open);
      if (tabEl) tabEl.classList.toggle('on', open);
    };

    tabEl.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); });
    document.addEventListener('pointerdown', (e) => { if (open && !e.target.closest('#nppAcctDrawer, #nppAcctTab, #nppStandaloneAcctToggle')) setOpen(false); }, true);
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
      const logoutLink = q('.nppAcctStandaloneFoot a.nppLogout');
      const swapLink = q('.nppAcctStandaloneFoot a.nppSwap');
      if (swapLink) swapLink.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        swapAccount(() => { swapLink.classList.add('busy'); }, () => { swapLink.classList.remove('busy'); });
      });
      if (logoutLink) logoutLink.addEventListener('click', () => clearNotifCaches());
    }

    q('.nppAcctAllPets').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); openAllPets(); });
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
      writeManual(readManual().filter(n => n.toLowerCase() !== x.dataset.n.toLowerCase()));
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
      side.appendChild(wrap);
    }

    drawerEl = buildDrawer();
    wireDrawer(drawerEl);

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
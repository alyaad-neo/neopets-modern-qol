// ==UserScript==
// @name         Neopets - Recently Viewed + Pin Pages
// @namespace    neopets-qol-patcher
// @version      1.0.9
// @description  Neopets recent-pages history and pins. Works standalone (floating panel) or alongside the Modern Interface patcher (sidebar cards).
// @match        *://*.neopets.com/*
// @run-at       document-start
// @exclude      *://www.neopets.com/
// @exclude      *://www.neopets.com/index.phtml*
// @exclude      *://www.neopets.com/login*
// @exclude      *://www.neopets.com/logout*
// @exclude      *://www.neopets.com/loginpage.phtml*
// @exclude      *://www.neopets.com/signin*
// @exclude      *://www.neopets.com/neopass*
// @grant        none
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

  // Auth pages have nothing worth visiting.
  const isAuth = /^\/(log(in|out)[^/]*|loginpage\.phtml|signin|neopass|hub\/login|index\.phtml)(\/|\.|$)/i.test(path);
  if (isAuth) return;

  /* ───────────────────────────────── constants ───────────────────────────────── */
  const RECENT_KEY = 'nq_recent_v3';
  const PIN_KEY_OLD = 'nq_recent_pins_v1';
  const BOARD_NAMES_KEY = 'nq_board_names_v1';
  const RECENT_MAX = 10;
  const GENERIC_NB = /^(neoboards?|reply to this topic|post a reply|quick reply|neopets|home)$/i;
  const PIN_SVG = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M9.8 1.5 14.5 6.2l-1.4 1.4-.7-.7L9.5 9.7v3.1l-1.4 1.4-2.5-2.5-3.6 3.6-.7-.7 3.6-3.6-2.5-2.5L3.4 8.7h3.1L10.5 4l-.7-.7z"/></svg>';
  const PIN_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 2h6l-1 4 2 2v1H4V8l2-2-1-4zM8 9v5"/></svg>';

  const curUser = () => String(W.appInsightsUserName || LSget('nq_hud_username') || '').trim();

  /* ───────────────────────────────── CSS ───────────────────────────────── */
  const RECENT_CSS = `
#nqRecent, #nqPinned { display: flex; flex-direction: column; gap: 6px; padding: 10px 11px; box-sizing: border-box; width: 100%; flex: 0 0 auto; position: relative; z-index: 1; }
#nqRecent .rHead, #nqPinned .rHead { font: 700 11px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.85); padding: 0 2px 2px; }
#nqRecent .rList, #nqPinned .rList { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; max-height: 106px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.35) transparent; padding-right: 3px; }
#nqRecent .rList li, #nqPinned .rList li { min-width: 0; position: relative; }
#nqRecent .rPin, #nqPinned .rPin { position: absolute; top: 50%; right: 4px; transform: translateY(-50%); width: 22px; height: 22px; padding: 0; border: 0; border-radius: 7px; background: rgba(40,36,56,.92); pointer-events: none; color: rgba(255,255,255,.45); display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: opacity .15s, background .15s, color .15s; }
#nqRecent .rList li:hover .rPin, #nqRecent .rPin:focus, #nqPinned .rList li:hover .rPin, #nqPinned .rPin:focus { opacity: 1; pointer-events: auto; }
#nqRecent li.isPinned .rPin, #nqPinned li.isPinned .rPin { color: #ffd166; }
#nqRecent .rPin:hover, #nqPinned .rPin:hover { background: rgba(255,255,255,.14); color: #fff; }
#nqRecent .rPin svg, #nqPinned .rPin svg { width: 13px; height: 13px; }
#nqRecent .rList a, #nqPinned .rList a { display: flex; flex-direction: column; gap: 1px; padding: 6px 8px; border-radius: 9px; background: rgba(255,255,255,.07); color: #fff !important; text-decoration: none !important; min-width: 0; }
#nqRecent .rList a:hover, #nqPinned .rList a:hover { background: rgba(255,255,255,.16); }
#nqRecent .rList b, #nqPinned .rList b { font: 600 12px/1.25 'Outfit', system-ui, sans-serif; white-space: normal; overflow-wrap: anywhere; }
#nqRecent .rEmpty, #nqPinned .rEmpty { font: 500 11px/1.3 'Outfit', system-ui, sans-serif; color: rgba(255,255,255,.6); padding: 4px 2px; }
#nqPinned[hidden] { display: none !important; }
#nqPinned { background: rgba(255,209,102,.07); border: 1px solid rgba(255,209,102,.22); border-radius: 12px; box-shadow: inset 3px 0 0 #ffd166; }
#nqPinned .rHead { color: #ffd166; }

/* Combined Pinned / Recent module (sidebar) */
#nqPinsMod { box-sizing: border-box; width: 100%; min-width: 0; border-radius: 14px; background: var(--nq-card, rgba(20,18,28,.42)); border: 1px solid var(--nq-card-line, rgba(255,255,255,.14)); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); overflow: hidden; }
#nqPinsMod .pTabs { display: flex; gap: 4px; padding: 6px 6px 0; }
#nqPinsMod .pTabs button { flex: 1 1 0; min-width: 0; padding: 7px 4px; border: 0; border-radius: 9px 9px 0 0; background: transparent; color: rgba(255,255,255,.6); font: 700 11px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; border-bottom: 2px solid transparent; }
#nqPinsMod .pTabs button:hover { color: #fff; }
#nqPinsMod .pTabs button.on { color: #fff; background: rgba(255,255,255,.08); border-bottom-color: var(--nq-accent, #fff); }
#nqPinsMod .pTabs button[data-t="pinned"].on { color: #ffd166; border-bottom-color: #ffd166; }
#nqPinsMod #nqRecent, #nqPinsMod #nqPinned { background: transparent; border: 0; border-radius: 0; box-shadow: none; padding: 6px 8px 8px; -webkit-backdrop-filter: none; backdrop-filter: none; }
#nqPinsMod .rHead { display: none; }
#nqPinsMod[data-tab="pinned"] #nqRecent, #nqPinsMod[data-tab="recent"] #nqPinned { display: none !important; }
#nqPinsMod[data-tab="pinned"] #nqPinned[hidden] { display: flex !important; }
#nqPinsMod .rList { max-height: 90px; gap: 3px; overflow-y: auto; scrollbar-width: thin; }
#nqPinsMod .rList:empty::before { content: "Nothing here yet"; font: 500 11px/1.3 'Outfit', system-ui, sans-serif; color: rgba(255,255,255,.55); padding: 4px 2px; }
#nqPinsMod .rList li { flex: 0 0 auto; }
#nqPinsMod .rList a { box-sizing: border-box; height: 28px; justify-content: center; padding: 0 8px !important; }
#nqPinsMod .rList b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Fallback footer (modern interface without core) */
#nqRecentFoot { position: fixed; left: 0; bottom: 0; width: var(--nq-col-width, 240px); box-sizing: border-box; padding: 0 14px 12px; display: flex; flex-direction: column; gap: 8px; z-index: 1000; }

/* Standalone panel */
#nqStandaloneRecent { position: fixed; right: 20px; bottom: 20px; z-index: 2140; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; font: 500 13px 'Outfit', system-ui, sans-serif; }
#nqStandaloneRecent[data-stack="1"] { bottom: 74px; }
#nqStandaloneRecent[data-stack="2"] { bottom: 128px; }
#nqStandaloneRecent[data-stack="3"] { bottom: 182px; }
#nqStandaloneRecentToggle { display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(0,0,0,.16); background: #fff; color: #1f2937; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.18); }
#nqStandaloneRecentToggle:hover { background: #f3f4f6; }
#nqStandaloneRecentToggle svg { width: 18px; height: 18px; }
#nqStandaloneRecentPanel { display: none; width: 320px; max-height: 70vh; overflow-y: auto; padding: 10px; border-radius: 14px; background: #1a1722; color: #fff; box-shadow: 0 12px 34px rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,.14); }
#nqStandaloneRecent.open #nqStandaloneRecentPanel { display: block; }
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'nq-recent-css';
  styleEl.textContent = RECENT_CSS;
  (document.head || root).appendChild(styleEl);

  /* ───────────────────────────────── storage ───────────────────────────────── */
  const readAccts = () => { try { const a = JSON.parse(LSget('nq_accounts') || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch { return []; } };

  // Pins are per-account; the key is derived from the current user.
  const pinKey = () => { const u = (curUser() || '').toLowerCase(); return u ? 'nq_recent_pins_v1:' + u : null; };
  // One-time migration from the pre-account-key shared list.
  function migratePins() {
    const k = pinKey();
    if (!k || LSget(k) || !LSget(PIN_KEY_OLD)) return;
    LSset(k, LSget(PIN_KEY_OLD));
    LSdel(PIN_KEY_OLD);
  }
  function loadPins() { const k = pinKey(); if (!k) return []; migratePins(); try { const a = JSON.parse(LSget(k) || '[]'); return Array.isArray(a) ? a.filter(x => x && x.u) : []; } catch { return []; } }

  /* ───────────────────────────────── label logic ───────────────────────────────── */
  function boardNames() { try { return JSON.parse(LSget(BOARD_NAMES_KEY) || '{}') || {}; } catch { return {}; } }
  function boardName(id) { return boardNames()[String(id)] || ''; }
  function saveBoardNames() {
    const sel = document.querySelector('select[name="board_id"]');
    if (!sel) return;
    const map = boardNames();
    [...sel.options].forEach(o => { const t = (o.textContent || '').trim(); if (o.value && t) map[o.value] = t; });
    LSset(BOARD_NAMES_KEY, JSON.stringify(map));
  }
  function labelFromUrl(href) {
    let u; try { u = new URL(href, 'https://www.neopets.com/'); } catch { return ''; }
    const q = u.searchParams, p = u.pathname.toLowerCase();
    if (/userlookup/.test(p) && q.get('user')) return 'User lookup: ' + q.get('user');
    if (/petlookup/.test(p) && q.get('pet')) return 'Pet lookup: ' + q.get('pet');
    if (/topic/.test(p) && q.get('topic')) return 'Neoboard topic ' + q.get('topic');
    if (/neoboard/.test(p) && q.get('board')) return boardName(q.get('board')) || 'Neoboard board ' + q.get('board');
    if (/browseshop/.test(p) && q.get('owner')) return 'Shop: ' + q.get('owner');
    if (/market/.test(p) && q.get('type') === 'your') return 'My Shop';
    if (/market/.test(p) && q.get('type') === 'till') return 'Shop Till';
    return '';
  }
  // Last-resort label from the URL path, e.g. /island/tradingpost.phtml -> "Tradingpost".
  function pathLabel(href) {
    let u; try { u = new URL(href, 'https://www.neopets.com/'); } catch { return ''; }
    const seg = u.pathname.split('/').filter(Boolean), last = (seg.pop() || '').replace(/\.(phtml|php|html?)$/i, '');
    const w = (last && last !== 'index' ? last : seg.pop() || '').replace(/[_-]+/g, ' ').trim();
    return w ? w.charAt(0).toUpperCase() + w.slice(1) : '';
  }
  // First real page heading outside the Modern Interface UI (old pages often have the plain title "Neopets").
  function mainHeading() {
    const UI = '#nqHud, #nqFoot, #nqLeftBar, #btnOverlay, #nqBgSidebar, #nq-host, #nqRecent, #nqPinned, #nqStandaloneRecent, #nqSideBtnHost, #nqAP, #nqAcctDrawer';
    for (const el of document.querySelectorAll('h1, h2')) {
      if (el.closest(UI)) continue;
      const x = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (x.length >= 3 && x.length <= 60 && !GENERIC_NB.test(x) && !/hold on/i.test(x)) return x;
    }
    return '';
  }
  function headingLabel() {
    if (!/neoboard/i.test(location.pathname)) return '';
    const UI = '#nqHud, #nqFoot, #nqLeftBar, #btnOverlay, #nqBgSidebar, #nq-host, #nqRecent, #nqStandaloneRecent, #nqSideBtnHost';
    for (const el of document.querySelectorAll('.topicTitle h1, .topicTitle, #boardTopic h1, #boardTopic h2, #boardTopic h3')) {
      if (el.closest(UI)) continue;
      const x = (el.textContent || '').replace(/\s+/g, ' ').replace(/^topic:\s*/i, '').trim();
      if (x.length >= 3 && x.length <= 160 && !GENERIC_NB.test(x) && !/hold on/i.test(x)) return x;
    }
    return '';
  }
  function pageLabel() {
    const fromUrl = labelFromUrl(location.href);
    const h = headingLabel();
    if (h) return h;
    if (/neoboard/i.test(location.pathname) && fromUrl) return fromUrl;
    if (fromUrl && /userlookup|petlookup/i.test(location.pathname)) return fromUrl;
    if (fromUrl && /browseshop|market/i.test(location.pathname)) return fromUrl;
    let t = (document.title || '').replace(/\s*[|\-–—]\s*Neopets.*$/i, '').replace(/^Neopets\s*[|\-–—:]\s*/i, '').trim();
    if (/^(hold on|neopets)$/i.test(t) || /^hold on/i.test(t)) t = '';
    return t || fromUrl || mainHeading() || pathLabel(location.href);
  }
  function recentLabel(href, t) {
    const fu = labelFromUrl(href), generic = !t || /^(hold on|neoboards?|neoboard (board|topic) \d)/i.test(t);
    return (/userlookup|petlookup/i.test(href) && fu) || (!generic ? t : fu) || t || href;
  }

  /* ───────────────────────────────── record + pin ───────────────────────────────── */
  function recordVisit() {
    saveBoardNames();
    {
      const u0 = location.href, t0 = recentLabel(u0, pageLabel());
      let pins = loadPins(), hit = false;
      pins = pins.map(p => {
        if (p.u === u0 || pinKeyOf(p) === t0.toLowerCase()) { hit = true; return { u: u0, t: t0, k: t0.toLowerCase() }; }
        return p;
      });
      const k = pinKey();
      if (hit && k) LSset(k, JSON.stringify(pins));
    }
    const title = pageLabel();
    if (!title) return;
    if (/^neopets$/i.test(title)) return;
    let rec = []; try { rec = JSON.parse(LSget(RECENT_KEY) || '[]') || []; } catch {}
    const u = location.href;
    const p = (location.pathname + location.search).slice(0, 70);
    const key = recentLabel(u, title).toLowerCase();
    rec = [{ u, t: title.slice(0, 160), p }, ...rec.filter(r => r && r.u !== u && recentLabel(r.u, r.t).toLowerCase() !== key)].slice(0, RECENT_MAX);
    LSset(RECENT_KEY, JSON.stringify(rec));
    refreshCards();
  }
  const pinKeyOf = (p) => (p.k || recentLabel(p.u, p.t)).toLowerCase();
  const pinMatches = (p, item) => p.u === item.u || pinKeyOf(p) === item.k;
  function togglePin(item) {
    if (!item) return;
    const k = pinKey(); if (!k) return;
    let pins = loadPins();
    if (pins.some(p => pinMatches(p, item))) pins = pins.filter(p => !pinMatches(p, item));
    else pins.push({ u: item.u, t: item.label, k: item.k });
    LSset(k, JSON.stringify(pins));
    refreshCards();
  }
  function pinItems() {
    const abs = (u) => { try { return new URL(u, 'https://www.neopets.com/').href; } catch { return u; } };
    return loadPins().map(r => { const href = abs(r.u), label = recentLabel(href, r.t); return { u: href, label, k: pinKeyOf({ ...r, u: href, t: r.t }) }; });
  }

  /* ───────────────────────────────── cards ───────────────────────────────── */
  function makeCard(id, head) {
    const card = document.createElement('div');
    card.id = id; card.className = 'nqCard';
    card.innerHTML = `<div class="rHead">${head}</div><ul class="rList"></ul>`;
    ['auxclick', 'contextmenu', 'pointerdown'].forEach(ev => card.addEventListener(ev, (e) => e.stopPropagation()));
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const b = e.target.closest && e.target.closest('.rPin');
      if (!b || !card._items) return;
      e.preventDefault();
      togglePin(card._items[+b.dataset.i]);
    });
    return card;
  }
  function rowsHtml(list, pinKeys, empty) {
    return list.length
      ? list.map((x, i) => {
        const pinned = pinKeys.has(x.k);
        return `<li class="${pinned ? 'isPinned' : ''}"><a href="${esc(x.u)}"><b>${esc(x.label)}</b></a><button type="button" class="rPin" data-i="${i}" title="${pinned ? 'Unpin' : 'Pin to keep this page'}" aria-label="${pinned ? 'Unpin' : 'Pin'}">${PIN_SVG}</button></li>`;
      }).join('')
      : `<li class="rEmpty">${empty}</li>`;
  }
  function setList(card, html) {
    const ul = card.querySelector('.rList');
    if (ul.dataset.html !== html) { ul.dataset.html = html; ul.innerHTML = html; }
  }
  function paintPinned(card) {
    const pins = pinItems();
    const keys = new Set(pins.map(x => x.k));
    card._items = pins;
    card.hidden = pins.length === 0;
    setList(card, rowsHtml(pins, keys, ''));
  }
  function paintRecent(card) {
    let rec = []; try { rec = JSON.parse(LSget(RECENT_KEY) || '[]') || []; } catch {}
    const abs = (u) => { try { return new URL(u, 'https://www.neopets.com/').href; } catch { return u; } };
    const item = (r) => { const href = abs(r.u), label = recentLabel(href, r.t); return { u: href, label, k: label.toLowerCase() }; };
    const generic = (x) => !labelFromUrl(x.u) && /^neopets\b/i.test(x.label);
    const pins = pinItems();
    const pinKeys = new Set(pins.map(x => x.k));
    const cur = abs(location.href), seen = new Set();
    const hist = rec.map(item).filter(x => {
      if (x.u === cur || pins.some(p => pinMatches(p, x)) || generic(x) || seen.has(x.k)) return false;
      seen.add(x.k); return true;
    }).slice(0, RECENT_MAX);
    card._items = hist;
    setList(card, rowsHtml(hist, pinKeys, 'No pages yet.'));
    card.dataset.painted = '1';
  }
  function refreshCards() {
    const pinned = $('#nqPinned'), card = $('#nqRecent');
    if (pinned) paintPinned(pinned);
    if (card) paintRecent(card);
  }

  /* ───────────────────────────────── mode detection ───────────────────────────────── */
  const hasFoot = () => !!document.getElementById('nqFoot');
  const hasSidebar = () => !!document.getElementById('nqLeftBar');
  const hasCard = () => !!document.getElementById('nqRecent');

  /* ───────────────────────────────── mount: sidebar cards ───────────────────────────────── */
  function mountSidebarCards() {
    // Cards already exist: only continue if they need moving from #nqRecentFoot into the core's #nqFoot.
    if (hasCard() && (!hasFoot() || $('#nqFoot #nqPinsMod'))) return;
    if (!document.body) return;

    let pinned = $('#nqPinned'), card = $('#nqRecent');
    if (!card) card = makeCard('nqRecent', 'Recently visited');
    if (!pinned) pinned = makeCard('nqPinned', 'Pinned');

    // Prefer #nqFoot (the core's footer); otherwise create a fallback footer container.
    let foot = $('#nqFoot');
    if (!foot) {
      foot = document.createElement('div');
      foot.id = 'nqRecentFoot';
      document.body.appendChild(foot);
    }
    let wrap = $('#nqPinsMod');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'nqPinsMod';
      wrap.dataset.tab = 'recent';
      wrap.innerHTML = '<div class="pTabs" role="tablist"><button type="button" role="tab" data-t="recent">Recent</button><button type="button" role="tab" data-t="pinned">Pinned</button></div>';
      const sync = () => wrap.querySelectorAll('.pTabs button').forEach(b => { const on = b.dataset.t === wrap.dataset.tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
      wrap.querySelector('.pTabs').addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        wrap.dataset.tab = b.dataset.t; sync();
      });
      wrap._sync = sync; sync();
    }
    if (pinned.parentNode !== wrap) wrap.appendChild(pinned);
    if (card.parentNode !== wrap) wrap.appendChild(card);
    if (wrap.parentNode !== foot) foot.appendChild(wrap);
    const tmp = $('#nqRecentFoot'); if (tmp && tmp !== foot && !tmp.children.length) tmp.remove();
    refreshCards();
    if (!wrap._init) { wrap._init = 1; wrap.dataset.tab = pinned.hidden ? 'recent' : 'pinned'; if (wrap._sync) wrap._sync(); }

    // Refresh the "current page" tracking when the URL changes (some pages are single-page).
    const acct = (curUser() || '').toLowerCase();
    if (card.dataset.u !== location.href || card.dataset.acct !== acct) { card.dataset.u = location.href; card.dataset.acct = acct; refreshCards(); }
  }

  /* ───────────────────────────────── mount: standalone panel ───────────────────────────────── */
  function mountStandalone() {
    if (document.getElementById('nqStandaloneRecent')) return;
    if (!document.body) return;

    const wrap = document.createElement('div');
    wrap.id = 'nqStandaloneRecent';
    wrap.innerHTML = `
      <button type="button" id="nqStandaloneRecentToggle">${PIN_ICON}<span>Recent</span></button>
      <div id="nqStandaloneRecentPanel">
        <div id="nqRecent"></div>
        <div id="nqPinned"></div>
      </div>`;
    document.body.appendChild(wrap);
    const toggle = wrap.querySelector('#nqStandaloneRecentToggle');
    toggle.addEventListener('click', (e) => { e.preventDefault(); wrap.classList.toggle('open'); if (wrap.classList.contains('open')) refreshCards(); });

    // Build the two cards inside the panel.
    const panel = wrap.querySelector('#nqStandaloneRecentPanel');
    const pinned = makeCard('nqPinned', 'Pinned');
    const recent = makeCard('nqRecent', 'Recently visited');
    panel.innerHTML = '';
    panel.appendChild(pinned);
    panel.appendChild(recent);
    refreshCards();

    // Dismiss on outside click.
    document.addEventListener('pointerdown', (e) => {
      if (!wrap.classList.contains('open')) return;
      if (!e.target.closest('#nqStandaloneRecent')) wrap.classList.remove('open');
    }, true);

    // Stack above the dailies / accounts buttons when they exist.
    const restack = () => {
      let n = 0;
      if (document.getElementById('nqStandaloneAcct')) n++;
      if (document.getElementById('nqDailiesRoot')) n++;
      wrap.dataset.stack = String(Math.min(3, n));
    };
    restack();
    watchDoc(restack);

    // When the modern interface / core appear, swap to sidebar cards.
    const swapToSidebar = () => {
      if (hasCard()) return;
      if (hasFoot() || hasSidebar()) {
        wrap.remove();
        mountSidebarCards();
      }
    };
    watchDoc(swapToSidebar);
  }

  /* ───────────────────────────────── boot ───────────────────────────────── */
  // One shared whole-document observer for the idempotent mount/check callbacks below (rAF-throttled).
  const docFns = []; let docRaf = 0; let docMo = null;
  function watchDoc(fn) {
    docFns.push(fn);
    if (docMo) return;
    docMo = new MutationObserver(() => { if (docRaf) return; docRaf = requestAnimationFrame(() => { docRaf = 0; docFns.slice().forEach(f => f()); }); });
    docMo.observe(document.documentElement, { childList: true, subtree: true });
  }
  function mount() {
    if (hasFoot() || hasSidebar()) mountSidebarCards();
    else mountStandalone();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();

  // If the core appears later (its footer element), swap to sidebar cards.
  // Also re-mount when the core's #nqFoot shows up after we fell back to #nqRecentFoot (fixed, overlaps the sidebar).
  watchDoc(() => { if ((!hasCard() && (hasFoot() || hasSidebar())) || (hasFoot() && !document.querySelector('#nqFoot #nqPinsMod'))) mount(); });

  // Record the current page. The core used to do this at 1.5s / 4s / 8s.
  [1500, 4000, 8000].forEach(ms => setTimeout(recordVisit, ms));

  // Neoboards topic headings can arrive late; record once they exist.
  if (/neoboard/i.test(path)) {
    let done = false;
    const mo = new MutationObserver(() => { if (!done && headingLabel()) { done = true; recordVisit(); mo.disconnect(); } });
    const watch = () => { if (document.body) mo.observe(document.body, { childList: true, subtree: true, characterData: true }); else setTimeout(watch, 100); };
    watch();
    setTimeout(() => mo.disconnect(), 60000);
  }

  // Some pages re-render on "nq:main" — re-render the cards.
  document.addEventListener('nq:main', refreshCards);

  // Optional console helper: neopetsResetPins() clears the pin list.
  try { W.neopetsResetPins = () => { const k = pinKey(); if (k) LSdel(k); refreshCards(); }; } catch {}
})();
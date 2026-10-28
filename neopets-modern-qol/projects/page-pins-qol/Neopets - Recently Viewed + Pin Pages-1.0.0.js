// ==UserScript==
// @name         Neopets - Recently Viewed + Pin Pages
// @namespace    neopets-qol-patcher
// @version      1.0.3
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
  const RECENT_KEY = 'npp_recent_v3';
  const PIN_KEY_OLD = 'npp_recent_pins_v1';
  const BOARD_NAMES_KEY = 'npp_board_names_v1';
  const RECENT_MAX = 10;
  const GENERIC_NB = /^(neoboards?|reply to this topic|post a reply|quick reply|neopets|home)$/i;
  const PIN_SVG = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M9.8 1.5 14.5 6.2l-1.4 1.4-.7-.7L9.5 9.7v3.1l-1.4 1.4-2.5-2.5-3.6 3.6-.7-.7 3.6-3.6-2.5-2.5L3.4 8.7h3.1L10.5 4l-.7-.7z"/></svg>';
  const PIN_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 2h6l-1 4 2 2v1H4V8l2-2-1-4zM8 9v5"/></svg>';

  const curUser = () => String(W.appInsightsUserName || LSget('npqol_hud_username') || '').trim();

  /* ───────────────────────────────── CSS ───────────────────────────────── */
  const RECENT_CSS = `
#nppRecent, #nppPinned { display: flex; flex-direction: column; gap: 6px; padding: 10px 11px; box-sizing: border-box; width: 100%; flex: 0 0 auto; position: relative; z-index: 1; }
#nppRecent .rHead, #nppPinned .rHead { font: 700 11px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.85); padding: 0 2px 2px; }
#nppRecent .rList, #nppPinned .rList { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; max-height: 106px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.35) transparent; padding-right: 3px; }
#nppRecent .rList li, #nppPinned .rList li { min-width: 0; position: relative; }
#nppRecent .rList a, #nppPinned .rList a { padding-right: 30px !important; }
#nppRecent .rPin, #nppPinned .rPin { position: absolute; top: 50%; right: 5px; transform: translateY(-50%); width: 22px; height: 22px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: rgba(255,255,255,.45); display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: opacity .15s, background .15s, color .15s; }
#nppRecent .rList li:hover .rPin, #nppRecent .rPin:focus, #nppRecent li.isPinned .rPin, #nppPinned .rList li:hover .rPin, #nppPinned .rPin:focus, #nppPinned li.isPinned .rPin { opacity: 1; }
#nppRecent li.isPinned .rPin, #nppPinned li.isPinned .rPin { color: #ffd166; }
#nppRecent .rPin:hover, #nppPinned .rPin:hover { background: rgba(255,255,255,.14); color: #fff; }
#nppRecent .rPin svg, #nppPinned .rPin svg { width: 13px; height: 13px; }
#nppRecent .rList a, #nppPinned .rList a { display: flex; flex-direction: column; gap: 1px; padding: 6px 8px; border-radius: 9px; background: rgba(255,255,255,.07); color: #fff !important; text-decoration: none !important; min-width: 0; }
#nppRecent .rList a:hover, #nppPinned .rList a:hover { background: rgba(255,255,255,.16); }
#nppRecent .rList b, #nppPinned .rList b { font: 600 12px/1.25 'Outfit', system-ui, sans-serif; white-space: normal; overflow-wrap: anywhere; }
#nppRecent .rEmpty, #nppPinned .rEmpty { font: 500 11px/1.3 'Outfit', system-ui, sans-serif; color: rgba(255,255,255,.6); padding: 4px 2px; }
#nppPinned[hidden] { display: none !important; }
#nppPinned { background: rgba(255,209,102,.07); border: 1px solid rgba(255,209,102,.22); border-radius: 12px; box-shadow: inset 3px 0 0 #ffd166; }
#nppPinned .rHead { color: #ffd166; }

/* Combined Pinned / Recent module (sidebar) */
#nppPinsMod { box-sizing: border-box; width: 100%; min-width: 0; border-radius: 14px; background: var(--npp-card, rgba(20,18,28,.42)); border: 1px solid var(--npp-card-line, rgba(255,255,255,.14)); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); overflow: hidden; }
#nppPinsMod .pTabs { display: flex; gap: 4px; padding: 6px 6px 0; }
#nppPinsMod .pTabs button { flex: 1 1 0; min-width: 0; padding: 7px 4px; border: 0; border-radius: 9px 9px 0 0; background: transparent; color: rgba(255,255,255,.6); font: 700 11px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; border-bottom: 2px solid transparent; }
#nppPinsMod .pTabs button:hover { color: #fff; }
#nppPinsMod .pTabs button.on { color: #fff; background: rgba(255,255,255,.08); border-bottom-color: var(--np-accent, #fff); }
#nppPinsMod .pTabs button[data-t="pinned"].on { color: #ffd166; border-bottom-color: #ffd166; }
#nppPinsMod #nppRecent, #nppPinsMod #nppPinned { background: transparent; border: 0; border-radius: 0; box-shadow: none; padding: 6px 8px 8px; -webkit-backdrop-filter: none; backdrop-filter: none; }
#nppPinsMod .rHead { display: none; }
#nppPinsMod[data-tab="pinned"] #nppRecent, #nppPinsMod[data-tab="recent"] #nppPinned { display: none !important; }
#nppPinsMod[data-tab="pinned"] #nppPinned[hidden] { display: flex !important; }
#nppPinsMod .rList { max-height: 90px; gap: 3px; overflow-y: auto; scrollbar-width: thin; }
#nppPinsMod .rList:empty::before { content: "Nothing here yet"; font: 500 11px/1.3 'Outfit', system-ui, sans-serif; color: rgba(255,255,255,.55); padding: 4px 2px; }
#nppPinsMod .rList li { flex: 0 0 auto; }
#nppPinsMod .rList a { box-sizing: border-box; height: 28px; justify-content: center; padding: 0 30px 0 8px !important; }
#nppPinsMod .rList b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Fallback footer (modern interface without core) */
#nppRecentFoot { position: fixed; left: 0; bottom: 0; width: var(--np-col-width, 240px); box-sizing: border-box; padding: 0 14px 12px; display: flex; flex-direction: column; gap: 8px; z-index: 1000; }

/* Standalone panel */
#nppStandaloneRecent { position: fixed; right: 20px; bottom: 20px; z-index: 2140; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; font: 500 13px 'Outfit', system-ui, sans-serif; }
#nppStandaloneRecent[data-stack="1"] { bottom: 74px; }
#nppStandaloneRecent[data-stack="2"] { bottom: 128px; }
#nppStandaloneRecent[data-stack="3"] { bottom: 182px; }
#nppStandaloneRecentToggle { display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(0,0,0,.16); background: #fff; color: #1f2937; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.18); }
#nppStandaloneRecentToggle:hover { background: #f3f4f6; }
#nppStandaloneRecentToggle svg { width: 18px; height: 18px; }
#nppStandaloneRecentPanel { display: none; width: 320px; max-height: 70vh; overflow-y: auto; padding: 10px; border-radius: 14px; background: #1a1722; color: #fff; box-shadow: 0 12px 34px rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,.14); }
#nppStandaloneRecent.open #nppStandaloneRecentPanel { display: block; }
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'npp-recent-css';
  styleEl.textContent = RECENT_CSS;
  (document.head || root).appendChild(styleEl);

  /* ───────────────────────────────── storage ───────────────────────────────── */
  const readAccts = () => { try { const a = JSON.parse(LSget('npp_accounts') || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch { return []; } };

  // Pins are per-account; the key is derived from the current user.
  const pinKey = () => { const u = (curUser() || '').toLowerCase(); return u ? 'npp_recent_pins_v1:' + u : null; };
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
    return '';
  }
  function headingLabel() {
    if (!/neoboard/i.test(location.pathname)) return '';
    const UI = '#npHud, #nppFoot, #npLeftBar, #btnOverlay, #npBgSidebar, #npx-host, #nppRecent, #nppStandaloneRecent, #npxSideBtnHost';
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
    let t = (document.title || '').replace(/\s*[|\-–—]\s*Neopets.*$/i, '').trim();
    if (/^hold on/i.test(t)) t = '';
    return t || fromUrl;
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
    if (!labelFromUrl(location.href) && /^neopets\b/i.test(title)) return;
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
    card.id = id; card.className = 'npCard';
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
    const pinned = $('#nppPinned'), card = $('#nppRecent');
    if (pinned) paintPinned(pinned);
    if (card) paintRecent(card);
  }

  /* ───────────────────────────────── mode detection ───────────────────────────────── */
  const hasFoot = () => !!document.getElementById('nppFoot');
  const hasSidebar = () => !!document.getElementById('npLeftBar');
  const hasCard = () => !!document.getElementById('nppRecent');

  /* ───────────────────────────────── mount: sidebar cards ───────────────────────────────── */
  function mountSidebarCards() {
    // Cards already exist: only continue if they need moving from #nppRecentFoot into the core's #nppFoot.
    if (hasCard() && (!hasFoot() || $('#nppFoot #nppPinsMod'))) return;
    if (!document.body) return;

    let pinned = $('#nppPinned'), card = $('#nppRecent');
    if (!card) card = makeCard('nppRecent', 'Recently visited');
    if (!pinned) pinned = makeCard('nppPinned', 'Pinned');

    // Prefer #nppFoot (the core's footer); otherwise create a fallback footer container.
    let foot = $('#nppFoot');
    if (!foot) {
      foot = document.createElement('div');
      foot.id = 'nppRecentFoot';
      document.body.appendChild(foot);
    }
    const clock = $('#nppBottom', foot);
    let wrap = $('#nppPinsMod');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'nppPinsMod';
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
    if (wrap.parentNode !== foot) foot.insertBefore(wrap, clock || null);
    const tmp = $('#nppRecentFoot'); if (tmp && tmp !== foot && !tmp.children.length) tmp.remove();
    refreshCards();
    if (!wrap._init) { wrap._init = 1; wrap.dataset.tab = pinned.hidden ? 'recent' : 'pinned'; if (wrap._sync) wrap._sync(); }

    // Refresh the "current page" tracking when the URL changes (some pages are single-page).
    const acct = (curUser() || '').toLowerCase();
    if (card.dataset.u !== location.href || card.dataset.acct !== acct) { card.dataset.u = location.href; card.dataset.acct = acct; refreshCards(); }
  }

  /* ───────────────────────────────── mount: standalone panel ───────────────────────────────── */
  function mountStandalone() {
    if (document.getElementById('nppStandaloneRecent')) return;
    if (!document.body) return;

    const wrap = document.createElement('div');
    wrap.id = 'nppStandaloneRecent';
    wrap.innerHTML = `
      <button type="button" id="nppStandaloneRecentToggle">${PIN_ICON}<span>Recent</span></button>
      <div id="nppStandaloneRecentPanel">
        <div id="nppRecent"></div>
        <div id="nppPinned"></div>
      </div>`;
    document.body.appendChild(wrap);
    const toggle = wrap.querySelector('#nppStandaloneRecentToggle');
    toggle.addEventListener('click', (e) => { e.preventDefault(); wrap.classList.toggle('open'); if (wrap.classList.contains('open')) refreshCards(); });

    // Build the two cards inside the panel.
    const panel = wrap.querySelector('#nppStandaloneRecentPanel');
    const pinned = makeCard('nppPinned', 'Pinned');
    const recent = makeCard('nppRecent', 'Recently visited');
    panel.innerHTML = '';
    panel.appendChild(pinned);
    panel.appendChild(recent);
    refreshCards();

    // Dismiss on outside click.
    document.addEventListener('pointerdown', (e) => {
      if (!wrap.classList.contains('open')) return;
      if (!e.target.closest('#nppStandaloneRecent')) wrap.classList.remove('open');
    }, true);

    // Stack above the dailies / accounts buttons when they exist.
    const restack = () => {
      let n = 0;
      if (document.getElementById('nppStandaloneAcct')) n++;
      if (document.getElementById('nppDailiesRoot')) n++;
      wrap.dataset.stack = String(Math.min(3, n));
    };
    restack();
    new MutationObserver(restack).observe(document.documentElement, { childList: true, subtree: true });

    // When the modern interface / core appear, swap to sidebar cards.
    const swapToSidebar = () => {
      if (hasCard()) return;
      if (hasFoot() || hasSidebar()) {
        wrap.remove();
        mountSidebarCards();
      }
    };
    new MutationObserver(swapToSidebar).observe(document.documentElement, { childList: true, subtree: true });
  }

  /* ───────────────────────────────── boot ───────────────────────────────── */
  function mount() {
    if (hasFoot() || hasSidebar()) mountSidebarCards();
    else mountStandalone();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();

  // If the core appears later (its footer element), swap to sidebar cards.
  // Also re-mount when the core's #nppFoot shows up after we fell back to #nppRecentFoot (fixed, overlaps the sidebar).
  new MutationObserver(() => { if ((!hasCard() && (hasFoot() || hasSidebar())) || (hasFoot() && !document.querySelector('#nppFoot #nppPinsMod'))) mount(); }).observe(document.documentElement, { childList: true, subtree: true });

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

  // Some pages re-render on "npp:main" — re-render the cards.
  document.addEventListener('npp:main', refreshCards);

  // Optional console helper: neopetsResetPins() clears the pin list.
  try { W.neopetsResetPins = () => { const k = pinKey(); if (k) LSdel(k); refreshCards(); }; } catch {}
})();
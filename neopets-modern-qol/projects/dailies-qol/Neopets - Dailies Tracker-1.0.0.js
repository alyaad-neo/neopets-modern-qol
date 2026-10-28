// ==UserScript==
// @name         Neopets - Dailies Tracker
// @namespace    neopets-qol-patcher
// @version      1.0.11
// @description  Neopets dailies: cooldowns, JellyNeo windows (Symol Hole / Tarla's Toolbar), Snowager, Qasalan Expellibox, plus a floating dailies panel and a sidebar card when the Modern Interface is installed.
// @match        *://*.neopets.com/*
// @match        *://ncmall.neopets.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      www.jellyneo.net
// @connect      ncmall.neopets.com
// ==/UserScript==

(function () {
  'use strict';

  if (window.top !== window) return;
  if (!/^(www\.|ncmall\.)?neopets\.com$/i.test(location.hostname)) return;

  const W = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
  const root = document.documentElement;
  const path = location.pathname.toLowerCase();
  const LSget = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
  const LSset = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const LSdel = (k) => { try { localStorage.removeItem(k); } catch {} };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const isPopup = /popup/.test(path) || (!!window.opener && window.outerWidth < 900);
  if (isPopup && !/^\/games\/giveaway(\/|$)/i.test(path)) return;   // the Expellibox popup still gets its result panel
  const isNc = location.hostname.toLowerCase() === 'ncmall.neopets.com';

  /* ═══════════════════════════════ dailies data ═══════════════════════════════ */

  const PREMIUM_CD = {
    'Terror Mountain Kiosk': 6, 'Deserted Fairground Kiosk': 2, 'Lost Desert Kiosk': 4, 'Coltzan\'s Shrine': 12,
    'Wheel of Starlight': 'nst', 'Wheel of Excitement': 2, 'Wheel of Mediocrity': 2, 'Wheel of Misfortune': 2,
    'Wheel of Monotony': 'nst', 'Wheel of Knowledge': 'nst', 'Giant Omelette': 'nst', 'Giant Jelly': 'nst', 'Tombola': 'nst',
    'Grumpy King': 'nst', 'Trudy\'s Surprise': 'nst', 'Fishing': 'nst', 'Fruit Machine': 'nst', 'Coconut Shy': 'nst',
    'Cheeseroller': 'nst', 'Rubbish Dump': 'nst', 'Buried Treasure': 'nst', 'Anchor Management': 'nst',
    'Meteor Crash Site': 1, 'Edna the Witch': 'nst', 'Bank Interest': 'nst', 'Healing Springs': 0.5, 'Test Your Strength': 6,
    'Apple Bobbing': 'nst', 'Tarla\'s Toolbar': 'nst', 'Symol Hole': 1, 'Qasalan Expellibox': (7 * 60 + 7) / 60,
  };
  const CD_ON_CLICK = new Set(['Trudy\'s Surprise', 'Fruit Machine', 'Meteor Crash Site']);

  const TRUDY = "Trudy's Surprise";
  const QAS = 'Qasalan Expellibox';
  const QASALAN_ITEM = [QAS, 'https://ncmall.neopets.com/games/giveaway/process_giveaway.phtml'];
  const GIFT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 14h18M12 9C10.5 5.5 7 5 7 7.2 7 8.6 9 9 12 9zm0 0c1.5-3.5 5-4 5-1.8 0 1.4-2 1.8-5 1.8z"/></svg>';
  const SNOWFLAKE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M3.5 17l17-10M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5M2.5 10.5l3.6.8-1 3.5M21.5 10.5l-3.6.8 1 3.5"/></svg>';
  const HOLE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>';

  const CD_KEY = 'nq_cd_v1', SEEN_KEY = 'nq_cd_seen_v1', ACK_KEY = 'nq_ack_v1', ACK_MS = 30 * 60 * 1000;
  const cdLoad = () => { try { return JSON.parse(LSget(CD_KEY) || '{}') || {}; } catch { return {}; } };
  const seenLoad = () => { try { const a = JSON.parse(LSget(SEEN_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };
  const cdSet = (name, ts, approx) => {
    const o = cdLoad();
    if (ts) {
      o[name] = ts; if (approx) o['~' + name] = 1; else delete o['~' + name];
      const sn = seenLoad(); if (!sn.includes(name)) { sn.push(name); LSset(SEEN_KEY, JSON.stringify(sn)); }
    } else { delete o[name]; delete o['~' + name]; }
    LSset(CD_KEY, JSON.stringify(o));
  };
  const ackLoad = () => { try { return JSON.parse(LSget(ACK_KEY) || '{}') || {}; } catch { return {}; } };
  const ackSet = (k, v) => { const o = ackLoad(); o[k] = v; LSset(ACK_KEY, JSON.stringify(o)); };
  const isAcked = (name) => { const t = ackLoad()[name]; return typeof t === 'number' && Date.now() - t < ACK_MS; };
  const nstParts = (ms) => {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date(ms));
    const g = (t) => p.find(x => x.type === t).value;
    return { d: `${g('year')}-${g('month')}-${g('day')}`, s: (+g('hour') % 24) * 3600 + (+g('minute')) * 60 + (+g('second')) };
  };
  const cdLeft = (name, ts) => {
    const c = PREMIUM_CD[name];
    if (c == null) return 0;
    if (c === 'nst') { const a = nstParts(ts), b = nstParts(Date.now()); return a.d === b.d ? (86400 - b.s) * 1000 : 0; }
    return Math.max(0, ts + c * 3600e3 - Date.now());
  };
  const cdText = (ms) => { const m = Math.max(1, Math.ceil(ms / 60000)), h = Math.floor(m / 60); return h ? `${h}h ${m % 60}m` : `${m}m`; };

  /* ─── Snowager ─── */
  const SNOW_HOURS = [6, 14, 22];
  function snowagerState(ms = Date.now()) {
    const s = nstParts(ms).s;
    for (const h of SNOW_HOURS) if (s >= h * 3600 && s < (h + 1) * 3600) return { asleep: true, secs: (h + 1) * 3600 - s };
    const next = SNOW_HOURS.map(h => h * 3600).find(t => t > s);
    return { asleep: false, secs: (next != null ? next : 86400 + SNOW_HOURS[0] * 3600) - s };
  }
  const snowWindowId = (st) => String(Math.round((Date.now() + st.secs * 1000) / 60000));
  const snowAcked = (st) => !!st.asleep && ackLoad()['~snow'] === snowWindowId(st);
  const ackSnow = () => { const st = snowagerState(); if (st.asleep) ackSet('~snow', snowWindowId(st)); };
  const snowText = (t) => { const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), sec = t % 60; return h ? `${h}h ${m}m` : m ? `${m}m ${String(sec).padStart(2, '0')}s` : `${sec}s`; };
  function snowBadge(st) {
    return st.asleep
      ? { text: `Asleep · ${snowText(st.secs)}`, title: `Asleep — wakes in ${snowText(st.secs)}` }
      : { text: snowText(st.secs), title: `Sleeps again in ${snowText(st.secs)} (asleep 6am, 2pm and 10pm NST, one hour each)` };
  }
  function snowRowHTML() {
    const st = snowagerState(), b = snowBadge(st);
    return `<a class="nqSnowRow" href="https://www.neopets.com/winter/snowager.phtml"><span>Snowager</span><em class="nqSnowBadge${st.asleep ? ' asleep' : ''}" title="${b.title}">${b.text}</em></a>`;
  }

  /* ─── JellyNeo windows: Symol Hole, Tarla's Toolbar ─── */
  const SYM_KEY = 'nq_symol_v1', SYM_TRY = 'nq_symol_try', SYM_ST = 'nq_symol_status';
  const TARLA_KEY = 'nq_tarla_v1';
  const symolLoad = () => { try { const o = JSON.parse(LSget(SYM_KEY) || 'null'); return o && o.d === nstParts(Date.now()).d && o.len > 0 ? o : null; } catch { return null; } };
  const tarlaLoad = () => { try { const o = JSON.parse(LSget(TARLA_KEY) || 'null'); return o && o.d === nstParts(Date.now()).d && o.len > 0 ? o : null; } catch { return null; } };
  function parseAlertWindow(html, labelRe) {
    const t = String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
    const re = new RegExp(labelRe.source + '\\s*(?:prize\\s+)?window[^0-9]{0,80}?(\\d{1,2}):(\\d{2}):(\\d{2})\\s*([AP]M)[^0-9]{0,40}?(\\d{1,2}):(\\d{2}):(\\d{2})\\s*([AP]M)', 'i');
    const m = re.exec(t);
    if (!m) return null;
    const start = (+m[1]) * 60 + (+m[2]); let len = (+m[5]) * 60 + (+m[6]) + 1 - start; if (len <= 0) len += 3600;
    return len > 0 && len <= 900 ? { start, len } : null;
  }
  const parseSymol = (html) => parseAlertWindow(html, /symol\s+hole/i);
  const parseTarla = (html) => parseAlertWindow(html, /tarla[’']?s\s+toolbar/i);
  function symolState(sym, ms = Date.now()) {
    const np = nstParts(ms), hour = Math.floor(np.s / 3600), inHour = np.s % 3600, end = sym.start + sym.len;
    if (inHour >= sym.start && inHour < end) return { open: true, secs: end - inHour, id: np.d + ':' + hour };
    return inHour < sym.start ? { open: false, secs: sym.start - inHour, id: np.d + ':' + hour } : { open: false, secs: 3600 - inHour + sym.start, id: np.d + ':' + (hour + 1) };
  }
  let symBusy = false;
  function symolEnsure() {
    if (symBusy || typeof GM_xmlhttpRequest !== 'function') return;
    const today = nstParts(Date.now()).d;
    const haveBoth = symolLoad() && (() => { try { const o = JSON.parse(LSget(TARLA_KEY) || 'null'); return o && o.d === today && o.len > 0; } catch { return false; } })();
    if (haveBoth) return;
    if (Date.now() - (parseInt(LSget(SYM_TRY), 10) || 0) < 3600e3) return;
    symBusy = true; LSset(SYM_TRY, String(Date.now()));
    GM_xmlhttpRequest({ method: 'GET', url: 'https://www.jellyneo.net/', timeout: 20000, headers: { Accept: 'text/html' },
      onload: (r) => {
        symBusy = false;
        if (r.status && r.status !== 200) { LSset(SYM_ST, 'JellyNeo answered ' + r.status); return; }
        const sw = parseSymol(r.responseText), tw = parseTarla(r.responseText), d = nstParts(Date.now()).d;
        if (sw) LSset(SYM_KEY, JSON.stringify({ d, start: sw.start, len: sw.len }));
        if (tw) LSset(TARLA_KEY, JSON.stringify({ d, start: tw.start, len: tw.len }));
        LSset(SYM_ST, sw || tw ? 'ok' : 'JellyNeo’s page had no Symol Hole or Tarla window');
        if (!sw && !tw) { try { console.warn('[dailies] Daily alerts:', LSget(SYM_ST)); } catch {} }
      },
      onerror: () => { symBusy = false; LSset(SYM_ST, 'the request to JellyNeo was blocked (allow www.jellyneo.net for this userscript)'); },
      ontimeout: () => { symBusy = false; LSset(SYM_ST, 'the request to JellyNeo timed out'); } });
  }

  /* ─── Qasalan Expellibox (NC Mall) ─── */
  const NC_CD_KEY = 'nq_nc_cd';
  const curUser = () => String(W.appInsightsUserName || LSget('nq_hud_username') || '').trim();
  // Dailies only run on the main account (starred in the accounts drawer). No main set: run anyway.
  // The page sets appInsightsUserName late, so whenUser() polls for it (like the core's accountGuard).
  let acctUser = '';
  const onMain = () => { const m = LSget('nq_main_account').toLowerCase(); return !m || (!!acctUser && acctUser.toLowerCase() === m); };
  function whenUser(cb) {
    // The Expellibox result page is bare text and never sets appInsightsUserName: don't wait 10s for it.
    if (/^\/games\/giveaway(\/|$)/i.test(location.pathname)) { acctUser = LSget('nq_hud_username'); cb(); return; }
    let tries = 0;
    const iv = setInterval(() => {
      let u = ''; try { u = String(W.appInsightsUserName || '').trim(); } catch {}
      if (u || ++tries > 100) { clearInterval(iv); acctUser = u || LSget('nq_hud_username'); cb(); }
    }, 100);
  }
  document.addEventListener('nq:main', () => { if (!onMain()) ['nqDaily', 'nqDailiesRoot'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); }); });
  function ncShare(name, ts, approx) {
    if (typeof GM_getValue !== 'function' || typeof GM_setValue !== 'function') return;
    try { const o = JSON.parse(GM_getValue(NC_CD_KEY, '{}') || '{}'); o[curUser().toLowerCase() + '|' + name] = { t: ts, a: approx ? 1 : 0 }; GM_setValue(NC_CD_KEY, JSON.stringify(o)); } catch {}
  }
  function ncPull() {
    if (isNc || typeof GM_getValue !== 'function') return;
    try {
      const o = JSON.parse(GM_getValue(NC_CD_KEY, '{}') || '{}'), me = curUser().toLowerCase();
      if (!me) return;
      const store = cdLoad();
      Object.keys(o).forEach(k => {
        const i = k.indexOf('|'), u = k.slice(0, i), name = k.slice(i + 1), e = o[k];
        if (u !== me || PREMIUM_CD[name] == null || !e || !(e.t > 0)) return;
        if (cdLeft(name, e.t) > 0 && !(store[name] && cdLeft(name, store[name]) > 0)) cdSet(name, e.t, !!e.a);
      });
    } catch {}
  }
  const qasalanText = (raw) => {
    let x = String(raw || '');
    if (/(^|[\s&])success=\d/.test(x)) { x = x.replace(/\+/g, ' '); try { x = decodeURIComponent(x); } catch {} }
    return x;
  };
  function qasalanVerdict(raw) {
    const x = qasalanText(raw), sm = /(?:^|[\s&])success=(\d)/.exec(x);
    if (sm) return sm[1] === '1' ? 'ok' : (/tomorrow|already|come back|back later/i.test(x) ? 'done' : '');
    return /bring that scarab back tomorrow|back tomorrow and you can deposit/i.test(x) ? 'done' : '';
  }
  function parseGiveaway(raw) {
    const t = String(raw || '').trim();
    if (!/^[?&]?success=\d/.test(t)) return null;
    const i = t.indexOf('msg='), sm = /(?:^|[?&])success=(\d)/.exec(t);
    let msg = i >= 0 ? t.slice(i + 4).replace(/\+/g, ' ') : '';
    try { msg = decodeURIComponent(msg); } catch { try { msg = unescape(msg); } catch {} }
    return { ok: !!sm && sm[1] === '1', msg: msg.trim() };
  }
  const QAS_ICONS = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.8l5 5 10-11"/></svg>',
    done: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>',
    err: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };
  // The result page hides the Modern Interface header/sidebar, so the panel centres on the whole window.
  const QAS_CSS = `#nq-host, #nqHud, #nqFoot, #nqBgSidebar, #btnOverlay, #nqSideBtnHost { display: none !important; }
#nqQas { position: fixed; z-index: 1500; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(440px, calc(100vw - 40px)); box-sizing: border-box; padding: 0 0 22px; overflow: hidden; border-radius: 22px; background: #fff; box-shadow: 0 22px 60px rgba(0,0,0,.28), 0 0 0 1px rgba(0,0,0,.06); color: #1f2937; text-align: center; font: 500 15px/1.45 'Outfit', system-ui, sans-serif; animation: nqQasIn .35s ease; }
@keyframes nqQasIn { from { opacity: 0; transform: translate(-50%, calc(-50% + 8px)) scale(.97); } to { opacity: 1; transform: translate(-50%, -50%); } }
@keyframes nqQasFade { from { opacity: 0; } to { opacity: 1; } }
#nqQas.pop { left: 0; top: 0; transform: none; width: 100%; border-radius: 0; box-shadow: none; animation: nqQasFade .25s ease; }
#nqQas, #nqQas * { box-sizing: border-box; font-family: 'Outfit', system-ui, sans-serif; }
#nqQas .top { padding: 28px 24px 18px; background: linear-gradient(180deg, var(--c1), var(--c2)); color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.35); }
#nqQas.ok { --c1: #3cc774; --c2: #1f9e55; } #nqQas.done { --c1: #f6b73c; --c2: #e08a12; } #nqQas.err { --c1: #ef6b6b; --c2: #cf3b3b; }
#nqQas .ico { width: 62px; height: 62px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,.22); box-shadow: inset 0 0 0 2px rgba(255,255,255,.45); }
#nqQas .ico svg { width: 32px; height: 32px; filter: drop-shadow(0 1px 2px rgba(0,0,0,.3)); }
#nqQas h2 { margin: 0; font: 400 28px/1.1 'CafeteriaBlack', Georgia, serif; letter-spacing: .01em; }
#nqQas .msg { margin: 18px 22px 0; padding: 13px 16px; border-radius: 14px; background: #f3f4f6; color: #374151; font-size: 14.5px; }
#nqQas .next { margin: 12px 22px 0; color: #6b7280; font-size: 13px; font-weight: 600; }
#nqQas .btns { display: flex; gap: 10px; margin: 18px 22px 0; }
#nqQas .btns a { flex: 1; display: flex; align-items: center; justify-content: center; height: 44px; border-radius: 999px; border: 1px solid #e5e7eb; background: #fff; color: #1f2937; font-weight: 700; font-size: 14px; text-decoration: none; transition: background .15s, transform .15s; }
#nqQas .btns a:hover { background: #f3f4f6; transform: translateY(-1px); }
#nqQas .btns a.go { border: 0; background: linear-gradient(180deg, var(--c1), var(--c2)); color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.3); }
#nqQas .btns a.go:hover { filter: brightness(1.06); background: linear-gradient(180deg, var(--c1), var(--c2)); }`;
  function qasalanPanel(res) {
    if (!document.body || document.getElementById('nqQas')) return;
    const done = !res.ok && /tomorrow|already|come back|back later/i.test(res.msg);
    const kind = res.ok ? 'ok' : done ? 'done' : 'err';
    const title = res.ok ? 'Success!' : done ? 'Done for today' : 'That didn’t work';
    const pop = isPopup;   // opened by qasPopupLinks(): fill the small window and size it to the panel
    const st = document.createElement('style'); st.id = 'nqQasCss'; st.textContent = QAS_CSS + (pop ? '\nhtml, body { margin: 0; background: #fff; }' : ''); (document.head || root).appendChild(st);
    const el = document.createElement('div'); el.id = 'nqQas'; el.className = kind + (pop ? ' pop' : '');
    const CD_MS = (7 * 60 + 7) * 60000;
    el.innerHTML = `<div class="top"><div class="ico">${QAS_ICONS[kind]}</div><h2>${esc(title)}</h2></div>`
      + (res.msg ? `<div class="msg">${esc(res.msg)}</div>` : '')
      + (res.ok ? `<div class="next">Next play in ${cdText(CD_MS)}</div>` : done ? `<div class="next">Next play within ${cdText(CD_MS)}</div>` : '')
      + (pop
        ? `<div class="btns"><a class="go" href="#" data-act="close">Close</a><a href="https://www.neopets.com/inventory.phtml" data-act="inv">Inventory</a></div>`
        : `<div class="btns"><a class="go" href="/games/giveaway/">Back to the Expellibox</a><a href="https://www.neopets.com/inventory.phtml">Inventory</a></div>`);
    document.body.appendChild(el);
    if (pop) {
      document.title = QAS;
      el.addEventListener('click', (e) => {
        const a = e.target.closest('a[data-act]');
        if (!a) return;
        e.preventDefault();
        if (a.dataset.act === 'inv') { try { window.opener.location.href = a.href; } catch { location.href = a.href; return; } }
        window.close();
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.close(); });
      const fit = () => { try { window.resizeBy(0, el.offsetHeight - window.innerHeight); } catch {} };
      fit(); setTimeout(fit, 400);
    }
    [...document.body.childNodes].forEach(n => {
      if (n === el) return;
      if ((n.nodeType === 3 || (n.nodeType === 1 && n.tagName === 'PRE')) && /success=\d/.test(n.textContent)) n.remove();
    });
  }
  function watchQasalan() {
    if (!/^\/games\/giveaway(\/|$)/i.test(path)) return;
    const mark = (approx) => {
      const t = cdLoad()[QAS];
      if (!(t && cdLeft(QAS, t) > 0)) { const now = Date.now(); cdSet(QAS, now, approx); ncShare(QAS, now, approx); }
    };
    let rendered = false;
    const rawFromBody = () => { let t = ''; if (document.body) document.body.childNodes.forEach(n => { if (n.nodeType === 3 || (n.nodeType === 1 && n.tagName === 'PRE')) t += n.textContent; }); return t.trim(); };
    const scan = () => {
      const raw = rawFromBody(), res = !rendered && parseGiveaway(raw);
      if (res) { rendered = true; qasalanPanel(res); }
      const v = qasalanVerdict(raw || (document.body && (document.body.innerText || document.body.textContent)) || '');
      if (v) mark(v === 'done');
    };
    let raf = 0; const soon = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(scan); };
    [300, 1500, 4000].forEach(ms => setTimeout(scan, ms));
    document.addEventListener('DOMContentLoaded', soon, { once: true });
    window.addEventListener('load', soon, { once: true });
    const watch = () => { if (document.body) { const mo = new MutationObserver(soon); mo.observe(document.body, { childList: true, subtree: true, characterData: true }); setTimeout(() => mo.disconnect(), 90000); } else setTimeout(watch, 100); };
    watch();
  }

  // Expellibox links (Premium menu, dailies menu) open a small popup instead, so the current page keeps its header
  // and Premium menu. composedPath() reaches links inside the Modern Interface's open shadow root.
  function qasPopupLinks() {
    let qp = null;
    const closeQp = () => { try { if (qp && !qp.closed) qp.close(); } catch {} qp = null; };   // click back here: popup closes
    window.addEventListener('focus', closeQp);
    document.addEventListener('pointerdown', closeQp, true);
    document.addEventListener('click', (e) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const a = (e.composedPath ? e.composedPath() : [e.target]).find(n => n && n.tagName === 'A' && n.href);
      if (!a || !/\/games\/giveaway\/process_giveaway\.phtml/i.test(a.href)) return;
      e.preventDefault();
      const w = 460, h = 440, x = Math.round(window.screenX + (window.outerWidth - w) / 2), y = Math.round(window.screenY + (window.outerHeight - h) / 3);
      qp = window.open(a.href, 'nqQas', `popup,width=${w},height=${h},left=${x},top=${y}`);
      if (!qp) location.href = a.href;
    }, true);
  }

  /* ─── watchDaily: detect "done" on the daily's own page ─── */
  const SUCCESS_RE = /congratulations|you (have |'ve )?(just )?(won|received|collected|spun|got|found)/i;
  const ALREADY_RE = /come back (again )?(tomorrow|later|in |for another)|try back later|not fully restored|can.?t (spin|play|go|do that) right now|come back, uh|return (again )?(later|tomorrow)|in the last (two|2|\d+) hours?|within the last \d+ hours?|done your share|couple of hours|so soon|already (collected|received|claimed|spun|taken|visited|played|got|done|used|obtained|scratched|fished|wished|tried)|you('ve| have) already|you can only .{0,40}(once|per day|every)|check back|too soon|too early|try again (tomorrow|later)|once (per|a) day/i;
  const DAILY_PATHS = { 'Test Your Strength': /^\/halloween\/strtest\//, 'Apple Bobbing': /^\/halloween\/(process_)?applebobbing/, 'Anchor Management': /^\/pirates\/(process_)?anchormanagement/ };
  const NO_IDLE_DONE = new Set(['Tarla\'s Toolbar']);

  // A list of link objects the menu/watch uses. Standalone builds one; the core's Premium menu builds its own
  // links and hands us the <a> nodes for the same purpose. Either way, `watchDaily` looks up the current page
  // against this list.
  const DAILY_LINKS = [
    ['Trudy\'s Surprise', 'https://www.neopets.com/trudys_surprise.phtml'],
    ['Fruit Machine', 'https://www.neopets.com/desert/fruit/index.phtml'],
    ['Meteor Crash Site', 'https://www.neopets.com/moon/meteor.phtml'],
    ['Coltzan\'s Shrine', 'https://www.neopets.com/desert/shrine.phtml'],
    ['Grumpy King', 'https://www.neopets.com/medieval/grumpyking.phtml'],
    ['Giant Omelette', 'https://www.neopets.com/prehistoric/omelette.phtml'],
    ['Giant Jelly', 'https://www.neopets.com/jelly/jelly.phtml'],
    ['Tombola', 'https://www.neopets.com/island/tombola.phtml'],
    ['Wishing Well', 'https://www.neopets.com/wishing.phtml'],
    ['Healing Springs', 'https://www.neopets.com/faerieland/springs.phtml'],
    ['Tarla\'s Toolbar', 'https://www.neopets.com/freebies/tarlastoolbar.phtml'],
    ['Qasalan Expellibox', QASALAN_ITEM[1]],
    ['Fishing', 'https://www.neopets.com/water/fishing.phtml'],
    ['Coconut Shy', 'https://www.neopets.com/halloween/coconutshy.phtml'],
    ['Cheeseroller', 'https://www.neopets.com/medieval/cheeseroller.phtml'],
    ['Rubbish Dump', 'https://www.neopets.com/medieval/rubbishdump.phtml'],
    ['Symol Hole', 'https://www.neopets.com/medieval/symolhole.phtml'],
    ['Buried Treasure', 'https://www.neopets.com/pirates/buriedtreasure/index.phtml'],
    ['Anchor Management', 'https://www.neopets.com/pirates/anchormanagement.phtml'],
    ['Test Your Strength', 'https://www.neopets.com/halloween/strtest/index.phtml'],
    ['Apple Bobbing', 'https://www.neopets.com/halloween/applebobbing.phtml'],
    ['Edna the Witch', 'https://www.neopets.com/halloween/witchtower.phtml'],
    ['Wheel of Starlight', 'https://www.neopets.com/premium/wheel.phtml'],
    ['Wheel of Excitement', 'https://www.neopets.com/faerieland/wheel.phtml'],
    ['Wheel of Mediocrity', 'https://www.neopets.com/prehistoric/mediocrity.phtml'],
    ['Wheel of Misfortune', 'https://www.neopets.com/halloween/wheel/index.phtml'],
    ['Wheel of Monotony', 'https://www.neopets.com/prehistoric/monotony/monotony.phtml'],
    ['Wheel of Knowledge', 'https://www.neopets.com/medieval/knowledge.phtml'],
    ['Terror Mountain Kiosk', 'https://www.neopets.com/winter/kiosk.phtml'],
    ['Deserted Fairground Kiosk', 'https://www.neopets.com/halloween/scratch.phtml'],
    ['Lost Desert Kiosk', 'https://www.neopets.com/desert/sc/kiosk.phtml'],
  ];

  function watchDaily() {
    const here = location.pathname.toLowerCase();
    const pathOf = (u) => { try { return new URL(u, 'https://www.neopets.com/').pathname.toLowerCase(); } catch { return ''; } };
    const base = (p) => p.split('/').pop().replace(/\.phtml$/, '').replace(/^process_/, '').replace(/\d+$/, '');
    const dirOf = (p) => p.split('/')[1];
    const viaPath = Object.entries(DAILY_PATHS).find(([, re]) => re.test(here));
    const hitName = (viaPath && viaPath[0]) || (() => {
      const direct = DAILY_LINKS.find(([n, u]) => pathOf(u) === here);
      if (direct) return direct[0];
      const fuzzy = DAILY_LINKS.find(([n, u]) => { const p = pathOf(u); return p && dirOf(p) === dirOf(here) && base(p).length >= 4 && here.includes(base(p)); });
      return fuzzy ? fuzzy[0] : '';
    })();
    if (!hitName) return;
    if (PREMIUM_CD[hitName] == null) return;
    const mark = (approx) => { const t = cdLoad()[hitName]; if (!(t && cdLeft(hitName, t) > 0)) { cdSet(hitName, Date.now(), approx); refreshAllMenus(); } };
    // Trudy's prizes are drawn in the game canvas, so no text or button tells us it was played: visiting the page counts.
    if (hitName === TRUDY) mark(false);
    const scan = () => {
      const area = document.querySelector('#content, #main, main, #container__2020') || document.body;
      const txt = (area && area.innerText) || '';
      if (SUCCESS_RE.test(txt)) mark(false); else if (!NO_IDLE_DONE.has(hitName) && ALREADY_RE.test(txt)) mark(true);
    };
    [800, 2500, 6000].forEach(ms => setTimeout(scan, ms));
    document.addEventListener('submit', () => setTimeout(() => mark(false), 0), true);
    document.addEventListener('click', (e) => {
      const t = e.target.closest && e.target.closest('button, input[type="submit"], input[type="image"], [onclick], area, a[href]');
      if (!t || t.closest('#nqHud, #nqFoot, #nqBgSidebar, #nqDailiesRoot, #nqDailiesMenu')) return;
      if (t.tagName === 'A') {
        try { const u = new URL(t.href); if (u.pathname.toLowerCase() !== here || !u.search) return; } catch { return; }
      }
      setTimeout(() => mark(false), 300);
    }, true);
  }

  /* ─── Premium-menu decoration helpers ─── */
  function decoratePremium(menu) {
    if (!menu || !menu.querySelectorAll || !onMain()) return;
    refreshCd(menu);
    updateSnow(menu, null);
  }
  function undecoratePremium(menu) {
    if (!menu || !menu.querySelectorAll) return;
    menu.querySelectorAll('.nq-cd, .nqSnowRow').forEach(el => el.remove());
  }
  function refreshAllMenus() {
    document.querySelectorAll('#menu-premium, #nqDailiesMenu').forEach(m => { try { refreshCd(m); } catch {} });
  }
  function refreshCd(menu) {
    if (!menu || !menu.querySelectorAll) return;
    const store = cdLoad();
    let dirty = false;
    menu.querySelectorAll('a').forEach(a => {
      const name = ((a.querySelector('span') || {}).textContent || a.textContent || '').trim();
      a.querySelectorAll('.nq-cd').forEach(x => x.remove());
      if (name === 'Symol Hole') {
        const sw = symolLoad(), z = (n) => String(n).padStart(2, '0'), b = document.createElement('em');
        b.className = 'nq-cd nq-win';
        b.textContent = sw ? `:${z(Math.floor(sw.start / 60))}–:${z(Math.floor((sw.start + sw.len - 1) / 60))}` : '?';
        b.title = sw ? 'Today’s Symol Hole prize window (each hour, NST)' : 'Today’s window isn’t known yet' + (LSget(SYM_ST) && LSget(SYM_ST) !== 'ok' ? ': ' + LSget(SYM_ST) : '');
        a.appendChild(b);
      }
      if (!store[name]) return;
      const left = cdLeft(name, store[name]);
      if (left <= 0) { delete store[name]; delete store['~' + name]; dirty = true; return; }
      const b = document.createElement('em');
      b.className = 'nq-cd'; const approx = store['~' + name] && PREMIUM_CD[name] !== 'nst';
      b.textContent = (approx ? '≤' : '') + cdText(left);
      b.title = approx ? 'Counted from when the script first saw it was done, so it may end sooner · Alt+click to clear' : 'On cooldown · Alt+click to clear';
      a.appendChild(b);
    });
    if (dirty) LSset(CD_KEY, JSON.stringify(store));
  }
  function trudyReady() { const t = cdLoad()[TRUDY]; return !(t && cdLeft(TRUDY, t) > 0); }
  function qasReady() { const t = cdLoad()[QAS]; return seenLoad().includes(QAS) && !(t && cdLeft(QAS, t) > 0) && !isAcked(QAS); }
  function syncAlerts(menu) {
    if (!menu || !menu.querySelectorAll) return;
    const rows = () => [...menu.querySelectorAll('.nqAlertRow')];
    let snow = menu.querySelector('.nqSnowRow:not(.nqAlertRow)');
    [{ n: TRUDY, url: 'https://www.neopets.com/trudys_surprise.phtml', on: trudyReady() && !isAcked(TRUDY) },
     { n: QAS, url: QASALAN_ITEM[1], on: qasReady() }].forEach(def => {
      const row = rows().find(r => r.dataset.n === def.n);
      if (def.on && !row) menu.insertAdjacentHTML('afterbegin', `<a class="nqSnowRow nqAlertRow" data-n="${esc(def.n)}" href="${esc(def.url)}">${GIFT}<span>${esc(def.n)}</span><em class="nqSnowBadge ready">Ready</em></a>`);
      else if (!def.on && row) row.remove();
      const orig = [...menu.querySelectorAll('a:not(.nqAlertRow)')].find(a => ((a.querySelector('span') || {}).textContent || '').trim() === def.n);
      if (orig) orig.style.display = def.on ? 'none' : '';
    });
    [QAS, TRUDY].map(n => rows().find(r => r.dataset.n === n)).filter(Boolean).reverse().forEach(r => { if (menu.firstElementChild !== r) menu.prepend(r); });
    if (snowagerState().asleep && !snowAcked(snowagerState())) {
      if (!snow) { menu.insertAdjacentHTML('afterbegin', snowRowHTML()); snow = menu.querySelector('.nqSnowRow:not(.nqAlertRow)'); }
      if (menu.firstElementChild !== snow) menu.prepend(snow);
    } else if (snow) snow.remove();
  }
  function updateSnow(menu, btn) {
    if (!onMain()) return;
    const st = snowagerState(), b = snowBadge(st);
    const el = menu && menu.querySelector('.nqSnowBadge:not(.ready)');
    if (el) { el.classList.toggle('asleep', st.asleep); el.textContent = b.text; el.title = b.title; }
    syncAlerts(menu);
    if (btn) btn.classList.toggle('nq-alert-on', (st.asleep && !snowAcked(st)) || (trudyReady() && !isAcked(TRUDY)) || qasReady());
  }

  /* ─── dailyModel + sidebar card ─── */
  function dailyModel() {
    const store = cdLoad(), left = {};
    Object.keys(PREMIUM_CD).forEach(n => { if (store[n]) { const l = cdLeft(n, store[n]); if (l > 0) left[n] = l; } });
    const z = (n) => String(n).padStart(2, '0');
    const st = snowagerState();
    const snow = (st.asleep && !snowAcked(st))
      ? { cls: 'asleep', pill: 'Asleep', text: `Wakes in ${snowText(st.secs)}`, pct: Math.round((1 - st.secs / 3600) * 100) }
      : (!st.asleep && st.secs <= 1800)
        ? { cls: 'soon', pill: 'Soon', text: `Sleeps in ${snowText(st.secs)}`, pct: 0 }
        : null;
    let symol = null; const sw = symolLoad();
    if (sw && !left['Symol Hole']) {
      const y = symolState(sw);
      if (ackLoad()['~symol'] !== y.id && (y.open || y.secs <= 600))
        symol = { cls: y.open ? 'open' : 'soon', pill: y.open ? 'Open' : 'Soon', text: y.open ? `Closes in ${snowText(y.secs)}` : `Opens in ${snowText(y.secs)}`, sub: `:${z(Math.floor(sw.start / 60))}–:${z(Math.floor((sw.start + sw.len - 1) / 60))} each hour`, pct: y.open ? Math.round((1 - y.secs / sw.len) * 100) : 0, id: y.id };
    }
    let tarla = null; const tw = tarlaLoad();
    if (tw && !left["Tarla's Toolbar"]) {
      const y = symolState(tw);
      if (ackLoad()['~tarla'] !== y.id && (y.open || y.secs <= 900))
        tarla = { cls: y.open ? 'open' : 'soon', pill: y.open ? 'Open' : 'Soon', text: y.open ? `Closes in ${snowText(y.secs)}` : `Opens in ${snowText(y.secs)}`, sub: `:${z(Math.floor(tw.start / 60))}–:${z(Math.floor((tw.start + tw.len - 1) / 60))} each hour`, pct: y.open ? Math.round((1 - y.secs / tw.len) * 100) : 0, id: y.id };
    }
    return { snow, symol, tarla };
  }

  /* ─── CSS injected by this file ─── */
  const DAILY_CSS = `
#nqDaily[hidden] { display: none !important; }
#nqDaily:not(:has(.nqDHero)) { display: none !important; }
#nqDaily { display: flex; flex-direction: column; gap: 6px; width: 100%; max-width: 100%; min-width: 0; align-self: stretch; overflow: visible; padding: 0 !important; background: transparent !important; border: 0 !important; box-shadow: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
#nqDaily, #nqDaily * { box-sizing: border-box; text-shadow: none !important; }
#nqDaily .nqDBody { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
#nqDaily .nqDHero { position: relative; display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; align-items: center; gap: 0 10px; padding: 9px 10px; border: 1px solid rgba(255,255,255,.18); border-radius: 13px; background: rgba(255,255,255,.08); color: #fff !important; text-decoration: none !important; overflow: hidden; transition: background .15s, transform .15s, border-color .15s; }
#nqDaily .nqDHero:hover { background: rgba(255,255,255,.15); border-color: rgba(255,255,255,.34); transform: translateY(-1px); }
#nqDaily .nqDHero .nqDIco { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: rgba(255,255,255,.14); box-shadow: inset 0 0 0 1px rgba(255,255,255,.16); }
#nqDaily .nqDHero .nqDIco svg { width: 19px; height: 19px; display: block; filter: drop-shadow(0 1px 2px rgba(0,0,0,.5)); }
#nqDaily .nqDHero .nqDTxt { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
#nqDaily .nqDHero .nqDTxt b { overflow-wrap: anywhere; white-space: normal; font: 700 13.5px/1.2 'Outfit', system-ui, sans-serif !important; text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6); }
#nqDaily .nqDHero .nqDTxt small.sub { color: rgba(255,255,255,.62); font-size: 10.5px !important; }
#nqDaily .nqDHero .nqDTxt small { overflow-wrap: anywhere; white-space: normal; font: 500 11px/1.25 'Outfit', system-ui, sans-serif !important; color: rgba(255,255,255,.8); font-variant-numeric: tabular-nums; }
#nqDaily .nqDHero > em { padding: 2px 9px; border-radius: 999px; background: rgba(255,255,255,.16); font: normal 700 10px/1.5 'Outfit', system-ui, sans-serif !important; letter-spacing: .06em; text-transform: uppercase; }
#nqDaily .nqDLocked { cursor: default; }
#nqDaily .nqDLocked:hover { transform: none; background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.18); }
#nqDaily .nqDHero .nqDProg { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: rgba(255,255,255,.12); }
#nqDaily .nqDProg i { display: block; height: 100%; border-radius: 0 2px 2px 0; background: var(--nq-accent, #fff); transition: width .6s linear; }
#nqDaily .nqDHero.asleep { background: linear-gradient(135deg, rgba(86,160,255,.30), rgba(86,160,255,.10)); border-color: rgba(140,195,255,.5); }
#nqDaily .nqDHero.asleep .nqDIco { background: rgba(120,185,255,.30); color: #cfe6ff; }
#nqDaily .nqDHero.asleep > em { background: #2f7de0; color: #fff; }
#nqDaily .nqDHero.open { background: linear-gradient(135deg, rgba(47,216,115,.30), rgba(47,216,115,.10)); border-color: rgba(110,235,160,.55); animation: nqPulse 1.6s ease-in-out infinite; }
#nqDaily .nqDHero.open .nqDIco { background: rgba(47,216,115,.30); color: #c4ffdd; }
#nqDaily .nqDHero.open > em { background: #22b45a; color: #fff; }
#nqDaily .nqDHero.soon { border-color: rgba(255,210,122,.5); }
#nqDaily .nqDHero.soon .nqDIco { background: rgba(255,210,122,.24); color: #ffe2a3; }
#nqDaily .nqDHero.soon > em { background: #f0a020; color: #2a1a00; }
@keyframes nqPulse { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
#nqDaily .nqDHero.nqTh-snow { background: radial-gradient(circle, rgba(255,255,255,.95) 1.3px, transparent 1.8px) 0 0 / 16px 16px, radial-gradient(circle, rgba(255,255,255,.8) 1px, transparent 1.5px) 8px 11px / 24px 24px, linear-gradient(160deg, #f4fbff 0%, #cfeafc 55%, #a9d8f5 100%) !important; border: 1px solid rgba(255,255,255,.85) !important; color: #0e2a44 !important; }
#nqDaily .nqTh-snow b { color: #0e2a44 !important; text-shadow: none !important; }
#nqDaily .nqTh-snow small { color: rgba(14,42,68,.78) !important; }
#nqDaily .nqTh-snow .nqDIco { background: rgba(255,255,255,.75) !important; color: #2b6fa6 !important; box-shadow: inset 0 0 0 1px rgba(43,111,166,.25) !important; }
#nqDaily .nqTh-snow > em { background: #2b6fa6 !important; color: #fff !important; }
#nqDaily .nqTh-snow.asleep > em { background: #1b4f85 !important; }
#nqDaily .nqTh-snow .nqDProg { background: rgba(14,42,68,.12) !important; }
#nqDaily .nqTh-snow .nqDProg i { background: #2b6fa6 !important; }
#nqDaily .nqDHero.nqTh-cave { background: radial-gradient(ellipse at 50% 115%, rgba(255,214,120,.35), transparent 60%), linear-gradient(160deg, #6b5440 0%, #3b2d22 60%, #251b14 100%) !important; border: 1px solid rgba(255,210,122,.3) !important; color: #fbf1df !important; }
#nqDaily .nqTh-cave b { color: #fff6e6 !important; text-shadow: 0 1px 2px rgba(0,0,0,.6) !important; }
#nqDaily .nqTh-cave small { color: rgba(251,241,223,.78) !important; }
#nqDaily .nqTh-cave .nqDIco { background: rgba(255,210,122,.2) !important; color: #ffe2a3 !important; }
#nqDaily .nqTh-cave.open { box-shadow: 0 0 16px rgba(110,235,160,.35) !important; }
#nqDaily .nqTh-cave > em { background: #c98a1d !important; color: #2a1a00 !important; }
#nqDaily .nqTh-cave.open > em { background: #22b45a !important; color: #fff !important; }
#nqDaily .nqTh-cave .nqDProg { background: rgba(0,0,0,.35) !important; }
#nqDaily .nqDHero.nqTh-gift { background: radial-gradient(circle at 85% 15%, rgba(255,255,255,.35), transparent 55%), linear-gradient(160deg, #ffe3ef 0%, #ffc8dd 55%, #f5a8c4 100%) !important; border: 1px solid rgba(255,255,255,.8) !important; color: #5a1c34 !important; }
#nqDaily .nqTh-gift b { color: #5a1c34 !important; text-shadow: none !important; }
#nqDaily .nqTh-gift small { color: rgba(90,28,52,.78) !important; }
#nqDaily .nqTh-gift .nqDIco { background: rgba(255,255,255,.75) !important; color: #c2185b !important; box-shadow: inset 0 0 0 1px rgba(194,24,91,.25) !important; }
#nqDaily .nqTh-gift > em { background: #c2185b !important; color: #fff !important; }
#nqDaily .nqTh-gift.open > em { background: #22b45a !important; color: #fff !important; }
#nqDaily .nqTh-gift .nqDProg { background: rgba(90,28,52,.16) !important; }
#nqDaily .nqTh-gift .nqDProg i { background: #c2185b !important; }

/* ── Standalone dailies panel ── */
#nqDailiesRoot { position: fixed; right: 20px; bottom: 20px; z-index: 2140; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; font: 500 13px 'Outfit', system-ui, sans-serif; }
#nqDailiesRoot[data-modern="1"] { display: none !important; }
#nqDailiesToggle { display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(0,0,0,.16); background: #fff; color: #1f2937; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.18); }
#nqDailiesToggle:hover { background: #f3f4f6; }
#nqDailiesToggle svg { width: 18px; height: 18px; }
#nqDailiesMenu { display: none; width: 300px; max-height: 70vh; overflow-y: auto; padding: 10px; border-radius: 14px; background: #1a1722; color: #fff; box-shadow: 0 12px 34px rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,.14); }
#nqDailiesRoot.open #nqDailiesMenu { display: block; }
#nqDailiesMenu a { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; color: #fff; text-decoration: none; }
#nqDailiesMenu a:hover { background: rgba(255,255,255,.1); }
#nqDailiesMenu a span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#nqDailiesMenu a .nq-cd { flex: none; padding: 2px 8px; border-radius: 9px; background: rgba(255,255,255,.16); color: #fff; font: normal 700 11px/1.3 'Outfit', system-ui, sans-serif; white-space: nowrap; }
#nqDailiesMenu a .nq-cd.nq-win { background: rgba(255,255,255,.16); }
#nqDailiesMenu .nqSnowRow .nqSnowBadge { margin-left: auto; padding: 2px 8px; border-radius: 9px; background: rgba(255,255,255,.16); color: #fff; font: normal 700 11px/1.3 'Outfit', system-ui, sans-serif; white-space: nowrap; font-variant-numeric: tabular-nums; }
#nqDailiesMenu .nqSnowRow .nqSnowBadge.asleep { background: #22b45a; }
#nqDailiesMenu .nqSnowRow .nqSnowBadge.ready { background: #f0a020; color: #2a1a00; }
#nqDailiesMenu .nqSnowRow svg { width: 22px; height: 22px; flex: none; color: #bfe3ff; }
#nqDailiesMenu .nqAlertRow svg { color: #ffd27a !important; }
#nqDailiesMenu .menuHead { padding: 8px 10px 4px; font: 700 10px/1 'Outfit', system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.5); }
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'nq-dailies-css';
  styleEl.textContent = DAILY_CSS;
  (document.head || root).appendChild(styleEl);

  /* ─── Standalone dailies panel ─── */
  const SUN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';

  function mountStandalonePanel() {
    if (document.getElementById('nqDailiesRoot')) return;
    if (!document.body) return;
    const wrap = document.createElement('div');
    wrap.id = 'nqDailiesRoot';
    wrap.dataset.modern = NQ.base ? '1' : '0';
    wrap.innerHTML = `
      <button type="button" id="nqDailiesToggle">${SUN_SVG}<span>Dailies</span></button>
      <div id="nqDailiesMenu">
        <div class="menuHead">Today</div>
        ${DAILY_LINKS.map(([name, url]) => `<a href="${esc(url)}" data-name="${esc(name)}"><span>${esc(name)}</span></a>`).join('')}
      </div>`;
    document.body.appendChild(wrap);
    const toggle = wrap.querySelector('#nqDailiesToggle');
    const menu = wrap.querySelector('#nqDailiesMenu');
    toggle.addEventListener('click', (e) => { e.preventDefault(); wrap.classList.toggle('open'); refreshCd(menu); updateSnow(menu, null); });
    document.addEventListener('pointerdown', (e) => { if (!wrap.classList.contains('open')) return; if (!e.target.closest('#nqDailiesRoot')) wrap.classList.remove('open'); }, true);
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-name]');
      if (!a) return;
      const name = a.dataset.name;
      if (CD_ON_CLICK.has(name)) { const t = cdLoad()[name]; if (!(t && cdLeft(name, t) > 0)) cdSet(name, Date.now(), false); }
      if (name === 'Qasalan Expellibox') ackSet(name, Date.now());
      if (name === 'Trudy\'s Surprise') ackSet(name, Date.now());
      setTimeout(refreshAllMenus, 200);
    });
    setInterval(() => {
      if (wrap.classList.contains('open')) { refreshCd(menu); updateSnow(menu, null); }
    }, 1000);
  }

  /* ─── Sidebar card (Modern Interface mode) ─── */
  function sidebarDailyCard() {
    const pet = document.getElementById('nqActivePet');
    if (!pet) return;
    let d = document.getElementById('nqDaily');
    if (!d) {
      d = document.createElement('div');
      d.id = 'nqDaily'; d.className = 'nqCard';
      pet.insertAdjacentElement('afterend', d);
      cardListeners.forEach(fn => { try { fn(d); } catch {} });
    }
    const hero = (name, h, icon, href) => {
      const theme = name === 'Snowager' ? 'nqTh-snow' : name === "Tarla's Toolbar" ? 'nqTh-gift' : 'nqTh-cave';
      const inner = `<i class="nqDIco">${icon}</i><span class="nqDTxt"><b>${esc(name)}</b><small>${esc(h.text)}</small>${h.sub ? `<small class="sub">${esc(h.sub)}</small>` : ''}</span><em>${esc(h.pill)}</em>${h.pct ? `<span class="nqDProg"><i style="width:${h.pct}%"></i></span>` : ''}`;
      return href
        ? `<a class="nqDHero ${theme} ${h.cls}" data-n="${esc(name)}" href="${esc(href)}">${inner}</a>`
        : `<div class="nqDHero nqDLocked ${theme} ${h.cls}" data-n="${esc(name)}" title="Swap to your main">${inner}</div>`;
    };
    d.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[data-n]');
      if (!a) return;
      if (a.dataset.n === 'Snowager') ackSnow();
      else if (a.dataset.n === 'Symol Hole') { const sw = symolLoad(); if (sw) ackSet('~symol', symolState(sw).id); }
      else if (a.dataset.n === "Tarla's Toolbar") { const tw = tarlaLoad(); if (tw) ackSet('~tarla', symolState(tw).id); }
      renderSidebar();
    });
    const urlOf = {}; DAILY_LINKS.forEach(([n, u]) => { urlOf[n] = u; });
    function renderSidebar() {
      const m = dailyModel();
      // Render into a body child so the patcher's eye (fold) button, prepended to #nqDaily, is never wiped.
      let body = d.querySelector(':scope > .nqDBody');
      if (!body) { body = document.createElement('div'); body.className = 'nqDBody'; d.appendChild(body); }
      if (!(m.snow || m.symol || m.tarla)) { d.hidden = true; body.innerHTML = ''; d._html = ''; return; }
      d.hidden = false;
      const html = (m.snow ? hero('Snowager', m.snow, SNOWFLAKE, 'https://www.neopets.com/winter/snowager.phtml') : '')
        + (m.symol ? hero('Symol Hole', m.symol, HOLE_SVG, urlOf['Symol Hole']) : '')
        + (m.tarla ? hero("Tarla's Toolbar", m.tarla, GIFT, urlOf["Tarla's Toolbar"]) : '');
      if (d._html !== html) { body.innerHTML = html; d._html = html; }
    }
    renderSidebar();
    setInterval(renderSidebar, 1000);
    symolEnsure();
  }

  /* ─── watchDaily bootstrap ─── */
  function bootWatch() {
    // Runs regardless of Modern Interface so "done" is detected on daily pages even in standalone mode.
    if (typeof GM_xmlhttpRequest === 'function') setTimeout(symolEnsure, 2500);
    watchDaily();
    watchQasalan();
    if (!isPopup) qasPopupLinks();
    if (!isNc) { ncPull(); setInterval(ncPull, 4000); }
  }

  /* ─── Public API for the core to consume ─── */
  const cardListeners = [];
  NQ.dailies = {
    onCard: (fn) => { cardListeners.push(fn); },
    PREMIUM_CD, cdLoad, cdSet, cdLeft, cdText, seenLoad, ackLoad, ackSet, isAcked,
    snowagerState, snowAcked, ackSnow, snowText, snowBadge, snowRowHTML, SNOWFLAKE,
    symolLoad, tarlaLoad, symolState, symolEnsure, parseSymol, parseTarla,
    dailyModel, decoratePremium, undecoratePremium, refreshCd, syncAlerts, updateSnow,
    trudyReady, qasReady, GIFT, QAS, QASALAN_ITEM,
    DAILY_LINKS, CD_ON_CLICK,
  };

  /* ─── Mount ─── */
  function mount() {
    if (document.body) {
      whenUser(() => {
        if (!onMain()) return;
        mountStandalonePanel();
        if (NQ.base) sidebarDailyCard();
        bootWatch();
      });
    } else {
      document.addEventListener('DOMContentLoaded', mount, { once: true });
    }
  }
  mount();

})();
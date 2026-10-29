// ==UserScript==
// @name         Neopets - Petpage Builder
// @namespace    neopets-qol-patcher
// @version      1.0.0
// @description  Builds a copy-paste petpage from the All Pets Up for Trade list. Bundle only: needs NQ.ap from account-drawer.
// @match        *://*.neopets.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  if (window.top !== window) return;
  if (typeof NQ === 'undefined') return;

  const $ = (s, r = document) => r.querySelector(s);
  const LSget = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
  const LSset = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const hex = (h, s, l) => {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, '0');
    return '#' + f(0) + f(8) + f(4);
  };
  const hash = (s) => { let h = 2166136261; for (const ch of String(s).toLowerCase()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  const THEMES = {
    yours: (h) => ({ bg: hex(h, 45, 97), card: '#ffffff', ink: hex(h, 32, 18), mute: hex(h, 12, 46), acc: hex(h, 62, 50), acc2: hex((h + 48) % 360, 70, 62), line: hex(h, 35, 89), tint: hex(h, 60, 94), tint2: hex((h + 48) % 360, 70, 93) }),
    dusk: (h) => ({ bg: hex(h, 26, 11), card: hex(h, 22, 16), ink: hex(h, 30, 94), mute: hex(h, 14, 68), acc: hex(h, 80, 74), acc2: hex((h + 48) % 360, 80, 70), line: hex(h, 20, 25), tint: hex(h, 26, 21), tint2: hex((h + 48) % 360, 30, 24) }),
    candy: (h) => ({ bg: hex((h + 24) % 360, 80, 96), card: '#ffffff', ink: hex(h, 40, 22), mute: hex(h, 18, 48), acc: hex((h + 330) % 360, 72, 58), acc2: hex((h + 60) % 360, 80, 64), line: hex((h + 24) % 360, 60, 88), tint: hex((h + 330) % 360, 90, 94), tint2: hex((h + 60) % 360, 90, 92) }),
    paper: (h) => ({ bg: '#f6f1e7', card: '#fffdf8', ink: '#2e2a24', mute: '#7a7064', acc: hex(h, 45, 42), acc2: hex(h, 45, 42), line: '#e6ddcc', tint: '#f1eadc', tint2: '#f1eadc' }),
    mono: () => ({ bg: '#ffffff', card: '#ffffff', ink: '#141414', mute: '#7a7a7a', acc: '#141414', acc2: '#141414', line: '#e7e7e7', tint: '#f4f4f4', tint2: '#f4f4f4' })
  };
  const THEME_N = { yours: 'Yours', dusk: 'Dusk', candy: 'Candy', paper: 'Paper', mono: 'Mono' };
  const FONTS = { clean: "'Trebuchet MS',Verdana,sans-serif", classic: "Georgia,'Times New Roman',serif", round: "'Varela Round','Nunito','Arial Rounded MT Bold',Verdana,sans-serif" };
  const SIZES = { s: [148, 112, 14], m: [180, 144, 16], l: [224, 188, 19] };
  const DEF = { src: 'uft', theme: 'yours', shift: 0, layout: 'cards', size: 'm', age: 'years', sp: false, note: true, font: 'clean', sort: 'list', title: '', intro: '', seek: '', contact: '' };

  const prefKey = () => 'nq_pp_prefs:' + String(NQ.ap.user() || '').toLowerCase();
  let P = { ...DEF };
  const loadPrefs = () => { P = { ...DEF }; try { Object.assign(P, JSON.parse(LSget(prefKey()) || '{}')); } catch {} };
  const savePrefs = () => LSset(prefKey(), JSON.stringify(P));

  function gather(src) {
    const A = NQ.ap, c = A.read(), tags = A.tags(), only = src === 'picked' ? A.picked() : null, done = new Set(), out = [];
    A.ordered().forEach(a => ((A.of(c, a) || {}).pets || []).forEach(p => {
      const k = p.name.toLowerCase(), t = tags[k] || {};
      if (done.has(k) || (only ? !only.has(k) : t.s !== 'uft')) return;
      done.add(k); out.push({ ...p, note: t.n || '' });
    }));
    return out;
  }

  const fmtN = (n) => n.toLocaleString('en-US');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function ageText(born, mode) {
    if (!born || mode === 'off') return '';
    const d = Math.max(0, Math.floor((Date.now() - born) / 864e5));
    if (mode === 'days') return d < 1 ? 'Brand new' : fmtN(d) + (d === 1 ? ' day' : ' days');
    if (mode === 'born') { const b = new Date(born); return 'Born ' + b.getDate() + ' ' + MON[b.getMonth()] + ' ' + b.getFullYear(); }
    if (d < 1) return 'Brand new';
    if (d < 60) return d + (d === 1 ? ' day old' : ' days old');
    if (d < 365) { const m = Math.floor(d / 30.44); return m + ' months old'; }
    const y = Math.floor(d / 365.25); return y + (y === 1 ? ' year old' : ' years old');
  }

  function build(pets) {
    const user = (P.contact || NQ.ap.user() || '').trim(), okUser = /^[A-Za-z0-9_]{3,20}$/.test(user);
    const t = THEMES[P.theme](((hash(user || 'neopets') % 360) + P.shift * 47) % 360), F = FONTS[P.font] || FONTS.clean;
    const [cw, iw, ns] = SIZES[P.size] || SIZES.m;
    const list = pets.slice();
    if (P.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    else if (P.sort === 'age') list.sort((a, b) => (a.born || 9e15) - (b.born || 9e15));
    const pet = (p) => 'https://www.neopets.com/~' + encodeURIComponent(p.name);
    const look = (p) => 'https://www.neopets.com/petlookup.phtml?pet=' + encodeURIComponent(p.name);
    const img = (p, w) => `<img src="https://pets.neopets.com/cpn/${encodeURIComponent(p.name)}/1/7.png" width="${w}" height="${w}" alt="${esc(p.name)}" style="display:block;width:${w}px;height:${w}px;border:0">`;
    const sp = (p) => P.sp ? [p.color, p.species].filter(Boolean).join(' ') : '';
    const chip = (s) => `<span style="display:inline-block;margin-top:8px;padding:3px 10px;border-radius:999px;background:${t.tint};color:${t.acc};font:bold 11px/1.4 ${F}">${esc(s)}</span>`;

    const anyA = list.some(p => ageText(p.born, P.age)), anyS = list.some(p => sp(p)), anyN = P.note && list.some(p => p.note);
    const card = (p) => {
      const a = ageText(p.born, P.age) || (anyA ? '&nbsp;' : ''), s = sp(p) ? esc(sp(p)) : anyS ? '&nbsp;' : '';
      return `<div style="display:inline-block;vertical-align:top;width:${cw}px;margin:9px;padding:${Math.round(iw / 10)}px ${Math.round(iw / 12)}px ${Math.round(iw / 9)}px;background:${t.card};border:1px solid ${t.line};border-radius:22px;text-align:center;box-shadow:0 6px 18px -12px ${t.mute}">`
        + `<a href="${pet(p)}" title="${esc(p.name)}" style="display:block;width:${iw}px;height:${iw}px;margin:0 auto 12px;border-radius:18px;background:${t.tint};background:linear-gradient(160deg,${t.tint},${t.tint2});overflow:hidden">${img(p, iw)}</a>`
        + `<a href="${look(p)}" style="display:block;color:${t.ink};text-decoration:none;font:bold ${ns}px/1.2 ${F};letter-spacing:.2px;word-wrap:break-word">${esc(p.name)}</a>`
        + (a ? `<div style="margin-top:5px;color:${t.mute};font:${Math.max(11, ns - 4)}px/1.3 ${F}">${a}</div>` : '')
        + (s ? `<div style="margin-top:2px;color:${t.mute};font:11px/1.3 ${F}">${s}</div>` : '')
        + (P.note && p.note ? chip(p.note) : anyN ? `<span style="display:inline-block;margin-top:8px;font:bold 11px/1.4 ${F};padding:3px 0">&nbsp;</span>` : '')
        + '</div>';
    };
    const row = (p) => {
      const a = ageText(p.born, P.age), s = sp(p);
      return `<table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 10px;border-collapse:separate;background:${t.card};border:1px solid ${t.line};border-radius:18px"><tr>`
        + `<td style="width:84px;padding:10px 0 10px 12px;vertical-align:middle"><a href="${pet(p)}" style="display:block;width:72px;height:72px;border-radius:14px;background:${t.tint};background:linear-gradient(160deg,${t.tint},${t.tint2});overflow:hidden">${img(p, 72)}</a></td>`
        + `<td style="padding:10px 16px;vertical-align:middle;text-align:left"><a href="${look(p)}" style="color:${t.ink};text-decoration:none;font:bold 17px/1.2 ${F}">${esc(p.name)}</a>`
        + (s ? `<div style="margin-top:3px;color:${t.mute};font:12px/1.3 ${F}">${esc(s)}</div>` : '')
        + (P.note && p.note ? `<div style="margin-top:3px;color:${t.acc};font:bold 12px/1.3 ${F}">${esc(p.note)}</div>` : '') + '</td>'
        + `<td style="padding:10px 18px 10px 0;vertical-align:middle;text-align:right;white-space:nowrap;color:${t.mute};font:13px/1.3 ${F}">${a}</td></tr></table>`;
    };

    const prof = okUser && NQ.ap.prof ? NQ.ap.prof(user) : null;
    const av = prof && /^https:\/\/images\.neopets\.com\/[^"'<>()\s]+$/i.test(prof.avatar || '') ? prof.avatar : '';
    const title = P.title.trim() || 'Up for trade';
    const eyebrow = (P.src === 'picked' ? 'Available' : 'Up for trade') + ' &middot; ' + list.length + (list.length === 1 ? ' pet' : ' pets');
    const nm = okUser ? `https://www.neopets.com/neomessages.phtml?type=send&recipient=${encodeURIComponent(user)}` : '';
    const d = new Date();
    const head = `<div style="height:6px;background:${t.acc};background:linear-gradient(90deg,${t.acc},${t.acc2})"></div>`
      + `<div style="padding:40px 24px 8px;text-align:center">`
      + `<div style="color:${t.acc};font:bold 11px/1 ${F};letter-spacing:3px;text-transform:uppercase">${eyebrow}</div>`
      + `<div style="margin:12px 0 0;color:${t.ink};font:bold 38px/1.1 ${F};letter-spacing:-.5px">${esc(title)}</div>`
      + (P.intro.trim() ? `<div style="max-width:560px;margin:14px auto 0;color:${t.mute};font:15px/1.6 ${F}">${esc(P.intro.trim()).replace(/\n/g, '<br>')}</div>` : '')
      + (P.seek.trim() ? `<div style="display:inline-block;margin:18px 0 0;padding:8px 16px;border:1px dashed ${t.line};border-radius:14px;color:${t.ink};font:13px/1.5 ${F}"><b style="color:${t.acc}">Looking for</b>&nbsp; ${esc(P.seek.trim())}</div>` : '')
      + (nm ? `<div style="margin:22px 0 0"><a href="${nm}" style="display:inline-block;padding:${av ? '5px 18px 5px 5px' : '10px 20px'};border-radius:999px;background:${t.acc};color:${t.card};text-decoration:none;font:bold 13px/1 ${F}">`
        + (av ? `<img src="${esc(av)}" width="30" height="30" alt="" style="display:inline-block;width:30px;height:30px;margin-right:10px;border:2px solid ${t.card};border-radius:50%;vertical-align:middle">` : '')
        + `<span style="vertical-align:middle">Neomail ${esc(user)}</span></a></div>` : '')
      + '</div>';
    const body = P.layout === 'list'
      ? `<div style="max-width:620px;margin:0 auto;padding:22px 20px 8px">${list.map(row).join('')}</div>`
      : `<div style="padding:22px 12px 8px;text-align:center">${list.map(card).join('')}</div>`;
    const foot = `<div style="padding:18px 24px 30px;text-align:center;color:${t.mute};font:11px/1.4 ${F};letter-spacing:1px">UPDATED ${d.getDate()} ${MON[d.getMonth()].toUpperCase()} ${d.getFullYear()}${okUser ? ` &middot; <a href="https://www.neopets.com/userlookup.phtml?user=${encodeURIComponent(user)}" style="color:${t.mute}">${esc(user)}</a>` : ''}</div>`;
    return `<div style="max-width:980px;margin:24px auto;background:${t.bg};border:1px solid ${t.line};border-radius:28px;overflow:hidden;color:${t.ink};font:14px/1.5 ${F}">${head}${body}${foot}</div>`;
  }

  const CSS = `
#nqPP { --pp-bg: #fbf7ee; --pp-card: #fff; --pp-line: #e6dcf5; --pp-text: #392d5c; --pp-mute: #6c6290; --pp-acc: #7c5cf0; --pp-soft: #efe8ff; position: fixed; inset: 0; z-index: 2147483100; display: none; align-items: center; justify-content: center; padding: 24px; background: rgba(30,22,52,.5); font-family: 'Outfit', system-ui, sans-serif; color: var(--pp-text); }
#nqPP.open { display: flex; }
#nqPP * { box-sizing: border-box; }
#nqPP .ppWin { position: relative; display: grid; grid-template-columns: 320px 1fr; width: min(1280px, 100%); height: min(860px, 100%); border: 3px solid #fff; border-radius: 26px; background: var(--pp-bg); box-shadow: 0 30px 80px rgba(40,28,80,.45); overflow: hidden; }
#nqPP .ppSide { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid var(--pp-line); }
#nqPP .ppHead { padding: 18px 20px 12px; }
#nqPP .ppHead h2 { margin: 0; font: 800 24px/1.1 'Outfit', system-ui, sans-serif; letter-spacing: -.02em; color: var(--pp-text); }
#nqPP .ppHead p { margin: 4px 0 0; font-size: 12.5px; color: var(--pp-mute); }
#nqPP .ppForm { flex: 1; min-height: 0; overflow: auto; padding: 4px 20px 16px; }
#nqPP .ppSec { padding: 12px 0; border-top: 1px solid var(--pp-line); }
#nqPP .ppSec:first-child { border-top: 0; }
#nqPP .ppLbl { display: block; margin: 0 0 7px; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--pp-mute); }
#nqPP input[type=text], #nqPP textarea { width: 100%; margin: 0 0 8px; padding: 8px 11px; border: 1px solid var(--pp-line); border-radius: 11px; background: var(--pp-card); color: var(--pp-text); font: 13.5px/1.4 'Outfit', system-ui, sans-serif; outline: none; resize: vertical; }
#nqPP input[type=text]:focus, #nqPP textarea:focus { border-color: var(--pp-acc); box-shadow: 0 0 0 3px var(--pp-soft); }
#nqPP .ppSeg { display: flex; gap: 2px; padding: 3px; margin: 0 0 8px; border: 1px solid var(--pp-line); border-radius: 12px; background: var(--pp-card); }
#nqPP .ppSeg button { flex: 1; min-width: 0; height: 30px; padding: 0 6px; border: 0; border-radius: 9px; background: transparent; color: var(--pp-mute); font: 600 12.5px/1 'Outfit', system-ui, sans-serif; cursor: pointer; white-space: nowrap; }
#nqPP .ppSeg button:hover:not(:disabled) { color: var(--pp-text); background: var(--pp-soft); }
#nqPP .ppSeg button.on { background: var(--pp-acc); color: #fff; }
#nqPP .ppSeg button:disabled { opacity: .4; cursor: default; }
#nqPP .ppThemes { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 0 0 8px; }
#nqPP .ppTh { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 0; border: 0; background: none; color: var(--pp-mute); font: 600 11px/1 'Outfit', system-ui, sans-serif; cursor: pointer; }
#nqPP .ppTh i { display: block; width: 100%; aspect-ratio: 1; border-radius: 14px; box-shadow: 0 0 0 1px var(--pp-line); overflow: hidden; transition: box-shadow .15s, transform .15s; }
#nqPP .ppTh i b { display: block; height: 50%; }
#nqPP .ppTh:hover i { transform: translateY(-2px); }
#nqPP .ppTh.on { color: var(--pp-text); }
#nqPP .ppTh.on i { box-shadow: 0 0 0 2px var(--pp-acc), 0 6px 14px rgba(124,92,240,.25); }
#nqPP .ppRow { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 32px; font-size: 13.5px; cursor: pointer; }
#nqPP .ppRow input { position: absolute; opacity: 0; pointer-events: none; }
#nqPP .ppRow i { position: relative; flex: none; width: 34px; height: 20px; border-radius: 999px; background: #d9d0ec; transition: background .15s; }
#nqPP .ppRow i::after { content: ''; position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform .15s; }
#nqPP .ppRow input:checked + i { background: var(--pp-acc); }
#nqPP .ppRow input:checked + i::after { transform: translateX(14px); }
#nqPP .ppRow input:focus-visible + i { box-shadow: 0 0 0 3px var(--pp-soft); }
#nqPP .ppLink { padding: 0; border: 0; background: none; color: var(--pp-acc); font: 600 12.5px/1 'Outfit', system-ui, sans-serif; cursor: pointer; }
#nqPP .ppLink:hover { text-decoration: underline; }
#nqPP .ppFoot { display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--pp-line); background: var(--pp-card); }
#nqPP .ppFoot small { flex: 1; font-size: 12px; color: var(--pp-mute); line-height: 1.35; }
#nqPP .ppBtn { height: 38px; padding: 0 18px; border: 0; border-radius: 999px; background: var(--pp-acc); color: #fff; font: 700 14px/1 'Outfit', system-ui, sans-serif; cursor: pointer; white-space: nowrap; }
#nqPP .ppBtn:hover { background: #6a49e0; }
#nqPP .ppMain { position: relative; display: flex; flex-direction: column; min-width: 0; min-height: 0; background: #fff; }
#nqPP .ppBar { display: flex; align-items: center; gap: 10px; padding: 12px 14px 12px 18px; border-bottom: 1px solid var(--pp-line); background: var(--pp-bg); }
#nqPP .ppBar b { flex: 1; font-size: 13px; font-weight: 600; color: var(--pp-mute); }
#nqPP .ppX { width: 34px; height: 34px; padding: 0; border: 1px solid var(--pp-line); border-radius: 999px; background: var(--pp-card); color: var(--pp-text); font: 700 20px/1 'Outfit', system-ui, sans-serif; cursor: pointer; }
#nqPP .ppX:hover { border-color: var(--pp-acc); }
#nqPP iframe { flex: 1; width: 100%; min-height: 0; border: 0; background: #fff; }
#nqPP .ppEmpty { position: absolute; inset: 60px 0 0; display: flex; align-items: center; justify-content: center; padding: 40px; text-align: center; color: var(--pp-mute); font-size: 15px; line-height: 1.5; background: #fff; }
#nqPP .ppEmpty[hidden] { display: none; }
#nqPP .ppToast { position: absolute; left: 50%; bottom: 24px; transform: translate(-50%, 8px); padding: 8px 18px; border-radius: 999px; background: #392d5c; color: #fff; font-size: 13px; font-weight: 600; opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; z-index: 3; }
#nqPP .ppToast.on { opacity: 1; transform: translate(-50%, 0); }
@media (max-width: 820px) { #nqPP { padding: 0; } #nqPP .ppWin { grid-template-columns: 1fr; grid-template-rows: auto 1fr; height: 100%; border-radius: 0; border: 0; } #nqPP .ppSide { max-height: 52vh; border-right: 0; border-bottom: 1px solid var(--pp-line); } }
html[data-nq-modern-interface]:not(.nq-side-light) #nqPP { --pp-bg: #1f1b2e; --pp-card: #2a2540; --pp-line: rgba(255,255,255,.1); --pp-text: #f1ecff; --pp-mute: #b3a9d4; --pp-acc: #a58bff; --pp-soft: rgba(165,139,255,.18); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqPP .ppWin { border-color: #2a2540; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqPP .ppSeg button.on, html[data-nq-modern-interface]:not(.nq-side-light) #nqPP .ppBtn { color: #1d1a2b; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqPP .ppBtn:hover { background: #b8a2ff; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqPP .ppRow i { background: rgba(255,255,255,.18); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqPP .ppToast { background: #f1ecff; color: #1d1a2b; }
`;

  let el = null, toastT = 0, html = '', rT = 0;
  const seg = (key, opts) => `<div class="ppSeg" data-k="${key}">${opts.map(o => `<button type="button" data-v="${o[0]}"${o[2] ? ' disabled' : ''}>${o[1]}</button>`).join('')}</div>`;
  const sw = (key, label) => `<label class="ppRow"><span>${label}</span><input type="checkbox" data-sw="${key}"><i aria-hidden="true"></i></label>`;
  const toast = (m) => { const t = $('.ppToast', el); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800); };

  function shell() {
    const st = document.createElement('style'); st.textContent = CSS; (document.head || document.documentElement).appendChild(st);
    el = document.createElement('div'); el.id = 'nqPP'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Petpage builder');
    el.innerHTML = '<div class="ppWin"><div class="ppSide"><div class="ppHead"><h2>Petpage</h2><p>Paste the code into Edit Pet Page. Images and links update by themselves.</p></div><div class="ppForm">'
      + '<div class="ppSec"><span class="ppLbl">Pets</span><div class="ppSrc"></div></div>'
      + '<div class="ppSec"><span class="ppLbl">Words</span><input type="text" data-f="title" maxlength="60" placeholder="Title: Up for trade"><textarea data-f="intro" rows="2" maxlength="400" placeholder="A line or two about you or your trades"></textarea><input type="text" data-f="seek" maxlength="140" placeholder="Looking for: e.g. UC Draiks, offers"><input type="text" data-f="contact" maxlength="20" placeholder="Neomail button username"></div>'
      + '<div class="ppSec"><span class="ppLbl">Colours</span><div class="ppThemes"></div><button type="button" class="ppLink" data-act="shuffle">Shuffle colours</button> &nbsp; <button type="button" class="ppLink" data-act="unshuffle">Reset</button></div>'
      + '<div class="ppSec"><span class="ppLbl">Layout</span>' + seg('layout', [['cards', 'Cards'], ['list', 'List']]) + seg('size', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']]) + seg('font', [['clean', 'Clean'], ['round', 'Round'], ['classic', 'Classic']]) + '</div>'
      + '<div class="ppSec"><span class="ppLbl">Age</span>' + seg('age', [['years', 'Years'], ['days', 'Days'], ['born', 'Birthday'], ['off', 'Hide']]) + '</div>'
      + '<div class="ppSec"><span class="ppLbl">Order</span>' + seg('sort', [['list', 'As listed'], ['name', 'Name'], ['age', 'Oldest']]) + '</div>'
      + '<div class="ppSec"><span class="ppLbl">Show</span>' + sw('note', 'Notes') + sw('sp', 'Colour / species') + '</div>'
      + '</div><div class="ppFoot"><small class="ppCount"></small><button type="button" class="ppBtn" data-act="copy">Copy code</button></div></div>'
      + '<div class="ppMain"><div class="ppBar"><b>Preview</b><button type="button" class="ppX" data-act="close" aria-label="Close" title="Close (Esc)">×</button></div><iframe title="Petpage preview" sandbox="allow-popups allow-same-origin"></iframe><div class="ppEmpty" hidden></div><div class="ppToast" role="status"></div></div></div>';
    document.body.appendChild(el);
    el.addEventListener('mousedown', (e) => { if (e.target === el) close(); });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const sg = b.closest('.ppSeg');
      if (sg && b.dataset.v) { P[sg.dataset.k] = b.dataset.v; savePrefs(); render(); return; }
      if (b.dataset.th) { P.theme = b.dataset.th; savePrefs(); render(); return; }
      const act = b.dataset.act;
      if (act === 'close') close();
      else if (act === 'shuffle') { P.shift = (P.shift + 1) % 360; savePrefs(); render(); }
      else if (act === 'unshuffle') { P.shift = 0; savePrefs(); render(); }
      else if (act === 'copy') copy();
    });
    el.addEventListener('change', (e) => { const k = e.target.dataset.sw; if (k) { P[k] = e.target.checked; savePrefs(); render(); } });
    el.addEventListener('input', (e) => { const k = e.target.dataset.f; if (!k) return; P[k] = e.target.value; savePrefs(); clearTimeout(rT); rT = setTimeout(render, 250); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('open')) { e.stopImmediatePropagation(); e.preventDefault(); close(); } }, true);
  }

  function render() {
    const picked = NQ.ap.picked(), uft = gather('uft');
    if (P.src === 'picked' && !picked) P.src = 'uft';
    $('.ppSrc', el).innerHTML = seg('src', [['uft', 'Up for trade · ' + uft.length], ['picked', 'Picked · ' + (picked ? picked.size : 0), !picked]]);
    el.querySelectorAll('.ppSeg').forEach(s => s.querySelectorAll('button').forEach(b => b.classList.toggle('on', P[s.dataset.k] === b.dataset.v)));
    const user = (P.contact || NQ.ap.user() || 'neopets').trim(), h = ((hash(user) % 360) + P.shift * 47) % 360;
    $('.ppThemes', el).innerHTML = Object.keys(THEMES).map(k => { const t = THEMES[k](h); return `<button type="button" class="ppTh${P.theme === k ? ' on' : ''}" data-th="${k}" title="${THEME_N[k]}"><i style="background:${t.bg}"><b style="background:linear-gradient(135deg,${t.acc},${t.acc2})"></b></i>${THEME_N[k]}</button>`; }).join('');
    el.querySelectorAll('[data-sw]').forEach(c => { c.checked = !!P[c.dataset.sw]; });
    el.querySelectorAll('[data-f]').forEach(f => { if (document.activeElement !== f) f.value = P[f.dataset.f] || ''; });
    $('[data-f=contact]', el).placeholder = 'Neomail button: ' + (NQ.ap.user() || 'username');
    const pets = P.src === 'picked' ? gather('picked') : uft, empty = $('.ppEmpty', el);
    empty.hidden = !!pets.length;
    empty.textContent = P.src === 'picked' ? 'Pick some pets in All Pets first.' : 'No Up for Trade pets yet. Tag some pets as Up for trade in All Pets (Edit tags), or use Pick pets.';
    html = pets.length ? build(pets) : '';
    const fr = $('iframe', el); let y = 0; try { y = fr.contentWindow.scrollY; } catch {}
    fr.onload = () => { try { fr.contentWindow.scrollTo(0, y); } catch {} };
    fr.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><base target="_blank"></head><body style="margin:0;padding:8px 12px;background:#fff">' + html + '</body></html>';
    const noAge = pets.filter(p => !p.born).length;
    $('.ppCount', el).textContent = pets.length ? fmtN(html.length) + ' characters' + (noAge && P.age !== 'off' ? ' · ' + noAge + ' without age yet (log in to that account once)' : '') : '';
  }

  async function copy() {
    if (!html) { toast('Nothing to copy yet'); return; }
    try { await navigator.clipboard.writeText(html); toast('Copied. Paste it into Edit Pet Page.'); }
    catch { const ta = document.createElement('textarea'); ta.value = html; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} ta.remove(); toast(ok ? 'Copied. Paste it into Edit Pet Page.' : 'Copy failed'); }
  }

  function open() {
    if (!NQ.ap) return;
    if (!el) shell();
    loadPrefs();
    if (NQ.ap.picked()) P.src = 'picked';
    el.classList.add('open');
    render();
  }
  function close() { if (el) el.classList.remove('open'); }

  NQ.petpage = { open, build: (pets, prefs) => { const keep = P; P = { ...DEF, ...prefs }; try { return build(pets); } finally { P = keep; } } };
})();

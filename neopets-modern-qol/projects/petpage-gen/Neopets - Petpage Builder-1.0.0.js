// ==UserScript==
// @name         Neopets - Petpage Builder
// @namespace    neopets-qol-patcher
// @version      1.2.0
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
    light: (a) => ({ bg: '#ffffff', ink: '#16151a', mute: '#6e6c78', line: '#ececf0', tile: '#f4f4f6', acc: a }),
    warm: (a) => ({ bg: '#faf8f4', ink: '#221f1a', mute: '#77706a', line: '#ebe6dd', tile: '#f1ede5', acc: a }),
    dark: (a) => ({ bg: '#111114', ink: '#f4f3f7', mute: '#9b99a6', line: '#26252c', tile: '#1c1b21', acc: a })
  };
  const THEME_N = { light: 'Light', warm: 'Warm', dark: 'Dark' };
  const FONTS = { classic: 'Georgia,Cambria,serif', clean: 'Tahoma,Geneva,Verdana,sans-serif', book: 'Palatino,Cambria,Georgia,serif' };
  const SIZES = { s: [196, 15], m: [232, 16], l: [300, 18] };
  const DEF = { src: 'uft', theme: 'light', shift: 0, layout: 'cards', size: 'm', sp: false, note: true, font: 'classic', sort: 'list', title: '', intro: '', seek: '', contact: '', bg: '', bgName: '', bgThumb: '', bgAcc: '', bgEdge: '', bgKind: '', bgSrc: 'tiles', glass: '', glassFor: '' };
  const GLASS_H = 1440;
  const GLASS_RE = /^https:\/\/[^"'<>()\s?#]+\.(jpe?g|png)$/i;
  const NEO_IMG = /^https:\/\/(images|pets)\.neopets\.com\/[^"'<>()\s?#]+\.(png|jpe?g|gif)$/i;
  const cleanUrl = (u) => String(u || '').split(/[?#]/)[0];
  const SAFE_IMG = /^https:\/\/[^"'<>()\s]+$/i;

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
  const nyear = (born) => born ? 'Y' + (new Date(born).getFullYear() - 1998) : '';

  const mix = (a, b, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - k) + parseInt(b.substr(i, 2), 16) * k).toString(16).padStart(2, '0')).join('');
  const lum = (c) => [1, 3, 5].reduce((s, i, j) => s + parseInt(c.substr(i, 2), 16) / 255 * [0.2126, 0.7152, 0.0722][j], 0);
  const accentOf = () => {
    const user = (P.contact || NQ.ap.user() || '').trim();
    const seed = hex(((hash(user || 'neopets') % 360) + P.shift * 47) % 360, 58, 46);
    return NEO_IMG.test(P.bg) && /^#[0-9a-f]{6}$/i.test(P.bgAcc || '') && !P.shift ? P.bgAcc : seed;
  };

  function build(pets, previewGlass) {
    const user = (P.contact || NQ.ap.user() || '').trim(), okUser = /^[A-Za-z0-9_]{3,20}$/.test(user);
    const dark = P.theme === 'dark', base = accentOf();
    const t = (THEMES[P.theme] || THEMES.light)(dark ? mix(base, '#ffffff', 0.3) : base);
    const acc = t.acc, soft = mix(acc, t.bg, dark ? 0.8 : 0.9), onAcc = lum(acc) > 0.55 ? '#16151a' : '#ffffff';
    const F = FONTS[P.font] || FONTS.classic, S = 'Verdana,Geneva,sans-serif';
    const [cw, ns] = SIZES[P.size] || SIZES.m;
    const list = pets.slice();
    if (P.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    else if (P.sort === 'age') list.sort((a, b) => (a.born || 9e15) - (b.born || 9e15));
    const tx = (px, lh, w, c, fam) => `color:${c};font-family:${fam || F};font-size:${px}px;line-height:${lh}px;font-weight:${w || 'normal'}`;
    const cap = (px, ls, c, w) => `text-transform:uppercase;letter-spacing:${ls}px;${tx(px, px + 6, w || 'bold', c, S)}`;
    const look = (p) => 'https://www.neopets.com/petlookup.phtml?pet=' + encodeURIComponent(p.name);
    const img = (p, w) => `<img src="https://pets.neopets.com/cpn/${encodeURIComponent(p.name)}/1/7.png" width="${w}" height="${w}" alt="${esc(p.name)}" style="display:block;border:0">`;
    const tile = (p, w, r, cls) => `<a href="${look(p)}" title="${esc(p.name)}" class="${cls}" style="display:block;width:${w}px;height:${w}px;border-radius:${r}px;background:${t.tile};overflow:hidden">${img(p, w)}</a>`;
    const sp = (p) => P.sp ? [p.color, p.species].filter(Boolean).join(' ') : '';
    const yb = (p) => p.born ? `<span style="display:inline-block;padding:3px 9px;border-radius:999px;background:${soft};${cap(10, 1, acc)}">${nyear(p.born)}</span>` : '';
    const anyS = list.some(p => sp(p)), anyN = P.note && list.some(p => p.note);

    const card = (p) => `<div style="display:inline-block;vertical-align:top;width:${cw}px;margin:0 11px 38px;text-align:left">`
      + tile(p, cw, 18, 'nqppA')
      + `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:14px;border-collapse:collapse"><tr>`
      + `<td style="vertical-align:middle"><a href="${look(p)}" style="text-decoration:none;letter-spacing:-0.3px;${tx(ns + 3, ns + 8, 'bold', t.ink)}">${esc(p.name)}</a></td>`
      + `<td style="vertical-align:middle;text-align:right;white-space:nowrap;padding-left:8px">${yb(p)}</td></tr></table>`
      + (anyS ? `<div style="margin-top:5px;${cap(10, 1, t.mute)}">${sp(p) ? esc(sp(p)) : '&nbsp;'}</div>` : '')
      + (anyN ? `<div style="margin-top:6px;min-height:19px;${tx(13, 19, 'normal', acc, S)}">${P.note && p.note ? esc(p.note) : '&nbsp;'}</div>` : '')
      + '</div>';
    const row = (p) => `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border-bottom:1px solid ${t.line}"><tr>`
      + `<td style="width:112px;padding:16px 0;vertical-align:middle">${tile(p, 96, 14, 'nqppR')}</td>`
      + `<td style="padding:16px 0 16px 8px;vertical-align:middle;text-align:left"><a href="${look(p)}" style="text-decoration:none;letter-spacing:-0.3px;${tx(20, 26, 'bold', t.ink)}">${esc(p.name)}</a>`
      + (sp(p) ? `<div style="margin-top:4px;${cap(10, 1, t.mute)}">${esc(sp(p))}</div>` : '')
      + (P.note && p.note ? `<div style="margin-top:5px;${tx(13, 19, 'normal', acc, S)}">${esc(p.note)}</div>` : '') + '</td>'
      + `<td style="padding:16px 0;vertical-align:middle;text-align:right;white-space:nowrap">${yb(p)}</td></tr></table>`;

    const prof = okUser && NQ.ap.prof ? NQ.ap.prof(user) : null;
    const av = prof && NEO_IMG.test(prof.avatar || '') ? prof.avatar : '';
    const title = P.title.trim() || 'Up for trade';
    const nm = okUser ? `https://www.neopets.com/neomessages.phtml?type=send&recipient=${encodeURIComponent(user)}` : '';
    const bgOn = NEO_IMG.test(P.bg);
    const words = `<div style="width:44px;height:4px;border-radius:4px;background:${acc}"></div>`
      + `<div style="margin-top:22px;letter-spacing:-1px;${tx(54, 60, 'bold', t.ink)}">${esc(title)}</div>`
      + (P.intro.trim() ? `<div style="max-width:460px;margin-top:18px;${tx(16, 26, 'normal', t.mute, S)}">${esc(P.intro.trim()).replace(/\n/g, '<br>')}</div>` : '')
      + (P.seek.trim() ? `<div style="margin-top:20px;${tx(14, 22, 'normal', t.ink, S)}"><span style="${cap(10, 2, acc)}">Looking for</span>&nbsp;&nbsp; ${esc(P.seek.trim())}</div>` : '')
      + (nm ? `<div style="margin-top:30px"><a href="${nm}" style="display:inline-block;padding:${av ? '6px 22px 6px 6px' : '13px 24px'};border-radius:999px;background:${acc};text-decoration:none;${tx(14, 18, 'bold', onAcc, S)}">`
        + (av ? `<img src="${esc(av)}" width="32" height="32" alt="avatar" style="display:inline-block;width:32px;height:32px;border-radius:999px;vertical-align:middle">` : '')
        + `<span style="vertical-align:middle;padding-left:${av ? 12 : 0}px">Neomail ${esc(user)}</span></a>`
        + `<a href="https://www.neopets.com/userlookup.phtml?user=${encodeURIComponent(user)}" style="margin-left:22px;text-decoration:none;vertical-align:middle;${tx(14, 18, 'bold', t.ink, S)}">View lookup <span style="color:${acc}">&rarr;</span></a></div>` : '');
    const hero = `<div style="padding:64px 0 48px">${words}</div>`;
    const body = P.layout === 'list'
      ? `<div style="max-width:720px;margin:0 auto;border-top:1px solid ${t.line}">${list.map(row).join('')}</div>`
      : `<div style="margin:0 -11px;text-align:center">${list.map(card).join('')}</div>`;
    const cnt = `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 28px;border-collapse:collapse;border-top:1px solid ${t.line}"><tr><td style="padding-top:16px;${cap(11, 3, t.mute)}">${list.length} ${list.length === 1 ? 'pet' : 'pets'}</td>`
      + `<td style="padding-top:16px;text-align:right;${cap(11, 3, t.mute)}">${{ list: 'As listed', name: 'By name', age: 'Oldest first' }[P.sort] || ''}</td></tr></table>`;
    stamp = Date.now();
    const cr = mix(t.mute, t.bg, 0.4);
    const credit = `<div style="padding:${bgOn ? 90 : 150}px 20px 34px;text-align:center"><a href="https://www.neopets.com/userlookup.phtml?user=alyaad" title="nqpp ${stamp}" style="text-decoration:none;${cap(9, 3, cr)}">CSS by alyaad</a></div>`;
    const zA = Math.round(cw * 0.06), zR = 6, zM = 10;
    const hover = `<style>\n.nqppA:hover img{width:${cw + zA * 2}px;height:${cw + zA * 2}px;margin-left:-${zA}px;margin-top:-${zA}px}\n.nqppR:hover img{width:${96 + zR * 2}px;height:${96 + zR * 2}px;margin-left:-${zR}px;margin-top:-${zR}px}\n.nqppM:hover img{width:${160 + zM * 2}px;height:${160 + zM * 2}px;margin-left:-${zM}px;margin-top:-${zM}px}\n.nqppA:hover,.nqppR:hover,.nqppM:hover{background:${soft}}\n</style>`;
    const gUrl = bgOn && P.glassFor === P.bg ? (GLASS_RE.test(P.glass) ? P.glass : previewGlass || '') : '';
    if (gUrl) {
      const edge = /^#[0-9a-f]{6}$/i.test(P.bgEdge || '') ? P.bgEdge : t.tile;
      return `${hover}<div style="background-color:${edge};background-image:url(${gUrl});background-repeat:no-repeat;background-position:center 0;background-attachment:fixed;padding:80px 20px;${tx(14, 21, 'normal', t.ink, S)}"><div style="max-width:1040px;margin:0 auto;padding:0 44px;background-color:${t.bg};background-image:url(${gUrl});background-repeat:no-repeat;background-position:center -${GLASS_H}px;background-attachment:fixed;border:1px solid ${dark ? '#3a3a44' : '#ffffff'};border-radius:30px">${hero}${cnt}${body}${credit}</div></div>`;
    }
    if (bgOn && P.bgKind === 'tile') {
      const edge = /^#[0-9a-f]{6}$/i.test(P.bgEdge || '') ? P.bgEdge : t.tile;
      return `${hover}<div style="background-color:${edge};background-image:url(${P.bg});background-repeat:repeat;background-attachment:fixed;padding:72px 20px;${tx(14, 21, 'normal', t.ink, S)}"><div style="max-width:1040px;margin:0 auto;padding:0 44px;background:${t.bg};border-radius:30px">${hero}${cnt}${body}${credit}</div></div>`;
    }
    if (bgOn) {
      const rows = Math.ceil(list.length / 3), est = 560 + (P.layout === 'list' ? list.length * 130 : rows * (cw + 110)) + 260;
      const size = Math.min(3200, Math.max(1700, est + 160)), edge = /^#[0-9a-f]{6}$/i.test(P.bgEdge || '') ? P.bgEdge : t.tile;
      return `${hover}<div style="background:${edge};overflow:hidden;text-align:center;font-size:0;line-height:0">`
        + `<img src="${esc(P.bg)}" width="${size}" height="${size}" alt="background" style="display:inline-block;vertical-align:top;border:0;margin:0 -9999px"><br>`
        + `<div style="display:inline-block;vertical-align:top;width:100%;margin-top:-${size - 72}px;padding-bottom:72px;text-align:left;${tx(14, 21, 'normal', t.ink, S)}"><div style="padding:0 20px"><div style="max-width:1040px;margin:0 auto;padding:0 44px;background:${t.bg};border-radius:30px">${hero}${cnt}${body}${credit}</div></div></div></div>`;
    }
    return `${hover}<div style="background:${t.bg};${tx(14, 21, 'normal', t.ink, S)}"><div style="max-width:1040px;margin:0 auto;padding:0 28px">${hero}${cnt}${body}</div>${credit}</div>`;
  }


  const CSS = `
#nqPP { --pp-bg: #fbf7ee; --pp-card: #fff; --pp-line: #e6dcf5; --pp-text: #392d5c; --pp-mute: #6c6290; --pp-acc: #7c5cf0; --pp-soft: #efe8ff; position: fixed; inset: 0; z-index: 2147483100; display: none; align-items: center; justify-content: center; padding: 24px; background: rgba(30,22,52,.5); font-family: 'Outfit', system-ui, sans-serif; color: var(--pp-text); }
#nqPP.open { display: flex; }
#nqPP * { box-sizing: border-box; }
#nqPP .ppWin { position: relative; display: grid; grid-template-columns: 320px 1fr; grid-template-rows: minmax(0, 1fr); width: min(1280px, 100%); height: min(860px, 100%); border: 3px solid #fff; border-radius: 26px; background: var(--pp-bg); box-shadow: 0 30px 80px rgba(40,28,80,.45); overflow: hidden; overflow: clip; }
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
#nqPP .ppThemes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 0 0 8px; }
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
#nqPP .ppMain { position: relative; display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; background: #fff; }
#nqPP .ppBar { display: flex; align-items: center; gap: 10px; padding: 12px 14px 12px 18px; border-bottom: 1px solid var(--pp-line); background: var(--pp-bg); }
#nqPP .ppBar b { flex: 1; font-size: 13px; font-weight: 600; color: var(--pp-mute); }
#nqPP .ppX { width: 34px; height: 34px; padding: 0; border: 1px solid var(--pp-line); border-radius: 999px; background: var(--pp-card); color: var(--pp-text); font: 700 20px/1 'Outfit', system-ui, sans-serif; cursor: pointer; }
#nqPP .ppX:hover { border-color: var(--pp-acc); }
#nqPP iframe { flex: 1; width: 100%; min-height: 0; border: 0; background: #fff; }
#nqPP .ppEmpty { position: absolute; inset: 60px 0 0; display: flex; align-items: center; justify-content: center; padding: 40px; text-align: center; color: var(--pp-mute); font-size: 15px; line-height: 1.5; background: #fff; }
#nqPP .ppEmpty[hidden] { display: none; }
#nqPP .ppBgCur { display: flex; align-items: center; gap: 10px; margin: 0 0 8px; padding: 6px; border: 1px solid var(--pp-line); border-radius: 12px; background: var(--pp-card); font-size: 13px; }
#nqPP .ppBgCur i { flex: none; width: 40px; height: 40px; border-radius: 8px; background: var(--pp-soft) center / cover no-repeat; }
#nqPP .ppBgCur b { flex: 1; min-width: 0; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#nqPP .ppBgGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; max-height: 172px; overflow: auto; margin: 0 0 4px; }
#nqPP .ppBgGrid:empty { display: none; }
#nqPP .ppBgGrid button { aspect-ratio: 1; padding: 0; border: 2px solid transparent; border-radius: 10px; background: var(--pp-soft) center / cover no-repeat; cursor: pointer; }
#nqPP .ppBgGrid button:hover, #nqPP .ppBgGrid button.on { border-color: var(--pp-acc); }
#nqPP .ppBgGrid small { grid-column: 1 / -1; color: var(--pp-mute); font-size: 12px; }
#nqPP .ppGlass { margin-top: 12px; }
#nqPP .ppGlass[hidden] { display: none; }
#nqPP .ppBtn2 { width: 100%; height: 34px; margin: 0 0 8px; border: 1px solid var(--pp-acc); border-radius: 11px; background: var(--pp-card); color: var(--pp-acc); font: 700 13px/1 'Outfit', system-ui, sans-serif; cursor: pointer; }
#nqPP .ppBtn2:hover { background: var(--pp-soft); }
#nqPP .ppHint { display: block; font-size: 11.5px; line-height: 1.4; color: var(--pp-mute); }
#nqPP .ppToast { position: absolute; left: 50%; bottom: 24px; transform: translate(-50%, 8px); padding: 8px 18px; border-radius: 999px; background: #392d5c; color: #fff; font-size: 13px; font-weight: 600; opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; z-index: 3; }
#nqPP .ppToast.on { opacity: 1; transform: translate(-50%, 0); }
@media (max-width: 820px) { #nqPP { padding: 0; } #nqPP .ppWin { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); height: 100%; border-radius: 0; border: 0; } #nqPP .ppSide { max-height: 52vh; border-right: 0; border-bottom: 1px solid var(--pp-line); } }
html[data-nq-modern-interface]:not(.nq-side-light) #nqPP { --pp-bg: #1f1b2e; --pp-card: #2a2540; --pp-line: rgba(255,255,255,.1); --pp-text: #f1ecff; --pp-mute: #b3a9d4; --pp-acc: #a58bff; --pp-soft: rgba(165,139,255,.18); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqPP .ppWin { border-color: #2a2540; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqPP .ppSeg button.on, html[data-nq-modern-interface]:not(.nq-side-light) #nqPP .ppBtn { color: #1d1a2b; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqPP .ppBtn:hover { background: #b8a2ff; }
html[data-nq-modern-interface]:not(.nq-side-light) #nqPP .ppRow i { background: rgba(255,255,255,.18); }
html[data-nq-modern-interface]:not(.nq-side-light) #nqPP .ppToast { background: #f1ecff; color: #1d1a2b; }
`;

  let el = null, toastT = 0, html = '', rT = 0, stamp = 0;
  const seg = (key, opts) => `<div class="ppSeg" data-k="${key}">${opts.map(o => `<button type="button" data-v="${o[0]}"${o[2] ? ' disabled' : ''}>${o[1]}</button>`).join('')}</div>`;
  const sw = (key, label) => `<label class="ppRow"><span>${label}</span><input type="checkbox" data-sw="${key}"><i aria-hidden="true"></i></label>`;
  const toast = (m) => { const t = $('.ppToast', el); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800); };

  function shell() {
    const st = document.createElement('style'); st.textContent = CSS; (document.head || document.documentElement).appendChild(st);
    el = document.createElement('div'); el.id = 'nqPP'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Petpage builder');
    el.innerHTML = '<div class="ppWin"><div class="ppSide"><div class="ppHead"><h2>Petpage</h2><p>Paste the code into Edit Pet Page. Images and links update by themselves.</p></div><div class="ppForm">'
      + '<div class="ppSec"><span class="ppLbl">Pets</span><div class="ppSrc"></div></div>'
      + '<div class="ppSec"><span class="ppLbl">Words</span><input type="text" data-f="title" maxlength="60" placeholder="Title: Up for trade"><textarea data-f="intro" rows="2" maxlength="400" placeholder="A line or two about you or your trades"></textarea><input type="text" data-f="seek" maxlength="140" placeholder="Looking for: e.g. UC Draiks, offers"><input type="text" data-f="contact" maxlength="20" placeholder="Neomail button username"></div>'
      + '<div class="ppSec"><span class="ppLbl">Background</span><div class="ppBgCur"></div>' + seg('bgSrc', [['tiles', 'Patterns'], ['scenes', 'Scenes']]) + '<input type="text" class="ppBgQ" placeholder="Filter patterns…" aria-label="Search backgrounds"><div class="ppBgGrid"></div><div class="ppGlass"><span class="ppLbl">Frosted glass</span><button type="button" class="ppBtn2" data-act="mkglass">Make frosted backdrop</button><input type="text" data-f="glass" placeholder="Paste the uploaded image&#39;s Direct link"><small class="ppHint"></small></div>'
      + '</div>'
      + '<div class="ppSec"><span class="ppLbl">Page</span><div class="ppThemes"></div><button type="button" class="ppLink" data-act="shuffle">Shuffle accent</button> &nbsp; <button type="button" class="ppLink" data-act="unshuffle">Reset</button></div>'
      + '<div class="ppSec"><span class="ppLbl">Layout</span>' + seg('layout', [['cards', 'Cards'], ['list', 'List']]) + seg('size', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']]) + seg('font', [['classic', 'Classic'], ['book', 'Book'], ['clean', 'Clean']]) + '</div>'
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
      else if (act === 'mkglass') makeGlass();
      else if (act === 'bgnone') { P.bg = ''; P.bgName = ''; P.bgThumb = ''; P.bgAcc = ''; savePrefs(); render(); }
      else if (act === 'bgside') {
        const u = cleanUrl(LSget('nq_bg_main_v3'));
        if (!NEO_IMG.test(u)) { toast(u ? 'Your sidebar wallpaper is not hosted on Neopets, so petpages cannot show it' : 'No sidebar wallpaper picked yet'); return; }
        P.bg = u; P.bgName = 'Sidebar wallpaper'; P.bgThumb = u; P.bgKind = 'scene'; P.bgAcc = ''; P.bgEdge = ''; P.shift = 0; savePrefs(); render(); pickAccent(u).then(() => { savePrefs(); render(); });
      }
      else if (b.dataset.bg) { const it = bgItems[+b.dataset.bg]; if (it) { P.bg = it.url; P.bgName = it.name; P.bgThumb = it.thumb; P.bgKind = it.kind; P.bgAcc = ''; P.bgEdge = ''; P.shift = 0; savePrefs(); render(); pickAccent(it.url).then(() => { savePrefs(); render(); }); } }
    });
    el.addEventListener('change', (e) => { const k = e.target.dataset.sw; if (k) { P[k] = e.target.checked; savePrefs(); render(); } });
    $('.ppBgQ', el).addEventListener('input', (e) => { clearTimeout(bgT); bgT = setTimeout(() => bgSearch(e.target.value.trim()), 350); });
    el.addEventListener('input', (e) => { const k = e.target.dataset.f; if (!k) return; P[k] = e.target.value.trim() === '' ? '' : e.target.value; if (k === 'glass') { P.glass = P.glass.trim(); P.glassFor = P.bg; } savePrefs(); clearTimeout(rT); rT = setTimeout(render, 250); });
    window.addEventListener('resize', () => { if (el.classList.contains('open')) { clearTimeout(rT); rT = setTimeout(render, 200); } });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('open')) { e.stopImmediatePropagation(); e.preventDefault(); close(); } }, true);
  }

  function render() {
    const picked = NQ.ap.picked(), uft = gather('uft');
    if (P.src === 'picked' && !picked) P.src = 'uft';
    $('.ppSrc', el).innerHTML = seg('src', [['uft', 'Up for trade · ' + uft.length], ['picked', 'Picked · ' + (picked ? picked.size : 0), !picked]]);
    el.querySelectorAll('.ppSeg').forEach(s => s.querySelectorAll('button').forEach(b => b.classList.toggle('on', P[s.dataset.k] === b.dataset.v)));
    const a0 = accentOf();
    $('.ppThemes', el).innerHTML = Object.keys(THEMES).map(k => { const t = THEMES[k](a0); return `<button type="button" class="ppTh${P.theme === k ? ' on' : ''}" data-th="${k}" title="${THEME_N[k]}"><i style="background:${t.bg}"><b style="display:block;width:40%;height:22%;margin:39% auto 0;border-radius:99px;background:${t.acc}"></b></i>${THEME_N[k]}</button>`; }).join('');
    el.querySelectorAll('[data-sw]').forEach(c => { c.checked = !!P[c.dataset.sw]; });
    el.querySelectorAll('[data-f]').forEach(f => { if (document.activeElement !== f) f.value = P[f.dataset.f] || ''; });
    const hasBg = NEO_IMG.test(P.bg);
    if (bgSrcShown !== P.bgSrc) { bgSrcShown = P.bgSrc; const qi = $('.ppBgQ', el); qi.placeholder = P.bgSrc === 'scenes' ? 'Search scenes, e.g. forest…' : 'Filter patterns…'; bgSearch(qi.value.trim()); }
    $('.ppBgCur', el).innerHTML = hasBg
      ? `<i style="background-image:url(&quot;${esc(P.bgThumb || P.bg)}&quot;)"></i><b title="${esc(P.bgName)}">${esc(P.bgName || 'Background')}</b><button type="button" class="ppLink" data-act="bgnone">Remove</button>`
      : `<b>None (plain page)</b><button type="button" class="ppLink" data-act="bgside">Use sidebar wallpaper</button>`;
    $('.ppGlass', el).hidden = !hasBg;
    const gOk = GLASS_RE.test(P.glass || ''), gMine = P.glassFor === P.bg;
    $('.ppHint', el).textContent = !hasBg ? '' : P.glass && !gOk ? 'That link must start with https:// and end in .jpg or .png (use the Direct link on postimg).' : gOk && gMine ? 'Frosted glass is on.' : gOk && !gMine ? 'That image was made for a different background. Make a new one for this background.' : localGlass && localGlassFor === P.bg ? 'Previewing it now. Upload the downloaded image to postimg.cc and paste its Direct link; the copied code uses it after that.' : 'Makes one image: a blurred backdrop plus a glass layer for the page. Upload it once to postimg.cc and paste its Direct link.';
    $('[data-f=contact]', el).placeholder = 'Neomail button: ' + (NQ.ap.user() || 'username');
    const pets = P.src === 'picked' ? gather('picked') : uft, empty = $('.ppEmpty', el);
    empty.hidden = !!pets.length;
    empty.textContent = P.src === 'picked' ? 'Pick some pets in All Pets first.' : 'No Up for Trade pets yet. Tag some pets as Up for trade in All Pets (Edit tags), or use Pick pets.';
    const prev = pets.length && localGlass && localGlassFor === P.bg && !(GLASS_RE.test(P.glass || '') && P.glassFor === P.bg) ? build(pets, localGlass) : '';
    html = pets.length ? build(pets) : '';
    const fr = $('iframe', el); let y = 0; try { y = fr.contentWindow.scrollY; } catch {}
    fr.onload = () => { try { fr.contentWindow.scrollTo(0, y); } catch {} };
    fr.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><base target="_blank"></head><body style="margin:0;padding:8px 12px;background:#fff;zoom:' + Math.min(1, Math.max(0.3, (fr.clientWidth || 1100) / Math.max(800, window.innerWidth - 17))).toFixed(3) + '">' + (prev || html) + '</body></html>';
    const noAge = pets.filter(p => !p.born).length;
    $('.ppCount', el).textContent = pets.length ? fmtN(html.length) + ' characters' + (noAge ? ' · ' + noAge + ' without age yet (log in to that account once)' : '') : '';
  }

  let bgItems = [], bgT = 0, bgTok = 0, bgSrcShown = '';
  const drawBgGrid = (grid, empty) => { grid.innerHTML = bgItems.length ? bgItems.map((b, i) => `<button type="button" data-bg="${i}" title="${esc(b.name)}" aria-label="${esc(b.name)}" class="${b.url === P.bg ? 'on' : ''}" style="background-image:url(&quot;${esc(b.thumb)}&quot;)"></button>`).join('') : `<small>${empty}</small>`; };
  async function loadTiles() {
    try { const c = JSON.parse(LSget('nq_pp_tiles_v1') || 'null'); if (c && c.list && c.list.length && Date.now() - c.t < 7 * 864e5) return c.list; } catch {}
    const doc = new DOMParser().parseFromString(await (await fetch('/backgrounds_tiled.phtml', { credentials: 'include' })).text(), 'text/html');
    const list = [...doc.querySelectorAll('img[src*="/backgrounds/tm_"]')].map(im => {
      const a = im.closest('a'), td = im.closest('td'), url = a ? a.href : '', name = td && td.querySelector('b') ? td.querySelector('b').textContent.trim() : 'Pattern';
      return NEO_IMG.test(url) ? { name, thumb: im.src, url, kind: 'tile' } : null;
    }).filter(Boolean);
    if (list.length) LSset('nq_pp_tiles_v1', JSON.stringify({ t: Date.now(), list }));
    return list;
  }
  function bgSearch(q) {
    const grid = $('.ppBgGrid', el);
    if (P.bgSrc !== 'scenes') {
      const tok = ++bgTok;
      grid.innerHTML = '<small>Loading Neopets patterns…</small>';
      loadTiles().then(list => {
        if (tok !== bgTok) return;
        const k = q.toLowerCase();
        bgItems = list.filter(x => !k || x.name.toLowerCase().includes(k));
        drawBgGrid(grid, 'No patterns match that.');
      }).catch(() => { if (tok === bgTok) grid.innerHTML = '<small>Could not load the Neopets pattern list.</small>'; });
      return;
    }
    if (!q) { grid.innerHTML = '<small>Type a word to search scenes, e.g. forest, beach, night.</small>'; return; }
    if (!NQ.dtiPage) { grid.innerHTML = '<small>Background search needs the full Modern QOL bundle.</small>'; return; }
    const tok = ++bgTok;
    grid.innerHTML = '<small>Searching…</small>';
    NQ.dtiPage(0, /background/i.test(q) ? q : q + ' background', 30).then(items => {
      if (tok !== bgTok) return;
      bgItems = items.map(it => { const l = (((it.appearanceOn || {}).layers) || []).find(x => /background/i.test((x.zone || {}).label || '')); const u = cleanUrl(l && l.imageUrl); return NEO_IMG.test(u) ? { name: it.name || 'Background', thumb: it.thumbnailUrl || u, url: u, kind: 'scene' } : null; }).filter(Boolean);
      drawBgGrid(grid, 'No Neopets-hosted scenes for that. Try another word.');
    }).catch(() => { if (tok === bgTok) grid.innerHTML = '<small>Search failed. Try again.</small>'; });
  }

  let localGlass = '', localGlassFor = '';
  async function makeGlass() {
    if (!NEO_IMG.test(P.bg)) { toast('Pick a background first'); return; }
    toast('Making frosted backdrop…');
    try {
      const src = URL.createObjectURL(await getBlob(P.bg));
      const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
      const W = 1920, H = GLASS_H, dark = P.theme === 'dark';
      const base = document.createElement('canvas'); base.width = W; base.height = H;
      const b = base.getContext('2d');
      if (P.bgKind === 'tile') { b.fillStyle = b.createPattern(im, 'repeat'); b.fillRect(0, 0, W, H); }
      else { const s = Math.max(W / im.width, H / im.height), dw = im.width * s, dh = im.height * s; b.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh); }
      URL.revokeObjectURL(src);
      const c = document.createElement('canvas'); c.width = W; c.height = H * 2;
      const x = c.getContext('2d');
      [0, H].forEach(y0 => {
        x.save(); x.beginPath(); x.rect(0, y0, W, H); x.clip();
        x.filter = `blur(${P.bgKind === 'tile' ? 22 : 30}px) saturate(1.3)`;
        x.drawImage(base, -90, y0 - 90, W + 180, H + 180);
        x.restore();
      });
      x.filter = 'none';
      x.fillStyle = dark ? 'rgba(10,10,14,0.35)' : 'rgba(0,0,0,0.06)'; x.fillRect(0, 0, W, H);
      x.fillStyle = dark ? 'rgba(20,20,26,0.74)' : 'rgba(255,255,255,0.74)'; x.fillRect(0, H, W, H);
      const d = x.getImageData(0, 0, W, H * 2);
      for (let i = 0; i < d.data.length; i += 4) { const g = (Math.random() - 0.5) * 6; d.data[i] += g; d.data[i + 1] += g; d.data[i + 2] += g; }
      x.putImageData(d, 0, 0);
      const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.9));
      if (localGlass) URL.revokeObjectURL(localGlass);
      localGlass = URL.createObjectURL(blob); localGlassFor = P.bg;
      const a = document.createElement('a');
      a.href = localGlass;
      a.download = 'frosted-' + (P.bgName || 'background').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.jpg';
      document.body.appendChild(a); a.click(); a.remove();
      P.glassFor = P.bg; savePrefs(); render();
      toast('Downloaded. The preview shows it now.');
    } catch { toast('Could not make the backdrop'); }
  }

  const getBlob = (url) => typeof GM_xmlhttpRequest === 'function'
    ? new Promise((res, rej) => GM_xmlhttpRequest({ method: 'GET', url, responseType: 'blob', timeout: 20000, onload: (r) => (r.status === 200 && r.response ? res(r.response) : rej(new Error('load'))), onerror: rej, ontimeout: rej }))
    : fetch(url, { mode: 'cors' }).then(r => r.blob());
  async function pickAccent(url) {
    try {
      const src = URL.createObjectURL(await getBlob(url));
      const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
      const c = document.createElement('canvas'); c.width = c.height = 48;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0, 48, 48); URL.revokeObjectURL(src);
      const d = x.getImageData(0, 0, 48, 48).data, bins = Array.from({ length: 24 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, sat = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
        if (d[i + 3] < 200 || sat < 0.25) continue;
        let h = mx === mn ? 0 : mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4;
        h = (h * 60 + 360) % 360;
        const w = sat * (1 - Math.abs(l - 0.5) * 2), k = bins[Math.floor(h / 15)];
        k.w += w; k.r += d[i] * w; k.g += d[i + 1] * w; k.b += d[i + 2] * w;
      }
      let ar = 0, ag = 0, ab = 0; for (let i = 0; i < d.length; i += 4) { ar += d[i]; ag += d[i + 1]; ab += d[i + 2]; }
      const np = d.length / 4; P.bgEdge = '#' + [ar, ag, ab].map(v => Math.round(v / np).toString(16).padStart(2, '0')).join('');
      const top = bins.reduce((a, k) => (k.w > a.w ? k : a), { w: 0 });
      if (!top.w) { P.bgAcc = ''; return; }
      const [r, g, b] = [top.r / top.w, top.g / top.w, top.b / top.w].map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      let h = mx === mn ? 0 : mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4;
      h = (h * 60 + 360) % 360;
      const l = (mx + mn) / 2, sat = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
      P.bgAcc = hex(Math.round(h), Math.round(Math.min(78, Math.max(45, sat * 100))), Math.round(Math.min(50, Math.max(38, l * 100))));
    } catch { P.bgAcc = ''; }
  }

  async function copy() {
    if (!html) { toast('Nothing to copy yet'); return; }
    const m = html.match(/nqpp (\d{13})/); if (m) LSset('nq_pp_copy', JSON.stringify({ t: +m[1] }));
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
    const u = (P.contact || NQ.ap.user() || '').trim(), pr = NQ.ap.prof(u);
    if (NQ.ap.refreshProf && /^[A-Za-z0-9_]{3,20}$/.test(u) && (!pr || Date.now() - (pr.ts || 0) > 5 * 60e3)) Promise.resolve(NQ.ap.refreshProf(u)).then(() => { if (el.classList.contains('open')) render(); }).catch(() => {});
  }
  function close() { if (el) el.classList.remove('open'); }

  let staleEl = null, staleOff = 0;
  function checkStale() {
    let last = 0; try { last = (JSON.parse(LSget('nq_pp_copy') || 'null') || {}).t || 0; } catch {}
    let mine = 0;
    document.querySelectorAll('textarea').forEach(ta => { const m = String(ta.value).match(/nqpp (\d{13})/); if (m) mine = Math.max(mine, +m[1]); });
    const stale = mine && last && last > mine + 1000 && staleOff !== last;
    if (!stale) { if (staleEl) staleEl.remove(); staleEl = null; return; }
    if (staleEl) return;
    const at = (n) => new Date(n).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    staleEl = document.createElement('div');
    staleEl.setAttribute('role', 'alert');
    staleEl.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483200;display:flex;align-items:center;gap:12px;max-width:min(680px,calc(100vw - 32px));padding:12px 14px 12px 18px;border-radius:14px;background:#b3261e;color:#fff;font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.3)';
    staleEl.innerHTML = '<span style="flex:1">This tab has older petpage code (built ' + at(mine) + '). You copied newer code at ' + at(last) + '. Paste the new code here, or close this tab and use the newer one.</span><button type="button" aria-label="Dismiss" style="flex:none;width:30px;height:30px;border:0;border-radius:999px;background:rgba(255,255,255,.2);color:#fff;font:700 18px/1 system-ui;cursor:pointer">×</button>';
    staleEl.querySelector('button').onclick = () => { staleOff = last; checkStale(); };
    document.body.appendChild(staleEl);
  }
  let staleT = 0;
  const staleSoon = () => { clearTimeout(staleT); staleT = setTimeout(checkStale, 300); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(checkStale, 800), { once: true }); else setTimeout(checkStale, 800);
  document.addEventListener('input', (e) => { if (e.target && e.target.tagName === 'TEXTAREA') staleSoon(); }, true);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') staleSoon(); });
  window.addEventListener('focus', staleSoon);
  window.addEventListener('storage', (e) => { if (e.key === 'nq_pp_copy') staleSoon(); });

  NQ.petpage = { open, build: (pets, prefs) => { const keep = P; P = { ...DEF, ...prefs }; try { return build(pets); } finally { P = keep; } } };
})();

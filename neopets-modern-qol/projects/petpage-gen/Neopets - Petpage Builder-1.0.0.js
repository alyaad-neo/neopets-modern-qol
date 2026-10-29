// ==UserScript==
// @name         Neopets - Petpage Builder
// @namespace    neopets-qol-patcher
// @version      1.0.8
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
    duo: (h) => ({ bg: '#ffffff', card: '#ffffff', ink: '#141414', mute: '#7a7a7a', acc: hex(h, 85, 56), acc2: hex((h + 75) % 360, 85, 60), ac: '#141414', line: '#e7e7e7', tint: '#f4f4f4', tint2: '#f4f4f4', duo: true }),
    yours: (h) => ({ bg: hex(h, 45, 97), card: '#ffffff', ink: hex(h, 32, 18), mute: hex(h, 12, 46), acc: hex(h, 62, 50), acc2: hex((h + 48) % 360, 70, 62), line: hex(h, 35, 89), tint: hex(h, 60, 94), tint2: hex((h + 48) % 360, 70, 93) }),
    dusk: (h) => ({ bg: hex(h, 26, 11), card: hex(h, 22, 16), ink: hex(h, 30, 94), mute: hex(h, 14, 68), acc: hex(h, 80, 74), acc2: hex((h + 48) % 360, 80, 70), line: hex(h, 20, 25), tint: hex(h, 26, 21), tint2: hex((h + 48) % 360, 30, 24) }),
    candy: (h) => ({ bg: hex((h + 24) % 360, 80, 96), card: '#ffffff', ink: hex(h, 40, 22), mute: hex(h, 18, 48), acc: hex((h + 330) % 360, 72, 58), acc2: hex((h + 60) % 360, 80, 64), line: hex((h + 24) % 360, 60, 88), tint: hex((h + 330) % 360, 90, 94), tint2: hex((h + 60) % 360, 90, 92) }),
    paper: (h) => ({ bg: '#f6f1e7', card: '#fffdf8', ink: '#2e2a24', mute: '#7a7064', acc: hex(h, 45, 42), acc2: hex(h, 45, 42), line: '#e6ddcc', tint: '#f1eadc', tint2: '#f1eadc' }),
    mono: () => ({ bg: '#ffffff', card: '#ffffff', ink: '#141414', mute: '#7a7a7a', acc: '#141414', acc2: '#141414', line: '#e7e7e7', tint: '#f4f4f4', tint2: '#f4f4f4' })
  };
  const THEME_N = { duo: 'Duo', yours: 'Yours', dusk: 'Dusk', candy: 'Candy', paper: 'Paper', mono: 'Mono' };
  const FONTS = { classic: 'Georgia,Cambria,serif', clean: 'Tahoma,Geneva,Verdana,sans-serif', book: 'Palatino,Cambria,Georgia,serif' };
  const SIZES = { s: [196, 0, 14], m: [236, 0, 16], l: [286, 0, 18] };
  const DEF = { src: 'uft', theme: 'duo', shift: 0, layout: 'cards', border: 'frame', size: 'm', sp: false, note: true, font: 'classic', sort: 'list', title: '', intro: '', seek: '', contact: '' };

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

  function build(pets) {
    const user = (P.contact || NQ.ap.user() || '').trim(), okUser = /^[A-Za-z0-9_]{3,20}$/.test(user);
    const t = THEMES[P.theme](((hash(user || 'neopets') % 360) + P.shift * 47) % 360), F = FONTS[P.font] || FONTS.classic;
    const [cw, , ns] = SIZES[P.size] || SIZES.m;
    const list = pets.slice();
    if (P.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    else if (P.sort === 'age') list.sort((a, b) => (a.born || 9e15) - (b.born || 9e15));
    const S = 'Verdana,Geneva,sans-serif', AC = t.ac || t.acc;
    const tx = (px, lh, w, c, fam) => `color:${c};font-family:${fam || F};font-size:${px}px;line-height:${lh}px;font-weight:${w || 'normal'}`;
    const cap = (px, ls, c, w) => `text-transform:uppercase;letter-spacing:${ls}px;${tx(px, px + 6, w || 'bold', c, S)}`;
    const mix = (a, b, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - k) + parseInt(b.substr(i, 2), 16) * k).toString(16).padStart(2, '0')).join('');
    const look = (p) => 'https://www.neopets.com/petlookup.phtml?pet=' + encodeURIComponent(p.name);
    const img = (p, w) => `<img src="https://pets.neopets.com/cpn/${encodeURIComponent(p.name)}/1/7.png" width="${w}" height="${w}" alt="${esc(p.name)}" style="display:block;border:0">`;
    const gf = P.border !== 'divider';
    const strip = (n, h) => `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;font-size:0;line-height:0;background:${mix(t.acc, t.acc2, 0.5)}"><tr>${Array.from({ length: n }, (_, i) => `<td height="${h}" style="height:${h}px;background:${mix(t.acc, t.acc2, i / (n - 1))}"></td>`).join('')}</tr></table>`;
    const sp = (p) => P.sp ? [p.color, p.species].filter(Boolean).join(' ') : '';
    const detail = (p) => [sp(p) && `<span style="${cap(9, 1, t.mute)}">${esc(sp(p))}</span>`, P.note && p.note && `<span style="${tx(12, 16, 'normal', AC)}">${esc(p.note)}</span>`].filter(Boolean).join(`<span style="color:${t.line}">&nbsp; | &nbsp;</span>`);
    const anyD = list.some(p => detail(p));
    const ring1 = mix(t.bg, t.ink, 0.05), ring2 = mix(t.bg, t.ink, 0.1), edge = mix(t.bg, t.ink, 0.16);
    const gframe = (inner, r, extra) => {
      const n = 12, bw = 3, col = (i) => mix(t.acc, t.acc2, i / (n - 1)), mid = col(Math.round((n - 1) / 2));
      const edge = '<tr>' + Array.from({ length: n }, (_, i) => `<td height="${bw}" style="height:${bw}px;background:${col(i)}"></td>`).join('') + '</tr>';
      return `<div style="${extra}border-radius:${r}px;overflow:hidden;background:${mid}"><table cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;font-size:0;line-height:0;background:${mid}">${edge}<tr><td width="${bw}" style="width:${bw}px;background:${col(0)}"></td><td colspan="${n - 2}" style="padding:0;background:${mid};font-size:14px;line-height:21px">${inner}</td><td width="${bw}" style="width:${bw}px;background:${col(n - 1)}"></td></tr>${edge}</table></div>`;
    };
    const lift = (inner, r, extra) => `<div style="${extra || ''}padding:0;border:1px solid ${ring1};border-radius:${r + 2}px"><div style="border:1px solid ${ring2};border-radius:${r + 1}px">${inner}</div></div>`;
    const foil = (n, h, off) => `<table cellpadding="0" cellspacing="0" style="width:100%;height:${h}px;border-collapse:collapse;font-size:0;line-height:0;background:${t.acc}"><tr>${Array.from({ length: n }, (_, i) => { const k = ((i / (n - 1)) * 2 + off) % 2; return `<td style="height:${h}px;background:${k < 1 ? mix(t.acc, t.acc2, k) : mix(t.acc2, t.acc, k - 1)}"></td>`; }).join('')}</tr></table>`;
    const yb = (p) => p.born ? `<span style="display:inline-block;padding:2px 7px;border:1px solid ${mix(AC, t.card, 0.55)};border-radius:999px;${cap(9, 1, AC)}">${nyear(p.born)}</span>` : '';

    const card = (p, i) => {
      const w = cw - 6, d = detail(p);
      const inner = `<div style="width:${w}px;background:${t.card};${gf ? 'border-radius:7px' : `border:1px solid ${edge};border-radius:16px`};overflow:hidden;text-align:left">`
        + `<a href="${look(p)}" title="${esc(p.name)}" class="nqppA" style="display:block;width:${w}px;height:${w}px;background:${t.tint};overflow:hidden">${img(p, w)}</a>`
        + (gf ? '' : t.duo ? strip(24, 4) : foil(16, 3, (i * 0.37) % 2))
        + `<div style="padding:12px 14px 14px">`
        + `<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse"><tr>`
        + `<td style="vertical-align:middle"><a href="${look(p)}" style="text-decoration:none;${tx(ns + 3, ns + 7, 'bold', t.ink)}">${esc(p.name)}</a></td>`
        + `<td style="vertical-align:middle;text-align:right;white-space:nowrap;padding-left:6px">${yb(p)}</td></tr></table>`
        + (anyD ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid ${t.line};min-height:32px;${tx(12, 16, 'normal', t.mute)}">${d || '&nbsp;'}</div>` : '')
        + '</div></div>';
      return gf ? gframe(inner, 10, 'display:inline-block;vertical-align:top;margin:10px;') : lift(inner, 16, 'display:inline-block;vertical-align:top;margin:10px;');
    };
    const row = (p, i) => {
      const d = detail(p);
      const inner = `<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;background:${t.card};border:1px solid ${edge};border-radius:14px"><tr>`
        + `<td style="width:112px;padding:8px 0 8px 8px;vertical-align:middle"><a href="${look(p)}" title="${esc(p.name)}" class="nqppR" style="display:block;width:104px;height:104px;border-radius:10px;background:${t.tint};overflow:hidden">${img(p, 104)}</a></td>`
        + `<td style="padding:10px 18px;vertical-align:middle;text-align:left"><a href="${look(p)}" style="text-decoration:none;${tx(20, 24, 'bold', t.ink)}">${esc(p.name)}</a>&nbsp; ${yb(p)}`
        + (d ? `<div style="margin-top:6px">${d}</div>` : '') + '</td></tr></table>';
      return gf ? gframe(inner.replace(`border:1px solid ${edge};border-radius:14px`, 'border-radius:8px'), 11, 'margin:0 0 12px;') : lift(inner, 14, 'margin:0 0 12px;');
    };

    const prof = okUser && NQ.ap.prof ? NQ.ap.prof(user) : null;
    const av = prof && /^https:\/\/images\.neopets\.com\/[^"'<>()\s]+$/i.test(prof.avatar || '') ? prof.avatar : '';
    const title = P.title.trim() || 'Up for trade';
    const nm = okUser ? `https://www.neopets.com/neomessages.phtml?type=send&recipient=${encodeURIComponent(user)}` : '';
    const fade = (from, to) => Array.from({ length: 12 }, (_, i) => `<div style="height:4px;font-size:0;line-height:0;background:${mix(from, to, (i + 1) / 13)}"></div>`).join('');
    const chars = [...title], side = 16, cols = side * 2 + chars.length, gc = (i) => mix(t.acc, t.acc2, i / (cols - 1));
    const lum = (c) => [1, 3, 5].reduce((s, i, j) => s + parseInt(c.substr(i, 2), 16) / 255 * [0.2126, 0.7152, 0.0722][j], 0);
    const ink = lum(mix(t.acc, t.acc2, 0.5)) > 0.6 ? '#1c1a24' : '#ffffff';
    const bandRow = (h) => '<tr>' + Array.from({ length: cols }, (_, i) => `<td height="${h}" style="height:${h}px;background:${gc(i)}"></td>`).join('') + '</tr>';
    const titleRow = '<tr>' + Array.from({ length: cols }, (_, i) => {
      const c = i - side;
      if (c < 0 || c >= chars.length) return `<td width="${Math.floor(50 / side)}%" style="background:${gc(i)}"></td>`;
      return `<td style="padding:0;white-space:nowrap;vertical-align:middle;background:${gc(i)};${tx(50, 58, 'bold', ink)}">${chars[c] === ' ' ? '&nbsp;' : esc(chars[c])}</td>`;
    }).join('') + '</tr>';
    const band = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;font-size:0;line-height:0;background:${gc(Math.round(cols / 2))}">${bandRow(46)}${titleRow}${bandRow(42)}</table>`;
    const head = `<div style="padding:18px 20px 8px;text-align:center">`
      + (P.intro.trim() ? `<div style="max-width:540px;margin:14px auto 0;${tx(15, 24, 'normal', t.mute, S)}">${esc(P.intro.trim()).replace(/\n/g, '<br>')}</div>` : '')
      + (P.seek.trim() ? `<div style="margin:14px 0 0;${tx(13, 20, 'normal', t.ink, S)}"><span style="${cap(9, 2, AC)}">Looking for</span>&nbsp;&nbsp; ${esc(P.seek.trim())}</div>` : '')
      + (nm ? `<div style="margin:22px 0 0">` + lift(`<a href="${nm}" style="display:inline-block;padding:${av ? '5px 20px 5px 5px' : '10px 22px'};background:${t.card};border:1px solid ${edge};border-radius:999px;text-decoration:none;${tx(13, 16, 'bold', t.ink, S)}">`
        + (av ? `<img src="${esc(av)}" width="34" height="34" alt="avatar" style="display:inline-block;width:34px;height:34px;border-radius:999px;vertical-align:middle">` : '')
        + `<span style="vertical-align:middle;padding-left:${av ? 12 : 0}px">Neomail ${esc(user)}</span><span style="vertical-align:middle;padding-left:10px;color:${AC}">&rarr;</span></a>`, 999, 'display:inline-block;') + '</div>' : '')
      + '</div>';
    const body = P.layout === 'list'
      ? `<div style="max-width:640px;margin:0 auto;padding:26px 20px 8px">${list.map(row).join('')}</div>`
      : `<div style="max-width:1060px;margin:0 auto;padding:24px 8px 8px;text-align:center">${list.map(card).join('')}</div>`;
    const cr = mix(t.mute, '#ffffff', 0.45);
    stamp = Date.now();
    const credit = `<div style="padding:180px 20px 28px;text-align:center;background:#ffffff"><a href="https://www.neopets.com/userlookup.phtml?user=alyaad" title="nqpp ${stamp}" style="text-decoration:none;${cap(9, 3, cr)}">CSS by alyaad</a></div>`;
    const cw0 = cw - 6;
    const zA = Math.round(cw0 * 0.08), zR = 8;
    const hover = `<style>\n.nqppA:hover img{width:${cw0 + zA * 2}px;height:${cw0 + zA * 2}px;margin-left:-${zA}px;margin-top:-${zA}px}\n.nqppR:hover img{width:${104 + zR * 2}px;height:${104 + zR * 2}px;margin-left:-${zR}px;margin-top:-${zR}px}\n.nqppA:hover{background:${mix(t.tint, t.acc, 0.18)}}\n.nqppR:hover{background:${mix(t.tint, t.acc, 0.18)}}\n</style>`;
    return `${hover}<div style="margin:0;${tx(14, 21, 'normal', t.ink)}"><div style="background:${t.bg}">${band}${head}${body}</div>${fade(t.bg, '#ffffff')}${credit}</div>`;
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
#nqPP .ppThemes { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin: 0 0 8px; }
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
      + '<div class="ppSec"><span class="ppLbl">Colours</span><div class="ppThemes"></div><button type="button" class="ppLink" data-act="shuffle">Shuffle colours</button> &nbsp; <button type="button" class="ppLink" data-act="unshuffle">Reset</button></div>'
      + '<div class="ppSec"><span class="ppLbl">Layout</span>' + seg('layout', [['cards', 'Cards'], ['list', 'List']]) + seg('border', [['frame', 'Gradient frame'], ['divider', 'Gradient divider']]) + seg('size', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']]) + seg('font', [['classic', 'Classic'], ['book', 'Book'], ['clean', 'Clean']]) + '</div>'
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
    window.addEventListener('resize', () => { if (el.classList.contains('open')) { clearTimeout(rT); rT = setTimeout(render, 200); } });
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
    fr.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><base target="_blank"></head><body style="margin:0;padding:8px 12px;background:#fff;zoom:' + Math.min(1, Math.max(0.3, (fr.clientWidth || 1100) / Math.max(800, window.innerWidth - 17))).toFixed(3) + '">' + html + '</body></html>';
    const noAge = pets.filter(p => !p.born).length;
    $('.ppCount', el).textContent = pets.length ? fmtN(html.length) + ' characters' + (noAge ? ' · ' + noAge + ' without age yet (log in to that account once)' : '') : '';
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

// Cascade dedupe for the sidebar/HUD CSS.
// Finds declarations that can never win and (with --apply) deletes them from the source files.
// Usage: node dedupe.js <base.js> <patcher.js> [--apply] [--report out.txt] [--supports out.json]
'use strict';
const fs = require('fs');
const [baseFile, patchFile] = process.argv.slice(2, 4);
const APPLY = process.argv.includes('--apply');
const argVal = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };

// ---------- template literal extraction ----------
function literal(src, name) {
  const head = 'const ' + name + ' = `';
  const s = src.indexOf(head);
  if (s < 0) throw new Error('missing ' + name);
  const start = s + head.length;
  let i = start;
  while (i < src.length) {
    if (src[i] === '\\') { i += 2; continue; }
    if (src[i] === '`') break;
    if (src[i] === '$' && src[i + 1] === '{') throw new Error('interpolation in ' + name);
    i++;
  }
  return { start, end: i, text: src.slice(start, i) };
}

// ---------- CSS parser (with nesting) ----------
// Items: {t:'decl', prop, value, imp, s, e} | {t:'rule', prelude, s, e, ps, items} | {t:'at', name, prelude, s, e, items|null}
function parseBlock(text, i, end) {
  const items = [];
  while (i < end) {
    // skip ws/comments
    const c = text[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && text[i + 1] === '*') { const j = text.indexOf('*/', i + 2); i = j + 2; continue; }
    if (c === '}') return { items, i };
    // read until ; { } at top level
    const s = i; let depthP = 0, q = null;
    while (i < end) {
      const ch = text[i];
      if (q) { if (ch === '\\') { i += 2; continue; } if (ch === q) q = null; i++; continue; }
      if (ch === '"' || ch === "'") { q = ch; i++; continue; }
      if (ch === '/' && text[i + 1] === '*') { i = text.indexOf('*/', i + 2) + 2; continue; }
      if (ch === '(' || ch === '[') depthP++;
      else if (ch === ')' || ch === ']') depthP--;
      else if (depthP === 0 && (ch === ';' || ch === '{' || ch === '}')) break;
      i++;
    }
    const ch = text[i];
    if (ch === '{') {
      const prelude = text.slice(s, i).replace(/\/\*[\s\S]*?\*\//g, '').trim();
      const ps = i;
      if (prelude[0] === '@') {
        const m = /^@([\w-]+)\s*([\s\S]*)$/.exec(prelude);
        const name = m[1].toLowerCase();
        if (name === 'keyframes' || name === 'font-face' || name === '-webkit-keyframes') {
          // skip balanced
          let d = 0, k = i;
          for (; k < end; k++) { if (text[k] === '{') d++; else if (text[k] === '}') { d--; if (!d) break; } }
          items.push({ t: 'at', name, prelude: m[2], s, e: k + 1, items: null });
          i = k + 1; continue;
        }
        const r = parseBlock(text, i + 1, end);
        items.push({ t: 'at', name, prelude: m[2].trim(), s, e: r.i + 1, ps, items: r.items });
        i = r.i + 1; continue;
      }
      const r = parseBlock(text, i + 1, end);
      items.push({ t: 'rule', prelude, s, e: r.i + 1, ps, items: r.items });
      i = r.i + 1; continue;
    }
    // declaration
    const raw = text.slice(s, i);
    const e = ch === ';' ? i + 1 : i;
    const colon = raw.indexOf(':');
    if (colon > 0) {
      const prop = raw.slice(0, colon).trim();
      let value = raw.slice(colon + 1).trim();
      let imp = false;
      const m = /!\s*important\s*$/i.exec(value);
      if (m) { imp = true; value = value.slice(0, m.index).trim(); }
      items.push({ t: 'decl', prop: prop.startsWith('--') ? prop : prop.toLowerCase(), value, imp, s, e });
    }
    if (ch === ';') i++;
  }
  return { items, i };
}

// ---------- selectors ----------
function splitTop(str, sep) {
  const out = []; let d = 0, q = null, last = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (q) { if (ch === '\\') { i++; continue; } if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") q = ch;
    else if (ch === '(' || ch === '[') d++;
    else if (ch === ')' || ch === ']') d--;
    else if (d === 0 && ch === sep) { out.push(str.slice(last, i)); last = i + 1; }
  }
  out.push(str.slice(last));
  return out.map(x => x.trim()).filter(Boolean);
}
function resolve(parents, prelude) {
  const kids = splitTop(prelude, ',');
  const out = [];
  for (const p of parents) for (const k of kids) {
    if (!p) out.push(k);
    else if (k.includes('&')) out.push(k.replace(/&/g, p));
    else out.push(p + ' ' + k);
  }
  return out;
}
// tokenize a selector into compounds + combinators
function compounds(sel) {
  const parts = []; let cur = '', d = 0, q = null;
  const flush = () => { if (cur.trim()) parts.push({ c: cur.trim() }); cur = ''; };
  for (let i = 0; i < sel.length; i++) {
    const ch = sel[i];
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[') d++;
    if (ch === ')' || ch === ']') d--;
    if (d === 0 && (ch === '>' || ch === '+' || ch === '~' || /\s/.test(ch))) {
      flush();
      if (/\s/.test(ch)) { if (parts.length && !parts[parts.length - 1].k) parts.push({ k: ' ' }); }
      else { if (parts.length && parts[parts.length - 1].k === ' ') parts.pop(); parts.push({ k: ch }); }
      continue;
    }
    cur += ch;
  }
  flush();
  if (parts.length && parts[parts.length - 1].k) parts.pop();
  return parts;
}
// simple selectors of a compound
function simples(c) {
  const out = []; let i = 0;
  while (i < c.length) {
    let j = i + 1;
    if (c[i] === '[') { let d = 0; for (j = i; j < c.length; j++) { if (c[j] === '[') d++; else if (c[j] === ']') { d--; if (!d) break; } } j++; }
    else if (c[i] === ':') {
      if (c[i + 1] === ':') j = i + 2;
      while (j < c.length && /[\w-]/.test(c[j])) j++;
      if (c[j] === '(') { let d = 0; for (; j < c.length; j++) { if (c[j] === '(') d++; else if (c[j] === ')') { d--; if (!d) break; } } j++; }
    } else {
      while (j < c.length && /[\w-\\*]/.test(c[j])) j++;
    }
    out.push(c.slice(i, j)); i = j;
  }
  return out;
}
const LEGACY_PE = /^:(before|after|first-line|first-letter)$/i;
function spec(sel) {
  let a = 0, b = 0, c = 0;
  for (const p of compounds(sel)) {
    if (p.k) continue;
    for (const s of simples(p.c)) {
      if (s[0] === '#') a++;
      else if (s[0] === '.' || s[0] === '[') b++;
      else if (s.startsWith('::') || LEGACY_PE.test(s)) c++;
      else if (s[0] === ':') {
        const m = /^:([\w-]+)\((.*)\)$/s.exec(s);
        if (m && /^(not|is|has|matches)$/i.test(m[1])) {
          let best = [0, 0, 0];
          for (const x of splitTop(m[2], ',')) { const t = spec(x); if (cmp(t, best) > 0) best = t; }
          a += best[0]; b += best[1]; c += best[2];
        } else if (m && /^where$/i.test(m[1])) { /* 0 */ }
        else b++;
      } else if (s !== '*') c++;
    }
  }
  return [a, b, c];
}
function cmp(x, y) { for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; }

// Facts: these base cards are created as direct children of #npHud and never moved.
const DIRECT_KIDS = ['#npUser', '#npBank', '#npNp', '#npQrActive', '#npActivePet'];
function canon(sel) {
  let parts = compounds(sel).map(p => {
    if (p.k) return p;
    let ss = simples(p.c);
    if (ss[0] === 'html') ss = ss.filter(x => x !== '[data-np-modern-interface]');
    ss = [...new Set(ss)];
    const head = /^[a-z*]/i.test(ss[0] || '') ? [ss.shift()] : [];
    const pe = ss.filter(x => x.startsWith('::') || LEGACY_PE.test(x));
    const rest = ss.filter(x => !pe.includes(x)).sort();
    return { c: head.concat(rest, pe).join('') };
  });
  // drop a leading bare html (always an ancestor) with its combinator
  while (parts.length > 2 && parts[0].c === 'html' && (parts[1].k === ' ' || parts[1].k === '>')) parts = parts.slice(2);
  // drop "#npHud >/space" before a direct kid
  for (let i = 0; i + 2 < parts.length; i++) {
    if (parts[i].c === '#npHud' && (parts[i + 1].k === ' ' || parts[i + 1].k === '>') && DIRECT_KIDS.some(id => simples(parts[i + 2].c).includes(id))) {
      parts.splice(i, 2); i--;
    }
  }
  return parts.map(p => p.k ? (p.k === ' ' ? ' ' : p.k) : p.c).join('');
}

// ---------- shorthands (conservative) ----------
const SIDES = ['top', 'right', 'bottom', 'left'];
const COVER = {};
const add = (sh, list) => { COVER[sh] = new Set([...(COVER[sh] || []), ...list]); };
for (const box of ['margin', 'padding']) {
  add(box, [...SIDES.map(s => box + '-' + s), box + '-inline', box + '-block', box + '-inline-start', box + '-inline-end', box + '-block-start', box + '-block-end']);
  add(box + '-inline', [box + '-left', box + '-right', box + '-inline-start', box + '-inline-end']);
  add(box + '-block', [box + '-top', box + '-bottom', box + '-block-start', box + '-block-end']);
}
add('inset', [...SIDES, 'inset-inline', 'inset-block']);
add('border', ['border-width', 'border-style', 'border-color', ...SIDES.flatMap(s => ['border-' + s, 'border-' + s + '-width', 'border-' + s + '-style', 'border-' + s + '-color'])]);
for (const s of SIDES) add('border-' + s, ['border-' + s + '-width', 'border-' + s + '-style', 'border-' + s + '-color']);
add('border-color', SIDES.map(s => 'border-' + s + '-color'));
add('border-width', SIDES.map(s => 'border-' + s + '-width'));
add('border-radius', ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius']);
add('background', ['background-color', 'background-image', 'background-size', 'background-repeat', 'background-position', 'background-position-x', 'background-position-y', 'background-clip', 'background-origin', 'background-attachment']);
add('font', ['font-size', 'font-weight', 'font-style', 'font-family', 'line-height']);
add('gap', ['row-gap', 'column-gap', 'grid-gap']);
add('overflow', ['overflow-x', 'overflow-y']);
add('flex', ['flex-grow', 'flex-shrink', 'flex-basis']);
add('flex-flow', ['flex-direction', 'flex-wrap']);
add('grid-row', ['grid-row-start', 'grid-row-end']);
add('grid-column', ['grid-column-start', 'grid-column-end']);
add('transition', ['transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay']);
add('animation', ['animation-name', 'animation-duration', 'animation-timing-function', 'animation-delay', 'animation-iteration-count', 'animation-direction', 'animation-fill-mode', 'animation-play-state']);
add('place-items', ['align-items', 'justify-items']);
add('place-content', ['align-content', 'justify-content']);
add('outline', ['outline-color', 'outline-style', 'outline-width']);
const covers = (w, l) => w === l || (COVER[w] && COVER[w].has(l));

// ---------- flatten ----------
// sheet: name, order offset, killable-by set
function flatten(items, parents, media, out, meta) {
  for (const it of items) {
    if (it.t === 'decl') {
      for (const sel of parents) {
        if (!sel) continue;
        out.push({ ...meta, d: it, sel, key: canon(sel), sp: spec(sel), media, prop: it.prop, imp: it.imp, order: meta.base + it.s });
      }
    } else if (it.t === 'rule') {
      flatten(it.items, resolve(parents, it.prelude), media, out, meta);
    } else if (it.t === 'at' && it.items) {
      if (it.name === 'media' || it.name === 'supports') flatten(it.items, parents, media.concat(it.name + ' ' + it.prelude.replace(/\s+/g, ' ')), out, meta);
      else flatten(it.items, parents, media.concat('?' + it.name + it.prelude), out, meta);
    }
  }
}

const baseSrc = fs.readFileSync(baseFile, 'utf8');
const patchSrc = fs.readFileSync(patchFile, 'utf8');
const sheets = [
  { file: 'base', src: baseSrc, name: 'HUD_CSS', base: 0, part: 'hud' },
  { file: 'patch', src: patchSrc, name: 'PAGE_CSS', base: 1e7, part: 'page' },
  { file: 'patch', src: patchSrc, name: 'LAYOUT_CSS', base: 2e7, part: 'layout' },
  { file: 'patch', src: patchSrc, name: 'BAR_CSS', base: 3e7, part: 'bar' },
];
// Which parts are always present when the loser's part is present (and its element visible).
// hud: npp-css (page+layout+bar) is present on every page where #npHud is visible (NC hides it, auth strips it).
const CAN_KILL = { hud: ['hud', 'page', 'layout', 'bar', 'inline'], page: ['page', 'layout', 'bar', 'inline'], layout: ['page', 'layout', 'bar', 'inline'], bar: ['bar'] };
const all = [];
for (const sh of sheets) {
  const lit = literal(sh.src, sh.name);
  sh.lit = lit;
  sh.tree = parseBlock(lit.text, 0, lit.text.length).items;
  flatten(sh.tree, [''], [], all, { part: sh.part, base: sh.base, sheet: sh });
}
// HUD_CSS: only touch rules about the HUD itself (hidden on NC by NC_CSS, stripped on auth pages).
const HUD_IDS = ['#npHud', ...DIRECT_KIDS];
// Inline PET_IMG_STYLE on the first #npActivePet > img (fixPetImg: every 1.5s, on mutation, ResizeObserver).
{
  const m = /const PET_IMG_STYLE = '([^']*)'/.exec(patchSrc);
  for (const dec of m[1].split(';')) {
    const c = dec.indexOf(':'); if (c < 0) continue;
    let v = dec.slice(c + 1).trim(); const imp = /!important$/.test(v); v = v.replace(/!important$/, '').trim();
    all.push({ part: 'inline', d: { value: v }, sel: '#npActivePet > img', key: canon('#npActivePet > img'), sp: [9, 9, 9], media: [], prop: dec.slice(0, c).trim(), imp, order: 9e7, inline: true });
  }
}

function beats(w, l) {
  if (w.inline && !l.inline) return w.imp || !l.imp;
  if (w.imp !== l.imp) return w.imp;
  const c = cmp(w.sp, l.sp);
  if (c) return c > 0;
  return w.order > l.order;
}
const byKey = new Map();
for (const x of all) { if (!byKey.has(x.key)) byKey.set(x.key, []); byKey.get(x.key).push(x); }
for (const x of all) {
  if (x.inline) continue;
  if (x.part === 'hud' && !HUD_IDS.some(id => x.key.includes(id))) continue;
  const w = byKey.get(x.key).find(y => y !== x && CAN_KILL[x.part].includes(y.part) && covers(y.prop, x.prop) && y.media.every(m => x.media.includes(m)) && beats(y, x));
  if (w) x.deadBy = w;
}
// A declaration is dead only if dead for every selector of its rule.
const declInfo = new Map();
for (const x of all) {
  if (x.inline) continue;
  if (!declInfo.has(x.d)) declInfo.set(x.d, { list: [], sheet: x.sheet });
  declInfo.get(x.d).list.push(x);
}
const dead = new Set();
const report = [];
for (const [d, inf] of declInfo) {
  if (inf.list.every(x => x.deadBy)) {
    dead.add(d);
    const w = inf.list[0].deadBy;
    report.push(`${inf.sheet.name} | ${inf.list.map(x => x.sel.replace('html[data-np-modern-interface] ', '')).join(', ')} | ${d.prop}: ${d.value}${d.imp ? ' !important' : ''}  <= ${w.part}:${w.sel.replace('html[data-np-modern-interface] ', '')} {${w.prop}: ${w.d.value}${w.imp ? ' !important' : ''}}${w.media.length ? ' @' + w.media.join(' & ') : ''}`);
  }
}
const winners = new Map();
for (const x of all) if (x.deadBy && dead.has(x.d) && !x.deadBy.inline) winners.set(x.deadBy.prop + ': ' + x.deadBy.d.value, [x.deadBy.prop, x.deadBy.d.value]);
console.log('declarations:', declInfo.size, 'dead:', dead.size);
if (argVal('--report')) fs.writeFileSync(argVal('--report'), report.join('\n') + '\n');
if (argVal('--supports')) fs.writeFileSync(argVal('--supports'), JSON.stringify([...winners.values()]));

// ---------- apply ----------
// Collect deletion spans per sheet (offsets inside the literal), remove empty rules/at-rules.
function spansFor(items, text, out) {
  // returns true if the block ends up empty
  let live = 0;
  for (const it of items) {
    if (it.t === 'decl') { if (dead.has(it)) out.push(declSpan(text, it)); else live++; }
    else if (it.t === 'rule' || (it.t === 'at' && it.items)) {
      const sub = [];
      const empty = spansFor(it.items, text, sub);
      if (empty) out.push(blockSpan(text, it)); else { out.push(...sub); live++; }
    } else live++;
  }
  return live === 0;
}
function declSpan(text, it) {
  let s = it.s, e = it.e;
  const ls = text.lastIndexOf('\n', s - 1) + 1;
  const le = text.indexOf('\n', e) < 0 ? text.length : text.indexOf('\n', e);
  if (/^\s*$/.test(text.slice(ls, s)) && /^\s*$/.test(text.slice(e, le).replace(/\r$/, ''))) return [ls, Math.min(le + 1, text.length)];
  while (text[e] === ' ') e++;
  return [s, e];
}
function blockSpan(text, it) {
  let s = it.s, e = it.e;
  // swallow a comment directly in front (only whitespace between)
  const before = text.slice(0, s);
  const m = /\*\/[ \t]*(\r?\n[ \t]*)?$/.exec(before);
  if (m) { const cs = before.lastIndexOf('/*', m.index); if (cs >= 0) s = cs; }
  const ls = text.lastIndexOf('\n', s - 1) + 1;
  const le = text.indexOf('\n', e) < 0 ? text.length : text.indexOf('\n', e);
  if (/^\s*$/.test(text.slice(ls, s)) && /^\s*$/.test(text.slice(e, le).replace(/\r$/, ''))) return [ls, Math.min(le + 1, text.length)];
  while (text[e] === ' ') e++;
  return [s, e];
}
if (APPLY) {
  const edits = { base: [], patch: [] };
  for (const sh of sheets) {
    const sp = [];
    spansFor(sh.tree, sh.lit.text, sp);
    for (const [a, b] of sp) edits[sh.file].push([sh.lit.start + a, sh.lit.start + b]);
  }
  for (const [file, src] of [['base', baseSrc], ['patch', patchSrc]]) {
    const list = edits[file].sort((x, y) => y[0] - x[0]);
    let out = src;
    let prev = Infinity;
    for (const [a, b] of list) { if (b > prev) throw new Error('overlap'); out = out.slice(0, a) + out.slice(b); prev = a; }
    fs.writeFileSync(file === 'base' ? baseFile : patchFile, out);
    console.log(file, 'removed spans:', list.length, 'bytes:', src.length - out.length);
  }
}

// Drops !important from declarations inside one shadow root when the declaration still wins without it.
// Page CSS can't reach into a shadow root, so only that root's own sheets and our inline styles compete.
// A flag goes only when: the selector has no :host, no src file writes that property inline, every rule in the
// root that may hit the same element with an overlapping property is not !important, and this one beats it
// on specificity (or ties and comes later). Selectors with :is/:where/:not/:has always keep their flag.
// Usage: node tools/css-unimportant.js <bar|editor> [--apply]
'use strict';
const fs = require('fs');
const path = require('path');
const dedupe = fs.readFileSync(path.join(__dirname, 'css-dedupe.js'), 'utf8');
eval(dedupe.slice(dedupe.indexOf('function parseBlock'), dedupe.indexOf('// tokenize a selector')).replace(/^function (\w+)/gm, 'global.$1 = function $1'));
const merge = fs.readFileSync(path.join(__dirname, 'css-merge.js'), 'utf8');
for (const name of ['literalEnd', 'family', 'rightmost', 'specificity']) {
  const s = merge.indexOf('function ' + name + '(');
  eval('global.' + name + ' = ' + merge.slice(s, merge.indexOf('\n}\n', s) + 2));
}

const PROJ = path.join(__dirname, '..', 'projects');
const MQ = 'modern-qol/src/';
const DAILY = 'dailies-qol/Neopets - Dailies Tracker-1.0.0.js';
const DRAWER = 'account-drawer/Neopets - Accounts Drawer-1.0.0.js';
const PINS = 'page-pins-qol/Neopets - Recently Viewed + Pin Pages-1.0.0.js';
const ROOTS = {
  bar: [[MQ + '20-layout.js', 'barStyle.textContent = `'], [MQ + '40-styles.js', 'const SHADOW_CSS = `']],
  editor: [[MQ + '25-hud.js', '    css.textContent = `'], [MQ + '40-styles.js', 'const EDITOR_CSS = `']],
  doc: [
    [MQ + '20-layout.js', 'const THEME = `'], [MQ + '20-layout.js', 'const FRAME = `'], 'KILL',
    [MQ + '25-hud.js', 'const HUD_CSS = `'], [MQ + '25-hud.js', 'st.textContent = `', '#btnOverlay{'],
    [MQ + '30-backgrounds.js', '  style.textContent = `'], [MQ + '30-backgrounds.js', 'recolorStyle.textContent = `'],
    [MQ + '15-core.js', "st.textContent = '"], [MQ + '85-account.js', "st.textContent = '"],
    [MQ + '40-styles.js', 'const PAGE_CSS = `'], [MQ + '40-styles.js', 'const LAYOUT_CSS = `'],
    [MQ + '40-styles.js', 'const NC_CSS = `'], [MQ + '40-styles.js', 'const BAR_CSS = `'], [MQ + '90-main.js', "pre.textContent = '"],
    [DAILY, 'const QAS_CSS = `'], [DAILY, 'const DAILY_CSS = `'], [DRAWER, 'const ACCT_CSS = `'], [DRAWER, 'const AP_CSS = `'], [PINS, 'const RECENT_CSS = `'],
  ],
};
const [which] = process.argv.slice(2);
const APPLY = process.argv.includes('--apply');
if (!ROOTS[which]) { console.log('usage: node tools/css-unimportant.js <bar|editor|doc> [--why] [--apply]'); process.exit(1); }
const DOC = which === 'doc';

const INLINE = {
  bar: [
    [/\.menu(?![\w-])|#menu-/, ['display', 'visibility', 'left', 'top', 'max-height']],
    [/\.nq-premcaret(?![\w-])/, ['display', 'left', 'top']],
    [/\.nq-prembg(?![\w-])/, ['display', 'position', 'z-index', 'left', 'top', 'width', 'height']],
  ],
  editor: [
    [/\.ico(?![\w-])/, ['background-image']],
    [/^div$/, ['opacity', 'font-size', 'text-align', 'padding']],
  ],
  doc: [
    [/#nq-host(?![\w-])/, ['position', 'top', 'left', 'right', 'z-index', 'pointer-events']],
    [/#nqScrollTrack(?![\w-])/, ['position', 'right', 'top', 'bottom', 'width', 'z-index', 'background', 'pointer-events', 'touch-action']],
    [/#nqScrollThumb(?![\w-])/, ['position', 'right', 'top', 'width', 'height', 'border-radius', 'background', 'box-shadow', 'opacity', 'transition', 'cursor']],
    [/#nqSideBtnHost(?![\w-])/, ['position', 'left', 'right', 'bottom', 'z-index', 'pointer-events']],
    [/#nqAcctDrawer(?![\w-])/, ['left', 'right', 'top', 'bottom', 'width', 'height']],
    [/#nqBgSidebar(?![\w-])/, ['transform']],
    [/#nqBgHandle(?![\w-])/, ['visibility']],
    [/#nqNestPop(?![\w-])/, ['left', 'top', '--tx']],
    [/#nqNestMenu(?![\w-])/, ['left', 'top']],
    [/#nqAvatar(?![\w-])/, ['background-image']],
    [/#nqActivePet(?![\w-])/, ['--nq-img-h']],
    [/\.qrPet(?![\w-])/, ['background-image']],
    [/\.nqSmall(?![\w-])/, ['margin-bottom']],
    [/\.col(?![\w-])/, ['display']],
    [/\.iconBtn(?![\w-])/, ['position', 'display', '--i']],
    [/\.nq-amount(?![\w-])|\.nq-nc(?![\w-])/, ['flex-grow']],
    [/\.nqVal(?![\w-])|\.ncVal(?![\w-])/, ['font-size']],
    [/^img|[^\w-]img/, ['display', 'object-position', 'object-fit', 'width', 'height', 'aspect-ratio', 'max-width', 'max-height', 'transform', 'background', 'border-radius', 'opacity', 'margin', 'box-shadow']],
    [/^a|[^\w-]a/, ['display']],
  ],
};
const OWN_ID = /^#(nq|qr|btnOverlay(?![\w-]))/;
const PINNED = /#nqListsMod \.nqLt/;
function owned(sel) {
  if (/__|#nqBell(?![\w-])/.test(sel)) return false;
  const ids = sel.match(/#[\w-]+/g) || [];
  return ids.length > 0 && ids.every(i => OWN_ID.test(i));
}
function inlineWritten(sel, p) {
  const last = sel.trim().split(/[\s>+~]+/).pop().replace(/::?[\w-]+(\([^)]*\))?/g, '');
  const vague = !/[.#]/.test(last);
  return INLINE[which].some(([re, props]) => (vague || re.test(last)) && props.some(q => overlap(p, q)));
}

function killText() {
  const src = fs.readFileSync(path.join(PROJ, MQ, '20-layout.js'), 'utf8');
  const s = src.indexOf('const KILL = [');
  const sels = [...src.slice(s, src.indexOf('];', s)).matchAll(/'([^']*)'/g)].map(m => m[1]);
  return sels.join(',\n') + '{display:none !important;visibility:hidden !important;height:0 !important;width:0 !important;overflow:hidden !important;}';
}
const sheets = ROOTS[which].map((spec, si) => {
  if (spec === 'KILL') { const text = killText(); return { file: null, si, items: parseBlock(text, 0, text.length).items }; }
  const [file, head, anchor] = spec;
  const src = fs.readFileSync(path.join(PROJ, file), 'utf8');
  let at = src.indexOf(head);
  if (anchor) at = src.lastIndexOf(head, src.indexOf(anchor));
  else if (at >= 0 && src.indexOf(head, at + 1) >= 0) throw new Error('head not unique in ' + file + ': ' + head);
  if (at < 0) throw new Error('head missing in ' + file + ': ' + head);
  const s = at + head.length, q = head[head.length - 1];
  const e = q === '`' ? literalEnd(src, s) : src.indexOf(q, s);
  const text = src.slice(s, e).replace(/\$\{[^}]*\}/g, m => 'X'.repeat(m.length)).replace(/\\n/g, '  ');
  return { file, src, s, si, items: parseBlock(text, 0, text.length).items };
});

const decls = [];
for (const sh of sheets) {
  const walk = (list, parents) => {
    for (const it of list) {
      if (it.t === 'rule') {
        const sels = resolve(parents, it.prelude);
        for (const d of it.items) if (d.t === 'decl') decls.push({ sh, d, sels, order: sh.si * 1e8 + d.s });
        walk(it.items.filter(x => x.t !== 'decl'), sels);
      } else if (it.t === 'at' && it.items) walk(it.items, parents);
    }
  };
  walk(sh.items, ['']);
}

const neverMeet = new Function('fs', 'path', '__dirname', 'rightmost', 'const MARKUP = true;\n' +
  merge.slice(merge.indexOf('const CARD_OF'), merge.indexOf('function literalEnd')) + '\nreturn neverMeet;')(fs, path, __dirname, rightmost);
const markup = new Function('fs', 'path', '__dirname', 'const MARKUP = true;\n' +
  merge.slice(merge.indexOf('const markup'), merge.indexOf('const structural')) + '\nreturn markup;')(fs, path, __dirname);
const OUR_TAGS = new Set(['html', 'body']);
const KNOWN = new Set([...markup.tags.keys(), ...markup.dynamic]);
if (DOC) {
  const all = [...fs.readdirSync(path.join(PROJ, MQ)).map(f => MQ + f), DAILY, DRAWER, PINS].map(f => fs.readFileSync(path.join(PROJ, f), 'utf8')).join('\n');
  for (const m of all.matchAll(/createElement\(['"](\w+)['"]\)|<([a-z][a-z0-9]*)[\s>\/]/g)) OUR_TAGS.add(m[1] || m[2]);
  for (const D of decls) for (const s of D.sels) if (owned(s)) for (const m of s.matchAll(/\.([\w-]+)/g)) KNOWN.add(m[1]);
}
function splitTopLevel(s, re) {
  const out = []; let d = 0, cur = '';
  for (const ch of s) {
    if (ch === '(' || ch === '[') d++; else if (ch === ')' || ch === ']') d--;
    if (!d && re.test(ch)) { if (cur.trim()) out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function foreignAttr(c) {
  for (const m of c.matchAll(/\[\s*(id|class)\s*([~|^$*]?)=\s*["']?([^"'\]]*)["']?\s*\]/g)) {
    const [, attr, op, v] = m;
    const test = (x) => op === '^' ? x.startsWith(v) : op === '$' ? x.endsWith(v) : op === '*' ? x.includes(v) : op === '|' ? x === v || x.startsWith(v + '-') : x === v;
    if (attr === 'id' && !/^(nq|qr|btnOverlay)/.test(v) && !(op === '*' || op === '$') ) return true;
    if (attr === 'class' && ![...KNOWN].some(test)) return true;
  }
  return false;
}
function foreignAlt(c) {
  if (foreignAttr(c)) return true;
  c = c.replace(/:not\((?:[^()]|\([^()]*\))*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/::?[\w-]+(\((?:[^()]|\([^()]*\))*\))?/g, m => /^:(where|is)\(/.test(m) ? m : '');
  const tag = /^[a-z][\w-]*/i.exec(c);
  if (tag && /^(html|body)$/i.test(tag[0])) return false;
  const inner = /:(where|is)\(((?:[^()]|\([^()]*\))*)\)/.exec(c);
  if (inner && splitTopLevel(inner[2], /,/).every(foreignAlt)) return true;
  const own = c.replace(/:(where|is)\((?:[^()]|\([^()]*\))*\)/g, '');
  if ((own.match(/#[\w-]+/g) || []).some(i => !OWN_ID.test(i))) return true;
  if ((own.match(/\.([\w-]+)/g) || []).some(k => k.includes('__') || !KNOWN.has(k.slice(1)))) return true;
  const t = /^[a-z][\w-]*/i.exec(own);
  return !!(t && !OUR_TAGS.has(t[0].toLowerCase()));
}
function foreign(sel) {
  if (owned(sel)) return false;
  return splitTopLevel(sel.replace(/\s*([>+~])\s*/g, ' '), /\s/).some(foreignAlt);
}

const RADIUS = /^border(-[a-z]+)*-radius$/;
function overlap(p, q) {
  p = p.replace(/^-webkit-|^-moz-/, ''); q = q.replace(/^-webkit-|^-moz-/, '');
  if (p === q || p === 'all' || q === 'all') return true;
  const side = /^(top|right|bottom|left)$/;
  if ((p === 'inset' && side.test(q)) || (q === 'inset' && side.test(p))) return true;
  if (RADIUS.test(p) || RADIUS.test(q)) return RADIUS.test(p) && RADIUS.test(q) && (p === 'border-radius' || q === 'border-radius');
  const pair = (x, y) => ((p === x && y.test(q)) || (q === x && y.test(p)));
  if (pair('flex', /^flex-(direction|wrap|flow)$/)) return false;
  if (pair('font', /^line-height$/) || pair('flex-flow', /^flex-(direction|wrap)$/) || pair('grid-area', /^grid-(row|column)/) || pair('gap', /^(row|column)-gap$/) || pair('columns', /^column-(width|count)$/)) return true;
  if (/^place-/.test(p) || /^place-/.test(q)) { const t = s => s.replace(/^(place|align|justify)-/, ''); return t(p) === t(q) && /^(place|align|justify)-/.test(p) && /^(place|align|justify)-/.test(q); }
  const base = s => s.split('-')[0];
  if (base(p) === base(q) && /-(inline|block)/.test(p + ' ' + q)) return true;
  return q.startsWith(p + '-') || p.startsWith(q + '-');
}

function mayHit(a, b) {
  if (DOC && (foreign(b) || /^(html|body)$/i.test(rightmost(b).tag || ''))) return false;
  const x = rightmost(a), y = rightmost(b);
  if (x.pe !== y.pe) return false;
  if (x.id && y.id && x.id !== y.id) return false;
  if (x.tag && y.tag && x.tag !== y.tag && x.tag !== '*' && y.tag !== '*') return false;
  return !neverMeet(a, b);
}

const kept = {};
const keep = (D, why) => { kept[why] = (kept[why] || 0) + 1; };
const S = new Set();
for (const D of decls) {
  if (!D.d.imp) continue;
  if (D.sels.some(s => s.includes(':host'))) { keep(D, ':host'); continue; }
  if (D.sels.some(s => specificity(s) === null)) { keep(D, ':is/:where/:not/:has'); continue; }
  if (D.sels.some(s => inlineWritten(s, D.d.prop))) { keep(D, 'property written inline by JS'); continue; }
  if (DOC && (!(D.sh.file || '').startsWith(MQ) || !D.sels.every(owned))) {
    if (process.argv.includes('--notours')) console.log('NOTOURS ' + (D.sh.file || 'KILL').split('/').pop() + '  ' + D.sels.filter(s => !owned(s)).join(', ').slice(0, 120));
    keep(D, 'not only our elements'); continue;
  }
  if (DOC && D.sels.some(s => PINNED.test(s))) { keep(D, 'pinned: broke on the page'); continue; }
  S.add(D);
}
function blocker(D) {
  for (const C of decls) {
    if (C === D || !overlap(D.d.prop, C.d.prop)) continue;
    for (const a of D.sels) for (const b of C.sels) {
      if (!mayHit(a, b)) continue;
      if (C.d.imp) {
        if (S.has(C)) continue;
        if (process.argv.includes('--blockers')) console.log('BLOCK ' + (C.sh.file || 'KILL').split('/').pop() + ' ' + b.slice(0, 90) + ' { ' + C.d.prop + ' }  =>  ' + a.slice(0, 90) + ' { ' + D.d.prop + ' }');
        return 'competes with a !important that keeps its flag';
      }
      const sa = specificity(a), sb = specificity(b);
      if (sb === null || sa < sb || (sa === sb && C.order > D.order)) {
        if (process.argv.includes('--why')) console.log('  keep ' + a + ' { ' + D.d.prop + ' }  <-  ' + b + ' { ' + C.d.prop + ' }');
        return 'would lose to a normal rule';
      }
    }
  }
  return null;
}
for (let changed = true; changed;) {
  changed = false;
  for (const D of [...S]) { const why = blocker(D); if (why) { S.delete(D); keep(D, why); changed = true; } }
}
const strip = [...S];

for (const D of strip) console.log(D.sh.file + '  ' + D.sels.join(', ').slice(0, 70) + '  { ' + D.d.prop + ' }');
console.log('\nstrip ' + strip.length + ', keep ' + Object.entries(kept).map(([k, v]) => v + ' (' + k + ')').join(', '));

if (APPLY) {
  for (const f of new Set(strip.map(D => D.sh.file))) {
    let src = fs.readFileSync(path.join(PROJ, f), 'utf8');
    const mine = strip.filter(D => D.sh.file === f).sort((a, b) => (b.sh.s + b.d.s) - (a.sh.s + a.d.s));
    for (const D of mine) {
      const s = D.sh.s + D.d.s, e = D.sh.s + D.d.e;
      const raw = src.slice(s, e), m = /\s*!\s*important/i.exec(raw);
      src = src.slice(0, s) + raw.slice(0, m.index) + raw.slice(m.index + m[0].length) + src.slice(e);
    }
    fs.writeFileSync(path.join(PROJ, f), src);
  }
  console.log('applied');
}

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

const SRC = path.join(__dirname, '..', 'projects', 'modern-qol', 'src');
const ROOTS = {
  bar: [['20-layout.js', 'barStyle.textContent = `'], ['40-styles.js', 'const SHADOW_CSS = `']],
  editor: [['25-hud.js', '    css.textContent = `'], ['40-styles.js', 'const EDITOR_CSS = `']],
};
const [which] = process.argv.slice(2);
const APPLY = process.argv.includes('--apply');
if (!ROOTS[which]) { console.log('usage: node tools/css-unimportant.js <bar|editor> [--apply]'); process.exit(1); }

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
};
function inlineWritten(sel, p) {
  const last = sel.trim().split(/[\s>+~]+/).pop().replace(/::?[\w-]+(\([^)]*\))?/g, '');
  const vague = !/[.#]/.test(last);
  return INLINE[which].some(([re, props]) => (vague || re.test(last)) && props.some(q => overlap(p, q)));
}

const sheets = ROOTS[which].map(([file, head], si) => {
  const src = fs.readFileSync(path.join(SRC, file), 'utf8');
  const at = src.indexOf(head);
  if (at < 0 || src.indexOf(head, at + 1) >= 0) throw new Error('head not unique in ' + file + ': ' + head);
  const s = at + head.length, e = literalEnd(src, s);
  const text = src.slice(s, e).replace(/\$\{[^}]*\}/g, m => 'X'.repeat(m.length));
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
  S.add(D);
}
function blocker(D) {
  for (const C of decls) {
    if (C === D || !overlap(D.d.prop, C.d.prop)) continue;
    for (const a of D.sels) for (const b of C.sels) {
      if (!mayHit(a, b)) continue;
      if (C.d.imp) { if (!S.has(C)) return 'competes with a !important that keeps its flag'; continue; }
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
  for (const sh of sheets) {
    let src = sh.src;
    const mine = strip.filter(D => D.sh === sh).sort((a, b) => b.d.s - a.d.s);
    for (const D of mine) {
      const s = sh.s + D.d.s, e = sh.s + D.d.e;
      const raw = src.slice(s, e), m = /\s*!\s*important/i.exec(raw);
      src = src.slice(0, s) + raw.slice(0, m.index) + raw.slice(m.index + m[0].length) + src.slice(e);
    }
    sh.src = src;
    sheets.filter(o => o.file === sh.file && o !== sh).forEach(o => { o.src = src; });
  }
  const files = [...new Set(sheets.map(sh => sh.file))];
  for (const f of files) fs.writeFileSync(path.join(SRC, f), sheets.filter(sh => sh.file === f).pop().src);
  console.log('applied');
}

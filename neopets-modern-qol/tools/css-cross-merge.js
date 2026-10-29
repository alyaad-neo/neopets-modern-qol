// Moves rules from an earlier sheet into the same-selector rule of a later sheet in the same root.
// The later sheet may prefix every selector with PREFIX, which raises specificity, so a move is
// blocked by any rule that could hit the same element with the same property family and importance
// whose rank lies between the old and the new one. Rules of the other sheets count at any position.
// Default: HUD_CSS into PAGE_CSS/LAYOUT_CSS (document), only selectors naming an element hidden
// wherever nq-css is missing. --bar: barStyle into SHADOW_CSS (top-bar shadow root).
// Usage: node tools/css-cross-merge.js [--bar] [--all] [--apply]
'use strict';
const fs = require('fs');
const path = require('path');
const dedupe = fs.readFileSync(path.join(__dirname, 'css-dedupe.js'), 'utf8');
eval(dedupe.slice(dedupe.indexOf('function parseBlock'), dedupe.indexOf('// tokenize a selector')).replace(/^function (\w+)/gm, 'global.$1 = function $1'));
const merge = fs.readFileSync(path.join(__dirname, 'css-merge.js'), 'utf8');
eval(merge.slice(merge.indexOf('function literalEnd'), merge.indexOf('function blockers')).replace(/^function (\w+)/gm, 'global.$1 = function $1'));

const SRC = path.join(__dirname, '..', 'projects', 'modern-qol', 'src');
const BAR = process.argv.includes('--bar');
const FROM = BAR ? ['20-layout.js', 'barStyle.textContent = `'] : ['25-hud.js', 'const HUD_CSS = `'];
const INTO = BAR ? [['40-styles.js', 'const SHADOW_CSS = `']] : [['40-styles.js', 'const PAGE_CSS = `'], ['40-styles.js', 'const LAYOUT_CSS = `']];
const OTHERS = BAR ? [] : [
  ['20-layout.js', 'const THEME = `'], ['20-layout.js', 'const FRAME = `'],
  ['25-hud.js', '#btnOverlay{', 'st.textContent = `'],
  ['30-backgrounds.js', 'style.textContent = `'], ['30-backgrounds.js', 'recolorStyle.textContent = `'],
  ['40-styles.js', 'const BAR_CSS = `'], ['40-styles.js', 'const EDITOR_CSS = `'],
  ['15-core.js', "st.textContent = '"], ['90-main.js', "pre.textContent = '"], ['85-account.js', "st.textContent = '"],
];
const EXTRA = BAR ? '.menu { display: none !important; }' : null;
const SCOPE = BAR ? /./ : /#(nqHud|nqLeftBar|btnOverlay|nqSideBtnHost|qrDockWrap|qrDock|nqFoot|nqBgHandle|nqBgSidebar)(?![\w-])/;
const APPLY = process.argv.includes('--apply');

const files = {};
const crlf = {};
const read = (f) => { if (!files[f]) { const t = fs.readFileSync(path.join(SRC, f), 'utf8'); crlf[f] = t.includes('\r\n'); files[f] = t.replace(/\r\n/g, '\n'); } return files[f]; };

function locate(spec) {
  const [f, a, b] = spec;
  const src = read(f);
  let at = src.indexOf(b ? b : a);
  if (b) { const anchor = src.indexOf(a); at = src.lastIndexOf(b, anchor); }
  if (at < 0) throw new Error('missing ' + spec.join(' '));
  const head = b || a;
  const s = at + head.length;
  const q = head[head.length - 1];
  const e = q === '`' ? literalEnd(src, s) : src.indexOf(q, s);
  return { f, s, e };
}

function killText() {
  const src = read('20-layout.js');
  const s = src.indexOf('const KILL = [');
  const body = src.slice(s, src.indexOf('];', s));
  const sels = [...body.matchAll(/'([^']*)'/g)].map(m => m[1]);
  return sels.join(',\n') + '{display:none !important;visibility:hidden !important;height:0 !important;width:0 !important;overflow:hidden !important;}';
}

function build() {
  const segs = [];
  let text = '';
  const add = (loc, kind) => {
    const raw = loc ? read(loc.f).slice(loc.s, loc.e) : BAR ? EXTRA : killText();
    const masked = raw.replace(/\$\{[^}]*\}/g, m => 'X'.repeat(m.length));
    segs.push({ loc, kind, off: text.length, len: raw.length });
    text += masked + '\n';
  };
  add(locate(FROM), 'from');
  for (const o of OTHERS) add(locate(o), 'other');
  add(null, 'other');
  for (const t of INTO) add(locate(t), 'into');
  const rules = analyse(text, 0, text.length);
  for (const r of rules) r.seg = segs.find(g => r.it.s >= g.off && r.it.s < g.off + g.len);
  return { text, rules };
}

const PREFIX = 'html[data-nq-modern-interface] ';

function sameElement(x, y) {
  const a = rightmost(x), b = rightmost(y);
  if (a.pe !== b.pe) return false;
  if (a.id && b.id && a.id !== b.id) return false;
  if (a.tag && b.tag && a.tag !== b.tag && a.tag !== '*' && b.tag !== '*') return false;
  return true;
}

function rankBlockers(rules, a, b, moving) {
  const A = rules[a], B = rules[b], out = [];
  const fams = new Map();
  for (const d of moving) for (const f of family(d.prop)) { if (!fams.has(f)) fams.set(f, new Set()); fams.get(f).add(d.imp); }
  const pairs = A.sels.map((x, k) => [x, specificity(x), specificity(B.sels[k])]);
  if (pairs.some(p => p[1] === null || p[2] === null)) return ['unknown specificity'];
  for (let k = 0; k < rules.length; k++) {
    if (k === a || k === b) continue;
    const R = rules[k];
    const d = R.decls.find(d => family(d.prop).some(f => f === '*' || fams.has('*') || (fams.has(f) && fams.get(f).has(d.imp))));
    if (!d) continue;
    const pos = R.seg.kind === 'other' ? null : R.it.s;
    const hit = R.sels.some(r => pairs.some(([x, sa, sb]) => {
      if (!sameElement(r, x)) return false;
      const sr = specificity(r);
      if (sr === null) return true;
      if (pos === null) return sr >= sa && sr <= sb;
      const after = sr > sa || (sr === sa && pos > A.it.s);
      const before = sr < sb || (sr === sb && pos < B.it.s);
      return after && before;
    }));
    if (hit) out.push(R.sels.join(', ') + ' {' + d.prop + '}');
  }
  return out;
}

function step(report) {
  const { text, rules } = build();
  const into = new Map();
  const bare = (r) => r.sels.every(x => x.startsWith(PREFIX)) ? r.ctx + '||' + r.sels.map(x => x.slice(PREFIX.length).replace(/\s+/g, ' ')).join(', ') : r.key;
  for (let j = 0; j < rules.length; j++) if (rules[j].seg.kind === 'into' && !into.has(bare(rules[j]))) into.set(bare(rules[j]), j);
  for (let i = 0; i < rules.length; i++) {
    const A = rules[i];
    if (A.seg.kind !== 'from' || !A.flat) continue;
    if (!A.sels.every(x => SCOPE.test(x.replace(/:not\([^)]*\)/g, '')))) continue;
    const j = into.get(A.key);
    if (j === undefined || !rules[j].flat) continue;
    const B = rules[j];
    const keepA = A.decls.filter(d => !B.decls.some(x => x.prop === d.prop && (x.imp || !d.imp)));
    const bl = rankBlockers(rules, i, j, keepA);
    if (bl.length) { report.blocked.add(A.key + '\n      blocked by: ' + (process.argv.includes('--all') ? bl : bl.slice(0, 3)).join(' | ')); continue; }
    const keepB = B.decls.filter(d => !A.decls.some(x => x.prop === d.prop && x.imp && !d.imp));
    const real = (seg, a, b) => read(seg.loc.f).slice(seg.loc.s + a - seg.off, seg.loc.s + b - seg.off);
    const declText = (r, d) => real(r.seg, d.s, d.e).trim().replace(/;$/, '');
    const bSrc = read(B.seg.loc.f);
    const bS = B.seg.loc.s + B.it.s - B.seg.off, bE = B.seg.loc.s + B.it.e - B.seg.off;
    let bText = bSrc.slice(bS, bE);
    let newB;
    if (bText.includes('\n') && keepB.length) {
      for (const d of [...B.decls].reverse()) if (!keepB.includes(d)) bText = bText.slice(0, d.s - B.it.s) + bText.slice(d.e - B.it.s);
      const first = keepB[0];
      const ls = bSrc.lastIndexOf('\n', B.seg.loc.s + first.s - B.seg.off) + 1;
      const ind = /^[ \t]*/.exec(bSrc.slice(ls))[0];
      const add = keepA.map(d => declText(A, d)).join('; ');
      const open = bText.indexOf('{') + 1;
      const nl = bText.indexOf('\n', open);
      newB = add ? bText.slice(0, nl + 1) + ind + add + ';\n' + bText.slice(nl + 1) : bText;
    } else {
      const all = [...keepA.map(d => declText(A, d)), ...keepB.map(d => declText(B, d))];
      newB = bSrc.slice(bS, B.seg.loc.s + B.it.ps - B.seg.off).replace(/\s+$/, '') + ' { ' + all.join('; ') + '; }';
    }
    const aSrc = read(A.seg.loc.f);
    let aS = A.seg.loc.s + A.it.s - A.seg.off, aE = A.seg.loc.s + A.it.e - A.seg.off;
    const lineStart = aSrc.lastIndexOf('\n', aS - 1) + 1;
    if (/^[ \t]*$/.test(aSrc.slice(lineStart, aS))) { const nl = aSrc.indexOf('\n', aE); if (nl >= 0 && /^[ \t]*$/.test(aSrc.slice(aE, nl))) { aS = lineStart; aE = nl + 1; } }
    const lineOf = (src, k) => src.slice(0, k).split('\n').length;
    report.merged.push(A.key + '  (' + A.seg.loc.f + ':' + lineOf(aSrc, aS) + ' -> ' + B.seg.loc.f + ':' + lineOf(bSrc, bS) + ')');
    files[B.seg.loc.f] = bSrc.slice(0, bS) + newB + bSrc.slice(bE);
    files[A.seg.loc.f] = read(A.seg.loc.f).slice(0, aS) + read(A.seg.loc.f).slice(aE);
    return true;
  }
  return false;
}

if (process.argv.includes('--debug')) {
  const { rules } = build();
  const from = rules.filter(r => r.seg.kind === 'from'), into = rules.filter(r => r.seg.kind === 'into');
  const sel = new Set(into.flatMap(r => r.sels.map(x => x.replace(/\s+/g, ' '))));
  console.log('from', from.length, 'into', into.length, 'exact', from.filter(r => into.some(b => b.key === r.key)).length, 'shared selector', from.filter(r => r.sels.some(x => sel.has(x.replace(/\s+/g, ' ')))).length);
  console.log(from.slice(0, 6).map(r => r.key).join('\n') + '\n--\n' + into.filter(r => /nqUser/.test(r.key)).slice(0, 6).map(r => r.key).join('\n'));
  process.exit();
}
const report = { merged: [], blocked: new Set() };
while (step(report)) report.blocked.clear();
console.log('merged ' + report.merged.length);
for (const m of report.merged) console.log('  ' + m);
console.log('blocked ' + report.blocked.size);
for (const m of report.blocked) console.log('  ' + m);
if (APPLY) for (const f of [FROM[0], INTO[0][0]]) fs.writeFileSync(path.join(SRC, f), crlf[f] ? files[f].replace(/\n/g, '\r\n') : files[f]);

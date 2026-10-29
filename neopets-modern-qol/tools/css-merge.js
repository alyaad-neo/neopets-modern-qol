// Merges rules with the same selector (same @media context) inside one CSS template literal.
// A later rule's declarations move into the first rule only when no rule in between could
// compete for the same property on the same element at equal specificity and importance.
// Usage: node tools/css-merge.js <file> <literal head, e.g. "const PAGE_CSS = `"> [--markup] [--apply]
// --markup: two rules never meet when their elements carry classes that no markup string in the
// bundle projects writes together, or sit in different sidebar cards (CARD_OF below).
'use strict';
const fs = require('fs');
const path = require('path');
const tool = fs.readFileSync(path.join(__dirname, 'css-dedupe.js'), 'utf8');
eval(tool.slice(tool.indexOf('function parseBlock'), tool.indexOf('// tokenize a selector')).replace(/^function (\w+)/gm, 'global.$1 = function $1'));

const [file, head] = process.argv.slice(2, 4);
const APPLY = process.argv.includes('--apply');
const MARKUP = process.argv.includes('--markup');

const CARD_OF = { nqUser: 'nqUser', nqUserTitle: 'nqUser', nqLogoutBtn: 'nqUser', nqSwapBtn: 'nqUser', nqNp: 'nqNp', nqActivePet: 'nqActivePet', nqPetInfo: 'nqActivePet', nqListsMod: 'nqListsMod', nqFoot: 'nqFoot', nqPinsMod: 'nqFoot', nqDaily: 'nqDaily', nqPetDockBtn: 'nqActivePet',
  nqBgSidebar: 'bg', nqBgBody: 'bg', nqColors: 'bg', nqShuffle: 'bg', nqDiscBar: 'bg', nqDiscMsg: 'bg', nqBgList: 'bg', nqBgFooter: 'bg', nqRecolorSite: 'bg' };
const markup = { sets: [], dynamic: new Set(), tags: new Map() };
if (MARKUP) {
  const proj = path.join(__dirname, '..', 'projects');
  const dirs = [path.join(proj, 'modern-qol', 'src'), ...['dailies-qol', 'account-drawer', 'page-pins-qol'].map(p => path.join(proj, p))];
  const text = dirs.flatMap(d => fs.readdirSync(d).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(d, f), 'utf8'))).join('\n');
  const add = (tag, str) => {
    const cls = str.split(/\s+/).filter(c => /^[\w-]+$/.test(c));
    markup.sets.push(cls);
    for (const c of cls) { if (!markup.tags.has(c)) markup.tags.set(c, new Set()); markup.tags.get(c).add(tag); }
  };
  for (const m of text.matchAll(/<([a-z][a-z0-9]*)[^<>]*?class=\\?["']([^"'\\]*)/g)) add(m[1], m[2]);
  const made = new Map();
  for (const m of text.matchAll(/(\w+)\s*=\s*document\.createElement\(['"](\w+)['"]\)/g)) made.set(m[1], made.has(m[1]) && made.get(m[1]) !== m[2] ? null : m[2]);
  for (const m of text.matchAll(/(\w+)?\.?className\s*=\s*['"]([^'"]*)['"]/g)) add((m[1] && made.get(m[1])) || null, m[2]);
  for (const m of text.matchAll(/classList\.(?:add|toggle|remove)\(([^)]*)\)/g)) for (const q of m[1].matchAll(/['"]([\w-]+)['"]/g)) markup.dynamic.add(q[1]);
}
const structural = (c) => markup.tags.has(c) && !markup.dynamic.has(c);
const together = (a, b) => markup.sets.some(s => s.includes(a) && s.includes(b));
const classesOf = (compound) => [...compound.replace(/:(not|is|where|has)\([^)]*\)/g, '').matchAll(/\.([\w-]+)/g)].map(m => m[1]);
const cardsOf = (sel) => new Set([...sel.matchAll(/#([\w-]+)/g)].map(m => CARD_OF[m[1]]).filter(Boolean));

function neverMeet(selA, selB) {
  const ca = cardsOf(selA), cb = cardsOf(selB);
  if (ca.size && cb.size && ![...ca].some(c => cb.has(c))) return true;
  if (MARKUP && (selfInside(selA, selB) || selfInside(selB, selA))) return true;
  const xa = classesOf(lastCompound(selA)), xb = classesOf(lastCompound(selB));
  if (xa.some(a => xb.some(b => a !== b && structural(a) && structural(b) && !together(a, b)))) return true;
  const tagOnly = (tag, cls) => tag && cls.some(c => structural(c) && !markup.tags.get(c).has(null) && !markup.tags.get(c).has(tag));
  return tagOnly(rightmost(selA).tag, xb) || tagOnly(rightmost(selB).tag, xa);
}

function selfInside(selA, selB) {
  const id = /^#([\w-]+)$/.exec(lastCompound(selA).replace(/^html\[data-nq-modern-interface\]\s*/, ''));
  if (!id) return false;
  const lastB = lastCompound(selB);
  return new RegExp('#' + id[1] + '(?![A-Za-z0-9_-])').test(selB.slice(0, selB.length - lastB.length)) && !/#[\w-]+/.test(lastB);
}

function lastCompound(sel) {
  let d = 0, cut = 0;
  for (let i = 0; i < sel.length; i++) {
    const ch = sel[i];
    if (ch === '(' || ch === '[') d++;
    else if (ch === ')' || ch === ']') d--;
    else if (!d && (ch === ' ' || ch === '>' || ch === '+' || ch === '~')) cut = i + 1;
  }
  return sel.slice(cut);
}

function literalEnd(src, i) {
  let d = 0;
  while (i < src.length) {
    if (src[i] === '\\') { i += 2; continue; }
    if (src[i] === '$' && src[i + 1] === '{') { d++; i += 2; continue; }
    if (d && src[i] === '}') { d--; i++; continue; }
    if (!d && src[i] === '`') return i;
    i++;
  }
  throw new Error('unterminated literal');
}

function family(p) {
  p = p.replace(/^-webkit-|^-moz-/, '');
  if (p.startsWith('--')) return [p];
  if (['top', 'right', 'bottom', 'left', 'inset'].includes(p) || p.startsWith('inset-')) return ['inset'];
  if (['gap', 'row-gap', 'column-gap', 'grid-gap'].includes(p)) return ['gap'];
  if (p.startsWith('place-') || p.startsWith('align-') || p.startsWith('justify-')) return ['align'];
  if (p === 'all') return ['*'];
  if (p === 'word-wrap' || p === 'overflow-wrap') return ['overflow'];
  if (p === 'columns') return ['column'];
  return [p.split('-')[0]];
}

function rightmost(sel) {
  let d = 0, q = null, cut = 0;
  for (let i = 0; i < sel.length; i++) {
    const ch = sel[i];
    if (q) { if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") q = ch;
    else if (ch === '(' || ch === '[') d++;
    else if (ch === ')' || ch === ']') d--;
    else if (!d && (ch === ' ' || ch === '>' || ch === '+' || ch === '~')) cut = i + 1;
  }
  const c = sel.slice(cut).trim();
  const noBr = c.replace(/\[[^\]]*\]/g, '').replace(/\([^)]*\)/g, '');
  const tag = (/^[a-zA-Z][\w-]*/.exec(noBr) || [])[0] || null;
  const id = (/#([\w-]+)/.exec(noBr) || [])[1] || null;
  const pe = (/::?(before|after|placeholder|selection|marker|first-line|first-letter|backdrop|-webkit-[\w-]+)/.exec(noBr) || [])[1] || '';
  return { tag: tag && tag.toLowerCase(), id, pe };
}

function specificity(sel) {
  if (/:(is|where|not|has|matches)\(/.test(sel)) return null;
  const s = sel.replace(/\[[^\]]*\]/g, ' [] ').replace(/\([^)]*\)/g, '');
  const a = (s.match(/#[\w-]+/g) || []).length;
  const pe = (s.match(/::[\w-]+|:(before|after|first-line|first-letter)/g) || []).length;
  const b = (s.match(/\.[\w-]+|\[\]|(^|[^:]):[\w-]+/g) || []).length - (s.match(/(^|[^:]):(before|after|first-line|first-letter)/g) || []).length;
  const c = (s.match(/(^|[\s>+~(])[a-zA-Z][\w-]*/g) || []).length + pe;
  return a * 10000 + b * 100 + c;
}

function mayCompete(selA, selB) {
  const x = rightmost(selA), y = rightmost(selB);
  if (x.pe !== y.pe) return false;
  if (x.id && y.id && x.id !== y.id) return false;
  if (x.tag && y.tag && x.tag !== y.tag && x.tag !== '*' && y.tag !== '*') return false;
  if (MARKUP && neverMeet(selA, selB)) return false;
  const sa = specificity(selA), sb = specificity(selB);
  if (sa === null || sb === null) return true;
  return sa === sb;
}

function analyse(src, s, e) {
  const text = src.slice(s, e).replace(/\$\{[^}]*\}/g, m => 'X'.repeat(m.length));
  const { items } = parseBlock(text, 0, text.length);
  const rules = [];
  const walk = (list, ctx, parents) => {
    for (const it of list) {
      if (it.t === 'rule') {
        const sels = resolve(parents, it.prelude);
        const decls = it.items.filter(x => x.t === 'decl');
        rules.push({ it, ctx, sels, decls, flat: decls.length === it.items.length, key: ctx + '||' + sels.map(x => x.replace(/\s+/g, ' ')).join(', ') });
        walk(it.items.filter(x => x.t !== 'decl'), ctx, sels);
      } else if (it.t === 'at' && it.items) walk(it.items, ctx + '@' + it.name + ' ' + it.prelude.replace(/\s+/g, ' ') + ';', parents);
    }
  };
  walk(items, '', ['']);
  return rules;
}

function blockers(rules, a, b) {
  const out = [];
  const moving = new Map();
  for (const d of rules[b].decls) for (const f of family(d.prop)) { if (!moving.has(f)) moving.set(f, new Set()); moving.get(f).add(d.imp); }
  for (let k = 0; k < rules.length; k++) {
    if (k === a || k === b) continue;
    const r = rules[k];
    if (!(r.it.s > rules[a].it.s && r.it.s < rules[b].it.s)) continue;
    for (const d of r.decls) {
      const fams = family(d.prop);
      const hit = fams.some(f => f === '*' || moving.has('*') || (moving.has(f) && moving.get(f).has(d.imp)));
      if (!hit) continue;
      if (r.sels.some(x => rules[a].sels.some(y => mayCompete(x, y)))) { out.push(r.sels.join(', ') + ' {' + d.prop + '}'); break; }
    }
  }
  return out;
}

function mergeOnce(src, s, e, report) {
  const rules = analyse(src, s, e);
  const firstOf = new Map();
  for (let j = 0; j < rules.length; j++) {
    const r = rules[j];
    if (!r.flat) continue;
    if (!firstOf.has(r.key)) { firstOf.set(r.key, j); continue; }
    const i = firstOf.get(r.key);
    const bl = blockers(rules, i, j);
    if (bl.length) { report.blocked.add(r.key + '\n      blocked by: ' + bl.slice(0, 3).join(' | ')); firstOf.set(r.key, j); continue; }
    const A = rules[i], B = rules[j];
    const keepA = A.decls.filter(d => !B.decls.some(x => x.prop === d.prop && (x.imp || !d.imp)));
    const keepB = B.decls.filter(d => !A.decls.some(x => x.prop === d.prop && x.imp && !d.imp));
    const declText = (d) => src.slice(s + d.s, s + d.e).trim().replace(/;$/, '');
    const all = [...keepA, ...keepB].map(declText);
    const aText = src.slice(s + A.it.s, s + A.it.e);
    const multi = aText.includes('\n');
    let newA;
    if (multi && keepA.length) {
      let t = aText;
      for (const d of [...A.decls].reverse()) if (!keepA.includes(d)) t = t.slice(0, d.s - A.it.s) + t.slice(d.e - A.it.s);
      const lastDecl = keepA[keepA.length - 1];
      const ls = src.lastIndexOf('\n', s + lastDecl.s) + 1;
      const ind = /^[ \t]*/.exec(src.slice(ls))[0];
      const add = keepB.map(declText).join('; ');
      const close = t.lastIndexOf('}');
      const before = t.slice(0, close).replace(/[ \t]*$/, '');
      const closeInd = t.slice(before.length, close);
      newA = add ? before + (before.endsWith('\n') ? '' : '\n') + ind + add + ';\n' + closeInd + t.slice(close) : t;
    } else newA = src.slice(s + A.it.s, s + A.it.ps).replace(/\s+$/, '') + ' { ' + all.join('; ') + '; }';
    let bs = s + B.it.s, be = s + B.it.e;
    const lineStart = src.lastIndexOf('\n', bs - 1) + 1;
    if (/^[ \t]*$/.test(src.slice(lineStart, bs))) { const nl = src.indexOf('\n', be); if (nl >= 0 && /^[ \t]*$/.test(src.slice(be, nl))) { bs = lineStart; be = nl + 1; } }
    report.merged.push(r.key + '  (lines ' + src.slice(0, s + A.it.s).split('\n').length + ' + ' + src.slice(0, s + B.it.s).split('\n').length + ')');
    src = src.slice(0, bs) + src.slice(be);
    src = src.slice(0, s + A.it.s) + newA + src.slice(s + A.it.e);
    return src;
  }
  return null;
}

const full = path.resolve(file);
let src = fs.readFileSync(full, 'utf8');
const crlf = src.includes('\r\n');
src = src.replace(/\r\n/g, '\n');
const report = { merged: [], blocked: new Set() };
for (;;) {
  const s = src.indexOf(head);
  if (s < 0) throw new Error('missing ' + head);
  const start = s + head.length;
  const next = mergeOnce(src, start, literalEnd(src, start), report);
  if (next === null) break;
  src = next;
  report.blocked.clear();
}
console.log('merged ' + report.merged.length);
for (const m of report.merged) console.log('  ' + m);
console.log('blocked ' + report.blocked.size);
for (const m of report.blocked) console.log('  ' + m);
if (APPLY) fs.writeFileSync(full, crlf ? src.replace(/\n/g, '\r\n') : src);

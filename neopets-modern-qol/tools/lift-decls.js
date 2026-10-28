const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
const apply = process.argv.includes('--apply');

function tokenize(src) {
  const toks = [];
  let i = 0;
  const stack = [];
  const isIdStart = c => /[A-Za-z_$]/.test(c);
  const isId = c => /[A-Za-z0-9_$]/.test(c);
  const regexOk = () => {
    for (let k = toks.length - 1; k >= 0; k--) {
      const t = toks[k];
      if (t.type === 'punct') return !/^[)\]}]$/.test(t.v);
      if (t.type === 'id') return /^(return|typeof|case|do|else|in|of|new|delete|void|throw|instanceof|yield|await)$/.test(t.v);
      return false;
    }
    return true;
  };
  function readTemplate() {
    i++;
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { i++; return; }
      if (c === '$' && src[i + 1] === '{') {
        toks.push({ type: 'punct', v: '${', s: i, e: i + 2 });
        i += 2;
        stack.push('tpl');
        return 'expr';
      }
      i++;
    }
  }
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 2; continue; }
    const s = i;
    if (c === '"' || c === "'") {
      i++;
      while (i < src.length && src[i] !== c) { if (src[i] === '\\') i++; i++; }
      i++;
      toks.push({ type: 'str', s, e: i });
      continue;
    }
    if (c === '`') { const r = readTemplate(); toks.push({ type: 'tpl', s, e: i }); continue; }
    if (c === '}' && stack[stack.length - 1] === 'tpl') {
      stack.pop();
      toks.push({ type: 'punct', v: '}$', s: i, e: i + 1 });
      i--; src[i];
      const save = i;
      i = save;
      const r = readTemplate();
      toks.push({ type: 'tpl', s, e: i });
      continue;
    }
    if (c === '/' && regexOk()) {
      i++;
      let cls = false;
      while (i < src.length) {
        const d = src[i];
        if (d === '\\') { i += 2; continue; }
        if (d === '[') cls = true; else if (d === ']') cls = false;
        else if (d === '/' && !cls) break;
        else if (d === '\n') throw new Error('regex runaway at ' + s);
        i++;
      }
      i++;
      while (isId(src[i] || '')) i++;
      toks.push({ type: 'regex', s, e: i });
      continue;
    }
    if (isIdStart(c)) {
      while (i < src.length && isId(src[i])) i++;
      toks.push({ type: 'id', v: src.slice(s, i), s, e: i });
      continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1]))) {
      while (i < src.length && /[0-9A-Za-z_.]/.test(src[i])) i++;
      toks.push({ type: 'num', s, e: i });
      continue;
    }
    const three = src.slice(i, i + 3), two = src.slice(i, i + 2);
    let v = c;
    if (['...', '===', '!==', '**=', '>>>', '<<=', '>>='].includes(three)) v = three;
    else if (['=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>'].includes(two)) v = two;
    i += v.length;
    if (v === '{') stack.push('{');
    if (v === '}') stack.pop();
    toks.push({ type: 'punct', v, s, e: i });
  }
  return toks;
}

function depthMap(toks) {
  let d = 0;
  for (const t of toks) {
    if (t.type === 'punct' && /^[)\]}]$|^\}\$$/.test(t.v)) d--;
    t.d = d;
    if (t.type === 'punct' && /^[(\[{]$|^\$\{$/.test(t.v)) d++;
  }
}

function refs(toks, a, b) {
  const out = new Set();
  for (let k = a; k < b; k++) {
    const t = toks[k];
    if (t.type !== 'id') continue;
    const p = toks[k - 1];
    if (p && p.type === 'punct' && (p.v === '.' || p.v === '?.')) continue;
    out.add(t.v);
  }
  return out;
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== '00-header.js').sort();
const base = { '20-layout.js': 'startLayout', '25-hud.js': 'startHud', '30-backgrounds.js': 'startBackgrounds' };
const idsByFile = {};
const srcByFile = {};
for (const f of files) {
  srcByFile[f] = fs.readFileSync(path.join(dir, f), 'utf8');
  const toks = tokenize(srcByFile[f]);
  idsByFile[f] = refs(toks, 0, toks.length);
}
const GLOBALS = new Set(['name', 'status', 'top', 'parent', 'self', 'length', 'origin', 'event', 'open', 'close', 'history', 'location', 'screen', 'scroll', 'frames', 'opener', 'closed', 'print', 'find', 'focus', 'blur', 'stop', 'alert', 'confirm', 'prompt', 'external', 'menubar', 'toolbar', 'navigator', 'document', 'window', 'performance', 'crypto', 'caches', 'fetch', 'style', 'root']);

for (const [f, fn] of Object.entries(base)) {
  const src = srcByFile[f];
  const toks = tokenize(src);
  depthMap(toks);
  const startIdx = toks.findIndex((t, k) => t.v === 'function' && toks[k + 1].v === fn);
  const bodyOpen = toks.findIndex((t, k) => k > startIdx && t.v === '{');
  const bodyDepth = toks[bodyOpen].d + 1;
  let bodyClose = -1;
  for (let k = bodyOpen + 1; k < toks.length; k++) if (toks[k].v === '}' && toks[k].d === bodyDepth - 1) { bodyClose = k; break; }
  const decls = [];
  const localNames = new Set();
  for (let k = bodyOpen + 1; k < bodyClose; k++) {
    const t = toks[k];
    if (t.d !== bodyDepth || t.type !== 'id') continue;
    const prev = toks[k - 1];
    const stmtStart = prev.type === 'punct' && (prev.v === ';' || prev.v === '{' || prev.v === '}');
    if (!stmtStart) continue;
    if (t.v === 'function' || (t.v === 'async' && toks[k + 1].v === 'function')) {
      const nk = t.v === 'async' ? k + 2 : k + 1;
      const name = toks[nk].v;
      const open = toks.findIndex((x, j) => j > nk && x.v === '{' && x.d === bodyDepth);
      let end = open;
      for (let j = open + 1; j < bodyClose; j++) if (toks[j].v === '}' && toks[j].d === bodyDepth) { end = j; break; }
      decls.push({ kind: 'function', names: [name], a: k, b: end + 1, pure: true });
      localNames.add(name);
      k = end;
    } else if (t.v === 'const' || t.v === 'let') {
      let end = k;
      const names = [];
      let multi = false, pure = true, sawEq = false, initStart = -1;
      for (let j = k + 1; j < bodyClose; j++) {
        const x = toks[j];
        if (x.d === bodyDepth && x.v === ';') { end = j; break; }
        if (x.d === bodyDepth && x.v === ',') multi = true;
        if (x.d === bodyDepth && x.type === 'id' && (toks[j - 1] === t || toks[j - 1].v === ',')) names.push(x.v);
        if (x.d === bodyDepth && x.v === '=' && !sawEq) { sawEq = true; initStart = j + 1; }
        if (x.d === bodyDepth && (x.v === '{' || x.v === '[') && toks[j - 1] === t) multi = true;
      }
      names.forEach(n => localNames.add(n));
      if (initStart > 0 && !multi) {
        const it = toks.slice(initStart, end);
        const arrowTop = it.findIndex(x => x.v === '=>' && x.d === bodyDepth);
        const isFn = it[0].v === 'function' || (arrowTop >= 0 && (arrowTop === 1 || (it[0].v === '(' && it[arrowTop - 1].v === ')')) && !it.slice(arrowTop + 1).some(x => x.d === bodyDepth && x.type !== 'punct' && false));
        const isArrowWhole = isFn && (it[0].v === 'function' || it.slice(arrowTop + 1).every((x, q, arr) => true));
        if (!isFn) {
          if (it.some(x => x.v === '(' || x.v === 'new' || x.v === '++' || x.v === '--')) pure = false;
          if (it.some(x => x.v === '=' || x.v === '+=' || x.v === '.' || x.v === '?.')) pure = false;
          if (it.some((x, q) => x.v === '[' && q > 0 && (it[q - 1].type !== 'punct' || /^[)\]]$/.test(it[q - 1].v)))) pure = false;
          if (it.length === 1 && it[0].type === 'id' && !/^(null|true|false|undefined)$/.test(it[0].v)) pure = false;
        }
        if (isFn && arrowTop >= 0) {
          let close = -1;
          const after = it.slice(arrowTop + 1);
          const topLevelAfter = after.filter(x => x.d === bodyDepth);
          if (topLevelAfter.length && after[0].v !== '{' && after[0].v !== '(') {
            const callish = after.some((x, q) => x.d === bodyDepth && x.v === '(' && q > 0);
            if (callish && false) pure = false;
          }
        }
      } else pure = false;
      decls.push({ kind: t.v, names, a: k, b: end + 1, pure });
      k = end;
    }
  }
  const L = new Set();
  let changed = true;
  const byName = {};
  decls.forEach(d => d.names.forEach(n => byName[n] = d));
  decls.forEach(d => { d.refs = refs(toks, d.a, d.b); });
  const otherIds = new Set();
  for (const g of files) if (g !== f) idsByFile[g].forEach(x => otherIds.add(x));
  const ok = d => d.pure && d.names.length === 1 && !GLOBALS.has(d.names[0]) && !otherIds.has(d.names[0]);
  decls.forEach(d => { if (ok(d)) L.add(d); });
  while (changed) {
    changed = false;
    for (const d of [...L]) {
      for (const r of d.refs) {
        if (d.names.includes(r)) continue;
        const dep = byName[r];
        if (dep && !L.has(dep)) { L.delete(d); changed = true; break; }
      }
    }
  }
  const lifted = decls.filter(d => L.has(d));
  const kept = decls.filter(d => !L.has(d));
  console.log(`== ${f}: ${lifted.length} lifted, ${kept.length} kept`);
  console.log('  lifted: ' + lifted.map(d => d.names[0]).join(', '));
  console.log('  kept:   ' + kept.map(d => d.names.join('/') + (d.pure ? '' : '*')).join(', '));
  if (!apply) continue;
  const lineStart = p => src.lastIndexOf('\n', p - 1) + 1;
  const lineEnd = p => { const n = src.indexOf('\n', p); return n < 0 ? src.length : n + 1; };
  const spans = lifted.map(d => {
    const s = lineStart(toks[d.a].s), e = lineEnd(toks[d.b - 1].e - 1);
    if (src.slice(s, toks[d.a].s).trim() || src.slice(toks[d.b - 1].e, e).trim()) throw new Error('not whole lines: ' + d.names[0]);
    return [s, e];
  });
  let body = src, liftText = [];
  for (const [s, e] of [...spans].reverse()) { liftText.unshift(body.slice(s, e)); body = body.slice(0, s) + body.slice(e); }
  body = body.replace(/\n{3,}/g, '\n\n');
  const fnAt = body.indexOf('function ' + fn + '() {');
  const out = body.slice(0, fnAt) + liftText.join('').replace(/\n{3,}/g, '\n\n') + '\n' + body.slice(fnAt).replace(/\s+$/, '') + '\n\nif (NQ.base) ' + fn + '();\n';
  fs.writeFileSync(path.join(dir, f), out);
}

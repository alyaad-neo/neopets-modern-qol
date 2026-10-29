(() => {
  const P = '--frame-left --frame-right -webkit-backdrop-filter -webkit-box-orient -webkit-line-clamp align-content align-items align-self backdrop-filter border border-radius bottom box-sizing color display filter flex-direction flex-wrap gap grid-column grid-row grid-template-columns height left letter-spacing line-height margin margin-left max-width min-width order overflow pointer-events position right scrollbar-width text-align text-overflow text-transform transform vertical-align visibility white-space width z-index background-color background-image box-shadow padding min-height max-height overflow-x overflow-y top cursor transition opacity font-family font-size font-weight animation-name row-gap column-gap justify-content border-color border-left margin-top padding-top text-shadow flex-grow flex-shrink flex-basis text-decoration-line list-style-type'.split(' ');
  const ROOTS = '#nqHud, #nqLeftBar, #btnOverlay, #qrDockWrap, #nqTools, #nqBgHandle, #nqBgSidebar, #nqNestPop, #nqNestMenu, #nqAcctDrawer, #nqTop';
  const KEY = 'nqSnap:' + location.pathname;
  const snap = {};
  document.querySelectorAll(ROOTS).forEach(r => [r, ...r.querySelectorAll('*')].forEach((el, i) => {
    for (const pe of [null, '::before', '::after']) {
      const cs = getComputedStyle(el, pe);
      if (pe && cs.content === 'none') continue;
      snap[r.id + ' ' + i + ' ' + el.tagName + '.' + String(el.className.baseVal ?? el.className).trim().split(/\s+/)[0] + (pe || '')] = P.map(p => cs.getPropertyValue(p)).join('|');
    }
  }));
  const old = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (!old) { localStorage.setItem(KEY, JSON.stringify(snap)); return 'saved ' + Object.keys(snap).length + ' entries. Update the script, reload this page, run again.'; }
  localStorage.removeItem(KEY);
  const out = [];
  for (const k in snap) {
    if (!(k in old)) continue;
    const a = old[k].split('|'), b = snap[k].split('|');
    P.forEach((p, j) => { if (a[j] !== b[j]) out.push(k + '  ' + p + ': ' + a[j] + ' -> ' + b[j]); });
  }
  const missing = Object.keys(old).filter(k => !(k in snap)).length;
  return (out.length ? out.slice(0, 60).join('\n') : 'no differences') + '\n(' + Object.keys(snap).length + ' entries, ' + missing + ' only in the first run)';
})();

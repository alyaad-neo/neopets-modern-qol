(function () {
  'use strict';
  if (window.top !== window) return;
  const POP = 'nppJN';
  if (location.hostname === 'items.jellyneo.net') {
    if (window.name !== POP) return;
    const CSS = `#nppJnCard { position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; background: #fff; color: #1f2937; font: 600 14px/1.35 system-ui, sans-serif; text-align: center; }
#nppJnCard .in { padding: 14px 16px 16px; }
#nppJnCard p { margin: 0; }
#nppJnCard img { display: block; width: 80px; height: 80px; margin: 0 auto 6px; image-rendering: auto; }
#nppJnCard a { color: inherit; text-decoration: none; }
#nppJnCard .price-history-link { display: inline-block; margin-top: 6px; padding: 4px 12px; border-radius: 999px; background: #f3f4f6; font-size: 15px; font-weight: 800; color: #111827; }
#nppJnCard .x { position: fixed; top: 6px; right: 6px; width: 26px; height: 26px; border: 0; border-radius: 50%; background: #f3f4f6; color: #374151; font: 700 16px/26px system-ui, sans-serif; cursor: pointer; padding: 0; }
#nppJnCard .x:hover { background: #e5e7eb; }
html.nppJn, html.nppJn body { overflow: hidden !important; }`;
    let tries = 0;
    const show = () => {
      if (document.getElementById('nppJnCard')) return;
      const img = document.querySelector('img.item-result-image'), res = img && img.closest('p');
      if (!res) { if (++tries < 40) setTimeout(show, 150); return; }
      const st = document.createElement('style'); st.textContent = CSS; (document.head || document.documentElement).appendChild(st);
      const card = document.createElement('div'); card.id = 'nppJnCard';
      const inner = document.createElement('div'); inner.className = 'in';
      inner.appendChild(res.cloneNode(true));
      inner.querySelectorAll('input, label:empty').forEach(n => n.remove());
      inner.querySelectorAll('br').forEach(b => b.replaceWith(document.createElement('div')));
      inner.querySelectorAll('a[href]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
      card.innerHTML = '<button class="x" type="button" title="Close (Esc)">×</button>';
      card.appendChild(inner);
      document.body.appendChild(card);
      document.documentElement.classList.add('nppJn');
      card.querySelector('.x').addEventListener('click', () => window.close());
      try { window.resizeBy(0, inner.offsetHeight + 8 - window.innerHeight); } catch {}
    };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.close(); });
    window.addEventListener('blur', () => window.close());
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show, { once: true }); else show();
    return;
  }
  if (!/^(www\.)?neopets\.com$/i.test(location.hostname)) return;
  let jn = null;
  document.addEventListener('click', (e) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const a = (e.composedPath ? e.composedPath() : [e.target]).find(n => n && n.classList && n.classList.contains('iph-icon--jellyneo') && n.href);
    if (!a) return;
    e.preventDefault(); e.stopPropagation();
    try { if (jn && !jn.closed) jn.close(); } catch {}
    const w = 240, h = 230, x = Math.max(0, Math.round(e.screenX - w / 2)), y = Math.max(0, Math.round(e.screenY + 18));
    jn = window.open(a.href, POP, `popup,width=${w},height=${h},left=${x},top=${y}`);
    if (!jn) window.open(a.href, '_blank', 'noopener');
  }, true);
  const closeJn = () => { try { if (jn && !jn.closed) jn.close(); } catch {} jn = null; };
  window.addEventListener('focus', closeJn);
  document.addEventListener('pointerdown', closeJn, true);
})();

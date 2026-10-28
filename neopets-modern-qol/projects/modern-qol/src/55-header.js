  function fixNcNavLinks() {
    if (!isNc) return;
    const sr = shadow();
    if (!sr) return;
    sr.querySelectorAll('a[href]').forEach(a => {
      const h = a.getAttribute('href') || '';
      if (h.startsWith('/') && !h.startsWith('//')) a.setAttribute('href', 'https://www.neopets.com' + h);
    });
  }

  function patchShadow() {
    const sr = shadow();
    if (!sr || sr.getElementById('nq-shadow')) return !!sr;
    const st = document.createElement('style');
    st.id = 'nq-shadow';
    st.textContent = SHADOW_CSS;
    if (/[?&]type=shop\b/i.test(location.search)) st.textContent += '\n.menu { display: none !important; }';
    sr.appendChild(st);

    ['community', 'games', 'explore', 'shop'].forEach(id => {
      const menu = sr.getElementById('menu-' + id);
      if (!menu) return;
      const ensure = () => {
        if (!menu.querySelector('.nq-menu-edit-btn')) {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'nq-menu-edit-btn'; b.title = 'Edit links';
          const lab = (on) => { b.classList.toggle('active', on); b.innerHTML = (on ? CHECK : PENCIL) + '<span>' + (on ? 'Done editing' : 'Edit links') + '</span>'; };
          lab(menu.classList.contains('nq-edit-mode'));
          b.addEventListener('click', (e) => { e.stopPropagation(); lab(menu.classList.toggle('nq-edit-mode')); });
          menu.appendChild(b);
        }
        const eb = menu.querySelector('.nq-menu-edit-btn');
        if (eb && menu.lastElementChild !== eb) menu.appendChild(eb);
        if (id === 'community' && !menu.querySelector('[data-nq-news]')) {
          const a = document.createElement('a');
          a.href = 'https://www.neopets.com/nf.phtml'; a.dataset.nqNews = '1';
          a.innerHTML = '<img src="https://images.neopets.com/themes/h5/basic/images/v3/news-icon.svg" alt=""><span>New Features</span>';
          const g = [...menu.querySelectorAll('a')].find(x => (x.getAttribute('href') || '').includes('/guilds/'));
          menu.insertBefore(a, g ? g.nextSibling : menu.querySelector('.menuAddRow'));
        }
        if (id === 'shop') {
          if (!menu.dataset.tab) menu.dataset.tab = 'np';
          if (!menu.querySelector('.nq-tabs')) {
            const bar = document.createElement('div');
            bar.className = 'nq-tabs';
            bar.innerHTML = '<button type="button" data-t="np">NP</button><button type="button" data-t="nc">NC</button>';
            bar.addEventListener('click', (e) => {
              const b = e.target.closest('button');
              if (b) { e.stopPropagation(); menu.dataset.tab = b.dataset.t; }
            });
            menu.prepend(bar);
          }
          let seps = 0;
          [...menu.children].forEach(c => {
            if (c.classList.contains('menuSep')) seps++;
            else if (c.tagName === 'A') c.dataset.g = seps === 0 ? 'np' : seps === 1 ? 'nc' : 'all';
          });
        }
      };
      ensure();
      new MutationObserver(() => { ensure(); fixNcNavLinks(); }).observe(menu, { childList: true });

      const recenter = () => {
        const b = sr.querySelector(`.btn.cat[data-id="${id}"]`);
        if (!b || menu.style.display !== 'block') return;
        const w = menu.getBoundingClientRect().width, r = b.getBoundingClientRect();
        const l = Math.max(8, Math.min(Math.round(r.left + r.width / 2 - w / 2), innerWidth - w - 8));
        if (Math.abs((parseFloat(menu.style.left) || 0) - l) > .5) menu.style.left = l + 'px';
      };
      new ResizeObserver(recenter).observe(menu);
      new MutationObserver(() => requestAnimationFrame(recenter)).observe(menu, { attributes: true, attributeFilter: ['style'] });
    });

    const bar = sr.querySelector('.bar');
    if (bar) {
      const a = document.createElement('a');
      a.className = 'nq-logo'; a.href = 'https://www.neopets.com/home';
      a.innerHTML = `<img src="${LOGO_URL}" alt="Neopets"><span>Neopets</span>`;
      const im = a.querySelector('img');
      im.addEventListener('error', () => { im.remove(); a.classList.add('txt'); });
      bar.appendChild(a);
    }

    let ct = null;
    const isNav = (t) => t && t.matches && t.matches('.btn.cat, .menu');
    sr.addEventListener('pointerenter', (e) => {
      if (!isNav(e.target)) return;
      clearTimeout(ct);
      if (e.target.classList.contains('cat') && e.target.dataset.id !== 'premium') {
        const p = sr.getElementById('menu-premium'); if (p) p.style.display = 'none';
      }
    }, true);
    sr.addEventListener('pointerleave', (e) => {
      const t = e.target;
      if (!isNav(t)) return;
      e.stopImmediatePropagation();
      const id = t.dataset.id || String(t.id).replace('menu-', '');
      clearTimeout(ct);
      ct = setTimeout(() => { const m = sr.getElementById('menu-' + id); if (m) m.style.display = 'none'; }, 200);
    }, true);
    return true;
  }

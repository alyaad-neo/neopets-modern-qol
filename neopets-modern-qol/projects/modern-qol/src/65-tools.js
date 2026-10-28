  const SEARCH_URL = 'https://www.neopets.com/search.phtml';
  const themeOf = () => NQ.getBtnTheme() || 'basic';
  const iconUrl = (name) => NQ.btnIconUrl(name, themeOf());
  function setupTools() {
    if (isNc || isPopup || $('#nppTools') || !document.body) return;
    const col = $('#btnOverlay .col.left');
    if (!col) return;
    const tools = document.createElement('div');
    tools.id = 'nppTools';
    tools.innerHTML =
      '<div class="nppSep"></div>' +
      `<form class="nppSearch" action="${SEARCH_URL}" method="get"><button type="submit" aria-label="Search" title="Search"><img alt=""></button><input name="string" placeholder="Search the site" autocomplete="off" aria-label="Search the site"></form>`;
    document.body.appendChild(tools);
    const sImg = $('.nppSearch img', tools), form = $('.nppSearch', tools), input = $('input', form);
    const host = $('#npx-host');
    const place = () => {
      if (!host) return;
      const r = host.getBoundingClientRect();
      if (!r.height) return;
      rs.setProperty('--npp-tools-top', Math.round(r.top + r.height / 2) + 'px');
      rs.setProperty('--npp-header-h', Math.round(r.height) + 'px');
    };
    place();
    if (host) { new ResizeObserver(place).observe(host); window.addEventListener('resize', place); }

    const measure = () => {
      const live = [...col.children].filter(k => !k.hasAttribute('data-npp-nested') && k.getBoundingClientRect().width > 8);
      if (!live.length) return;
      let size = 0;
      try { const A = NQ.sideBtns, v = A && A.getIconSize ? parseFloat(A.getIconSize()) : NaN; if (v >= 24 && v <= 96) size = Math.round(v); } catch {}
      if (!size) {
        const imgs = live.map(k => k.querySelector('img')).filter(Boolean);
        const boxes = imgs.length ? imgs : live, factor = imgs.length ? 1 : 0.88;
        const sizes = boxes.map(i => Math.round(Math.max(i.getBoundingClientRect().width, i.getBoundingClientRect().height))).filter(w => w > 8);
        if (!sizes.length) return;
        const tally = {}; sizes.forEach(w => { tally[w] = (tally[w] || 0) + 1; });
        size = Math.round(+Object.keys(tally).sort((x, y) => tally[y] - tally[x] || x - y)[0] * factor);
      }
      size = Math.max(28, Math.min(56, size));
      let gap = 10;
      if (live.length > 1) { const r0 = live[0].getBoundingClientRect(), r1 = live[1].getBoundingClientRect(); gap = Math.max(4, Math.min(28, Math.round(Math.abs(r1.top - r0.top) - r0.height))); }
      rs.setProperty('--npp-ic', size + 'px'); rs.setProperty('--npp-ig', gap + 'px');
      try {
        const cands = [live[0], live[0].querySelector('img')].filter(Boolean);
        const f = cands.map(c => getComputedStyle(c).filter).find(v => v && v !== 'none' && /drop-shadow/.test(v));
        if (f) rs.setProperty('--npp-ico-shadow', f);
      } catch {}
    };
    measure();
    const remeasure = () => { measure(); };
    rs.setProperty('--npp-tools-h', '0px');
    new MutationObserver(remeasure).observe(col, { childList: true });
    new ResizeObserver(remeasure).observe(col);

    const paintIcons = () => {
      const su = iconUrl('search'); if (su && sImg.getAttribute('src') !== su) sImg.src = su;
    };
    NQ.onBtnTheme(() => paintIcons());
    sImg.addEventListener('error', () => { sImg.style.display = 'none'; sImg.parentElement.classList.add('noimg'); });
    setTimeout(remeasure, 700); setTimeout(remeasure, 2500);
    paintIcons();

    const setSearch = (open) => {
      form.classList.toggle('nppOpen', open);
      if (host) host.classList.toggle('npp-search-open', open);
      if (open) input.focus();
    };
    const closeSearch = () => setSearch(false);
    input.addEventListener('focus', () => setSearch(true));
    form.addEventListener('submit', (e) => { if (!input.value.trim()) { e.preventDefault(); setSearch(true); } });
    $('button', form).addEventListener('click', (e) => {
      if (input.value.trim()) return;
      e.preventDefault();
      if (form.classList.contains('nppOpen')) { closeSearch(); input.blur(); }
      else setSearch(true);
    });
    document.addEventListener('pointerdown', (e) => {
      if (form.classList.contains('nppOpen') && !e.target.closest('#nppTools .nppSearch')) closeSearch();
    }, true);
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !form.classList.contains('nppOpen')) return;
      closeSearch(); input.blur();
    });

  }

  const NEST_KEY = 'npp_nest_v1';
  const readNest = () => { try { const o = JSON.parse(LSget(NEST_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch { return {}; } };
  const writeNest = (o) => LSset(NEST_KEY, JSON.stringify(o));
  const bgUrlOf = (el) => { try { const m = /url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(el).backgroundImage || ''); return m ? m[1] : ''; } catch { return ''; } };
  const itemKey = (el) => {
    const a = el.matches && el.matches('a[href]') ? el : (el.querySelector && el.querySelector('a[href]'));
    const href = a && a.getAttribute('href');
    if (href && href !== '#') return 'h:' + href;
    const im = el.querySelector && el.querySelector('img');
    if (im && (im.currentSrc || im.src)) return 'i:' + (im.currentSrc || im.src).split('?')[0];
    const b = bgUrlOf(el) || [...(el.querySelectorAll ? el.querySelectorAll('*') : [])].map(bgUrlOf).find(Boolean);
    if (b) return 'b:' + b.split('?')[0];
    return 't:' + String(el.getAttribute('title') || el.getAttribute('aria-label') || el.textContent || '').trim();
  };
  let nestApplyFn = null, nestKeyOf = null;
  function setupNest() {
    if (isNc || isPopup) return;
    const col = $('#btnOverlay .col.left');
    if (!col || col.dataset.nppNest) return;
    col.dataset.nppNest = '1';
    const pop = document.createElement('div'); pop.id = 'nppNestPop';
    const inner = document.createElement('div'); inner.className = 'col'; inner.style.setProperty('display', 'contents', 'important'); pop.appendChild(inner);
    const mount = () => { if (!pop.isConnected) (document.getElementById('btnOverlay') || document.body).appendChild(pop); };
    mount();
    const menu = document.createElement('div'); menu.id = 'nppNestMenu'; document.body.appendChild(menu);
    let hideT = null;

    const kidsByKey = () => { const m = new Map(); [...col.children].forEach(k => { const key = itemKey(k); if (key && !m.has(key)) m.set(key, k); }); return m; };
    const apply = () => {
      const nest = readNest(), by = kidsByKey(), kids = new Set(); Object.values(nest).forEach(a => a.forEach(c => kids.add(c)));
      [...col.children].forEach(k => {
        const key = itemKey(k);
        const isChild = kids.has(key) && !(key in nest);
        k.toggleAttribute('data-npp-nested', isChild);
        const has = key in nest && nest[key].some(c => by.has(c));
        k.classList.toggle('nppHasNest', has);
        if (has && getComputedStyle(k).position === 'static') k.style.position = 'relative';
      });
    };
    let raf = 0; const soon = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply); };
    new MutationObserver(soon).observe(col, { childList: true });
    apply();
    nestApplyFn = apply; nestKeyOf = itemKey;

    const showPop = (parent) => {
      clearTimeout(hideT);
      const key = itemKey(parent), nest = readNest(), by = kidsByKey();
      let list = (nest[key] || []).map(c => by.get(c)).filter(Boolean);
      if (!list.length) return;
      mount();
      const sig = key + '|' + list.map(itemKey).join(',');
      if (!(pop._sig === sig && inner.children.length)) {
        inner.textContent = '';
        list.forEach((orig, i) => {
          const c = orig.cloneNode(true);
          c.removeAttribute('data-npp-nested'); c.classList.remove('nppHasNest', 'nppBgIcon'); c.style.removeProperty('display');
          c.dataset.i = i; c.style.setProperty('--i', i);
          inner.appendChild(c);
        });
        pop._sig = sig;
      }
      pop._list = list;
      const modEl = col.closest('#nppIcons');
      if (modEl) { const pr = parent.getBoundingClientRect(), mr = modEl.getBoundingClientRect(); pop.style.setProperty('--tx', Math.round(pr.left + pr.width / 2 - mr.left) + 'px'); }
      const r = parent.getBoundingClientRect();
      pop.style.left = Math.round(r.right) + 'px'; pop.style.top = Math.round(r.top + r.height / 2) + 'px';
      if (!pop.classList.contains('open')) pop.classList.add('open');
    };
    const hidePop = () => { clearTimeout(hideT); hideT = setTimeout(() => pop.classList.remove('open'), 300); };
    const canHover = () => { try { return matchMedia('(hover: hover) and (pointer: fine)').matches; } catch { return true; } };
    const inMod = () => !!col.closest('#nppIcons');
    const hoverOpen = (e) => {
      if (inMod() && !canHover()) return;
      const item = [...col.children].find(k => k.contains(e.target));
      if (!item) return;
      if (item.classList.contains('nppHasNest')) { showPop(item); pop._key = itemKey(item); } else if (pop.classList.contains('open')) hidePop();
    };
    col.addEventListener('mouseover', hoverOpen);
    col.addEventListener('focusin', hoverOpen);
    col.addEventListener('focusout', () => { if (inMod()) hidePop(); });
    col.addEventListener('mouseleave', (e) => { if (e.relatedTarget && pop.contains(e.relatedTarget)) return; if (!inMod() || canHover()) hidePop(); });
    pop.addEventListener('mouseenter', () => clearTimeout(hideT)); pop.addEventListener('mouseover', () => clearTimeout(hideT)); pop.addEventListener('pointerenter', () => clearTimeout(hideT));
    pop.addEventListener('focusin', () => clearTimeout(hideT));
    pop.addEventListener('focusout', () => { if (inMod()) hidePop(); });
    pop.addEventListener('mouseleave', (e) => { if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('#nppIcons #btnOverlay .col > .nppHasNest')) return; if (!inMod() || canHover()) hidePop(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && inMod() && pop.classList.contains('open')) pop.classList.remove('open'); });
    col.addEventListener('click', (e) => {
      if (!inMod() || canHover() || pop._via || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
      const item = [...col.children].find(k => k.contains(e.target));
      if (!item || !item.classList.contains('nppHasNest')) return;
      e.preventDefault(); e.stopPropagation();
      const k = itemKey(item);
      if (pop.classList.contains('open') && pop._key === k) pop.classList.remove('open'); else { showPop(item); pop._key = k; }
    }, true);
    pop.addEventListener('click', (e) => {
      const a = e.target.closest('#nppNestPop .col > *'); if (!a) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
      e.preventDefault(); e.stopPropagation();
      const orig = pop._list && pop._list[+a.dataset.i];
      if (orig) { pop._via = true; try { orig.click(); } finally { pop._via = false; } }
      pop.classList.remove('open');
    });

    document.addEventListener('pointerdown', (e) => { if (inMod() && pop.classList.contains('open') && !e.target.closest('#nppIcons')) pop.classList.remove('open'); }, true);
    const closeMenu = () => { menu.classList.remove('open'); };
    const openMenu = (x, y, entries) => {
      menu.innerHTML = entries.map((e, i) => `<button type="button" data-i="${i}">${esc(e.label)}</button>`).join('');
      menu._entries = entries;
      menu.style.left = Math.min(x, innerWidth - 230) + 'px'; menu.style.top = Math.min(y, innerHeight - 20 - entries.length * 34) + 'px';
      menu.classList.add('open');
    };
    menu.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const en = menu._entries[+b.dataset.i]; closeMenu(); if (en) { en.run(); apply(); } });
    document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#nppNestMenu')) closeMenu(); }, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    col.addEventListener('contextmenu', (e) => {
      const item = [...col.children].find(k => k.contains(e.target));
      if (!item) return;
      const key = itemKey(item); if (!key) return;
      const nest = readNest(), top = [...col.children].filter(k => !k.hasAttribute('data-npp-nested'));
      const idx = top.indexOf(item), prev = idx > 0 ? top[idx - 1] : null, entries = [];
      if (prev && itemKey(prev)) entries.push({ label: 'Nest under the icon above', run: () => {
        const pk = itemKey(prev), o = readNest();
        o[pk] = (o[pk] || []).concat([key].concat(o[key] || [])).filter((v, i, a) => a.indexOf(v) === i && v !== pk);
        delete o[key]; writeNest(o);
      } });
      if (key in nest) entries.push({ label: `Ungroup (${nest[key].length} nested)`, run: () => { const o = readNest(); delete o[key]; writeNest(o); } });
      if (!entries.length) return;
      e.preventDefault(); openMenu(e.clientX, e.clientY, entries);
    });
    pop.addEventListener('contextmenu', (e) => {
      const a = e.target.closest('#nppNestPop .col > *'); if (!a) return;
      const orig = pop._list && pop._list[+a.dataset.i]; if (!orig) return;
      const ck = itemKey(orig);
      e.preventDefault();
      openMenu(e.clientX, e.clientY, [{ label: 'Move out of group', run: () => { const o = readNest(); Object.keys(o).forEach(pk => { o[pk] = o[pk].filter(c => c !== ck); if (!o[pk].length) delete o[pk]; }); writeNest(o); pop.classList.remove('open'); } }]);
    });
  }

  function decorateEditorNest() {
    const h = $('#npxSideBtnHost'), sr = h && h.shadowRoot, col = $('#btnOverlay .col.left');
    if (!sr || !col || !nestKeyOf || !nestApplyFn) return;
    const body = sr.querySelector('.body');
    if (!body) return;
    const rows = [...sr.querySelectorAll('.col:not([data-side="right"]) .items > .item')], kids = [...col.children];
    if (!rows.length || rows.length !== kids.length) return;
    if (!sr.querySelector('.nppNestHint')) { const hint = document.createElement('div'); hint.className = 'nppNestHint'; hint.textContent = '↳ nests an icon under the icon above it. To nest a new icon: press ADD, move it right below the icon you want to group it with, then press its ↳. Nested icons open in a pop-out when you hover the icon above.'; body.appendChild(hint); }
    const nest = readNest(), parentOf = {};
    Object.entries(nest).forEach(([pk, cs]) => cs.forEach(c => { parentOf[c] = pk; }));
    let prevTop = null;
    rows.forEach((row, i) => {
      const key = nestKeyOf(kids[i]), isChild = key in parentOf, isParent = key in nest && nest[key].length > 0;
      let btn = row.querySelector('.nppNestBtn');
      if (!btn) {
        btn = document.createElement('button'); btn.type = 'button'; btn.className = 'nppNestBtn iconBtnMini';
        btn.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          const rowsNow = [...sr.querySelectorAll('.col:not([data-side="right"]) .items > .item')], kidsNow = [...col.children];
          const idx = rowsNow.indexOf(btn.closest('.item'));
          if (idx < 0 || rowsNow.length !== kidsNow.length) return;
          const k = nestKeyOf(kidsNow[idx]), o = readNest();
          const par = Object.keys(o).find(pk => o[pk].includes(k));
          if (par) { o[par] = o[par].filter(c => c !== k); if (!o[par].length) delete o[par]; }
          else {
            const hidden = new Set(); Object.values(o).forEach(a => a.forEach(c => hidden.add(c)));
            let prev = null; for (let j = idx - 1; j >= 0; j--) { const kk = nestKeyOf(kidsNow[j]); if (!hidden.has(kk)) { prev = kk; break; } }
            if (!prev) return;
            o[prev] = (o[prev] || []).concat([k].concat(o[k] || [])).filter((v, x, arr) => arr.indexOf(v) === x && v !== prev);
            delete o[k];
          }
          writeNest(o); nestApplyFn(); decorateEditorNest();
        });
        row.appendChild(btn);
      }
      const want = isChild ? '↱' : '↳';
      if (btn.textContent !== want) btn.textContent = want;
      btn.title = isChild ? 'Move out of the group' : (prevTop ? 'Nest under the icon above' : 'Nothing above to nest under');
      btn.disabled = !isChild && !prevTop;
      btn.classList.toggle('on', isChild);
      row.classList.toggle('nppNested', isChild); row.classList.toggle('nppParent', isParent);
      if (!isChild) prevTop = key;
    });
  }

  function patchEditor() {
    const h = $('#npxSideBtnHost'), sr = h && h.shadowRoot;
    if (!sr || sr.getElementById('npp-editor')) return;
    const tab = sr.querySelector('.tab'), panel = sr.querySelector('.panel');
    if (!tab || !panel) return;
    const st = document.createElement('style');
    st.id = 'npp-editor'; st.textContent = EDITOR_CSS;
    sr.appendChild(st);
    tab.innerHTML = CHEV;
    new MutationObserver(() => tab.classList.toggle('isOpen', panel.classList.contains('open'))).observe(panel, { attributes: true, attributeFilter: ['class'] });
    tabEl = tab; panelEl = panel;

    const head = panel.querySelector('.head');
    if (head && NQ.sideBtns && !head.querySelector('.nppSizeGrp')) {
      const A = NQ.sideBtns;
      const grp = document.createElement('div');
      grp.className = 'nppSizeGrp';
      grp.innerHTML = '<span class="nppSizeLbl">Size</span><button type="button" data-d="-1" title="Smaller icons" aria-label="Smaller icons">−</button><span class="nppSizeVal"></span><button type="button" data-d="1" title="Bigger icons" aria-label="Bigger icons">+</button>';
      const paintSize = () => { grp.querySelector('.nppSizeVal').textContent = A.getIconSize() + 'px'; };
      grp.addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('button[data-d]');
        if (!b) return;
        e.preventDefault(); e.stopPropagation();
        A.setIconSize(A.getIconSize() + (+b.dataset.d) * (A.iconSizeStep || 6));
        paintSize();
      });
      head.insertBefore(grp, head.firstChild);
      paintSize();
    }

    const fixIco = (el) => {
      if (el.dataset.f) return;
      el.dataset.f = '1';
      const m = (el.style.backgroundImage || '').match(/url\(["']?([^"')]+)["']?\)/);
      const name = m && (m[1].match(/\/([^\/]+)-icon\.(svg|png)/) || [])[1];
      if (!name) return;
      const url = m[1];
      const cands = [url.replace(/\.(svg|png)$/, (e) => e === '.svg' ? '.png' : '.svg'), ...(NQ.btnFallbackChain || []).map(u => u.replace('{icon}', name))];
      const next = (i) => {
        if (i >= cands.length) return;
        const im = new Image();
        im.onload = () => { el.style.backgroundImage = `url('${cands[i]}')`; };
        im.onerror = () => next(i + 1);
        im.src = cands[i];
      };
      const probe = new Image();
      probe.onerror = () => next(0);
      probe.src = url;
    };
    let scanRaf = 0;
    const scan = () => { cancelAnimationFrame(scanRaf); scanRaf = requestAnimationFrame(() => { sr.querySelectorAll('.ico:not([data-f])').forEach(fixIco); decorateEditorNest(); }); };
    new MutationObserver(scan).observe(sr, { childList: true, subtree: true });
    scan();
  }

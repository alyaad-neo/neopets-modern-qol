  function ensureDefaults() {
    if (LSget('nq_defaults_v3')) return;
    const put = (k, v) => { if (LSget(k)) return false; LSset(k, v); return true; };
    const t = put('nq_btn_theme_v1', 'premium'), a = put('nq_accent_v1', NP_ORANGE);
    put('nq_topbar_bg_v1', 'blur');
    LSset('nq_defaults_v3', '1');
    if (t) NQ.applyBtnTheme('premium');
    if (a) NQ.applyAccent(NP_ORANGE);
  }
  function applySynced() {
    if (!isNc) return;
    const A = NQ.sideBtns;
    try {
      NQ.applyAccent(LSget('nq_accent_v1') || NP_ORANGE);
      const t = LSget('nq_btn_theme_v1');
      if (t) NQ.applyBtnTheme(t);
      const clean = (u) => String(u).replace(/["\\\n\r]/g, '');
      const mi = LSget(K.mainImg), li = LSget(K.leftImg);
      if (mi) { rs.setProperty('--npMainSolid', '#000'); rs.setProperty('--npWallImage', `url("${clean(mi)}")`); }
      if (li) { rs.setProperty('--npLeftBarImg', `url("${clean(li)}")`); rs.setProperty('--npLeftBarSolid', '#000'); rs.setProperty('--npLeftBarShadeA', '1'); }
      root.classList.remove('np-recolor-site');
      paintAll(saved());
      if (A) {
        A.setIconSize(A.getIconSize()); A.rebuild();
      }
    } catch {}
  }

  const ICONS_KEY = 'nq_side_icons_v1';
  const NPP_CHEV = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6l5 5 5-5"/></svg>';
  let hudMo = null;
  let hudWait = null;
  let npFitRaf = 0, npFitMo = null;
  function fitNpVals() {
    const root = $('#npNp'); if (!root) return;
    root.querySelectorAll('.np-top-row .np-amount, .np-top-row .np-nc').forEach((tile) => {
      const v = tile.querySelector('.npVal, .ncVal'); if (!v) return;
      tile.style.flexGrow = String(Math.max(1, (v.textContent || '').trim().length));
      let px = 14; v.style.setProperty('font-size', px + 'px', 'important');
      while (px > 9 && v.scrollWidth > v.clientWidth) { px -= 1; v.style.setProperty('font-size', px + 'px', 'important'); }
    });
  }
  function scheduleNpFit() { cancelAnimationFrame(npFitRaf); npFitRaf = requestAnimationFrame(fitNpVals); }
  function watchNpFit() {
    const root = $('#npNp'); if (!root) return;
    if (!npFitMo) { npFitMo = new MutationObserver(scheduleNpFit); window.addEventListener('resize', scheduleNpFit); }
    npFitMo.disconnect(); npFitMo.observe(root, { childList: true, subtree: true, characterData: true });
    scheduleNpFit(); setTimeout(scheduleNpFit, 600); setTimeout(scheduleNpFit, 2000);
  }
  function layoutSidebar() {
    if (isNc || isPopup) return;
    const hud = $('#npHud');
    if (!hud) {
      if (!hudWait) { hudWait = new MutationObserver(() => { if ($('#npHud')) { hudWait.disconnect(); layoutSidebar(); } }); hudWait.observe(document.documentElement, { childList: true, subtree: true }); }
      return;
    }
    { const npA = $('#npNp .np-amount'), ncA = $('#npNp .np-nc'); if (npA && !npA.getAttribute('aria-label')) { npA.setAttribute('aria-label', 'Neopoints'); npA.title = 'Neopoints'; } if (ncA && !ncA.getAttribute('aria-label')) { ncA.setAttribute('aria-label', 'Neocash'); ncA.title = 'Neocash'; } }
    watchNpFit();
    let mod = $('#nppIcons');
    const ov = $('#btnOverlay');
    if (!mod && ov) {
      mod = document.createElement('div');
      mod.id = 'nppIcons';
      mod.innerHTML = `<button type="button" class="nppIcHead" aria-expanded="true"><span>Shortcuts</span>${NPP_CHEV}</button><div class="nppIcBody"></div>`;
      const shut = LSget(ICONS_KEY) === '0';
      mod.classList.toggle('nppShut', shut);
      $('.nppIcHead', mod).setAttribute('aria-expanded', shut ? 'false' : 'true');
      $('.nppIcHead', mod).addEventListener('click', () => {
        const f = mod.classList.toggle('nppShut');
        $('.nppIcHead', mod).setAttribute('aria-expanded', f ? 'false' : 'true');
        LSset(ICONS_KEY, f ? '0' : '1');
      });
    }
    if (mod && ov && !mod.contains(ov)) { $('.nppIcBody', mod).appendChild(ov); ov.classList.add('nppIn'); }
    let nav = $('#nppNavMod');
    if (!nav) { nav = document.createElement('div'); nav.id = 'nppNavMod'; }
    const foot = $('#nppFoot');
    const un = $('#npUser');
    const lists = $('#nppListsMod'), anchor = lists && lists.parentNode === hud ? lists : un;
    if (nav.parentNode !== hud) hud.insertBefore(nav, anchor && anchor.parentNode === hud ? anchor.nextSibling : hud.firstChild);
    if (foot && foot.parentNode !== hud) hud.appendChild(foot);
    if (mod && hud.lastElementChild !== mod) hud.appendChild(mod);
    if (!hudMo) {
      let raf = 0;
      hudMo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layoutSidebar); });
      hudMo.observe(hud, { childList: true });
    }
  }

  function buildNav() {
    const sr = shadow(), mod = $('#nppNavMod');
    if (!sr || !mod) return;
    const seen = new Set(), html = [];
    sr.querySelectorAll('.left .btn').forEach((b) => {
      const label = (b.textContent || '').replace(/\s+/g, ' ').trim();
      if (!label) return;
      const id = b.dataset && b.dataset.id, menu = id ? sr.getElementById('menu-' + id) : null;
      const links = menu ? [...menu.querySelectorAll('a[href]')].filter(a => { const h = a.getAttribute('href'); return h && h !== '#' && !a.closest('.menuAddRow'); }).map(a => [(a.textContent || '').replace(/\s+/g, ' ').trim(), a.href]).filter(l => l[0]) : [];
      if (links.length) html.push(`<div class="nppNavGrp"><button type="button" class="nppNavHead" aria-expanded="false"><span>${esc(label)}</span>${NPP_CHEV}</button><div class="nppNavLinks">${links.map(l => `<a href="${esc(l[1])}">${esc(l[0])}</a>`).join('')}</div></div>`);
      else if (b.href && !seen.has(b.href)) { seen.add(b.href); html.push(`<div class="nppNavGrp"><a class="nppNavSolo" href="${esc(b.href)}">${esc(label)}</a></div>`); }
    });
    const out = html.join('');
    if (mod._html === out) return;
    const open = new Set([...mod.querySelectorAll('.nppNavGrp.open .nppNavHead span')].map(x => x.textContent));
    mod.innerHTML = out; mod._html = out;
    mod.querySelectorAll('.nppNavGrp').forEach(g => { const h = $('.nppNavHead span', g); if (h && open.has(h.textContent)) g.classList.add('open'); });
    if (!mod._wired) {
      mod._wired = true;
      mod.addEventListener('click', (e) => {
        const h = e.target.closest('.nppNavHead'); if (!h) return;
        const g = h.parentNode, o = g.classList.toggle('open');
        h.setAttribute('aria-expanded', o ? 'true' : 'false');
      });
    }
  }

  function setupDrawer() {
    if (isNc || isPopup || !document.body) return;
    const host = $('#npx-host');
    if (host && !host.classList.contains('nppHam')) host.classList.add('nppHam');
    const sr0 = host && host.shadowRoot;
    if (sr0) sr0.querySelectorAll('.left .btn:not([title])').forEach(b => { const t = (b.textContent || '').replace(/\s+/g, ' ').trim(); if (t) b.title = t; });
    if ($('#nppMenuBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'nppMenuBtn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Open menu'); btn.setAttribute('aria-controls', 'npHud'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    const scrim = document.createElement('div'); scrim.id = 'nppScrim'; scrim.setAttribute('aria-hidden', 'true');
    const cls = document.createElement('button'); cls.id = 'nppDrawerClose'; cls.type = 'button'; cls.setAttribute('aria-label', 'Close menu'); cls.textContent = '\u00d7';
    document.body.append(btn, scrim, cls);
    const isOpen = () => root.classList.contains('nppDrawerOpen');
    const set = (open) => {
      if (open === isOpen()) return;
      root.classList.toggle('nppDrawerOpen', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { document.dispatchEvent(new CustomEvent('npp:drawer', { detail: 'side' })); buildNav(); setTimeout(() => cls.focus({ preventScroll: true }), 30); }
      else { const hud = $('#npHud'); if (hud && hud.contains(document.activeElement)) btn.focus({ preventScroll: true }); }
    };
    btn.addEventListener('click', () => set(!isOpen()));
    scrim.addEventListener('click', () => set(false));
    cls.addEventListener('click', () => set(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) set(false); });
    document.addEventListener('npp:drawer', (e) => { if (e.detail !== 'side') set(false); });
    const mq = window.matchMedia('(min-width: 1101px)');
    const wide = (e) => { if (e.matches) set(false); };
    if (mq.addEventListener) mq.addEventListener('change', wide); else if (mq.addListener) mq.addListener(wide);
  }

  if (!isAuth && !isNc && !isPopup) {
    root.classList.add('npp-pre');
    try { if (LSget('nq_side_light') === '1') root.classList.add('npp-side-light'); } catch (er) {}
    const pre = document.createElement('style');
    pre.id = 'npp-pre-css';
    pre.textContent = 'html.npp-pre #npHud, html.npp-pre #nppFoot, html.npp-pre #btnOverlay, html.npp-pre #npLeftBar, html.npp-pre #qrDockWrap { opacity: 0 !important; pointer-events: none !important; } html.npp-pre #npActivePet img { max-width: 100% !important; max-height: 170px !important; object-fit: contain !important; } #npHud, #nppFoot, #btnOverlay { transition: opacity .3s ease; } @media (prefers-reduced-motion: reduce) { #npHud, #nppFoot, #btnOverlay { transition: none !important; } }';
    (document.head || root).appendChild(pre);
    setTimeout(() => root.classList.remove('npp-pre'), 5000);
  }
  function boot() {
    if (root.dataset.nppBoot) return;
    root.dataset.nppBoot = '1';
    if (isAuth) { stripUi(); document.addEventListener('DOMContentLoaded', stripUi, { once: true }); return; }
    if (isPopup) root.classList.add('npp-popup');
    if (path.startsWith('/reg/page4.phtml')) root.classList.add('npp-reg4');
    if (/^\/home(\/|$)/.test(path)) root.classList.add('npp-home');
    if (isNc) root.classList.add('npp-nc');
    if (!isNc && !isPopup) {
      root.classList.add('npp-wait');
      root.classList.remove('npp-pre');
      setTimeout(() => { petWaited = true; unwait(); }, 2200);
      setTimeout(() => root.classList.remove('npp-wait'), 3000);
    }

    const css = document.createElement('style');
    css.id = 'npp-css'; css.textContent = (isNc ? NC_CSS : PAGE_CSS + LAYOUT_CSS) + BAR_CSS;
    (document.head || root).appendChild(css);
    const font = document.createElement('link');
    font.rel = 'stylesheet'; font.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap';
    (document.head || root).appendChild(font);

    if (isNc) {
      const core = document.getElementById('np-core-layout');
      if (core) {
        const t = core.textContent, i = t.indexOf('--np-frame-shift');
        const cut = i > 0 ? t.lastIndexOf(':root', i) : -1;
        if (cut > 0) core.textContent = t.slice(0, cut);
      }
    }

    ['nq_frame_size_v1', 'nq_col_width_v1', 'nq_user_settings_v1', 'nq_qr_settings_v1', 'nq_side_layout_v1',
      'nq_side_side_v1', 'nq_side_shift_v1', 'nq_side_x_v1', 'nq_col_offset_v1'].forEach(LSdel);
    try { Object.keys(localStorage).filter(k => k.startsWith('nq_hud_userlookup:')).forEach(LSdel); } catch {}

    ensureDefaults();
    applyBarStyle(LSget('nq_topbar_bg_v1'));
    applyLogo();
    if (isNc) root.classList.remove('np-recolor-site'); else root.classList.toggle('np-recolor-site', LSget('nq_recolor_site_v1') === '1');
    try { if (!rs.getPropertyValue('--np-accent-l60') ) NQ.applyAccent(NQ.getAccent() || '#ffffff'); } catch {}
    applyAccentContrast();
    NQ.onAccent((hex) => { if (!ownAccent && !saving) accentPick = null; applyAccentContrast(hex); applySearchContrast(); });
    paintAll(saved());
    applySynced();
    document.addEventListener('DOMContentLoaded', () => { paintAll(saved()); setTimeout(() => paintAll(saved()), 800); }, { once: true });

    patchShadow();
    globalListeners();
    setupKeys();
    setupClock(); fixNcNavLinks(); setupPremium(); lockShopkeeper();
    const build = () => {
      buildFooter(); setupTools(); setupScrollTop(); setupBell(); setupNest(); patchEditor(); layoutSidebar(); setupDrawer();
      setupBank(); petUI(); setupDailyFold(); wireSidebar(); setupPremium(); highlightShopPrices(); updateNc();
      unwait();
    };
    if (document.body) build();
    else new MutationObserver((_, o) => { if (document.body) { o.disconnect(); build(); } }).observe(root, { childList: true });
    document.addEventListener('DOMContentLoaded', build, { once: true });
    window.addEventListener('load', build, { once: true });
    if (NQ.dailies && NQ.dailies.onCard) NQ.dailies.onCard(setupDailyFold);
    const petInfo = () => { if (!staleTab()) renderPetInfo(); };
    if (NQ.onQrData) NQ.onQrData(petInfo);
    window.addEventListener('storage', (e) => { if (e.key === 'nq_qr_data') petInfo(); });
  }

  if (!isNc && !isPopup && /^\/home(\/|$)/.test(path)) {
    const fixHomeBg = () => { try { if (typeof W.bodyHeightAdjust2020 === 'function') W.bodyHeightAdjust2020(); } catch {} };
    let rz = 0; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fixHomeBg, 150); });
    window.addEventListener('load', () => { [200, 900, 2200, 4500].forEach(t => setTimeout(fixHomeBg, t)); });
  }

  NQ.boot = () => { if (NQ.base) boot(); };

  const FOLD_KEY = 'nq_fold_v1';
  function setupDailyFold() {
    if (isNc || isPopup) return;
    let st = {}; try { st = JSON.parse(LSget(FOLD_KEY) || '{}') || {}; } catch {}
    const card = $('#nqDaily');
    if (!card || card.querySelector(':scope > .nqFold')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'nqFold nqEye'; b.title = 'Hide notices'; b.setAttribute('aria-label', 'Hide notices');
    b.innerHTML = EYE;
    const apply = () => {
      const f = !!st.daily;
      card.classList.toggle('nqFolded', f);
      b.classList.toggle('up', f);
      b.innerHTML = f ? EYE : EYE_OFF;
      b.title = f ? 'Show notices' : 'Hide notices'; b.setAttribute('aria-label', b.title);
    };
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); st.daily = !st.daily; LSset(FOLD_KEY, JSON.stringify(st)); apply(); });
    card.prepend(b);
    apply();
  }
  function setupScrollTop() {
    if (isNc || isPopup || !document.body || document.getElementById('nqTop')) return;
    const b = document.createElement('button');
    b.id = 'nqTop'; b.type = 'button'; b.title = 'Back to top'; b.setAttribute('aria-label', 'Back to top');
    b.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 9.5 8 5l4.5 4.5"/></svg>';
    b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(b);
    const sync = () => b.classList.toggle('on', window.scrollY > 400);
    window.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  function highlightShopPrices() {
    if (!/[?&]type=shop\b/i.test(location.search) || !document.body) return;
    const targets = new Set(['10,000', '25,000']);
    document.querySelectorAll('.shop-item .item-img[data-price]').forEach(img => {
      if (!targets.has((img.dataset.price || '').trim())) return;
      const cost = [...img.closest('.shop-item').querySelectorAll('.item-stock')].find(p => /Cost:/i.test(p.textContent));
      if (cost) cost.classList.add('nqBigPrice');
    });
  }

  const SHOP_LOCK_MS = 5000;
  let shopLockSet = false;
  function lockShopkeeper() {
    if (shopLockSet || !/[?&]type=shop\b/i.test(location.search)) return;
    shopLockSet = true;
    const locked = () => performance.now() < SHOP_LOCK_MS;
    const block = (e) => {
      if (!locked() || !e.target.closest || !e.target.closest('.shop-bg')) return;
      e.preventDefault(); e.stopImmediatePropagation();
    };
    ['click', 'mousedown', 'pointerdown', 'auxclick'].forEach(t => window.addEventListener(t, block, true));
    if (!locked()) return;
    document.documentElement.classList.add('nq-shop-lock');
    setTimeout(() => document.documentElement.classList.remove('nq-shop-lock'), SHOP_LOCK_MS - performance.now());
  }

  function openHeaderMenu(id) {
    const sr = shadow(); if (!sr) return;
    const b = sr.querySelector(`.btn.cat[data-id="${id}"]`);
    if (b) b.dispatchEvent(new Event('pointerenter'));
  }
  function closeAllPanels() {
    const sr = shadow();
    if (sr) sr.querySelectorAll('.menu').forEach(m => { m.style.display = 'none'; });
    document.dispatchEvent(new CustomEvent('nq:drawer', { detail: 'none' }));
    document.querySelectorAll('.bankSettingsBackdrop').forEach(el => el.remove());
    if (dockOpen) setDock(false);
  }
  function setupKeys() {
    if (isNc || isPopup) return;
    const MENUS = { Digit1: 'community', Digit2: 'games', Digit3: 'explore', Digit4: 'shop', Digit5: 'premium' };
    document.addEventListener('keydown', (e) => {
      const t = e.target;
      const typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
      if (e.key === 'Escape') { if (typing && t.blur) t.blur(); closeAllPanels(); return; }
      if (typing) return;
      if (e.altKey && MENUS[e.code]) { e.preventDefault(); openHeaderMenu(MENUS[e.code]); }
    }, true);
  }

  function abbrNum(el) {
    const t = el.textContent.trim();
    if (!/^[\d,]+$/.test(t)) return;
    const n = parseInt(t.replace(/,/g, ''), 10);
    if (!Number.isFinite(n)) return;
    const f = (v, u) => { const x = Math.floor(v * 10) / 10; return (x % 1 ? x.toFixed(1) : String(x)) + u; };
    const out = n >= 1e9 ? f(n / 1e9, 'B') : n >= 1e6 ? f(n / 1e6, 'M') : n >= 1e3 ? f(n / 1e3, 'K') : t;
    el.title = n.toLocaleString('en-US');
    if (el.textContent !== out) el.textContent = out;
  }
  function updateNc() {
    const el = $('#nqNp .ncVal');
    if (!el) return;
    const live = (($('#ncanchor') || {}).textContent || '').trim();
    if (live) LSset('nq_nc_last', live);
    const v = live || LSget('nq_nc_last');
    if (v && el.dataset.raw !== v) { el.dataset.raw = v; el.textContent = v; }
  }
  function setupBank() {
    const np = $('#nqNp'), bank = $('#nqBank');
    if (!np || !bank || np.dataset.acc || !$('#nqBal', bank)) return;
    np.dataset.acc = '1';
    const val = $('.nqVal', np), img = $('img', np);
    np.innerHTML = '';
    const top = document.createElement('div');
    top.className = 'nq-top-row';
    top.innerHTML = `<div class="nq-amounts"><a class="nq-amount" href="https://www.neopets.com/inventory.phtml" title="Inventory"><span class="nqVal">${esc(val ? val.textContent : '…')}</span>${img ? img.outerHTML : ''}</a><a class="nq-nc" href="https://ncmall.neopets.com/mall/shop.phtml?layout=new" title="NC Mall"><span class="ncVal">…</span><img src="https://images.neopets.com/themes/h5/basic/images/nc-icon.svg" alt="" onerror="this.remove()"></a><a class="nq-bank" href="https://www.neopets.com/bank.phtml" title="Bank" aria-label="Bank"></a></div>`;
    top.querySelector('.nq-bank').innerHTML = '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 1 1.5 4.5V6h13V4.5z"/><rect x="2.5" y="7" width="2" height="5"/><rect x="7" y="7" width="2" height="5"/><rect x="11.5" y="7" width="2" height="5"/><rect x="1.5" y="13" width="13" height="1.8" rx=".4"/></svg>';
    np.append(top);
    updateNc();
    ['.nqVal', '.ncVal'].forEach(sel => {
      const el = top.querySelector(sel);
      if (!el) return;
      new MutationObserver(() => abbrNum(el)).observe(el, { childList: true, characterData: true, subtree: true });
      abbrNum(el);
    });
    [top].forEach(el => ['click', 'auxclick', 'contextmenu'].forEach(t => el.addEventListener(t, e => e.stopPropagation())));
  }

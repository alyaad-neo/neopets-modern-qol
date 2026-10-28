  const QASALAN_ITEM = ['Qasalan Expellibox', 'https://ncmall.neopets.com/games/giveaway/process_giveaway.phtml'];
  const PREMIUM_ITEMS = [
    '# Premium',
    ['Manage Membership', 'https://nc.neopets.com/membership/', 'icon'],
    ['Super Shop Wizard', 'https://www.neopets.com/shops/wizard.phtml', 'icon', 1],
    '# Labs & Bank',
    ['Lab Ray', 'https://www.neopets.com/lab.phtml'],
    ['Petpet Lab Ray', 'https://www.neopets.com/petpetlab.phtml'],
    ['Bank Interest', 'https://www.neopets.com/bank.phtml'],
    '# Daily rewards',
    QASALAN_ITEM,
    ['Food Club', 'https://www.neopets.com/pirates/foodclub.phtml'],
    ['Stock Market', 'https://www.neopets.com/stockmarket.phtml?type=portfolio'],
    ['Giant Omelette', 'https://www.neopets.com/prehistoric/omelette.phtml'],
    ['Giant Jelly', 'https://www.neopets.com/jelly/jelly.phtml'],
    ['Tombola', 'https://www.neopets.com/island/tombola.phtml'],
    ['Coltzan\'s Shrine', 'https://www.neopets.com/desert/shrine.phtml'],
    ['Grumpy King', 'https://www.neopets.com/medieval/grumpyking.phtml'],
    ['Trudy\'s Surprise', 'https://www.neopets.com/trudys_surprise.phtml'],
    ['Wishing Well', 'https://www.neopets.com/wishing.phtml'],
    ['Healing Springs', 'https://www.neopets.com/faerieland/springs.phtml'],
    ['Tarla\'s Toolbar', 'https://www.neopets.com/freebies/tarlastoolbar.phtml'],
    '# Wheels',
    ['Wheel of Starlight', 'https://www.neopets.com/premium/wheel.phtml', 'icon', 0, 'starlight'],
    ['Wheel of Excitement', 'https://www.neopets.com/faerieland/wheel.phtml'],
    ['Wheel of Mediocrity', 'https://www.neopets.com/prehistoric/mediocrity.phtml'],
    ['Wheel of Misfortune', 'https://www.neopets.com/halloween/wheel/index.phtml'],
    ['Wheel of Monotony', 'https://www.neopets.com/prehistoric/monotony/monotony.phtml'],
    ['Wheel of Knowledge', 'https://www.neopets.com/medieval/knowledge.phtml'],
    ['Fruit Machine', 'https://www.neopets.com/desert/fruit/index.phtml'],
    '# Scratchcards',
    ['Space Faerie', 'https://www.neopets.com/premium/sc/', 'icon', 0, 'space faerie'],
    ['Terror Mountain Kiosk', 'https://www.neopets.com/winter/kiosk.phtml'],
    ['Deserted Fairground Kiosk', 'https://www.neopets.com/halloween/scratch.phtml'],
    ['Lost Desert Kiosk', 'https://www.neopets.com/desert/sc/kiosk.phtml'],
    '# Games & activities',
    ['Faerie Quests', 'https://www.neopets.com/quests.phtml'],
    ['Fishing', 'https://www.neopets.com/water/fishing.phtml'],
    ['Coconut Shy', 'https://www.neopets.com/halloween/coconutshy.phtml'],
    ['Cheeseroller', 'https://www.neopets.com/medieval/cheeseroller.phtml'],
    ['Rubbish Dump', 'https://www.neopets.com/medieval/rubbishdump.phtml'],
    ['Symol Hole', 'https://www.neopets.com/medieval/symolhole.phtml'],
    ['Buried Treasure', 'https://www.neopets.com/pirates/buriedtreasure/index.phtml'],
    ['Anchor Management', 'https://www.neopets.com/pirates/anchormanagement.phtml'],
    ['Meteor Crash Site', 'https://www.neopets.com/moon/meteor.phtml'],
    ['Test Your Strength', 'https://www.neopets.com/halloween/strtest/index.phtml'],
    ['Apple Bobbing', 'https://www.neopets.com/halloween/applebobbing.phtml'],
    ['Edna the Witch', 'https://www.neopets.com/halloween/witchtower.phtml'],
  ];
  const PREMIUM_EXTRA = [
    '# Labs',
    ['Lab Ray', 'https://www.neopets.com/lab.phtml'],
    ['Petpet Lab Ray', 'https://www.neopets.com/petpetlab.phtml'],
  ];
  const FOOD_CLUB = ['Food Club', 'https://www.neopets.com/pirates/foodclub.phtml'], STOCK_MARKET = ['Stock Market', 'https://www.neopets.com/stockmarket.phtml?type=portfolio'];
  const MAIN_KEY = 'npp_main_account';
  const curUser = () => String(W.appInsightsUserName || LSget('npqol_hud_username') || '').trim();
  const mainAcct = () => LSget(MAIN_KEY);
  const onMainAcct = () => { const m = mainAcct().toLowerCase(); let u = ''; try { u = String(W.appInsightsUserName || '').trim(); } catch {} return !m || u.toLowerCase() === m; };

  function nativePremium() {
    const out = [];
    const a = [...document.querySelectorAll('a[href*="membership"]')].find(x => !x.closest('#npHud, #nppFoot, #npBgSidebar') && x.closest('[id*="nav"], [class*="nav"], #header'));
    let el = a && a.parentElement;
    for (let i = 0; el && i < 6; i++, el = el.parentElement) {
      const links = [...el.querySelectorAll('a[href]')].filter(x => x.textContent.trim());
      if (links.length < 2 || links.length > 14) continue;
      const seen = new Set();
      links.forEach(x => {
        const t = x.textContent.trim().replace(/\s+/g, ' ');
        if (seen.has(x.href) || t.length > 40) return;
        seen.add(x.href);
        const im = x.querySelector('img');
        out.push([t, x.href, im && im.src]);
      });
      break;
    }
    return out;
  }

  function findLink(key) {
    const re = new RegExp(key, 'i');
    const a = [...document.querySelectorAll('a[href]')].find(x => re.test(x.textContent) && !x.closest('#npHud, #nppFoot, #npBgSidebar'));
    return a ? a.href : '';
  }

  function setupPremium() {
    const sr = shadow();
    if (!sr) return;
    const btn = [...sr.querySelectorAll('.left a.btn')].find(a => /membership/.test(a.getAttribute('href') || ''));
    if (!btn) return;
    const icon = (btn.querySelector('img') || {}).src || '';
    let menuMain = true;
    const build = () => {
      let items = nativePremium(), curated = false;
      menuMain = onMainAcct();
      if (!menuMain) { items = PREMIUM_ITEMS.slice(0, PREMIUM_ITEMS.indexOf('# Daily rewards')); curated = true; }
      else if (items.length < 4) { items = PREMIUM_ITEMS; curated = true; }
      else if (!items.some(it => /starlight/i.test(it[0]))) items = [PREMIUM_ITEMS.find(it => Array.isArray(it) && it[4] === 'starlight'), ...items];
      if (!curated) { const pos = Math.min(2, items.length); items = items.slice(0, pos).concat(PREMIUM_EXTRA, items.slice(pos), [QASALAN_ITEM, FOOD_CLUB, STOCK_MARKET]); }
      return items.map(it => it === '---' ? '<div class="menuSep"></div>'
        : typeof it === 'string' ? `<div class="menuHead">${esc(it.slice(2))}</div>`
        : `<a href="${esc(it[1])}"${/^https?:\/\/(?!(www|nc|ncmall)\.neopets\.com)/i.test(it[1]) ? ' target="_blank" rel="noopener noreferrer"' : ''}${it[3] ? ' data-ssw="1"' : ''}${it[4] ? ` data-find="${esc(it[4])}"` : ''}>${(it[2] || '') ? `<img src="${esc(it[2] === 'icon' ? icon : it[2])}" alt="">` : ''}<span>${esc(it[0])}</span></a>`).join('');
    };
    const existing = sr.getElementById('menu-premium');
    if (existing) {
      if (!existing.dataset.up && nativePremium().length >= 4) { existing.innerHTML = build(); existing.dataset.up = '1'; if (NQ.dailies) NQ.dailies.decoratePremium(existing); }
      return;
    }
    const menu = document.createElement('div');
    menu.className = 'menu'; menu.id = 'menu-premium';
    menu.innerHTML = build();
    menu.addEventListener('click', (e) => {
      if (e.altKey || e.shiftKey) return;
      const st = e.target.closest('[data-find]');
      if (st) { const h = findLink(st.dataset.find); if (h) st.href = h; return; }
      if (!e.target.closest('[data-ssw]')) return;
      for (const sel of ['#sswmenu .imgmenu', '#sswmenu img', '#sswmenu', '.navsub-ssw-icon__2020', '#ssw-tab-button']) {
        const el = $(sel);
        if (el) { e.preventDefault(); el.click(); return; }
      }
    });
    sr.appendChild(menu);
    if (NQ.dailies) NQ.dailies.decoratePremium(menu);
    { const caret = document.createElement('div'); caret.className = 'npp-premcaret'; menu.insertAdjacentElement('afterend', caret);
      const bg = document.createElement('div'); bg.className = 'npp-prembg'; menu.insertAdjacentElement('beforebegin', bg);
      const csync = () => {
        const cs = getComputedStyle(menu), open = cs.display !== 'none', vis = open && cs.getPropertyValue('--npp-menu-caret').trim() === 'block';
        caret.style.display = vis ? 'block' : 'none';
        if (vis) { caret.style.left = (menu.offsetLeft + menu.offsetWidth / 2 - 6) + 'px'; caret.style.top = (menu.offsetTop - 7) + 'px'; }
        bg.style.display = open ? 'block' : 'none';
        if (open) {
          bg.style.position = cs.position; if (cs.zIndex !== 'auto') bg.style.zIndex = cs.zIndex;
          bg.style.left = menu.offsetLeft + 'px'; bg.style.top = menu.offsetTop + 'px';
          bg.style.width = menu.offsetWidth + 'px'; bg.style.height = menu.offsetHeight + 'px';
        }
      };
      new MutationObserver(() => requestAnimationFrame(csync)).observe(menu, { attributes: true, attributeFilter: ['style', 'class'] });
      new ResizeObserver(csync).observe(menu);
      setInterval(csync, 400); }
    if (NQ.dailies) setInterval(() => NQ.dailies.updateSnow(menu, btn), 1000);
    btn.classList.add('cat'); btn.dataset.id = 'premium';

    const recenter = () => {
      if (menu.style.display !== 'block') return;
      const w = menu.getBoundingClientRect().width, r = btn.getBoundingClientRect();
      const l = Math.max(8, Math.min(Math.round(r.left + r.width / 2 - w / 2), innerWidth - w - 8));
      if (Math.abs((parseFloat(menu.style.left) || 0) - l) > .5) menu.style.left = l + 'px';
    };
    new ResizeObserver(recenter).observe(menu);
    new MutationObserver(() => requestAnimationFrame(recenter)).observe(menu, { attributes: true, attributeFilter: ['style'] });
    let closeT = null;
    const closeMenu = () => { clearTimeout(closeT); closeT = null; menu.style.display = 'none'; };
    document.addEventListener('pointermove', (e) => {
      if (menu.style.display !== 'block') return;
      const b = btn.getBoundingClientRect(), m = menu.getBoundingClientRect(), x = e.clientX, y = e.clientY;
      const inB = x >= b.left && x <= b.right && y >= b.top && y <= b.bottom + 8;
      const inM = x >= m.left && x <= m.right && y >= m.top && y <= m.bottom + 16;
      const inGap = x >= Math.min(b.left, m.left) && x <= Math.max(b.right, m.right) && y >= b.bottom && y <= m.top;
      if (inB || inM || inGap) { clearTimeout(closeT); closeT = null; }
      else if (!closeT) closeT = setTimeout(closeMenu, 200);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', closeMenu);
    window.addEventListener('blur', closeMenu);
    btn.addEventListener('pointerenter', () => {
      sr.querySelectorAll('.menu').forEach(m => { if (m !== menu) m.style.display = 'none'; });
      if (menuMain !== onMainAcct()) menu.innerHTML = build();
      if (NQ.dailies) NQ.dailies.decoratePremium(menu);
      let tall = 0;
      sr.querySelectorAll('.menu:not(#menu-premium)').forEach(m => {
        const was = m.style.display;
        if (was !== 'block') { m.style.visibility = 'hidden'; m.style.display = 'block'; }
        tall = Math.max(tall, m.getBoundingClientRect().height);
        if (was !== 'block') { m.style.display = was || 'none'; m.style.visibility = ''; }
      });
      if (tall) menu.style.maxHeight = Math.min(tall, innerHeight - 100) + 'px';
      menu.style.top = Math.round($('#npx-host').getBoundingClientRect().bottom) + 'px';
      menu.style.display = 'block';
    });
  }

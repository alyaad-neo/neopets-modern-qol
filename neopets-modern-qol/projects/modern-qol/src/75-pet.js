  const ACCTS_KEY = 'nq_accounts';
  const validName = (n) => /^[A-Za-z0-9_]{3,20}$/.test(n);
  const readAccts = () => { try { const a = JSON.parse(LSget(ACCTS_KEY) || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch { return []; } };
  const writeAccts = (a) => LSset(ACCTS_KEY, JSON.stringify(a));
  function noteAccount(name) {
    name = String(name || '').trim();
    if (!validName(name)) return false;
    const a = readAccts();
    if (a.some(x => x.toLowerCase() === name.toLowerCase())) return false;
    a.push(name); writeAccts(a); return true;
  }
  function seenAccounts() {
    const out = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('nq_acct_')) out.push(k.slice(8)); } } catch {}
    return out;
  }
  const MAN_KEY = 'nq_accounts_manual';
  const readManual = () => { try { const a = JSON.parse(LSget(MAN_KEY) || '[]'); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch { return []; } };
  const autoAccts = () => { const a = readAccts().slice(); [curUser(), ...seenAccounts()].forEach(n => { if (validName(n) && !a.some(x => x.toLowerCase() === n.toLowerCase())) a.push(n); }); return a; };
  const allAccts = () => { const a = autoAccts(); readManual().forEach(n => { if (!a.some(x => x.toLowerCase() === n.toLowerCase())) a.push(n); }); return a; };
  let petSig = null;
  function renderPetInfo() {
    const card = $('#nqActivePet');
    if (!card) return;
    let box = $('#nqPetInfo');
    if (!box) { box = document.createElement('div'); box.id = 'nqPetInfo'; card.appendChild(box); petSig = null; }
    const raw = LSget('nq_qr_data');
    if (raw === petSig) return;
    petSig = raw;
    let a = null;
    try { a = JSON.parse(raw || 'null')?.data?.active || null; } catch {}
    if (!a) { box.innerHTML = ''; return; }
    const title = `${a.name} - ${[a.colour, a.species].filter(Boolean).join(' ')}`;
    const gcls = /female/i.test(a.gender || '') ? 'gF' : 'gM';
    const shown = `<span class="nqName">${esc(a.name)}</span><span class="nqSub">${a.gender ? `<span class="nqG ${gcls}">${esc(a.gender)}</span> ` : ''}${esc([a.colour, a.species].filter(Boolean).join(' '))}</span>`;
    const ageN = parseInt(String(a.age || '').replace(/[^\d]/g, ''), 10);
    const ageUnit = /hour/i.test(a.age || '') ? 'hours' : /minute/i.test(a.age || '') ? 'minutes' : 'days';
    const ageShort = !Number.isFinite(ageN) ? a.age : (ageUnit === 'days' && ageN >= 1000) ? (() => { const k = Math.floor(ageN / 100) / 10; return (k % 1 ? k.toFixed(1) : k) + 'K days'; })() : ageN + ' ' + ageUnit;
    const chips = [a.level && ['', 'Lv ' + a.level, 'Level ' + a.level], a.age && ['', ageShort, a.age]].filter(Boolean);
    const rows = [['Health', a.health], ['Strength', a.strength], ['Defence', a.defence], ['Move', a.move], ['Intelligence', a.intelligence]].filter(r => r[1]);
    box.innerHTML = `<div class="nqTitle"><a href="https://www.neopets.com/petlookup.phtml?pet=${encodeURIComponent(a.name)}">${shown}</a><button type="button" class="nqCopy" title="Copy" data-copy="${esc(title)}">${COPY}</button></div><div class="nqLinks"><a href="https://www.neopets.com/~${encodeURIComponent(a.name)}" title="View petpage" aria-label="View petpage">${EYE}</a><a href="https://www.neopets.com/editpage.phtml?pet_name=${encodeURIComponent(a.name)}" title="Edit petpage" aria-label="Edit petpage">${PENCIL}</a>${rows.length ? `<button type="button" class="nqStatsBtn${LSget('nq_stats_open') === '1' ? ' on' : ''}" title="Stats" aria-label="Stats" aria-pressed="${LSget('nq_stats_open') === '1' ? 'true' : 'false'}">${STATS_ICON}</button>` : ''}</div><div class="nqChips">${chips.map(c => `<span class="nqChip ${c[0]}" title="${esc(c[2] || '')}">${esc(c[1])}</span>`).join('')}</div>${rows.length ? `<div class="nqStats${LSget('nq_stats_open') === '1' ? ' open' : ''}"><div class="nqStatsBody"><div class="nqDetails">${rows.map(r => `<div class="nqStat"><span>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('')}</div></div></div>` : ''}`;
  }
  const PET_IMG_STYLE = 'object-position:50% 50%!important;object-fit:cover!important;width:calc(100% + 2 * var(--pn-pad, 12px))!important;height:auto!important;aspect-ratio:1/1!important;max-width:none!important;max-height:none!important;transform:none!important;background:#fff!important;border-radius:var(--pn-r, 16px) var(--pn-r, 16px) 0 0!important;opacity:1!important;display:block!important;margin:calc(-1 * var(--pn-pad, 12px)) calc(-1 * var(--pn-pad, 12px)) 0!important;box-shadow:none!important';
  function syncPetImg() {
    if (Date.now() > petSyncUntil) return;
    const img = $('#nqActivePet > img'), el = document.getElementById('navPetMenuIcon__2020');
    if (!img || !el) return;
    const m = (getComputedStyle(el).backgroundImage || '').match(/url\(["']?([^"')]+)["']?\)/);
    if (!m) return;
    let hu = m[1]; if (hu.startsWith('//')) hu = 'https:' + hu;
    const hh = /\/cp\/([^/]+)\//.exec(hu), cur = img.currentSrc || img.src || '', ch = /\/cp\/([^/]+)\//.exec(cur);
    if (!hh) return;
    if (ch && ch[1] === hh[1]) { petSettled = true; return; }
    const sz = (/\/(\d+)\.png/.exec(cur) || [])[1] || '9';
    const big = hu.replace(/\/\d+\.png(\?.*)?$/, '/' + sz + '.png');
    img.src = big;
    try { const o = JSON.parse(LSget('nq_active_pet_img_v1') || 'null') || {}; o.url = big; LSset('nq_active_pet_img_v1', JSON.stringify(o)); } catch {}
    petSettled = true;
  }
  function fixPetImg() {
    const img = $('#nqActivePet > img');
    if (img && img.getAttribute('style') !== PET_IMG_STYLE) img.setAttribute('style', PET_IMG_STYLE);
    const card = $('#nqActivePet');
    if (!img || !card) return;
    const h = img.offsetHeight;
    if (h > 0 && card.dataset.nqImgH !== String(h)) { card.dataset.nqImgH = String(h); card.style.setProperty('--nq-img-h', h + 'px'); }
    if (petImgRO && petImgRO.el !== img) { petImgRO.ro.disconnect(); petImgRO = null; }
    if (!petImgRO && typeof ResizeObserver === 'function') { const ro = new ResizeObserver(fixPetImg); ro.observe(img); petImgRO = { ro, el: img }; }
    const src = img.currentSrc || img.src || '';
    if (src && src !== nameToneSrc) { nameToneSrc = src; pickNameTone(card, src); }
  }
  let petImgRO = null, nameToneSrc = '';
  function loadBlob(src, cb) {
    try {
      if (typeof GM_xmlhttpRequest === 'undefined') return cb(null);
      GM_xmlhttpRequest({ method: 'GET', url: src, responseType: 'blob', onload: (r) => { try { cb(r.status >= 200 && r.status < 300 && r.response ? URL.createObjectURL(r.response) : null); } catch { cb(null); } }, onerror: () => cb(null), ontimeout: () => cb(null) });
    } catch { cb(null); }
  }
  const toneCache = new Map();
  const TONE_KEY = 'nq_pet_tone_v4';
  function toneRead() { try { const o = JSON.parse(LSget(TONE_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch { return {}; } }
  function toneSave(src, dark) {
    try {
      const o = toneRead(); delete o[src]; o[src] = dark ? 'd' : 'l';
      const ks = Object.keys(o); if (ks.length > 600) ks.slice(0, ks.length - 600).forEach(k => delete o[k]);
      LSset(TONE_KEY, JSON.stringify(o));
    } catch {}
  }
  function toneProbe(src, cb) {
    let fin = false, burl = null, tm = 0;
    const done = (dark, ok) => { if (fin) return; fin = true; clearTimeout(tm); if (burl) { try { URL.revokeObjectURL(burl); } catch {} } cb(!!dark, !!ok); };
    tm = setTimeout(() => done(true, false), 10000);
    try {
      const im = new Image();
      im.onerror = () => done(true, false);
      im.onload = () => {
        try {
          const W0 = 48, cv = document.createElement('canvas'); cv.width = cv.height = W0;
          const cx = cv.getContext('2d', { willReadFrequently: true });
          cx.fillStyle = '#fff'; cx.fillRect(0, 0, W0, W0); cx.drawImage(im, 0, 0, W0, W0);
          const d = cx.getImageData(Math.round(W0 * 0.15), Math.round(W0 * 0.76), Math.round(W0 * 0.7), Math.round(W0 * 0.2)).data;
          let pale = 0, n = 0;
          for (let i = 0; i < d.length; i += 4) { if (Math.min(d[i], d[i + 1], d[i + 2]) > 215) pale++; n++; }
          done(n > 0 && pale / n >= 0.6, true);
        } catch { done(true, false); }
      };
      loadBlob(src, (u) => { if (!u) return done(true, false); burl = u; im.src = u; });
    } catch { done(true, false); }
  }
  function pickNameTone(card, src) {
    const set = (dark) => { if (nameToneSrc !== src) return; card.classList.toggle('nq-name-dark', dark); card.classList.toggle('nq-name-light', !dark); card.classList.remove('nq-tone-pending'); };
    if (toneCache.has(src)) return set(toneCache.get(src));
    const v = toneRead()[src];
    if (v === 'd' || v === 'l') { toneCache.set(src, v === 'd'); return set(v === 'd'); }
    card.classList.remove('nq-name-dark', 'nq-name-light'); card.classList.add('nq-tone-pending');
    toneProbe(src, (dark, ok) => { toneCache.set(src, dark); if (ok) toneSave(src, dark); set(dark); });
  }
  function setDock(open) {
    const wrap = $('#qrDockWrap'), dock = $('#qrDock');
    if (!wrap) return;
    dockOpen = open;
    wrap.classList.toggle('open', open);
    if (dock) dock.classList.toggle('open', open);
    document.body.classList.toggle('nqDockActive', open);
    if (open) wrap.querySelectorAll('.qrPet').forEach(el => {
      if (el.dataset.loaded === '1' || !el.dataset.bg) return;
      el.style.backgroundImage = `url(${el.dataset.bg})`; el.dataset.loaded = '1';
    });
    if (open) wrap.querySelectorAll('.qrPet').forEach(el => {
      const ov = el.querySelector('.qrOverlay'), nm = el.querySelector('.qrPetName');
      if (!ov || ov.querySelector('.nqPetPage')) return;
      const name = ((nm && nm.textContent) || '').trim();
      if (!/^\w+$/.test(name)) return;
      const a = document.createElement('a');
      a.className = 'nqPetPage'; a.href = 'https://www.neopets.com/~' + name; a.textContent = 'Pet Page';
      ov.appendChild(a);
    });
  }
  function petUI() {
    const card = $('#nqActivePet');
    if (!card || card.dataset.nq) return;
    card.dataset.nq = '1';
    const btn = document.createElement('button');
    btn.id = 'nqPetDockBtn'; btn.type = 'button'; btn.title = 'Swap Active'; btn.setAttribute('aria-label', 'Swap Active'); btn.innerHTML = SWAP + '<span>Swap Active</span>';
    card.appendChild(btn);
    renderPetInfo(); fixPetImg();
    new MutationObserver(fixPetImg).observe(card, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'src'] });
    card.addEventListener('click', (e) => {
      const sbtn = e.target.closest('.nqStatsBtn');
      if (sbtn) {
        e.stopImmediatePropagation(); e.preventDefault();
        const wrap = $('#nqPetInfo .nqStats'), open = !(wrap && wrap.classList.contains('open'));
        if (wrap) wrap.classList.toggle('open', open);
        sbtn.classList.toggle('on', open); sbtn.setAttribute('aria-pressed', open ? 'true' : 'false');
        LSset('nq_stats_open', open ? '1' : '0');
        return;
      }
      const copy = e.target.closest('.nqCopy');
      if (copy) {
        e.stopImmediatePropagation(); e.preventDefault();
        const text = copy.dataset.copy;
        const flash = (ok) => {
          clearTimeout(copy._t);
          copy.classList.remove('done', 'fail'); void copy.offsetWidth;
          copy.classList.add(ok ? 'done' : 'fail');
          copy.innerHTML = ok ? CHECK : '×';
          copy.title = ok ? 'Copied!' : 'Copy failed';
          copy._t = setTimeout(() => { copy.classList.remove('done', 'fail'); copy.innerHTML = COPY; copy.title = 'Copy'; }, 1400);
        };
        const fallback = () => {
          try {
            const t = document.createElement('textarea');
            t.value = text; t.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(t); t.select();
            const ok = document.execCommand('copy'); t.remove(); flash(ok);
          } catch { flash(false); }
        };
        try { navigator.clipboard.writeText(text).then(() => flash(true), fallback); } catch { fallback(); }
      } else if (e.target.closest('.nqTitle a, .nqLinks a')) {
        e.stopImmediatePropagation();
      } else if (e.target.closest('#nqPetDockBtn')) {
        e.stopImmediatePropagation(); e.preventDefault();
        setDock(!dockOpen);
      }
    }, true);
  }

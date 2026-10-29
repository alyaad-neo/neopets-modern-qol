  const ACTIVE_IMG_LS = 'nq_active_pet_img_v1';
  function readLastGoodPetImg(){
    try { return JSON.parse(LSget(ACTIVE_IMG_LS) || 'null'); }
    catch { return null; }
  }
  function saveLastGoodPetImg(name, url){
    if (!name || !url || !/\/cp\//.test(url)) return;
    LSset(ACTIVE_IMG_LS, JSON.stringify({ name, url }));
  }
  function _cacheRawPetImage(url){
    try {
      const cacheKey = 'nq_pp_png:' + url;
      if (LSget(cacheKey)) return;
      const probe = new Image();
      probe.crossOrigin = 'anonymous';
      probe.onload = () => {
        try {
          const cv = document.createElement('canvas');
          cv.width = probe.naturalWidth;
          cv.height = probe.naturalHeight;
          cv.getContext('2d').drawImage(probe, 0, 0);
          const out = cv.toDataURL('image/png');
          if (out.length < 800000){
            LSset(cacheKey, out);
          }
        } catch {}
      };
      probe.src = url;
    } catch {}
  }
  function _resolveActivePet(){
    try {
      const homeRaw = LSget('jb_np_homedata_v2');
      if (homeRaw){
        const home = JSON.parse(homeRaw);
        if (home && home.data && Date.now() - (home.ts||0) < 7*24*3600*1000){
          const qr = JSON.parse(LSget('nq_qr_data') || 'null');
          const name = qr?.data?.active?.name;
          if (name && home.data[name] && home.data[name].sci){
            return { name, sci: home.data[name].sci, mood: home.data[name].mood || '1' };
          }
        }
      }
    } catch {}
    try {
      const qrRaw = LSget('nq_qr_data');
      if (qrRaw){
        const qr = JSON.parse(qrRaw);
        const name = qr?.data?.active?.name;
        const pets = qr?.data?.pets || [];
        const ap   = pets.find(p => p.isActive);
        if (name && ap?.sci) return { name, sci: ap.sci, mood: '1' };
        if (name){
          const lg = readLastGoodPetImg();
          if (lg && lg.name === name){
            const m = String(lg.url || '').match(/\/cp\/([^/]+)\/(\d+)\/9\.png/);
            if (m) return { name, sci: m[1], mood: m[2] };
          }
          return { name, sci: '', mood: '1' };
        }
      }
    } catch {}
    try {
      const lg = readLastGoodPetImg();
      if (lg && lg.name){
        const m = String(lg.url || '').match(/\/cp\/([^/]+)\/(\d+)\/9\.png/);
        if (m) return { name: lg.name, sci: m[1], mood: m[2] };
      }
    } catch {}
    return { name: '', sci: '', mood: '1' };
  }
  let _earlyActivePetImg = null;
  const now = () => Date.now();
  const HUD_CSS = `
  #nqHud > *{ pointer-events:auto; }
  #nqHud *, #nqHud *::before, #nqHud *::after{ box-sizing:border-box; }

  @media (max-width: 900px){
    :root{ --nq-bar-inset-left:0px !important; }
  }

  .nqCard{
    width:100%;
    box-sizing:border-box;
    border-radius:var(--nq-radius, 14px);
    color:var(--nq-ink, #fff);
    position:relative;
    transition:background .16s ease, border-color .16s ease, transform .08s ease;
  }
  .nqCard.clickable{ cursor:pointer; user-select:none; }
  .nqCard.clickable:active{ transform:translateY(1px); }

  .nqBtn{
    display:flex; align-items:center; justify-content:center; text-align:center;
    padding:6px 8px;
    border-radius:var(--nq-radius-sm, 10px);
    background:var(--nq-btn, rgba(255,255,255,.06));
    border:1px solid var(--nq-line, rgba(255,255,255,.16));
    color:#fff; font-size:12px; font-weight:600; line-height:1.1;
    cursor:pointer;
    transition:background .12s ease, transform .08s ease;
  }
  .nqBtn:hover{ background:var(--nq-btn-hover, rgba(255,255,255,.10)); }
  .nqBtn:active{ transform:translateY(1px); }

  .nqSpin{
    width:16px;height:16px;border-radius:50%;
    border:2px solid rgba(255,255,255,.25);
    border-top-color:rgba(255,255,255,.85);
    animation:nqSpin .8s linear infinite;
  }
  @keyframes nqSpin{ to{ transform:rotate(360deg); } }

  #nqUser{
    display:flex;
    align-items:stretch;
    gap:12px;
    position:relative;
  }
  #nqUser .rightSide{
    flex:1 1 0;
    min-width:0;
    flex-direction:column; justify-content:center;
    gap:6px;
  }
  #nqUser .name{
    display:block;
    width:100%;
    text-decoration:none !important; color:#fff !important;
    font-size:14px; font-weight:700;
    cursor:pointer;
    pointer-events:auto;
    position:relative;
    z-index:1;
  }
  #nqUser .name:hover{
    text-decoration:underline !important;
    text-decoration-color:var(--nq-accent, #dcb8ff) !important;
    text-underline-offset:3px;
  }







  @font-face {
    font-family: 'CafeteriaBlack';
    src: url('https://images.neopets.com/js/fonts/cafeteria-black.otf') format('opentype');
    font-display: swap;
  }

  #qrDockWrap{
    position: fixed;
    left: 2px;
    width: calc(var(--nq-col-width, 330px) - 4px);
    bottom: 2px;
    --collapsed-h: calc(var(--nq-col-width, 330px) - 2 * var(--nq-hud-left, 20px));
    top: calc(100vh - var(--collapsed-h) - 2px);
    z-index: calc(var(--nq-z-hud, 1000) + 1);
    pointer-events: none;
    opacity: 0;
    overflow: hidden;
    transition:
      top .45s cubic-bezier(.22, 1, .36, 1),
      opacity .28s ease;
  }
  #qrDock{
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    margin: 0; padding: 0; gap: 0;
    list-style: none;
    background: rgba(20, 14, 32, 0.95);
    -webkit-backdrop-filter: blur(var(--nq-blur, 8px));
    backdrop-filter: blur(var(--nq-blur, 8px));
    overflow: hidden;
  }
  .qrPet{
    width: 100%;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    background: rgba(0,0,0,.5) no-repeat center / cover;
    min-height: 0;
    flex-grow: 0;
    flex-shrink: 1;
    flex-basis: 0;
    opacity: 0;
    transition:
      flex-grow .45s cubic-bezier(.22, 1, .36, 1),
      opacity .3s ease;
  }
  .qrPet.active{
    flex-grow: 1;
    opacity: 1;
    box-shadow: inset 0 0 0 2px var(--nq-accent, #dcb8ff);
  }
  #qrDockWrap.open .qrPet{
    flex-grow: 1;
    opacity: 1;
  }
  .qrPet + .qrPet{ border-top: 2px solid #000; }
  .qrPet:hover{ filter: brightness(1.10); }
  .qrOverlay{
    position:absolute; inset:0;
    padding: 8px;
    display:flex; flex-direction:column; gap:6px;
    justify-content: center;
    background: rgba(0,0,0,.42);
    opacity:0; pointer-events:none;
    transition: opacity .14s linear;
  }
  .qrPet:hover .qrOverlay{ opacity:1; pointer-events:auto; }
  .qrOverlay a{
    min-height:32px; display:flex; align-items:center; justify-content:center; text-align:center;
    padding:6px 8px; border-radius:var(--nq-radius-sm, 10px);
    text-decoration:none !important; color:#fff !important;
    font-size:12px; font-weight:700; line-height:1.1;
    background:var(--nq-btn, rgba(255,255,255,.06));
    border:1px solid var(--nq-line, rgba(255,255,255,.16));
    transition:background .12s ease, transform .08s ease;
  }
  .qrOverlay a:hover{ background:var(--nq-btn-hover, rgba(255,255,255,.10)); }
  .qrOverlay a:active{ transform:translateY(1px); }
  .qrPetName{
    font-family: 'CafeteriaBlack', var(--nq-font, system-ui), sans-serif;
    font-size: 20px; font-weight: 400; color: #fff;
    text-align: center; padding: 0 4px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    letter-spacing: .02em;
    text-shadow: 0 1px 2px rgba(0,0,0,.7);
  }

  body.nqDockActive #nqUser,
  body.nqDockActive #nqNp,
  body.nqDockActive #nqActivePet{
    opacity: 0;
    pointer-events: none;
    transition: opacity .25s ease;
  }


  #nqNp{ display:flex; justify-content:center; gap:8px; font-size:14px; font-weight:700; }
  #nqNp .nqVal{ font-variant-numeric:tabular-nums; }
  #nqNp img{ width:24px; height:24px; display:block; flex:0 0 24px; }
  #nqNp.dim{ opacity:.6; }

  #nqActivePet{
    cursor:pointer;
    justify-content:center;
  }
  #nqActivePet img{
    width:auto; height:auto;
    max-width:100%; max-height:100%;
    transform: scale(0.8);
    transform-origin: center center;
    display:block;
    opacity:0; transition:opacity .18s ease;
  }
  #nqActivePet img.loaded{ opacity:1; }

  @media (hover: none){
    .qrOverlay{
      opacity:1;
      pointer-events:auto;
      background:rgba(0,0,0,.30);
    }
  }
  #nqHud > #nqUser,
  #nqHud > #nqNp{
    flex: 0 0 auto;
  }
  `;

function startHud() {
  if (document.getElementById('nqHud')) return;

  try {
    const qr = JSON.parse(LSget('nq_qr_data') || 'null');
    if (qr?.data?.pets?.length && !qr.data.pets.some(p => p.sci)){
      LSdel('nq_qr_data_lastFetch');
    }
  } catch {}

  (function preloadActivePet(){
    try {
      const { name, sci, mood } = _resolveActivePet();
      if (!name) return;
      const url = sci
        ? `https://pets.neopets.com/cp/${sci}/${mood}/9.png`
        : `https://pets.neopets.com/cpn/${encodeURIComponent(name)}/1/4.png`;
      if (sci) saveLastGoodPetImg(name, url);
      const cacheKey = 'nq_pp_png:' + url;

      const cached = LSget(cacheKey);
      const initialSrc = cached || url;

      const img = document.createElement('img');
      img.alt = '';
      img.decoding = 'async';
      try { img.fetchPriority = 'high'; } catch {}
      img.addEventListener('load', () => img.classList.add('loaded'));
      img.addEventListener('error', () => img.classList.remove('loaded'));
      img.dataset.forName = name;
      img.dataset.cpnUrl = url;
      img.src = initialSrc;
      if (img.complete && img.naturalWidth > 0) img.classList.add('loaded');
      _earlyActivePetImg = img;

      if (!cached){
        setTimeout(() => _cacheRawPetImage(url), 1200);
      }

      const link = document.createElement('link');
      link.rel = 'preload'; link.as = 'image'; link.href = url; link.crossOrigin = 'anonymous';
      (document.head || document.documentElement).appendChild(link);

      const qrSnap = JSON.parse(LSget('nq_qr_data') || 'null');
      const a = qrSnap?.data?.active || {};
      [a.petpet, a.petpetpet].filter(Boolean).forEach(src => {
        const l = document.createElement('link');
        l.rel = 'preload'; l.as = 'image'; l.href = src; l.crossOrigin = 'anonymous';
        (document.head || document.documentElement).appendChild(l);
      });
    } catch {}
  })();

  const styleEl = document.createElement('style');
  styleEl.id = 'nqHudStyle';
  styleEl.textContent = HUD_CSS;
  (document.head || document.documentElement).prepend(styleEl);

  const hud = document.createElement('div');
  hud.id = 'nqHud';

  const cardUser = document.createElement('div');
  cardUser.className = 'nqCard clickable';
  cardUser.id = 'nqUser';
  cardUser.innerHTML = `
    <div class="rightSide">
      <a class="name" id="nqUserLink" href="https://www.neopets.com/userlookup.phtml" target="_self" rel="noopener"><span id="nqUserTitle">—</span></a>
    </div>
  `;

  const cardNp = document.createElement('div');
  cardNp.className = 'nqCard clickable';
  cardNp.id = 'nqNp';
  cardNp.title = 'Bank (Alt+click = refresh NP)';
  cardNp.innerHTML = `NP: <span class="nqVal">…</span> <img src="https://images.neopets.com/themes/h5/basic/images/np-icon.svg" alt="">`;

  const cardActivePet = document.createElement('div');
  cardActivePet.className = 'nqCard clickable';
  cardActivePet.id = 'nqActivePet';
  cardActivePet.title = 'Hover to switch active pet · click for Quick Reference';

  if (_earlyActivePetImg){
    cardActivePet.appendChild(_earlyActivePetImg);
  }

  hud.append(cardUser, cardNp, cardActivePet);

  const dockWrap = document.createElement('div');
  dockWrap.id = 'qrDockWrap';
  const dock = document.createElement('div');
  dock.id = 'qrDock';
  dockWrap.appendChild(dock);

  function mountAll() {
    if (!document.body) return false;
    if (!hud.isConnected) document.body.appendChild(hud);
    if (!dockWrap.isConnected) document.documentElement.appendChild(dockWrap);
    return true;
  }
  if (!mountAll()) {
    new MutationObserver((_, o) => { if (mountAll()) o.disconnect(); }).observe(document.documentElement, { childList: true, subtree: true });
  }

  (function userModule(){
    const USERNAME_KEY = 'nq_hud_username';
    const st = { username:null };

    const titleEl = () => cardUser.querySelector('#nqUserTitle');
    const linkEl = () => cardUser.querySelector('#nqUserLink');

    function pickFromPage(){
      try { const u = (PW.appInsightsUserName || '').trim(); if (u) return u; } catch {}
      return null;
    }
    function applyUsername(u){
      st.username = u; LSset(USERNAME_KEY, u);
      const l = linkEl(), t = titleEl();
      if (l) l.href = `https://www.neopets.com/userlookup.phtml?user=${encodeURIComponent(u)}`;
      if (t) t.textContent = u;
    }
    function ensureUsername(){
      if (st.username) return st.username;
      const p = pickFromPage(); if (p){ applyUsername(p); return st.username; }
      const c = LSget(USERNAME_KEY).trim(); if (c){ applyUsername(c); return st.username; }
      return null;
    }
    function waitForGlobal(maxMs=6000, step=200){
      const start = now();
      const tick = () => {
        let u=''; try { u=(PW.appInsightsUserName||'').trim(); } catch {}
        if (u){ if (u !== st.username) applyUsername(u); return; }
        if (now()-start < maxMs) setTimeout(tick, step);
      };
      tick();
    }
    cardUser.addEventListener('click', (e) => {
      if (e.target?.closest?.('#nqUserLink, button, a, input, select')) return;
      const href = userLinkUrl();
      if (href) window.location.assign(href);
    });
    function userLinkUrl(){
      const a = cardUser.querySelector('#nqUserLink');
      return a ? (a.getAttribute('href') || '') : '';
    }
    document.addEventListener('click', (e) => {
      const a = e.target?.closest?.('#nqUserLink');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href) return;
      e.preventDefault(); e.stopPropagation();
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) window.open(href, '_blank', 'noopener');
      else window.location.assign(href);
    }, true);
    document.addEventListener('auxclick', (e) => {
      if (e.button !== 1) return;
      const a = e.target?.closest?.('#nqUserLink');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href) return;
      e.preventDefault(); e.stopPropagation();
      window.open(href, '_blank', 'noopener');
    }, true);
    document.addEventListener('contextmenu', (e) => {
      const a = e.target?.closest?.('#nqUserLink');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href) return;
      e.preventDefault(); e.stopPropagation();
      window.open(href, '_blank', 'noopener');
    }, true);
    ensureUsername(); waitForGlobal();
  })();

  (function qrModule(){
    const FETCH_URL = 'https://www.neopets.com/quickref.phtml';
    const COOLDOWN = 5 * 60 * 1000, PETS_MAX = 20;
    const LS_DATA = 'nq_qr_data';
    const BLOCK_RE = /(customi[sz]e|view abilities|equip)/i;
    const state = { data:null, loading:false, closeT:0, wantOpen:false, imagesLoaded:false };
    const cpn = (n) => `https://pets.neopets.com/cpn/${encodeURIComponent(n)}/1/4.png`;

    const readCache = () => { try { const s = LSget(LS_DATA); return s ? JSON.parse(s) : null; } catch { return null; } };
    const qrListeners = [];
    NQ.onQrData = (fn) => { qrListeners.push(fn); };
    const writeCache = (data) => { LSset(LS_DATA, JSON.stringify({ ts:now(), data })); qrListeners.forEach(fn => { try { fn(); } catch {} }); };
    const readLast = () => { try { return ((LSget(LS_DATA+'_lastFetch')||0)|0); } catch { return 0; } };
    const writeLast = () => { LSset(LS_DATA+'_lastFetch', String(now())); };

    function parse(html){
      const dom = new DOMParser().parseFromString(html, 'text/html');
      const pets = [...dom.querySelectorAll('#nav td.active_pet, #nav td.inactive_pet')].slice(0, PETS_MAX).map(td => {
        const img = td.querySelector('img[id$="_thumb"]');
        const name = img?.getAttribute('title') || img?.alt || 'Pet';
        const thumbSrc = img?.getAttribute('src') || '';
        const sciMatch = thumbSrc.match(/\/cp\/([^/]+)\//);
        const sci = sciMatch ? sciMatch[1] : '';
        const idBase = td.querySelector('.pet_menu_launcher')?.id?.replace('_menu_launcher','');
        const ul = idBase ? dom.querySelector(`#${CSS.escape(idBase)}_menu`) : null;
        const actions = ul ? [...ul.querySelectorAll('a')].map(a => { const href = a.getAttribute('href')||''; const abs = href.startsWith('http') ? href : new URL(href,'https://www.neopets.com/').href; return { href:abs, text:(a.textContent||'').replace(/»\s*/,'').trim() }; }) : [];
        return { name, sci, actions, isActive: td.classList.contains('active_pet') };
      });
      const ai = pets.findIndex(p => p.isActive); if (ai > 0) pets.unshift(pets.splice(ai,1)[0]);
      const activeDiv = [...dom.querySelectorAll('div[id$="_details"]')].find(d => (d.getAttribute('style')||'').includes('display: block')) || dom.querySelector('div[id$="_details"]');
      let a = null;
      if (activeDiv){
        const headerTh = activeDiv.querySelector('th[class^="contentModuleHeader"]');
        const name = headerTh?.querySelector('a')?.textContent?.trim() || 'Active';
        const kv = {};
        activeDiv.querySelectorAll('.pet_stats tr').forEach(tr => { const th = tr.querySelector('th'), td = tr.querySelector('td'); if (!th||!td) return; kv[(th.textContent||'').replace(':','').trim().toLowerCase()] = (td.textContent||'').trim(); });
        a = {
          name,
          species:      kv['species']      || '',
          colour:       kv['colour']       || '',
          gender:       kv['gender']       || '',
          age:          kv['age']          || '',
          level:        kv['level']        || '',
          health:       kv['health']       || '',
          mood:         kv['mood']         || '',
          strength:     kv['strength']     || '',
          defence:      kv['defence']      || '',
          move:         kv['move']         || '',
          intelligence: kv['intelligence'] || '',
        };
        const pp = [...activeDiv.querySelectorAll('a[href*="neopetpet.phtml"] img')].map(im => im.getAttribute('src') || '').filter(Boolean);
        a.petpet = pp[0] || ''; a.petpetpet = pp[1] || '';
      }
      return { pets, active:a };
    }
    function removeWhiteBg(id){
      const d = id.data, w = id.width, h = id.height;
      const BG_MIN = 216, BG_CHROMA = 44;
      const isBg = (i) => { const r=d[i],g=d[i+1],b=d[i+2], mn=Math.min(r,g,b), mx=Math.max(r,g,b); return d[i+3] > 0 && mn >= BG_MIN && (mx - mn) <= BG_CHROMA; };

      const seen = new Uint8Array(w*h), st = [];
      const push = (x,y) => { if (x>=0 && y>=0 && x<w && y<h){ const p=y*w+x; if (!seen[p]) st.push(p); } };
      for (let x=0;x<w;x++){ push(x,0); push(x,h-1); }
      for (let y=0;y<h;y++){ push(0,y); push(w-1,y); }
      while (st.length){
        const p = st.pop(); if (seen[p]) continue; seen[p] = 1;
        const i = p*4;
        if (d[i+3] !== 0 && !isBg(i)) continue;
        if (isBg(i)) d[i+3] = 0;
        const x = p % w, y = (p / w)|0;
        push(x+1,y); push(x-1,y); push(x,y+1); push(x,y-1);
      }

      const DARK = 110;
      const DARK_FRAC = 0.55;
      const seen2 = new Uint8Array(w*h);
      for (let p0=0;p0<w*h;p0++){
        if (seen2[p0]) continue;
        const i0 = p0*4;
        if (d[i0+3] === 0 || !isBg(i0)) continue;
        const region = [], q = [p0]; seen2[p0] = 1;
        let borderTotal = 0, borderDark = 0;
        while (q.length){
          const p = q.pop(); region.push(p);
          const x = p % w, y = (p / w)|0;
          const visit = (np) => {
            if (np<0 || np>=w*h || seen2[np]) return;
            const ni = np*4;
            if (d[ni+3] === 0) return;
            if (isBg(ni)){ seen2[np]=1; q.push(np); }
            else { seen2[np]=1; borderTotal++; if (Math.max(d[ni],d[ni+1],d[ni+2]) < DARK) borderDark++; }
          };
          if (x>0) visit(p-1); if (x<w-1) visit(p+1); if (y>0) visit(p-w); if (y<h-1) visit(p+w);
        }
        if (borderTotal > 0 && (borderDark / borderTotal) >= DARK_FRAC)
          for (const p of region) d[p*4+3] = 0;
      }

      const a0 = new Uint8ClampedArray(w*h);
      for (let p=0;p<w*h;p++) a0[p] = d[p*4+3];
      const LO = 120, HI = 238;
      const transN = (p,x,y) =>
        (x>0 && a0[p-1]===0) || (x<w-1 && a0[p+1]===0) ||
        (y>0 && a0[p-w]===0) || (y<h-1 && a0[p+w]===0) ||
        (x>0 && y>0 && a0[p-w-1]===0) || (x<w-1 && y>0 && a0[p-w+1]===0) ||
        (x>0 && y<h-1 && a0[p+w-1]===0) || (x<w-1 && y<h-1 && a0[p+w+1]===0);
      for (let y=0;y<h;y++){
        for (let x=0;x<w;x++){
          const p = y*w+x; if (a0[p] === 0) continue;
          if (!transN(p,x,y)) continue;
          const i = p*4, L = Math.min(d[i], d[i+1], d[i+2]);
          if (L >= HI) d[i+3] = 0;
          else if (L > LO) d[i+3] = Math.round(d[i+3] * (HI - L) / (HI - LO));
        }
      }
    }

    function addWhiteOutline(id, ss){
      const d = id.data, w = id.width, h = id.height, OPAQUE = 128;
      const RAMP = (ss === 2)
        ? [0, 255, 255, 230, 190, 140, 90, 45, 15]
        : [0, 255, 130, 45];
      const MAXD = RAMP.length - 1;
      const A = new Uint8Array(w*h);
      for (let p=0;p<w*h;p++) A[p] = d[p*4+3] >= OPAQUE ? 1 : 0;

      const ext = new Uint8Array(w*h), q = [];
      const seed = (x,y) => { const p=y*w+x; if (!A[p] && !ext[p]){ ext[p]=1; q.push(p); } };
      for (let x=0;x<w;x++){ seed(x,0); seed(x,h-1); }
      for (let y=0;y<h;y++){ seed(0,y); seed(w-1,y); }
      let head = 0;
      while (head < q.length){
        const p = q[head++], x = p % w, y = (p / w)|0;
        if (x>0 && !A[p-1] && !ext[p-1]){ ext[p-1]=1; q.push(p-1); }
        if (x<w-1 && !A[p+1] && !ext[p+1]){ ext[p+1]=1; q.push(p+1); }
        if (y>0 && !A[p-w] && !ext[p-w]){ ext[p-w]=1; q.push(p-w); }
        if (y<h-1 && !A[p+w] && !ext[p+w]){ ext[p+w]=1; q.push(p+w); }
      }

      const dist = new Int16Array(w*h), q2 = [];
      const near8 = (x,y) => {
        for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++){
          if (!dx && !dy) continue;
          const nx=x+dx, ny=y+dy;
          if (nx>=0 && ny>=0 && nx<w && ny<h && A[ny*w+nx]) return true;
        }
        return false;
      };
      for (let p=0;p<w*h;p++){ if (ext[p] && near8(p % w, (p / w)|0)){ dist[p]=1; q2.push(p); } }
      head = 0;
      while (head < q2.length){
        const p = q2[head++], dp = dist[p]; if (dp >= MAXD) continue;
        const x = p % w, y = (p / w)|0;
        for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++){
          if (!dx && !dy) continue;
          const nx=x+dx, ny=y+dy; if (nx<0||ny<0||nx>=w||ny>=h) continue;
          const np = ny*w+nx;
          if (ext[np] && dist[np]===0){ dist[np]=dp+1; q2.push(np); }
        }
      }
      for (let p=0;p<w*h;p++){
        const dp = dist[p]; if (dp <= 0) continue;
        const i = p*4; d[i]=255; d[i+1]=255; d[i+2]=255; d[i+3]=RAMP[dp];
      }
    }

    const PP_VER_KEY = 'nq_pp_ver';
    try {
      if (LSget(PP_VER_KEY) !== '2'){
        const kill = [];
        for (let i = 0; i < localStorage.length; i++){
          const k = localStorage.key(i);
          if (k && k.startsWith('nq_pp_png')) kill.push(k);
        }
        kill.forEach(k => { LSdel(k); });
        LSset(PP_VER_KEY, '2');
      }
    } catch {}

    const PP_INDEX_KEY = 'nq_pp_png_index';
    const PP_MAX = 30;
    function ppIndexRead(){
      try { const r = LSget(PP_INDEX_KEY); return r ? (JSON.parse(r) || []) : []; }
      catch { return []; }
    }
    function ppIndexWrite(arr){
      LSset(PP_INDEX_KEY, JSON.stringify(arr.slice(-PP_MAX*2)));
    }
    function ppCachePut(key, dataUrl){
      try { localStorage.setItem(key, dataUrl); } catch { return; }
      const idx = ppIndexRead().filter(k => k !== key);
      idx.push(key);
      while (idx.length > PP_MAX){
        const old = idx.shift();
        LSdel(old);
      }
      ppIndexWrite(idx);
    }

    function cleanImg(url, imgEl){
      if (!url || !imgEl) return;
      const KEY = 'nq_pp_png:' + url;
      let cached = null; try { cached = LSget(KEY); } catch {}
      if (cached){ imgEl.src = cached; return; }
      const probe = new Image();
      probe.crossOrigin = 'anonymous';
      probe.onload = () => {
        try {
          const PAD = 4;
          const w = probe.naturalWidth, h = probe.naturalHeight;
          const SS = (w * h <= 60000) ? 2 : 1;
          const cw = (w + PAD*2) * SS, ch = (h + PAD*2) * SS;
          const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
          const cx = cv.getContext('2d');
          cx.imageSmoothingEnabled = true;
          cx.imageSmoothingQuality = 'high';
          cx.drawImage(probe, PAD*SS, PAD*SS, w*SS, h*SS);
          const id = cx.getImageData(0, 0, cw, ch);
          removeWhiteBg(id);
          addWhiteOutline(id, SS);
          cx.putImageData(id, 0, 0);
          const out = cv.toDataURL('image/png');
          ppCachePut(KEY, out);
          imgEl.src = out;
        } catch { imgEl.src = url; }
      };
      probe.onerror = () => { imgEl.src = url; };
      probe.src = url;
    }
    try { NQ.cleanImg = cleanImg; } catch {}

    function renderDock(data){
      const TXT_RE = /(make\s*active|set\s*(?:as\s*)?active|make\s*this\s*pet\s*active|set\s*active)/i;
      const URL_RE = /(process_changetpet|new_active_pet=|setactive|makeactive|active_pet)/i;
      const pets = (data.pets || []).slice(0, PETS_MAX);
      const inactive = pets.filter(p => !p.isActive);
      const active   = pets.find(p => p.isActive);
      const ordered = active ? [...inactive, active] : inactive;
      dock.innerHTML = '';
      if (!ordered.length) return;
      for (const p of ordered){
        const el = document.createElement('div');
        el.className = 'qrPet' + (p.isActive ? ' active' : '');
        el.title = p.name || '';
        el.dataset.bg = cpn(p.name);
        el.dataset.name = p.name || '';

        const overlay = document.createElement('div');
        overlay.className = 'qrOverlay';
        const nameEl = document.createElement('div');
        nameEl.className = 'qrPetName';
        nameEl.textContent = p.name || '';
        overlay.appendChild(nameEl);

        if (p.isActive){
          const link = document.createElement('a');
          link.href = 'https://www.neopets.com/quickref.phtml';
          link.textContent = 'Quick Ref';
          link.target = '_self';
          overlay.appendChild(link);
        } else {
          const make = (p.actions||[])
            .filter(a => !BLOCK_RE.test(a.text||''))
            .find(a => TXT_RE.test(a.text||'') || URL_RE.test(a.href||''));
          if (make?.href){
            const link = document.createElement('a');
            link.href = make.href;
            link.textContent = 'Make Active';
            link.target = '_self';
            link.rel = 'nofollow';
            overlay.appendChild(link);
          }
        }

        el.appendChild(overlay);
        dock.appendChild(el);
      }
    }
    function petImgUrl(name, sci){
      if (!name) return '';
      let mood = '1';
      if (!sci){
        try {
          const homeRaw = LSget('jb_np_homedata_v2');
          if (homeRaw){
            const home = JSON.parse(homeRaw);
            const entry = home && home.data && home.data[name];
            if (entry && entry.sci){
              sci = entry.sci;
              if (entry.mood) mood = String(entry.mood);
            }
          }
        } catch {}
      }
      if (sci){
        const url = `https://pets.neopets.com/cp/${sci}/${mood}/9.png`;
        saveLastGoodPetImg(name, url);
        return url;
      }
      try {
        const lg = readLastGoodPetImg();
        if (lg && lg.name === name && /\/cp\//.test(lg.url)) return lg.url;
      } catch {}
      return `https://pets.neopets.com/cpn/${encodeURIComponent(name)}/1/4.png`;
    }

    function renderActivePetImage(name, sci){
      if (!name) return;
      const url = petImgUrl(name, sci);
      let img = cardActivePet.querySelector('img');

      if (!img && _earlyActivePetImg
          && _earlyActivePetImg.dataset.forName === name
          && _earlyActivePetImg.dataset.cpnUrl === url){
        img = _earlyActivePetImg;
        _earlyActivePetImg = null;
        cardActivePet.prepend(img);
        return;
      }

      if (!img){
        img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        try { img.fetchPriority = 'high'; } catch {}
        img.addEventListener('load', () => img.classList.add('loaded'));
        img.addEventListener('error', () => img.classList.remove('loaded'));
        cardActivePet.prepend(img);
      }
      if (img.dataset.forName === name && img.dataset.cpnUrl === url && img.src){
        return;
      }
      img.dataset.forName = name;
      img.dataset.cpnUrl = url;

      img.classList.remove('loaded');
      img.src = url;

      setTimeout(() => _cacheRawPetImage(url), 1200);
    }

    function applyData(data){
      if (!data) return;
      state.data = data;
      if (data.active){
        const activePet = (data.pets || []).find(p => p.isActive);
        renderActivePetImage(data.active.name, activePet?.sci || '');
      }
      if (data.pets?.length) renderDock(data);
    }

    function loadImagesNow(){
      if (state.imagesLoaded) return; state.imagesLoaded = true;
      dock.querySelectorAll('.qrPet').forEach(el => {
        if (el.dataset.loaded === '1') return;
        const bg = el.dataset.bg;
        if (!bg) return;
        el.style.backgroundImage = `url(${bg})`;
        el.dataset.loaded = '1';
      });
    }
    async function fetchQr(){
      if (backoff403Active()) throw new Error('qr 403 backoff');
      const r = await fetch(FETCH_URL, { credentials:'include', cache:'no-store', headers:{ 'Cache-Control':'no-cache, no-store, must-revalidate', 'Pragma':'no-cache', 'Expires':'0' } });
      note403(r);
      const data = parse(await r.text());
      if ((data.pets && data.pets.length) || data.active){ writeCache(data); writeLast(); return data; }
      throw new Error('QuickRef parse failed');
    }
    async function refresh({ force=false } = {}){
      if (state.loading) return;
      if (!force && now() - readLast() < COOLDOWN) return;
      state.loading = true;
      try { const data = await fetchQr(); state.imagesLoaded = false; applyData(data); } catch {} finally { state.loading = false; }
    }
    function setOpen(on){
      dock.classList.toggle('open', !!on);
      dockWrap.classList.toggle('open', !!on);
      try { document.body.classList.toggle('nqDockActive', !!on); } catch {}
    }
    function wantOpen(on){
      state.wantOpen = !!on; clearTimeout(state.closeT);
      if (on){ setOpen(true); loadImagesNow(); return; }
      state.closeT = setTimeout(() => { if (!state.wantOpen && !dock.matches(':hover')) setOpen(false); }, 110);
    }
    cardActivePet.addEventListener('mouseenter', () => wantOpen(true));
    cardActivePet.addEventListener('mouseleave', () => wantOpen(false));
    dock.addEventListener('mouseenter', () => wantOpen(true));
    dock.addEventListener('mouseleave', () => wantOpen(false));
    const QR_URL = 'https://www.neopets.com/quickref.phtml';
    function navQuickRef(e){
      if (e.altKey){ refresh({ force: true }); return; }
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1){
        window.open(QR_URL, '_blank', 'noopener');
      } else {
        window.location.href = QR_URL;
      }
    }
    function navQuickRefMiddle(e){
      if (e.button !== 1) return;
      e.preventDefault();
      window.open(QR_URL, '_blank', 'noopener');
    }
    function navQuickRefMenu(e){
      e.preventDefault();
      window.open(QR_URL, '_blank', 'noopener');
    }
    cardActivePet.addEventListener('click', navQuickRef);
    cardActivePet.addEventListener('auxclick', navQuickRefMiddle);
    cardActivePet.addEventListener('contextmenu', navQuickRefMenu);

    const snap = readCache(); if (snap?.data){ try { applyData(snap.data); } catch {} }
    whenBgAllowed(() => refresh({ force: false }));
    window.addEventListener('pageshow', (e) => {
      if (!e.persisted) return;
      state.imagesLoaded = false;
      const s = readCache(); if (s?.data) applyData(s.data);
      whenBgAllowed(() => refresh({ force: false }));
    });
  })();

  (function npModule(){
    const LS_KEY = 'nq_np_last';
    const SELECTORS = ['#npanchor', '.navsub-np-meter__2020 #npanchor', '.navsub-np-meter__2020 .np-text__2020', 'span.np-text__2020'];
    const st = { last:null, anchor:null, watch:null, obs:null, fastTimer:0, fastUntil:0, lastManual:0 };
    const valEl = () => cardNp.querySelector('.nqVal');
    const clean = (t) => (t||'').replace(/\s+/g,' ').trim();
    function setText(val, fromCache=false){
      const v = clean(val); if (!v || v === st.last) return;
      st.last = v; const el = valEl(); if (el) el.textContent = v;
      if (!fromCache) LSset(LS_KEY, v);
    }
    const findAnchor = () => { for (const s of SELECTORS){ const el = $(s); if (el) return el; } return null; };
    const readNP = () => { const a = findAnchor(); return a ? clean(a.textContent) : ''; };
    const refresh = () => { const v = readNP(); if (v) setText(v, false); return !!v; };
    function bindWatcher(){
      const a = findAnchor(); if (!a) return;
      const watch = a.closest('.navsub-np-meter__2020') || a.parentElement || a;
      if (st.anchor === a && st.watch === watch && st.obs) return;
      st.anchor = a; st.watch = watch;
      try { st.obs?.disconnect(); } catch {}
      st.obs = new MutationObserver(() => refresh());
      st.obs.observe(watch, { childList:true, subtree:true, characterData:true });
      refresh();
      try { st.docObs?.disconnect(); st.docObs = null; } catch {}
    }
    function startFast(ms=4500){
      const until = now()+ms; if (until > st.fastUntil) st.fastUntil = until;
      if (st.fastTimer) return;
      st.fastTimer = window.setInterval(() => { bindWatcher(); refresh(); if (now() > st.fastUntil){ clearInterval(st.fastTimer); st.fastTimer = 0; } }, 80);
    }
    if (!findAnchor()){
      st.docObs = new MutationObserver((muts) => {
        for (const m of muts){
          if (m.type === 'childList' && [...m.addedNodes].some(n => n.nodeType === 1)){
            bindWatcher();
            if (!st.docObs) return;
            break;
          }
        }
      });
      st.docObs.observe(document.documentElement, { childList:true, subtree:true });
    }
    const fire = () => startFast(4500);
    window.addEventListener('focus', fire, true);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) fire(); }, true);
    const _hist = PW.history;
    const _push = _hist.pushState, _rep = _hist.replaceState;
    _hist.pushState = function(){ const r = _push.apply(this, arguments); fire(); return r; };
    _hist.replaceState = function(){ const r = _rep.apply(this, arguments); fire(); return r; };
    window.addEventListener('popstate', fire, true);
    const BANK_URL = 'https://www.neopets.com/bank.phtml';
    cardNp.addEventListener('click', (e) => {
      if (e.altKey){ e.preventDefault(); const t = now(); if (t - st.lastManual < 350) return; st.lastManual = t; cardNp.classList.add('dim'); refresh(); cardNp.classList.remove('dim'); return; }
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1){ window.open(BANK_URL, '_blank', 'noopener'); return; }
      window.location.href = BANK_URL;
    });
    cardNp.addEventListener('auxclick', (e) => {
      if (e.button !== 1) return;
      e.preventDefault();
      window.open(BANK_URL, '_blank', 'noopener');
    });
    cardNp.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      window.open(BANK_URL, '_blank', 'noopener');
    });
    const cached = LSget(LS_KEY); if (cached) setText(cached, true);
    startFast(6000);
    window.setInterval(bindWatcher, 8000);
  })();

  (function colsModule(){
    if (document.getElementById('btnOverlay')) return;

    const SHARED = NQ.btnThemesData;
    const BTN_THEMES = SHARED.BTN_THEMES || [];
    const FALLBACK_PATTERN = SHARED.FALLBACK_PATTERN || 'https://images.neopets.com/themes/h5/basic/images/v3/{icon}-icon.svg';
    const LS_BTN_THEME = SHARED.LS_KEY || 'nq_btn_theme_v1';
    const DEFAULT_THEME = SHARED.DEFAULT || 'constellations';

    const getTheme = () => {
      try { return LSget(LS_BTN_THEME) || DEFAULT_THEME; }
      catch { return DEFAULT_THEME; }
    };
    const themeById = (id) => BTN_THEMES.find(t => t.id === id) || BTN_THEMES.find(t => t.id === DEFAULT_THEME) || BTN_THEMES[0];
    const iconUrl = (iconName, themeId) => {
      const t = themeById(themeId);
      return t ? t.pattern.replace('{icon}', iconName) : fallbackUrl(iconName);
    };
    const fallbackUrl = (iconName) => FALLBACK_PATTERN.replace('{icon}', iconName);

    const attachIconFallback = NQ.attachBtnFallback;

    function applyBtnTheme(themeId){
      const overlay = document.getElementById('btnOverlay');
      if (!overlay) return;
      overlay.querySelectorAll('img[data-icon]').forEach(img => {
        const name = img.dataset.icon || '';
        if (!name) return;
        img.dataset.fbDone = '';
        attachIconFallback(img, name);
        img.src = iconUrl(name, themeId);
      });
    }

    NQ.onBtnTheme((id) => {
      if (id) applyBtnTheme(id);
    });

    const reapplyBrokenIcons = () => {
      try {
        const overlay = document.getElementById('btnOverlay');
        if (!overlay) return;
        const tid = getTheme();
        overlay.querySelectorAll('img[data-icon]').forEach(img => {
          if (img.complete && img.naturalWidth > 0) return;
          const name = img.dataset.icon || '';
          if (!name) return;
          attachIconFallback(img, name);
          const url = iconUrl(name, tid);
          img.src = '';
          img.src = url;
        });
      } catch {}
    };
    window.addEventListener('pageshow', reapplyBrokenIcons);
    window.addEventListener('load',     reapplyBrokenIcons);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reapplyBrokenIcons();
    });

    const ICON_CATALOG = [
      { id:'profile',        label:'My Profile',         link:'https://www.neopets.com/settings/profile/' },
      { id:'neopass',        label:'My NeoPass',         link:'https://account.neopets.com/' },
      { id:'petcentral',     icon:'mypets',         label:'My Pets',            link:'https://www.neopets.com/home/index.phtml' },
      { id:'customise',      label:'Customise',          link:'https://www.neopets.com/customise/' },
      { id:'stylingchamber', icon:'chamber',        label:'Styling Chamber',    link:'https://www.neopets.com/stylingchamber/' },
      { id:'createpet',      label:'Create a Pet',       link:'https://www.neopets.com/reg/page4.phtml' },
      { id:'adopt',          icon:'adoptpet',       label:'Adopt a Pet',        link:'https://www.neopets.com/pound/' },
      { id:'inventory',      label:'Inventory',          link:'https://www.neopets.com/inventory.phtml' },
      { id:'sdb',            icon:'safetydeposit',  label:'Safety Deposit Box', link:'https://www.neopets.com/safetydeposit.phtml' },
      { id:'quickstock',     label:'Quick Stock',        link:'https://www.neopets.com/quickstock.phtml' },
      { id:'transferlog',    label:'Item Transfer Log',  link:'https://www.neopets.com/items/transfer_list.phtml' },
      { id:'gallery',        label:'Gallery',            link:'https://www.neopets.com/gallery/index.phtml' },
      { id:'stamps',         label:'Stamps',             link:'https://www.neopets.com/stamps.phtml?type=album' },
      { id:'tcg',            icon:'tradingcards',   label:'Trading Cards',      link:'https://www.neopets.com/tcg/album.phtml' },
      { id:'ncalbum',        label:'NC Mall Album',      link:'https://www.neopets.com/ncma/' },
      { id:'bookshelf',      label:'Archived Books',     link:'https://www.neopets.com/bookshelf/archive-bookshelf.phtml' },
      { id:'settings',       label:'Settings',           link:'https://www.neopets.com/settings/' },
      { id:'signout',        label:'Sign Out',           link:'https://www.neopets.com/logout.phtml' },
      { id:'shopwizard',     label:'Shop Wizard',        link:'https://www.neopets.com/shops/wizard.phtml',
        fixedSrc:'https://images.neopets.com/themes/h5/basic/images/shopwizard-icon.png' },
      { id:'ssw',            label:'Super Shop Wizard (premium)', link:'https://www.neopets.com/shops/wizard.phtml',
        fixedSrc:'https://images.neopets.com/premium/shopwizard/ssw-icon.svg', premiumSSW:true },
    ];
    const CATALOG_BY_ID = Object.fromEntries(ICON_CATALOG.map(it => [it.id, it]));

    const DEFAULT_CFG = {
      left: ['customise', 'stylingchamber', 'settings', 'inventory', 'quickstock', 'sdb', 'shopwizard'],
    };
    const LS_BTNS_KEY = 'nq_side_btns_v2';

    function resolveItem(entry){
      if (typeof entry === 'string'){
        return CATALOG_BY_ID[entry] || null;
      }
      if (entry && typeof entry === 'object' && entry.id && entry.link){
        const base = CATALOG_BY_ID[entry.id] || {};
        return { ...base, ...entry };
      }
      return null;
    }
    function loadConfig(){
      try {
        const raw = LSget(LS_BTNS_KEY);
        if (raw){
          const j = JSON.parse(raw);
          return { left: [...(j.left || []), ...(j.right || [])].map(resolveItem).filter(Boolean) };
        }
      } catch {}
      return { left: DEFAULT_CFG.left.map(id => CATALOG_BY_ID[id]).filter(Boolean) };
    }
    function saveConfig(cfg){
      LSset(LS_BTNS_KEY, JSON.stringify({ left: cfg.left }));
    }


    const st = document.createElement('style');
    st.textContent = `
      #btnOverlay{
        position:fixed; inset:0;
        z-index:calc(var(--nq-z-hud, 1000) + 2);
        pointer-events:none !important;
        --frame-left: max(
          calc((100vw - var(--nq-frame-width, 1100px)) / 2),
          var(--nq-frame-shift, 0px)
        );
        --frame-right: calc(var(--frame-left) + var(--nq-frame-width, 1100px));
      }
      #btnOverlay .center{ display:contents !important; }
      #btnOverlay .col{
        position:absolute !important;
        top:50% !important;
        display:flex !important;
        flex-direction:column;
        align-items:center !important;
        gap:14px;
        pointer-events:none;
        flex-wrap:wrap !important;
        max-height:calc(100vh - 96px);
        align-content:center;
        transform: translate(-50%, -50%) !important;
      }
      #btnOverlay .col .iconBtn{ pointer-events:auto; }
      #btnOverlay .col.left{ left: var(--frame-left) !important; }

      #btnOverlay .iconBtn{ display:inline-block !important; text-decoration:none !important; background:transparent !important; border:none !important; box-shadow:none; padding:0 !important; margin:0 !important; line-height:0; -webkit-tap-highlight-color:transparent; opacity:1 !important; visibility:visible !important; }
      #btnOverlay .iconBtn img{ width:36px !important; height:36px !important; max-width:none !important; display:block !important; transform:scale(1); transition:transform .12s ease; will-change:transform; transform-origin:center center; filter:drop-shadow(0 1px 4px rgba(0,0,0,.45)); opacity:1 !important; visibility:visible !important; }
      #btnOverlay .iconBtn:hover img{ transform:scale(1.08) !important; }
      #btnOverlay .iconBtn:active img{ transform:scale(1.02) !important; }

    `;
    (document.head || document.documentElement).appendChild(st);

    const overlay = document.createElement('div'); overlay.id = 'btnOverlay';
    const center = document.createElement('div'); center.className = 'center';
    const leftCol = document.createElement('div'); leftCol.className = 'col left';
    center.append(leftCol);
    overlay.appendChild(center);

    function tryOpenSSW(){
      const openers = ['#sswmenu .imgmenu', '#sswmenu img', '#sswmenu', '.navsub-ssw-icon__2020', '#ssw-tab-button'];
      for (const sel of openers){
        const el = $(sel);
        if (el){ try { el.click(); return true; } catch {} }
      }
      const panel = $('#ssw__2020, #ssw_tabs_pane');
      if (panel){
        panel.style.display = 'block';
        try { panel.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch {}
        return true;
      }
      return false;
    }

    const makeBtn = (iconName, href, themeId, fixedSrc, item) => {
      const a = document.createElement('a');
      a.className='iconBtn'; a.href=href; a.target='_self'; a.rel='noopener';
      if (item && item.premiumSSW){
        a.title = 'Super Shop Wizard (premium) — falls back to the Shop Wizard';
        a.addEventListener('click', (e) => {
          if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
          if (tryOpenSSW()){ e.preventDefault(); e.stopPropagation(); }
        });
      }
      const img = new Image();
      img.decoding='async'; img.loading='eager';
      if (fixedSrc){
        img.src = fixedSrc;
      } else {
        img.dataset.icon = iconName;
        attachIconFallback(img, iconName);
        img.src = iconUrl(iconName, themeId);
      }
      a.appendChild(img);
      return a;
    };

    function rebuildColumns(){
      const cfg = loadConfig();
      const t = getTheme();
      leftCol.innerHTML = '';
      cfg.left.forEach(it => leftCol.appendChild(makeBtn(it.icon || it.id, it.link, t, it.fixedSrc, it)));
    }
    rebuildColumns();

    const mountOv = () => { if (!document.body) return false; if (!overlay.isConnected) document.body.appendChild(overlay); return true; };
    let bodyObs = null;
    const watchBody = () => {
      if (bodyObs || !document.body) return;
      bodyObs = new MutationObserver(() => { if (!overlay.isConnected) document.body.appendChild(overlay); });
      bodyObs.observe(document.body, { childList: true });
    };
    if (mountOv()) watchBody();
    else new MutationObserver((_, o) => { if (mountOv()){ watchBody(); o.disconnect(); } }).observe(document.documentElement, { childList:true, subtree:true });

    NQ.sideBtns = {
      catalog: ICON_CATALOG,
      catalogById: CATALOG_BY_ID,
      defaults: DEFAULT_CFG,
      load: loadConfig,
      save: (cfg) => { saveConfig(cfg); rebuildColumns(); },
      reset: () => { LSdel(LS_BTNS_KEY); rebuildColumns(); },
      rebuild: rebuildColumns,
      iconUrl, fallbackUrl, getTheme,
    };
  })();

  (function sideBtnEditor(){
    if (document.getElementById('nqSideBtnHost')) return;
    const API = NQ.sideBtns;
    if (!API) return;

    const TAB_W = 96, TAB_H = 22;
    const PANEL_W = 720, PANEL_H = 470;

    const host = document.createElement('div');
    host.id = 'nqSideBtnHost';
    Object.assign(host.style, {
      position:'fixed', left:'0', right:'0', bottom:'0',
      zIndex: 'calc(var(--nq-z-hud, 1000) + 3)',
      pointerEvents:'none',
    });
    const btnRoot = host.attachShadow({ mode:'open' });

    const css = document.createElement('style');
    css.textContent = `
      :host, :host * { box-sizing:border-box; font-family: var(--nq-font, system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif); }

      .tab{
        position:absolute; left:50%; bottom:0; transform:translateX(-50%);
        width:${TAB_W}px; height:${TAB_H}px;
        background: var(--nq-glass, rgba(0,0,0,.45));
        backdrop-filter: blur(var(--nq-blur, 8px));
        -webkit-backdrop-filter: blur(var(--nq-blur, 8px));
        border:1px solid var(--nq-line, rgba(255,255,255,.18));
        border-bottom:0;
        border-radius:12px 12px 0 0;
        color: #fff;
        font:700 14px/1 system-ui,sans-serif;
        display:flex; align-items:center; justify-content:center;
        cursor:pointer; pointer-events:auto;
        box-shadow: none;
        transition: background .12s ease;
      }
      .tab:hover{ background: rgba(20,14,32,.7); }
      .tab span{ transform: translateY(-1px); display:inline-block; }

      .panel{
        position:absolute; left:50%; bottom:${TAB_H}px;
        transform:translateX(-50%) translateY(${PANEL_H + 40}px);
        width:${PANEL_W}px; max-width:96vw;
        height:min(${PANEL_H}px, 78vh);
        background:rgba(20,14,32,.96);
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        border:1px solid var(--nq-line, rgba(255,255,255,.16));
        border-radius:14px 14px 0 0;
        color:#fff; pointer-events:auto;
        box-shadow:none;
        transition: transform .22s cubic-bezier(.2,.7,.2,1), box-shadow .12s ease;
        display:flex; flex-direction:column;
      }
      .panel.open{
        transform:translateX(-50%) translateY(0);
        box-shadow:0 -14px 40px rgba(0,0,0,.55);
      }

      .head{
        display:flex; align-items:center; justify-content:flex-end;
        gap:6px; padding:6px 8px 4px;
        flex-wrap:wrap;
      }
      .head button{
        background:rgba(255,255,255,.06); color:rgba(255,255,255,.8);
        border:1px solid rgba(255,255,255,.14); border-radius:6px;
        padding:3px 8px; font:600 10px/1 system-ui,sans-serif; cursor:pointer;
        letter-spacing:.04em; text-transform:uppercase;
      }
      .head button:hover{ background:var(--nq-accent-bg); border-color:var(--nq-accent-line); color:#fff; }
      .head .close{ background:transparent; border:0; color:rgba(255,255,255,.65); font-size:16px; padding:0 6px; }
      .head .close:hover{ color:#fff; }
      .body{
        flex:1 1 auto; min-height:0;
        overflow-y:auto; overflow-x:hidden;
        display:grid; grid-template-columns: 1fr 1fr; gap:10px;
        padding:4px 12px 12px;
      }
      .col{
        display:flex; flex-direction:column;
        background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08);
        border-radius:10px; padding:8px; min-height:0;
      }
      .items{ display:flex; flex-direction:column; gap:4px; min-height:60px; }
      .item{
        display:grid; grid-template-columns: 28px minmax(0, 1fr) auto auto auto; gap:8px;
        align-items:center;
        padding:6px 8px; border-radius:7px;
        background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.06);
      }
      .item:hover{ background:var(--nq-accent-soft); }
      .item .ico{ width:24px; height:24px; background:center/contain no-repeat; filter:drop-shadow(0 1px 2px rgba(0,0,0,.6)); }
      .item .lbl{ min-width:0; font-size:12px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .iconBtnMini{
        width:22px; height:22px; padding:0; border:0;
        background:rgba(255,255,255,.06); color:rgba(255,255,255,.75);
        border-radius:5px; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        font:700 12px/1 system-ui,sans-serif;
      }
      .iconBtnMini:hover{ background:var(--nq-accent-bg); color:#fff; }
      .iconBtnMini.dim{ opacity:.55; }
      .iconBtnMini.dim:hover{ opacity:1; }
      .iconBtnMini.del:hover{ background:#ff5a5a; color:#fff; }

      .add{
        margin-top:8px; display:flex; flex-direction:column; gap:6px;
      }
      .add select{
        background:rgba(0,0,0,.35); color:#fff;
        border:1px solid rgba(255,255,255,.16); border-radius:6px;
        padding:5px 8px; font-size:12px; outline:none;
      }
      .add .row{ display:flex; gap:6px; }
      .add .row > *{ flex:1; min-width:0; }
      .add button{
        background:var(--nq-accent-bg); color:#fff;
        border:1px solid var(--nq-accent-line); border-radius:6px;
        padding:5px 10px; font:700 11px/1 system-ui,sans-serif; cursor:pointer;
        white-space:nowrap; letter-spacing:.08em;
      }
      .add button:hover{ background:var(--nq-accent-hover); }

      @media (max-width: 820px){
        .body{ grid-template-columns: 1fr; }
      }
    `;
    btnRoot.appendChild(css);

    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.title = 'Customize the side buttons';
    tab.innerHTML = `<span>˄</span>`;
    btnRoot.appendChild(tab);

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="head">
        <button type="button" id="resetBtn" title="Restore the default config">Reset</button>
        <button type="button" class="close" id="closeBtn" aria-label="Close">×</button>
      </div>
      <div class="body">
        <div class="col" data-side="left">
          <div class="items" id="itemsLeft"></div>
          <div class="add">
            <div class="row">
              <select id="addSelLeft"></select>
              <button type="button" data-add="left">ADD</button>
            </div>
          </div>
        </div>
      </div>
    `;
    btnRoot.appendChild(panel);

    function iconPreviewUrl(item){
      if (item.fixedSrc) return item.fixedSrc;
      return API.iconUrl(item.icon || item.id, API.getTheme());
    }
    function paint(){
      const cfg = API.load();
      const itemsLeft  = panel.querySelector('#itemsLeft');
      const render = (arr, side) => arr.map((it, i) => `
        <div class="item" data-side="${side}" data-idx="${i}" title="${esc(it.link)}">
          <div class="ico" style="background-image:url('${esc(iconPreviewUrl(it))}')"></div>
          <div class="lbl">${esc(it.label || it.id)}</div>
          <button type="button" class="iconBtnMini dim" data-act="up"    title="Move up">▲</button>
          <button type="button" class="iconBtnMini del"  data-act="del"   title="Remove">🗑</button>
        </div>
      `).join('');
      itemsLeft.innerHTML  = render(cfg.left, 'left')   || `<div style="opacity:.5;font-size:12px;text-align:center;padding:14px">(empty)</div>`;

      const usedIds = new Set(cfg.left.map(it => it.id));
      const opts = API.catalog
        .filter(it => !usedIds.has(it.id))
        .map(it => `<option value="${esc(it.id)}">${esc(it.label)}</option>`)
        .join('') || `<option value="" disabled>(everything is placed)</option>`;
      panel.querySelector('#addSelLeft').innerHTML  = opts;
    }

    let open = false;
    function setOpen(o){
      open = !!o;
      panel.classList.toggle('open', open);
      if (open) paint();
    }
    tab.addEventListener('click', () => setOpen(!open));
    panel.querySelector('#closeBtn').addEventListener('click', () => setOpen(false));
    panel.querySelector('#resetBtn').addEventListener('click', () => {
      if (confirm('Restore the default config?')){
        API.reset();
        paint();
      }
    });

    panel.addEventListener('click', (e) => {
      const t = e.target;
      const addBtn = t.closest('button[data-add]');
      if (addBtn){
        const side = addBtn.dataset.add;
        const sel  = panel.querySelector('#addSelLeft');
        const id   = sel.value;
        if (!id) return;
        const item = API.catalogById[id]; if (!item) return;
        const cfg = API.load();
        cfg[side] = [...cfg[side], { id: item.id, icon: item.icon, label: item.label, link: item.link, fixedSrc: item.fixedSrc }];
        API.save(cfg); paint();
        return;
      }
      const itemEl = t.closest('.item');
      const actBtn = t.closest('button[data-act]');
      if (itemEl && actBtn){
        const side = itemEl.dataset.side;
        const idx  = +itemEl.dataset.idx;
        const act  = actBtn.dataset.act;
        const cfg  = API.load();
        const arr  = cfg[side];
        if (act === 'del'){
          arr.splice(idx, 1);
        } else if (act === 'up'){
          if (idx > 0){ const [it] = arr.splice(idx, 1); arr.splice(idx - 1, 0, it); }
          else if (arr.length > 1){ const [it] = arr.splice(0, 1); arr.push(it); }
        }
        API.save(cfg); paint();
        return;
      }
    });

    document.addEventListener('pointerdown', (ev) => {
      if (!open) return;
      const path = ev.composedPath ? ev.composedPath() : [];
      if (path.some(n => n === tab || n === panel)) return;
      setOpen(false);
    }, true);

    NQ.onBtnTheme(() => { if (open) paint(); });

    (function mount(){
      if (document.body) document.body.appendChild(host);
      else new MutationObserver((_, o) => { if (document.body){ document.body.appendChild(host); o.disconnect(); } })
            .observe(document.documentElement, { childList:true, subtree:true });
    })();
  })();

}

if (NQ.base) startHud();

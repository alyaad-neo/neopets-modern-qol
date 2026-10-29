  const darken = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * f).toString(16).padStart(2, '0')).join('');
  };
  const hasImg = (side) => !!LSget(side === 'main' ? K.mainImg : K.leftImg);
  const saved = () => ({ main: LSget(K.main) || null, left: LSget(K.left) || null, head: LSget(K.head) || null });

  function paintMain(c) {
    if (c === null && hasImg('main')) return;
    rs.setProperty('--nqWallImage', 'none');
    rs.setProperty('--nqMainSolid', c || DEF.main);
  }
  function paintLeft(c) {
    if (c === null && hasImg('left')) return;
    rs.setProperty('--nqLeftBarImg', 'none');
    rs.setProperty('--nqLeftBarSolid', c || DEF.left);
    rs.setProperty('--nqLeftBarShadeA', '0');
  }
  function paintHead(c) {
    const h = c || DEF.head, d = darken(h, .72);
    rs.setProperty('--nq-head-a', h + HEAD_ALPHA);
    rs.setProperty('--nq-head-b', d + HEAD_ALPHA);
    lastHeadHex = h; try { applyNavContrast(); } catch {}
    [['solid', 'ff'], ['tint', 'b3'], ['blur', '8c']].forEach(([k, a]) => {
      rs.setProperty('--nq-head-a-' + k, h + a);
      rs.setProperty('--nq-head-b-' + k, d + a);
    });
  }
  const painters = { main: paintMain, left: paintLeft, head: paintHead };
  const paintAll = (s) => { paintMain(s.main); paintLeft(s.left); paintHead(s.head); };

  let lastHeadHex = DEF.head;
  function applyNavContrast() {
    const mode = root.dataset.nqBar || 'blur', m = /^#?([0-9a-f]{6})/i.exec(String(lastHeadHex || ''));
    let light = false;
    if (m && mode !== 'none') {
      const n = parseInt(m[1], 16), lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      light = (0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)) >= 0.72;
    }
    const vars = { '--nq-nav-fg': '#111827', '--nq-nav-shadow': 'none', '--nq-nav-hover': 'rgba(0,0,0,.08)', '--nq-nav-ring': 'rgba(0,0,0,.14)' };
    Object.keys(vars).forEach(k => light ? rs.setProperty(k, vars[k]) : rs.removeProperty(k));
  }
  let draft = {}, clearImg = { main: false, left: false }, saving = false;
  let pendingImg = { main: null, left: null };
  let accentPick = null, accentBase = '', ownAccent = false;

  function commit() {
    ['main', 'left'].forEach(k => { if (draft[k] !== null || clearImg[k]) LSset(k === 'main' ? K.mainImg : K.leftImg, ''); });
    ['main', 'left', 'head'].forEach(k => draft[k] === null ? LSdel(K[k]) : LSset(K[k], draft[k]));
    if (pendingImg.main) LSset(K.mainImg, pendingImg.main);
    if (pendingImg.left) LSset(K.leftImg, pendingImg.left);
    if (accentPick) {
      LSset('nq_accent_v1', accentPick);
      try { ownAccent = true; NQ.applyAccent(accentPick); } catch {} finally { ownAccent = false; }
      applyAccentContrast(accentPick);
    }
  }

  const QUICK_PRESETS = {
    default:  { main: '#ffffff', left: '#2a292e', head: '#ff8a1f', accent: '#ff8a1f' },
    dark:     { main: '#121015', left: '#1a1722', head: '#2a2433', accent: '#dcb8ff' },
    contrast: { main: '#000000', left: '#000000', head: '#ffff00', accent: '#ffff00' },
  };

  function injectPicker(sb) {
    const anchor = $('.nqBgSearch', sb);
    if (!anchor || $('#nqColors')) return;
    const row = document.createElement('div');
    row.id = 'nqColors';
    row.innerHTML = '<div class="nqSmall">Colors</div>'
      + '<div class="nqPresets"><button type="button" data-preset="default">Default</button><button type="button" data-preset="dark">Dark</button><button type="button" data-preset="contrast">High contrast</button></div>'
      + `<div class="nqRow nqAccRow"><input type="color" data-acc="1" title="Accent colour"><span>Accent</span><button type="button" data-accreset="1" title="Reset to the default accent">Reset</button></div>`
      + [['main', 'Background'], ['left', 'Sidebar'], ['head', 'Header']].map(([k, l]) =>
      `<div class="nqRow"><span>${l}</span><input type="color" data-k="${k}"><button type="button" data-r="${k}" title="Reset to default (also removes its image)">Reset</button></div>`).join('')
      + '<label class="nqShareRow"><input type="checkbox" data-share="1"><span>Share theme on all accounts</span></label>'
      + '<div class="nqRow nqLogoRow"><i class="nqLogoDot"></i><span>Logo</span><div class="nqSeg"><button type="button" data-logo="0">Black</button><button type="button" data-logo="1">White</button></div></div>'
      + '<div class="nqRow nqLogoRow nqSideRow"><i class="nqLogoDot"></i><span>Sidebar style</span><div class="nqSeg"><button type="button" data-side="0">Dark</button><button type="button" data-side="1">Light</button></div></div>';
    anchor.before(row);
    const curAccent = () => { let a = ''; try { a = NQ.getAccent() || LSget('nq_accent_v1') || ''; } catch {} return /^#[0-9a-f]{6}$/i.test(a) ? a : NP_ORANGE; };
    const setAccent = (hex) => {
      if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
      try { ownAccent = true; NQ.applyAccent(hex); } catch {} finally { ownAccent = false; }
      accentPick = hex;
      applyAccentContrast(hex);
      sync();
    };
    const sync = () => {
      const ai = row.querySelector('input[data-acc]'); if (ai) ai.value = curAccent();
      const sh = row.querySelector('input[data-share]'); if (sh) sh.checked = themeShared();
      row.querySelectorAll('input[data-k]').forEach(i => { i.value = draft[i.dataset.k] || DEF[i.dataset.k]; });
      const lw = LSget('nq_logo_white') === '1' ? '1' : '0';
      row.querySelectorAll('[data-logo]').forEach(b => b.classList.toggle('on', b.dataset.logo === lw));
      const lr = row.querySelector('.nqLogoRow'); if (lr) lr.dataset.logo = lw;
      const sl = document.documentElement.classList.contains('nq-side-light') ? '1' : '0';
      row.querySelectorAll('[data-side]').forEach(x => x.classList.toggle('on', x.dataset.side === sl));
    };
    row.addEventListener('click', (e) => {
      const sb = e.target.closest && e.target.closest('[data-side]'); if (!sb) return;
      const on = sb.dataset.side === '1';
      document.documentElement.classList.toggle('nq-side-light', on);
      LSset('nq_side_light', on ? '1' : '0'); sync();
    });
    row._sync = sync;
    sync();
    row.addEventListener('change', (e) => {
      if (!(e.target.dataset && e.target.dataset.share !== undefined)) return;
      LSset('nq_theme_shared', e.target.checked ? '1' : '0');
      if (!e.target.checked) {
        const base = JSON.stringify(readTheme());
        try { allAccts().forEach(n => { if (!LSget('nq_theme_' + n)) LSset('nq_theme_' + n, base); }); } catch {}
        try { const u = curUser(); if (u) LSset('nq_theme_' + u, base); } catch {}
      }
    });
    row.addEventListener('input', (e) => {
      if (e.target.dataset && e.target.dataset.acc !== undefined) { setAccent(e.target.value); return; }
      const k = e.target.dataset && e.target.dataset.k;
      if (!k) return;
      draft[k] = e.target.value;
      painters[k](draft[k]);
    });
    row.addEventListener('click', (e) => {
      const pre = e.target.dataset && e.target.dataset.preset;
      if (pre) {
        const P = QUICK_PRESETS[pre];
        if (!P) return;
        ['main', 'left', 'head'].forEach(k => { draft[k] = P[k]; painters[k](P[k]); });
        clearImg = { main: true, left: true };
        setAccent(P.accent);
        sync();
        return;
      }
      if (e.target.closest && e.target.closest('[data-accreset]')) { setAccent(NP_ORANGE); return; }
      const lg = e.target.dataset && e.target.dataset.logo;
      if (lg !== undefined) { LSset('nq_logo_white', lg === '1' ? '1' : '0'); applyLogo(); sync(); return; }
      const k = e.target.dataset && e.target.dataset.r;
      if (!k) return;
      draft[k] = null;
      if (k !== 'head') clearImg[k] = true;
      painters[k](k === 'head' ? null : DEF[k]);
      sync();
    });
  }

  const DTI_URL = 'https://impress-2020.openneo.net/api/graphql';
  const DTI_Q = 'query SearchBgs($query: String!, $offset: Int!, $limit: Int!) { itemSearch(query: $query, offset: $offset, limit: $limit) { items { id name thumbnailUrl appearanceOn(speciesId: 1, colorId: 8) { layers { id zone { id label } imageUrl(size: SIZE_600) } } } } }';
  const dtiPage = (offset, query = 'background', limit = 30) => new Promise((resolve, reject) => {
    if (typeof GM_xmlhttpRequest !== 'function') { reject(new Error('GM_xmlhttpRequest unavailable')); return; }
    GM_xmlhttpRequest({
      method: 'POST', url: DTI_URL, timeout: 20000,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      data: JSON.stringify({ query: DTI_Q, variables: { query, offset, limit } }),
      onload: (r) => {
        try {
          const j = JSON.parse(r.responseText);
          if (j.errors && j.errors.length) { reject(new Error(j.errors[0].message || 'GraphQL error')); return; }
          resolve(((j.data || {}).itemSearch || {}).items || []);
        } catch (e) { reject(e); }
      },
      onerror: () => reject(new Error('network')), ontimeout: () => reject(new Error('timeout')),
    });
  });
  const BG_SKIP = [/altador cup/i, /advent/i, /birthday|anniversar|\b\d+[- ]?years?\b/i];
  async function discoverBgs() {
    let end = parseInt(LSget('nq_disc_end'), 10) || 0;
    const seenOff = new Set(), seenId = new Set(), got = [];
    for (let attempt = 0; attempt < 10 && got.length < 24; attempt++) {
      const slots = Math.max(1, Math.floor((end ? end : 2400) / 30));
      let off = Math.floor(Math.random() * slots) * 30, g = 0;
      while (seenOff.has(off) && g++ < 12) off = Math.floor(Math.random() * slots) * 30;
      seenOff.add(off);
      const items = await dtiPage(off);
      if (items.length < 30) { end = off + items.length; LSset('nq_disc_end', String(end)); }
      items.forEach((it) => {
        const layers = ((it.appearanceOn || {}).layers) || [];
        const layer = layers.find(l => ((l.zone || {}).label || '').toLowerCase().includes('background')) || layers[0];
        const url = layer && layer.imageUrl;
        const id = String(it.id);
        if (!url || seenId.has(id) ||BG_SKIP.some(re => re.test(it.name || ''))) return;
        seenId.add(id);
        got.push({ id, name: it.name || 'Background', thumb: it.thumbnailUrl || url, url });
      });
    }
    for (let i = got.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [got[i], got[j]] = [got[j], got[i]]; }
    return got.slice(0, 30);
  }
  const cssUrl = (u) => `url("${String(u).replace(/["\\\n\r]/g, '')}")`;

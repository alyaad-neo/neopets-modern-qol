  function wireSidebar() {
    const sb = $('#nqBgSidebar'), h = $('#nqBgHandle');
    if (!sb || !h || sb.dataset.nq) return;
    sb.dataset.nq = '1';
    handleEl = h;
    h.innerHTML = CHEV;
    injectPicker(sb);
    const barSel = $('#nqTopbarBg', sb);
    if (barSel) barSel.addEventListener('change', () => applyBarStyle(barSel.value));
    const rb = $('#nqRecolorSite', sb);
    if (rb) rb.title = 'Turn Neopets’ built-in gold buttons, tabs and bars into your accent color';
    const bgList = $('#nqBgList', sb), bgQuery = $('#nqBgQuery', sb), bar = $('.nqBgSearch', sb);
    let runShuffle = () => {};
    if (bgList && bgQuery && bar) {
      const HIDE_RULES = [
        [/altador cup/i, /altador|cup/i],
        [/advent/i, /advent/i],
        [/birthday|anniversar|\b\d+[- ]?years?\b/i, /birthday|anniversar|year|\d+(st|nd|rd|th)/i],
      ];
      const dbar = document.createElement('div');
      dbar.id = 'nqDiscBar'; dbar.hidden = true;
      dbar.innerHTML = '<span id="nqDiscMsg"></span>';
      bar.after(dbar);
      const dmsg = $('#nqDiscMsg', dbar);
      const SHUFFLE_MSG = 'Random selection · click Shuffle again for more';
      const busyOn = (msg) => { bgList.classList.add('nqFetching'); dbar.classList.add('loading'); dbar.hidden = false; dmsg.textContent = msg; };
      const busyOff = () => { bgList.classList.remove('nqFetching'); dbar.classList.remove('loading'); };
      const safeUrl = (u) => String(u || '').replace(/["'\\\n\r]/g, '');
      let lastShuffle = [];
      const renderDisc = (items) => {
        bgList.innerHTML = items.map((it, i) =>
          `<div class="nqBgItem nqRowIn" style="--i:${i}"><div class="nqBgThumb" style="background-image:url('${safeUrl(it.thumb)}')"></div><div class="nqBgName" title="${esc(it.name)}">${esc(it.name)}</div>` +
          `<button type="button" class="nqBgBtn nqBgL" data-url="${esc(it.url)}" title="Use on LEFT decor column">L</button>` +
          `<button type="button" class="nqBgBtn nqBgR" data-url="${esc(it.url)}" title="Use as MAIN background">M</button></div>`).join('');
        bgList.scrollTop = 0;
      };
      bgList.addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('.nqBgBtn');
        if (!b) return;
        e.preventDefault(); e.stopPropagation();
        const url = b.dataset.url, isMain = b.classList.contains('nqBgR'), k = isMain ? 'main' : 'left';
        draft[k] = null; clearImg[k] = false; pendingImg[k] = url;
        if (isMain) { rs.setProperty('--nqMainSolid', '#000'); rs.setProperty('--nqWallImage', cssUrl(url)); }
        else { rs.setProperty('--nqLeftBarImg', cssUrl(url)); rs.setProperty('--nqLeftBarSolid', '#000'); rs.setProperty('--nqLeftBarShadeA', '1'); }
        bgList.querySelectorAll(isMain ? '.nqBgR' : '.nqBgL').forEach(x => x.classList.toggle('isActive', x === b));
      });
      const KW_MAX = 100, kwEnd = {};
      let kwToken = 0, kwTimer = 0;
      const bgFromItem = (it, q) => {
        const layer = (((it.appearanceOn || {}).layers) || []).find(l => ((l.zone || {}).label || '').toLowerCase().includes('background'));
        if (!layer || !layer.imageUrl) return null;
        const id = String(it.id), name = it.name || 'Background';
        if (HIDE_RULES.some(([nameRe, queryRe]) => nameRe.test(name) && !queryRe.test(q))) return null;
        return { id, name, thumb: it.thumbnailUrl || layer.imageUrl, url: layer.imageUrl };
      };
      async function kwSearch(q, shuffle) {
        const key = q.toLowerCase(), got = [], seen = new Set();
        const take = (items) => items.forEach(it => { const b = bgFromItem(it, q); if (b && !seen.has(b.id)) { seen.add(b.id); got.push(b); } });
        const term = key.includes('background') ? q : q + ' background';
        if (!shuffle) {
          for (let page = 0; page < 6 && got.length < KW_MAX; page++) {
            const items = await dtiPage(page * 30, term, 30);
            take(items);
            if (items.length < 30) { kwEnd[key] = page * 30 + items.length; break; }
          }
          if (got.length < 10 && !key.includes('background')) {
            for (let page = 0; page < 4 && got.length < KW_MAX; page++) { const items = await dtiPage(page * 30, q, 30); take(items); if (items.length < 30) break; }
          }
          return got.slice(0, KW_MAX);
        }
        for (let attempt = 0; attempt < 5 && got.length < KW_MAX; attempt++) {
          const end = kwEnd[key], slots = Math.max(1, Math.ceil((end || 600) / 30)), off = Math.floor(Math.random() * slots) * 30;
          const items = await dtiPage(off, term, 30);
          if (items.length < 30) kwEnd[key] = off + items.length;
          take(items);
          if (kwEnd[key] !== undefined && kwEnd[key] <= 30) break;
        }
        for (let i = got.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [got[i], got[j]] = [got[j], got[i]]; }
        return got.slice(0, KW_MAX);
      }
      const runKw = async (shuffle) => {
        const q = (bgQuery.value || '').trim(), tok = ++kwToken;
        busyOn(`Searching for “${q}”…`);
        try {
          const items = await kwSearch(q, shuffle);
          if (tok !== kwToken) return;
          if (!items.length) { bgList.innerHTML = '<div class="nqDiscEmpty">No backgrounds found for “' + esc(q) + '”.</div>'; dmsg.textContent = `No backgrounds found for “${q}”.`; }
          else { renderDisc(items); dmsg.textContent = `${items.length}${items.length >= KW_MAX ? '+' : ''} for “${q}” · Shuffle for other matches`; }
        } catch (err) { if (tok === kwToken) dmsg.textContent = 'Couldn’t search DTI (' + (err && err.message || 'error') + ')'; }
        finally { if (tok === kwToken) busyOff(); }
      };
      const sh = document.createElement('button');
      sh.type = 'button'; sh.id = 'nqShuffle'; sh.title = 'Shuffle: a fresh random selection of backgrounds'; sh.innerHTML = SHUFFLE;
      bar.appendChild(sh);
      let busyDisc = false;
      runShuffle = async () => {
        if (busyDisc) return;
        busyDisc = true; sh.classList.add('busy'); sh.disabled = true;
        try {
          if (bgQuery.value.trim().length >= 2) { await runKw(true); return; }
          const tok = ++kwToken;
          busyOn('Finding new backgrounds…');
          try {
            const items = await discoverBgs();
            if (tok !== kwToken) return;
            if (!items.length) throw new Error('nothing usable came back');
            lastShuffle = items;
            renderDisc(items);
            dmsg.textContent = SHUFFLE_MSG;
          } catch (err) {
            if (tok === kwToken) dmsg.textContent = 'Couldn’t reach DTI (' + (err && err.message || 'error') + ')';
          } finally { if (tok === kwToken) busyOff(); }
        } finally { busyDisc = false; sh.classList.remove('busy'); sh.disabled = false; }
      };
      sh.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); runShuffle(); });
      bgQuery.addEventListener('input', () => {
        clearTimeout(kwTimer);
        const q = bgQuery.value.trim();
        if (q.length >= 2) { kwTimer = setTimeout(() => runKw(false), 500); return; }
        if (q || busyDisc) return;
        ++kwToken; busyOff();
        if (lastShuffle.length) { renderDisc(lastShuffle); dmsg.textContent = SHUFFLE_MSG; }
        else runShuffle();
      });
      bgQuery.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(kwTimer); if (bgQuery.value.trim().length >= 2) runKw(false); } });
    }
    let wasOpen = false;
    new MutationObserver(() => {
      const open = sb.style.transform.includes('translateX(0');
      if (open && !wasOpen) {
        draft = saved(); clearImg = { main: false, left: false }; saving = false; pendingImg = { main: null, left: null };
        accentPick = null; accentBase = LSget('nq_accent_v1');
        const r = $('#nqColors'); if (r && r._sync) r._sync();
        if (bgList && !bgList.children.length) runShuffle();
      } else if (!open && wasOpen) {
        if (saving) commit();
        else if (accentPick) {
          try { ownAccent = true; NQ.applyAccent(accentBase || NP_ORANGE); } catch {} finally { ownAccent = false; }
          applyAccentContrast(accentBase || NP_ORANGE);
        }
        accentPick = null;
        draft = saved(); saving = false; pendingImg = { main: null, left: null };
        paintAll(draft);
      }
      h.style.visibility = open ? 'hidden' : '';
      wasOpen = open;
    }).observe(sb, { attributes: true, attributeFilter: ['style'] });
  }

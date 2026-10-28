(function () {
  const OLD = /^(npqol|npp)_/;
  const rename = k => k.replace(OLD, 'nq_');
  try {
    if (!localStorage.getItem('nq_migrated')) {
      Object.keys(localStorage).forEach(k => {
        if (!OLD.test(k) || k.startsWith('npqol_pp_png')) return;
        try { if (localStorage.getItem(rename(k)) === null) localStorage.setItem(rename(k), localStorage.getItem(k)); } catch {}
      });
      localStorage.setItem('nq_migrated', '1');
    }
  } catch {}
  if (typeof GM_getValue !== 'function' || typeof GM_setValue !== 'function') return;
  try {
    if (GM_getValue('nq_migrated', '')) return;
    ['npp_sync', 'npp_nc_cd', 'npp_allpets_v1', 'npp_allpets_tags_v1'].forEach(k => {
      let v = GM_getValue(k, null);
      if (v === null || GM_getValue(rename(k), null) !== null) return;
      if (k === 'npp_sync') {
        const o = JSON.parse(v || '{}'), n = {};
        Object.keys(o).forEach(s => { n[rename(s)] = o[s]; });
        v = JSON.stringify(n);
      }
      GM_setValue(rename(k), v);
    });
    GM_setValue('nq_migrated', '1');
  } catch {}
})();

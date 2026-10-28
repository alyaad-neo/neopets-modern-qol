  const EVENTS_URL = 'https://www.neopets.com/allevents.phtml';
  const BELL_ICON = 'https://images.neopets.com/themes/h5/basic/images/v3/bell-icon.svg';
  function setupBell() {
    if (isNc || isPopup || !document.body) return;
    let box = $('#nqBell');
    const nb = $('.nav-bell-icon__2020'), dd = $('#navnewsdropdown__2020');
    if (nb && dd) {
      if (box && box.dataset.k === 'native' && box.contains(nb)) return;
      if (box) box.remove();
      box = document.createElement('div');
      box.id = 'nqBell'; box.dataset.k = 'native';
      box.append(nb, dd);
      document.body.appendChild(box);
      try { if (getComputedStyle(nb).backgroundImage === 'none') nb.style.backgroundImage = `url("${BELL_ICON}")`; } catch {}
      return;
    }
    if (box || document.readyState === 'loading') return;
    const td = $('td.eventIcon');
    const b = td && td.querySelector('b');
    const txt = td ? (td.innerText || '').replace(/»\s*See all events\s*«/i, '').trim() : '';
    const title = ((b && b.textContent) || '').trim() || txt.slice(0, 80);
    box = document.createElement('a');
    box.id = 'nqBell'; box.dataset.k = 'link'; box.href = EVENTS_URL;
    box.title = title ? 'Newest alert: ' + title : 'Alerts';
    box.setAttribute('aria-label', box.title);
    box.innerHTML = `<img src="${BELL_ICON}" alt="">` + (title ? '<i class="nqBellDot"></i>' : '');
    document.body.appendChild(box);
  }

  function buildFooter() {
    if ($('#nqFoot') || !document.body || isNc) return;
    const f = document.createElement('div');
    f.id = 'nqFoot';
    document.body.appendChild(f);
    new ResizeObserver(() => rs.setProperty('--nq-hud-bottom', (f.offsetHeight + 12) + 'px')).observe(f);
  }

  let clockTimer = null;
  function setupClock() {
    if (isNc || isPopup) return;
    const sr = shadow();
    if (!sr) return;
    const bar = sr.querySelector('.bar');
    if (!bar) return;
    let nst = bar.querySelector('.nq-clock');
    if (!nst) {
      nst = document.createElement('div');
      nst.id = 'nqNst'; nst.className = 'nq-clock'; nst.textContent = '--:--:--';
      bar.appendChild(nst);
    }
    if (nst.dataset.ready === '1') return;
    nst.dataset.ready = '1';
    if (clockTimer) clearInterval(clockTimer);
    const fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
    const tick = () => { nst.textContent = fmt.format(new Date()).replace(/\s?(AM|PM)/i, (m, p) => ' ' + p.toLowerCase()) + ' NST'; };
    tick();
    clockTimer = setInterval(tick, 1000);
  }

  const LEFT_BAR_PX = 330;
  const TOP_BAR_PX  = 0;
  const LS = {
    mainBgId:  'nq_bg_main_v3',
    leftBarBg: 'nq_bg_left_v3',
    recolor:   'nq_recolor_site_v1',
    topbarBg:  'nq_topbar_bg_v1',
  };
  const BG_COLOR = '#000';
  const UI_Z = 2147483000;
  const HANDLE_W = 20;
  const HANDLE_H = 90;
  const SIDEBAR_W = 320;
  function pageClass(){
    const p = location.pathname.toLowerCase();
    if (p.includes('/inventory.phtml'))     return 'nq-page-inventory';
    if (p.includes('/safetydeposit.phtml')) return 'nq-page-sdb';
    if (p.includes('/shop.phtml') || p.includes('/market.phtml')) return 'nq-page-shop';
    if (p.includes('/quickstock.phtml'))    return 'nq-page-quickstock';
    return '';
  }
  function mountLeftBar(){
    if (document.getElementById('nqLeftBar')) return;
    const bar = document.createElement('div');
    bar.id = 'nqLeftBar';
    bar.innerHTML = `<div id="nqLeftBarBg"></div><div id="nqLeftBarShade"></div>`;
    (document.body || document.documentElement).appendChild(bar);
  }
  function onReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  }

function startBackgrounds() {
  if (document.documentElement.dataset.nqBgBoot === '1') return;
  document.documentElement.dataset.nqBgBoot = '1';

  ['nq_dti_bgs_v6', 'nq_bg_favs_v1', 'nq_bg_hidden_v1', 'nq_inv_menubar_v1'].forEach(k => { LSdel(k); });

  const safeUrl = (u) => String(u || '').replace(/["\\\n\r]/g, '');

  function applyMainBg(url){
    if (!url){
      document.documentElement.style.setProperty('--nqWallImage', 'none');
      document.documentElement.style.setProperty('--nqMainSolid', 'transparent');
      return;
    }
    document.documentElement.style.setProperty('--nqMainSolid', BG_COLOR);
    document.documentElement.style.setProperty('--nqWallImage', `url("${safeUrl(url)}")`);
  }
  function applyLeftBg(url){
    if (!url){
      document.documentElement.style.setProperty('--nqLeftBarImg', 'none');
      document.documentElement.style.setProperty('--nqLeftBarSolid', 'transparent');
      document.documentElement.style.setProperty('--nqLeftBarShadeA', '0');
      return;
    }
    document.documentElement.style.setProperty('--nqLeftBarImg', `url("${safeUrl(url)}")`);
    document.documentElement.style.setProperty('--nqLeftBarSolid', '#000');
    document.documentElement.style.setProperty('--nqLeftBarShadeA', '1');
  }

  applyMainBg(LSget(LS.mainBgId));
  applyLeftBg(LSget(LS.leftBarBg));

  const _pc = pageClass();
  if (_pc) document.documentElement.classList.add(_pc);
  document.documentElement.classList.toggle('nq-recolor-site', LSget(LS.recolor) === '1');

  const style = document.createElement('style');
  style.textContent = `
    :root{
      --nqWallImage:none;
      --nqMainSolid:${BG_COLOR};

      --nqLeftBarImg:none;
      --nqLeftBarSolid:#000;
      --nqLeftBarShadeA:1;
    }

    html,body{
      background:transparent!important;
      background-image:none!important;
    }

    :root::before{
      content:"";
      position:fixed;
      inset:${TOP_BAR_PX}px 0 0 var(--nq-col-width, ${LEFT_BAR_PX}px);
      z-index:-2147483647;
      pointer-events:none;

      background-color:var(--nqMainSolid)!important;
      background-image:var(--nqWallImage) !important;
      background-repeat:no-repeat!important;
      background-position:right top!important;
      background-size:cover!important;
    }

    .nav-top-pattern__2020,.nav-bottom-pattern__2020,.footer-pattern__2020{
      background:transparent!important;
      background-image:none!important;
    }

    #nqLeftBar{
      position:fixed!important; top:0; left:0;
      width: var(--nq-col-width, ${LEFT_BAR_PX}px); height:100vh;
      z-index:18;
      pointer-events:none;
      overflow:hidden;
      box-sizing:border-box;
      border:2px solid #000;
      background:transparent;
      contain:paint;
      visibility:visible!important;
      opacity:1!important;
    }
    #nqLeftBarBg{
      position:absolute; inset:0;
      background-color:var(--nqLeftBarSolid);
      background-image:var(--nqLeftBarImg);
      background-size:cover;
      background-position:center;
      opacity:1!important;
      visibility:visible;
    }
    #nqLeftBarShade{
      position:absolute; inset:0;
      background:linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.28));
      opacity:var(--nqLeftBarShadeA);
      visibility:visible;
    }

    @media (max-width: 900px){
      #nqLeftBar{ display:none; }
      :root::before{ inset:${TOP_BAR_PX}px 0 0 0; }
    }

    #nqBgHandle{
      position:fixed;
      right:0;
      top:calc(${TOP_BAR_PX}px + (100vh - ${TOP_BAR_PX}px - ${HANDLE_H}px)/2);
      width:${HANDLE_W}px;
      height:${HANDLE_H}px;
      border-radius:12px 0 0 12px;
      background: var(--nq-glass, rgba(0,0,0,.45));
      backdrop-filter: blur(var(--nq-blur, 8px));
      -webkit-backdrop-filter: blur(var(--nq-blur, 8px));
      border:1px solid var(--nq-line, rgba(255,255,255,.18));
      border-right:0;
      color:#fff;
      display:flex; align-items:center; justify-content:center;
      font-weight:700; font-size:14px; line-height:1;
      z-index:${UI_Z};
      cursor:pointer;
      pointer-events:auto;
      box-shadow:none;
      user-select:none;
      transition: background .12s ease;
    }
    #nqBgHandle:hover{ background: rgba(20,14,32,.7); }
    #nqBgHandle span{ transform:translateX(-1px); }

    #nqBgSidebar{
      position:fixed;
      right:0;
      top:${TOP_BAR_PX}px;
      width:${SIDEBAR_W}px;
      max-width: min(${SIDEBAR_W}px, 90vw);
      height:calc(100vh - ${TOP_BAR_PX}px);
      background:var(--nq-glass, rgba(0,0,0,.22));
      backdrop-filter:blur(var(--nq-blur, 8px));
      -webkit-backdrop-filter:blur(var(--nq-blur, 8px));
      box-shadow:var(--nq-shadow, -2px 0 10px rgba(0,0,0,.28));
      z-index:${UI_Z-2};
      transition:transform .20s ease;
      transform:translateX(100%);
      display:flex;
      flex-direction:column;
      overflow:hidden;
      box-sizing:border-box;
    }

    #nqBgBody{
      flex:1 1 auto;
      min-height:0;
      overflow:auto;
      padding:12px;
      box-sizing:border-box;
      scrollbar-width:thin;
      scrollbar-color: rgba(255,255,255,.35) rgba(0,0,0,.12);
    }
    #nqBgBody::-webkit-scrollbar{ width:10px; }
    #nqBgBody::-webkit-scrollbar-thumb{
      background:rgba(255,255,255,.28);
      border-radius:10px;
      border:2px solid rgba(0,0,0,.12);
    }
    #nqBgBody::-webkit-scrollbar-track{ background:rgba(0,0,0,.10); }

    #nqBgFooter{
      flex:0 0 auto;
      padding:10px 12px;
      display:flex; gap:8px;
      border-top:1px solid rgba(255,255,255,.18);
      background:rgba(0,0,0,.22);
    }
    .nqFooterBtn{
      flex:1;
      border-radius:10px;
      border:1px solid rgba(255,255,255,.32);
      background:rgba(0,0,0,.22);
      color:#fff; font-weight:900;
      padding:10px 8px; cursor:pointer; font-size:12px;
    }
    .nqFooterBtn:hover{ filter:brightness(1.08); }
    .nqFooterBtn.primary{
      background:var(--nq-accent, #dcb8ff);
      color:#1a1330;
      border-color:transparent;
    }

    .nqThemeBlock{ margin:0 0 10px 0; }
    .nqThemeSelect{
      width:100%;
      height:32px;
      border-radius:8px;
      border:1px solid rgba(255,255,255,.32);
      background:rgba(0,0,0,.22);
      color:#fff; font-weight:700; font-size:12px;
      padding:0 10px;
      cursor:pointer;
      appearance:none;
      -webkit-appearance:none;
      background-image:linear-gradient(45deg, transparent 50%, rgba(255,255,255,.6) 50%),
                       linear-gradient(135deg, rgba(255,255,255,.6) 50%, transparent 50%);
      background-position:calc(100% - 14px) center, calc(100% - 9px) center;
      background-size:5px 5px;
      background-repeat:no-repeat;
    }
    .nqThemeSelect:focus{ outline:2px solid var(--nq-accent, #dcb8ff); }
    .nqThemeSelect option{ background:#1a1330; color:#fff; }

    .nqRecolorBlock{ margin:0 0 12px 0; }
    .nqRecolorBtn{
      width:100%;
      height:46px;
      border-radius:12px;
      cursor:pointer;
      font-family:"Cafeteria","TP Cafeteria","CafeteriaBlack","Museo Sans Rounded Bold",system-ui,sans-serif;
      font-size:20px;
      font-weight:400;
      background:rgba(255,255,255,.07);
      color:rgba(255,255,255,.42);
      border:1px solid rgba(255,255,255,.16);
      transition:filter .15s ease, transform .1s ease, box-shadow .2s ease, color .2s ease;
    }
    .nqRecolorBtn:hover{ filter:brightness(1.1); }
    .nqRecolorBtn:active{ transform:translateY(1px); }
    .nqRecolorBtn.isOn{
      color:#4a3d55;
      border-color:transparent;
      background:linear-gradient(90deg,
        #ffb8d4, #ffb3ab, #ffce9e, #f0dd7a, #b6e6c1, #a8e0ea, #b6c6ff, #dcb8ff, #ffb8d4);
      background-size:200% 100%;
      animation:nqRainbow 10s linear infinite;
      box-shadow:0 3px 14px rgba(0,0,0,.26);
      text-shadow:0 1px 0 rgba(255,255,255,.5);
    }
    @keyframes nqRainbow{
      0%{ background-position:0% 50%; }
      100%{ background-position:200% 50%; }
    }
    @media (prefers-reduced-motion: reduce){
      .nqRecolorBtn.isOn{ animation:none; }
    }

    .nqBgSearch{
      display:flex; gap:6px; padding:2px;
    }
    .nqBgSearch input{
      flex:1; min-width:0; height:28px; padding:0 8px;
      border:1px solid rgba(255,255,255,.32);
      background:rgba(0,0,0,.18); color:#fff;
      border-radius:8px; outline:none; font-size:12px;
    }
    .nqBgSearch input::placeholder{ color:rgba(255,255,255,.45); }
    .nqBgSearch input:focus{ border-color:rgba(255,255,255,.55); }
    .nqBgSearch button{
      width:32px; height:28px; padding:0;
      border:1px solid rgba(255,255,255,.32);
      background:rgba(0,0,0,.18); color:#fff;
      border-radius:8px; cursor:pointer; font-size:14px;
    }
    #nqBgList{
      display:flex; flex-direction:column; gap:6px; margin-top:8px;
    }
    .nqBgItem{
      display:grid; grid-template-columns:44px 1fr auto auto;
      gap:6px; align-items:center;
      padding:4px 6px; border-radius:10px;
      background:rgba(0,0,0,.12);
      border:1px solid rgba(255,255,255,.12);
    }
    .nqBgThumb{
      width:44px; height:44px; border-radius:6px;
      background:#fff no-repeat center/cover;
      border:1px solid rgba(255,255,255,.16);
    }
    .nqBgName{
      color:rgba(255,255,255,.92); font-size:11px; line-height:1.2;
      overflow:hidden; text-overflow:ellipsis; display:-webkit-box;
      -webkit-line-clamp:2; -webkit-box-orient:vertical; word-break:break-word;
    }
    .nqBgBtn{
      width:30px; height:28px; padding:0;
      border:1px solid rgba(255,255,255,.32);
      background:rgba(0,0,0,.20); color:#fff; font-weight:900;
      border-radius:8px; cursor:pointer; font-size:12px;
    }
    .nqBgBtn:hover{ filter:brightness(1.08); }
    .nqBgBtn.isActive{ outline:2px solid var(--nq-accent, #dcb8ff); }
    .nqSmall{
      font:800 10px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
      color:rgba(255,255,255,.82);
      letter-spacing:.04em;
      margin-bottom:6px;
    }

  `;
  (document.head || document.documentElement).appendChild(style);

  const recolorStyle = document.createElement('style');
  recolorStyle.id = 'nqRecolorSite';
  recolorStyle.textContent = `
    html.nq-recolor-site.nq-page-inventory .inv-tabs-container{
      background-color: var(--nq-accent-l60, #e8a41d) !important;
    }
    html.nq-recolor-site.nq-page-inventory .inv-tabs-container::-webkit-scrollbar-track{
      background: var(--nq-accent-l60, #e8a41c) !important;
    }
    html.nq-recolor-site.nq-page-inventory .inv-tabs-container::-webkit-scrollbar-thumb{
      background: var(--nq-accent-l45, #c28001) !important;
    }
    html.nq-recolor-site.nq-page-inventory .inv-tabs-container::-webkit-scrollbar-thumb:hover{
      background: var(--nq-accent-l75, #FFB529) !important;
    }
    html.nq-recolor-site.nq-page-inventory ul.invTabs li.invTab-selected,
    html.nq-recolor-site.nq-page-inventory .invTabsCarousel .invTab-selected{
      background-color: var(--nq-accent-l45, #c18000) !important;
    }
    html.nq-recolor-site.nq-page-inventory .item-count{
      background-color: var(--nq-accent-l60, #de911a) !important;
    }
    html.nq-recolor-site.nq-page-inventory .inv-menulinks{
      background: var(--nq-accent-l45, #9F9786) !important;
    }
    html.nq-recolor-site.nq-page-inventory .container{
      background: linear-gradient(0deg,
        var(--nq-accent-l90, rgba(197,182,155,1)) 0%, #fff 100%) !important;
    }

    html.nq-recolor-site .nptoggle,
    html.nq-recolor-site .filtertoggle,
    html.nq-recolor-site .stacktoggle{
      filter:
        grayscale(1) sepia(1)
        hue-rotate(var(--nq-accent-huerot, 0deg))
        saturate(var(--nq-accent-sat, 1))
        brightness(var(--nq-accent-bright, 1));
    }

    html.nq-recolor-site .button-yellow__2020{
      background: linear-gradient(
        var(--nq-accent-l75, #f6e250), var(--nq-accent-l60, #ebb233)) !important;
      box-shadow:
        inset 0 0 0 1px var(--nq-accent-l75, rgba(246,226,80,1)),
        inset 0 -3px 2px 3px var(--nq-accent-l45, rgba(196,124,25,1)),
        inset 0 2px 0 1px rgba(253,249,220,1),
        0 0 0 2px rgba(0,0,0,1) !important;
    }
    html.nq-recolor-site .button-yellow__2020:hover,
    html.nq-recolor-site .button-yellow__2020:focus{
      background: linear-gradient(
        var(--nq-accent-l90, #ffff54), var(--nq-accent-l75, #ffd328)) !important;
    }
    html.nq-recolor-site .button-yellow__2020:active{
      background: linear-gradient(
        var(--nq-accent-l60, #ebb233), var(--nq-accent-l75, #f6e250)) !important;
    }
    html.nq-recolor-site .popup-header__2020,
    html.nq-recolor-site .popup-footer__2020{
      background: var(--nq-accent-l60, #fed123) !important;
    }

    html.nq-recolor-site .bsp-navlist,
    html.nq-recolor-site .bsp-subnav,
    html.nq-recolor-site .mkt-navlist,
    html.nq-recolor-site .mkt-subnav{
      background: linear-gradient(var(--nq-accent-l60,#e8a41d), var(--nq-accent-l45,#c18000)) !important;
    }
    html.nq-recolor-site .bsp-navlist a,
    html.nq-recolor-site .bsp-subnav__link,
    html.nq-recolor-site .mkt-navlist a,
    html.nq-recolor-site .mkt-subnav__link{
      background: linear-gradient(var(--nq-accent-l75,#f5c030), var(--nq-accent-l60,#e8a41d)) !important;
    }
    html.nq-recolor-site .bsp-navlist a:hover,
    html.nq-recolor-site .bsp-subnav__link:hover,
    html.nq-recolor-site .mkt-navlist a:hover,
    html.nq-recolor-site .mkt-subnav__link:hover{
      background: linear-gradient(var(--nq-accent-l90,#fdd040), var(--nq-accent-l75,#f5c030)) !important;
    }
    html.nq-recolor-site .mkt-navlist a.is-active,
    html.nq-recolor-site .mkt-subnav__link.is-active,
    html.nq-recolor-site .bsp-subnav__link.is-active{
      background: linear-gradient(var(--nq-accent-l30,#7a5500), var(--nq-accent-l30,#5a3d00)) !important;
    }
    html.nq-recolor-site .mkt-navlist a.is-active:hover,
    html.nq-recolor-site .mkt-subnav__link.is-active:hover,
    html.nq-recolor-site .bsp-subnav__link.is-active:hover{
      background: linear-gradient(var(--nq-accent-l45,#8a6200), var(--nq-accent-l30,#6a4800)) !important;
    }

    html.nq-recolor-site [class*="menulinks"]{
      background: var(--nq-accent-l45, #9f9786) !important;
    }
    html.nq-recolor-site [class*="menulinks"] a:hover{
      color: var(--nq-accent-l75, #fde68a) !important;
    }
    html.nq-recolor-site [class*="stats-bar"],
    html.nq-recolor-site [class*="header-bar"],
    html.nq-recolor-site [class*="headerbar"],
    html.nq-recolor-site .np-stepper-btn,
    html.nq-recolor-site .mkt-stepper .mkt-stepper__btn{
      background: var(--nq-accent-l60, #faa819) !important;
    }
    html.nq-recolor-site [class*="count-badge"]{
      background: var(--nq-accent-l60, #e8a41d) !important;
    }
    html.nq-recolor-site [class*="tick-icon"].selected,
    html.nq-recolor-site [class*="pin-btn"].is-pinned{
      background: var(--nq-accent-l60, #faa819) !important;
    }
    html.nq-recolor-site [class*="pagination-btn"]{
      background: var(--nq-accent-l90, #ffeeaf) !important;
      border-color: var(--nq-accent-l60, #c8a951) !important;
    }
    html.nq-recolor-site [class*="pagination-btn"]:hover,
    html.nq-recolor-site [class*="pagination-btn"].active,
    html.nq-recolor-site [class*="pagination-btn"].is-active,
    html.nq-recolor-site [class*="pagination-btn-active"]{
      background: var(--nq-accent-l60, #fed123) !important;
      border-color: var(--nq-accent-l45, #a07828) !important;
    }
    html.nq-recolor-site [class*="-drawer"],
    html.nq-recolor-site [class*="pin-inactive-text"]{
      background: var(--nq-accent-l90, #fcee95) !important;
    }

    html.nq-recolor-site .sdb-item-star.is-fav,
    html.nq-recolor-site .sdb-grid-fav.is-fav{
      color: var(--nq-accent-l60, #faa819) !important;
    }
    html.nq-recolor-site .sdb-item-checkbox,
    html.nq-recolor-site .sdb-auction-checkbox-row input{
      accent-color: var(--nq-accent-l60, #faa819) !important;
    }
    html.nq-recolor-site .sdb-row-selected{
      box-shadow: inset 4px 0 0 var(--nq-accent-l60, #faa819) !important;
    }
    html.nq-recolor-site .sdb-grid-item.is-selected{
      box-shadow: 0 0 0 2px var(--nq-accent-l60, #faa819) !important;
    }
    html.nq-recolor-site .sdb-as-item.is-selected{
      background: var(--nq-accent-l90, #ffe9b8) !important;
    }
    html.nq-recolor-site .shop__head{
      background: var(--nq-accent-l75, #dddd77) !important;
    }
    html.nq-recolor-site .mkt-lessons__dot.is-active{
      background: var(--nq-accent-l60, #f5c400) !important;
    }
    html.nq-recolor-site .mkt-help-tab.is-active{
      border-bottom-color: var(--nq-accent-l60, #f5c400) !important;
    }

    html.nq-recolor-site .quickstock-thead tr,
    html.nq-recolor-site .quickstock-table.np-table thead th,
    html.nq-recolor-site .quickstock-table.np-table thead th:first-child{
      background-color: var(--nq-accent-l60, #e8a41d) !important;
    }
    html.nq-recolor-site .quickstock-table.np-table thead th{
      border-bottom-color: var(--nq-accent-l45, #c48a10) !important;
    }
    html.nq-recolor-site .quickstock-table.np-table .np-table-row-even{
      background-color: var(--nq-accent-l90, #fef0ba) !important;
    }
    html.nq-recolor-site .quickstock-table.np-table tbody tr:last-child,
    html.nq-recolor-site .quickstock-table.np-table tbody tr:last-child.np-table-row-even{
      background-color: var(--nq-accent-l75, #fde68a) !important;
      border-top-color: var(--nq-accent-l45, #c48a10) !important;
    }
    html.nq-recolor-site .qs-menulinks a:hover{
      color: var(--nq-accent-l75, #fde68a) !important;
    }
    html.nq-recolor-site .quickstock-table input[type="radio"]{
      accent-color: var(--nq-accent-l45, #c48a10) !important;
    }
  `;
  (document.head || document.documentElement).appendChild(recolorStyle);

  if (document.body) mountLeftBar();
  else new MutationObserver((_, o) => { if (document.body){ mountLeftBar(); o.disconnect(); } })
    .observe(document.documentElement, { childList:true, subtree:true });

  onReady(() => {
    if (document.getElementById('nqBgHandle')) return;

    const handle = document.createElement('div');
    handle.id = 'nqBgHandle';
    handle.title = 'Click to open';
    handle.innerHTML = '<span>❮</span>';

    const sidebar = document.createElement('div');
    sidebar.id = 'nqBgSidebar';
    sidebar.innerHTML = `
      <div id="nqBgBody">
        <div class="nqThemeBlock">
          <div class="nqSmall" style="margin-bottom:4px">Button style</div>
          <select id="nqBtnTheme" class="nqThemeSelect"></select>
        </div>

        <div class="nqThemeBlock">
          <div class="nqSmall" style="margin-bottom:4px">Top bar</div>
          <select id="nqTopbarBg" class="nqThemeSelect">
            <option value="none">Transparent</option>
            <option value="tint">Tinted</option>
            <option value="blur">Frosted (default)</option>
            <option value="solid">Solid</option>
          </select>
        </div>

        <div class="nqRecolorBlock">
          <button type="button" id="nqRecolorSite" class="nqRecolorBtn" aria-pressed="false">Recolor Site</button>
        </div>

        <div class="nqBgSearch">
          <input id="nqBgQuery" type="text" placeholder="Search backgrounds…" />
        </div>
        <div id="nqBgList"></div>
      </div>
      <div id="nqBgFooter">
        <button class="nqFooterBtn" id="nqBgCancel" type="button">Cancel</button>
        <button class="nqFooterBtn primary" id="nqBgSave" type="button">Save</button>
      </div>
    `;

    (document.body || document.documentElement).append(sidebar, handle);

    const OPEN_X = 'translateX(0)';
    const CLOSED_X = 'translateX(100%)';

    let built = false;
    let isOpen = false;
    let snapshot = null;
    let session  = null;

    function openBar(){
      if (isOpen) return;
      isOpen = true;
      snapshot = {
        mainBg:   LSget(LS.mainBgId),
        leftBg:   LSget(LS.leftBarBg),
        btnTheme: NQ.getBtnTheme(),
      };
      session = { ...snapshot };
      sidebar.style.transform = OPEN_X;
      if (!built) buildUI();
      refreshThemeSelect();
    }

    function closeBar(){
      isOpen = false;
      sidebar.style.transform = CLOSED_X;
      snapshot = null;
      session = null;
    }

    function saveAndClose(){
      if (session && session.btnTheme) NQ.saveBtnTheme(session.btnTheme);
      closeBar();
    }

    function cancelAndClose(){
      if (snapshot){
        applyMainBg(snapshot.mainBg);
        applyLeftBg(snapshot.leftBg);
        if (snapshot.btnTheme) NQ.applyBtnTheme(snapshot.btnTheme);
      }
      closeBar();
    }

    handle.addEventListener('click', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      openBar();
    });

    document.addEventListener('pointerdown', (ev) => {
      if (!isOpen) return;
      const t = ev.target;
      if (!t) return;
      if (t.closest && (t.closest('#nqBgSidebar') || t.closest('#nqBgHandle'))) return;
      cancelAndClose();
    }, true);

    function refreshThemeSelect(){
      const sel = sidebar.querySelector('#nqBtnTheme');
      if (!sel) return;
      const themes = NQ.btnThemes;
      if (sel.options.length !== themes.length){
        sel.innerHTML = themes.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
      }
      const cur = (session && session.btnTheme) || NQ.getBtnTheme();
      if (cur) sel.value = cur;
    }

    function buildUI(){
      built = true;

      const saveBtn   = sidebar.querySelector('#nqBgSave');
      const cancelBtn = sidebar.querySelector('#nqBgCancel');
      const themeSel  = sidebar.querySelector('#nqBtnTheme');

      themeSel?.addEventListener('change', () => {
        if (!session) return;
        session.btnTheme = themeSel.value;
        NQ.applyBtnTheme(themeSel.value);
      });
      refreshThemeSelect();

      const topbarSel = sidebar.querySelector('#nqTopbarBg');
      if (topbarSel){
        topbarSel.value = LSget(LS.topbarBg) || 'blur';
        topbarSel.addEventListener('change', () => LSset(LS.topbarBg, topbarSel.value));
      }

      const recolorBtn = sidebar.querySelector('#nqRecolorSite');
      if (recolorBtn){
        const paintRecolorBtn = (on) => {
          recolorBtn.classList.toggle('isOn', on);
          recolorBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        };
        paintRecolorBtn(LSget(LS.recolor) === '1');
        recolorBtn.addEventListener('click', (ev) => {
          ev.preventDefault(); ev.stopPropagation();
          const on = LSget(LS.recolor) !== '1';
          document.documentElement.classList.toggle('nq-recolor-site', on);
          LSset(LS.recolor, on ? '1' : '0');
          paintRecolorBtn(on);
        });
      }

      saveBtn  .addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); saveAndClose(); });
      cancelBtn.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); cancelAndClose(); });
    }
  });

}

if (NQ.base) startBackgrounds();

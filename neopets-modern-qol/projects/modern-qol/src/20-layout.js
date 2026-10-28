  const KEEP_NATIVE_BG_PATHS = [
    '/inventory.phtml',
    '/bank.phtml',
  ];
  const THEME = `
    :root{
      --np-font: system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;

      --np-accent:#dcb8ff;
      --np-accent-text:#e3c8ff;
      --np-accent-bg:rgba(220,184,255,.14);
      --np-accent-line:rgba(220,184,255,.45);
      --np-accent-soft:rgba(220,184,255,.08);
      --np-accent-hover:rgba(220,184,255,.28);

      --np-ink:#fff;
      --np-ink-soft:rgba(255,255,255,.62);

      --np-glass:rgba(0,0,0,.22);
      --np-glass-hover:rgba(0,0,0,.30);
      --np-line:rgba(255,255,255,.16);
      --np-line-hover:rgba(255,255,255,.30);

      --np-btn:rgba(255,255,255,.06);
      --np-btn-hover:rgba(255,255,255,.10);

      --np-radius:14px;
      --np-radius-sm:10px;
      --np-shadow:0 8px 24px rgba(0,0,0,.28);
      --np-blur:8px;

      --np-bar-bg:transparent;
      --np-bar-backdrop:none;
      --np-bar-line:transparent;
      --np-bar-shadow:none;
      --np-bar-inset-left:0px;

      --np-side-icon-size:60px;

      --np-gap:10px;
      --np-col-width:330px;
      --np-hud-left:20px;
      --np-hud-top:10px;
      --np-hud-bottom:10px;
      --np-hud-width:290px;

      --np-z-bg:-2147483640;
      --np-z-bar:1000;
      --np-z-hud:1000;
      --np-z-menu:2000;
    }
  `;
  const BAR_H = 60;
  const FRAME = `
    :root{
      --np-frame-shift: var(--np-col-width, 0px);
      --np-frame-width: clamp(600px, calc(100vw - var(--np-frame-shift) - 40px), 1100px);
      --np-top-offset: 100px;
      --np-h5-gap: 0px;
      --np-frame-radius: 30px;
      --np-frame-padding: 16px;
      --np-frame-border: 2px solid #000;
      --np-bottom-spacer: 10px;
    }

    body#neobdy{ --np-h5-gap: 0px; }

    html, body {
      -ms-overflow-style: none;
      scrollbar-width: none;
      margin-top: 0 !important;
      padding-top: 0 !important;
      scroll-padding-top: var(--np-top-offset) !important;
      padding-bottom: var(--np-bottom-spacer) !important;
    }
    html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
    body::after{ content:""; display:block; height:var(--np-bottom-spacer); }

    #pushdown_banner,#ad-slug-wrapper,#ad-table,#ad-table-btf,
    .nl-instream-video,.nl-ads-leaderWrapper,#nl_ad_left,#nl_ad_right,
    [id^="pb-slot-"],#header,#navigation,#template_nav,#ban,#nst,
    #navtop__2020,#navbottom__2020,#footer,.footer,.footerNifty,
    .footer__2020,#nl_mobile_ad,.nl-ad-top,.nl-mobile-ad,.nl-ad-left,.nl-ad-right{
      display:none !important;
      visibility:hidden !important;
      height:0 !important;
      margin:0 !important;
      padding:0 !important;
      overflow:hidden !important;
    }

    td.sidebar, td.sidebar .sidebarModule{
      display:none !important;
      width:0 !important;
      height:0 !important;
      overflow:hidden !important;
    }

    #content, td.content{ width:100% !important; }

    body .navsub-left__2020,
    body .navsub-right__2020,
    body .navsub-fav-icon__2020,
    body .bookmark-dropdown__2020,
    body .bookmark-dropdown-shade__2020{
      display:none !important;
      width:0 !important; height:0 !important;
      margin:0 !important; padding:0 !important;
      overflow:hidden !important;
    }
    body #navsub-buffer__2020{
      display:none !important;
      height:0 !important; margin:0 !important; padding:0 !important;
    }

    body :where(
      #container__2020,#content,#pageContent,#contentContainer,
      #main,main,.inner-body,.content,#np-content,#alpha-inner
    ){
      width:var(--np-frame-width) !important;
      max-width: var(--np-frame-width) !important;
      margin-top: var(--np-top-offset) !important;
      margin-bottom: 0 !important;
      margin-right: auto !important;
      margin-left: max(
        calc((100vw - var(--np-frame-width)) / 2),
        var(--np-frame-shift)
      ) !important;
      padding:var(--np-frame-padding) !important;
      box-sizing:border-box !important;
      border:var(--np-frame-border) !important;
      border-radius:var(--np-frame-radius) !important;
      background-clip:padding-box !important;
    }
    html:not(.np-keep-native-bg) body :where(
      #container__2020,#content,#pageContent,#contentContainer,
      #main,main,.inner-body,.content,#np-content,#alpha-inner
    ){
      background-color:#fff !important;
      background-image:none !important;
    }

    html:not(.np-keep-native-bg) body .container.theme-bg,
    html:not(.np-keep-native-bg) body #container__2020.theme-bg,
    html:not(.np-keep-native-bg) body .container,
    html:not(.np-keep-native-bg) body .theme-bg{
      background-color:#fff !important;
      background-image:none !important;
    }

    body #container__2020{
      margin-top: calc(var(--np-top-offset) + var(--np-h5-gap)) !important;
    }

    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) > :first-child{
      margin-top:0 !important; padding-top:0 !important;
    }
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) > br:first-child,
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) > hr:first-child{
      display:none !important;
    }
    body .page-title__2020, body .inv-title-container { margin-top:0 !important; padding-top:0 !important; }
    body .page-title__2020 :is(h1,h2,h3), body .inv-title-container :is(h1,h2,h3){ margin-top:0 !important; }

    body #boardList, body #boardTopic, body #boardIndex, body #boardCreateTopic{
      margin-top:0 !important;
    }

    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner)
    :is(table,thead,tbody,tfoot,tr,td,th){
      border:0 !important; outline:0 !important; box-shadow:none !important;
      border-collapse:separate !important; border-spacing:0 !important;
    }
    html:not(.np-keep-native-bg) body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner)
    :is(table,thead,tbody,tfoot,tr,td,th){
      background-image:none !important;
    }
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) img{
      border:0 !important; outline:0 !important; box-shadow:none !important;
    }

    body#neobdy td.content > div[style*="float: right"][style*="width: 160px"]{
      display:none !important;
    }
    body#neobdy td.content > div[style*="width: 635px"]{
      width:auto !important; max-width:100% !important;
      margin-left:auto !important; margin-right:auto !important;
    }
    body#neobdy td.content::after{ content:""; display:block; clear:both; }

    html body .inv-menubar,
    html body .sdb-menubar,
    html body .closet-menubar,
    html body .quickstock-menubar,
    html body .gallery-menubar{
      display:flex !important;
      visibility:visible !important;
      opacity:1 !important;
      background:transparent !important;
      height:auto !important;
      width:auto !important;
      overflow:visible !important;
      pointer-events:auto !important;
    }
    html body .page-title__2020,
    html body .inv-title-container{
      position:relative !important;
    }
    html body .inv-menubar{
      position:absolute !important;
      top:50% !important;
      right:24px !important;
      transform:translateY(-50%) !important;
      gap:8px !important;
    }
    html:root body .inv-menubar{
      position:static !important;
      transform:none !important;
      flex-wrap:wrap !important;
      justify-content:flex-end !important;
      row-gap:6px !important;
      column-gap:8px !important;
      margin:0 !important;
    }
    html:root body [class*="-menulinks"]{
      margin-bottom:0 !important;
    }
    html:root body :is(.quickstock-menubar, .gallery-menubar){
      display:flex !important;
      visibility:visible !important;
      opacity:1 !important;
      height:auto !important;
      width:auto !important;
      overflow:visible !important;
      pointer-events:auto !important;
    }
    html body .inv-filtericons{
      visibility:visible !important;
      opacity:1 !important;
      position:relative !important;
      z-index:50 !important;
    }

    body :is(
      .sdb-header-back, .sdb-header-description,
      .inv-header-back, .inv-header-description,
      .closet-header-back, .closet-header-description,
      .quickstock-header-back, .quickstock-menubar, .quickstock-header-description,
      .gallery-header-back, .gallery-menubar, .gallery-header-description,
      .back-button-circle__2020,
      #pageDesc, #qs-instructions,
      #bdHeader,
      .social-links, .fb-like, .fb_iframe_widget, #fb-root,
      .twitter-share-button, .twitter-follow-button
    ){
      display:none !important;
    }
    body iframe[src*="facebook.com/plugins"],
    body iframe[src*="platform.twitter.com"],
    body iframe[title*="Facebook Social Plugin" i],
    body iframe[title*="Twitter" i]{
      display:none !important;
    }
    body [class$="-menubar"],
    body [class$="-header-back"],
    body [class$="-header-description"]{
      display:none !important;
    }
    body :is(.sdb-header, .inv-header, .closet-header, .quickstock-header, .qs-page-header){
      padding-top:0 !important;
      margin-top:0 !important;
    }
    body :is(.sdb-header-title-row, .inv-header-title-row, .closet-header-title-row, .qs-title-container){
      justify-content:center !important;
      padding-top:0 !important;
      margin-top:0 !important;
    }
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner){
      min-height:var(--np-frame-minh, calc(50vh + 80px)) !important;
      padding-bottom:var(--np-frame-padding) !important;
    }

    body .community-wood-left,
    body .community-wood-right{
      display:none !important;
    }

    body#neobdy #main #content{
      border:0 !important;
      border-radius:0 !important;
      width:100% !important;
      max-width:none !important;
      margin:0 !important;
      padding:24px !important;
    }
    body#neobdy td.content{
      border:0 !important;
      border-radius:0 !important;
      width:100% !important;
      max-width:none !important;
      margin:0 !important;
      padding:0 !important;
    }

    @media (max-width: 1100px){
      :root{ --np-frame-radius: 20px; --np-frame-padding: 12px; }
    }
    @media (max-width: 900px){
      :root{
        --np-frame-radius: 14px;
        --np-frame-padding: 10px;
        --np-top-offset: 80px;
        --np-frame-shift: 0px;
      }
    }
  `;
  const KILL = [
    '#pushdown_banner','#ad-slug-wrapper','#ad-table','#ad-table-btf',
    '.nl-instream-video','.nl-ads-leaderWrapper','#nl_ad_left','#nl_ad_right',
    '[id^="pb-slot-"]','#header','#navigation','#template_nav','#ban','#nst',
    '#navtop__2020','#navbottom__2020','#footer','.footer','.footerNifty','.footer__2020',
    '#nl_mobile_ad','.nl-ad-top','.nl-mobile-ad','.nl-ad-left','.nl-ad-right',
    'td.sidebar','td.sidebar .sidebarModule'
  ];
  const mkLink = (attrs) => { const el = document.createElement('link'); Object.assign(el, attrs); (document.head || document.documentElement).append(el); };
  const TOPBAR_ICON_NAMES = {
    community: 'community',
    games:     'games',
    explore:   'explore',
    shop:      'shop',
    premium:   'premium',
    quests:    'quests',
    bell:      'bell',
    search:    'search',
  };
  const BASIC_ICON_BASE = 'https://images.neopets.com/themes/h5/basic/images/';
  const menus = {
    community:[
      ['/community/index.phtml','Community Central','basic:communitycentral'],
      ['/neomessages.phtml','Neomail','neomail'],
      ['/neoboards/index.phtml','Neoboards','basic:neoboards'],
      ['/contests.phtml','Spotlights','basic:spotlights'],
      ['/guilds/index.phtml','Guilds','basic:guilds'],
    ],
    games:[
      ['/games/','Games Room','basicsvg:gamesroom'],
      ['/dome/','Battledome','basic:battledome'],
      ['/games/hiscores.phtml','High Scores','games'],
      ['/faeriefragments/','Faerie Fragments','basic:fragments'],
      ['/talesofdacardia/','Tales of Dacardia','basic:tada'],
    ],
    explore:[
      ['/explore.phtml','Explore Neopia','basicsvg:explore'],
      ['/tvw/','The Void Within','basic:tvw'],
      ['/giftsfromtherift/index.phtml','Gifts from the Rift','https://images.neopets.com/plots/tvw/nc/gifts-from-rift-icon.png'],
      ['/prizepass/adventure/','Adventure Pass','basic:prizepass'],
    ],
    shop:[
      ['/shops/wizard.phtml','Shop Wizard','basic:shopwizard'],
      ['/market.phtml?type=your','My Shop','basic:myshop'],
      ['/auctions.phtml','Auctions','basic:auction'],
      ['/island/tradingpost.phtml','Trading Post','basic:tradingpost'],
      ['/bank.phtml','Bank','shop'],
      ['/space/warehouse/prizecodes.phtml','Redeem Codes','basic:redeemcode'],
      '---',
      ['https://ncmall.neopets.com/mall/shop.phtml?layout=new','NC Mall','basic:ncmall'],
      ['https://secure.nc.neopets.com/get-neocash','Buy NC','basic:buync'],
      ['https://secure.nc.neopets.com/redeemnc','Redeem NC Cards','basic:redeemnc'],
      ['https://shop.neopets.com/','Merch Shop','basic:merch'],
      ['/shopping/index.phtml','Merch Partners','basic:merchshop'],
      ['/games/we/','Shenanigifts','basic:shenanigifts'],
      ['/mall/stylingstudio/','Styling Studio','basic:stylingstudio'],
      ['https://ncmall.neopets.com/mall/shop.phtml?page=wonderclaw','Wonderclaw','basic:wonderclaw'],
    ],
  };
  function isFixedIconSpec(spec){
    return typeof spec === 'string' && (
      spec.startsWith('http') ||
      spec.startsWith('basic:') ||
      spec.startsWith('basicsvg:')
    );
  }
  const TOPBAR_CUSTOM_LS = 'npqol_topbar_custom_v1';
  function loadAllCustom(){
    try {
      const raw = localStorage.getItem(TOPBAR_CUSTOM_LS);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }
  function saveAllCustom(data){
    try { localStorage.setItem(TOPBAR_CUSTOM_LS, JSON.stringify(data)); } catch {}
  }
  function getCustom(catId){
    const all = loadAllCustom();
    return all[catId] || { removed: [], added: [] };
  }
  function setCustom(catId, custom){
    const all = loadAllCustom();
    all[catId] = custom;
    saveAllCustom(all);
  }
  function effectiveMenuEntries(catId){
    const defaults = menus[catId] || [];
    const custom = getCustom(catId);
    const removed = new Set(custom.removed || []);
    const kept = defaults.filter(e => {
      if (e === '---') return true;
      return !removed.has(e[0]);
    });
    const added = (custom.added || []).map(it => [it.href, it.label, it.iconSpec || catId]);
    if (!added.length) return kept;
    const needSep = kept.length && kept[kept.length - 1] !== '---';
    return needSep ? [...kept, '---', ...added] : [...kept, ...added];
  }
  let closeTimer = null;

function startLayout() {
  if (document.getElementById('np-core-layout')) return;

  if (KEEP_NATIVE_BG_PATHS.some(p => location.pathname.startsWith(p))) {
    document.documentElement.classList.add('np-keep-native-bg');
  }

  (function exposeBtnThemes(){
    const BTN_THEMES = [
      { id:'winterholiday',     label:'Winter Holiday',     pattern:'https://images.neopets.com/themes/h5/winterholiday/images/{icon}-icon.png' },
      { id:'basic',             label:'Basic',              pattern:'https://images.neopets.com/themes/h5/basic/images/v3/{icon}-icon.svg' },
      { id:'premium',           label:'Premium',            pattern:'https://images.neopets.com/themes/h5/premium/images/{icon}-icon.svg' },
      { id:'altadorcup',        label:'Altador Cup',        pattern:'https://images.neopets.com/themes/h5/altadorcup/images/{icon}-icon.png' },
      { id:'constellations',    label:'Constellations',     pattern:'https://images.neopets.com/themes/h5/constellations/images/{icon}-icon.svg' },
      { id:'birthday',          label:'Birthday',           pattern:'https://images.neopets.com/themes/h5/birthday/images/{icon}-icon.png' },
      { id:'destroyedfestival', label:'Faerie Festival',    pattern:'https://images.neopets.com/themes/h5/destroyedfestival/images/{icon}-icon.svg' },
      { id:'neggs',             label:'Festival of Neggs',  pattern:'https://images.neopets.com/themes/h5/neggs/images/{icon}-icon.svg' },
      { id:'grey',              label:'Grey Day',           pattern:'https://images.neopets.com/themes/h5/grey/images/{icon}-icon.png' },
      { id:'newyears',          label:'New Year',           pattern:'https://images.neopets.com/themes/h5/newyears/images/{icon}-icon.png' },
      { id:'hauntedwoods',      label:'Haunted Woods',      pattern:'https://images.neopets.com/themes/h5/hauntedwoods/images/{icon}-icon.svg' },
      { id:'meridell',          label:'Meridell',           pattern:'https://images.neopets.com/themes/h5/meridell/images/{icon}-icon.svg' },
      { id:'mysteryisland',     label:'Mystery Island',     pattern:'https://images.neopets.com/themes/h5/mysteryisland/images/{icon}-icon.png' },
      { id:'neopiantimes',      label:'Neopian Times',      pattern:'https://images.neopets.com/themes/h5/neopiantimes/images/{icon}-icon.svg' },
      { id:'neggsneovia',       label:'Neovian Neggs',      pattern:'https://images.neopets.com/themes/h5/neggsneovia/images/{icon}-icon.svg' },
      { id:'tistheseason',      label:'Tis the Season',     pattern:'https://images.neopets.com/themes/h5/tistheseason/images/{icon}-icon.png' },
      { id:'tyrannia',          label:'Tyrannia',           pattern:'https://images.neopets.com/themes/h5/tyrannia/images/{icon}-icon.svg' },
      { id:'valentines',        label:'Valentines',         pattern:'https://images.neopets.com/themes/h5/valentines/images/{icon}-icon.svg' },
    ];
    const FALLBACK_PATTERN = 'https://images.neopets.com/themes/h5/basic/images/v3/{icon}-icon.svg';
    const LS_KEY = 'npqol_btn_theme_v1';
    const DEFAULT = 'constellations';

    NQ.btnThemesData = { BTN_THEMES, FALLBACK_PATTERN, LS_KEY, DEFAULT };
    NQ.btnThemes = BTN_THEMES.map(t => ({ id: t.id, label: t.label }));

    NQ.getBtnTheme = () => {
      try { return localStorage.getItem(LS_KEY) || DEFAULT; }
      catch { return DEFAULT; }
    };
    const themeListeners = [];
    NQ.onBtnTheme = (fn) => { themeListeners.push(fn); };
    NQ.applyBtnTheme = (id) => {
      themeListeners.forEach(fn => { try { fn(id); } catch {} });
    };
    NQ.saveBtnTheme = (id) => {
      try { localStorage.setItem(LS_KEY, id); } catch {}
      NQ.applyBtnTheme(id);
    };

    NQ.btnIconUrl = (iconName, themeId) => {
      const t = BTN_THEMES.find(x => x.id === themeId) || BTN_THEMES.find(x => x.id === DEFAULT);
      return (t || { pattern: FALLBACK_PATTERN }).pattern.replace('{icon}', iconName);
    };

    NQ.btnFallbackChain = [
      'https://images.neopets.com/themes/h5/basic/images/v3/{icon}-icon.svg',
      'https://images.neopets.com/themes/h5/basic/images/{icon}-icon.svg',
      'https://images.neopets.com/themes/h5/basic/images/{icon}-icon.png',
    ];
    NQ.attachBtnFallback = (img, iconName) => {
      if (!img || !iconName) return;
      const tried = new Set();
      let extSwapped = false;
      let chainStep = 0;
      img.onerror = () => {
        const current = img.src || '';
        tried.add(current);

        if (!extSwapped){
          extSwapped = true;
          const m = current.match(/^(.+\/)([^\/]+)-icon\.(svg|png)(\?.*)?$/i);
          if (m){
            const altExt = m[3].toLowerCase() === 'png' ? 'svg' : 'png';
            const altUrl = `${m[1]}${iconName}-icon.${altExt}`;
            if (!tried.has(altUrl)){
              img.src = altUrl;
              return;
            }
          }
        }

        const chain = NQ.btnFallbackChain || [];
        while (chainStep < chain.length){
          const next = chain[chainStep++].replace('{icon}', iconName);
          if (!tried.has(next)){
            img.src = next;
            return;
          }
        }
        img.onerror = null;
      };
    };
  })();

  (function exposeAccent(){
    const LS_KEY = 'npqol_accent_v1';
    const DEFAULT_HEX = '#dcb8ff';

    function hexToRgb(hex){
      let h = String(hex || '').replace('#','').trim();
      if (h.length === 3) h = h.split('').map(c => c+c).join('');
      const n = parseInt(h, 16);
      if (!Number.isFinite(n) || h.length !== 6) return { r:220, g:184, b:255 };
      return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
    }
    const rgba = (hex, a) => { const {r,g,b} = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };

    function hexToHsl(hex){
      const { r, g, b } = hexToRgb(hex);
      const rr = r/255, gg = g/255, bb = b/255;
      const max = Math.max(rr,gg,bb), min = Math.min(rr,gg,bb), d = max - min;
      const l = (max + min) / 2;
      let h = 0, s = 0;
      if (d){
        s = l > 0.5 ? d/(2 - max - min) : d/(max + min);
        switch (max){
          case rr: h = (gg - bb)/d + (gg < bb ? 6 : 0); break;
          case gg: h = (bb - rr)/d + 2; break;
          default: h = (rr - gg)/d + 4; break;
        }
        h *= 60;
      }
      return { h, s, l };
    }
    const NEO_GOLD_HUE = 40;

    function setCSSVars(hex){
      const root = document.documentElement;
      root.style.setProperty('--np-accent',       hex);
      root.style.setProperty('--np-accent-bg',    rgba(hex, .14));
      root.style.setProperty('--np-accent-line',  rgba(hex, .45));
      root.style.setProperty('--np-accent-soft',  rgba(hex, .08));
      root.style.setProperty('--np-accent-hover', rgba(hex, .28));
      root.style.setProperty('--np-accent-r', String(hexToRgb(hex).r));
      root.style.setProperty('--np-accent-g', String(hexToRgb(hex).g));
      root.style.setProperty('--np-accent-b', String(hexToRgb(hex).b));

      const { h, s, l } = hexToHsl(hex);
      const sPct = Math.round(s * 100);
      const shade = (L) => `hsl(${h.toFixed(1)}, ${sPct}%, ${L}%)`;
      root.style.setProperty('--np-accent-l90', shade(90));
      root.style.setProperty('--np-accent-l75', shade(75));
      root.style.setProperty('--np-accent-l60', shade(60));
      root.style.setProperty('--np-accent-l45', shade(45));
      root.style.setProperty('--np-accent-l30', shade(30));

      const textL = Math.max(l, 0.82);
      root.style.setProperty('--np-accent-text', `hsl(${h.toFixed(1)}, ${sPct}%, ${Math.round(textL * 100)}%)`);

      const rot = ((h - NEO_GOLD_HUE) % 360 + 360) % 360;
      root.style.setProperty('--np-accent-huerot', rot.toFixed(1) + 'deg');
      root.style.setProperty('--np-accent-sat',    Math.min(6, s / 0.244).toFixed(2));
      root.style.setProperty('--np-accent-bright', (0.6 + 0.7 * l).toFixed(2));
    }

    function getAccent(){
      try { return localStorage.getItem(LS_KEY) || DEFAULT_HEX; }
      catch { return DEFAULT_HEX; }
    }
    function applyAccent(hex){
      hex = (/^#[0-9a-fA-F]{3,8}$/.test(hex||'')) ? hex : DEFAULT_HEX;
      setCSSVars(hex);
      accentListeners.forEach(fn => { try { fn(hex); } catch {} });
    }

    const accentListeners = [];
    NQ.onAccent = (fn) => { accentListeners.push(fn); };
    NQ.getAccent = getAccent;
    NQ.applyAccent = applyAccent;

    applyAccent(getAccent());
  })();

  const style = document.createElement('style');
  style.id = 'np-core-layout';
  style.textContent = THEME + FRAME;
  (document.head || document.documentElement).appendChild(style);

  const killStyle = document.createElement('style');
  killStyle.id = 'np-kill-native';
  killStyle.textContent = KILL.join(',\n') + `{
    display:none !important;
    visibility:hidden !important;
    height:0 !important;
    width:0 !important;
    overflow:hidden !important;
    pointer-events:none !important;
  }`;
  (document.head || document.documentElement).appendChild(killStyle);

  mkLink({ rel:'preconnect', href:'https://images.neopets.com', crossorigin:'' });
  mkLink({ rel:'dns-prefetch', href:'//images.neopets.com' });

  const host = document.createElement('div');
  host.id = 'npx-host';
  Object.assign(host.style, { position:'fixed', top:'0', left:'0', right:'0', zIndex:'2000', pointerEvents:'none' });
  const barRoot = host.attachShadow({ mode:'open' });

  const barStyle = document.createElement('style');
  barStyle.textContent = `
    :host, :host * { box-sizing:border-box; }
    .bar, .bar *, .menu, .menu *{
      font-family: var(--np-font, system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif);
      font-size:15px; -webkit-font-smoothing:antialiased;
    }
    .bar{
      height:${BAR_H}px;
      position:relative;
      background:transparent;
      display:flex; align-items:center; justify-content:center;
      overflow:visible;
      pointer-events:none;
    }
    .bar::before{
      content:"";
      position:absolute;
      top:0; right:0; bottom:0;
      left:var(--np-bar-inset-left, 0px);
      background:var(--np-bar-bg, transparent);
      -webkit-backdrop-filter:var(--np-bar-backdrop, none);
      backdrop-filter:var(--np-bar-backdrop, none);
      border-bottom:1px solid var(--np-bar-line, transparent);
      box-shadow:var(--np-bar-shadow, none);
      pointer-events:none;
    }
    .inner{ position:relative; z-index:1; }
    .inner, .left{ pointer-events:none; }
    .left > *, .menu{ pointer-events:auto; }
    .inner{
      display:grid;
      grid-template-columns:1fr !important;
      align-items:center; width:100%;
      padding:0 18px 0 var(--np-col-width, 240px) !important; gap:10px;
    }
    .left{ grid-column:1 !important; display:flex; align-items:center; gap:2px !important; justify-content:center !important; }

    .btn{
      display:flex; align-items:center; text-decoration:none; cursor:pointer; user-select:none;
      position: relative; gap: 10px !important; padding: 9px 15px !important; border-radius: 999px !important; color: var(--npp-nav-fg, #fff) !important; text-shadow: var(--npp-nav-shadow, 0 1px 3px rgba(0,0,0,.55), 0 1px 1px rgba(0,0,0,.4)) !important; -webkit-text-stroke: var(--npp-nav-stroke, 0 transparent); paint-order: stroke fill; transition: background .18s, box-shadow .18s !important;
    }
    .btn, .btn span { font-family: 'CafeteriaBlack', Georgia, serif !important; font-size: 24px !important; font-weight: 400 !important; letter-spacing: .01em; }
    .btn span { display: inline !important; }
    .btn:hover{ background: var(--npp-nav-hover, rgba(255,255,255,.2)) !important; box-shadow: inset 0 0 0 1px var(--npp-nav-ring, rgba(255,255,255,.25)); }
    .btn img{ display:block; width: 30px !important; height: 30px !important; filter: var(--npp-nav-icon-filter, drop-shadow(0 1px 2px rgba(0,0,0,.3))); }
    .btn.cat::before { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 8px; }
    .btn.fight img{ width:68px; height:68px; }

    .menu{
      position:fixed; top:${BAR_H + 6}px; left:0; display:none;
      max-width:min(640px,92vw); z-index:2000;
      min-width: 264px !important; padding: 8px !important; overflow: visible; border: 1px solid rgba(255,255,255,.2) !important; border-radius: var(--npp-menu-radius, 0 0 16px 16px) !important; background: rgba(14,12,22,.2) !important; -webkit-backdrop-filter: blur(18px) saturate(1.2) !important; backdrop-filter: blur(18px) saturate(1.2) !important; box-shadow: 0 18px 44px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.08) !important; margin-top: var(--npp-menu-lift, 0px);
    }
    .menu::before { content: ""; position: absolute; inset: -24px; z-index: -1; background: linear-gradient(rgba(14,12,22,.38), rgba(14,12,22,.38)), var(--npLeftBarImg, none) center / cover no-repeat, var(--npLeftBarSolid, #2a292e); filter: blur(14px) saturate(1.15); clip-path: inset(24px round var(--npp-menu-radius, 0 0 16px 16px)); pointer-events: none; }
    .menu::after { content: ""; display: var(--npp-menu-caret, none); position: absolute; top: -7px; left: 50%; width: 12px; height: 12px; margin-left: -6px; transform: rotate(45deg); background: rgba(40,36,52,.92); border-left: 1px solid rgba(255,255,255,.2); border-top: 1px solid rgba(255,255,255,.2); border-radius: 3px 0 0 0; pointer-events: none; }
    .menu a{
      display:flex; align-items:center; text-decoration:none;
      gap: 14px !important; margin-bottom: 2px; padding: 11px 14px !important; border-radius: 12px !important; transition: background .18s, transform .18s cubic-bezier(.3,1.4,.5,1) !important;
    }
    .menu a, .menu a span { font-family: 'CafeteriaBlack', Georgia, serif !important; font-size: 21px !important; font-weight: 400 !important; color: #fff !important; text-shadow: 0 2px 4px rgba(0,0,0,.85), 0 1px 1px rgba(0,0,0,.9) !important; }
    .menu a:hover{ background: linear-gradient(90deg, var(--np-accent-hover, rgba(255,255,255,.14)), var(--np-accent-soft, rgba(255,255,255,.04))), rgba(255,255,255,.07) !important; transform: translateX(3px); }
    .menu a:hover span { color: #fff !important; }
    .menu a img{ display:block; flex:0 0 auto; width: 28px !important; height: 28px !important; filter: drop-shadow(0 2px 3px rgba(0,0,0,.7)); transition: transform .22s cubic-bezier(.3,1.6,.5,1); }
    .menu a:hover img { transform: scale(1.14) rotate(-5deg); }
    .menu a span{ flex:1 1 auto; white-space:nowrap; }
    .menu .menuSep{ height:1px; margin: 6px 4px !important; background: rgba(255,255,255,.1) !important; }

    .menu a{ position:relative; }
    .menu a .menuTrash{
      position:absolute; top:50%; right:6px;
      transform:translateY(-50%);
      width:22px; height:22px; padding:0;
      border:0; border-radius:50%;
      background:rgba(255,80,80,.15);
      color:#ff8080; font-size:14px; font-weight:900;
      line-height:1; cursor:pointer;
      align-items:center; justify-content:center;
    }
    .menu .menuTrash, .menu .menuAddRow { display: none !important; }
    .menu.np-edit-mode .menuTrash { display: flex !important; opacity: 1 !important; }
    .menu.np-edit-mode .menuAddRow { display: block !important; }
    .menu a .menuTrash:hover{
      background:#ff5a5a; color:#fff;
    }

    .menu .menuAddRow{
      margin-top:6px;
      padding-top:6px;
      border-top:1px solid rgba(255,255,255,.10);
    }
    .menu .menuActions{
      display:flex; gap:6px;
    }
    .menu .menuActions[hidden]{ display:none; }
    .menu .menuAddBtn,
    .menu .menuResetBtn{
      flex:1; padding:6px 8px;
      border:1px dashed rgba(255,255,255,.28);
      background:transparent;
      color:rgba(255,255,255,.7); font:inherit; font-size:11px; font-weight:700;
      border-radius:var(--np-radius-sm, 10px);
      cursor:pointer;
      text-align:center;
      box-sizing:border-box;
    }
    .menu .menuAddBtn:hover{
      background:var(--np-accent-bg);
      color:#fff;
      border-color:var(--np-accent-line);
    }
    .menu .menuResetBtn:hover{
      background:rgba(255,180,180,.10);
      color:#ffb4b4;
      border-color:rgba(255,180,180,.45);
    }
    .menu .menuAddForm{
      display:flex; flex-direction:column; gap:6px;
      padding:6px;
    }
    .menu .menuAddForm[hidden]{ display:none; }
    .menu .menuAddForm input{
      width:100%; box-sizing:border-box;
      height:28px; padding:0 8px;
      border:1px solid rgba(255,255,255,.22);
      background:rgba(0,0,0,.22);
      color:#fff; font:inherit; font-size:12px;
      border-radius:8px; outline:0;
    }
    .menu .menuAddForm input:focus{ border-color:var(--np-accent, #dcb8ff); }
    .menu .menuAddForm input::placeholder{ color:rgba(255,255,255,.4); }
    .menu .menuAddBtns{ display:flex; gap:6px; }
    .menu .menuAddBtns button{
      flex:1; height:26px; padding:0 8px;
      border:1px solid rgba(255,255,255,.22);
      background:rgba(0,0,0,.18);
      color:#fff; font:inherit; font-weight:700; font-size:11px;
      border-radius:8px; cursor:pointer;
    }
    .menu .menuAddBtns button.menuAddOk{
      background:var(--np-accent, #dcb8ff);
      color:var(--npp-accent-fg, #1a1330);
      border-color:transparent;
    }
    .menu .menuAddBtns button:hover{ filter:brightness(1.1); }

    @media (max-width: 1500px) { .btn { padding: 9px 10px !important; } .btn, .btn span { font-size: 21px !important; } .btn img { width: 26px !important; height: 26px !important; } }
    @media (max-width: 1250px) { .btn { padding: 8px 7px !important; } .btn, .btn span { font-size: 19px !important; } }
    @media (max-width: 1400px) { .left { gap: 0 !important; } .btn { gap: 6px !important; } .btn img { width: 24px !important; height: 24px !important; } }
  `;
  barRoot.appendChild(barStyle);

  const _initialTheme = NQ.getBtnTheme();
  const _iconUrl = NQ.btnIconUrl;
  const icons = Object.fromEntries(
    Object.entries(TOPBAR_ICON_NAMES).map(([key, iconName]) => [key, _iconUrl(iconName, _initialTheme)])
  );

  function resolveMenuIconSrc(spec, themeId){
    if (typeof spec !== 'string') return '';
    if (spec.startsWith('http')) return spec;
    if (spec.startsWith('basicsvg:')) return BASIC_ICON_BASE + spec.slice(9) + '-icon.svg';
    if (spec.startsWith('basic:'))    return BASIC_ICON_BASE + spec.slice(6) + '-icon.png';
    return _iconUrl(spec, themeId);
  }

  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.innerHTML = `
    <div class="inner">
      <div class="left">
        <a class="btn cat" data-id="community"><img src="${icons.community}" data-icon="community" alt=""><span>Community</span></a>
        <a class="btn cat" data-id="games"><img src="${icons.games}" data-icon="games" alt=""><span>Games</span></a>
        <a class="btn cat" data-id="explore"><img src="${icons.explore}" data-icon="explore" alt=""><span>Explore</span></a>
        <a class="btn cat" data-id="shop"><img src="${icons.shop}" data-icon="shop" alt=""><span>Shop</span></a>
        <a class="btn" href="https://nc.neopets.com/membership/"><img src="${icons.premium}" data-icon="premium" alt=""><span>Premium</span></a>
        <a class="btn" href="https://www.neopets.com/questlog/" title="Quest Log"><img src="${icons.quests}" data-icon="quests" alt="Quests"><span>Quests</span></a>
      </div>
    </div>
  `;
  barRoot.appendChild(bar);

  function armTopbarIcons(scope){
    const attachFb = NQ.attachBtnFallback;
    const target = scope || barRoot;
    target.querySelectorAll('img[data-icon]').forEach(img => {
      const name = img.dataset.icon;
      if (!name) return;
      if (typeof attachFb === 'function') attachFb(img, name);
      if (img.complete && img.naturalWidth === 0){
        const cur = img.getAttribute('src') || '';
        if (cur){
          img.src = '';
          img.src = cur;
        }
      }
    });
  }
  armTopbarIcons(bar);

  function buildMenuHTML(catId){
    const entries = effectiveMenuEntries(catId);
    const itemsHTML = entries.map(entry => {
      if (entry === '---') return `<div class="menuSep"></div>`;
      const [href, label, iconSpec] = entry;
      const safeLabel = String(label).replace(/[<>]/g, '');
      const safeHref = String(href).replace(/"/g, '&quot;');
      const fixed = isFixedIconSpec(iconSpec);
      const src = resolveMenuIconSrc(iconSpec, _initialTheme);
      const attr = fixed
        ? `data-icon-fixed="${String(iconSpec).replace(/"/g, '&quot;')}"`
        : `data-icon="${iconSpec}"`;
      return `
        <a href="${safeHref}" data-href="${safeHref}">
          <img src="${src}" ${attr} alt="">
          <span>${safeLabel}</span>
          <button type="button" class="menuTrash" title="Remove this link" aria-label="Remove">×</button>
        </a>`;
    }).join('');
    return itemsHTML + `
      <div class="menuAddRow">
        <div class="menuActions">
          <button type="button" class="menuResetBtn" data-cat="${catId}" title="Restore the default links">Reset</button>
          <button type="button" class="menuAddBtn" data-cat="${catId}" title="Add a link">+ Add link</button>
        </div>
        <form class="menuAddForm" data-cat="${catId}" hidden>
          <input type="text" name="label" placeholder="Link name" required>
          <input type="url" name="href" placeholder="https://www.neopets.com/..." required>
          <div class="menuAddBtns">
            <button type="button" class="menuAddCancel">Cancel</button>
            <button type="submit" class="menuAddOk">Add</button>
          </div>
        </form>
      </div>
    `;
  }

  function rerenderMenu(catId){
    const m = dd[catId];
    if (!m) return;
    m.innerHTML = buildMenuHTML(catId);
    wireMenuActions(catId);
    armTopbarIcons(m);
  }

  function wireMenuActions(catId){
    const m = dd[catId];
    if (!m) return;
    m.querySelectorAll('.menuTrash').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const a = btn.closest('a[data-href]');
        if (!a) return;
        const href = a.getAttribute('data-href');
        const custom = getCustom(catId);
        const inAdded = (custom.added || []).findIndex(x => x.href === href);
        if (inAdded >= 0){
          custom.added.splice(inAdded, 1);
        } else {
          custom.removed = custom.removed || [];
          if (!custom.removed.includes(href)) custom.removed.push(href);
        }
        setCustom(catId, custom);
        rerenderMenu(catId);
      });
    });
    const actions = m.querySelector('.menuActions');
    const addBtn  = m.querySelector('.menuAddBtn');
    const resetBtn = m.querySelector('.menuResetBtn');
    const form    = m.querySelector('.menuAddForm');
    const cancel  = m.querySelector('.menuAddCancel');

    if (addBtn && form && actions){
      addBtn.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        actions.hidden = true;
        form.hidden = false;
        form.querySelector('input[name="label"]')?.focus();
      });
    }
    if (resetBtn){
      resetBtn.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const custom = getCustom(catId);
        const hasChanges = (custom.removed?.length || 0) + (custom.added?.length || 0) > 0;
        if (!hasChanges) return;
        if (!confirm(`Restore the default links for "${catId}"?\nThis will also remove the custom links you added.`)) return;
        setCustom(catId, { removed: [], added: [] });
        rerenderMenu(catId);
      });
    }
    if (cancel && actions){
      cancel.addEventListener('click', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        form.hidden = true;
        actions.hidden = false;
        form.reset();
      });
    }
    if (form){
      form.addEventListener('submit', (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const label = form.querySelector('input[name="label"]').value.trim();
        const href  = form.querySelector('input[name="href"]').value.trim();
        if (!label || !href) return;
        if (!/^(https?:\/\/|\/)/i.test(href)){
          alert('Link URL must start with http://, https://, or / (e.g. /shops/wizard.phtml).');
          return;
        }
        const custom = getCustom(catId);
        custom.added = custom.added || [];
        custom.added.push({ href, label, iconSpec: catId });
        setCustom(catId, custom);
        rerenderMenu(catId);
      });
    }
  }

  const dd = {};
  Object.keys(menus).forEach(id => {
    const m = document.createElement('div');
    m.className = 'menu';
    m.id = `menu-${id}`;
    m.innerHTML = buildMenuHTML(id);
    dd[id] = m;
    barRoot.appendChild(m);
    wireMenuActions(id);
    armTopbarIcons(m);
  });

  document.documentElement.appendChild(host);

  function applyTopbarTheme(themeId){
    const iconUrl      = NQ.btnIconUrl;
    const attachFb     = NQ.attachBtnFallback;
    const all = barRoot.querySelectorAll('img[data-icon]');
    all.forEach(img => {
      const name = img.dataset.icon;
      if (!name) return;
      if (typeof attachFb === 'function') attachFb(img, name);
      const newUrl = iconUrl(name, themeId);
      const broken = img.complete && img.naturalWidth === 0;
      if (img.src === newUrl && !broken) return;
      img.src = '';
      img.src = newUrl;
    });
  }
  NQ.onBtnTheme((id) => {
    if (id) applyTopbarTheme(id);
  });

  const rearmTopbar = () => { try { armTopbarIcons(barRoot); } catch {} };
  window.addEventListener('pageshow', rearmTopbar);
  window.addEventListener('load',     rearmTopbar);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') rearmTopbar();
  });

  function positionMenuUnder(btnEl, menuEl){
    menuEl.style.display = 'block';
    menuEl.style.visibility = 'hidden';
    const mw = menuEl.getBoundingClientRect().width || 220;
    const b  = btnEl.getBoundingClientRect();
    const br = host.getBoundingClientRect();
    const vw = window.innerWidth;
    const pad = 8;
    let left = Math.round(b.left + b.width/2 - mw/2);
    if (left < pad) left = pad;
    if (left + mw > vw - pad) left = vw - mw - pad;
    menuEl.style.left = left + 'px';
    menuEl.style.top  = Math.round(br.bottom) + 'px';
    menuEl.style.visibility = '';
  }
  function closeAll(exceptId){
    Object.keys(dd).forEach(id => { if (id !== exceptId) dd[id].style.display = 'none'; });
  }
  const TOUCH_LIKE = (() => {
    try { return window.matchMedia('(hover: none)').matches; } catch { return false; }
  })();
  function bindHover(btn){
    const id = btn.getAttribute('data-id');
    const menu = dd[id]; if (!menu) return;
    const open = () => { closeAll(id); positionMenuUnder(btn, menu); menu.style.display='block'; };
    const scheduleClose = () => { clearTimeout(closeTimer); closeTimer = setTimeout(() => { menu.style.display='none'; }, 140); };
    const cancelClose = () => { clearTimeout(closeTimer); };
    btn.addEventListener('pointerenter', open);
    btn.addEventListener('pointerleave', scheduleClose);
    menu.addEventListener('pointerenter', cancelClose);
    menu.addEventListener('pointerleave', scheduleClose);
    if (TOUCH_LIKE){
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (menu.style.display === 'block') menu.style.display = 'none';
        else open();
      });
    }
  }
  barRoot.querySelectorAll('.btn.cat').forEach(bindHover);
  window.addEventListener('resize', () => closeAll());
  document.addEventListener('pointerdown', (ev) => {
    const path = ev.composedPath ? ev.composedPath() : [];
    if (path.some(n => n && n.classList &&
        (n.classList.contains('menu') || n.classList.contains('cat')))) return;
    closeAll();
  }, true);

  (function firstVisibleAlign(){
    const FRAME_SEL = '#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner';
    const SKIP_TAGS = /^(STYLE|SCRIPT|LINK|META|TEMPLATE|BR|HR)$/;

    function findFrame(){
      const cands = [...document.querySelectorAll(FRAME_SEL)];
      return cands.find(el => !cands.some(o => o !== el && o.contains(el))) || null;
    }
    function align(){
      const frame = findFrame();
      if (!frame) return;
      for (const child of frame.children){
        if (SKIP_TAGS.test(child.tagName)) continue;
        const cs = getComputedStyle(child);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (cs.position === 'absolute' || cs.position === 'fixed') continue;
        child.style.setProperty('margin-top', '0', 'important');
        if (!child.matches(FRAME_SEL)){
          child.style.setProperty('padding-top', '0', 'important');
        }
        break;
      }
    }
    const run = () => { try { align(); } catch {} };
    if (document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
      run();
    }
    window.addEventListener('load', run);
    window.addEventListener('pageshow', run);
    setTimeout(run, 800);
  })();

  (function customScrollbar(){
    const M = 8;

    const track = document.createElement('div');
    track.id = 'npxScrollTrack';
    Object.assign(track.style, {
      position: 'fixed',
      right: '0px',
      top: '0px',
      bottom: '0px',
      width: '14px',
      zIndex: '800',
      background: 'transparent',
      pointerEvents: 'none',
      touchAction: 'none',
    });
    const thumb = document.createElement('div');
    thumb.id = 'npxScrollThumb';
    Object.assign(thumb.style, {
      position: 'absolute',
      right: '3px',
      top: '0px',
      width: '5px',
      height: '0px',
      borderRadius: '4px',
      background: 'var(--np-accent, #dcb8ff)',
      boxShadow: '0 0 4px rgba(0,0,0,.35)',
      opacity: '0',
      transition: 'opacity .3s ease, width .12s ease, right .12s ease',
      cursor: 'grab',
    });
    track.appendChild(thumb);

    function mount(){
      if (document.body && !track.isConnected) document.body.appendChild(track);
      return !!document.body;
    }
    if (!mount()){
      new MutationObserver((_, o) => { if (mount()) o.disconnect(); })
        .observe(document.documentElement, { childList: true, subtree: true });
    }

    let fadeT = 0, queued = false, dragging = false, hovering = false, dragOff = 0;

    function layout(){
      const doc = document.documentElement;
      const sh = Math.max(doc.scrollHeight, document.body ? document.body.scrollHeight : 0);
      const ch = window.innerHeight;
      if (sh <= ch + 2){
        thumb.style.opacity = '0';
        track.style.pointerEvents = 'none';
        return null;
      }
      track.style.pointerEvents = 'auto';
      const trackH = ch - M * 2;
      const thH = Math.max(28, Math.round(trackH * ch / sh));
      const maxScroll = sh - ch;
      const y = M + (trackH - thH) * (maxScroll > 0 ? (window.scrollY / maxScroll) : 0);
      thumb.style.top = Math.round(y) + 'px';
      thumb.style.height = thH + 'px';
      return { trackH, thH, maxScroll };
    }
    function reveal(){
      if (!layout()) return;
      thumb.style.opacity = (dragging || hovering) ? '.9' : '.55';
      clearTimeout(fadeT);
      if (!dragging && !hovering){
        fadeT = setTimeout(() => { thumb.style.opacity = '0'; }, 1100);
      }
    }
    const schedule = () => { if (!queued){ queued = true; requestAnimationFrame(() => { queued = false; reveal(); }); } };

    function moveTo(clientY, m){
      const ratio = Math.max(0, Math.min(1, (clientY - dragOff - M) / (m.trackH - m.thH || 1)));
      window.scrollTo(window.scrollX, ratio * m.maxScroll);
    }
    track.addEventListener('pointerenter', () => {
      hovering = true;
      thumb.style.width = '9px';
      thumb.style.right = '2px';
      reveal();
    });
    track.addEventListener('pointerleave', () => {
      hovering = false;
      thumb.style.width = '5px';
      thumb.style.right = '3px';
      reveal();
    });
    track.addEventListener('pointerdown', (e) => {
      const m = layout();
      if (!m) return;
      e.preventDefault();
      const r = thumb.getBoundingClientRect();
      if (e.clientY >= r.top && e.clientY <= r.bottom){
        dragOff = e.clientY - r.top;
      } else {
        dragOff = m.thH / 2;
        moveTo(e.clientY, m);
      }
      dragging = true;
      thumb.style.cursor = 'grabbing';
      try { track.setPointerCapture(e.pointerId); } catch {}
      reveal();
    });
    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const m = layout();
      if (m) moveTo(e.clientY, m);
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      thumb.style.cursor = 'grab';
      try { track.releasePointerCapture(e.pointerId); } catch {}
      reveal();
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  })();
}

if (NQ.base) startLayout();

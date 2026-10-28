  const PAGE_CSS = `
html[data-np-modern-interface] {
  --np-col-width: 240px !important;
  --np-hud-left: 14px !important;
  --np-hud-top: 72px !important;
  --np-bar-inset-left: 0px !important;
  --npp-card: rgba(20,18,28,.42);
  --npp-card-line: rgba(255,255,255,.14);
  --npp-drawer-bg: linear-gradient(var(--npp-card), var(--npp-card)), linear-gradient(rgba(0,0,0,.22), rgba(0,0,0,.22)), var(--npLeftBarImg, none) center / cover no-repeat, var(--npLeftBarSolid, #3a3350);
  --npp-drawer-layers: linear-gradient(var(--npp-card), var(--npp-card)), linear-gradient(rgba(0,0,0,.22), rgba(0,0,0,.22));
  --npp-ico-shadow: drop-shadow(0 2px 3px rgba(0,0,0,.4));

  body, body *:not(:where(i, .fa, .fas, .far, .fab, .fal, .fad, [class*="fa-"], [class*="glyphicon"], [class*="icon-"], [class*="-icon"], [class*="material-icons"], [class*="mdi"], .bi, [class^="bi-"], .dashicons, [class*="ico-"])) { font-family: 'Outfit', system-ui, sans-serif !important; }
  .qrOverlay a, .qrPetName, .bankSettingsHead h3, #npUserTitle, #npBank .title,
  #nppNst { font-family: 'CafeteriaBlack', Georgia, serif !important; }

  .searchForm { margin: 0 !important; }
  div#boardTopic { border: 0 !important; }
  div#superfooter { display: none !important; }
  .container { box-shadow: 0 0 6px rgba(0,0,0,.1); }

  body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) {
    border: none !important;
    margin-left: calc(var(--np-col-width) + (100vw - var(--np-col-width) - var(--np-frame-width, 1100px)) / 2) !important;
  }
  body#neobdy div#main #content { margin-left: 0 !important; }
  @media (max-width: 900px) {
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) { margin-left: auto !important; }
  }

  body > .errorOuter, body > .errorInner, body > .errorMessage {
    position: relative; box-sizing: border-box; width: min(560px, calc(100vw - var(--np-col-width, 240px) - 48px)); max-width: none;
    margin: 120px 24px 40px calc(var(--np-col-width, 240px) + max(24px, (100vw - var(--np-col-width, 240px) - 560px) / 2)) !important;
  }
  @media (max-width: 900px) { body > .errorOuter, body > .errorInner, body > .errorMessage { width: auto; margin: 110px 16px 32px !important; } }


  #npLeftBar { border: 0 !important; box-shadow: 0 0 10px rgba(0,0,0,.4) !important; top: 0 !important; bottom: auto !important; height: 100vh !important; }
  #npHud > #npBank { display: none !important; }

  #npNp { flex-direction: column !important; align-items: stretch !important; cursor: default !important; }
  #npNp .np-amounts { flex: 1; display: flex; align-items: center; white-space: nowrap; }
  #npNp .np-amount, #npNp .np-nc { display: flex; align-items: center; gap: 5px; text-decoration: none !important; transition: background .15s; }
  #npNp .np-amount img, #npNp .np-nc img { flex: 0 0 auto; }
  #npNp .np-chevron { display: flex; align-items: center; justify-content: center; cursor: pointer; }
  #npNp.np-open .np-chevron { transform: rotate(180deg); }
  #npNp .np-bank-drawer { display: none; background: transparent !important; }
  #npNp.np-open .np-bank-drawer { display: block; }
  #npNp .np-bank-drawer #npBank { border: 0 !important; box-shadow: none !important; backdrop-filter: none !important; background: transparent !important; padding: 8px 0 0 !important; margin: 0 !important; width: 100% !important; }

  #npActivePet { flex: 0 0 auto !important; flex-direction: column !important; align-items: stretch !important; height: auto !important; min-height: 0 !important; max-height: none !important; }
  #npActivePet > img { order: 0; }
  #npPetDockBtn { position: absolute; top: 12px; right: 12px; width: auto; height: 26px; padding: 0 9px; gap: 5px; font: 700 11px/1 'Outfit', system-ui, sans-serif; white-space: nowrap; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 7px; background: rgba(0,0,0,.55); color: #fff; cursor: pointer; opacity: 1; transition: background .14s; z-index: 4; }
  #npPetDockBtn:hover { background: rgba(0,0,0,.75); }
  #nppPetInfo .nppTitle { display: flex; justify-content: center; gap: 6px; font-weight: 700; text-align: center; }
  #nppPetInfo .nppTitle a { color: #fff !important; font-weight: 700; text-decoration: none !important; }
  #nppPetInfo .nppTitle a:hover { text-decoration: underline !important; }
  #nppPetInfo .nppLinks { display: flex; justify-content: center; font-size: 11px; }
  #nppPetInfo .nppCopy { flex: 0 0 auto; padding: 2px; border: 0; background: transparent; cursor: pointer; }
  #nppPetInfo .nppCopy:hover { color: #fff; }
  #nppPetInfo .nppDetails { grid-template-columns: auto 1fr; font-size: 11px; color: rgba(255,255,255,.88); }
  #nppPetInfo .nppDetails span { color: rgba(255,255,255,.55) !important; opacity: 1 !important; font-weight: 400 !important; }
  #nppPetInfo .nppDetails b { color: #fff !important; font-weight: 700 !important; font-size: inherit !important; }
  #nppPetInfo .nppDetails b.gF { color: #ff8fc4 !important; }
  #nppPetInfo .nppDetails b.gM { color: #6db3ff !important; }
  #nppPetInfo { order: 2; position: relative; }

  #qrDockWrap { overflow-y: auto !important; overflow-x: hidden !important; }
  #qrDockWrap.open { top: 62px !important; }
  #qrDock { overflow-y: auto !important; overflow-x: hidden !important; min-height: 100% !important; height: auto !important; }
  .qrPet { min-height: 50px !important; flex: 1 1 50px !important; }

  #nppFoot { position: fixed; left: 0; bottom: 0; width: var(--np-col-width); box-sizing: border-box; padding: 0 14px 12px; display: flex; flex-direction: column; gap: 8px; z-index: 1000; }


  #npBgSidebar { top: 0 !important; height: 100vh !important; box-sizing: border-box !important; padding-top: 0 !important; z-index: 2100 !important; background: #1a1722 !important; border-left: 1px solid rgba(255,255,255,.14); box-shadow: -4px 0 32px rgba(0,0,0,.12) !important; }
  #npBgHandle { top: calc(60px + (100vh - 60px - 44px) / 2) !important; width: 16px !important; height: 44px !important; font-size: 0 !important; opacity: 0; transition: opacity .15s, background .12s !important; }
  #npBgHandle.npp-show, #npBgHandle:hover { opacity: 1; }
  #npBgHandle svg { width: 12px; height: 12px; transform: rotate(90deg); }
  #nppColors { display: flex; flex-direction: column; margin: 0 0 10px; }
  #nppColors input[type="color"] { width: 36px; height: 26px; padding: 2px; border: 1px solid rgba(255,255,255,.3); border-radius: 6px; background: none; cursor: pointer; }
  #nppColors button { padding: 4px 8px; border: 1px solid rgba(255,255,255,.2); border-radius: 6px; color: #fff; font-size: 11px; cursor: pointer; }

  #npBgBody { color: #fff; }
  #npBgSidebar .npSmall { color: rgba(255,255,255,.92); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
  #npBgSidebar .npThemeSelect { height: 36px; font-size: 13px; background-color: rgba(255,255,255,.1); border-color: rgba(255,255,255,.3); color: #fff; }
  #npBgSidebar .npThemeSelect:hover { background-color: rgba(255,255,255,.16); }
  #npBgSidebar .npRecolorBtn:not(.isOn) { color: #fff; background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.3); }
  #npBgSidebar .npOptRow { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.22); }
  #npBgSidebar .npOptText { color: #fff; font-size: 12.5px; }
  #npBgSidebar .npOptText small { color: rgba(255,255,255,.74); font-size: 11px; }
  #nppColors .nppRow { color: rgba(255,255,255,.95); }
  #nppColors button { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.3); }
  #nppColors button:hover { background: rgba(255,255,255,.22); }
  #npBgSidebar .npBgSearch input { height: 32px; font-size: 13px; background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.3); }
  #npBgSidebar .npBgSearch input::placeholder { color: rgba(255,255,255,.62); }
  #npBgSidebar .npBgSearch button { height: 32px; background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.3); }
  #nppShuffle { display: flex; align-items: center; justify-content: center; }
  #nppShuffle.busy { background: var(--np-accent, #fff) !important; color: var(--npp-accent-fg, #1a1330) !important; border-color: transparent !important; }
  #nppShuffle.busy svg { animation: nppSpin .7s linear infinite; }
  #npBgList { transition: opacity .2s; }
  #npBgList.nppFetching { opacity: .35; pointer-events: none; }
  #npBgList .nppRowIn { animation: nppRowIn .38s cubic-bezier(.22, 1, .36, 1) both; animation-delay: calc(var(--i, 0) * 30ms); }
  #nppDiscBar.loading { position: relative; overflow: hidden; padding-bottom: 7px; }
  #nppDiscBar.loading #nppDiscMsg { animation: nppPulse 1s ease-in-out infinite; }
  #nppDiscBar.loading::after { content: ""; position: absolute; left: 0; bottom: 0; width: 38%; height: 3px; border-radius: 2px; background: var(--np-accent, #fff); animation: nppSlide 1s ease-in-out infinite; }
  #npBgBody > #nppDiscBar { order: 6; display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: -6px; padding: 0 2px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,.8); }
  #nppDiscBar[hidden] { display: none !important; }
  #nppShuffle svg { display: block; }
  #npBgSidebar .npBgItem { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.16); }
  #npBgSidebar .npBgName { color: #fff; font-size: 12px; font-weight: 600; }
  #npBgSidebar .npBgBtn { background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.3); }
  #npBgSidebar .npBgBtn:hover { background: rgba(255,255,255,.26); filter: none; }
  #npBgSidebar #npBgFooter { background: rgba(0,0,0,.28); border-top-color: rgba(255,255,255,.18); }
  #npBgSidebar .npFooterBtn { font-size: 13px; background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.34); }
  #npBgSidebar .npFooterBtn:hover { background: rgba(255,255,255,.2); filter: none; }
  #npBgSidebar .npFooterBtn.primary { background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1330); border-color: transparent; text-shadow: var(--npp-accent-fg-shadow, none); }
  #npBgSidebar .npFooterBtn.primary:hover { filter: brightness(1.06); }

  #npBgBody { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px 10px; align-content: start; padding: 14px; }
  #npBgBody > * { grid-column: 1 / -1; margin: 0; min-width: 0; }
  #npBgBody > .npThemeBlock { grid-column: auto; }
  #npBgBody > #nppColors { order: 4; }
  #npBgBody > .npBgSearch { order: 5; }
  #npBgBody > #npBgList { order: 7; margin-top: -4px; gap: 6px; max-height: clamp(260px, 52vh, 560px); overflow-y: auto; overscroll-behavior: contain; padding: 6px; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; background: rgba(255,255,255,.03); scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.3) transparent; }
  #npBgList::-webkit-scrollbar { width: 8px; }
  #npBgList::-webkit-scrollbar-thumb { background: rgba(255,255,255,.3); border-radius: 4px; }
  #npBgSidebar .npRecolorBtn { display: flex; align-items: center; justify-content: space-between; gap: 10px; height: auto; min-height: 42px; padding: 8px 12px 8px 14px; text-align: left; font-size: 17px; font-weight: 600; }
  #npBgSidebar .npRecolorBtn::after { content: 'OFF'; font: 700 10px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; padding: 5px 9px; border-radius: 999px; background: rgba(255,255,255,.16); color: rgba(255,255,255,.88); text-shadow: none; }
  #npBgSidebar .npRecolorBtn.isOn { color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.5), 0 0 0 rgba(0,0,0,.35); }
  #npBgSidebar .npRecolorBtn.isOn::after { content: 'ON'; background: #22b45a; color: #fff; text-shadow: 0 1px 1px rgba(0,0,0,.25); box-shadow: 0 1px 4px rgba(0,0,0,.25); }
  #nppColors { padding: 12px 14px; gap: 10px; text-align: left; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; background: rgba(255,255,255,.04); }
  #nppColors .nppPresets { display: flex; gap: 6px; flex-wrap: wrap; }
  #nppColors .nppPresets button { flex: 1 1 auto; padding: 5px 8px; border: 1px solid rgba(255,255,255,.3); border-radius: 8px; background: rgba(255,255,255,.1); color: #fff; font-size: 11px; font-weight: 600; cursor: pointer; }
  #nppColors .nppPresets button:hover { background: rgba(255,255,255,.2); }
  #nppColors .npSmall { margin: 0 0 2px; text-align: left; }
  #nppColors .nppRow { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center; gap: 12px; font-size: 13px; font-weight: 600; text-align: left; }
  #nppColors .nppRow input[type="color"] { order: 1; width: 44px; height: 30px; padding: 3px; border: 1px solid rgba(255,255,255,.3); border-radius: 9px; background: rgba(255,255,255,.08); cursor: pointer; }
  #nppColors .nppRow span { order: 2; flex: none; }
  #nppColors .nppRow button { order: 3; padding: 5px 11px; border: 1px solid rgba(255,255,255,.24); border-radius: 8px; background: transparent; color: rgba(255,255,255,.85); font-size: 11px; font-weight: 600; }
  #nppColors .nppRow button:hover { background: rgba(255,255,255,.16); color: #fff; }
  #nppColors .nppShareRow { display: flex; align-items: center; gap: 10px; margin-top: 2px; padding: 8px 2px 2px; border-top: 1px solid rgba(255,255,255,.12); cursor: pointer; font-size: 13px; font-weight: 600; color: rgba(255,255,255,.9); text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6); }
  #nppColors .nppShareRow input { width: 16px; height: 16px; margin: 0; accent-color: var(--np-accent, #fff); cursor: pointer; }
  #nppColors .nppLogoDot { order: 1; display: block; width: 44px; height: 30px; box-sizing: border-box; border: 1px solid rgba(255,255,255,.3); border-radius: 9px; background: #111; }
  #nppColors .nppLogoRow[data-logo="1"] .nppLogoDot { background: #fff; }
  #nppColors .nppLogoRow span { order: 2; }
  #nppColors .nppLogoRow .nppSeg { order: 3; display: inline-flex; padding: 2px; border: 1px solid rgba(255,255,255,.3); border-radius: 999px; background: rgba(255,255,255,.08); }
  #nppColors .nppLogoRow .nppSeg button { order: 0; padding: 4px 13px; border: 0; border-radius: 999px; background: transparent; color: rgba(255,255,255,.85); font-size: 11px; font-weight: 600; }
  #nppColors .nppLogoRow .nppSeg button:hover { background: rgba(255,255,255,.16); color: #fff; }
  #nppColors .nppLogoRow .nppSeg button.on { background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1330); text-shadow: var(--npp-accent-fg-shadow, none); }
  #nppColors input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
  #nppColors input[type="color"]::-webkit-color-swatch { border: 0; border-radius: 6px; }
  #nppColors input[type="color"]::-moz-color-swatch { border: 0; border-radius: 6px; }
  #npBgSidebar .npBgSearch { padding: 0; }
  #npBgSidebar .npBgItem { grid-template-columns: 48px minmax(0, 1fr) auto auto; gap: 6px; padding: 5px 8px; }
  #npBgSidebar .npBgThumb { width: 48px; height: 48px; }
  #npBgSidebar #npBgFooter { padding: 12px 14px; gap: 10px; }

  #npUser, #npNp, #npActivePet, #nppDaily {
    background: var(--npp-card) !important;
    border: 1px solid var(--npp-card-line) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    backdrop-filter: blur(10px) !important;
    box-shadow: none !important;
  }
  #npUser:hover, #npNp:hover, #npActivePet:hover { border-color: rgba(255,255,255,.26) !important; }

  #npHud { left: calc(var(--np-hud-left, 14px) + 6px); width: calc(var(--np-col-width, 240px) - 2 * (var(--np-hud-left, 14px) + 6px)); }
  #nppFoot { padding-left: calc(var(--np-hud-left, 14px) + 6px); padding-right: calc(var(--np-hud-left, 14px) + 6px); }

  #npHud, #nppFoot { text-shadow: 0 1px 3px rgba(0,0,0,.8); }

  #npUserTitle { color: #fff !important; text-shadow: 0 2px 6px rgba(0,0,0,.7) !important; }
  #npUser { min-height: 0 !important; }
  #nppAcctTab { display: none !important; }
  #npUser .rightSide { display: grid !important; width: 100%; }
  #npUser .name { max-width: 100%; text-align: left !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
  #npUserTitle { font-size: 24px !important; }

  #npNp .np-amount, #npNp .np-nc { font-weight: 800 !important; color: #fff !important; }
  #npNp .np-amount:hover, #npNp .np-nc:hover { background: rgba(255,255,255,.2) !important; }
  #npNp .np-chevron { background: none !important; border: 0 !important; }
  #npNp .np-chevron:hover { opacity: .75; }
  #npNp .np-amounts { gap: 10px; min-width: 0; }
  #npNp .npVal, #npNp .ncVal { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #npBank .bankCustomForm .ok, .bankSettingsFoot .npBtn.save { color: var(--npp-accent-fg, #1a1330); }
  #npNp .np-amount, #npNp .np-nc { position: relative; box-sizing: border-box; min-height: 24px; flex: 0 1 auto; min-width: 0; padding: 2px 7px 2px 14px !important; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; background: rgba(255,255,255,.12); font-size: 13px !important; }
  #npNp .np-amount:hover, #npNp .np-nc:hover { border-color: rgba(255,255,255,.4); }
  #npNp .np-amount img, #npNp .np-nc img { position: absolute; left: -6px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; filter: drop-shadow(0 1px 2px rgba(0,0,0,.5)); }
  #npNp .bankGraph text { fill: rgba(255,255,255,.85); }
  #npNp #npBank .msg { opacity: .9; }
  #npNp #npBank .npBtn { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.28); }
  #npNp #npBank .npBtn:hover { background: rgba(255,255,255,.2); }

  #nppPetInfo .nppTitle { font-size: 14px !important; flex-wrap: nowrap; align-items: flex-start !important; line-height: 1.2; }
  #nppPetInfo .nppTitle a { display: block; flex: 1 1 auto; text-align: center; text-shadow: 0 1px 3px rgba(0,0,0,.7); min-width: 0; }
  #nppPetInfo .nppName { display: block; font-family: 'CafeteriaBlack', Georgia, serif !important; font-size: 22px; font-weight: 400; line-height: 1.1; letter-spacing: .02em; overflow-wrap: anywhere; padding: 0 24px; }
  #nppPetInfo .nppSub { display: block; margin-top: 2px; font-size: 11.5px; font-weight: 500; line-height: 1.25; color: rgba(255,255,255,.82); }
  #nppPetInfo .nppTitle .nppCopy { position: absolute; top: 0; right: 0; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border-radius: 7px; transition: background .15s, color .15s, transform .1s; }
  #nppPetInfo .nppTitle .nppCopy svg { width: 14px; height: 14px; display: block; }
  #nppPetInfo .nppTitle .nppCopy:hover { background: rgba(255,255,255,.16); color: #fff; }
  #nppPetInfo .nppTitle .nppCopy:active { transform: scale(.86); }
  #nppPetInfo .nppTitle .nppCopy.done { background: rgba(123,224,142,.22); color: #7be08e; animation: nppCopyPop .35s cubic-bezier(.3,1.6,.5,1); }
  #nppPetInfo .nppTitle .nppCopy.fail { background: rgba(255,90,90,.22); color: #ff8a8a; font-size: 18px; line-height: 1; animation: nppCopyPop .35s cubic-bezier(.3,1.6,.5,1); }
  #nppPetInfo .nppTitle a .nppG.gF { color: #ffa6d2 !important; }
  #nppPetInfo .nppTitle a .nppG.gM { color: #8cc4ff !important; }
  #nppPetInfo .nppCopy { color: rgba(255,255,255,.85) !important; }

  #nppPetInfo .nppLinks { gap: 5px !important; margin-top: 6px !important; }
  #nppPetInfo .nppLinks a { flex: 1; text-align: center; display: flex; align-items: center; justify-content: center; padding: 5px 4px; color: #fff !important; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); border-radius: 999px; text-decoration: none !important; }
  #nppPetInfo .nppLinks a:hover { background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1330) !important; text-shadow: var(--npp-accent-fg-shadow, none); text-decoration: none !important; }
  #nppPetInfo .nppLinks a svg, #nppPetInfo .nppLinks button svg { width: 16px; height: 16px; display: block; }
  #nppPetInfo .nppLinks button { flex: 1; display: flex; align-items: center; justify-content: center; padding: 5px 4px; color: #fff; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); border-radius: 999px; cursor: pointer; transition: background .15s, color .15s; }
  #nppPetInfo .nppLinks button:hover { background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1330); }
  #nppPetInfo .nppLinks button.on { background: rgba(255,255,255,.3); }
  #nppPetInfo .nppLinks button.on:hover { background: var(--np-accent, #fff); }

  #nppPetInfo .nppDetails { display: flex !important; flex-direction: column; gap: 2px !important; margin-top: 6px !important; }
  #nppPetInfo .nppStat { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 2px 9px; border-radius: 7px; background: rgba(255,255,255,.07); font-size: 11.5px; line-height: 1.3; }
  #nppPetInfo .nppStat:nth-child(even) { background: rgba(255,255,255,.12); }
  #nppPetInfo .nppDetails .nppStat span { color: rgba(255,255,255,.78) !important; font-weight: 500 !important; white-space: nowrap; }
  #nppPetInfo .nppDetails .nppStat b { color: #fff !important; font-weight: 700 !important; text-align: right; min-width: 0; }
  #nppPetInfo .nppDetails .nppStat b.gF { color: #ffa6d2 !important; }
  #nppPetInfo .nppDetails .nppStat b.gM { color: #8cc4ff !important; }

  #nppPetInfo .nppStats { margin-top: 8px; }
  #nppPetInfo .nppStatsHead { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; border: 1px solid rgba(255,255,255,.22); border-radius: 9px; background: rgba(255,255,255,.12); color: #fff; cursor: pointer; text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6); transition: background .15s; }
  #nppPetInfo .nppStatsHead:hover { background: rgba(255,255,255,.2); }
  #nppPetInfo .nppStatsHead span { font: 600 12.5px/1.2 'Outfit', system-ui, sans-serif !important; color: #fff !important; }
  #nppPetInfo .nppStatsHead svg { width: 12px; height: 12px; flex: none; transition: transform .25s cubic-bezier(.22, 1, .36, 1); }
  #nppPetInfo .nppStats.open .nppStatsHead svg { transform: rotate(180deg); }
  #nppPetInfo .nppStatsBody { max-height: 0; opacity: 0; margin-top: 0; overflow: hidden; transition: max-height .3s cubic-bezier(.22, 1, .36, 1), opacity .2s ease, margin-top .3s ease; }
  #nppPetInfo .nppStats.open .nppStatsBody { max-height: 240px; opacity: 1; margin-top: 6px; }
  #nppPetInfo .nppStatsBody .nppDetails { margin-top: 0 !important; }
  #nppPetInfo .nppChips { position: absolute; left: 8px; right: 8px; bottom: calc(100% + 16px); margin: 0; display: flex; flex-wrap: nowrap; justify-content: flex-start; gap: 5px; pointer-events: none; z-index: 2; }
  #nppPetInfo .nppChip { padding: 3px 9px; border-radius: 999px; background: rgba(18,16,26,.6); border: 1px solid rgba(255,255,255,.22); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); color: #fff; font-size: 11.5px; font-weight: 600; line-height: 1.3; white-space: nowrap; text-shadow: none; }
  #nppPetInfo .nppChip.gF { color: #ffa6d2; }
  #nppPetInfo .nppChip.gM { color: #8cc4ff; }

  #nppTools .nppSearch button img { width: calc(var(--npp-ic) * .85) !important; height: calc(var(--npp-ic) * .85) !important; object-fit: contain !important; filter: var(--npp-ico-shadow) !important; }
  #btnOverlay .col [data-npp-nested] { display: none !important; }
  #btnOverlay .col.left { gap: 6px !important; row-gap: 6px !important; }
  #btnOverlay .col.left > * { margin-top: 0 !important; margin-bottom: 0 !important; }
  #nppNestPop { position: fixed !important; z-index: 1003; display: flex !important; flex-direction: row !important; align-items: center; gap: calc(var(--npp-ig, 10px) + 18px) !important; width: auto !important; height: auto !important; margin: 0 !important; padding: 4px 8px 4px calc(var(--npp-ig, 10px) + 18px) !important; right: auto !important; bottom: auto !important; background: none !important; border: 0 !important; box-shadow: none !important; opacity: 0; transform: translateY(-50%) translateX(-8px) !important; pointer-events: none !important; transition: opacity .15s ease, transform .24s cubic-bezier(.22, 1, .36, 1); }
  #nppNestPop.open { opacity: 1; transform: translateY(-50%) !important; pointer-events: auto !important; }
  #nppNestPop.open .col > * { animation: nppNestIn .28s cubic-bezier(.22, 1, .36, 1) both; animation-delay: calc(var(--i, 0) * 50ms); }
  #nppNestMenu { -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); position: fixed; z-index: 1004; min-width: 210px; padding: 6px; border: 1px solid var(--npp-card-line); border-radius: 14px; background: var(--npp-drawer-bg); box-shadow: 0 4px 14px rgba(0,0,0,.10); opacity: 0; transform: scale(.96); transform-origin: left top; pointer-events: none; transition: opacity .12s, transform .16s; }
  #nppNestMenu.open { opacity: 1; transform: none; pointer-events: auto; }
  #nppNestMenu button { display: block; width: 100%; padding: 8px 12px; border: 0; border-radius: 9px; background: transparent; color: #fff; text-align: left; font: 600 13px 'Outfit', system-ui, sans-serif; text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6); cursor: pointer; }
  #nppNestMenu button:hover { background: rgba(255,255,255,.14); }

  &.npp-shop-lock .shop-bg { cursor: not-allowed !important; opacity: .6; transition: opacity .3s; }
  .nppBigPrice { font-size: 1.7em !important; font-weight: 800 !important; line-height: 1.1; color: #9900b3 !important; }

  #btnOverlay .iconBtn { padding: 6px !important; margin: -6px !important; }
  #nppTools .nppSearch button { min-width: 36px; min-height: 36px; }
  .nppGrpHead { margin: 6px 4px 2px; font: 700 10px/1 'Outfit', system-ui, sans-serif; letter-spacing: .09em; text-transform: uppercase; color: rgba(255,255,255,.6); }
  .nppGrpHead:first-child { margin-top: 0; }
  #nppTop { position: fixed; right: 24px; bottom: 20px; z-index: 2150; width: 42px; height: 42px; border-radius: 50%; border: 1px solid rgba(255,255,255,.3); background: var(--npp-card, rgba(20,18,28,.7)); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .2s ease, background .15s; box-shadow: 0 4px 14px rgba(0,0,0,.3); }
  #nppTop.on { opacity: 1; pointer-events: auto; }
  #nppTop:hover { background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1330); }
  #nppTop svg { width: 18px; height: 18px; }
  .nppFold { position: absolute; top: 6px; left: 6px; z-index: 5; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 7px; background: rgba(0,0,0,.45); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: .7; transition: opacity .15s; }
  .nppFold:hover { opacity: 1; }
  #nppDaily > .nppFold.nppEye { left: auto; right: 4px; top: 4px; width: 22px; height: 22px; border-radius: 50%; background: rgba(14,42,68,.22); color: #0e2a44; opacity: .55; }
  #nppDaily > .nppFold.nppEye:hover { opacity: 1; background: rgba(14,42,68,.35); }
  #nppDaily > .nppFold.nppEye svg { width: 13px; height: 13px; }
  #nppDaily.nppFolded > .nppFold.nppEye { background: rgba(255,255,255,.2); color: #fff; }
  .nppFold svg { width: 12px; height: 12px; transition: transform .2s ease; }
  .nppFold.up svg { transform: rotate(180deg); }
  #npNp.nppFolded > :not(.nppFold), #npActivePet.nppFolded > :not(.nppFold), #nppDaily.nppFolded > :not(.nppFold) { display: none !important; }
  #npNp.nppFolded, #npActivePet.nppFolded, #nppDaily.nppFolded { height: 36px !important; min-height: 36px !important; padding: 0 !important; overflow: hidden !important; }

  #nppTools { position: fixed; right: calc(14px + var(--npp-ic, 44px) + var(--npp-ig, 10px)); top: var(--npp-tools-top, 27px); transform: translateY(-50%); z-index: 2010; display: flex; flex-direction: row; align-items: center; gap: var(--npp-ig, 10px); transition: opacity .25s ease; }
  #nppTools .nppSep { display: none; }
  #nppTools .nppSearch { position: relative; width: var(--npp-ic, 44px); height: var(--npp-ic, 44px); margin: 0; transition: width .25s ease, height .25s ease; }
  #nppTools .nppSearch button { position: absolute; z-index: 2; left: 0; top: 0; width: var(--npp-ic, 44px); height: var(--npp-ic, 44px); padding: 0; display: flex; align-items: center; justify-content: center; border: 0; background: transparent; cursor: pointer; transition: width .25s ease, height .25s ease; }
  #nppTools .nppSearch button img { display: block; transition: transform .2s cubic-bezier(.3, 1.4, .5, 1), width .25s ease, height .25s ease; }
  #nppTools .nppSearch.noimg::before, #nppTools .nppSearch button.noimg::before { content: "⌕"; font-size: 24px; color: #fff; }
  #nppTools .nppSearch input { position: absolute; z-index: 1; right: 0; top: 50%; transform: translateY(-50%); box-sizing: border-box; width: var(--npp-ic, 44px); height: calc(var(--npp-ic, 44px) * .8); padding: 0 calc(var(--npp-ic, 44px) + 6px) 0 16px; border: 1px solid transparent; border-radius: 999px; background: transparent; color: #fff; font: 400 17px 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .02em; text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6); outline: 0; cursor: pointer; transition: width .42s cubic-bezier(.22, 1, .36, 1), background .25s, border-color .25s, box-shadow .25s; }
  #nppTools .nppSearch.nppOpen input { width: 252px; cursor: text; border-color: var(--npp-card-line); background: var(--npp-drawer-bg); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); box-shadow: 0 4px 14px rgba(0,0,0,.10); }
  #nppTools .nppSearch input:focus { border-color: var(--np-accent, #fff); }
  #nppTools .nppSearch input::placeholder { color: rgba(255,255,255,.75); opacity: 0; transition: opacity .12s; }
  #nppTools .nppSearch.nppOpen input::placeholder { opacity: 1; transition: opacity .3s .2s; }
  &.npp-wait #nppTools, &.npp-wait #nppBell { opacity: 0 !important; pointer-events: none; }
  #nppBell { position: fixed; right: 14px; top: var(--npp-tools-top, 27px); transform: translateY(-50%); z-index: 2010; width: var(--npp-ic, 44px); height: var(--npp-ic, 44px); display: flex; align-items: center; justify-content: center; }
  #nppBell .nav-bell-icon__2020 { position: relative !important; inset: auto !important; margin: 0 !important; width: calc(var(--npp-ic, 44px) * .85) !important; height: calc(var(--npp-ic, 44px) * .85) !important; background-size: contain !important; background-position: center !important; background-repeat: no-repeat !important; cursor: pointer; }
  #nppBell #navnewsdropdown__2020 { position: fixed !important; top: calc(var(--npp-header-h, 54px) + 8px) !important; right: 10px !important; left: auto !important; bottom: auto !important; z-index: 2100 !important; }
  #nppBell > img { width: calc(var(--npp-ic, 44px) * .85); height: calc(var(--npp-ic, 44px) * .85); object-fit: contain; filter: var(--npp-ico-shadow); }
  #nppBell .nppBellDot { position: absolute; top: 2px; right: 2px; width: 12px; height: 12px; border-radius: 50%; background: #ff3b3b; box-shadow: 0 0 0 2px rgba(255,255,255,.92); }

  #nppBottom { display: flex; align-items: center; justify-content: center; min-height: 30px; }
  #nppNst { display: inline-block; padding: 0; font-size: 20px !important; color: #fff !important; background: none !important; border: 0 !important; font-variant-numeric: tabular-nums; white-space: nowrap; }

  #npLeftBarBg { background-image: none !important; overflow: hidden; }
  &[data-npp-bar="none"] #npLeftBarBg::after { top: 0; }
  #npLeftBarBg::before { content: ""; position: absolute; inset: -30px; background: var(--npLeftBarImg) center / cover no-repeat; filter: blur(14px) saturate(1.12); }
  #npLeftBarBg::after { content: ""; position: absolute; left: 0; right: 0; top: 60px; aspect-ratio: 4 / 3; background: var(--npLeftBarImg) center / cover no-repeat; -webkit-mask-image: linear-gradient(to bottom, #000 62%, transparent 100%); mask-image: linear-gradient(to bottom, #000 62%, transparent 100%); }

  #npHud, #nppFoot, #btnOverlay { transition: opacity .25s ease; }
  &.npp-wait #npHud, &.npp-wait #nppFoot, &.npp-wait #btnOverlay { opacity: 0 !important; pointer-events: none; }

  &.npp-reg4 .content { margin: 0 !important; padding: 0 !important; background: transparent !important; }
  &.npp-home body .inner-body { margin-left: 0 !important; margin-right: 0 !important; padding-top: 0 !important; }
  &.npp-home body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner),
  &.npp-home body :is(.container, .theme-bg) {
    background: transparent !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; padding-top: 0 !important;
  }
  &.npp-home body #container__2020, &.npp-home body #container__2020.theme-bg { background: transparent !important; box-shadow: none !important; }
  &.npp-home { --np-top-offset: 0px !important; --np-bottom-spacer: 0px !important; }
  &.npp-home body::after { display: none !important; }

  &.npp-nc { --np-col-width: 0px !important; }
  &.npp-nc #npHud, &.npp-nc #npLeftBar, &.npp-nc #btnOverlay, &.npp-nc #npxSideBtnHost, &.npp-nc #qrDockWrap, &.npp-nc #nppFoot,
  &.npp-nc #npBgHandle, &.npp-nc #npBgSidebar { display: none !important; }
  &.npp-nc body #container__2020 { max-width: var(--np-frame-width) !important; }
  &.npp-nc body :is(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) :is(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) {
    width: auto !important; max-width: none !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important;
    border: 0 !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important;
  }

  &.npp-popup { background: #fff !important; }
  &.npp-popup::before { display: none !important; }
  &.npp-popup #npx-host, &.npp-popup #npHud, &.npp-popup #npLeftBar, &.npp-popup #btnOverlay,
  &.npp-popup #npxSideBtnHost, &.npp-popup #npBgHandle, &.npp-popup #npBgSidebar, &.npp-popup #nppFoot,
  &.npp-popup #qrDockWrap, &.npp-popup #npxScrollTrack, &.npp-popup #nppBell { display: none !important; }
  &.npp-popup body { background: #fff !important; }
  &.npp-popup body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) {
    width: auto !important; max-width: none !important; min-height: 0 !important; margin: 0 !important; padding: 8px !important; border: 0 !important; border-radius: 0 !important;
  }
  html[data-np-modern-interface] .tp-border-frame a[href*="criteria=id"] {
    position: relative !important;
    z-index: 1 !important;
    display: block !important;
    margin: 10px 0 14px !important;
    clear: both !important;
  }
}

html[data-np-modern-interface] body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) {
  padding-top: 100px !important;
}
html[data-np-modern-interface] body .container.theme-bg,
html[data-np-modern-interface]:not(.np-keep-native-bg) body #container__2020.theme-bg,
html[data-np-modern-interface]:not(.np-keep-native-bg) body .container,
html[data-np-modern-interface]:not(.np-keep-native-bg) body .theme-bg {
  padding-top: 0 !important;
}
@font-face {
  font-family: 'CafeteriaBlack';
  src: url('https://images.neopets.com/js/fonts/cafeteria-black.otf') format('opentype');
  font-display: swap;
}
@keyframes nppIn { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes nppSpin { to { transform: rotate(360deg); } }
@keyframes nppCopyPop { 0% { transform: scale(.6); } 100% { transform: scale(1); } }
@keyframes nppFlash { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .2; transform: scale(.7); } }
@keyframes nppNestIn { from { opacity: 0; transform: translateX(-12px) scale(.88); } to { opacity: 1; transform: none; } }
@keyframes nppRowIn { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes nppSlide { from { transform: translateX(-110%); } to { transform: translateX(260%); } }
@keyframes nppPulse { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes nppBellHalo { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,59,59,.65); } 50% { box-shadow: 0 0 0 9px rgba(255,59,59,0); } }`;

  const LAYOUT_CSS = `
html[data-np-modern-interface] {
  --npp-drawer-w: min(320px, 88vw);

  #npHud { position: fixed !important; top: var(--np-hud-top, 72px) !important; bottom: 0 !important; height: auto !important; max-height: none !important; display: flex !important; flex-direction: column !important; overflow-x: hidden !important; overflow-y: auto !important; overscroll-behavior: contain; box-sizing: border-box; scrollbar-width: thin !important; scrollbar-color: rgba(255,255,255,.28) transparent; }
  #npHud::-webkit-scrollbar { display: block; width: 6px; }
  #npHud::-webkit-scrollbar-thumb { background: rgba(255,255,255,.28); border-radius: 3px; }
  #npHud > * { flex: 0 0 auto !important; min-width: 0; }
  #npHud > #nppFoot { position: static !important; width: auto !important; z-index: auto; display: flex; flex-direction: column; gap: 8px; }

  #nppNavMod { box-sizing: border-box; border-radius: 14px; background: var(--npp-card); border: 1px solid var(--npp-card-line); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
  #nppIcons { position: relative; box-sizing: border-box; margin-top: auto !important; padding: 6px 0 0; background: none; border: 0; }
  #nppIcons:not(:has(.col > *)) { display: none; }
  #nppNavMod .nppNavHead { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 9px 12px; border: 0; background: transparent; color: #fff; font: 700 12px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; text-shadow: inherit; }
  #nppNavMod .nppNavHead svg { width: 12px; height: 12px; transition: transform .2s; }
  #nppNavMod .nppNavGrp.open .nppNavHead svg { transform: rotate(180deg); }
  #nppIcons .nppIcHead { display: none; }
  #nppIcons .nppIcBody, #nppIcons.nppShut .nppIcBody { display: block; padding: 0; }
  #nppIcons #btnOverlay { position: static !important; inset: auto !important; width: auto !important; height: auto !important; transform: none !important; z-index: auto !important; pointer-events: auto !important; opacity: 1 !important; overflow: visible !important; }
  #nppIcons #btnOverlay .col { position: static !important; inset: auto !important; transform: none !important; width: auto !important; height: auto !important; margin: 0 !important; display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; justify-content: center !important; align-items: center !important; gap: 10px !important; row-gap: 10px !important; }
  #nppIcons #btnOverlay .col:empty { display: none !important; }
  #nppIcons #btnOverlay .col > * { flex: 0 0 auto !important; position: relative; }
  #nppIcons #btnOverlay .col img { max-width: 40px; max-height: 40px; }
  #nppIcons #nppNestPop { position: absolute !important; left: clamp(0px, calc(var(--tx, 50%) - 28px), calc(100% - 56px)) !important; right: auto !important; bottom: calc(100% + 8px) !important; top: auto !important; width: 56px !important; flex-direction: column !important; align-items: center; transform-origin: 50% 100% !important; box-sizing: border-box; margin: 0 !important; padding: 10px 8px !important; display: flex !important; flex-wrap: nowrap; justify-content: center; gap: 8px !important; border-radius: 16px !important; box-shadow: 0 10px 28px rgba(0,0,0,.4) !important; z-index: 5; opacity: 0; visibility: hidden; pointer-events: none !important; transform: translateY(14px) scale(.92) !important; transition: opacity .2s ease, transform .3s cubic-bezier(.34, 1.4, .5, 1), visibility 0s .3s; }
  #nppIcons #nppNestPop.open { opacity: 1; visibility: visible; pointer-events: auto !important; transform: none !important; transition: opacity .2s ease, transform .3s cubic-bezier(.34, 1.4, .5, 1), visibility 0s; }
  #nppIcons #nppNestPop::after { content: ""; position: absolute; left: 50%; }
  #nppIcons #nppNestPop.open .col > * { animation: nppTrayIn .42s cubic-bezier(.34, 1.56, .5, 1) both; animation-delay: calc(var(--i, 0) * 45ms + 60ms); }
  @media (prefers-reduced-motion: reduce) { #nppIcons #nppNestPop, #nppIcons #nppNestPop.open { transition: none; } #nppIcons #nppNestPop.open .col > * { animation: none; } }

  #npNp .np-top-row .np-amount, #npNp .np-top-row .np-nc { flex-direction: row; overflow: visible; white-space: nowrap; }
  #npNp .np-top-row .np-amount img, #npNp .np-top-row .np-nc img { flex: 0 0 auto; order: -1; }
  #npNp .np-top-row .npVal, #npNp .np-top-row .ncVal { flex: 0 0 auto; white-space: nowrap !important; letter-spacing: 0; }
  #npNp .np-top-row .np-chevron { flex: 0 0 auto; }

  #npUser .rightSide { align-items: center !important; }
  #npUser #nppAvatar { align-self: center !important; }

  html #npHud #nppFoot { position: relative !important; z-index: 0; flex: 0 0 auto !important; min-height: 0; }
  #nppPinsMod { position: relative; }
  #nppIcons { z-index: 1; flex: 0 0 auto !important; padding-top: 12px; }

  #npHud { --pn-pad: 12px; --pn-r: 16px; --pn-t2: rgba(255,255,255,.72); --pn-t3: rgba(255,255,255,.55); font-family: 'Outfit', system-ui, sans-serif; }
  #npHud#npHud, #npHud#npHud * { text-shadow: none !important; }
  #npHud#npHud { padding: 0 6px 8px !important; gap: 10px !important; justify-content: flex-start !important; background: none !important; border: 0 !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; color: #fff; }
  @media (min-width: 1101px) { #npHud { left: 4px !important; width: calc(var(--np-col-width, 240px) - 8px) !important; bottom: 8px !important; } }
  @media (max-width: 1100px) { #npHud#npHud { padding: 0 12px 12px !important; } }
  #npHud > #npUser, #npHud > #npNp, #npHud > #npActivePet, #npHud > #nppListsMod, #npHud > #nppFoot { box-sizing: border-box; margin: 0 !important; padding: var(--pn-pad) !important; background: rgba(18,16,28,.62) !important; -webkit-backdrop-filter: blur(18px) saturate(140%) !important; backdrop-filter: blur(18px) saturate(140%) !important; border: 1px solid rgba(255,255,255,.10) !important; border-radius: var(--pn-r) !important; box-shadow: 0 8px 24px rgba(0,0,0,.25) !important; color: #fff; }
  #npHud > #nppNavMod { order: 5; margin: 0 !important; }
  #npHud > #npActivePet { order: 4; position: relative !important; display: block !important; overflow: hidden !important; }
  #npHud > #nppFoot { order: 6; flex: 0 0 auto !important; }
  #npHud > #nppIcons { order: 8; flex: 0 0 auto !important; margin: auto 0 0 !important; position: sticky; bottom: 0; z-index: 6; padding: 6px 0 2px !important; border: 0; background: none; }
  #npHud > #nppIcons:not(:has(.col > *)) { display: none; }

  #npHud #npUser .rightSide { row-gap: 3px !important; }
  #npHud #npUser #nppAvatar { grid-column: 1 !important; grid-row: 1 / span 2 !important; font: 700 17px/1 'Outfit', system-ui, sans-serif; border: 2px solid var(--np-accent, #fff) !important; box-shadow: 0 0 0 3px color-mix(in srgb, var(--np-accent, #fff) 28%, transparent); }
  #npHud #npUser .name { grid-column: 2 !important; grid-row: 1 / span 2 !important; align-self: center !important; min-width: 0; }
  #npHud #npUser #npUserTitle { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #fff !important; }
  #npHud #npUser[data-main="1"] .name { grid-row: 1 !important; align-self: end !important; }
  #npHud #npUser[data-main="1"] .rightSide::after { content: "MAIN"; grid-column: 2; grid-row: 2; justify-self: start; align-self: start; padding: 2px 7px; border-radius: 999px; font: 700 11px/1 'Outfit', system-ui, sans-serif; letter-spacing: .06em; color: #fff; background: color-mix(in srgb, var(--np-accent, #fff) 45%, transparent); }
  #npHud #npUser #nppAcctBtns { grid-column: 3 !important; grid-row: 1 / span 2 !important; align-self: center; display: flex !important; margin: 0 !important; }
  #npHud #npUser #npLogoutBtn, #npHud #npUser #npSwapBtn { padding: 0 !important; justify-content: center; border: 0 !important; color: var(--pn-t2) !important; }
  #npHud #npUser #npLogoutBtn span, #npHud #npUser #npSwapBtn span { display: none !important; }
  #npHud #npUser #npLogoutBtn:hover, #npHud #npUser #npSwapBtn:hover { background: rgba(255,255,255,.12) !important; color: #fff !important; }

  #npHud #npNp .np-top-row { gap: 6px !important; }
  #npHud #npNp .np-top-row .np-amount, #npHud #npNp .np-top-row .np-nc { grid-template-columns: auto minmax(0, 1fr); transition: background .15s; }
  #npHud #npNp .np-top-row .np-amount::before { content: none; }
  #npHud #npNp .np-top-row .np-nc::before { content: none; }
  #npHud #npNp .np-top-row .np-amount::before, #npHud #npNp .np-top-row .np-nc::before { grid-row: 1; font: 600 11px/1 'Outfit', system-ui, sans-serif; text-transform: uppercase; letter-spacing: .06em; color: var(--pn-t3); }
  #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { color: #fff !important; font: 700 17px/1.15 'Outfit', system-ui, sans-serif !important; }
  #npHud #npNp .np-top-row .np-amount, #npHud #npNp .np-top-row .np-nc { position: relative; } #npHud #npNp .np-top-row .np-amount img, #npHud #npNp .np-top-row .np-nc img { position: absolute !important; top: 50% !important; transform: translateY(-50%) !important; grid-column: auto; grid-row: auto; filter: drop-shadow(0 2px 3px rgba(0,0,0,.45)); } #npHud #npNp .np-top-row .np-amount::before, #npHud #npNp .np-top-row .np-nc::before, #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { grid-column: 2; font-variant-numeric: tabular-nums; }
  #npHud #npNp .np-chevron { color: var(--pn-t2) !important; transition: transform .2s, color .15s, background .15s; }
  #npHud #npNp .np-chevron:hover { color: #fff !important; background: rgba(255,255,255,.12) !important; }
  #npHud #npNp .np-bank-drawer { padding: 10px 0 0; margin-top: 10px; border-top: 1px solid rgba(255,255,255,.10); }

  #npHud #npActivePet > img { -webkit-mask-image: none; mask-image: none; }
  #npHud #npPetDockBtn { top: 18px; right: 18px; height: 28px; border-radius: 999px; background: rgba(255,255,255,.85) !important; color: #1a1626 !important; border: 1px solid rgba(255,255,255,.6) !important; box-shadow: 0 2px 8px rgba(0,0,0,.28) !important; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); font: 600 11px/1 'Outfit', system-ui, sans-serif; z-index: 2; } #npHud #npPetDockBtn svg { width: 13px; height: 13px; flex: none; color: inherit; transition: transform .35s cubic-bezier(.3,.7,.3,1); } #npHud #npPetDockBtn:hover { background: #fff !important; box-shadow: 0 3px 10px rgba(0,0,0,.34) !important; } #npHud #npPetDockBtn:hover svg { transform: rotate(180deg); } @media (prefers-reduced-motion: reduce) { #npHud #npPetDockBtn svg { transition: none; } }
  #npHud #npPetDockBtn { width: 28px; padding: 0; gap: 0; justify-content: center; overflow: hidden; transition: width .3s cubic-bezier(.3,.7,.3,1), padding .3s, gap .3s, background .15s, box-shadow .15s; } #npHud #npPetDockBtn span { max-width: 0; opacity: 0; overflow: hidden; white-space: nowrap; transition: max-width .3s cubic-bezier(.3,.7,.3,1), opacity .2s; } #npHud #npPetDockBtn:hover, #npHud #npPetDockBtn:focus-visible { width: 112px; padding: 0 11px 0 9px; gap: 6px; } #npHud #npPetDockBtn:hover span, #npHud #npPetDockBtn:focus-visible span { max-width: 80px; opacity: 1; } #npHud #npPetDockBtn:focus-visible svg { transform: rotate(180deg); } @media (prefers-reduced-motion: reduce) { #npHud #npPetDockBtn, #npHud #npPetDockBtn span { transition: none; } }
  #npHud #npActivePet #nppPetInfo { display: flex; padding: 0; text-align: left; }
  #npHud #nppPetInfo .nppTitle { order: 1; flex: 0 0 100%; justify-content: flex-start; text-align: left; position: relative; }
  #npHud #nppPetInfo .nppTitle a { text-align: left; color: #fff !important; }
  #npHud #nppPetInfo .nppSub { color: var(--pn-t2); }
  #npHud #nppPetInfo .nppTitle .nppCopy { right: 0; top: -2px; }
  #npHud #nppPetInfo .nppChips { order: 2; position: static; display: flex; margin: 0; pointer-events: auto; }
  #npHud #nppPetInfo .nppChip { font-weight: 600; -webkit-backdrop-filter: none; backdrop-filter: none; color: #fff; }
  #npHud #nppPetInfo .nppLinks { order: 3; flex: 0 0 auto; justify-content: flex-end; margin: 0 !important; }
  #npHud #nppPetInfo .nppLinks a, #npHud #nppPetInfo .nppLinks button { flex: 0 0 auto; padding: 0; }
  #npHud #nppPetInfo .nppLinks a:hover, #npHud #nppPetInfo .nppLinks button:hover { background: rgba(255,255,255,.2); }
  #npHud #nppPetInfo .nppLinks button.on { background: color-mix(in srgb, var(--np-accent, #fff) 45%, transparent); }
  #npHud #nppPetInfo .nppDetails { order: 4; flex: 0 0 100%; }
  #npHud #npActivePet:not(:has(.nppTitle))::before { content: ""; position: absolute; inset: 12px; border-radius: 12px; z-index: 0; background: linear-gradient(100deg, rgba(255,255,255,.04) 30%, rgba(255,255,255,.16) 50%, rgba(255,255,255,.04) 70%) 0 0 / 200% 100%; animation: nppShimmer 1.4s linear infinite; }
  #npHud #npActivePet > img { position: relative; z-index: 1; }
  #npHud #npActivePet:not(:has(.nppTitle)) { min-height: 194px; }
  @keyframes nppShimmer { to { background-position: -200% 0; } }
  @media (prefers-reduced-motion: reduce) { #npHud #npActivePet:not(:has(.nppTitle))::before { animation: none; } }

  #npHud #nppListsMod { display: grid; }
  #npHud #nppListsMod .nppLt { flex-wrap: nowrap; white-space: nowrap; }
  #npHud #nppListsMod .nppLt + .nppLt { position: relative; } #npHud #nppListsMod .nppLt + .nppLt::before { content: ""; position: absolute; left: -2px; top: 8px; bottom: 8px; width: 1px; background: rgba(255,255,255,.10); pointer-events: none; }
  #npHud #nppListsMod .nppLt svg { color: var(--pn-t2); }
  #npHud #nppListsMod .nppLt b { color: #fff; }
  #npHud #nppListsMod .nppLt em { flex: none; text-align: center; }
  #npHud #nppListsMod .nppLt { transition: background .18s, transform .18s, box-shadow .18s; } #npHud #nppListsMod .nppLt:hover, #npHud #nppListsMod .nppLt:focus-visible { transform: translateY(-2px); background: rgba(255,255,255,.14); box-shadow: 0 6px 14px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.18); } #npHud #nppListsMod .nppLt:hover svg, #npHud #nppListsMod .nppLt:focus-visible svg { animation: nppLtWiggle .5s ease; } #npHud #nppListsMod .nppLt em { animation: nppLtPop .5s cubic-bezier(.3,1.6,.5,1) .15s both; } @keyframes nppLtWiggle { 0%,100% { transform: rotate(0) translateY(0); } 25% { transform: rotate(-14deg) translateY(-2px); } 55% { transform: rotate(10deg) translateY(-1px); } 80% { transform: rotate(-4deg); } } @keyframes nppLtPop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } } @media (prefers-reduced-motion: reduce) { #npHud #nppListsMod .nppLt, #npHud #nppListsMod .nppLt em, #npHud #nppListsMod .nppLt svg { animation: none !important; transition: none !important; transform: none !important; } }

  #npHud #nppPinsMod { border: 0; background: none; border-radius: 0; overflow: visible; height: auto; min-height: 0; flex: 0 0 auto; -webkit-backdrop-filter: none; backdrop-filter: none; }
  #npHud #nppPinsMod .pTabs { position: relative; display: flex; gap: 2px; padding: 3px; margin: 0 0 8px; border-radius: 10px; background: rgba(255,255,255,.08); }
  #npHud #nppPinsMod .pTabs button { flex: 1 1 0; padding: 6px 4px; border-radius: 8px; background: none; color: var(--pn-t2); border-bottom: 0; }
  #npHud #nppPinsMod .pTabs button { position: relative; z-index: 1; transition: color .2s; } #npHud #nppPinsMod .pTabs button.on, #npHud #nppPinsMod .pTabs button[data-t="pinned"].on { color: #fff; background: none; } #npHud #nppPinsMod .pTabs::before { content: ""; position: absolute; z-index: 0; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 8px) / 2); border-radius: 8px; background: color-mix(in srgb, var(--np-accent, #fff) 40%, rgba(255,255,255,.1)); transition: transform .3s cubic-bezier(.34, 1.3, .5, 1); } #npHud #nppPinsMod[data-tab="pinned"] .pTabs::before { transform: translateX(calc(100% + 2px)); } #npHud #nppPinsMod #nppRecent, #npHud #nppPinsMod #nppPinned { animation: nppTabIn .28s ease both; } @keyframes nppTabIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } } @media (prefers-reduced-motion: reduce) { #npHud #nppPinsMod .pTabs::before { transition: none; } #npHud #nppPinsMod #nppRecent, #npHud #nppPinsMod #nppPinned { animation: none; } }
  #npHud #nppPinsMod #nppRecent, #npHud #nppPinsMod #nppPinned { padding: 0; height: auto; min-height: 0; flex: 0 0 auto; }
  #npHud #nppPinsMod .rList { box-sizing: border-box; width: 100%; margin: 0 !important; padding: 0 !important; max-height: 92px; height: auto; flex: 0 0 auto; gap: 4px; overflow-x: hidden; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; } #npHud #nppPinsMod .rList::-webkit-scrollbar { display: none; width: 0; height: 0; } #npHud #nppPinsMod .rList li { box-sizing: border-box; width: 100%; } #npHud #nppPinsMod .rPin { right: 6px; }
  #npHud #nppPinsMod .rList:empty::before { color: var(--pn-t3); }
  #npHud #nppPinsMod .rList a { height: 28px; background: rgba(255,255,255,.05) !important; border: 0 !important; border-radius: 8px; box-sizing: border-box; width: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 34px 0 10px !important; color: #fff; }
  #npHud #nppPinsMod .rList a:hover { background: rgba(255,255,255,.14) !important; }
  #npHud #nppPinsMod .rList b { color: #fff; }

  #npHud #npUser #npUserTitle { font: 400 18px/1.15 'CafeteriaBlack', Georgia, serif !important; letter-spacing: 0; }
  #npHud #nppListsMod .nppLt b { font: 400 16px/1 'CafeteriaBlack', Georgia, serif; }
  #npHud #nppPetInfo .nppTitle a { min-width: 0; overflow: hidden; }
  #npHud #nppPetInfo .nppName { font: 400 24px/1.15 'CafeteriaBlack', Georgia, serif !important; letter-spacing: 0; padding: 0 28px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; overflow-wrap: normal; }
  #npHud #npNp .np-top-row .np-amount::before, #npHud #npNp .np-top-row .np-nc::before { display: none !important; }
  #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { grid-row: 1 !important; align-self: center; }
  #npHud #npNp .np-top-row .np-amounts { grid-template-columns: none !important; } #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { display: block; min-width: 0; overflow: hidden !important; text-overflow: clip !important; }
  #npHud #nppPetInfo .nppChips { flex: 1 1 auto; min-width: max-content; flex-wrap: nowrap; align-items: center; gap: 6px; }
  #npHud #nppPetInfo .nppChip { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.1); font-size: 12px; line-height: 1; white-space: nowrap; flex: 0 0 auto; }
  #npHud #nppPetInfo .nppLinks { align-items: center; gap: 6px !important; }
  #npHud #nppPetInfo .nppLinks a, #npHud #nppPetInfo .nppLinks button { box-sizing: border-box; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.14); border-radius: 50%; background: rgba(255,255,255,.1); color: #fff; }
  &.npp-side-light #npHud #nppPetInfo .nppChip, &.npp-side-light #npHud #nppPetInfo .nppLinks a, &.npp-side-light #npHud #nppPetInfo .nppLinks button { background: #fff; border-color: rgba(0,0,0,.10); color: #1c1830 !important; }
  &.npp-side-light #npHud #nppPetInfo .nppLinks a:hover, &.npp-side-light #npHud #nppPetInfo .nppLinks button:hover { background: #f1eff7; }
  &.npp-side-light #npHud #nppPetInfo .nppLinks button.on { background: color-mix(in srgb, var(--np-accent, #888) 35%, rgba(255,255,255,.6)); }
  &.npp-side-light #npHud { --pn-t2: rgba(28,24,48,.68); --pn-t3: rgba(28,24,48,.5); }
  &.npp-side-light #npHud > #npUser, &.npp-side-light #npHud > #npNp, &.npp-side-light #npHud > #npActivePet, &.npp-side-light #npHud > #nppListsMod, &.npp-side-light #npHud > #nppFoot { background: rgba(255,255,255,.72) !important; -webkit-backdrop-filter: blur(18px) !important; backdrop-filter: blur(18px) !important; border-color: rgba(0,0,0,.08) !important; box-shadow: 0 8px 24px rgba(40,30,80,.14) !important; color: #1c1830; }
  &.npp-side-light #npHud #npUserTitle, &.npp-side-light #npHud #nppPetInfo .nppTitle a, &.npp-side-light #npHud #nppPetInfo .nppName { color: #1c1830 !important; text-shadow: none !important; }
  &.npp-side-light #npHud #npNp .np-top-row .npVal, &.npp-side-light #npHud #npNp .np-top-row .ncVal, &.npp-side-light #npHud #npNp, &.npp-side-light #npHud #npNp .np-amount, &.npp-side-light #npHud #npNp .np-nc { color: #1c1830 !important; }
  &.npp-side-light #npHud #npNp .np-chevron { color: rgba(28,24,48,.68) !important; } 
  &.npp-side-light #npHud #npNp .np-bank-drawer { border-top-color: rgba(0,0,0,.08); } &.npp-side-light #npNp .bankGraph text { fill: rgba(28,24,48,.7); }
  &.npp-side-light #npHud #nppPetInfo .nppSub, &.npp-side-light #npHud #nppPetInfo { color: rgba(28,24,48,.68); }
  &.npp-side-light #npHud #nppPetInfo .nppTitle .nppCopy { color: rgba(28,24,48,.6); } &.npp-side-light #npHud #nppPetInfo .nppTitle .nppCopy:hover { background: rgba(0,0,0,.07); color: #1c1830; }
  &.npp-side-light #npHud #nppListsMod .nppLt em { color: #1c1830; }
  &.npp-side-light #npHud #nppListsMod .nppLt + .nppLt::before { background: rgba(0,0,0,.10); }
  &.npp-side-light #npHud #nppPinsMod .pTabs { background: rgba(0,0,0,.06); }
  &.npp-side-light #npHud #nppPinsMod .pTabs button, &.npp-side-light #npHud #nppPinsMod .rPin { color: rgba(28,24,48,.6); }
  &.npp-side-light #npHud #nppPinsMod .pTabs button.on, &.npp-side-light #npHud #nppPinsMod .pTabs button[data-t="pinned"].on { color: #1c1830; }
  &.npp-side-light #npHud #nppPinsMod .rList a { background: #fff !important; color: #1c1830 !important; } &.npp-side-light #npHud #nppPinsMod .rList a:hover { background: #f1eff7 !important; }
  &.npp-side-light #npHud #nppPinsMod .rEmpty { color: rgba(28,24,48,.6) !important; }
  &.npp-side-light #npHud #nppPinsMod .rList b { color: #1c1830; } &.npp-side-light #npHud #nppPinsMod .rList:empty::before { color: rgba(28,24,48,.5); }
  &.npp-side-light #npHud #nppPinsMod li.isPinned .rPin { color: #d89a00; }
  #npHud #npNp .np-top-row { align-items: center; min-height: 0; }
  #nppIcons #nppNestPop { border: 0 !important; }
  #nppIcons #nppNestPop::before { content: ""; position: absolute; left: -6px; right: -6px; top: 100%; height: 16px; }
  #nppIcons #nppNestPop .col, #nppIcons #nppNestPop .col > *, #nppIcons #nppNestPop .col > * * { border: 0 !important; }
  #nppColors .nppSideRow .nppLogoDot { display: none; }

  #npHud #nppIcons #btnOverlay .col { justify-content: space-evenly !important; flex-wrap: nowrap !important; gap: 8px !important; }
  #npHud #nppIcons #btnOverlay .col img { max-width: 36px; max-height: 36px; width: 36px; height: 36px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,.45)); }
  #npHud #nppIcons #btnOverlay .col > * { transition: transform .18s ease, filter .18s ease; }
  #npHud #nppIcons #btnOverlay .col > *:hover { transform: translateY(-2px); filter: brightness(1.12); }
  @media (prefers-reduced-motion: reduce) { #npHud #nppIcons #btnOverlay .col > * { transition: none; } #npHud #nppIcons #btnOverlay .col > *:hover { transform: none; } }

  #qrDockWrap { scrollbar-width: none !important; -ms-overflow-style: none; }
  #qrDockWrap::-webkit-scrollbar, #qrDock::-webkit-scrollbar { display: none !important; }
  #qrDock { scrollbar-width: none !important; }
  #qrDock .qrPet { position: relative !important; min-height: 120px !important; flex: 1 0 120px !important; overflow: hidden; }
  #qrDock .qrPet::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 55%; background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,0)); pointer-events: none; z-index: 1; }
  #qrDock .qrPetName { position: absolute !important; left: 0 !important; right: 0 !important; bottom: 0 !important; top: auto !important; z-index: 2; margin: 0 !important; padding: 14px 10px 8px !important; opacity: 1 !important; visibility: visible !important; transform: none !important; background: none !important; color: #fff !important; font-size: 17px !important; line-height: 1.15; text-align: center; text-shadow: 0 1px 3px rgba(0,0,0,.95), 0 0 8px rgba(0,0,0,.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
  #qrDock .qrOverlay { position: absolute !important; inset: 0 !important; z-index: 3; opacity: 1 !important; visibility: visible !important; background: none !important; display: flex !important; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 0 0 28px; pointer-events: none; }
  #qrDock .qrOverlay a { pointer-events: auto; opacity: 0; visibility: hidden; transform: translateY(4px); transition: opacity .15s, transform .15s, visibility 0s .15s; display: inline-flex; align-items: center; justify-content: center; min-width: 118px; min-height: 30px; box-sizing: border-box; padding: 5px 14px; border-radius: 999px; background: rgba(14,12,22,.88) !important; border: 1px solid rgba(255,255,255,.55); color: #fff !important; font-size: 14px !important; font-weight: 700; text-decoration: none !important; text-shadow: none; box-shadow: 0 2px 8px rgba(0,0,0,.5); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
  #qrDock .qrOverlay a:hover, #qrDock .qrOverlay a:focus-visible { background: #fff !important; color: #14111f !important; outline: none; }
  #qrDock .qrPet:hover .qrOverlay a, #qrDock .qrPet:focus-within .qrOverlay a, #qrDock .qrPet.nppTap .qrOverlay a { opacity: 1; visibility: visible; transform: none; transition: opacity .15s, transform .15s, visibility 0s; }
  @media (hover: none), (max-width: 640px) { #qrDock .qrOverlay a { opacity: 1; visibility: visible; transform: none; min-height: 28px; font-size: 13px !important; } #qrDock .qrOverlay { gap: 5px; } }
  @media (prefers-reduced-motion: reduce) { #qrDock .qrOverlay a { transition: none; } }

  #nppNavMod { display: none; }
  #nppNavMod .nppNavGrp + .nppNavGrp { border-top: 1px solid var(--npp-card-line); }
  #nppNavMod .nppNavLinks { display: none; padding: 0 12px 8px; }
  #nppNavMod .nppNavGrp.open .nppNavLinks { display: block; }
  #nppNavMod .nppNavLinks a { display: block; padding: 6px 4px; color: rgba(255,255,255,.9) !important; font-size: 13.5px; text-decoration: none !important; border-radius: 6px; }
  #nppNavMod .nppNavLinks a:hover { background: rgba(255,255,255,.12); }
  #nppNavMod a.nppNavSolo { display: block; padding: 9px 12px; color: #fff !important; font: 700 12px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; text-decoration: none !important; }

  #nppMenuBtn { display: none; position: fixed; left: 10px; top: var(--npp-tools-top, 27px); transform: translateY(-50%); z-index: 2010; width: 40px; height: 40px; padding: 0; align-items: center; justify-content: center; border: 1px solid var(--npp-card-line); border-radius: 12px; background: var(--npp-card); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: #fff; cursor: pointer; }
  #nppMenuBtn svg { width: 20px; height: 20px; }
  #nppScrim { display: none; position: fixed; inset: 0; z-index: 2040; background: rgba(8,6,14,.55); opacity: 0; transition: opacity .25s; }
  #nppDrawerClose { display: none; position: fixed; top: 8px; left: calc(var(--npp-drawer-w) - 48px); z-index: 2052; width: 38px; height: 38px; padding: 0; align-items: center; justify-content: center; border: 1px solid var(--npp-card-line); border-radius: 10px; background: rgba(0,0,0,.35); color: #fff; font-size: 22px; line-height: 1; cursor: pointer; }
  &.npp-wait #nppMenuBtn { opacity: 0; }

  @media (max-height: 820px) {
    --np-hud-top: 66px !important;
  }

  @media (max-width: 1100px) {
    --np-col-width: 0px !important;
    #npLeftBar { left: 0 !important; width: var(--npp-drawer-w) !important; z-index: 2050 !important; transform: translateX(-104%); visibility: hidden; transition: transform .26s cubic-bezier(.22, 1, .36, 1), visibility 0s .26s; }
    #npHud { left: 0 !important; width: var(--npp-drawer-w) !important; top: 52px !important; z-index: 2051 !important; transform: translateX(-104%); visibility: hidden; transition: transform .26s cubic-bezier(.22, 1, .36, 1), visibility 0s .26s; }
    &.nppDrawerOpen #npLeftBar, &.nppDrawerOpen #npHud { transform: none; visibility: visible; transition: transform .26s cubic-bezier(.22, 1, .36, 1), visibility 0s; }
    &.nppDrawerOpen #nppScrim { display: block; opacity: 1; }
    &.nppDrawerOpen #nppDrawerClose { display: flex; }
    &.nppDrawerOpen body { overflow: hidden !important; }
    #nppMenuBtn { display: flex; }
    #nppTools .nppSearch.nppOpen input { width: min(252px, calc(100vw - 150px)); }
  }
  @media (max-width: 1100px) and (max-height: 820px) { #npHud { top: 48px !important; } }
  @media (max-width: 640px) { #nppNavMod { display: block; } }
  @keyframes nppTrayIn { from { opacity: 0; transform: translateY(16px) scale(.4); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { #npLeftBar, #npHud, #nppScrim { transition: none !important; } } #npHud #npActivePet #nppPetInfo { container-type: inline-size; flex-wrap: wrap !important; } #npHud #npActivePet #nppPetInfo .nppChips { gap: 0 !important; justify-content: flex-start !important; flex-wrap: nowrap !important; } #npHud #npActivePet #nppPetInfo .nppChip { height: auto !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; line-height: 1.2 !important; white-space: nowrap !important; flex: 0 0 auto !important; } #npHud #npActivePet #nppPetInfo .nppChip:not(.gF):not(.gM) { color: var(--pn-t2, rgba(255,255,255,.7)) !important; } #npHud #npActivePet #nppPetInfo .nppChip + .nppChip::before { content: "·"; margin: 0 6px; } #npHud #npActivePet #nppPetInfo .nppLinks { justify-content: flex-end !important; } #npHud #npActivePet #nppPetInfo .nppLinks a, #npHud #npActivePet #nppPetInfo .nppLinks button { flex: 0 0 auto !important; padding: 0 !important; } #npHud #nppListsMod { grid-template-columns: 1fr auto 1fr !important; gap: 0 !important; } #npHud #nppListsMod::before { content: ""; grid-column: 2; grid-row: 1; width: 1px; margin: 8px 0; background: rgba(255,255,255,.10); pointer-events: none; } #npHud #nppListsMod .nppLt + .nppLt::before { display: none !important; } #npHud #nppListsMod .nppLt b { font-family: 'CafeteriaBlack', Georgia, serif !important; letter-spacing: normal !important; flex: 0 0 auto !important; overflow: visible !important; text-overflow: clip !important; white-space: nowrap !important; } #npHud #nppListsMod .nppLt em { box-sizing: border-box !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; height: 16px !important; min-width: 16px !important; padding: 0 5px !important; line-height: 1 !important; } #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { font-family: 'CafeteriaBlack', Georgia, serif !important; } #npHud #nppPinsMod .pTabs button { font: 400 13px/1.1 'CafeteriaBlack', Georgia, serif !important; letter-spacing: normal !important; text-transform: none !important; }
  #npHud #npUser #npUserTitle { font-size: 21px !important; font-weight: 400 !important; line-height: 1.15 !important; }
  #npHud #nppListsMod .nppLt b { font-size: 16px !important; font-weight: 400 !important; }
  #npHud #nppListsMod .nppLt em { font-size: 10px !important; font-weight: 600 !important; }
  #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { font-weight: 400 !important; }
  #npHud #nppPetInfo .nppName { font-size: 26px !important; font-weight: 400 !important; line-height: 1.15 !important; }
  #npHud #nppPetInfo .nppSub { font-size: 12px !important; font-weight: 500 !important; line-height: 1.3 !important; }
  #npHud #npActivePet #nppPetInfo .nppChip { font-size: 11px !important; font-weight: 500 !important; }
  #npHud #nppPinsMod .pTabs button { font-size: 16px !important; font-weight: 400 !important; }
  #npHud #nppPinsMod .rList b { font-size: 12px !important; font-weight: 500 !important; }
  #npHud #npUser #npUserTitle, #npHud #nppListsMod .nppLt b, #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal, #npHud #nppPetInfo .nppName, #npHud #nppPinsMod .pTabs button { text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6) !important; }
  &.npp-side-light #npHud #npUser #npUserTitle, &.npp-side-light #npHud #nppListsMod .nppLt b, &.npp-side-light #npHud #npNp .np-top-row .npVal, &.npp-side-light #npHud #npNp .np-top-row .ncVal, &.npp-side-light #npHud #nppPetInfo .nppName, &.npp-side-light #npHud #nppPinsMod .pTabs button { text-shadow: none !important; }
  #npHud { --npp-pill-h: 36px; --npp-pill-r: 10px; --npp-pill-bg: rgba(255,255,255,.08); --npp-pill-bg-h: rgba(255,255,255,.15); }
  &.npp-side-light #npHud { --npp-pill-bg: rgba(0,0,0,.05); --npp-pill-bg-h: rgba(0,0,0,.09); }
  #npHud > #npUser { padding: 10px 12px !important; }
  #npHud #npUser .rightSide { grid-template-columns: 44px minmax(0, 1fr) auto !important; column-gap: 12px !important; }
  #npHud #npUser #nppAvatar { width: 44px !important; height: 44px !important; }
  #npHud #npUser #npLogoutBtn, #npHud #npUser #npSwapBtn { background: var(--npp-pill-bg) !important; }
  #npHud #npUser #npSwapBtn:hover { background: var(--npp-pill-bg-h) !important; }
  #npHud > #nppListsMod { display: grid !important; gap: 8px !important; padding: 8px !important; }
  #npHud #nppListsMod::before { display: none !important; }
  #npHud #nppListsMod .nppLtAcct, #npHud #nppListsMod .nppLtPets { grid-column: auto !important; grid-row: auto !important; }
  #npHud #nppListsMod .nppLt { display: flex !important; align-items: center !important; height: var(--npp-pill-h) !important; border: 0 !important; border-radius: var(--npp-pill-r) !important; background: var(--npp-pill-bg) !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
  #npHud #nppListsMod .nppLt:hover { background: var(--npp-pill-bg-h) !important; }
  #npHud #nppListsMod .nppLt svg { width: 16px !important; height: 16px !important; flex: none; }
  #npHud #nppListsMod .nppLt em { border-radius: 999px !important; background: rgba(255,255,255,.14) !important; color: inherit !important; }
  #npHud #npNp .np-chevron { width: var(--npp-pill-h) !important; height: var(--npp-pill-h) !important; border-radius: var(--npp-pill-r) !important; }
  &.npp-side-light #npHud #npUser #npUserTitle, &.npp-side-light #npHud #npUser .name, &.npp-side-light #npHud #npUser .name * { color: #1c1830 !important; text-shadow: none !important; }
  &.npp-side-light #npHud #npUser[data-main="1"] .rightSide::after { color: #1c1830 !important; }
  &.npp-side-light #npHud #npUser #npLogoutBtn, &.npp-side-light #npHud #npUser #npSwapBtn, &.npp-side-light #npHud #npUser #npSwapBtn:hover { color: #1c1830 !important; }
  &.npp-side-light #npHud #npUser #npLogoutBtn:hover { color: #d33 !important; background: rgba(255,90,90,.16) !important; }
  &.npp-side-light #npHud #nppListsMod .nppLt, &.npp-side-light #npHud #nppListsMod .nppLt b { color: #1c1830 !important; }
  &.npp-side-light #npHud #nppListsMod .nppLt em { background: rgba(0,0,0,.08) !important; }
  &.npp-side-light #npHud #npNp .np-chevron:hover { color: #1c1830 !important; background: var(--npp-pill-bg-h) !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppTitle a, &.npp-side-light #npHud #npActivePet #nppPetInfo .nppName, &.npp-side-light #npHud #npActivePet #nppPetInfo .nppLinks a, &.npp-side-light #npHud #npActivePet #nppPetInfo .nppLinks button { color: #1c1830 !important; text-shadow: none !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppChip:not(.gF):not(.gM) { color: rgba(28,24,48,.68) !important; }

  #npHud #npUser #nppAcctBtns { gap: 2px !important; }
  #npHud #npUser #npLogoutBtn, #npHud #npUser #npSwapBtn { width: 26px !important; height: 26px !important; border-radius: 8px !important; }
  #npHud #npUser #npLogoutBtn svg, #npHud #npUser #npSwapBtn svg { width: 14px !important; height: 14px !important; }
  #npHud > #nppListsMod { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important; }
  #npHud #nppListsMod .nppLt { box-sizing: border-box !important; min-width: 0 !important; width: 100% !important; justify-content: flex-start !important; gap: 8px !important; padding: 0 12px !important; }
  #npHud #nppListsMod .nppLt em { margin-left: auto !important; }
  #npHud > #npUser { order: 1; }
  #npHud > #npNp { order: 2; position: relative !important; z-index: 3; }
  #npHud > #nppListsMod { order: 3; }
  #npHud #npNp .np-top-row { justify-content: center !important; }
  #npHud #npNp .np-top-row .np-amounts { justify-content: center !important; }
  #npHud #npNp .np-top-row .np-amount, #npHud #npNp .np-top-row .np-nc, #npHud #npNp .np-top-row .np-bank { display: flex !important; flex: 0 0 auto !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: auto !important; min-width: 0 !important; height: 26px !important; min-height: 26px !important; margin: 0 !important; padding: 0 10px 0 22px !important; gap: 4px !important; border: 1px solid rgba(255,255,255,.10) !important; border-radius: 999px !important; background: rgba(18,16,28,.62) !important; -webkit-backdrop-filter: blur(18px) saturate(140%) !important; backdrop-filter: blur(18px) saturate(140%) !important; box-shadow: 0 4px 12px rgba(0,0,0,.25) !important; color: #fff !important; font-size: 14px !important; }
  #npHud #npNp .np-top-row .np-amount:hover, #npHud #npNp .np-top-row .np-nc:hover, #npHud #npNp .np-top-row .np-bank:hover { background: rgba(40,36,56,.78) !important; }
  #npHud #npNp .np-top-row .np-amount img, #npHud #npNp .np-top-row .np-nc img { width: 18px !important; height: 18px !important; left: 3px !important; }
  #npHud #npNp .np-top-row .npVal, #npHud #npNp .np-top-row .ncVal { font-size: 14px !important; line-height: 1 !important; }
  #npHud #npNp .np-top-row .np-bank { width: 26px !important; padding: 0 !important; text-decoration: none !important; cursor: pointer; }
  #npHud #npNp .np-top-row .np-bank img { position: static !important; transform: none !important; width: 18px !important; height: 18px !important; }
  #npHud #npNp .np-top-row .np-bank svg { width: 16px; height: 16px; display: block; }
  &.npp-side-light #npHud #npNp .np-top-row .np-amount, &.npp-side-light #npHud #npNp .np-top-row .np-nc, &.npp-side-light #npHud #npNp .np-top-row .np-bank { background: rgba(255,255,255,.72) !important; border-color: rgba(0,0,0,.08) !important; box-shadow: 0 4px 12px rgba(40,30,80,.14) !important; color: #1c1830 !important; }
  &.npp-side-light #npHud #npNp .np-top-row .np-amount:hover, &.npp-side-light #npHud #npNp .np-top-row .np-nc:hover, &.npp-side-light #npHud #npNp .np-top-row .np-bank:hover { background: rgba(255,255,255,.9) !important; }
  &.npp-side-light #npHud #npNp .np-top-row .npVal, &.npp-side-light #npHud #npNp .np-top-row .ncVal { color: #1c1830 !important; }
  #npHud #npActivePet #npPetDockBtn { top: 8px !important; right: 8px !important; }
  #nppIcons #nppNestPop { background: rgba(255,255,255,.14) !important; -webkit-backdrop-filter: blur(18px) saturate(160%) !important; backdrop-filter: blur(18px) saturate(160%) !important; }
  #nppIcons #nppNestPop::before { background: none !important; }
  #nppIcons #nppNestPop::after { transform: none !important; width: 14px !important; height: 7px !important; top: 100% !important; bottom: auto !important; margin-left: -7px !important; border: 0 !important; clip-path: polygon(0 0, 100% 0, 50% 100%); background: rgba(255,255,255,.14) !important; -webkit-backdrop-filter: blur(18px) saturate(160%) !important; backdrop-filter: blur(18px) saturate(160%) !important; }
  &.npp-side-light #nppIcons #nppNestPop, &.npp-side-light #nppIcons #nppNestPop::after { background: rgba(255,255,255,.45) !important; }
  #npHud > #npUser { padding-bottom: 22px !important; }
  #npHud > #npNp { box-sizing: border-box !important; width: calc(100% - 24px) !important; max-width: none !important; align-self: flex-start !important; margin: -15px 12px 0 !important; padding: 0 !important; background: transparent !important; border: 0 !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; min-height: 30px !important; }
  #npHud > #npNp .np-top-row { display: block !important; box-sizing: border-box !important; width: 100% !important; min-width: 0 !important; flex: none !important; background: none !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
  #npHud > #npNp .np-top-row .np-amounts { display: flex !important; width: 100% !important; max-width: 100% !important; min-width: 0 !important; flex: none !important; align-items: stretch !important; gap: 0 !important; box-sizing: border-box !important; height: 30px !important; padding: 0 !important; margin: 0 !important; overflow: hidden !important; border-radius: 999px !important; background: rgba(18,16,28,.72) !important; border: 1px solid rgba(255,255,255,.12) !important; -webkit-backdrop-filter: blur(18px) saturate(140%) !important; backdrop-filter: blur(18px) saturate(140%) !important; box-shadow: 0 4px 14px rgba(0,0,0,.28) !important; }
  #npHud > #npNp .np-top-row .np-amounts > a { position: static !important; display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; flex: 1 1 0 !important; min-width: 0 !important; width: auto !important; height: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; gap: 5px !important; border: 0 !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; color: #fff !important; font-size: 13px !important; text-decoration: none !important; }
  #npHud > #npNp .np-top-row .np-amounts > a + a { border-left: 1px solid rgba(255,255,255,.14) !important; }
  #npHud > #npNp .np-top-row .np-amounts > a.np-bank { flex: 0 0 34px !important; width: 34px !important; }
  #npHud > #npNp .np-top-row .np-amounts > a:hover { background: var(--npp-pill-bg-h) !important; }
  #npHud > #npNp .np-top-row .np-amounts > a img { position: static !important; transform: none !important; left: auto !important; width: 16px !important; height: 16px !important; margin: 0 !important; }
  #npHud > #npNp .np-top-row .np-amounts > a.np-amount img, #npHud > #npNp .np-top-row .np-amounts > a.np-nc img { order: -1; }
  #npHud > #npNp .np-top-row .np-amounts > a .npVal, #npHud > #npNp .np-top-row .np-amounts > a .ncVal { font-size: 13px !important; line-height: 1 !important; }
  #npHud > #npNp .np-top-row .np-amounts > a.np-bank svg { width: 16px !important; height: 16px !important; display: block !important; }
  &.npp-side-light #npHud > #npNp .np-top-row .np-amounts { background: rgba(255,255,255,.85) !important; border-color: rgba(0,0,0,.08) !important; box-shadow: 0 4px 14px rgba(40,30,80,.14) !important; }
  &.npp-side-light #npHud > #npNp .np-top-row .np-amounts > a, &.npp-side-light #npHud > #npNp .np-top-row .np-amounts > a .npVal, &.npp-side-light #npHud > #npNp .np-top-row .np-amounts > a .ncVal { color: #1c1830 !important; }
  &.npp-side-light #npHud > #npNp .np-top-row .np-amounts > a + a { border-left-color: rgba(0,0,0,.10) !important; }
  &.npp-side-light #npHud > #npNp .np-top-row .np-amounts > a:hover { background: var(--npp-pill-bg-h) !important; }
  #npHud #nppPinsMod .pTabs button { text-align: left !important; justify-content: flex-start !important; padding-left: 10px !important; }
  #npHud #nppPinsMod .rList li > a { padding: 0 10px !important; align-items: flex-start !important; text-align: left !important; }
  #npHud #nppPinsMod .rList li > a b { max-width: 100% !important; text-align: left !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
  #npHud #nppPinsMod .rList li .rPin { right: 3px !important; width: 22px !important; height: 22px !important; border-radius: 7px !important; background: rgba(40,36,56,.92) !important; opacity: 0 !important; pointer-events: none !important; z-index: 2; }
  #npHud #nppPinsMod .rList li:hover .rPin, #npHud #nppPinsMod .rList li .rPin:focus, #npHud #nppPinsMod .rList li .rPin:focus-visible { opacity: 1 !important; pointer-events: auto !important; }
  &.npp-side-light #npHud #nppPinsMod .rList li .rPin { background: rgba(255,255,255,.95) !important; }
  #npHud #nppPinsMod .rList li.isPinned .rPin { color: #ffd166 !important; } &.npp-side-light #npHud #nppPinsMod .rList li.isPinned .rPin { color: #d89a00 !important; }
  #npHud #npActivePet #nppPetInfo { align-items: stretch !important; }
  #npHud #npActivePet #nppPetInfo .nppChips { order: 1 !important; flex: 1 1 auto !important; min-width: 0 !important; align-items: center !important; box-sizing: border-box !important; margin: 0 0 0 calc(-1 * var(--pn-pad, 12px)) !important; padding: 6px 0 6px var(--pn-pad, 12px) !important; background: var(--npp-pill-bg) !important; }
  #npHud #npActivePet #nppPetInfo .nppLinks { order: 2 !important; flex: 0 0 auto !important; align-items: center !important; box-sizing: border-box !important; margin: 0 calc(-1 * var(--pn-pad, 12px)) 0 0 !important; padding: 6px var(--pn-pad, 12px) 6px 0 !important; gap: 4px !important; background: var(--npp-pill-bg) !important; }
  #npHud #npActivePet #nppPetInfo .nppLinks a, #npHud #npActivePet #nppPetInfo .nppLinks button { width: 26px !important; height: 26px !important; }
  #npHud #npActivePet #nppPetInfo .nppLinks a svg, #npHud #npActivePet #nppPetInfo .nppLinks button svg { width: 14px !important; height: 14px !important; }
  #npHud #npActivePet #nppPetInfo .nppDetails { order: 4 !important; }
  #npHud > #npActivePet { padding-bottom: 0 !important; gap: 0 !important; }
  #npHud #npActivePet > img { vertical-align: top !important; }
  #npHud #npActivePet #nppPetInfo { position: static !important; gap: 0 !important; margin: 0 !important; }
  #npHud #npActivePet #nppPetInfo .nppTitle { position: absolute !important; left: 10px !important; right: 10px !important; top: var(--npp-img-h, 240px) !important; transform: translateY(calc(-100% - 10px)) !important; z-index: 3 !important; display: flex !important; align-items: center !important; flex-wrap: nowrap !important; justify-content: flex-start !important; gap: 6px !important; margin: 0 !important; max-width: calc(100% - 20px) !important; text-align: left !important; }
  #npHud #npActivePet #nppPetInfo .nppTitle a { display: block !important; position: static !important; min-width: 0 !important; text-align: left !important; }
  #npHud #npActivePet #nppPetInfo .nppName { font-family: 'CafeteriaBlack', Georgia, serif !important; font-size: 26px !important; font-weight: 400 !important; line-height: 1.05 !important; letter-spacing: .02em !important; padding: 0 !important; }
  #npHud #npActivePet #nppPetInfo .nppSub, #npHud #npActivePet #nppPetInfo .nppTitle .nppCopy { opacity: 0 !important; transform: translateY(4px) !important; transition: opacity .18s ease, transform .18s ease, background .15s !important; }
  #npHud #npActivePet #nppPetInfo .nppSub { position: absolute !important; left: 0 !important; bottom: 100% !important; top: auto !important; margin: 0 0 4px !important; display: -webkit-box !important; -webkit-box-orient: vertical !important; -webkit-line-clamp: 2 !important; box-sizing: border-box !important; width: max-content !important; max-width: 100% !important; overflow: hidden !important; white-space: normal !important; pointer-events: none !important; font: 600 11.5px/1.25 'Outfit', system-ui, sans-serif !important; padding: 4px 9px !important; border-radius: 999px !important; background: rgba(20,16,32,.55) !important; -webkit-backdrop-filter: blur(10px) !important; backdrop-filter: blur(10px) !important; color: #fff !important; text-shadow: none !important; }
  #npHud #npActivePet #nppPetInfo .nppSub .nppG.gF { color: #ffb3d9 !important; text-shadow: none !important; }
  #npHud #npActivePet #nppPetInfo .nppSub .nppG.gM { color: #a8d4ff !important; text-shadow: none !important; }
  #npHud #npActivePet #nppPetInfo .nppTitle .nppCopy { position: static !important; flex: 0 0 auto !important; }
  #npHud #npActivePet:hover #nppPetInfo .nppSub, #npHud #npActivePet:focus-within #nppPetInfo .nppSub, #npHud #npActivePet:hover #nppPetInfo .nppTitle .nppCopy, #npHud #npActivePet:focus-within #nppPetInfo .nppTitle .nppCopy { opacity: 1 !important; transform: none !important; }
  #npHud #npActivePet.npp-name-dark #nppPetInfo .nppTitle a, #npHud #npActivePet.npp-name-dark #nppPetInfo .nppName, #npHud #npActivePet.npp-name-dark #nppPetInfo .nppTitle .nppCopy { color: #1c1830 !important; text-shadow: none !important; }
  #npHud #npActivePet #nppPetInfo .nppTitle a, #npHud #npActivePet #nppPetInfo .nppName, #npHud #npActivePet #nppPetInfo .nppTitle .nppCopy { transition: opacity .15s; }
  #npHud #npActivePet.npp-tone-pending #nppPetInfo .nppTitle a, #npHud #npActivePet.npp-tone-pending #nppPetInfo .nppName, #npHud #npActivePet.npp-tone-pending #nppPetInfo .nppTitle .nppCopy { opacity: 0 !important; }
  #npHud #npActivePet.npp-name-light #nppPetInfo .nppTitle a, #npHud #npActivePet.npp-name-light #nppPetInfo .nppName, #npHud #npActivePet.npp-name-light #nppPetInfo .nppTitle .nppCopy { color: #fff !important; text-shadow: 0 1px 3px rgba(0,0,0,.85), 0 1px 1px rgba(0,0,0,.6) !important; }
  #npHud #npActivePet #nppPetInfo .nppStats { box-sizing: border-box !important; width: 100% !important; margin: 0 !important; }
  #npHud #npActivePet #nppPetInfo .nppStats.open { padding: 10px 0 var(--pn-pad, 12px) !important; }
  #npHud #npActivePet #nppPetInfo .nppStatsBody, #npHud #npActivePet #nppPetInfo .nppStatsBody .nppDetails { box-sizing: border-box !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
  #npHud #npActivePet #nppPetInfo .nppStatsBody .nppDetails { display: flex !important; flex-direction: column !important; gap: 6px !important; }
  #npHud #npActivePet #nppPetInfo .nppStatsBody .nppStat { box-sizing: border-box !important; width: 100% !important; display: flex !important; justify-content: space-between !important; align-items: center !important; gap: 8px !important; margin: 0 !important; padding: 5px 10px !important; line-height: 1.3 !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppStatsBody .nppStat { background: rgba(0,0,0,.08) !important; text-shadow: none !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppStatsBody .nppStat span { color: rgba(28,24,48,.68) !important; text-shadow: none !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppStatsBody .nppStat b { color: #1c1830 !important; text-shadow: none !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppStatsBody .nppStat b.gF { color: #c2377e !important; }
  &.npp-side-light #npHud #npActivePet #nppPetInfo .nppStatsBody .nppStat b.gM { color: #2f6fc4 !important; }
  &.npp-side-light #npHud #nppListsMod .nppLt { background: #fff !important; box-shadow: 0 1px 3px rgba(40,30,80,.08) !important; }
  &.npp-side-light #npHud #nppListsMod .nppLt:hover { background: #f3f0fa !important; }
}`;

  const NC_CSS = `
html[data-np-modern-interface] {
  --np-col-width: 0px !important;
  --np-bar-inset-left: 0px !important;
  #npHud, #npLeftBar, #btnOverlay, #npxSideBtnHost, #qrDockWrap, #nppFoot, #npBgHandle, #npBgSidebar,
  .navsub-left__2020, .navsub-right__2020 { display: none !important; }
}`;

  const BAR_STYLES = ['none', 'tint', 'blur', 'solid'];
  function applyAccentContrast(hexIn) {
    let hex = hexIn || '';
    try { if (!hex) hex = NQ.getAccent() || LSget('npqol_accent_v1'); } catch {}
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) { rs.setProperty('--npp-accent-fg', '#1a1330'); rs.setProperty('--npp-accent-fg-shadow', 'none'); return; }
    const n = parseInt(m[1], 16);
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
    const white = (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.059);
    rs.setProperty('--npp-accent-fg', white ? '#ffffff' : '#1a1330');
    rs.setProperty('--npp-accent-fg-shadow', white ? '0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6)' : 'none');
  }
  function applySearchContrast() {
    const style = root.dataset.nppBar || 'blur';
    let hex = '';
    try {
      if (style === 'none') hex = NQ.getAccent() || LSget('npqol_accent_v1');
      else hex = LSget('npp_color_head') || DEF.head;
    } catch {}
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    let white = true;
    if (m) {
      const n = parseInt(m[1], 16), k = style === 'none' ? 0.34 : 0.28;
      const lt = (v) => v * (1 - k) + 255 * k;
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const L = 0.2126 * lin(lt((n >> 16) & 255)) + 0.7152 * lin(lt((n >> 8) & 255)) + 0.0722 * lin(lt(n & 255));
      white = L <= 0.38;
    }
    rs.setProperty('--npp-search-fg-auto', white ? '#ffffff' : '#000000');
    rs.setProperty('--npp-search-ts-auto', white ? '0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6)' : 'none');
    rs.setProperty('--npp-search-icon-filter', white ? 'drop-shadow(0 1px 2px rgba(0,0,0,.8))' : 'none');
  }
  function applyLogo() { rs.setProperty('--npp-logo-filter', LSget('npp_logo_white') === '1' ? 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.35))' : 'none'); }
  const applyBarStyle = (v) => { root.dataset.nppBar = BAR_STYLES.includes(v) ? v : 'blur'; applySearchContrast(); try { applyNavContrast(); } catch {} };
  const BAR_CSS = `
html[data-np-modern-interface][data-npp-bar="none"] {
  --np-bar-bg: transparent !important; --np-bar-backdrop: none !important; --np-bar-line: transparent !important; --np-bar-shadow: none !important;
  --npp-nav-shadow: 0 1px 2px rgba(0,0,0,.6), 0 2px 8px rgba(0,0,0,.45);
  --npp-nav-stroke: 3.5px rgba(46,34,62,.92);
  --npp-nav-icon-filter: drop-shadow(0 0 1.5px rgba(46,34,62,.9)) drop-shadow(0 2px 4px rgba(0,0,0,.35));
  --npp-search-bg: color-mix(in srgb, var(--np-accent, #fff) 66%, #fff); --npp-search-bg-h: color-mix(in srgb, var(--np-accent, #fff) 56%, #fff); --npp-search-bg-f: color-mix(in srgb, var(--np-accent, #fff) 50%, #fff);
  --npp-search-line: color-mix(in srgb, var(--np-accent, #fff) 58%, #000); --npp-search-line-h: color-mix(in srgb, var(--np-accent, #fff) 50%, #000); --npp-search-line-f: color-mix(in srgb, var(--np-accent, #fff) 45%, #000);
  --npp-search-ring: color-mix(in srgb, var(--np-accent, #fff) 55%, transparent);
  --npp-search-shadow: inset 0 1px 2px rgba(0,0,0,.14), 0 1px 0 rgba(255,255,255,.45);
  --npp-menu-lift: -2px; --npp-menu-caret: block; --npp-menu-radius: 16px;
}
html[data-np-modern-interface][data-npp-bar="tint"] {
  --np-bar-bg: linear-gradient(180deg, var(--npp-head-a-tint, #ff8a1fb3), var(--npp-head-b-tint, #b86316b3)) !important;
  --np-bar-backdrop: none !important; --np-bar-line: rgba(255,255,255,.16) !important; --np-bar-shadow: 0 2px 10px rgba(0,0,0,.16) !important;
}
html[data-np-modern-interface][data-npp-bar="blur"] {
  --np-bar-bg: linear-gradient(180deg, var(--npp-head-a-blur, #ff8a1f8c), var(--npp-head-b-blur, #b863168c)) !important;
  --np-bar-backdrop: blur(16px) saturate(1.35) !important; --np-bar-line: rgba(255,255,255,.26) !important; --np-bar-shadow: 0 4px 22px rgba(0,0,0,.18) !important;
}
html[data-np-modern-interface][data-npp-bar="solid"] {
  --np-bar-bg: linear-gradient(180deg, var(--npp-head-a-solid, #ff8a1f), var(--npp-head-b-solid, #b86316)) !important;
  --np-bar-backdrop: none !important; --np-bar-line: rgba(255,255,255,.18) !important; --np-bar-shadow: 0 4px 18px rgba(0,0,0,.28) !important;
}`;

  const SHADOW_CSS = `
@font-face { font-family: 'CafeteriaBlack'; src: url('https://images.neopets.com/js/fonts/cafeteria-black.otf') format('opentype'); font-display: swap; }
.npp-clock { position: absolute; top: 50%; right: calc(14px + var(--npp-ic, 44px) * 2 + var(--npp-ig, 10px) + 12px); transform: translateY(-50%); z-index: 2; font: 400 20px/1 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .02em; color: var(--npp-nav-fg, #fff) !important; text-shadow: var(--npp-nav-shadow, 0 1px 3px rgba(0,0,0,.55), 0 1px 1px rgba(0,0,0,.4)) !important; pointer-events: none; white-space: nowrap; transition: opacity .15s ease; }
:host(.npp-search-open) .npp-clock { opacity: 0; }
#menu-premium { max-height: calc(100vh - 100px); overflow-x: hidden !important; overflow-y: auto !important; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.35) transparent; }
.menu a .npp-cd { margin-left: auto; padding: 2px 8px; border-radius: 9px; background: rgba(255,255,255,.16); color: #fff; font: normal 700 11px/1.3 'Outfit', system-ui, sans-serif; white-space: nowrap; }
.menuHead { position: sticky; top: -8px; z-index: 1; margin: 0 -8px; padding: 9px 20px 4px; background: rgba(14,12,22,.55); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); font: 700 10px/1 'Outfit', system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.5); }
#menu-premium::-webkit-scrollbar { width: 8px; }
#menu-premium::-webkit-scrollbar-thumb { background: rgba(255,255,255,.3); border-radius: 4px; }
.npp-search { position: absolute; right: 60px; top: 50%; transform: translateY(-50%); z-index: 2; width: 34px; height: 34px; margin: 0; pointer-events: auto; transition: width .45s cubic-bezier(.22, 1, .36, 1); }
.npp-search:hover, .npp-search:focus-within { width: 232px; }
.npp-search input { box-sizing: border-box; width: 100%; height: 34px; padding: 0 16px 0 40px; border: 1px solid transparent; border-radius: 999px; background: transparent; box-shadow: none; color: var(--npp-search-fg-auto, #fff); font: 400 17px 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .02em; text-shadow: var(--npp-search-ts-auto, 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6)); outline: 0; cursor: pointer; text-overflow: clip; transition: background .3s, border-color .3s, box-shadow .3s; }
.npp-search:hover input, .npp-search:focus-within input { cursor: text; border-color: var(--npp-search-line, rgba(0,0,0,.3)); background: var(--npp-search-bg, rgba(255,255,255,.28)); box-shadow: var(--npp-search-shadow, inset 0 1px 2px rgba(0,0,0,.16), 0 1px 0 rgba(255,255,255,.3)); }
.npp-search input:focus { background: var(--npp-search-bg-f, rgba(255,255,255,.42)); border-color: var(--npp-search-line-f, rgba(0,0,0,.42)); box-shadow: inset 0 1px 2px rgba(0,0,0,.14), 0 0 0 3px var(--npp-search-ring, rgba(255,255,255,.35)), 0 4px 14px rgba(0,0,0,.18); }
.npp-search input::placeholder { color: var(--npp-search-fg-auto, #fff); text-shadow: var(--npp-search-ts-auto, 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6)); opacity: 0; transition: opacity .12s; }
.npp-search:hover input::placeholder, .npp-search:focus-within input::placeholder { opacity: 1; transition: opacity .3s .2s; }
.npp-search button { position: absolute; z-index: 1; left: 2px; top: 50%; transform: translateY(-50%); width: 30px; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: transparent; cursor: pointer; }
.npp-search button img { width: 30px; height: 30px; display: block; filter: var(--npp-nav-icon-filter, drop-shadow(0 1px 2px rgba(0,0,0,.3))); transition: transform .35s cubic-bezier(.22, 1, .36, 1); }
.npp-search:hover button img, .npp-search:focus-within button img { transform: scale(.82); }
.npp-premcaret { display: none; position: absolute; z-index: 6; width: 12px; height: 12px; transform: rotate(45deg); background: rgba(40,36,52,.92); border-left: 1px solid rgba(255,255,255,.2); border-top: 1px solid rgba(255,255,255,.2); pointer-events: none; }
#menu-premium::before { content: none; }
.npp-prembg { display: none; position: absolute; overflow: hidden; box-sizing: border-box; border-radius: var(--npp-menu-radius, 0 0 16px 16px); pointer-events: none; }
.npp-prembg::before { content: ""; position: absolute; inset: -24px; background: linear-gradient(rgba(14,12,22,.38), rgba(14,12,22,.38)), var(--npLeftBarImg, none) center / cover no-repeat, var(--npLeftBarSolid, #2a292e); filter: blur(14px) saturate(1.15); }
.npp-logo { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); z-index: 2; display: flex; align-items: center; text-decoration: none; pointer-events: auto; }
.npp-logo img { height: 43px; max-width: 215px; display: block; filter: var(--npp-logo-filter, none); }
.npp-logo span { display: none; font: 400 32px 'CafeteriaBlack', Georgia, serif; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.8); }
.npp-logo.txt span { display: inline; }
.np-menu-edit-btn { position: relative; display: flex; align-items: center; justify-content: flex-start; gap: 8px; box-sizing: border-box; width: 100%; height: auto; margin: 6px 0 0; padding: 9px 14px 5px; border: 0; border-top: 1px solid rgba(255,255,255,.14); border-radius: 0; background: transparent; color: rgba(255,255,255,.78); font: 600 13px/1 'Outfit', system-ui, sans-serif; text-shadow: 0 1px 3px rgba(0,0,0,.85); cursor: pointer; transition: color .15s; }
.np-menu-edit-btn svg { width: 13px; height: 13px; flex: none; filter: drop-shadow(0 1px 2px rgba(0,0,0,.7)); }
.np-menu-edit-btn:hover, .np-menu-edit-btn.active { color: #fff; }
.np-menu-edit-btn:hover span { text-decoration: underline; text-underline-offset: 3px; }
.npp-tabs { display: flex; gap: 4px; margin-bottom: 6px; padding: 3px; border-radius: 11px; background: rgba(255,255,255,.08); }
.npp-tabs button { flex: 1; height: 30px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: rgba(255,255,255,.7); font: 400 18px 'CafeteriaBlack', Georgia, serif; cursor: pointer; transition: background .15s, color .15s; }
.npp-tabs button:hover { background: rgba(255,255,255,.14); color: #fff; }
#menu-shop[data-tab="np"] .npp-tabs [data-t="np"], #menu-shop[data-tab="nc"] .npp-tabs [data-t="nc"] { background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1330); text-shadow: var(--npp-accent-fg-shadow, none); }
#menu-shop[data-tab="np"] [data-g="nc"], #menu-shop[data-tab="nc"] [data-g="np"], #menu-shop .menuSep { display: none !important; }
.menu a.nppSnowRow svg { width: 22px; height: 22px; flex: none; color: #bfe3ff; }
.nppSnowBadge { margin-left: auto; padding: 2px 8px; border-radius: 9px; background: rgba(255,255,255,.16); color: #fff; font: normal 700 11px/1.3 'Outfit', system-ui, sans-serif; white-space: nowrap; font-variant-numeric: tabular-nums; }
.nppSnowBadge.asleep { background: #22b45a; }
.nppSnowBadge.ready { background: #f0a020; color: #2a1a00; }
.nppMainHint { padding: 2px 12px 4px; font: 500 11px/1.35 'Outfit', system-ui, sans-serif; color: rgba(255,255,255,.62); }
.menu a.nppMainRow { cursor: pointer; }
.menu a.nppMainRow span { font-size: 15px !important; }
.nppAlertRow svg { color: #ffd27a !important; }
.btn.npp-alert-on::after { content: ""; position: absolute; top: 6px; left: 37px; width: 9px; height: 9px; border-radius: 50%; background: #2fd873; box-shadow: 0 0 0 2px rgba(255,255,255,.92), 0 1px 3px rgba(0,0,0,.35); pointer-events: none; z-index: 1; }
@media (max-width: 1500px) { .btn.npp-alert-on::after { left: 29px; } }
@media (max-width: 1250px) { .btn.npp-alert-on::after { left: 26px; } }
@media (max-width: 900px) { :host(:not(.nppHam)) .inner { padding-left: 12px !important; padding-right: 12px !important; } :host(:not(.nppHam)) .npp-logo { display: none; } }
@media (max-width: 1100px) {
  :host(.nppHam) .npp-clock { display: none !important; }
  :host(.nppHam) .inner { padding-left: 206px !important; padding-right: 126px !important; }
  :host(.nppHam) .npp-logo { display: flex; left: 58px; }
  :host(.nppHam) .npp-logo img { height: 34px; max-width: clamp(80px, calc(100vw - 200px), 140px); }
  :host(.nppHam) .btn { padding: 8px 5px !important; }
}
@media (max-width: 950px) {
  :host(.nppHam) .btn:has(img) span { display: none !important; }
  :host(.nppHam) .left { gap: 0 !important; }
}
@media (max-width: 820px) {
  :host(.nppHam) .inner { padding-left: 164px !important; padding-right: 118px !important; }
  :host(.nppHam) .npp-logo img { max-width: 96px; }
  :host(.nppHam) .btn { padding: 8px 3px !important; }
}
@media (max-width: 640px) {
  :host(.nppHam) .left { display: none !important; }
  :host(.nppHam) .inner { padding-left: 0 !important; padding-right: 0 !important; }
}
@media (max-width: 420px) { :host(.nppHam) .npp-logo img { max-width: clamp(70px, calc(100vw - 190px), 110px); } }
`;

  const EDITOR_CSS = `
.tab { left: calc((var(--np-col-width, 240px) + 100%) / 2) !important; width: 44px !important; height: 16px !important; border-radius: 12px 12px 0 0 !important; color: #fff; opacity: 0; transition: opacity .15s, background .12s !important; }
.tab.show, .tab:hover { opacity: 1; }
.tab svg { width: 12px; height: 12px; display: block; transform: rotate(180deg); transition: transform .15s; }
.tab.isOpen svg { transform: none; }
.tab { background: #1a1722 !important; border-color: rgba(255,255,255,.14) !important; }
.tab:hover { background: #26222f !important; }
.panel.open { box-shadow: 0 -6px 36px rgba(0,0,0,.16) !important; }
.panel { background: #1a1722 !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; border-color: rgba(255,255,255,.14) !important; }
.head button { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.3); color: #fff; }
.head button:hover { background: rgba(255,255,255,.22); border-color: rgba(255,255,255,.4); }
.head .close { background: transparent; border: 0; color: rgba(255,255,255,.75); }
.head .close:hover { color: #fff; background: rgba(255,255,255,.14); }
.body { align-content: start; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.3) transparent; }
.col { border-color: rgba(255,255,255,.14); border-radius: 12px; }
.item { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.16); }
.item:hover { background: rgba(255,255,255,.12); }
.item .lbl { color: #fff; font-size: 13px; font-weight: 600; }
.iconBtnMini, .iconBtnMini.dim { background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.28); color: rgba(255,255,255,.88); opacity: 1; }
.iconBtnMini:hover { background: rgba(255,255,255,.26); color: #fff; }
.iconBtnMini.del:hover { background: #ff5a5a; border-color: transparent; color: #fff; }
.add select { height: 34px; background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.3); color: #fff; font-size: 13px; }
.add select option { background: #1a1722; color: #fff; }
.add button { height: 34px; background: var(--np-accent, #fff); color: var(--npp-accent-fg, #1a1722); border-color: transparent; font-size: 12px; text-shadow: var(--npp-accent-fg-shadow, none); }
.add button:hover { background: var(--np-accent, #fff); filter: brightness(1.06); }
.panel { width: 420px !important; max-width: 96vw !important; height: auto !important; max-height: min(470px, 78vh) !important; }
.head { align-items: center; gap: 8px; padding: 12px 14px 10px; border-bottom: 1px solid rgba(255,255,255,.1); }
.head::before { content: 'Shortcut icons'; margin-right: auto; font: 700 13px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.92); }
.body { grid-template-columns: 1fr !important; gap: 0; }
.col { background: transparent; border: 0; padding: 0; }
.items { gap: 5px; height: 340px !important; overflow-y: scroll; }
.item { grid-template-columns: 28px minmax(0, 1fr) auto auto auto !important; padding: 4px 8px; }
.nppNestBtn { width: 24px; height: 24px; padding: 0; border-radius: 8px; font-size: 14px; line-height: 1; cursor: pointer; }
.nppNestBtn.on { background: var(--np-accent, #fff) !important; color: var(--npp-accent-fg, #1a1722) !important; border-color: transparent !important; }
.nppNestBtn:disabled { opacity: .35; cursor: default; }
.item.nppNested { margin-left: 22px; opacity: .88; }
.item.nppParent .lbl::after { content: ' ▸'; opacity: .7; }
.panel.open .body { padding: 14px 18px 0 !important; }
.nppNestHint { display: none !important; margin-top: 10px; padding: 8px 12px; border: 1px solid rgba(255,255,255,.16); border-radius: 10px; background: rgba(255,255,255,.06); color: rgba(255,255,255,.8); font: 500 11px/1.4 'Outfit', system-ui, sans-serif; }
.item .lbl { text-align: left; }
.panel { bottom: 0 !important; border-bottom: 0 !important; border-radius: 16px 16px 0 0 !important; }
.body { padding: 14px 18px 24px; }
.add { margin-top: 14px; position: sticky !important; bottom: 0 !important; z-index: 3; margin: 14px -18px 0 !important; padding: 12px 18px 18px !important; background: #1a1722 !important; border-top: 1px solid rgba(255,255,255,.1); box-shadow: 0 -12px 14px -8px rgba(0,0,0,.4); }
.panel { left: calc((var(--np-col-width, 240px) + 100%) / 2) !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }
.head { flex: none; }
.body { flex: 1 1 auto !important; min-height: 0 !important; overflow-y: auto !important; overscroll-behavior: contain; }
.tab.isOpen { opacity: 0 !important; pointer-events: none; }
.nppSizeGrp { display: flex; align-items: center; gap: 4px; padding: 3px 7px; border-radius: 9px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.18); }
.nppSizeGrp .nppSizeLbl { font: 700 9px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.7); margin-right: 3px; }
.nppSizeGrp button { width: 22px; height: 22px; padding: 0; border-radius: 6px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.28); color: #fff; font: 700 14px/1 system-ui, sans-serif; cursor: pointer; }
.nppSizeGrp button:hover { background: rgba(255,255,255,.26); }
.nppSizeGrp .nppSizeVal { min-width: 44px; text-align: center; font: 700 11px/1 'Outfit', system-ui, sans-serif; color: #fff; font-variant-numeric: tabular-nums; }
`;

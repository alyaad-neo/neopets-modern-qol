  const PAGE_CSS = `
html[data-nq-modern-interface] {
  --nq-col-width: 240px !important;
  --nq-hud-left: 14px !important;
  --nq-hud-top: 72px !important;
  --nq-bar-inset-left: 0px !important;
  --nq-card: rgba(20,18,28,.42);
  --nq-card-line: rgba(255,255,255,.14);
  --nq-drawer-bg: linear-gradient(var(--nq-card), var(--nq-card)), linear-gradient(rgba(0,0,0,.22), rgba(0,0,0,.22)), var(--nqLeftBarImg, none) center / cover no-repeat, var(--nqLeftBarSolid, #3a3350);
  --nq-drawer-layers: linear-gradient(var(--nq-card), var(--nq-card)), linear-gradient(rgba(0,0,0,.22), rgba(0,0,0,.22));
  --nq-ico-shadow: drop-shadow(0 2px 3px rgba(0,0,0,.4));

  body, body *:not(:where(i, .fa, .fas, .far, .fab, .fal, .fad, [class*="fa-"], [class*="glyphicon"], [class*="icon-"], [class*="-icon"], [class*="material-icons"], [class*="mdi"], .bi, [class^="bi-"], .dashicons, [class*="ico-"])) { font-family: 'Outfit', system-ui, sans-serif !important; }
  .qrOverlay a, .qrPetName, .bankSettingsHead h3, #nqUserTitle, #nqBank .title,
  #nqNst { font-family: 'CafeteriaBlack', Georgia, serif !important; }

  .searchForm { margin: 0 !important; }
  div#boardTopic { border: 0 !important; }
  div#superfooter { display: none !important; }
  .container { box-shadow: 0 0 6px rgba(0,0,0,.1); }

  body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) {
    border: none !important;
    margin-left: calc(var(--nq-col-width) + (100vw - var(--nq-col-width) - var(--nq-frame-width, 1100px)) / 2) !important;
  }
  body#neobdy div#main #content { margin-left: 0 !important; }
  @media (max-width: 900px) {
    body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) { margin-left: auto !important; }
  }

  body > .errorOuter, body > .errorInner, body > .errorMessage {
    position: relative; box-sizing: border-box; width: min(560px, calc(100vw - var(--nq-col-width, 240px) - 48px)); max-width: none;
    margin: 120px 24px 40px calc(var(--nq-col-width, 240px) + max(24px, (100vw - var(--nq-col-width, 240px) - 560px) / 2)) !important;
  }
  @media (max-width: 900px) { body > .errorOuter, body > .errorInner, body > .errorMessage { width: auto; margin: 110px 16px 32px !important; } }


  #nqLeftBar { border: 0 !important; box-shadow: 0 0 10px rgba(0,0,0,.4) !important; top: 0 !important; bottom: auto !important; height: 100vh !important; }
  #nqHud > #nqBank { display: none !important; }

  #nqNp { flex-direction: column !important; align-items: stretch !important; cursor: default !important; }
  #nqNp .nq-amounts { flex: 1; display: flex; align-items: center; white-space: nowrap; }
  #nqNp .nq-amount, #nqNp .nq-nc { display: flex; align-items: center; gap: 5px; text-decoration: none !important; transition: background .15s; }
  #nqNp .nq-amount img, #nqNp .nq-nc img { flex: 0 0 auto; position: absolute; left: -6px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; filter: drop-shadow(0 1px 2px rgba(0,0,0,.5)); }
  #nqNp .nq-chevron { display: flex; align-items: center; justify-content: center; cursor: pointer; }
  #nqNp.nq-open .nq-chevron { transform: rotate(180deg); }
  #nqNp .nq-bank-drawer { display: none; background: transparent !important; }
  #nqNp.nq-open .nq-bank-drawer { display: block; }
  #nqNp .nq-bank-drawer #nqBank { border: 0 !important; box-shadow: none !important; backdrop-filter: none !important; background: transparent !important; padding: 8px 0 0 !important; margin: 0 !important; width: 100% !important; }

  #nqActivePet { flex: 0 0 auto !important; flex-direction: column !important; align-items: stretch !important; height: auto !important; min-height: 0 !important; max-height: none !important; }
  #nqActivePet > img { order: 0; }
  #nqPetDockBtn { position: absolute; top: 12px; right: 12px; width: auto; height: 26px; padding: 0 9px; gap: 5px; font: 700 11px/1 'Outfit', system-ui, sans-serif; white-space: nowrap; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 7px; background: rgba(0,0,0,.55); color: #fff; cursor: pointer; opacity: 1; transition: background .14s; z-index: 4; }
  #nqPetDockBtn:hover { background: rgba(0,0,0,.75); }
  #nqPetInfo .nqTitle { display: flex; justify-content: center; gap: 6px; font-weight: 700; text-align: center; }
  #nqPetInfo .nqTitle a { color: #fff !important; font-weight: 700; text-decoration: none !important; display: block; flex: 1 1 auto; text-align: center; text-shadow: 0 1px 3px rgba(0,0,0,.7); min-width: 0; }
  #nqPetInfo .nqTitle a:hover { text-decoration: underline !important; }
  #nqPetInfo .nqLinks { display: flex; justify-content: center; font-size: 11px; }
  #nqPetInfo .nqCopy { flex: 0 0 auto; padding: 2px; border: 0; background: transparent; cursor: pointer; }
  #nqPetInfo .nqCopy:hover { color: #fff; }
  #nqPetInfo .nqDetails { grid-template-columns: auto 1fr; font-size: 11px; color: rgba(255,255,255,.88); }
  #nqPetInfo .nqDetails span { color: rgba(255,255,255,.55) !important; opacity: 1 !important; font-weight: 400 !important; }
  #nqPetInfo .nqDetails b { color: #fff !important; font-weight: 700 !important; font-size: inherit !important; }
  #nqPetInfo .nqDetails b.gF { color: #ff8fc4 !important; }
  #nqPetInfo .nqDetails b.gM { color: #6db3ff !important; }
  #nqPetInfo { order: 2; position: relative; }

  #qrDockWrap { overflow-y: auto !important; overflow-x: hidden !important; }
  #qrDockWrap.open { opacity: 1; pointer-events: auto; top: 62px !important; }
  #qrDock { overflow-y: auto !important; overflow-x: hidden !important; min-height: 100% !important; height: auto !important; }
  .qrPet { min-height: 50px !important; flex: 1 1 50px !important; }

  #nqFoot { position: fixed; left: 0; bottom: 0; width: var(--nq-col-width); box-sizing: border-box; padding: 0 14px 12px; display: flex; flex-direction: column; gap: 8px; z-index: 1000; padding-left: calc(var(--nq-hud-left, 14px) + 6px); padding-right: calc(var(--nq-hud-left, 14px) + 6px); }


  #nqBgSidebar { top: 0 !important; height: 100vh !important; box-sizing: border-box !important; padding-top: 0 !important; z-index: 2100 !important; background: #1a1722 !important; border-left: 1px solid rgba(255,255,255,.14); box-shadow: -4px 0 32px rgba(0,0,0,.12) !important; }
  #nqBgHandle { top: calc(60px + (100vh - 60px - 44px) / 2) !important; width: 16px !important; height: 44px !important; font-size: 0 !important; opacity: 0; transition: opacity .15s, background .12s !important; }
  #nqBgHandle.nq-show, #nqBgHandle:hover { opacity: 1; }
  #nqBgHandle svg { width: 12px; height: 12px; transform: rotate(90deg); }
  #nqColors { display: flex; flex-direction: column; margin: 0 0 10px; }
  #nqColors input[type="color"] { width: 36px; height: 26px; padding: 2px; border: 1px solid rgba(255,255,255,.3); border-radius: 6px; background: none; cursor: pointer; }
  #nqColors button { padding: 4px 8px; border: 1px solid rgba(255,255,255,.2); border-radius: 6px; color: #fff; font-size: 11px; cursor: pointer; }

  #nqBgBody { color: #fff; }
  #nqBgSidebar .nqSmall { color: rgba(255,255,255,.92); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
  #nqBgSidebar .nqThemeSelect { height: 36px; font-size: 13px; background-color: rgba(255,255,255,.1); border-color: rgba(255,255,255,.3); color: #fff; }
  #nqBgSidebar .nqThemeSelect:hover { background-color: rgba(255,255,255,.16); }
  #nqBgSidebar .nqRecolorBtn:not(.isOn) { color: #fff; background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.3); }
  #nqBgSidebar .nqOptRow { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.22); }
  #nqBgSidebar .nqOptText { color: #fff; font-size: 12.5px; }
  #nqBgSidebar .nqOptText small { color: rgba(255,255,255,.74); font-size: 11px; }
  #nqColors .nqRow { color: rgba(255,255,255,.95); }
  #nqColors button { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.3); }
  #nqColors button:hover { background: rgba(255,255,255,.22); }
  #nqBgSidebar .nqBgSearch input { height: 32px; font-size: 13px; background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.3); }
  #nqBgSidebar .nqBgSearch input::placeholder { color: rgba(255,255,255,.62); }
  #nqBgSidebar .nqBgSearch button { height: 32px; background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.3); }
  #nqShuffle { display: flex; align-items: center; justify-content: center; }
  #nqShuffle.busy { background: var(--nq-accent, #fff) !important; color: var(--nq-accent-fg, #1a1330) !important; border-color: transparent !important; }
  #nqShuffle.busy svg { animation: nqSpin .7s linear infinite; }
  #nqBgList { transition: opacity .2s; }
  #nqBgList.nqFetching { opacity: .35; pointer-events: none; }
  #nqBgList .nqRowIn { animation: nqRowIn .38s cubic-bezier(.22, 1, .36, 1) both; animation-delay: calc(var(--i, 0) * 30ms); }
  #nqDiscBar.loading { position: relative; overflow: hidden; padding-bottom: 7px; }
  #nqDiscBar.loading #nqDiscMsg { animation: nqPulse 1s ease-in-out infinite; }
  #nqDiscBar.loading::after { content: ""; position: absolute; left: 0; bottom: 0; width: 38%; height: 3px; border-radius: 2px; background: var(--nq-accent, #fff); animation: nqSlide 1s ease-in-out infinite; }
  #nqBgBody > #nqDiscBar { order: 6; display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: -6px; padding: 0 2px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,.8); }
  #nqDiscBar[hidden] { display: none !important; }
  #nqShuffle svg { display: block; }
  #nqBgSidebar .nqBgItem { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.16); }
  #nqBgSidebar .nqBgName { color: #fff; font-size: 12px; font-weight: 600; }
  #nqBgSidebar .nqBgBtn { background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.3); }
  #nqBgSidebar .nqBgBtn:hover { background: rgba(255,255,255,.26); filter: none; }
  #nqBgSidebar #nqBgFooter { background: rgba(0,0,0,.28); border-top-color: rgba(255,255,255,.18); padding: 12px 14px; gap: 10px; }
  #nqBgSidebar .nqFooterBtn { font-size: 13px; background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.34); }
  #nqBgSidebar .nqFooterBtn:hover { background: rgba(255,255,255,.2); filter: none; }
  #nqBgSidebar .nqFooterBtn.primary { background: var(--nq-accent, #fff); color: var(--nq-accent-fg, #1a1330); border-color: transparent; text-shadow: var(--nq-accent-fg-shadow, none); }
  #nqBgSidebar .nqFooterBtn.primary:hover { filter: brightness(1.06); }

  #nqBgBody { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px 10px; align-content: start; padding: 14px; }
  #nqBgBody > * { grid-column: 1 / -1; margin: 0; min-width: 0; }
  #nqBgBody > .nqThemeBlock { grid-column: auto; }
  #nqBgBody > #nqColors { order: 4; }
  #nqBgBody > .nqBgSearch { order: 5; }
  #nqBgBody > #nqBgList { order: 7; margin-top: -4px; gap: 6px; max-height: clamp(260px, 52vh, 560px); overflow-y: auto; overscroll-behavior: contain; padding: 6px; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; background: rgba(255,255,255,.03); scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.3) transparent; }
  #nqBgList::-webkit-scrollbar { width: 8px; }
  #nqBgList::-webkit-scrollbar-thumb { background: rgba(255,255,255,.3); border-radius: 4px; }
  #nqBgSidebar .nqRecolorBtn { display: flex; align-items: center; justify-content: space-between; gap: 10px; height: auto; min-height: 42px; padding: 8px 12px 8px 14px; text-align: left; font-size: 17px; font-weight: 600; }
  #nqBgSidebar .nqRecolorBtn::after { content: 'OFF'; font: 700 10px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; padding: 5px 9px; border-radius: 999px; background: rgba(255,255,255,.16); color: rgba(255,255,255,.88); text-shadow: none; }
  #nqBgSidebar .nqRecolorBtn.isOn { color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.5), 0 0 0 rgba(0,0,0,.35); }
  #nqBgSidebar .nqRecolorBtn.isOn::after { content: 'ON'; background: #22b45a; color: #fff; text-shadow: 0 1px 1px rgba(0,0,0,.25); box-shadow: 0 1px 4px rgba(0,0,0,.25); }
  #nqColors { padding: 12px 14px; gap: 10px; text-align: left; border: 1px solid rgba(255,255,255,.14); border-radius: 12px; background: rgba(255,255,255,.04); }
  #nqColors .nqPresets { display: flex; gap: 6px; flex-wrap: wrap; }
  #nqColors .nqPresets button { flex: 1 1 auto; padding: 5px 8px; border: 1px solid rgba(255,255,255,.3); border-radius: 8px; background: rgba(255,255,255,.1); color: #fff; font-size: 11px; font-weight: 600; cursor: pointer; }
  #nqColors .nqPresets button:hover { background: rgba(255,255,255,.2); }
  #nqColors .nqSmall { margin: 0 0 2px; text-align: left; }
  #nqColors .nqRow { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center; gap: 12px; font-size: 13px; font-weight: 600; text-align: left; }
  #nqColors .nqRow input[type="color"] { order: 1; width: 44px; height: 30px; padding: 3px; border: 1px solid rgba(255,255,255,.3); border-radius: 9px; background: rgba(255,255,255,.08); cursor: pointer; }
  #nqColors .nqRow span { order: 2; flex: none; }
  #nqColors .nqRow button { order: 3; padding: 5px 11px; border: 1px solid rgba(255,255,255,.24); border-radius: 8px; background: transparent; color: rgba(255,255,255,.85); font-size: 11px; font-weight: 600; }
  #nqColors .nqRow button:hover { background: rgba(255,255,255,.16); color: #fff; }
  #nqColors .nqShareRow { display: flex; align-items: center; gap: 10px; margin-top: 2px; padding: 8px 2px 2px; border-top: 1px solid rgba(255,255,255,.12); cursor: pointer; font-size: 13px; font-weight: 600; color: rgba(255,255,255,.9); text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6); }
  #nqColors .nqShareRow input { width: 16px; height: 16px; margin: 0; accent-color: var(--nq-accent, #fff); cursor: pointer; }
  #nqColors .nqLogoDot { order: 1; display: block; width: 44px; height: 30px; box-sizing: border-box; border: 1px solid rgba(255,255,255,.3); border-radius: 9px; background: #111; }
  #nqColors .nqLogoRow[data-logo="1"] .nqLogoDot { background: #fff; }
  #nqColors .nqLogoRow span { order: 2; }
  #nqColors .nqLogoRow .nqSeg { order: 3; display: inline-flex; padding: 2px; border: 1px solid rgba(255,255,255,.3); border-radius: 999px; background: rgba(255,255,255,.08); }
  #nqColors .nqLogoRow .nqSeg button { order: 0; padding: 4px 13px; border: 0; border-radius: 999px; background: transparent; color: rgba(255,255,255,.85); font-size: 11px; font-weight: 600; }
  #nqColors .nqLogoRow .nqSeg button:hover { background: rgba(255,255,255,.16); color: #fff; }
  #nqColors .nqLogoRow .nqSeg button.on { background: var(--nq-accent, #fff); color: var(--nq-accent-fg, #1a1330); text-shadow: var(--nq-accent-fg-shadow, none); }
  #nqColors input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
  #nqColors input[type="color"]::-webkit-color-swatch { border: 0; border-radius: 6px; }
  #nqColors input[type="color"]::-moz-color-swatch { border: 0; border-radius: 6px; }
  #nqBgSidebar .nqBgSearch { padding: 0; }
  #nqBgSidebar .nqBgItem { grid-template-columns: 48px minmax(0, 1fr) auto auto; gap: 6px; padding: 5px 8px; }
  #nqBgSidebar .nqBgThumb { width: 48px; height: 48px; }

  #nqUser, #nqNp, #nqActivePet, #nqDaily {
    background: var(--nq-card) !important;
    border: 1px solid var(--nq-card-line) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    backdrop-filter: blur(10px) !important;
    box-shadow: none !important;
  }
  #nqUser:hover, #nqNp:hover, #nqActivePet:hover { border-color: rgba(255,255,255,.26) !important; }

  #nqHud { z-index: var(--nq-z-hud, 1000); -webkit-font-smoothing: antialiased; pointer-events: none; isolation: isolate; left: calc(var(--nq-hud-left, 14px) + 6px); width: calc(var(--nq-col-width, 240px) - 2 * (var(--nq-hud-left, 14px) + 6px)); }

  #nqHud, #nqFoot { text-shadow: 0 1px 3px rgba(0,0,0,.8); }

  #nqUserTitle { color: #fff !important; text-shadow: 0 2px 6px rgba(0,0,0,.7) !important; font-size: 24px !important; }
  #nqUser { min-height: 0 !important; }
  #nqAcctTab { display: none !important; }
  #nqUser .rightSide { display: grid !important; width: 100%; }
  #nqUser .name { max-width: 100%; text-align: left !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }

  #nqNp .nq-amount, #nqNp .nq-nc { font-weight: 800 !important; color: #fff !important; }
  #nqNp .nq-amount:hover, #nqNp .nq-nc:hover { background: rgba(255,255,255,.2) !important; }
  #nqNp .nq-chevron { background: none !important; border: 0 !important; }
  #nqNp .nq-chevron:hover { opacity: .75; }
  #nqNp .nq-amounts { gap: 10px; min-width: 0; }
  #nqNp .nqVal, #nqNp .ncVal { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #nqBank .bankCustomForm .ok, .bankSettingsFoot .nqBtn.save { color: var(--nq-accent-fg, #1a1330); }
  #nqNp .nq-amount, #nqNp .nq-nc { position: relative; box-sizing: border-box; min-height: 24px; flex: 0 1 auto; min-width: 0; padding: 2px 7px 2px 14px !important; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; background: rgba(255,255,255,.12); font-size: 13px !important; }
  #nqNp .nq-amount:hover, #nqNp .nq-nc:hover { border-color: rgba(255,255,255,.4); }
  #nqNp .bankGraph text { fill: rgba(255,255,255,.85); }
  #nqNp #nqBank .msg { opacity: .9; }
  #nqNp #nqBank .nqBtn { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.28); }
  #nqNp #nqBank .nqBtn:hover { background: rgba(255,255,255,.2); }

  #nqPetInfo .nqTitle { font-size: 14px !important; flex-wrap: nowrap; align-items: flex-start !important; line-height: 1.2; }
  #nqPetInfo .nqName { display: block; font-family: 'CafeteriaBlack', Georgia, serif !important; font-size: 22px; font-weight: 400; line-height: 1.1; letter-spacing: .02em; overflow-wrap: anywhere; padding: 0 24px; }
  #nqPetInfo .nqSub { display: block; margin-top: 2px; font-size: 11.5px; font-weight: 500; line-height: 1.25; color: rgba(255,255,255,.82); }
  #nqPetInfo .nqTitle .nqCopy { position: absolute; top: 0; right: 0; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border-radius: 7px; transition: background .15s, color .15s, transform .1s; }
  #nqPetInfo .nqTitle .nqCopy svg { width: 14px; height: 14px; display: block; }
  #nqPetInfo .nqTitle .nqCopy:hover { background: rgba(255,255,255,.16); color: #fff; }
  #nqPetInfo .nqTitle .nqCopy:active { transform: scale(.86); }
  #nqPetInfo .nqTitle .nqCopy.done { background: rgba(123,224,142,.22); color: #7be08e; animation: nqCopyPop .35s cubic-bezier(.3,1.6,.5,1); }
  #nqPetInfo .nqTitle .nqCopy.fail { background: rgba(255,90,90,.22); color: #ff8a8a; font-size: 18px; line-height: 1; animation: nqCopyPop .35s cubic-bezier(.3,1.6,.5,1); }
  #nqPetInfo .nqTitle a .nqG.gF { color: #ffa6d2 !important; }
  #nqPetInfo .nqTitle a .nqG.gM { color: #8cc4ff !important; }
  #nqPetInfo .nqCopy { color: rgba(255,255,255,.85) !important; }

  #nqPetInfo .nqLinks { gap: 5px !important; margin-top: 6px !important; }
  #nqPetInfo .nqLinks a { flex: 1; text-align: center; display: flex; align-items: center; justify-content: center; padding: 5px 4px; color: #fff !important; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); border-radius: 999px; text-decoration: none !important; }
  #nqPetInfo .nqLinks a:hover { background: var(--nq-accent, #fff); color: var(--nq-accent-fg, #1a1330) !important; text-shadow: var(--nq-accent-fg-shadow, none); text-decoration: none !important; }
  #nqPetInfo .nqLinks a svg, #nqPetInfo .nqLinks button svg { width: 16px; height: 16px; display: block; }
  #nqPetInfo .nqLinks button { flex: 1; display: flex; align-items: center; justify-content: center; padding: 5px 4px; color: #fff; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.3); border-radius: 999px; cursor: pointer; transition: background .15s, color .15s; }
  #nqPetInfo .nqLinks button:hover { background: var(--nq-accent, #fff); color: var(--nq-accent-fg, #1a1330); }
  #nqPetInfo .nqLinks button.on { background: rgba(255,255,255,.3); }
  #nqPetInfo .nqLinks button.on:hover { background: var(--nq-accent, #fff); }

  #nqPetInfo .nqDetails { display: flex !important; flex-direction: column; gap: 2px !important; margin-top: 6px !important; }
  #nqPetInfo .nqStat { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 2px 9px; border-radius: 7px; background: rgba(255,255,255,.07); font-size: 11.5px; line-height: 1.3; }
  #nqPetInfo .nqStat:nth-child(even) { background: rgba(255,255,255,.12); }
  #nqPetInfo .nqDetails .nqStat span { color: rgba(255,255,255,.78) !important; font-weight: 500 !important; white-space: nowrap; }
  #nqPetInfo .nqDetails .nqStat b { color: #fff !important; font-weight: 700 !important; text-align: right; min-width: 0; }
  #nqPetInfo .nqDetails .nqStat b.gF { color: #ffa6d2 !important; }
  #nqPetInfo .nqDetails .nqStat b.gM { color: #8cc4ff !important; }

  #nqPetInfo .nqStats { margin-top: 8px; }
  #nqPetInfo .nqStatsHead { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; border: 1px solid rgba(255,255,255,.22); border-radius: 9px; background: rgba(255,255,255,.12); color: #fff; cursor: pointer; text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6); transition: background .15s; }
  #nqPetInfo .nqStatsHead:hover { background: rgba(255,255,255,.2); }
  #nqPetInfo .nqStatsHead span { font: 600 12.5px/1.2 'Outfit', system-ui, sans-serif !important; color: #fff !important; }
  #nqPetInfo .nqStatsHead svg { width: 12px; height: 12px; flex: none; transition: transform .25s cubic-bezier(.22, 1, .36, 1); }
  #nqPetInfo .nqStats.open .nqStatsHead svg { transform: rotate(180deg); }
  #nqPetInfo .nqStatsBody { max-height: 0; opacity: 0; margin-top: 0; overflow: hidden; transition: max-height .3s cubic-bezier(.22, 1, .36, 1), opacity .2s ease, margin-top .3s ease; }
  #nqPetInfo .nqStats.open .nqStatsBody { max-height: 240px; opacity: 1; margin-top: 6px; }
  #nqPetInfo .nqStatsBody .nqDetails { margin-top: 0 !important; }
  #nqPetInfo .nqChips { position: absolute; left: 8px; right: 8px; bottom: calc(100% + 16px); margin: 0; display: flex; flex-wrap: nowrap; justify-content: flex-start; gap: 5px; pointer-events: none; z-index: 2; }
  #nqPetInfo .nqChip { padding: 3px 9px; border-radius: 999px; background: rgba(18,16,26,.6); border: 1px solid rgba(255,255,255,.22); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); color: #fff; font-size: 11.5px; font-weight: 600; line-height: 1.3; white-space: nowrap; text-shadow: none; }
  #nqPetInfo .nqChip.gF { color: #ffa6d2; }
  #nqPetInfo .nqChip.gM { color: #8cc4ff; }

  #nqTools .nqSearch button img { width: calc(var(--nq-ic) * .85) !important; height: calc(var(--nq-ic) * .85) !important; object-fit: contain !important; filter: var(--nq-ico-shadow) !important; display: block; transition: transform .2s cubic-bezier(.3, 1.4, .5, 1), width .25s ease, height .25s ease; }
  #btnOverlay .col [data-nq-nested] { display: none !important; }
  #btnOverlay .col.left { gap: 6px !important; row-gap: 6px !important; }
  #btnOverlay .col.left > * { margin-top: 0 !important; margin-bottom: 0 !important; }
  #nqNestPop { position: fixed !important; z-index: 1003; display: flex !important; flex-direction: row !important; align-items: center; gap: calc(var(--nq-ig, 10px) + 18px) !important; width: auto !important; height: auto !important; margin: 0 !important; padding: 4px 8px 4px calc(var(--nq-ig, 10px) + 18px) !important; right: auto !important; bottom: auto !important; background: none !important; border: 0 !important; box-shadow: none !important; opacity: 0; transform: translateY(-50%) translateX(-8px) !important; pointer-events: none !important; transition: opacity .15s ease, transform .24s cubic-bezier(.22, 1, .36, 1); }
  #nqNestPop.open { opacity: 1; transform: translateY(-50%) !important; pointer-events: auto !important; }
  #nqNestPop.open .col > * { animation: nqNestIn .28s cubic-bezier(.22, 1, .36, 1) both; animation-delay: calc(var(--i, 0) * 50ms); }
  #nqNestMenu { -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); position: fixed; z-index: 1004; min-width: 210px; padding: 6px; border: 1px solid var(--nq-card-line); border-radius: 14px; background: var(--nq-drawer-bg); box-shadow: 0 4px 14px rgba(0,0,0,.10); opacity: 0; transform: scale(.96); transform-origin: left top; pointer-events: none; transition: opacity .12s, transform .16s; }
  #nqNestMenu.open { opacity: 1; transform: none; pointer-events: auto; }
  #nqNestMenu button { display: block; width: 100%; padding: 8px 12px; border: 0; border-radius: 9px; background: transparent; color: #fff; text-align: left; font: 600 13px 'Outfit', system-ui, sans-serif; text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6); cursor: pointer; }
  #nqNestMenu button:hover { background: rgba(255,255,255,.14); }

  &.nq-shop-lock .shop-bg { cursor: not-allowed !important; opacity: .6; transition: opacity .3s; }
  .nqBigPrice { font-size: 1.7em !important; font-weight: 800 !important; line-height: 1.1; color: #9900b3 !important; }

  #btnOverlay .iconBtn { padding: 6px !important; margin: -6px !important; }
  #nqTools .nqSearch button { min-width: 36px; min-height: 36px; position: absolute; z-index: 2; left: 0; top: 0; width: var(--nq-ic, 44px); height: var(--nq-ic, 44px); padding: 0; display: flex; align-items: center; justify-content: center; border: 0; background: transparent; cursor: pointer; transition: width .25s ease, height .25s ease; }
  .nqGrpHead { margin: 6px 4px 2px; font: 700 10px/1 'Outfit', system-ui, sans-serif; letter-spacing: .09em; text-transform: uppercase; color: rgba(255,255,255,.6); }
  .nqGrpHead:first-child { margin-top: 0; }
  #nqTop { position: fixed; right: 24px; bottom: 20px; z-index: 2150; width: 42px; height: 42px; border-radius: 50%; border: 1px solid rgba(255,255,255,.3); background: var(--nq-card, rgba(20,18,28,.7)); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .2s ease, background .15s; box-shadow: 0 4px 14px rgba(0,0,0,.3); }
  #nqTop.on { opacity: 1; pointer-events: auto; }
  #nqTop:hover { background: var(--nq-accent, #fff); color: var(--nq-accent-fg, #1a1330); }
  #nqTop svg { width: 18px; height: 18px; }
  .nqFold { position: absolute; top: 6px; left: 6px; z-index: 5; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 7px; background: rgba(0,0,0,.45); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: .7; transition: opacity .15s; }
  .nqFold:hover { opacity: 1; }
  #nqDaily > .nqFold.nqEye { left: auto; right: 4px; top: 4px; width: 22px; height: 22px; border-radius: 50%; background: rgba(14,42,68,.22); color: #0e2a44; opacity: .55; }
  #nqDaily > .nqFold.nqEye:hover { opacity: 1; background: rgba(14,42,68,.35); }
  #nqDaily > .nqFold.nqEye svg { width: 13px; height: 13px; }
  #nqDaily.nqFolded > .nqFold.nqEye { background: rgba(255,255,255,.2); color: #fff; }
  .nqFold svg { width: 12px; height: 12px; transition: transform .2s ease; }
  .nqFold.up svg { transform: rotate(180deg); }
  #nqNp.nqFolded > :not(.nqFold), #nqActivePet.nqFolded > :not(.nqFold), #nqDaily.nqFolded > :not(.nqFold) { display: none !important; }
  #nqNp.nqFolded, #nqActivePet.nqFolded, #nqDaily.nqFolded { height: 36px !important; min-height: 36px !important; padding: 0 !important; overflow: hidden !important; }

  #nqTools { position: fixed; right: calc(14px + var(--nq-ic, 44px) + var(--nq-ig, 10px)); top: var(--nq-tools-top, 27px); transform: translateY(-50%); z-index: 2010; display: flex; flex-direction: row; align-items: center; gap: var(--nq-ig, 10px); transition: opacity .25s ease; }
  #nqTools .nqSep { display: none; }
  #nqTools .nqSearch { position: relative; width: var(--nq-ic, 44px); height: var(--nq-ic, 44px); margin: 0; transition: width .25s ease, height .25s ease; }
  #nqTools .nqSearch.noimg::before, #nqTools .nqSearch button.noimg::before { content: "⌕"; font-size: 24px; color: #fff; }
  #nqTools .nqSearch input { position: absolute; z-index: 1; right: 0; top: 50%; transform: translateY(-50%); box-sizing: border-box; width: var(--nq-ic, 44px); height: calc(var(--nq-ic, 44px) * .8); padding: 0 calc(var(--nq-ic, 44px) + 6px) 0 16px; border: 1px solid transparent; border-radius: 999px; background: transparent; color: #fff; font: 400 17px 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .02em; text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6); outline: 0; cursor: pointer; transition: width .42s cubic-bezier(.22, 1, .36, 1), background .25s, border-color .25s, box-shadow .25s; }
  #nqTools .nqSearch.nqOpen input { width: 252px; cursor: text; border-color: var(--nq-card-line); background: var(--nq-drawer-bg); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); box-shadow: 0 4px 14px rgba(0,0,0,.10); }
  #nqTools .nqSearch input:focus { border-color: var(--nq-accent, #fff); }
  #nqTools .nqSearch input::placeholder { color: rgba(255,255,255,.75); opacity: 0; transition: opacity .12s; }
  #nqTools .nqSearch.nqOpen input::placeholder { opacity: 1; transition: opacity .3s .2s; }
  &.nq-wait #nqTools, &.nq-wait #nqBell { opacity: 0 !important; pointer-events: none; }
  #nqBell { position: fixed; right: 14px; top: var(--nq-tools-top, 27px); transform: translateY(-50%); z-index: 2010; width: var(--nq-ic, 44px); height: var(--nq-ic, 44px); display: flex; align-items: center; justify-content: center; }
  #nqBell .nav-bell-icon__2020 { position: relative !important; inset: auto !important; margin: 0 !important; width: calc(var(--nq-ic, 44px) * .85) !important; height: calc(var(--nq-ic, 44px) * .85) !important; background-size: contain !important; background-position: center !important; background-repeat: no-repeat !important; cursor: pointer; }
  #nqBell #navnewsdropdown__2020 { position: fixed !important; top: calc(var(--nq-header-h, 54px) + 8px) !important; right: 10px !important; left: auto !important; bottom: auto !important; z-index: 2100 !important; }
  #nqBell > img { width: calc(var(--nq-ic, 44px) * .85); height: calc(var(--nq-ic, 44px) * .85); object-fit: contain; filter: var(--nq-ico-shadow); }
  #nqBell .nqBellDot { position: absolute; top: 2px; right: 2px; width: 12px; height: 12px; border-radius: 50%; background: #ff3b3b; box-shadow: 0 0 0 2px rgba(255,255,255,.92); }

  #nqBottom { display: flex; align-items: center; justify-content: center; min-height: 30px; }
  #nqNst { display: inline-block; padding: 0; font-size: 20px !important; color: #fff !important; background: none !important; border: 0 !important; font-variant-numeric: tabular-nums; white-space: nowrap; }

  #nqLeftBarBg { background-image: none !important; overflow: hidden; }
  &[data-nq-bar="none"] #nqLeftBarBg::after { top: 0; }
  #nqLeftBarBg::before { content: ""; position: absolute; inset: -30px; background: var(--nqLeftBarImg) center / cover no-repeat; filter: blur(14px) saturate(1.12); }
  #nqLeftBarBg::after { content: ""; position: absolute; left: 0; right: 0; top: 60px; aspect-ratio: 4 / 3; background: var(--nqLeftBarImg) center / cover no-repeat; -webkit-mask-image: linear-gradient(to bottom, #000 62%, transparent 100%); mask-image: linear-gradient(to bottom, #000 62%, transparent 100%); }

  #nqHud, #nqFoot, #btnOverlay { transition: opacity .25s ease; }
  &.nq-wait #nqHud, &.nq-wait #nqFoot, &.nq-wait #btnOverlay { opacity: 0 !important; pointer-events: none; }

  &.nq-reg4 .content { margin: 0 !important; padding: 0 !important; background: transparent !important; }
  &.nq-home body .inner-body { margin-left: 0 !important; margin-right: 0 !important; padding-top: 0 !important; }
  &.nq-home body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner),
  &.nq-home body :is(.container, .theme-bg) {
    background: transparent !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; padding-top: 0 !important;
  }
  &.nq-home body #container__2020, &.nq-home body #container__2020.theme-bg { background: transparent !important; box-shadow: none !important; }
  &.nq-home { --nq-top-offset: 0px !important; --nq-bottom-spacer: 0px !important; }
  &.nq-home body::after { display: none !important; }

  &.nq-ncmall { --nq-col-width: 0px !important; }
  &.nq-ncmall #nqHud, &.nq-ncmall #nqLeftBar, &.nq-ncmall #btnOverlay, &.nq-ncmall #nqSideBtnHost, &.nq-ncmall #qrDockWrap, &.nq-ncmall #nqFoot,
  &.nq-ncmall #nqBgHandle, &.nq-ncmall #nqBgSidebar { display: none !important; }
  &.nq-ncmall body #container__2020 { max-width: var(--nq-frame-width) !important; }
  &.nq-ncmall body :is(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) :is(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) {
    width: auto !important; max-width: none !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important;
    border: 0 !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important;
  }

  &.nq-popup { background: #fff !important; }
  &.nq-popup::before { display: none !important; }
  &.nq-popup #nq-host, &.nq-popup #nqHud, &.nq-popup #nqLeftBar, &.nq-popup #btnOverlay,
  &.nq-popup #nqSideBtnHost, &.nq-popup #nqBgHandle, &.nq-popup #nqBgSidebar, &.nq-popup #nqFoot,
  &.nq-popup #qrDockWrap, &.nq-popup #nqScrollTrack, &.nq-popup #nqBell { display: none !important; }
  &.nq-popup body { background: #fff !important; }
  &.nq-popup body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) {
    width: auto !important; max-width: none !important; min-height: 0 !important; margin: 0 !important; padding: 8px !important; border: 0 !important; border-radius: 0 !important;
  }
  html[data-nq-modern-interface] .tp-border-frame a[href*="criteria=id"] {
    position: relative !important;
    z-index: 1 !important;
    display: block !important;
    margin: 10px 0 14px !important;
    clear: both !important;
  }
}

html[data-nq-modern-interface] body :where(#container__2020,#content,#pageContent,#contentContainer,#main,main,.inner-body,.content,#np-content,#alpha-inner) {
  padding-top: 100px !important;
}
html[data-nq-modern-interface] body .container.theme-bg,
html[data-nq-modern-interface]:not(.nq-keep-native-bg) body #container__2020.theme-bg,
html[data-nq-modern-interface]:not(.nq-keep-native-bg) body .container,
html[data-nq-modern-interface]:not(.nq-keep-native-bg) body .theme-bg {
  padding-top: 0 !important;
}
@font-face {
  font-family: 'CafeteriaBlack';
  src: url('https://images.neopets.com/js/fonts/cafeteria-black.otf') format('opentype');
  font-display: swap;
}
@keyframes nqIn { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes nqSpin { to { transform: rotate(360deg); } }
@keyframes nqCopyPop { 0% { transform: scale(.6); } 100% { transform: scale(1); } }
@keyframes nqFlash { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .2; transform: scale(.7); } }
@keyframes nqNestIn { from { opacity: 0; transform: translateX(-12px) scale(.88); } to { opacity: 1; transform: none; } }
@keyframes nqRowIn { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes nqSlide { from { transform: translateX(-110%); } to { transform: translateX(260%); } }
@keyframes nqPulse { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes nqBellHalo { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,59,59,.65); } 50% { box-shadow: 0 0 0 9px rgba(255,59,59,0); } }`;

  const LAYOUT_CSS = `
html[data-nq-modern-interface] {
  --nq-drawer-w: min(320px, 88vw);

  #nqHud { position: fixed !important; top: var(--nq-hud-top, 72px) !important; bottom: 0 !important; height: auto !important; max-height: none !important; display: flex !important; flex-direction: column !important; overflow-x: hidden !important; overflow-y: auto !important; overscroll-behavior: contain; box-sizing: border-box; scrollbar-width: thin !important; scrollbar-color: rgba(255,255,255,.28) transparent; }
  #nqHud::-webkit-scrollbar { display: block; width: 6px; }
  #nqHud::-webkit-scrollbar-thumb { background: rgba(255,255,255,.28); border-radius: 3px; }
  #nqHud > * { flex: 0 0 auto !important; min-width: 0; }
  #nqHud > #nqFoot { position: static !important; width: auto !important; z-index: auto; display: flex; flex-direction: column; gap: 8px; order: 6; flex: 0 0 auto !important; }

  #nqNavMod { box-sizing: border-box; border-radius: 14px; background: var(--nq-card); border: 1px solid var(--nq-card-line); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); display: none; }
  #nqIcons { position: relative; box-sizing: border-box; margin-top: auto !important; padding: 6px 0 0; background: none; border: 0; z-index: 1; flex: 0 0 auto !important; padding-top: 12px; }
  #nqIcons:not(:has(.col > *)) { display: none; }
  #nqNavMod .nqNavHead { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 9px 12px; border: 0; background: transparent; color: #fff; font: 700 12px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; text-shadow: inherit; }
  #nqNavMod .nqNavHead svg { width: 12px; height: 12px; transition: transform .2s; }
  #nqNavMod .nqNavGrp.open .nqNavHead svg { transform: rotate(180deg); }
  #nqIcons .nqIcHead { display: none; }
  #nqIcons .nqIcBody, #nqIcons.nqShut .nqIcBody { display: block; padding: 0; }
  #nqIcons #btnOverlay { position: static !important; inset: auto !important; width: auto !important; height: auto !important; transform: none !important; z-index: auto !important; pointer-events: auto !important; opacity: 1 !important; overflow: visible !important; }
  #nqIcons #btnOverlay .col { position: static !important; inset: auto !important; transform: none !important; width: auto !important; height: auto !important; margin: 0 !important; display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; justify-content: center !important; align-items: center !important; gap: 10px !important; row-gap: 10px !important; }
  #nqIcons #btnOverlay .col:empty { display: none !important; }
  #nqIcons #btnOverlay .col > * { flex: 0 0 auto !important; position: relative; }
  #nqIcons #btnOverlay .col img { max-width: 40px; max-height: 40px; }
  #nqIcons #nqNestPop { position: absolute !important; left: clamp(0px, calc(var(--tx, 50%) - 28px), calc(100% - 56px)) !important; right: auto !important; bottom: calc(100% + 8px) !important; top: auto !important; width: 56px !important; flex-direction: column !important; align-items: center; transform-origin: 50% 100% !important; box-sizing: border-box; margin: 0 !important; padding: 10px 8px !important; display: flex !important; flex-wrap: nowrap; justify-content: center; gap: 8px !important; border-radius: 16px !important; box-shadow: 0 10px 28px rgba(0,0,0,.4) !important; z-index: 5; opacity: 0; visibility: hidden; pointer-events: none !important; transform: translateY(14px) scale(.92) !important; transition: opacity .2s ease, transform .3s cubic-bezier(.34, 1.4, .5, 1), visibility 0s .3s; }
  #nqIcons #nqNestPop.open { opacity: 1; visibility: visible; pointer-events: auto !important; transform: none !important; transition: opacity .2s ease, transform .3s cubic-bezier(.34, 1.4, .5, 1), visibility 0s; }
  #nqIcons #nqNestPop::after { content: ""; position: absolute; left: 50%; transform: none !important; width: 14px !important; height: 7px !important; top: 100% !important; bottom: auto !important; margin-left: -7px !important; border: 0 !important; clip-path: polygon(0 0, 100% 0, 50% 100%); background: rgba(255,255,255,.14) !important; -webkit-backdrop-filter: blur(18px) saturate(160%) !important; backdrop-filter: blur(18px) saturate(160%) !important; }
  #nqIcons #nqNestPop.open .col > * { animation: nqTrayIn .42s cubic-bezier(.34, 1.56, .5, 1) both; animation-delay: calc(var(--i, 0) * 45ms + 60ms); }
  @media (prefers-reduced-motion: reduce) { #nqIcons #nqNestPop, #nqIcons #nqNestPop.open { transition: none; } #nqIcons #nqNestPop.open .col > * { animation: none; } }

  #nqNp .nq-top-row .nq-amount, #nqNp .nq-top-row .nq-nc { flex-direction: row; overflow: visible; white-space: nowrap; }
  #nqNp .nq-top-row .nq-amount img, #nqNp .nq-top-row .nq-nc img { flex: 0 0 auto; order: -1; }
  #nqNp .nq-top-row .nqVal, #nqNp .nq-top-row .ncVal { flex: 0 0 auto; white-space: nowrap !important; letter-spacing: 0; }
  #nqNp .nq-top-row .nq-chevron { flex: 0 0 auto; }

  #nqUser .rightSide { align-items: center !important; }
  #nqUser #nqAvatar { align-self: center !important; }

  html #nqHud #nqFoot { position: relative !important; z-index: 0; flex: 0 0 auto !important; min-height: 0; }
  #nqPinsMod { position: relative; }

  #nqHud { --pn-pad: 12px; --pn-r: 16px; --pn-t2: rgba(255,255,255,.72); --pn-t3: rgba(255,255,255,.55); font-family: 'Outfit', system-ui, sans-serif; --nq-pill-h: 36px; --nq-pill-r: 10px; --nq-pill-bg: rgba(255,255,255,.08); --nq-pill-bg-h: rgba(255,255,255,.15); }
  #nqHud#nqHud, #nqHud#nqHud * { text-shadow: none !important; }
  #nqHud#nqHud { padding: 0 6px 8px !important; gap: 10px !important; justify-content: flex-start !important; background: none !important; border: 0 !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; color: #fff; }
  @media (min-width: 1101px) { #nqHud { left: 4px !important; width: calc(var(--nq-col-width, 240px) - 8px) !important; bottom: 8px !important; } }
  @media (max-width: 1100px) { #nqHud#nqHud { padding: 0 12px 12px !important; } }
  #nqHud > #nqUser, #nqHud > #nqNp, #nqHud > #nqActivePet, #nqHud > #nqListsMod, #nqHud > #nqFoot { box-sizing: border-box; margin: 0 !important; padding: var(--pn-pad) !important; background: rgba(18,16,28,.62) !important; -webkit-backdrop-filter: blur(18px) saturate(140%) !important; backdrop-filter: blur(18px) saturate(140%) !important; border: 1px solid rgba(255,255,255,.10) !important; border-radius: var(--pn-r) !important; box-shadow: 0 8px 24px rgba(0,0,0,.25) !important; color: #fff; }
  #nqHud > #nqNavMod { order: 5; margin: 0 !important; }
  #nqHud > #nqActivePet { order: 4; position: relative !important; display: block !important; overflow: hidden !important; padding-bottom: 0 !important; gap: 0 !important; }
  #nqHud > #nqIcons { order: 8; flex: 0 0 auto !important; margin: auto 0 0 !important; position: sticky; bottom: 0; z-index: 6; padding: 6px 0 2px !important; border: 0; background: none; }
  #nqHud > #nqIcons:not(:has(.col > *)) { display: none; }

  #nqHud #nqUser .rightSide { row-gap: 3px !important; }
  #nqHud #nqUser #nqAvatar { grid-column: 1 !important; grid-row: 1 / span 2 !important; font: 700 17px/1 'Outfit', system-ui, sans-serif; border: 2px solid var(--nq-accent, #fff) !important; box-shadow: 0 0 0 3px color-mix(in srgb, var(--nq-accent, #fff) 28%, transparent); width: 44px !important; height: 44px !important; }
  #nqHud #nqUser .name { grid-column: 2 !important; grid-row: 1 / span 2 !important; align-self: center !important; min-width: 0; }
  #nqHud #nqUser #nqUserTitle { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #fff !important; font: 400 18px/1.15 'CafeteriaBlack', Georgia, serif !important; letter-spacing: 0; }
  #nqHud #nqUser[data-main="1"] .name { grid-row: 1 !important; align-self: end !important; }
  #nqHud #nqUser[data-main="1"] .rightSide::after { content: "MAIN"; grid-column: 2; grid-row: 2; justify-self: start; align-self: start; padding: 2px 7px; border-radius: 999px; font: 700 11px/1 'Outfit', system-ui, sans-serif; letter-spacing: .06em; color: #fff; background: color-mix(in srgb, var(--nq-accent, #fff) 45%, transparent); }
  #nqHud #nqUser #nqAcctBtns { grid-column: 3 !important; grid-row: 1 / span 2 !important; align-self: center; display: flex !important; margin: 0 !important; gap: 2px !important; }
  #nqHud #nqUser #nqLogoutBtn, #nqHud #nqUser #nqSwapBtn { padding: 0 !important; justify-content: center; border: 0 !important; color: var(--pn-t2) !important; }
  #nqHud #nqUser #nqLogoutBtn span, #nqHud #nqUser #nqSwapBtn span { display: none !important; }
  #nqHud #nqUser #nqLogoutBtn:hover, #nqHud #nqUser #nqSwapBtn:hover { background: rgba(255,255,255,.12) !important; color: #fff !important; }

  #nqHud #nqNp .nq-top-row { gap: 6px !important; }
  #nqHud #nqNp .nq-top-row .nq-amount, #nqHud #nqNp .nq-top-row .nq-nc { grid-template-columns: auto minmax(0, 1fr); transition: background .15s; position: relative; }
  #nqHud #nqNp .nq-top-row .nq-amount::before { content: none; }
  #nqHud #nqNp .nq-top-row .nq-nc::before { content: none; }
  #nqHud #nqNp .nq-top-row .nq-amount::before, #nqHud #nqNp .nq-top-row .nq-nc::before { grid-row: 1; font: 600 11px/1 'Outfit', system-ui, sans-serif; text-transform: uppercase; letter-spacing: .06em; color: var(--pn-t3); }
  #nqHud #nqNp .nq-top-row .nqVal, #nqHud #nqNp .nq-top-row .ncVal { color: #fff !important; font: 700 17px/1.15 'Outfit', system-ui, sans-serif !important; grid-row: 1 !important; align-self: center; }
   #nqHud #nqNp .nq-top-row .nq-amount img, #nqHud #nqNp .nq-top-row .nq-nc img { position: absolute !important; top: 50% !important; transform: translateY(-50%) !important; grid-column: auto; grid-row: auto; filter: drop-shadow(0 2px 3px rgba(0,0,0,.45)); width: 18px !important; height: 18px !important; left: 3px !important; } #nqHud #nqNp .nq-top-row .nq-amount::before, #nqHud #nqNp .nq-top-row .nq-nc::before, #nqHud #nqNp .nq-top-row .nqVal, #nqHud #nqNp .nq-top-row .ncVal { grid-column: 2; font-variant-numeric: tabular-nums; }
  #nqHud #nqNp .nq-chevron { color: var(--pn-t2) !important; transition: transform .2s, color .15s, background .15s; }
  #nqHud #nqNp .nq-chevron:hover { color: #fff !important; background: rgba(255,255,255,.12) !important; }
  #nqHud #nqNp .nq-bank-drawer { padding: 10px 0 0; margin-top: 10px; border-top: 1px solid rgba(255,255,255,.10); }

  #nqHud #nqActivePet > img { -webkit-mask-image: none; mask-image: none; position: relative; z-index: 1; vertical-align: top !important; }
  #nqHud #nqPetDockBtn { top: 18px; right: 18px; height: 28px; border-radius: 999px; background: rgba(255,255,255,.85) !important; color: #1a1626 !important; border: 1px solid rgba(255,255,255,.6) !important; box-shadow: 0 2px 8px rgba(0,0,0,.28) !important; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); font: 600 11px/1 'Outfit', system-ui, sans-serif; z-index: 2; width: 28px; padding: 0; gap: 0; justify-content: center; overflow: hidden; transition: width .3s cubic-bezier(.3,.7,.3,1), padding .3s, gap .3s, background .15s, box-shadow .15s; } #nqHud #nqPetDockBtn svg { width: 13px; height: 13px; flex: none; color: inherit; transition: transform .35s cubic-bezier(.3,.7,.3,1); } #nqHud #nqPetDockBtn:hover { background: #fff !important; box-shadow: 0 3px 10px rgba(0,0,0,.34) !important; } #nqHud #nqPetDockBtn:hover svg { transform: rotate(180deg); } @media (prefers-reduced-motion: reduce) { #nqHud #nqPetDockBtn svg { transition: none; } }
   #nqHud #nqPetDockBtn span { max-width: 0; opacity: 0; overflow: hidden; white-space: nowrap; transition: max-width .3s cubic-bezier(.3,.7,.3,1), opacity .2s; } #nqHud #nqPetDockBtn:hover, #nqHud #nqPetDockBtn:focus-visible { width: 112px; padding: 0 11px 0 9px; gap: 6px; } #nqHud #nqPetDockBtn:hover span, #nqHud #nqPetDockBtn:focus-visible span { max-width: 80px; opacity: 1; } #nqHud #nqPetDockBtn:focus-visible svg { transform: rotate(180deg); } @media (prefers-reduced-motion: reduce) { #nqHud #nqPetDockBtn, #nqHud #nqPetDockBtn span { transition: none; } }
  #nqHud #nqActivePet #nqPetInfo { display: flex; padding: 0; text-align: left; container-type: inline-size; flex-wrap: wrap !important; align-items: stretch !important; position: static !important; gap: 0 !important; margin: 0 !important; }
  #nqHud #nqPetInfo .nqTitle { order: 1; flex: 0 0 100%; justify-content: flex-start; text-align: left; position: relative; }
  #nqHud #nqPetInfo .nqTitle a { text-align: left; color: #fff !important; }
  #nqHud #nqPetInfo .nqSub { color: var(--pn-t2); }
  #nqHud #nqPetInfo .nqTitle .nqCopy { right: 0; top: -2px; }
  #nqHud #nqPetInfo .nqChips { order: 2; position: static; display: flex; margin: 0; pointer-events: auto; }
  #nqHud #nqPetInfo .nqChip { font-weight: 600; -webkit-backdrop-filter: none; backdrop-filter: none; color: #fff; }
  #nqHud #nqPetInfo .nqLinks { order: 3; flex: 0 0 auto; justify-content: flex-end; margin: 0 !important; }
  #nqHud #nqPetInfo .nqLinks a, #nqHud #nqPetInfo .nqLinks button { flex: 0 0 auto; padding: 0; }
  #nqHud #nqPetInfo .nqLinks a:hover, #nqHud #nqPetInfo .nqLinks button:hover { background: rgba(255,255,255,.2); }
  #nqHud #nqPetInfo .nqLinks button.on { background: color-mix(in srgb, var(--nq-accent, #fff) 45%, transparent); }
  #nqHud #nqPetInfo .nqDetails { order: 4; flex: 0 0 100%; }
  #nqHud #nqActivePet:not(:has(.nqTitle))::before { content: ""; position: absolute; inset: 12px; border-radius: 12px; z-index: 0; background: linear-gradient(100deg, rgba(255,255,255,.04) 30%, rgba(255,255,255,.16) 50%, rgba(255,255,255,.04) 70%) 0 0 / 200% 100%; animation: nqShimmer 1.4s linear infinite; }
  #nqHud #nqActivePet:not(:has(.nqTitle)) { min-height: 194px; }
  @keyframes nqShimmer { to { background-position: -200% 0; } }
  @media (prefers-reduced-motion: reduce) { #nqHud #nqActivePet:not(:has(.nqTitle))::before { animation: none; } }

  #nqHud #nqListsMod { display: grid; grid-template-columns: 1fr auto 1fr !important; gap: 0 !important; }
  #nqHud #nqListsMod .nqLt { flex-wrap: nowrap; white-space: nowrap; transition: background .18s, transform .18s, box-shadow .18s; }
  #nqHud #nqListsMod .nqLt + .nqLt { position: relative; } #nqHud #nqListsMod .nqLt + .nqLt::before { content: ""; position: absolute; left: -2px; top: 8px; bottom: 8px; width: 1px; background: rgba(255,255,255,.10); pointer-events: none; }
  #nqHud #nqListsMod .nqLt svg { color: var(--pn-t2); width: 16px !important; height: 16px !important; flex: none; }
  #nqHud #nqListsMod .nqLt b { color: #fff; }
  #nqHud #nqListsMod .nqLt em { flex: none; text-align: center; animation: nqLtPop .5s cubic-bezier(.3,1.6,.5,1) .15s both; box-sizing: border-box !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; height: 16px !important; min-width: 16px !important; padding: 0 5px !important; line-height: 1 !important; font-size: 10px !important; font-weight: 600 !important; }
   #nqHud #nqListsMod .nqLt:hover, #nqHud #nqListsMod .nqLt:focus-visible { transform: translateY(-2px); background: rgba(255,255,255,.14); box-shadow: 0 6px 14px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.18); } #nqHud #nqListsMod .nqLt:hover svg, #nqHud #nqListsMod .nqLt:focus-visible svg { animation: nqLtWiggle .5s ease; }  @keyframes nqLtWiggle { 0%,100% { transform: rotate(0) translateY(0); } 25% { transform: rotate(-14deg) translateY(-2px); } 55% { transform: rotate(10deg) translateY(-1px); } 80% { transform: rotate(-4deg); } } @keyframes nqLtPop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } } @media (prefers-reduced-motion: reduce) { #nqHud #nqListsMod .nqLt, #nqHud #nqListsMod .nqLt em, #nqHud #nqListsMod .nqLt svg { animation: none !important; transition: none !important; transform: none !important; } }

  #nqHud #nqPinsMod { border: 0; background: none; border-radius: 0; overflow: visible; height: auto; min-height: 0; flex: 0 0 auto; -webkit-backdrop-filter: none; backdrop-filter: none; }
  #nqHud #nqPinsMod .pTabs { position: relative; display: flex; gap: 2px; padding: 3px; margin: 0 0 8px; border-radius: 10px; background: rgba(255,255,255,.08); }
  #nqHud #nqPinsMod .pTabs button { flex: 1 1 0; padding: 6px 4px; border-radius: 8px; background: none; color: var(--pn-t2); border-bottom: 0; position: relative; z-index: 1; transition: color .2s; }
   #nqHud #nqPinsMod .pTabs button.on, #nqHud #nqPinsMod .pTabs button[data-t="pinned"].on { color: #fff; background: none; } #nqHud #nqPinsMod .pTabs::before { content: ""; position: absolute; z-index: 0; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 8px) / 2); border-radius: 8px; background: color-mix(in srgb, var(--nq-accent, #fff) 40%, rgba(255,255,255,.1)); transition: transform .3s cubic-bezier(.34, 1.3, .5, 1); } #nqHud #nqPinsMod[data-tab="pinned"] .pTabs::before { transform: translateX(calc(100% + 2px)); } #nqHud #nqPinsMod #nqRecent, #nqHud #nqPinsMod #nqPinned { animation: nqTabIn .28s ease both; } @keyframes nqTabIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } } @media (prefers-reduced-motion: reduce) { #nqHud #nqPinsMod .pTabs::before { transition: none; } #nqHud #nqPinsMod #nqRecent, #nqHud #nqPinsMod #nqPinned { animation: none; } }
  #nqHud #nqPinsMod #nqRecent, #nqHud #nqPinsMod #nqPinned { padding: 0; height: auto; min-height: 0; flex: 0 0 auto; }
  #nqHud #nqPinsMod .rList { box-sizing: border-box; width: 100%; margin: 0 !important; padding: 0 !important; max-height: 92px; height: auto; flex: 0 0 auto; gap: 4px; overflow-x: hidden; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; } #nqHud #nqPinsMod .rList::-webkit-scrollbar { display: none; width: 0; height: 0; } #nqHud #nqPinsMod .rList li { box-sizing: border-box; width: 100%; } #nqHud #nqPinsMod .rPin { right: 6px; }
  #nqHud #nqPinsMod .rList:empty::before { color: var(--pn-t3); }
  #nqHud #nqPinsMod .rList a { height: 28px; background: rgba(255,255,255,.05) !important; border: 0 !important; border-radius: 8px; box-sizing: border-box; width: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 34px 0 10px !important; color: #fff; }
  #nqHud #nqPinsMod .rList a:hover { background: rgba(255,255,255,.14) !important; }
  #nqHud #nqPinsMod .rList b { color: #fff; }

  #nqHud #nqListsMod .nqLt b { font: 400 16px/1 'CafeteriaBlack', Georgia, serif; font-family: 'CafeteriaBlack', Georgia, serif !important; letter-spacing: normal !important; flex: 0 0 auto !important; overflow: visible !important; text-overflow: clip !important; white-space: nowrap !important; font-size: 16px !important; font-weight: 400 !important; }
  #nqHud #nqPetInfo .nqTitle a { min-width: 0; overflow: hidden; }
  #nqHud #nqPetInfo .nqName { font: 400 24px/1.15 'CafeteriaBlack', Georgia, serif !important; letter-spacing: 0; padding: 0 28px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; overflow-wrap: normal; }
  #nqHud #nqNp .nq-top-row .nq-amount::before, #nqHud #nqNp .nq-top-row .nq-nc::before { display: none !important; }
  #nqHud #nqNp .nq-top-row .nq-amounts { grid-template-columns: none !important; justify-content: center !important; } #nqHud #nqNp .nq-top-row .nqVal, #nqHud #nqNp .nq-top-row .ncVal { display: block; min-width: 0; overflow: hidden !important; text-overflow: clip !important; }
  #nqHud #nqPetInfo .nqChips { flex: 1 1 auto; min-width: max-content; flex-wrap: nowrap; align-items: center; gap: 6px; }
  #nqHud #nqPetInfo .nqChip { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.1); font-size: 12px; line-height: 1; white-space: nowrap; flex: 0 0 auto; }
  #nqHud #nqPetInfo .nqLinks { align-items: center; gap: 6px !important; }
  #nqHud #nqPetInfo .nqLinks a, #nqHud #nqPetInfo .nqLinks button { box-sizing: border-box; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.14); border-radius: 50%; background: rgba(255,255,255,.1); color: #fff; }
  &.nq-side-light #nqHud #nqPetInfo .nqChip, &.nq-side-light #nqHud #nqPetInfo .nqLinks a, &.nq-side-light #nqHud #nqPetInfo .nqLinks button { background: #fff; border-color: rgba(0,0,0,.10); color: #1c1830 !important; }
  &.nq-side-light #nqHud #nqPetInfo .nqLinks a:hover, &.nq-side-light #nqHud #nqPetInfo .nqLinks button:hover { background: #f1eff7; }
  &.nq-side-light #nqHud #nqPetInfo .nqLinks button.on { background: color-mix(in srgb, var(--nq-accent, #888) 35%, rgba(255,255,255,.6)); }
  &.nq-side-light #nqHud { --pn-t2: rgba(28,24,48,.68); --pn-t3: rgba(28,24,48,.5); --nq-pill-bg: rgba(0,0,0,.05); --nq-pill-bg-h: rgba(0,0,0,.09); }
  &.nq-side-light #nqHud > #nqUser, &.nq-side-light #nqHud > #nqNp, &.nq-side-light #nqHud > #nqActivePet, &.nq-side-light #nqHud > #nqListsMod, &.nq-side-light #nqHud > #nqFoot { background: rgba(255,255,255,.72) !important; -webkit-backdrop-filter: blur(18px) !important; backdrop-filter: blur(18px) !important; border-color: rgba(0,0,0,.08) !important; box-shadow: 0 8px 24px rgba(40,30,80,.14) !important; color: #1c1830; }
  &.nq-side-light #nqHud #nqUserTitle, &.nq-side-light #nqHud #nqPetInfo .nqTitle a, &.nq-side-light #nqHud #nqPetInfo .nqName { color: #1c1830 !important; text-shadow: none !important; }
  &.nq-side-light #nqHud #nqNp .nq-top-row .nqVal, &.nq-side-light #nqHud #nqNp .nq-top-row .ncVal, &.nq-side-light #nqHud #nqNp, &.nq-side-light #nqHud #nqNp .nq-amount, &.nq-side-light #nqHud #nqNp .nq-nc { color: #1c1830 !important; }
  &.nq-side-light #nqHud #nqNp .nq-chevron { color: rgba(28,24,48,.68) !important; } 
  &.nq-side-light #nqHud #nqNp .nq-bank-drawer { border-top-color: rgba(0,0,0,.08); } &.nq-side-light #nqNp .bankGraph text { fill: rgba(28,24,48,.7); }
  &.nq-side-light #nqHud #nqPetInfo .nqSub, &.nq-side-light #nqHud #nqPetInfo { color: rgba(28,24,48,.68); }
  &.nq-side-light #nqHud #nqPetInfo .nqTitle .nqCopy { color: rgba(28,24,48,.6); } &.nq-side-light #nqHud #nqPetInfo .nqTitle .nqCopy:hover { background: rgba(0,0,0,.07); color: #1c1830; }
  &.nq-side-light #nqHud #nqListsMod .nqLt em { color: #1c1830; background: rgba(0,0,0,.08) !important; }
  &.nq-side-light #nqHud #nqListsMod .nqLt + .nqLt::before { background: rgba(0,0,0,.10); }
  &.nq-side-light #nqHud #nqPinsMod .pTabs { background: rgba(0,0,0,.06); }
  &.nq-side-light #nqHud #nqPinsMod .pTabs button, &.nq-side-light #nqHud #nqPinsMod .rPin { color: rgba(28,24,48,.6); }
  &.nq-side-light #nqHud #nqPinsMod .pTabs button.on, &.nq-side-light #nqHud #nqPinsMod .pTabs button[data-t="pinned"].on { color: #1c1830; }
  &.nq-side-light #nqHud #nqPinsMod .rList a { background: #fff !important; color: #1c1830 !important; } &.nq-side-light #nqHud #nqPinsMod .rList a:hover { background: #f1eff7 !important; }
  &.nq-side-light #nqHud #nqPinsMod .rEmpty { color: rgba(28,24,48,.6) !important; }
  &.nq-side-light #nqHud #nqPinsMod .rList b { color: #1c1830; } &.nq-side-light #nqHud #nqPinsMod .rList:empty::before { color: rgba(28,24,48,.5); }
  &.nq-side-light #nqHud #nqPinsMod li.isPinned .rPin { color: #d89a00; }
  #nqHud #nqNp .nq-top-row { align-items: center; min-height: 0; }
  #nqIcons #nqNestPop { border: 0 !important; background: rgba(255,255,255,.14) !important; -webkit-backdrop-filter: blur(18px) saturate(160%) !important; backdrop-filter: blur(18px) saturate(160%) !important; }
  #nqIcons #nqNestPop::before { content: ""; position: absolute; left: -6px; right: -6px; top: 100%; height: 16px; background: none !important; }
  #nqIcons #nqNestPop .col, #nqIcons #nqNestPop .col > *, #nqIcons #nqNestPop .col > * * { border: 0 !important; }
  #nqColors .nqSideRow .nqLogoDot { display: none; }

  #nqHud #nqIcons #btnOverlay .col { justify-content: space-evenly !important; flex-wrap: nowrap !important; gap: 8px !important; }
  #nqHud #nqIcons #btnOverlay .col img { max-width: 36px; max-height: 36px; width: 36px; height: 36px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,.45)); }
  #nqHud #nqIcons #btnOverlay .col > * { transition: transform .18s ease, filter .18s ease; }
  #nqHud #nqIcons #btnOverlay .col > *:hover { transform: translateY(-2px); filter: brightness(1.12); }
  @media (prefers-reduced-motion: reduce) { #nqHud #nqIcons #btnOverlay .col > * { transition: none; } #nqHud #nqIcons #btnOverlay .col > *:hover { transform: none; } }

  #qrDockWrap { scrollbar-width: none !important; -ms-overflow-style: none; }
  #qrDockWrap::-webkit-scrollbar, #qrDock::-webkit-scrollbar { display: none !important; }
  #qrDock { scrollbar-width: none !important; }
  #qrDock .qrPet { position: relative !important; min-height: 120px !important; flex: 1 0 120px !important; overflow: hidden; }
  #qrDock .qrPet::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 55%; background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,0)); pointer-events: none; z-index: 1; }
  #qrDock .qrPetName { position: absolute !important; left: 0 !important; right: 0 !important; bottom: 0 !important; top: auto !important; z-index: 2; margin: 0 !important; padding: 14px 10px 8px !important; opacity: 1 !important; visibility: visible !important; transform: none !important; background: none !important; color: #fff !important; font-size: 17px !important; line-height: 1.15; text-align: center; text-shadow: 0 1px 3px rgba(0,0,0,.95), 0 0 8px rgba(0,0,0,.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
  #qrDock .qrOverlay { position: absolute !important; inset: 0 !important; z-index: 3; opacity: 1 !important; visibility: visible !important; background: none !important; display: flex !important; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 0 0 28px; pointer-events: none; }
  #qrDock .qrOverlay a { pointer-events: auto; opacity: 0; visibility: hidden; transform: translateY(4px); transition: opacity .15s, transform .15s, visibility 0s .15s; display: inline-flex; align-items: center; justify-content: center; min-width: 118px; min-height: 30px; box-sizing: border-box; padding: 5px 14px; border-radius: 999px; background: rgba(14,12,22,.88) !important; border: 1px solid rgba(255,255,255,.55); color: #fff !important; font-size: 14px !important; font-weight: 700; text-decoration: none !important; text-shadow: none; box-shadow: 0 2px 8px rgba(0,0,0,.5); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
  #qrDock .qrOverlay a:hover, #qrDock .qrOverlay a:focus-visible { background: #fff !important; color: #14111f !important; outline: none; }
  #qrDock .qrPet:hover .qrOverlay a, #qrDock .qrPet:focus-within .qrOverlay a, #qrDock .qrPet.nqTap .qrOverlay a { opacity: 1; visibility: visible; transform: none; transition: opacity .15s, transform .15s, visibility 0s; }
  @media (hover: none), (max-width: 640px) { #qrDock .qrOverlay a { opacity: 1; visibility: visible; transform: none; min-height: 28px; font-size: 13px !important; } #qrDock .qrOverlay { gap: 5px; } }
  @media (prefers-reduced-motion: reduce) { #qrDock .qrOverlay a { transition: none; } }

  #nqNavMod .nqNavGrp + .nqNavGrp { border-top: 1px solid var(--nq-card-line); }
  #nqNavMod .nqNavLinks { display: none; padding: 0 12px 8px; }
  #nqNavMod .nqNavGrp.open .nqNavLinks { display: block; }
  #nqNavMod .nqNavLinks a { display: block; padding: 6px 4px; color: rgba(255,255,255,.9) !important; font-size: 13.5px; text-decoration: none !important; border-radius: 6px; }
  #nqNavMod .nqNavLinks a:hover { background: rgba(255,255,255,.12); }
  #nqNavMod a.nqNavSolo { display: block; padding: 9px 12px; color: #fff !important; font: 700 12px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; text-decoration: none !important; }

  #nqMenuBtn { display: none; position: fixed; left: 10px; top: var(--nq-tools-top, 27px); transform: translateY(-50%); z-index: 2010; width: 40px; height: 40px; padding: 0; align-items: center; justify-content: center; border: 1px solid var(--nq-card-line); border-radius: 12px; background: var(--nq-card); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: #fff; cursor: pointer; }
  #nqMenuBtn svg { width: 20px; height: 20px; }
  #nqScrim { display: none; position: fixed; inset: 0; z-index: 2040; background: rgba(8,6,14,.55); opacity: 0; transition: opacity .25s; }
  #nqDrawerClose { display: none; position: fixed; top: 8px; left: calc(var(--nq-drawer-w) - 48px); z-index: 2052; width: 38px; height: 38px; padding: 0; align-items: center; justify-content: center; border: 1px solid var(--nq-card-line); border-radius: 10px; background: rgba(0,0,0,.35); color: #fff; font-size: 22px; line-height: 1; cursor: pointer; }
  &.nq-wait #nqMenuBtn { opacity: 0; }

  @media (max-height: 820px) {
    --nq-hud-top: 66px !important;
  }

  @media (max-width: 1100px) {
    --nq-col-width: 0px !important;
    #nqLeftBar { left: 0 !important; width: var(--nq-drawer-w) !important; z-index: 2050 !important; transform: translateX(-104%); visibility: hidden; transition: transform .26s cubic-bezier(.22, 1, .36, 1), visibility 0s .26s; }
    #nqHud { left: 0 !important; width: var(--nq-drawer-w) !important; top: 52px !important; z-index: 2051 !important; transform: translateX(-104%); visibility: hidden; transition: transform .26s cubic-bezier(.22, 1, .36, 1), visibility 0s .26s; }
    &.nqDrawerOpen #nqLeftBar, &.nqDrawerOpen #nqHud { transform: none; visibility: visible; transition: transform .26s cubic-bezier(.22, 1, .36, 1), visibility 0s; }
    &.nqDrawerOpen #nqScrim { display: block; opacity: 1; }
    &.nqDrawerOpen #nqDrawerClose { display: flex; }
    &.nqDrawerOpen body { overflow: hidden !important; }
    #nqMenuBtn { display: flex; }
    #nqTools .nqSearch.nqOpen input { width: min(252px, calc(100vw - 150px)); }
  }
  @media (max-width: 1100px) and (max-height: 820px) { #nqHud { top: 48px !important; } }
  @media (max-width: 640px) { #nqNavMod { display: block; } }
  @keyframes nqTrayIn { from { opacity: 0; transform: translateY(16px) scale(.4); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { #nqLeftBar, #nqHud, #nqScrim { transition: none !important; } }  #nqHud #nqActivePet #nqPetInfo .nqChips { gap: 0 !important; justify-content: flex-start !important; flex-wrap: nowrap !important; } #nqHud #nqActivePet #nqPetInfo .nqChip { height: auto !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; line-height: 1.2 !important; white-space: nowrap !important; flex: 0 0 auto !important; font-size: 11px !important; font-weight: 500 !important; } #nqHud #nqActivePet #nqPetInfo .nqChip:not(.gF):not(.gM) { color: var(--pn-t2, rgba(255,255,255,.7)) !important; } #nqHud #nqActivePet #nqPetInfo .nqChip + .nqChip::before { content: "·"; margin: 0 6px; } #nqHud #nqActivePet #nqPetInfo .nqLinks { justify-content: flex-end !important; } #nqHud #nqActivePet #nqPetInfo .nqLinks a, #nqHud #nqActivePet #nqPetInfo .nqLinks button { flex: 0 0 auto !important; padding: 0 !important; width: 26px !important; height: 26px !important; }  #nqHud #nqListsMod::before { content: ""; grid-column: 2; grid-row: 1; width: 1px; margin: 8px 0; background: rgba(255,255,255,.10); pointer-events: none; display: none !important; } #nqHud #nqListsMod .nqLt + .nqLt::before { display: none !important; }   #nqHud #nqNp .nq-top-row .nqVal, #nqHud #nqNp .nq-top-row .ncVal { font-family: 'CafeteriaBlack', Georgia, serif !important; font-weight: 400 !important; } #nqHud #nqPinsMod .pTabs button { font: 400 13px/1.1 'CafeteriaBlack', Georgia, serif !important; letter-spacing: normal !important; text-transform: none !important; font-size: 16px !important; font-weight: 400 !important; }
  #nqHud #nqUser #nqUserTitle { font-size: 21px !important; font-weight: 400 !important; line-height: 1.15 !important; }
  #nqHud #nqPetInfo .nqName { font-size: 26px !important; font-weight: 400 !important; line-height: 1.15 !important; }
  #nqHud #nqPetInfo .nqSub { font-size: 12px !important; font-weight: 500 !important; line-height: 1.3 !important; }
  #nqHud #nqPinsMod .rList b { font-size: 12px !important; font-weight: 500 !important; }
  #nqHud #nqUser #nqUserTitle, #nqHud #nqListsMod .nqLt b, #nqHud #nqNp .nq-top-row .nqVal, #nqHud #nqNp .nq-top-row .ncVal, #nqHud #nqPetInfo .nqName, #nqHud #nqPinsMod .pTabs button { text-shadow: 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6) !important; }
  &.nq-side-light #nqHud #nqUser #nqUserTitle, &.nq-side-light #nqHud #nqListsMod .nqLt b, &.nq-side-light #nqHud #nqNp .nq-top-row .nqVal, &.nq-side-light #nqHud #nqNp .nq-top-row .ncVal, &.nq-side-light #nqHud #nqPetInfo .nqName, &.nq-side-light #nqHud #nqPinsMod .pTabs button { text-shadow: none !important; }
  #nqHud > #nqUser { padding: 10px 12px !important; order: 1; padding-bottom: 22px !important; }
  #nqHud #nqUser .rightSide { grid-template-columns: 44px minmax(0, 1fr) auto !important; column-gap: 12px !important; }
  #nqHud #nqUser #nqLogoutBtn, #nqHud #nqUser #nqSwapBtn { background: var(--nq-pill-bg) !important; width: 26px !important; height: 26px !important; border-radius: 8px !important; }
  #nqHud #nqUser #nqSwapBtn:hover { background: var(--nq-pill-bg-h) !important; }
  #nqHud > #nqListsMod { display: grid !important; gap: 8px !important; padding: 8px !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important; order: 3; }
  #nqHud #nqListsMod .nqLtAcct, #nqHud #nqListsMod .nqLtPets { grid-column: auto !important; grid-row: auto !important; }
  #nqHud #nqListsMod .nqLt { display: flex !important; align-items: center !important; height: var(--nq-pill-h) !important; border: 0 !important; border-radius: var(--nq-pill-r) !important; background: var(--nq-pill-bg) !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
  #nqHud #nqListsMod .nqLt:hover { background: var(--nq-pill-bg-h) !important; }
  #nqHud #nqListsMod .nqLt em { border-radius: 999px !important; background: rgba(255,255,255,.14) !important; color: inherit !important; }
  #nqHud #nqNp .nq-chevron { width: var(--nq-pill-h) !important; height: var(--nq-pill-h) !important; border-radius: var(--nq-pill-r) !important; }
  &.nq-side-light #nqHud #nqUser #nqUserTitle, &.nq-side-light #nqHud #nqUser .name, &.nq-side-light #nqHud #nqUser .name * { color: #1c1830 !important; text-shadow: none !important; }
  &.nq-side-light #nqHud #nqUser[data-main="1"] .rightSide::after { color: #1c1830 !important; }
  &.nq-side-light #nqHud #nqUser #nqLogoutBtn, &.nq-side-light #nqHud #nqUser #nqSwapBtn, &.nq-side-light #nqHud #nqUser #nqSwapBtn:hover { color: #1c1830 !important; }
  &.nq-side-light #nqHud #nqUser #nqLogoutBtn:hover { color: #d33 !important; background: rgba(255,90,90,.16) !important; }
  &.nq-side-light #nqHud #nqListsMod .nqLt, &.nq-side-light #nqHud #nqListsMod .nqLt b { color: #1c1830 !important; }
  &.nq-side-light #nqHud #nqNp .nq-chevron:hover { color: #1c1830 !important; background: var(--nq-pill-bg-h) !important; }
  &.nq-side-light #nqHud #nqActivePet #nqPetInfo .nqTitle a, &.nq-side-light #nqHud #nqActivePet #nqPetInfo .nqName, &.nq-side-light #nqHud #nqActivePet #nqPetInfo .nqLinks a, &.nq-side-light #nqHud #nqActivePet #nqPetInfo .nqLinks button { color: #1c1830 !important; text-shadow: none !important; }
  &.nq-side-light #nqHud #nqActivePet #nqPetInfo .nqChip:not(.gF):not(.gM) { color: rgba(28,24,48,.68) !important; }

  #nqHud #nqUser #nqLogoutBtn svg, #nqHud #nqUser #nqSwapBtn svg { width: 14px !important; height: 14px !important; }
  #nqHud #nqListsMod .nqLt { box-sizing: border-box !important; min-width: 0 !important; width: 100% !important; justify-content: flex-start !important; gap: 8px !important; padding: 0 12px !important; }
  #nqHud #nqListsMod .nqLt em { margin-left: auto !important; }
  #nqHud > #nqNp { order: 2; position: relative !important; z-index: 3; box-sizing: border-box !important; width: calc(100% - 24px) !important; max-width: none !important; align-self: flex-start !important; margin: -15px 12px 0 !important; padding: 0 !important; background: transparent !important; border: 0 !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; min-height: 30px !important; }
  #nqHud #nqNp .nq-top-row { justify-content: center !important; }
  #nqHud #nqNp .nq-top-row .nq-amount, #nqHud #nqNp .nq-top-row .nq-nc, #nqHud #nqNp .nq-top-row .nq-bank { display: flex !important; flex: 0 0 auto !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; width: auto !important; min-width: 0 !important; height: 26px !important; min-height: 26px !important; margin: 0 !important; padding: 0 10px 0 22px !important; gap: 4px !important; border: 1px solid rgba(255,255,255,.10) !important; border-radius: 999px !important; background: rgba(18,16,28,.62) !important; -webkit-backdrop-filter: blur(18px) saturate(140%) !important; backdrop-filter: blur(18px) saturate(140%) !important; box-shadow: 0 4px 12px rgba(0,0,0,.25) !important; color: #fff !important; font-size: 14px !important; }
  #nqHud #nqNp .nq-top-row .nq-amount:hover, #nqHud #nqNp .nq-top-row .nq-nc:hover, #nqHud #nqNp .nq-top-row .nq-bank:hover { background: rgba(40,36,56,.78) !important; }
  #nqHud #nqNp .nq-top-row .nqVal, #nqHud #nqNp .nq-top-row .ncVal { font-size: 14px !important; line-height: 1 !important; }
  #nqHud #nqNp .nq-top-row .nq-bank { width: 26px !important; padding: 0 !important; text-decoration: none !important; cursor: pointer; }
  #nqHud #nqNp .nq-top-row .nq-bank img { position: static !important; transform: none !important; width: 18px !important; height: 18px !important; }
  #nqHud #nqNp .nq-top-row .nq-bank svg { width: 16px; height: 16px; display: block; }
  &.nq-side-light #nqHud #nqNp .nq-top-row .nq-amount, &.nq-side-light #nqHud #nqNp .nq-top-row .nq-nc, &.nq-side-light #nqHud #nqNp .nq-top-row .nq-bank { background: rgba(255,255,255,.72) !important; border-color: rgba(0,0,0,.08) !important; box-shadow: 0 4px 12px rgba(40,30,80,.14) !important; color: #1c1830 !important; }
  &.nq-side-light #nqHud #nqNp .nq-top-row .nq-amount:hover, &.nq-side-light #nqHud #nqNp .nq-top-row .nq-nc:hover, &.nq-side-light #nqHud #nqNp .nq-top-row .nq-bank:hover { background: rgba(255,255,255,.9) !important; }
  &.nq-side-light #nqHud #nqNp .nq-top-row .nqVal, &.nq-side-light #nqHud #nqNp .nq-top-row .ncVal { color: #1c1830 !important; }
  #nqHud #nqActivePet #nqPetDockBtn { top: 8px !important; right: 8px !important; }
  &.nq-side-light #nqIcons #nqNestPop, &.nq-side-light #nqIcons #nqNestPop::after { background: rgba(255,255,255,.45) !important; }
  #nqHud > #nqNp .nq-top-row { display: block !important; box-sizing: border-box !important; width: 100% !important; min-width: 0 !important; flex: none !important; background: none !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
  #nqHud > #nqNp .nq-top-row .nq-amounts { display: flex !important; width: 100% !important; max-width: 100% !important; min-width: 0 !important; flex: none !important; align-items: stretch !important; gap: 0 !important; box-sizing: border-box !important; height: 30px !important; padding: 0 !important; margin: 0 !important; overflow: hidden !important; border-radius: 999px !important; background: rgba(18,16,28,.72) !important; border: 1px solid rgba(255,255,255,.12) !important; -webkit-backdrop-filter: blur(18px) saturate(140%) !important; backdrop-filter: blur(18px) saturate(140%) !important; box-shadow: 0 4px 14px rgba(0,0,0,.28) !important; }
  #nqHud > #nqNp .nq-top-row .nq-amounts > a { position: static !important; display: flex !important; align-items: center !important; justify-content: center !important; box-sizing: border-box !important; flex: 1 1 0 !important; min-width: 0 !important; width: auto !important; height: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; gap: 5px !important; border: 0 !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; color: #fff !important; font-size: 13px !important; text-decoration: none !important; }
  #nqHud > #nqNp .nq-top-row .nq-amounts > a + a { border-left: 1px solid rgba(255,255,255,.14) !important; }
  #nqHud > #nqNp .nq-top-row .nq-amounts > a.nq-bank { flex: 0 0 34px !important; width: 34px !important; }
  #nqHud > #nqNp .nq-top-row .nq-amounts > a:hover { background: var(--nq-pill-bg-h) !important; }
  #nqHud > #nqNp .nq-top-row .nq-amounts > a img { position: static !important; transform: none !important; left: auto !important; width: 16px !important; height: 16px !important; margin: 0 !important; }
  #nqHud > #nqNp .nq-top-row .nq-amounts > a.nq-amount img, #nqHud > #nqNp .nq-top-row .nq-amounts > a.nq-nc img { order: -1; }
  #nqHud > #nqNp .nq-top-row .nq-amounts > a .nqVal, #nqHud > #nqNp .nq-top-row .nq-amounts > a .ncVal { font-size: 13px !important; line-height: 1 !important; }
  #nqHud > #nqNp .nq-top-row .nq-amounts > a.nq-bank svg { width: 16px !important; height: 16px !important; display: block !important; }
  &.nq-side-light #nqHud > #nqNp .nq-top-row .nq-amounts { background: rgba(255,255,255,.85) !important; border-color: rgba(0,0,0,.08) !important; box-shadow: 0 4px 14px rgba(40,30,80,.14) !important; }
  &.nq-side-light #nqHud > #nqNp .nq-top-row .nq-amounts > a, &.nq-side-light #nqHud > #nqNp .nq-top-row .nq-amounts > a .nqVal, &.nq-side-light #nqHud > #nqNp .nq-top-row .nq-amounts > a .ncVal { color: #1c1830 !important; }
  &.nq-side-light #nqHud > #nqNp .nq-top-row .nq-amounts > a + a { border-left-color: rgba(0,0,0,.10) !important; }
  &.nq-side-light #nqHud > #nqNp .nq-top-row .nq-amounts > a:hover { background: var(--nq-pill-bg-h) !important; }
  #nqHud #nqPinsMod .pTabs button { text-align: left !important; justify-content: flex-start !important; padding-left: 10px !important; }
  #nqHud #nqPinsMod .rList li > a { padding: 0 10px !important; align-items: flex-start !important; text-align: left !important; }
  #nqHud #nqPinsMod .rList li > a b { max-width: 100% !important; text-align: left !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
  #nqHud #nqPinsMod .rList li .rPin { right: 3px !important; width: 22px !important; height: 22px !important; border-radius: 7px !important; background: rgba(40,36,56,.92) !important; opacity: 0 !important; pointer-events: none !important; z-index: 2; }
  #nqHud #nqPinsMod .rList li:hover .rPin, #nqHud #nqPinsMod .rList li .rPin:focus, #nqHud #nqPinsMod .rList li .rPin:focus-visible { opacity: 1 !important; pointer-events: auto !important; }
  &.nq-side-light #nqHud #nqPinsMod .rList li .rPin { background: rgba(255,255,255,.95) !important; }
  #nqHud #nqPinsMod .rList li.isPinned .rPin { color: #ffd166 !important; } &.nq-side-light #nqHud #nqPinsMod .rList li.isPinned .rPin { color: #d89a00 !important; }
  #nqHud #nqActivePet #nqPetInfo .nqChips { order: 1 !important; flex: 1 1 auto !important; min-width: 0 !important; align-items: center !important; box-sizing: border-box !important; margin: 0 0 0 calc(-1 * var(--pn-pad, 12px)) !important; padding: 6px 0 6px var(--pn-pad, 12px) !important; background: var(--nq-pill-bg) !important; }
  #nqHud #nqActivePet #nqPetInfo .nqLinks { order: 2 !important; flex: 0 0 auto !important; align-items: center !important; box-sizing: border-box !important; margin: 0 calc(-1 * var(--pn-pad, 12px)) 0 0 !important; padding: 6px var(--pn-pad, 12px) 6px 0 !important; gap: 4px !important; background: var(--nq-pill-bg) !important; }
  #nqHud #nqActivePet #nqPetInfo .nqLinks a svg, #nqHud #nqActivePet #nqPetInfo .nqLinks button svg { width: 14px !important; height: 14px !important; }
  #nqHud #nqActivePet #nqPetInfo .nqDetails { order: 4 !important; }
  #nqHud #nqActivePet #nqPetInfo .nqTitle { position: absolute !important; left: 10px !important; right: 10px !important; top: var(--nq-img-h, 240px) !important; transform: translateY(calc(-100% - 10px)) !important; z-index: 3 !important; display: flex !important; align-items: center !important; flex-wrap: nowrap !important; justify-content: flex-start !important; gap: 6px !important; margin: 0 !important; max-width: calc(100% - 20px) !important; text-align: left !important; }
  #nqHud #nqActivePet #nqPetInfo .nqTitle a { display: block !important; position: static !important; min-width: 0 !important; text-align: left !important; }
  #nqHud #nqActivePet #nqPetInfo .nqName { font-family: 'CafeteriaBlack', Georgia, serif !important; font-size: 26px !important; font-weight: 400 !important; line-height: 1.05 !important; letter-spacing: .02em !important; padding: 0 !important; }
  #nqHud #nqActivePet #nqPetInfo .nqSub, #nqHud #nqActivePet #nqPetInfo .nqTitle .nqCopy { opacity: 0 !important; transform: translateY(4px) !important; transition: opacity .18s ease, transform .18s ease, background .15s !important; }
  #nqHud #nqActivePet #nqPetInfo .nqSub { position: absolute !important; left: 0 !important; bottom: 100% !important; top: auto !important; margin: 0 0 4px !important; display: -webkit-box !important; -webkit-box-orient: vertical !important; -webkit-line-clamp: 2 !important; box-sizing: border-box !important; width: max-content !important; max-width: 100% !important; overflow: hidden !important; white-space: normal !important; pointer-events: none !important; font: 600 11.5px/1.25 'Outfit', system-ui, sans-serif !important; padding: 4px 9px !important; border-radius: 999px !important; background: rgba(20,16,32,.55) !important; -webkit-backdrop-filter: blur(10px) !important; backdrop-filter: blur(10px) !important; color: #fff !important; text-shadow: none !important; }
  #nqHud #nqActivePet #nqPetInfo .nqSub .nqG.gF { color: #ffb3d9 !important; text-shadow: none !important; }
  #nqHud #nqActivePet #nqPetInfo .nqSub .nqG.gM { color: #a8d4ff !important; text-shadow: none !important; }
  #nqHud #nqActivePet #nqPetInfo .nqTitle .nqCopy { position: static !important; flex: 0 0 auto !important; }
  #nqHud #nqActivePet:hover #nqPetInfo .nqSub, #nqHud #nqActivePet:focus-within #nqPetInfo .nqSub, #nqHud #nqActivePet:hover #nqPetInfo .nqTitle .nqCopy, #nqHud #nqActivePet:focus-within #nqPetInfo .nqTitle .nqCopy { opacity: 1 !important; transform: none !important; }
  #nqHud #nqActivePet.nq-name-dark #nqPetInfo .nqTitle a, #nqHud #nqActivePet.nq-name-dark #nqPetInfo .nqName, #nqHud #nqActivePet.nq-name-dark #nqPetInfo .nqTitle .nqCopy { color: #1c1830 !important; text-shadow: none !important; }
  #nqHud #nqActivePet #nqPetInfo .nqTitle a, #nqHud #nqActivePet #nqPetInfo .nqName, #nqHud #nqActivePet #nqPetInfo .nqTitle .nqCopy { transition: opacity .15s; }
  #nqHud #nqActivePet.nq-tone-pending #nqPetInfo .nqTitle a, #nqHud #nqActivePet.nq-tone-pending #nqPetInfo .nqName, #nqHud #nqActivePet.nq-tone-pending #nqPetInfo .nqTitle .nqCopy { opacity: 0 !important; }
  #nqHud #nqActivePet.nq-name-light #nqPetInfo .nqTitle a, #nqHud #nqActivePet.nq-name-light #nqPetInfo .nqName, #nqHud #nqActivePet.nq-name-light #nqPetInfo .nqTitle .nqCopy { color: #fff !important; text-shadow: 0 1px 3px rgba(0,0,0,.85), 0 1px 1px rgba(0,0,0,.6) !important; }
  #nqHud #nqActivePet #nqPetInfo .nqStats { box-sizing: border-box !important; width: 100% !important; margin: 0 !important; }
  #nqHud #nqActivePet #nqPetInfo .nqStats.open { padding: 10px 0 var(--pn-pad, 12px) !important; }
  #nqHud #nqActivePet #nqPetInfo .nqStatsBody, #nqHud #nqActivePet #nqPetInfo .nqStatsBody .nqDetails { box-sizing: border-box !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
  #nqHud #nqActivePet #nqPetInfo .nqStatsBody .nqDetails { display: flex !important; flex-direction: column !important; gap: 6px !important; }
  #nqHud #nqActivePet #nqPetInfo .nqStatsBody .nqStat { box-sizing: border-box !important; width: 100% !important; display: flex !important; justify-content: space-between !important; align-items: center !important; gap: 8px !important; margin: 0 !important; padding: 5px 10px !important; line-height: 1.3 !important; }
  &.nq-side-light #nqHud #nqActivePet #nqPetInfo .nqStatsBody .nqStat { background: rgba(0,0,0,.08) !important; text-shadow: none !important; }
  &.nq-side-light #nqHud #nqActivePet #nqPetInfo .nqStatsBody .nqStat span { color: rgba(28,24,48,.68) !important; text-shadow: none !important; }
  &.nq-side-light #nqHud #nqActivePet #nqPetInfo .nqStatsBody .nqStat b { color: #1c1830 !important; text-shadow: none !important; }
  &.nq-side-light #nqHud #nqActivePet #nqPetInfo .nqStatsBody .nqStat b.gF { color: #c2377e !important; }
  &.nq-side-light #nqHud #nqActivePet #nqPetInfo .nqStatsBody .nqStat b.gM { color: #2f6fc4 !important; }
  &.nq-side-light #nqHud #nqListsMod .nqLt { background: #fff !important; box-shadow: 0 1px 3px rgba(40,30,80,.08) !important; }
  &.nq-side-light #nqHud #nqListsMod .nqLt:hover { background: #f3f0fa !important; }
}`;

  const NC_CSS = `
html[data-nq-modern-interface] {
  --nq-col-width: 0px !important;
  --nq-bar-inset-left: 0px !important;
  #nqHud, #nqLeftBar, #btnOverlay, #nqSideBtnHost, #qrDockWrap, #nqFoot, #nqBgHandle, #nqBgSidebar,
  .navsub-left__2020, .navsub-right__2020 { display: none !important; }
}`;

  const BAR_STYLES = ['none', 'tint', 'blur', 'solid'];
  function applyAccentContrast(hexIn) {
    let hex = hexIn || '';
    try { if (!hex) hex = NQ.getAccent() || LSget('nq_accent_v1'); } catch {}
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) { rs.setProperty('--nq-accent-fg', '#1a1330'); rs.setProperty('--nq-accent-fg-shadow', 'none'); return; }
    const n = parseInt(m[1], 16);
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
    const white = (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.059);
    rs.setProperty('--nq-accent-fg', white ? '#ffffff' : '#1a1330');
    rs.setProperty('--nq-accent-fg-shadow', white ? '0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6)' : 'none');
  }
  function applySearchContrast() {
    const style = root.dataset.nqBar || 'blur';
    let hex = '';
    try {
      if (style === 'none') hex = NQ.getAccent() || LSget('nq_accent_v1');
      else hex = LSget('nq_color_head') || DEF.head;
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
    rs.setProperty('--nq-search-fg-auto', white ? '#ffffff' : '#000000');
    rs.setProperty('--nq-search-ts-auto', white ? '0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6)' : 'none');
    rs.setProperty('--nq-search-icon-filter', white ? 'drop-shadow(0 1px 2px rgba(0,0,0,.8))' : 'none');
  }
  function applyLogo() { rs.setProperty('--nq-logo-filter', LSget('nq_logo_white') === '1' ? 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.35))' : 'none'); }
  const applyBarStyle = (v) => { root.dataset.nqBar = BAR_STYLES.includes(v) ? v : 'blur'; applySearchContrast(); try { applyNavContrast(); } catch {} };
  const BAR_CSS = `
html[data-nq-modern-interface][data-nq-bar="none"] {
  --nq-bar-bg: transparent !important; --nq-bar-backdrop: none !important; --nq-bar-line: transparent !important; --nq-bar-shadow: none !important;
  --nq-nav-shadow: 0 1px 2px rgba(0,0,0,.6), 0 2px 8px rgba(0,0,0,.45);
  --nq-nav-stroke: 3.5px rgba(46,34,62,.92);
  --nq-nav-icon-filter: drop-shadow(0 0 1.5px rgba(46,34,62,.9)) drop-shadow(0 2px 4px rgba(0,0,0,.35));
  --nq-search-bg: color-mix(in srgb, var(--nq-accent, #fff) 66%, #fff); --nq-search-bg-h: color-mix(in srgb, var(--nq-accent, #fff) 56%, #fff); --nq-search-bg-f: color-mix(in srgb, var(--nq-accent, #fff) 50%, #fff);
  --nq-search-line: color-mix(in srgb, var(--nq-accent, #fff) 58%, #000); --nq-search-line-h: color-mix(in srgb, var(--nq-accent, #fff) 50%, #000); --nq-search-line-f: color-mix(in srgb, var(--nq-accent, #fff) 45%, #000);
  --nq-search-ring: color-mix(in srgb, var(--nq-accent, #fff) 55%, transparent);
  --nq-search-shadow: inset 0 1px 2px rgba(0,0,0,.14), 0 1px 0 rgba(255,255,255,.45);
  --nq-menu-lift: -2px; --nq-menu-caret: block; --nq-menu-radius: 16px;
}
html[data-nq-modern-interface][data-nq-bar="tint"] {
  --nq-bar-bg: linear-gradient(180deg, var(--nq-head-a-tint, #ff8a1fb3), var(--nq-head-b-tint, #b86316b3)) !important;
  --nq-bar-backdrop: none !important; --nq-bar-line: rgba(255,255,255,.16) !important; --nq-bar-shadow: 0 2px 10px rgba(0,0,0,.16) !important;
}
html[data-nq-modern-interface][data-nq-bar="blur"] {
  --nq-bar-bg: linear-gradient(180deg, var(--nq-head-a-blur, #ff8a1f8c), var(--nq-head-b-blur, #b863168c)) !important;
  --nq-bar-backdrop: blur(16px) saturate(1.35) !important; --nq-bar-line: rgba(255,255,255,.26) !important; --nq-bar-shadow: 0 4px 22px rgba(0,0,0,.18) !important;
}
html[data-nq-modern-interface][data-nq-bar="solid"] {
  --nq-bar-bg: linear-gradient(180deg, var(--nq-head-a-solid, #ff8a1f), var(--nq-head-b-solid, #b86316)) !important;
  --nq-bar-backdrop: none !important; --nq-bar-line: rgba(255,255,255,.18) !important; --nq-bar-shadow: 0 4px 18px rgba(0,0,0,.28) !important;
}`;

  const SHADOW_CSS = `
@font-face { font-family: 'CafeteriaBlack'; src: url('https://images.neopets.com/js/fonts/cafeteria-black.otf') format('opentype'); font-display: swap; }
.nq-clock { position: absolute; top: 50%; right: calc(14px + var(--nq-ic, 44px) * 2 + var(--nq-ig, 10px) + 12px); transform: translateY(-50%); z-index: 2; font: 400 20px/1 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .02em; color: var(--nq-nav-fg, #fff) !important; text-shadow: var(--nq-nav-shadow, 0 1px 3px rgba(0,0,0,.55), 0 1px 1px rgba(0,0,0,.4)) !important; pointer-events: none; white-space: nowrap; transition: opacity .15s ease; }
:host(.nq-search-open) .nq-clock { opacity: 0; }
#menu-premium { max-height: calc(100vh - 100px); overflow-x: hidden !important; overflow-y: auto !important; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.35) transparent; }
.menu a .nq-cd { margin-left: auto; padding: 2px 8px; border-radius: 9px; background: rgba(255,255,255,.16); color: #fff; font: normal 700 11px/1.3 'Outfit', system-ui, sans-serif; white-space: nowrap; }
.menuHead { position: sticky; top: -8px; z-index: 1; margin: 0 -8px; padding: 9px 20px 4px; background: rgba(14,12,22,.55); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); font: 700 10px/1 'Outfit', system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.5); }
#menu-premium::-webkit-scrollbar { width: 8px; }
#menu-premium::-webkit-scrollbar-thumb { background: rgba(255,255,255,.3); border-radius: 4px; }
.nq-search { position: absolute; right: 60px; top: 50%; transform: translateY(-50%); z-index: 2; width: 34px; height: 34px; margin: 0; pointer-events: auto; transition: width .45s cubic-bezier(.22, 1, .36, 1); }
.nq-search:hover, .nq-search:focus-within { width: 232px; }
.nq-search input { box-sizing: border-box; width: 100%; height: 34px; padding: 0 16px 0 40px; border: 1px solid transparent; border-radius: 999px; background: transparent; box-shadow: none; color: var(--nq-search-fg-auto, #fff); font: 400 17px 'CafeteriaBlack', Georgia, serif !important; letter-spacing: .02em; text-shadow: var(--nq-search-ts-auto, 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6)); outline: 0; cursor: pointer; text-overflow: clip; transition: background .3s, border-color .3s, box-shadow .3s; }
.nq-search:hover input, .nq-search:focus-within input { cursor: text; border-color: var(--nq-search-line, rgba(0,0,0,.3)); background: var(--nq-search-bg, rgba(255,255,255,.28)); box-shadow: var(--nq-search-shadow, inset 0 1px 2px rgba(0,0,0,.16), 0 1px 0 rgba(255,255,255,.3)); }
.nq-search input:focus { background: var(--nq-search-bg-f, rgba(255,255,255,.42)); border-color: var(--nq-search-line-f, rgba(0,0,0,.42)); box-shadow: inset 0 1px 2px rgba(0,0,0,.14), 0 0 0 3px var(--nq-search-ring, rgba(255,255,255,.35)), 0 4px 14px rgba(0,0,0,.18); }
.nq-search input::placeholder { color: var(--nq-search-fg-auto, #fff); text-shadow: var(--nq-search-ts-auto, 0 1px 3px rgba(0,0,0,.8), 0 1px 1px rgba(0,0,0,.6)); opacity: 0; transition: opacity .12s; }
.nq-search:hover input::placeholder, .nq-search:focus-within input::placeholder { opacity: 1; transition: opacity .3s .2s; }
.nq-search button { position: absolute; z-index: 1; left: 2px; top: 50%; transform: translateY(-50%); width: 30px; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: transparent; cursor: pointer; }
.nq-search button img { width: 30px; height: 30px; display: block; filter: var(--nq-nav-icon-filter, drop-shadow(0 1px 2px rgba(0,0,0,.3))); transition: transform .35s cubic-bezier(.22, 1, .36, 1); }
.nq-search:hover button img, .nq-search:focus-within button img { transform: scale(.82); }
.nq-premcaret { display: none; position: absolute; z-index: 6; width: 12px; height: 12px; transform: rotate(45deg); background: rgba(40,36,52,.92); border-left: 1px solid rgba(255,255,255,.2); border-top: 1px solid rgba(255,255,255,.2); pointer-events: none; }
#menu-premium::before { content: none; }
.nq-prembg { display: none; position: absolute; overflow: hidden; box-sizing: border-box; border-radius: var(--nq-menu-radius, 0 0 16px 16px); pointer-events: none; }
.nq-prembg::before { content: ""; position: absolute; inset: -24px; background: linear-gradient(rgba(14,12,22,.38), rgba(14,12,22,.38)), var(--nqLeftBarImg, none) center / cover no-repeat, var(--nqLeftBarSolid, #2a292e); filter: blur(14px) saturate(1.15); }
.nq-logo { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); z-index: 2; display: flex; align-items: center; text-decoration: none; pointer-events: auto; }
.nq-logo img { height: 43px; max-width: 215px; display: block; filter: var(--nq-logo-filter, none); }
.nq-logo span { display: none; font: 400 32px 'CafeteriaBlack', Georgia, serif; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.8); }
.nq-logo.txt span { display: inline; }
.nq-menu-edit-btn { position: relative; display: flex; align-items: center; justify-content: flex-start; gap: 8px; box-sizing: border-box; width: 100%; height: auto; margin: 6px 0 0; padding: 9px 14px 5px; border: 0; border-top: 1px solid rgba(255,255,255,.14); border-radius: 0; background: transparent; color: rgba(255,255,255,.78); font: 600 13px/1 'Outfit', system-ui, sans-serif; text-shadow: 0 1px 3px rgba(0,0,0,.85); cursor: pointer; transition: color .15s; }
.nq-menu-edit-btn svg { width: 13px; height: 13px; flex: none; filter: drop-shadow(0 1px 2px rgba(0,0,0,.7)); }
.nq-menu-edit-btn:hover, .nq-menu-edit-btn.active { color: #fff; }
.nq-menu-edit-btn:hover span { text-decoration: underline; text-underline-offset: 3px; }
.nq-tabs { display: flex; gap: 4px; margin-bottom: 6px; padding: 3px; border-radius: 11px; background: rgba(255,255,255,.08); }
.nq-tabs button { flex: 1; height: 30px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: rgba(255,255,255,.7); font: 400 18px 'CafeteriaBlack', Georgia, serif; cursor: pointer; transition: background .15s, color .15s; }
.nq-tabs button:hover { background: rgba(255,255,255,.14); color: #fff; }
#menu-shop[data-tab="np"] .nq-tabs [data-t="np"], #menu-shop[data-tab="nc"] .nq-tabs [data-t="nc"] { background: var(--nq-accent, #fff); color: var(--nq-accent-fg, #1a1330); text-shadow: var(--nq-accent-fg-shadow, none); }
#menu-shop[data-tab="np"] [data-g="nc"], #menu-shop[data-tab="nc"] [data-g="np"], #menu-shop .menuSep { display: none !important; }
.menu a.nqSnowRow svg { width: 22px; height: 22px; flex: none; color: #bfe3ff; }
.nqSnowBadge { margin-left: auto; padding: 2px 8px; border-radius: 9px; background: rgba(255,255,255,.16); color: #fff; font: normal 700 11px/1.3 'Outfit', system-ui, sans-serif; white-space: nowrap; font-variant-numeric: tabular-nums; }
.nqSnowBadge.asleep { background: #22b45a; }
.nqSnowBadge.ready { background: #f0a020; color: #2a1a00; }
.nqMainHint { padding: 2px 12px 4px; font: 500 11px/1.35 'Outfit', system-ui, sans-serif; color: rgba(255,255,255,.62); }
.menu a.nqMainRow { cursor: pointer; }
.menu a.nqMainRow span { font-size: 15px !important; }
.nqAlertRow svg { color: #ffd27a !important; }
.btn.nq-alert-on::after { content: ""; position: absolute; top: 6px; left: 37px; width: 9px; height: 9px; border-radius: 50%; background: #2fd873; box-shadow: 0 0 0 2px rgba(255,255,255,.92), 0 1px 3px rgba(0,0,0,.35); pointer-events: none; z-index: 1; }
@media (max-width: 1500px) { .btn.nq-alert-on::after { left: 29px; } }
@media (max-width: 1250px) { .btn.nq-alert-on::after { left: 26px; } }
@media (max-width: 900px) { :host(:not(.nqHam)) .inner { padding-left: 12px !important; padding-right: 12px !important; } :host(:not(.nqHam)) .nq-logo { display: none; } }
@media (max-width: 1100px) {
  :host(.nqHam) .nq-clock { display: none !important; }
  :host(.nqHam) .inner { padding-left: 206px !important; padding-right: 126px !important; }
  :host(.nqHam) .nq-logo { display: flex; left: 58px; }
  :host(.nqHam) .nq-logo img { height: 34px; max-width: clamp(80px, calc(100vw - 200px), 140px); }
  :host(.nqHam) .btn { padding: 8px 5px !important; }
}
@media (max-width: 950px) {
  :host(.nqHam) .btn:has(img) span { display: none !important; }
  :host(.nqHam) .left { gap: 0 !important; }
}
@media (max-width: 820px) {
  :host(.nqHam) .inner { padding-left: 164px !important; padding-right: 118px !important; }
  :host(.nqHam) .nq-logo img { max-width: 96px; }
  :host(.nqHam) .btn { padding: 8px 3px !important; }
}
@media (max-width: 640px) {
  :host(.nqHam) .left { display: none !important; }
  :host(.nqHam) .inner { padding-left: 0 !important; padding-right: 0 !important; }
}
@media (max-width: 420px) { :host(.nqHam) .nq-logo img { max-width: clamp(70px, calc(100vw - 190px), 110px); } }
`;

  const EDITOR_CSS = `
.tab { left: calc((var(--nq-col-width, 240px) + 100%) / 2) !important; width: 44px !important; height: 16px !important; border-radius: 12px 12px 0 0 !important; color: #fff; opacity: 0; transition: opacity .15s, background .12s !important; }
.tab.show, .tab:hover { opacity: 1; }
.tab svg { width: 12px; height: 12px; display: block; transform: rotate(180deg); transition: transform .15s; }
.tab.isOpen svg { transform: none; }
.tab { background: #1a1722 !important; border-color: rgba(255,255,255,.14) !important; }
.tab:hover { background: #26222f !important; }
.panel.open { box-shadow: 0 -6px 36px rgba(0,0,0,.16) !important; }
.panel { background: #1a1722 !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; border-color: rgba(255,255,255,.14) !important; width: 420px !important; max-width: 96vw !important; height: auto !important; max-height: min(470px, 78vh) !important; }
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
.add button { height: 34px; background: var(--nq-accent, #fff); color: var(--nq-accent-fg, #1a1722); border-color: transparent; font-size: 12px; text-shadow: var(--nq-accent-fg-shadow, none); }
.add button:hover { background: var(--nq-accent, #fff); filter: brightness(1.06); }
.head { align-items: center; gap: 8px; padding: 12px 14px 10px; border-bottom: 1px solid rgba(255,255,255,.1); }
.head::before { content: 'Shortcut icons'; margin-right: auto; font: 700 13px/1 'Outfit', system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.92); }
.body { grid-template-columns: 1fr !important; gap: 0; }
.col { background: transparent; border: 0; padding: 0; }
.items { gap: 5px; height: 340px !important; overflow-y: scroll; }
.item { grid-template-columns: 28px minmax(0, 1fr) auto auto auto !important; padding: 4px 8px; }
.nqNestBtn { width: 24px; height: 24px; padding: 0; border-radius: 8px; font-size: 14px; line-height: 1; cursor: pointer; }
.nqNestBtn.on { background: var(--nq-accent, #fff) !important; color: var(--nq-accent-fg, #1a1722) !important; border-color: transparent !important; }
.nqNestBtn:disabled { opacity: .35; cursor: default; }
.item.nqNested { margin-left: 22px; opacity: .88; }
.item.nqParent .lbl::after { content: ' ▸'; opacity: .7; }
.panel.open .body { padding: 14px 18px 0 !important; }
.nqNestHint { display: none !important; margin-top: 10px; padding: 8px 12px; border: 1px solid rgba(255,255,255,.16); border-radius: 10px; background: rgba(255,255,255,.06); color: rgba(255,255,255,.8); font: 500 11px/1.4 'Outfit', system-ui, sans-serif; }
.item .lbl { text-align: left; }
.panel { bottom: 0 !important; border-bottom: 0 !important; border-radius: 16px 16px 0 0 !important; }
.body { padding: 14px 18px 24px; }
.add { margin-top: 14px; position: sticky !important; bottom: 0 !important; z-index: 3; margin: 14px -18px 0 !important; padding: 12px 18px 18px !important; background: #1a1722 !important; border-top: 1px solid rgba(255,255,255,.1); box-shadow: 0 -12px 14px -8px rgba(0,0,0,.4); }
.panel { left: calc((var(--nq-col-width, 240px) + 100%) / 2) !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }
.head { flex: none; }
.body { flex: 1 1 auto !important; min-height: 0 !important; overflow-y: auto !important; overscroll-behavior: contain; }
.tab.isOpen { opacity: 0 !important; pointer-events: none; }
`;

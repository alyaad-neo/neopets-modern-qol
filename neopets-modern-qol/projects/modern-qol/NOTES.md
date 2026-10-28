# NOTES: modern-qol

Keep this file short. It is the map the agent reads before every task.

## What it does

The Modern Interface skin (based on "Neopets - Modern Interface" by marius@clraik, MIT) merged with Aly's patcher: top bar, left sidebar (HUD), backgrounds and colours, Premium menu, tools column, pet card, account swap handling and page tweaks. It is one of the four projects in the Modern QOL bundle.

## Type

- Split. Edit files in `src/`. `node bundle.js` builds it (it runs `node build.js modern-qol`). Upload only the bundle: `dist/Neopets - Modern QOL.user.js`.
- `src/00-header.js` is only used by `build.js`; the real header is `projects/_bundle/00-header.js`.
- The two single-file scripts this was split from are in git history (commit `de59c3b`, `projects/modern-qol/original/`).
- Line endings: LF.

## Pages it runs on

All of neopets.com and ncmall.neopets.com (bundle `@match`). `items.jellyneo.net` only for the JellyNeo popup.

## Load order

1. `05-utils` top-frame guard, `10-jellyneo` (popup on JellyNeo, click handler on neopets), `15-core` host guard.
2. `15-core` sets `NQ.base = true` unless `npBaseOff()` (excluded paths `/`, `/~*`, faeriefragments, talesofdacardia, games with query; phones). Each base file `20/25/30` declares its constants and pure functions at file level, then one `start*` function (`startLayout`, `startHud`, `startBackgrounds`) with the DOM-building steps, and ends with `if (NQ.base) start*();`. Patcher code (40+) runs either way, but `boot()` only with `NQ.base`.
3. `90-main` defines `NQ.boot`. `bundle.js` calls `NQ.boot()` after `dailies-qol`, so `NQ.dailies` exists when the Premium menu and daily card are set up.

## Feature map

| Feature | File | Search for |
| --- | --- | --- |
| MIT credit, strict mode, `PW`, top-frame guard | 05-utils.js | `Based on` |
| JellyNeo item popup | 10-jellyneo.js | `nqJN`, `nqJnCard` |
| Host guard, phone/path exclusions, 403 backoff, patcher helpers (`W`, `$`, `LSget`, `esc`, `shadow`), GM sync, icons | 15-core.js | `npBaseOff`, `np403BackoffActive`, `SYNC_KEYS`, `noAdblockPopup` |
| Base: layout, native hiding, top bar `#nq-host`, accent and button-theme APIs, scrollbar | 20-layout.js | `nq-core-layout`, `exposeBtnThemes`, `exposeAccent`, `customScrollbar` |
| Base: sidebar `#nqHud`, user card, bank, QuickRef, NP, icon column, side-button editor | 25-hud.js | `userModule`, `bankModule`, `qrModule`, `npModule`, `colsModule`, `sideBtnEditor` |
| Base: background boot, `#nqBgSidebar` | 30-backgrounds.js | `nqBgBoot` |
| Patcher CSS and bar styling | 40-styles.js | `PAGE_CSS`, `LAYOUT_CSS`, `NC_CSS`, `BAR_CSS`, `SHADOW_CSS`, `EDITOR_CSS` |
| Colour picker, DTI backgrounds | 45-colors.js | `injectPicker`, `discoverBgs`, `paintAll` |
| Right background sidebar wiring | 50-sidebar.js | `wireSidebar` |
| Header patches, NC nav links | 55-header.js | `patchShadow`, `fixNcNavLinks` |
| Premium menu | 60-premium.js | `setupPremium`, `PREMIUM_ITEMS` |
| Search tools, icon nesting, editor patches | 65-tools.js | `setupTools`, `setupNest`, `patchEditor` |
| Neopets bell, footer, clock | 70-bell-clock.js | `setupBell`, `setupClock` |
| Accounts list, pet card, pet image, name tone, dock | 75-pet.js | `renderPetInfo`, `syncPetImg`, `fixPetImg`, `petUI`, `NQ.tone` (also used by the drawer) |
| Daily fold, scroll-top, shop prices, shopkeeper lock, keys, NC, bank | 80-page-tweaks.js | `setupDailyFold`, `highlightShopPrices`, `lockShopkeeper` |
| Global listeners, per-account theme, account guard, login/logout stripping | 85-account.js | `accountGuard`, `swapTheme`, `stripUi` |
| Defaults, synced settings, sidebar layout, nav, drawer, `boot()`, `build()`, home bg fix | 90-main.js | `boot`, `build`, `layoutSidebar` |

## Depends on

`NQ` (declared by bundle.js). `dailies-qol` provides `NQ.dailies`. Storage keys use `nq_*` (migrated from `npqol_*`/`npp_*` by `projects/_bundle/10-migrate.js`); GM key `nq_sync`.

## Don't touch

- Keep the MIT credit line in `05-utils.js` and the bundle header.
- One helper set, top of 15-core: `W`, `root`, `$`, `LSget`/`LSset`/`LSdel`, `esc`, `shadow`. Use them; don't add local copies or raw `localStorage`/`document.querySelector` (10-jellyneo excepted: it runs before 15-core). Inside `startLayout`, the top-bar shadow root is `barRoot`.

## Lessons learned

- Old per-project notes and the patcher HANDOFF.md: git history, commit `de59c3b`, under `projects/modern-qol/original/`.

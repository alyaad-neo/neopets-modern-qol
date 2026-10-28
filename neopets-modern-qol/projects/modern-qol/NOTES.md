# NOTES: modern-qol

Keep this file short. It is the map the agent reads before every task.

## What it does

The Modern Interface skin (based on "Neopets - Modern Interface" by marius@clraik, MIT) merged with Aly's patcher: top bar, left sidebar (HUD), backgrounds and colours, Premium menu, tools column, pet card, account swap handling and page tweaks. It is one of the four projects in the Modern QOL bundle.

## Type

- Split. Edit files in `src/`. `node bundle.js` builds it (it runs `node build.js modern-qol`). Upload only the bundle: `dist/Neopets - Modern QOL.user.js`.
- `src/00-header.js` is only used by `build.js`; the real header is `projects/_bundle/00-header.js`.
- `original/` holds the two single-file scripts this was split from (stage 3 of `HANDOFF-merge.md`). Delete it once Aly confirms the split works.
- Line endings: LF.

## Pages it runs on

All of neopets.com and ncmall.neopets.com (bundle `@match`). `items.jellyneo.net` only for the JellyNeo popup.

## Load order

1. `05-utils` top-frame guard, `10-jellyneo` (popup on JellyNeo, click handler on neopets), `15-core` host guard.
2. `15-core` sets `NQ.base = true` unless `npBaseOff()` (excluded paths `/`, `/~*`, faeriefragments, talesofdacardia, games with query; phones). Base files `20/25/30` return early without `NQ.base`. Patcher code (40+) runs either way, but `boot()` only with `NQ.base`.
3. `90-main` defines `NQ.boot`. `bundle.js` calls `NQ.boot()` after `dailies-qol`, so `NQ.dailies` exists when the Premium menu and daily card are set up.

## Feature map

| Feature | File | Search for |
| --- | --- | --- |
| MIT credit, strict mode, `PW`, top-frame guard | 05-utils.js | `Based on` |
| JellyNeo item popup | 10-jellyneo.js | `nppJN`, `nppJnCard` |
| Host guard, phone/path exclusions, 403 backoff, patcher helpers (`W`, `$`, `LSget`, `esc`, `shadow`), GM sync, icons | 15-core.js | `npBaseOff`, `np403BackoffActive`, `SYNC_KEYS`, `noAdblockPopup` |
| Base: layout, native hiding, top bar `#npx-host`, accent and button-theme APIs, scrollbar | 20-layout.js | `np-core-layout`, `exposeBtnThemes`, `exposeAccent`, `customScrollbar` |
| Base: sidebar `#npHud`, user card, bank, QuickRef, NP, icon column, side-button editor | 25-hud.js | `userModule`, `bankModule`, `qrModule`, `npModule`, `colsModule`, `sideBtnEditor` |
| Base: background boot, `#npBgSidebar` | 30-backgrounds.js | `npBgBoot` |
| Patcher CSS and bar styling | 40-styles.js | `PAGE_CSS`, `LAYOUT_CSS`, `NC_CSS`, `BAR_CSS`, `SHADOW_CSS`, `EDITOR_CSS` |
| Colour picker, DTI backgrounds | 45-colors.js | `injectPicker`, `discoverBgs`, `paintAll` |
| Right background sidebar wiring | 50-sidebar.js | `wireSidebar` |
| Header patches, NC nav links | 55-header.js | `patchShadow`, `fixNcNavLinks` |
| Premium menu | 60-premium.js | `setupPremium`, `PREMIUM_ITEMS` |
| Search tools, icon nesting, editor patches | 65-tools.js | `setupTools`, `setupNest`, `patchEditor` |
| Neopets bell, footer, clock | 70-bell-clock.js | `setupBell`, `setupClock` |
| Accounts list, pet card, pet image, name tone, dock | 75-pet.js | `renderPetInfo`, `syncPetImg`, `fixPetImg`, `petUI` |
| Daily fold, scroll-top, shop prices, shopkeeper lock, keys, NC, bank | 80-page-tweaks.js | `setupDailyFold`, `highlightShopPrices`, `lockShopkeeper` |
| Global listeners, per-account theme, account guard, login/logout stripping | 85-account.js | `accountGuard`, `swapTheme`, `stripUi` |
| Defaults, synced settings, sidebar layout, nav, drawer, `boot()`, `build()`, home bg fix | 90-main.js | `boot`, `build`, `layoutSidebar` |

## Depends on

`NQ` (declared by bundle.js). `dailies-qol` provides `NQ.dailies`. Storage keys use `npqol_*`, `npp_*`; GM key `npp_sync`.

## Don't touch

- Keep the MIT credit line in `05-utils.js` and the bundle header.
- The three base files keep their own IIFE scopes (names like `W`, `root`, `LSget` exist inside them and in 15-core). Unwrap them only when renaming the duplicates.

## Lessons learned

- Old per-project notes: `original/modern-interface/NOTES.md`, `original/modern-interface-patcher/NOTES.md` and `HANDOFF.md`.

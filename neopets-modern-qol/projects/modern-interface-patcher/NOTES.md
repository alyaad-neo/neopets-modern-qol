# NOTES: modern-interface-patcher

Keep this file short. It is the map the agent reads before the agent reads before every task.

## What it does

Runtime patches for the third-party "Neopets - Modern Interface" script. Restyles the header (HUD), sidebar, user card, pet card, background picker, notifications, and shortcut icons. Handles theme sync and bank/NC balance display. The accounts drawer and recent/pinned pages now live in their own projects. This project is bundled with those two by `bundle.js`.

## Type

- Single-file. Edit and upload: `Neopets - Modern Interface PATCHER-4.0.0.js`

## Pages it runs on

- `*://*.neopets.com/*` — all Neopets pages
- `*://ncmall.neopets.com/*` — NC Mall
- Excludes: `www.neopets.com/`, `index.phtml*`, `login*`, `logout*`, `loginpage.phtml*`, `signin*`, `neopass*`

## Feature map

| Feature | File | Search for (function names, CSS classes, button text) |
| --- | --- | --- |
| Background colour picker | lines 834-923 | `injectPicker`, `#nppColors`, `data-preset`, `data-k`, `data-acc` |
| DTI shuffle & keyword search | lines 924-1169 | `discoverBgs`, `kwSearch`, `#nppShuffle`, `#nppDiscBar`, `dtiPage` |
| Header bar style (blur/tint/solid/none) | lines 587-612 | `applyBarStyle`, `data-npp-bar`, `BAR_CSS` |
| Accent colour contrast | lines 553-585, 801-833 | `applyAccentContrast`, `applyNavContrast`, `--npp-accent-fg` |
| Logo toggle (black/white) | line 585 | `applyLogo`, `--npp-logo-filter`, `nppLogoDot` |
| Shadow DOM header patching | lines 1170-1356 | `patchShadow`, `SHADOW_CSS`, `#menu-premium` |
| Premium dropdown menu | lines 1357-1456 | `setupPremium`, `PREMIUM_ITEMS`, `nativePremium` |
| Shortcut icons & search | lines 1457-1576 | `setupTools`, `#nppTools`, `#nppBellBtn`, `nppSearch`, `nppOpen` |
| Icon nesting (right-click group) | lines 1577-1724 | `setupNest`, `#nppNestPop`, `#nppNestMenu`, `NEST_KEY` |
| Shortcut icon editor | lines 1725-1782 | `patchEditor`, `EDITOR_CSS`, `decorateEditorNest` |
| Notification drawer | lines 1783-1904 | `wireNotif`, `#nppNotifDrawer`, `#nppBellBtn`, `resolveMail` |
| Header clock + notification footer | lines 1905-1944 | `setupClock`, `.npp-clock`, `npp-search-open`, `buildFooter` |
| Account list helpers (kept for picker + guard) | lines 1946-2021 | `noteAccount`, `allAccts`, `readAccts` |
| Pet card overlay | lines 2022-2072 | `petUI`, `#nppPetInfo`, `#npPetDockBtn`, `renderPetInfo` |
| Daily notices fold | lines 2073-2091 | `setupDailyFold`, `.nppFold`, `FOLD_KEY` |
| Scroll-to-top button | lines 2092-2113 | `setupScrollTop`, `#nppTop` |
| Watch list (Shop dropdown) | lines 2114-2145 | `openWatch`, `#nppWatch`, `WATCH_KEY` |
| Shop price highlight (10k/25k) | lines 2146-2179 | `highlightShopPrices`, `.nppBigPrice` |
| Keyboard shortcuts (Alt+1-5) | lines 2180-2210 | `setupKeys`, `MENUS`, `closeAllPanels` |
| Bank balance + NC display | lines 2211-2235 | `setupBank`, `abbrNum`, `updateNc`, `np-bank-drawer` |
| Global event listeners | lines 2236-2310 | `globalListeners`, `document.addEventListener` |
| Account guard (swap detection) | lines 2311-2357 | `accountGuard`, `ACCT_KEYS`, `swapTheme` |
| Auth screen UI stripping | lines 2358-2416 | `stripUi`, `isAuth`, `npp-auth` |
| NC Mall CSS overrides | lines 544-549 | `NC_CSS`, `--np-col-width: 0` |
| Main boot / initialization | lines 2417-2488 | `boot`, `__nppCore`, `data-np-modern-interface` |

## Depends on

- **Vendor script:** "Neopets - Modern Interface" (installed separately, adds `data-np-modern-interface` to `<html>`)
- **GM functions:** `GM_getValue`, `GM_setValue`, `GM_xmlhttpRequest`
- **GM connections:** `impress-2020.openneo.net`, `impress.openneo.net`
- **localStorage keys:** `npqol_*`, `npp_*`, `npp_theme_*`, `npp_acct_*`
- **Other scripts:** `pet-trading-qol` (shares `npqol_qr_data`)

## Don't touch

- The `data-np-modern-interface` attribute check — it waits for the Modern Interface script to claim the page.
- `unsafeWindow` usage for `W.__npApplyAccent`, `W.__npApplyBtnTheme`, `W.__npSideBtns`, `W.appInsightsUserName` — these are internal APIs from the Modern Interface script.
- Account guard swap detection (lines 2305-2325) — complex but must stay; it saves/restores per-account state.
- Auth screen exclusions — the `isAuth` check prevents the patcher from running on login/logout pages.

## Lessons learned

- Account drawer, user card/avatar, and recent/pinned pages have been removed from this patcher and now live in `account-drawer` and `page-pins-qol`. The account-list helpers (`noteAccount`, `allAccts`) stay because the theme picker (share-on-all-accounts) and `accountGuard` still call them.
- The clock lives in the shadow header (`.bar`) and uses `--npp-nav-fg` / `--npp-nav-shadow` from `applyNavContrast()` so it matches the nav links (black on light headers, white on dark).
- `#nppTools` (search + bell) is fixed at the header's top-right: search first, bell farthest right. The clock sits to their left using `--npp-ic` / `--npp-ig`; `#npx-host` gets `.npp-search-open` (and `SHADOW_CSS` hides `.npp-clock`) while the search field is open. Search opens on click only, never on hover.
- The vendor top bar `#npx-host` is z-index 2000 and is appended to `<html>` after `<body>`, so it paints over equal-z-index body elements. `#nppTools` needs `z-index: 2010` to sit on top of the bar; at 2000 it disappears behind it.
- `#npNp` and `#npActivePet` can no longer be folded: `setupFold()` was removed. The daily-notices fold (`setupDailyFold`) still exists.
- The DTI background shuffle uses the Neopets Item Search GraphQL API (`impress-2020.openneo.net`). It filters out event-themed backgrounds (Altador Cup, Advent, Birthday) by default.
- Account state is synced between www.neopets.com and ncmall.neopets.com via `GM_setValue('npp_sync')`. On NC Mall, a 1-year localStorage backoff prevents repeated 403s.
- The patcher injects CSS into the Modern Interface script's shadow DOM (`#npx-host`). The shadow DOM uses its own class names (`.btn`, `.menu`, `.menuHead`, `.npp-search`, etc.) that differ from the main-page styles.
- The final upload is a bundle of this project plus `account-drawer` and `page-pins-qol`: `node bundle.js` writes `dist/Neopets - Modern QOL.user.js`. After any source change, bump `projects/_bundle/00-header.js` `@version` and rebuild; never edit `dist/`.
- Keep each source as its own IIFE in the bundle. Merging them would collide on repeated names (`MODE`, `curUser`, `readAccts`, `$`, `LSget`, `esc`).
- The bundle keeps this project's `@name` / `@namespace`, so Tampermonkey updates the existing patcher entry and preserves GM storage/theme. The combined header must keep `@connect account.neopets.com` for the account drawer.
- Page-pins runs under the bundle's sandbox grants (standalone it is `@grant none`); it uses `unsafeWindow`, so verify recent/pinned data after bundle changes.
- Account drawer `MODE` is detected at mount, not at document-start; `#npUser` does not exist yet then. The boot observer upgrades standalone -> modern. Do not revert to a top-level `MODE` constant.

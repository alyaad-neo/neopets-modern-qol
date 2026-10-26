# NOTES: modern-interface-patcher

Keep this file short. It is the map the agent reads before the agent reads before every task.

## What it does

Runtime patches for the third-party "Neopets - Modern Interface" script. Restyles the header (HUD), sidebar, user card, pet card, background picker, accounts drawer, notifications, and shortcut icons. Handles multi-account switching, theme sync, and bank/NC balance display.

## Type

- Single-file. Edit and upload: `Neopets - Modern Interface PATCHER-4.0.0.js`

## Pages it runs on

- `*://*.neopets.com/*` — all Neopets pages
- `*://ncmall.neopets.com/*` — NC Mall
- Excludes: `www.neopets.com/`, `index.phtml*`, `login*`, `logout*`, `loginpage.phtml*`, `signin*`, `neopass*`

## Feature map

| Feature | File | Search for (function names, CSS classes, button text) |
| --- | --- | --- |
| Background colour picker | lines 930-999 | `injectPicker`, `#nppColors`, `data-preset`, `data-k`, `data-acc` |
| DTI shuffle & keyword search | lines 1001-1254 | `discoverBgs`, `kwSearch`, `#nppShuffle`, `#nppDiscBar`, `dtiPage` |
| Header bar style (blur/tint/solid/none) | lines 686-709 | `applyBarStyle`, `data-npp-bar`, `BAR_CSS` |
| Accent colour contrast | lines 652-663, 897-907 | `applyAccentContrast`, `applyNavContrast`, `--npp-accent-fg` |
| Logo toggle (black/white) | line 684 | `applyLogo`, `--npp-logo-filter`, `nppLogoDot` |
| Shadow DOM header patching | lines 1267-1366 | `patchShadow`, `SHADOW_CSS`, `#menu-premium` |
| Premium dropdown menu | lines 1368-1536 | `setupPremium`, `PREMIUM_ITEMS`, `nativePremium` |
| Shortcut icons & search | lines 1538-1628 | `setupTools`, `#nppTools`, `#nppBellBtn`, `nppSearch` |
| Icon nesting (right-click group) | lines 1630-1791 | `setupNest`, `#nppNestPop`, `#nppNestMenu`, `NEST_KEY` |
| Shortcut icon editor | lines 1793-1846 | `patchEditor`, `EDITOR_CSS`, `decorateEditorNest` |
| Notification drawer | lines 1848-1972 | `wireNotif`, `#nppNotifDrawer`, `#nppBellBtn`, `resolveMail` |
| Bottom footer (clock + notif) | lines 1973-1994 | `buildFooter`, `#nppFoot`, `#nppNst`, `#nppBottom` |
| Account swap & drawer | lines 1996-2200 | `setupAcctDrawer`, `#nppAcctDrawer`, `#nppAcctTab`, `syncNeoPass` |
| User card (logout button, avatar) | lines 2202-2313 | `setupLogout`, `#nppAvatar`, `#npLogoutBtn`, `updateAvatar` |
| Pet card overlay | lines 2315-2418 | `petUI`, `#nppPetInfo`, `#npPetDockBtn`, `renderPetInfo` |
| Fold buttons (collapse cards) | lines 2420-2459 | `setupFold`, `setupDailyFold`, `.nppFold` |
| Scroll-to-top button | lines 2460-2470 | `setupScrollTop`, `#nppTop` |
| Watch list (Shop dropdown) | lines 2472-2511 | `openWatch`, `#nppWatch`, `WATCH_KEY` |
| Shop price highlight (10k/25k) | lines 2513-2532 | `highlightShopPrices`, `.nppBigPrice` |
| Recent / pinned page cards | lines 2534-2695 | `setupRecent`, `#nppRecent`, `#nppPinned`, `RECENT_KEY` |
| Keyboard shortcuts (Alt+1-5) | lines 2697-2721 | `setupKeys`, `MENUS`, `closeAllPanels` |
| Bank balance + NC display | lines 2723-2764 | `setupBank`, `abbrNum`, `updateNc`, `np-bank-drawer` |
| Global event listeners | lines 2766-2815 | `globalListeners`, `document.addEventListener` |
| Account guard (swap detection) | lines 2817-2884 | `accountGuard`, `ACCT_KEYS`, `swapTheme` |
| Auth screen UI stripping | lines 2886-2913 | `stripUi`, `isAuth`, `npp-auth` |
| NC Mall CSS overrides | lines 643-649 | `NC_CSS`, `--np-col-width: 0` |
| Main boot / initialization | lines 2948-3028 | `boot`, `__nppCore`, `data-np-modern-interface` |

## Depends on

- **Vendor script:** "Neopets - Modern Interface" (installed separately, adds `data-np-modern-interface` to `<html>`)
- **GM functions:** `GM_getValue`, `GM_setValue`, `GM_xmlhttpRequest`
- **GM connections:** `impress-2020.openneo.net`, `impress.openneo.net`, `account.neopets.com`
- **localStorage keys:** `npqol_*`, `npp_*`, `npp_theme_*`, `npp_acct_*`, `npp_prof_*`
- **Other scripts:** `page-pins-qol` (shares `npp_recent_pins_v1`), `pet-trading-qol` (shares `npqol_qr_data`)

## Don't touch

- The `data-np-modern-interface` attribute check — it waits for the Modern Interface script to claim the page.
- `unsafeWindow` usage for `W.__npApplyAccent`, `W.__npApplyBtnTheme`, `W.__npSideBtns`, `W.appInsightsUserName` — these are internal APIs from the Modern Interface script.
- Account guard swap detection (lines 2842-2882) — complex but must stay; it saves/restores per-account state.
- Auth screen exclusions — the `isAuth` check prevents the patcher from running on login/logout pages.

## Lessons learned

- The patcher is heavily stripped. Many features (account drawer, pet card, recent/pinned pages, fold buttons, scroll-top, watch list, shop prices, notifications, keyboard shortcuts, bank/NC display, user card, etc.) have been or will be moved to their own projects. Search for `npp_` prefixed localStorage keys to find which features are still live vs. which have been migrated.
- The DTI background shuffle uses the Neopets Item Search GraphQL API (`impress-2020.openneo.net`). It filters out event-themed backgrounds (Altador Cup, Advent, Birthday) by default.
- Account state is synced between www.neopets.com and ncmall.neopets.com via `GM_setValue('npp_sync')`. On NC Mall, a 1-year localStorage backoff prevents repeated 403s.
- The patcher injects CSS into the Modern Interface script's shadow DOM (`#npx-host`). The shadow DOM uses its own class names (`.btn`, `.menu`, `.menuHead`, `.npp-search`, etc.) that differ from the main-page styles.

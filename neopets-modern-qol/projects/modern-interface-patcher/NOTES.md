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
| Background colour picker | lines 832-902 | `injectPicker`, `#nppColors`, `data-preset`, `data-k`, `data-acc` |
| DTI shuffle & keyword search | lines 903-948 | `discoverBgs`, `kwSearch`, `#nppShuffle`, `#nppDiscBar`, `dtiPage` |
| Header bar style (blur/tint/solid/none) | lines 587-612 | `applyBarStyle`, `data-npp-bar`, `BAR_CSS` |
| Accent colour contrast | lines 554-585, 800-831 | `applyAccentContrast`, `applyNavContrast`, `--npp-accent-fg` |
| Logo toggle (black/white) | line 586 | `applyLogo`, `--npp-logo-filter`, `nppLogoDot` |
| Shadow DOM header patching | lines 1169-1355 | `patchShadow`, `SHADOW_CSS`, `#menu-premium` |
| Premium dropdown menu | lines 1356-1455 | `setupPremium`, `PREMIUM_ITEMS`, `nativePremium` |
| Shortcut icons & search | lines 1456-1546 | `setupTools`, `#nppTools`, `#nppBellBtn`, `nppSearch` |
| Icon nesting (right-click group) | lines 1547-1694 | `setupNest`, `#nppNestPop`, `#nppNestMenu`, `NEST_KEY` |
| Shortcut icon editor | lines 1695-1752 | `patchEditor`, `EDITOR_CSS`, `decorateEditorNest` |
| Notification drawer | lines 1753-1874 | `wireNotif`, `#nppNotifDrawer`, `#nppBellBtn`, `resolveMail` |
| Header clock + notification footer | lines 1875-1913 | `setupClock`, `.npp-clock`, `buildFooter`, `#nppNotifDrawer` |
| Account list helpers (kept for picker + guard) | lines 1914-1934 | `noteAccount`, `allAccts`, `readAccts` |
| Pet card overlay | lines 1935-2039 | `petUI`, `#nppPetInfo`, `#npPetDockBtn`, `renderPetInfo` |
| Daily notices fold | lines 2041-2060 | `setupDailyFold`, `.nppFold`, `FOLD_KEY` |
| Scroll-to-top button | lines 2061-2082 | `setupScrollTop`, `#nppTop` |
| Watch list (Shop dropdown) | lines 2083-2114 | `openWatch`, `#nppWatch`, `WATCH_KEY` |
| Shop price highlight (10k/25k) | lines 2115-2148 | `highlightShopPrices`, `.nppBigPrice` |
| Keyboard shortcuts (Alt+1-5) | lines 2149-2179 | `setupKeys`, `MENUS`, `closeAllPanels` |
| Bank balance + NC display | lines 2180-2204 | `setupBank`, `abbrNum`, `updateNc`, `np-bank-drawer` |
| Global event listeners | lines 2205-2279 | `globalListeners`, `document.addEventListener` |
| Account guard (swap detection) | lines 2280-2326 | `accountGuard`, `ACCT_KEYS`, `swapTheme` |
| Auth screen UI stripping | lines 2327-2385 | `stripUi`, `isAuth`, `npp-auth` |
| NC Mall CSS overrides | lines 544-550 | `NC_CSS`, `--np-col-width: 0` |
| Main boot / initialization | lines 2386-2457 | `boot`, `__nppCore`, `data-np-modern-interface` |

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
- The clock lives in the shadow header (`.bar`), right-aligned; it uses `--npp-nav-fg` / `--npp-nav-shadow` from `applyNavContrast()` so it matches the nav links (black on light headers, white on dark).
- `#npNp` and `#npActivePet` can no longer be folded: `setupFold()` was removed. The daily-notices fold (`setupDailyFold`) still exists.
- The DTI background shuffle uses the Neopets Item Search GraphQL API (`impress-2020.openneo.net`). It filters out event-themed backgrounds (Altador Cup, Advent, Birthday) by default.
- Account state is synced between www.neopets.com and ncmall.neopets.com via `GM_setValue('npp_sync')`. On NC Mall, a 1-year localStorage backoff prevents repeated 403s.
- The patcher injects CSS into the Modern Interface script's shadow DOM (`#npx-host`). The shadow DOM uses its own class names (`.btn`, `.menu`, `.menuHead`, `.npp-search`, etc.) that differ from the main-page styles.
- The final upload is a bundle of this project plus `account-drawer` and `page-pins-qol`: `node bundle.js` writes `dist/Neopets - Modern QOL.user.js`. After any source change, bump `projects/_bundle/00-header.js` `@version` and rebuild; never edit `dist/`.
- Keep each source as its own IIFE in the bundle. Merging them would collide on repeated names (`MODE`, `curUser`, `readAccts`, `$`, `LSget`, `esc`).
- The bundle keeps this project's `@name` / `@namespace`, so Tampermonkey updates the existing patcher entry and preserves GM storage/theme. The combined header must keep `@connect account.neopets.com` for the account drawer.
- Page-pins runs under the bundle's sandbox grants (standalone it is `@grant none`); it uses `unsafeWindow`, so verify recent/pinned data after bundle changes.
- Account drawer `MODE` is detected at mount, not at document-start; `#npUser` does not exist yet then. The boot observer upgrades standalone -> modern. Do not revert to a top-level `MODE` constant.

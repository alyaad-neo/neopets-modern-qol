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
| Background colour picker | search | `injectPicker`, `#nppColors`, `data-preset`, `data-k`, `data-acc` |
| Background list: DTI shuffle (auto on first open) & keyword search | search | `discoverBgs`, `kwSearch`, `#nppShuffle`, `#nppDiscBar`, `dtiPage` |
| Header bar style (blur/tint/solid/none) | lines 587-612 | `applyBarStyle`, `data-npp-bar`, `BAR_CSS` |
| Accent colour contrast | lines 553-585, 801-833 | `applyAccentContrast`, `applyNavContrast`, `--npp-accent-fg` |
| Logo toggle (black/white) | line 585 | `applyLogo`, `--npp-logo-filter`, `nppLogoDot` |
| Shadow DOM header patching | lines 1170-1356 | `patchShadow`, `SHADOW_CSS`, `#menu-premium` |
| Premium dropdown menu | lines 1357-1456 | `setupPremium`, `PREMIUM_ITEMS`, `nativePremium` |
| Shortcut icons & search | lines 1457-1576 | `setupTools`, `#nppTools`, `#nppBellBtn`, `nppSearch`, `nppOpen` |
| Icon nesting (right-click group) | lines 1577-1724 | `setupNest`, `#nppNestPop`, `#nppNestMenu`, `NEST_KEY` |
| Shortcut icon editor | lines 1725-1782 | `patchEditor`, `EDITOR_CSS`, `decorateEditorNest` |
| Header clock + notification footer | lines 1905-1944 | `setupClock`, `.npp-clock`, `npp-search-open`, `buildFooter` |
| Account list helpers (kept for picker + guard) | lines 1946-2021 | `noteAccount`, `allAccts`, `readAccts` |
| Pet card overlay | lines 2022-2072 | `petUI`, `#nppPetInfo`, `#npPetDockBtn`, `renderPetInfo` |
| Daily notices fold | lines 2073-2091 | `setupDailyFold`, `.nppFold`, `FOLD_KEY` |
| Scroll-to-top button | lines 2092-2113 | `setupScrollTop`, `#nppTop` |
| Shop price highlight (10k/25k) + shopkeeper 5s click lock | search | `highlightShopPrices`, `.nppBigPrice`, `lockShopkeeper`, `.npp-shop-lock` |
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
- The DTI background shuffle uses the Neopets Item Search GraphQL API (`impress-2020.openneo.net`). It filters out event-themed backgrounds (Altador Cup, Advent, Birthday) by default. It is the only background list since 4.1.33 (the base's full DTI list, favorites and trash are gone). Line numbers in the feature map are stale after the comment strip; search instead.
- Account state is synced between www.neopets.com and ncmall.neopets.com via `GM_setValue('npp_sync')`. On NC Mall, a 1-year localStorage backoff prevents repeated 403s.
- The patcher injects CSS into the Modern Interface script's shadow DOM (`#npx-host`). The shadow DOM uses its own class names (`.btn`, `.menu`, `.menuHead`, `.npp-search`, etc.) that differ from the main-page styles.
- The final upload is a bundle of this project plus `account-drawer` and `page-pins-qol`: `node bundle.js` writes `dist/Neopets - Modern QOL.user.js`. After any source change, bump `projects/_bundle/00-header.js` `@version` and rebuild; never edit `dist/`.
- Keep each source as its own IIFE in the bundle. Merging them would collide on repeated names (`MODE`, `curUser`, `readAccts`, `$`, `LSget`, `esc`).
- The bundle keeps this project's `@name` / `@namespace`, so Tampermonkey updates the existing patcher entry and preserves GM storage/theme. The combined header must keep `@connect account.neopets.com` for the account drawer.
- Page-pins runs under the bundle's sandbox grants (standalone it is `@grant none`); it uses `unsafeWindow`, so verify recent/pinned data after bundle changes.
- Account drawer `MODE` is detected at mount, not at document-start; `#npUser` does not exist yet then. The boot observer upgrades standalone -> modern. Do not revert to a top-level `MODE` constant.
- Premium menu: `onMainAcct()` trims it to Premium + Labs & Bank on side accounts; pointerenter rebuilds it when the result changes (username loads late).
- Responsive layout (LAYOUT_CSS, layoutSidebar, setupDrawer, buildNav): desktop >1100px = fixed 240px sidebar; <=1100px (tablet + mobile) = off-canvas drawer (hamburger #nppMenuBtn, #nppScrim backdrop, #nppDrawerClose, Esc/backdrop close, --np-col-width 0 so content is full width); <=1000px the header nav hides and moves into the drawer as #nppNavMod (built from the shadow menus). Header: logo+tools only, clock hidden <=1100px.
- Sidebar is one scroll column: #npHud now also holds #nppFoot (pins/recent) and the new #nppIcons module (the old #btnOverlay icon column, moved inside it; nested icons open as an inline drawer on click). Short windows: pet image scales with height (30vh, min 84px), paddings shrink at <=820px and <=640px tall; the column scrolls internally. Collapse state key: npp_side_icons_v1.
- Round 2: header nav stays inline down to 641px (labels become icons <=950px, tighter <=820px) and moves into the drawer only at <=640px. #nppIcons is now plain icons at the very bottom of the sidebar (no card/header); nested icons open as an upward fan-out tray anchored to the icon (--tx caret, staggered pop, reduced-motion safe). NP/NC are two equal pills (icon + value + NP/NC tag). Pins/Recent are one #nppPinsMod with tabs (key npp_pins_tab_v1), list max-height clamp(84px,24vh,220px).
- Round 3: Pins/Recent opens on Pinned if any pins exist, else Recent (tab choice is session-only); lists show 3 rows (28px each) and scroll, max 10 entries. NP/NC pills are 2 equal grid cells (16px icon, 14px value, no tag) sized for "200M"/"2.1B". Avatar and name share grid row 1. Foot is position:relative in the hud flow and shortcuts come last (no overlap).
- Round 4: pet-swap dock (#qrDock) restyled in LAYOUT_CSS: 120px min strips, always-visible name over a bottom gradient, dark-pill Make Active + injected .nppPetPage (https://www.neopets.com/~Name) buttons on hover/focus/tap (.nppTap) or always on touch/<=640px; scrollbar hidden. Markup (.qrPet/.qrPetName/.qrOverlay) is vendor-owned and unverified.

- layoutSidebar keeps #nppNavMod after #nppListsMod (account-drawer widget); user card restyled compact with quiet Log Out / Swap buttons.
- v4.1 unified panel: #npHud is one glass panel on desktop (>1100px) with hairline-divided sections (flex order: user, NP/NC strip, hero pet, accounts/pets nav, pins, icons). Override block sits before the pet-swap dock in LAYOUT_CSS, selectors prefixed #npHud to beat later media rules. Account-drawer sets #npUser[data-main] for the MAIN badge; Log Out/Swap are icon-only. #nppIcons: nested links open on hover/focus (canHover) with 340ms close delay; click follows the parent href; touch keeps tap-to-open. The white .nppHasNest bar was removed. Not visually verified on live Neopets.
- v4.1.1: the full-panel glass slab and hairline dividers were removed (user disliked them). #npHud has no background; only #npNp, #nppListsMod and #npActivePet get a light translucent surface (--pn-surf, radius --pn-r). Pet image is a fixed-height cover frame (clamp(120px,24vh,190px), also in PET_IMG_STYLE). Pins list max 3 rows; icons follow content (no margin-top:auto).
- v4.1.2: sidebar sections are identical frosted cards (rgba(18,16,28,.62), blur 18px, radius 16, 10px gaps; user, NP/NC, pet, nav, #nppFoot pins); no text-shadows. #nppIcons has no card and is sticky at the bottom (margin-top:auto). Pet image 170px contain on radial highlight (also in PET_IMG_STYLE). npp-pre early style (document-start) hides the sidebar until boot.
- LAYOUT_CSS is wrapped in a nested `html[data-np-modern-interface] { ... }` block. Inside it, root-class selectors MUST use `&.class` (e.g. `&.npp-side-light #npHud`). Writing `html.npp-side-light ...` there becomes "html inside html" and never matches; that was why sidebar light mode did nothing before 4.1.10.
- Sidebar font sizes/weights, header text shadows and the edge-to-edge pet image live in one block at the end of LAYOUT_CSS: search `sidebar type scale`.
- The pet image size is set by an INLINE `!important` style (`PET_IMG_STYLE`, re-applied by `fixPetImg` every 1.5s and on mutation). Stylesheet rules for `#npActivePet > img` size/margin/radius cannot win; change `PET_IMG_STYLE` instead.
- Light-mode overrides need at least as many IDs as the dark rule they beat (e.g. `#npHud #npUser #npUserTitle` is 3 IDs). The 4.1.11 `top half tidy` block uses shared pill vars `--npp-pill-h/-r/-bg/-bg-h` for the user, Accounts/Pets and NP/NC cards.

- 4.1.12: the NP/NC bank drawer and chevron are gone; `setupBank` now adds a round `.np-bank` chip (link to bank.phtml, icon cloned from the nav if present, else inline SVG). `#npBank` stays hidden by CSS. The NP card overlaps the user card by 12px (negative margin plus extra #npUser bottom padding).
- 4.1.13 (round 6): NP/NC/Bank strip is ONE pill on `.np-amounts` (segments are transparent `a` children, dividers via `a + a`); no real Neopets bank icon URL exists on the static CDN (`bank-icon.png` is the NP shield), so the bank segment is an inline SVG and the nav Bank entry can't be fixed. Pet meta band = chips/links as two flex items with negative side margins + `order`.
- 4.1.14 (round 7): pet name/sub/copy overlay the image: `.nppTitle` is absolute inside `#npActivePet`, so `#nppPetInfo` must be `position: static` (it was relative and would capture it). Height comes from `--npp-img-h` set in `fixPetImg` (ResizeObserver); name tone class `npp-name-dark/light` from a canvas sample. Give flex-column cards with side margins an explicit `width: calc(100% - 24px)` instead of relying on stretch. Edit old round rules in place instead of stacking overrides.

- 4.1.18: pet-name tone now fetches the image via GM_xmlhttpRequest blob (no CORS), failure defaults to light; stats panel centred, light-mode colours.
- 4.1.21: JellyNeo price popup = separate IIFE at the top of the file (before the main one, which bails off neopets.com). Click on a.iph-icon--jellyneo (from a browser extension, item panels on shops) opens window nppJN at the mouse. On items.jellyneo.net with window.name nppJN it overlays #nppJnCard with a clone of the first result p (img.item-result-image, name, a.price-history-link), resizes to fit, closes on x / Esc / blur. Needs @match items.jellyneo.net.
- 4.1.22: JellyNeo popup also closed from the opener (closeJn on window focus / pointerdown), so it works even if the script is not running on JellyNeo.
- 4.1.24: watch list removed. Patcher bell + notification drawer removed (no more neomessages fetch); the Modern Interface's own bell/.bellMenu is shown again. Shop price highlight reads .item-img[data-price] and enlarges the "Cost:" .item-stock line. Shopkeeper image .shop-bg ignores clicks for 5s after page load (performance.now).
- 4.1.25: vendor header .right holds #npxSearchToggle, #npxSearch, #npxNst, #npxBell, #npxNews; .bellMenu is a direct child of the shadow root. SHADOW_CSS shows .right as display:contents with only #npxBell, absolutely placed in the far-right slot; #nppTools (search) moved one icon slot left.
- 4.1.26: vendor .right hidden again (vendor bell replaced Neopets' list with its own + fetched /nf.phtml). setupBell: modern pages move Neopets' .nav-bell-icon__2020 + #navnewsdropdown__2020 (dot #NavAlertsNotif, list #alertstab__2020) out of the hidden #navtop__2020 into #nppBell (fixed, far-right slot). Retired pages: #nppBell is a link to /allevents.phtml, red dot + title from td.eventIcon. muteVendorAlerts seeds sessionStorage npqol_notifs_v2 with t 9e15 so the vendor's bellNotif never fetches (also re-seeded in clearNotifCaches).
- 4.1.27: header dropdowns (.menu in SHADOW_CSS) are frosted: .menu::before is now a blurred --npLeftBarImg layer (inset -24px, clip-path back to the menu radius, z-index -1; .menu's backdrop-filter makes the stacking context). It used to be the 6px hover bridge; .btn.cat::before still bridges. Links 21px, icons 28px, strong text-shadow + icon drop-shadow.
- 4.1.28: #menu-premium scrolls, so its ::before is off and a sibling .npp-prembg (inserted before it, synced in csync with the caret: position, z-index, offset box) carries the frosted image. .np-menu-edit-btn is now a full-width "Edit links" / "Done editing" text row, always moved to the menu's last child by ensure().
- 4.1.32: sidebar CSS deduped by cascade (tools/css-dedupe.js). Every remaining #npHud declaration in PAGE/LAYOUT_CSS can win somewhere. Rules for #npActivePet > img were removed wherever PET_IMG_STYLE sets the same property inline; to change the pet image, edit PET_IMG_STYLE.

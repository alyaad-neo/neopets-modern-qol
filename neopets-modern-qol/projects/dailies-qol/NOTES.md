# NOTES: dailies-qol

Keep this file short. It is the map the agent reads before every task.

## What it does

Tracks cooldowns for Neopets premium daily activities (Wheels, Kiosks, etc.), monitors Snowager sleep states, fetches Symol Hole and Tarla's Toolbar prize windows from JellyNeo, shows a floating dailies panel (standalone) or sidebar card (Modern Interface mode), and provides a Qasalan Expellibox result overlay.

## Type

- Single-file source, bundled into `dist/Neopets - Modern QOL.user.js` by `node bundle.js`. Do not upload it separately.

## Pages it runs on

- `*://*.neopets.com/*` — all Neopets pages
- `*://ncmall.neopets.com/*` — Neopets Mall (for Qasalan Expellibox)

## Feature map

| Feature | File | Search for (function names, CSS classes, button text) |
| --- | --- | --- |
| Premium daily cooldowns (time remaining) | Lines 36-79 | `PREMIUM_CD`, `cdLeft`, `cdText`, `cdSet`, `cdLoad` |
| Snowager sleep states | Lines 82-97 | `snowagerState`, `snowBadge`, `snowRowHTML`, `SNOW_HOURS` |
| JellyNeo fetch for Symol Hole / Tarla windows | Lines 103-143 | `symolEnsure`, `parseSymol`, `parseTarla`, `parseAlertWindow` |
| Qasalan Expellibox panel overlay | Lines 145-241 | `qasalanPanel`, `qasalanVerdict`, `parseGiveaway`, `QAS_CSS` |
| "Done" detection on daily pages | Lines 243-316 | `watchDaily`, `SUCCESS_RE`, `ALREADY_RE`, `DAILY_PATHS` |
| Premium menu decoration (CD badges, alerts) | Lines 318-382 | `decoratePremium`, `undecoratePremium`, `refreshCd`, `syncAlerts`, `updateSnow` |
| Sidebar card (modern-qol mode, `NQ.base`) | Lines 528-566 | `sidebarDailyCard`, `dailyModel`, `hero` |
| Standalone floating dailies panel | Lines 490-526 | `mountStandalonePanel`, `nqDailiesRoot`, `nqDailiesToggle` |
| NC Mall cooldown sync | Lines 147-164 | `ncShare`, `ncPull` |
| API for modern-qol | search `NQ.dailies =` | `NQ.dailies`, `onCard` |

## Depends on

- `modern-qol` (`NQ.base`, read when the panel mounts)
- `@grant GM_getValue`, `@grant GM_setValue`, `@grant GM_xmlhttpRequest`
- `@connect www.jellyneo.net`, `@connect ncmall.neopets.com`
- localStorage keys: `nq_cd_v1`, `nq_cd_seen_v1`, `nq_ack_v1`, `nq_symol_v1`, `nq_symol_try`, `nq_symol_status`, `nq_tarla_v1`, `nq_nc_cd`

## Don't touch

- `onMain()` gates mount, the observer, `decoratePremium` and `updateSnow`: only the main account (`nq_main_account`) gets dailies. Side accounts see nothing and record no cooldowns. Mount waits for `appInsightsUserName` via `whenUser()`; until then `onMain()` is false.

- modern-qol mode is `NQ.base` (set by modern-qol before this script runs).
- `NQ.dailies` is read by modern-qol (Premium menu, daily card fold via `onCard`). Keep it in sync if adding features.
- The `nq-dailies-css` `<style>` is appended at load, between modern-qol's base sheets and its `#nq-css`; the bundle order depends on that.
- Popup detection (`isPopup`) skips modals/iframes — do not remove.

## Lessons learned

<!-- Short notes the agent adds when something tricky comes up. Newest first. -->

- 1.0.6: Trudy's Surprise is marked done (NST cooldown) on visiting trudys_surprise.phtml. Its prizes are drawn in the game canvas, so SUCCESS_RE and the button-click listener never saw a play.
- 1.0.1: renderSidebar writes into #nqDaily > .nqDBody, never #nqDaily itself, because innerHTML on the card wiped the patcher eye/fold button every time the countdown text changed (eye flickered in and out).
- 1.0.2: whenUser() returns at once on /games/giveaway (bare text page, no appInsightsUserName), so the Expellibox panel no longer waits the full 10s poll.
- 1.0.3: Expellibox links open a small popup (qasPopupLinks, composedPath for the shadow-root menu); dailies runs in popups only on /games/giveaway, panel gets .pop (fills window, resizeBy to fit, Close/Inventory buttons). Panel keyframes are nqQasIn and keep translate(-50%,-50%); the shared nqIn ended at transform:none, so the panel started off-centre then snapped to the middle.
- 1.0.4: Expellibox result page hides the Modern Interface chrome (#nq-host, #nqHud, #nqFoot, #nqBgSidebar, #btnOverlay, #nqSideBtnHost) inside QAS_CSS; panel centres at left 50%.
- 1.0.5: qasPopupLinks keeps the popup ref (qp) and closes it on focus/pointerdown back on the opener page.

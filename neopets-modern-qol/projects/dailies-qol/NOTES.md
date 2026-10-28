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
| Sidebar card (Modern Interface mode) | Lines 528-566 | `sidebarDailyCard`, `dailyModel`, `hero` |
| Standalone floating dailies panel | Lines 490-526 | `mountStandalonePanel`, `nppDailiesRoot`, `nppDailiesToggle` |
| NC Mall cooldown sync | Lines 147-164 | `ncShare`, `ncPull` |
| Public API for core | Lines 577-585 | `__nppDailies` |

## Depends on

- Modern Interface script (`data-np-modern-interface` attribute on `<html>`)
- `@grant GM_getValue`, `@grant GM_setValue`, `@grant GM_xmlhttpRequest`
- `@connect www.jellyneo.net`, `@connect ncmall.neopets.com`
- localStorage keys: `npp_cd_v1`, `npp_cd_seen_v1`, `npp_ack_v1`, `npp_symol_v1`, `npp_symol_try`, `npp_symol_status`, `npp_tarla_v1`, `npp_nc_cd`

## Don't touch

- `onMain()` gates mount, the observer, `decoratePremium` and `updateSnow`: only the main account (`npp_main_account`) gets dailies. Side accounts see nothing and record no cooldowns. Mount waits for `appInsightsUserName` via `whenUser()`; until then `onMain()` is false.

- `isModernInterface()` checks `root.dataset.npModernInterface === '1'` — do not change this detection.
- `W.__nppDailies` is a public API consumed by the core. Keep it in sync if adding features.
- Popup detection (`isPopup`) skips modals/iframes — do not remove.

## Lessons learned

<!-- Short notes the agent adds when something tricky comes up. Newest first. -->

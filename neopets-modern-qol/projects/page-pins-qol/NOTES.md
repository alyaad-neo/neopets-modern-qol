# NOTES: page-pins-qol

Keep this file short. It is the map the agent reads before every task.

## What it does

Tracks recently viewed pages and lets the user pin pages. Works alongside the Modern Interface patcher (sidebar cards in the footer) or standalone (floating "Recent" button with panel).

## Type

- Single-file. Edit and upload: `Neopets - Recently Viewed + Pin Pages-1.0.0.js`

## Pages it runs on

- `*://*.neopets.com/*` — excluded: root, index, login/logout, neopass, signin

## Feature map

| Feature | File | Search for (function names, CSS classes, button text) |
| --- | --- | --- |
| CSS styles | lines 53–85 | `#nppRecent`, `#nppPinned`, `.rList`, `.rPin`, `#nppStandaloneRecent` |
| Constants | lines 42–48 | `RECENT_KEY`, `PIN_KEY_OLD`, `BOARD_NAMES_KEY`, `RECENT_MAX` (15), `PIN_SVG`, `PIN_ICON` |
| Storage helpers | lines 91–102 | `readAccts`, `pinKey`, `migratePins`, `loadPins` (per-account) |
| Label logic | lines 105–146 | `boardNames`, `boardName`, `labelFromUrl`, `headingLabel`, `pageLabel`, `recentLabel` |
| Record visit + pin | lines 149–186 | `recordVisit`, `pinKeyOf`, `pinMatches`, `togglePin`, `pinItems` |
| Card rendering | lines 189–242 | `makeCard`, `rowsHtml`, `setList`, `paintPinned`, `paintRecent`, `refreshCards` |
| Sidebar cards mount | lines 250–275 | `mountSidebarCards`, `#nppFoot`, `#nppRecent`, `#nppPinned` |
| Standalone panel mount | lines 278–328 | `mountStandalone`, `#nppStandaloneRecent`, `#nppStandaloneRecentToggle`, `#nppStandaloneRecentPanel` |
| Boot + recordVisit timers | lines 331–357 | `mount`, `[1500, 4000, 8000]`, `npp:main`, `neopetsResetPins` |

## Depends on

- `localStorage` keys: `npp_recent_v3` (history), `npp_recent_pins_v1:<user>` (per-account pins), `npp_board_names_v1` (neoboard labels)
- `unsafeWindow` — exposes `neopetsResetPins` console helper
- `#nppFoot` (Modern Interface core footer) or `#npLeftBar` sidebar for sidebar mode
- `npp:main` event from account-drawer to refresh cards on account switch

## Don't touch

- `GENERIC_NB` regex (line 46): filters out generic neoboard labels from recent list.
- `pinKey()` (line 94): per-account pin storage — do not change the key format.
- `migratePins()` (lines 96–101): one-time migration from old shared pin list to per-account.
- `recordVisit` timing (line 341): 1.5s / 4s / 8s — matches the core's old recording cadence.

## Lessons learned

- `#nppPinned` has its own gold tint, border and inset left bar so it reads differently from `#nppRecent`.
- The patcher's footer clock moved to the header, so `#nppBottom` no longer exists; the cards just append to `#nppFoot`.

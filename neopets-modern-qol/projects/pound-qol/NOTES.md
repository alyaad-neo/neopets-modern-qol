# NOTES: pound-qol

Keep this file short. It is the map the agent reads before every task.

## What it does

Neopets Pound helper: modernizes the layout to a 3-column card grid, adds a "Show more Neopets" button, search header, pet card chips (Painted / Well named / New), visited pet purple names, a report row, and an Adopt button.

## Type

- Single-file. Edit and upload: `Neopets - Pound Tweaks-1.0.0.js`

## Pages it runs on

- `*://*.neopets.com/pound` — pet listing/selection pages
- `*://*.neopets.com/transfer` — pet transfer pages

## Feature map

| Feature | File | Search for (function names, CSS classes, button text) |
| --- | --- | --- |
| SVG icons | lines 32–36 | `CHEV`, `REFRESH_ICON`, `ARROW_ICON`, `COPY_SVG`, `CHECK_SVG` |
| CSS styles | lines 39–139 | `#nppPoundRefresh`, `.nppPoundChips`, `.nppPoundChip`, `.nppPetName`, `.nppReportRow`, `#nppAdoptBtn`, `#pet0/1/2` |
| Storage constants | lines 151–154 | `SEEN_PETS_KEY`, `SEEN_PETS_MAX` (5000), `VISITED_KEY`, `VISITED_MAX` (5000) |
| Seen/visited pets | lines 156–181 | `seenPetsLoad/Save/Check`, `visitedLoad/Save/Has/Add`, `_seenCache`, `_visCache` |
| Well-named detection | lines 184–204 | `COMMON_TRIPLES`, `KEYBOARD_RUNS`, `isWellNamed`, `looksLikePetName`, `petNameFrom` |
| Show more Neopets button | lines 220–241 | `poundPlace`, `poundReload`, `#nppPoundRefresh`, "view more neopets" |
| Search header | lines 254–282 | `tagSearch`, `#search_name`, `.nppSearchWrap`, `.nppSearchGo` |
| Pet card chips | lines 283–289 | `updateChips`, `.nppPoundChip.painted`, `.nppPoundChip.well`, `.nppPoundChip.new` |
| Adopt button | lines 242–253, 290–295 | `placeAdopt`, `#nppAdoptBtn`, `syncAdopt`, `#processAdoptBtn` |
| Pet name tagging | lines 310–355 | `tagPetNames`, `.nppPetName.visited`, `nppPainted`, `.nppPoundCopy` |
| Report row | lines 356–375 | `tagReportRow`, `.nppReportRow`, `.nppRepItem`, `input[value="Report!"]` |
| Layout & header | lines 296–309 | `layoutPoundHeader`, `.contentModuleHeader`, `.nppHeadInner` |
| Copy "!p name" | lines 378–387 | `.nppPoundCopy`, `copyPlain` |
| Boot & observers | lines 389–410 | `retagNow`, `MutationObserver`, "view more neopets" click handler |
| Petlookup visit recording | lines 413–428 | `visitedAdd`, `petlookup.phtml` |
| Console helpers | lines 331, 431 | `nppResetSeenPets` |

## Depends on

- `localStorage` keys: `npp_seen_pets_v1` (seen pet names), `npp_visited_pets_v1` (visited pet names)
- `unsafeWindow` — exposes `nppResetSeenPets` console helper; reads `__npBtnIconUrl` / `__npGetBtnTheme` for search icon
- Classic Neopets pound page structure: `#pet0/1/2`, `.contentModule`, `.contentModuleHeader`, `input[value="Report!"]`, `#processAdoptBtn`

## Don't touch

- `BASIC_COLOURS` (line 149): `['green', 'blue', 'red', 'yellow']` — used to detect Painted pets.
- `isWellNamed` (lines 191–204): strict capitalised name detection with keyboard-run and vowel ratio checks.
- `COMMON_TRIPLES` (line 184): allowed consonant triples for well-named detection.
- `KEYBOARD_RUNS` (line 185): keyboard pattern disqualifiers (e.g. 'qwe', 'asd').
- Search icon fallback URL (line 211): `https://images.neopets.com/themes/h5/basic/images/v3/search-icon.svg`

## Lessons learned

<!-- Add notes here as they come up. -->

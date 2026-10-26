# NOTES: pet-trading-qol

Keep this file short. It is the map the agent reads before every task.

## What it does

A single-panel helper for Neopets Pet Trading boards and the Pet Auction House (PAH). It manages a tradelist of pets you own, generates PAH listing/bid posts, parses incoming bids from the board, tracks acceptances and trades, and logs a trade history. Nothing is ever submitted for the user.

## Type

- Single-file. Edit and upload: `Neopets - Pet Trading Helper-4.3.0.js`

## Pages it runs on

- `*://www.neopets.com/neoboards/*` — Pet Trading neoboards (UFT tradelist)
- `*://neopets.com/neoboards/*` — Pet Trading neoboards (no www)

## Feature map

| Feature | File | Search for (function names, CSS classes, button text) |
| --- | --- | --- |
| Userscript header + version | Lines 1-11 | `@name`, `@version` |
| Constants (species, colours, ticks, rulesets) | Lines 18-60 | `SPECIES`, `COLOURS`, `STATS`, `TICKS`, `RULESETS` |
| Pet line parsers (Quickref/pot text) | Lines 62-162 | `parseTags`, `parsePetLine`, `parseOffer`, `parsePotText`, `importPotText` |
| Name type detection (RW/RN/MS/WN/2L/3L/4L) | Lines 257-327 | `nameTypes`, `phon`, `msEdits`, `NT_SETS`, `NT_CACHE`, `NT_DATA` |
| CSS styles | Lines 329-679 | `#pahh-root`, `.ph-pet`, `.ph-card`, `.ph-btn` |
| State store (GM_setValue + localStorage fallback) | Lines 682-746 | `defaults`, `normalize`, `load`, `save`, `KEY` |
| Helpers (nfReason, matchOk, bidFlag, passFor, avatar) | Lines 748-862 | `nfReason`, `matchOk`, `bidFlag`, `refreshDerived`, `passFor` |
| PAH listing formats per ruleset | Lines 864-943 | `RULE_INFO`, `variationListing`, `listingText`, `buildPost` |
| Bid parsing from board text | Lines 967-1063 | `parseBidPosts`, `parseAccepts`, `postSources`, `ingestSources` |
| Board detection (game type, pot link, end time) | Lines 1071-1173 | `guessRuleset`, `boardInfo`, `detect`, `timerText` |
| Panel shell (launcher button, panel, toast) | Lines 1175-1206 | `#pahh-btn`, `#pahh-panel`, `#pahh-toast` |
| My pets tab (add, edit, delete, filter, categories) | Lines 1208-1291 | `petsBody`, `petRow`, `editorHtml`, `managePanel` |
| PAH listing step (pick pets, reorder, generate text) | Lines 1350-1365 | `listStep` |
| PAH bidding step (pick pot pets, pick offers) | Lines 1379-1411 | `bidWant`, `bidOffer`, `bidCheck`, `bidText` |
| PAH choose step (read board, accept/pass bids) | Lines 1413-1456 | `petCard`, `chooseStep`, `rankBids`, `bidsOn` |
| PAH trade step (mark done, track problems) | Lines 1458-1485 | `tradeStep`, `logTrade` |
| History/trade journal tab | Lines 1489-1510 | `historyBody`, `fmtDay` |
| Render engine | Lines 1522-1556 | `render`, `commit` |
| Action handlers (data-act dispatch) | Lines 1560-1805 | `ACT`, `run` |
| Event listeners + board detection loop | Lines 1827-1899 | `panel.addEventListener`, `updateVisibility`, `MutationObserver` |

## Depends on

- `GM_getValue` / `GM_setValue` (Tampermonkey storage). Falls back to `localStorage`.
- Neopets pet image URL pattern: `https://pets.neopets.com/cpn/${name}/1/4.png`
- Neopets board HTML: posts have `[class*="post"]` containers, userlookup links have `href*="userlookup"`
- Board ID `34` for Pet Trading detection

## Don't touch

- `NT_DATA` (lines 255-256): base64-compressed name type word lists. Decoded lazily.
- `PHF` (line 254): inline inflate/deflate library for the compressed data.
- `AV_OK` / `AV_BAD` (line 891): sets that cache which pet images loaded/failed to avoid flicker.
- The guard `if (document.getElementById('pahh-root')) return;` (line 16) prevents duplicate panels.

## Lessons learned

- The script uses `pageText()` (line 102) to walk DOM text content, avoiding Neopets' JS-rendered elements.
- Board detection looks for board link with `board=34` or title containing "pet trading".
- NST (Neopets Standard Time) is computed via `Intl.DateTimeFormat` with `America/Los_Angeles`.
- The 5-minute bid window: only listed pets with no valid forcing bids can bid during the last 5 minutes.
- Name type detection uses phonetic matching + edit-distance respelling to classify pet names as RW/RN/MS/WN.

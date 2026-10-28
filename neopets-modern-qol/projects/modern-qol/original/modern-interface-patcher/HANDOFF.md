# HANDOFF: Modern QOL bundle (updated 2026-10-27)

Read this first in a new chat. Then read AGENTS.md ("Lessons learned" section).

## State

- Upload file: `dist/Neopets - Modern QOL.user.js`, bundle `@version 5.4.34` (patcher 4.1.28, account-drawer 1.3.19, page-pins 1.0.6). Built by `node bundle.js` from 4 projects, in order: `dailies-qol`, `modern-interface-patcher`, `account-drawer`, `page-pins-qol`.
- Git: last pushed commit `c938592` (5.3.3). Local unpushed commits up to `36e8c4c` (5.3.4). **Everything from 5.3.5 to 5.4.19 is uncommitted.** Ask Aly before committing; commit before starting big new work.
- Nothing after ~5.3.0 has been verified in a browser by an agent. Aly tests and sends screenshots.
- Token rules: read AGENTS.md "Token budget" first. Keep this chat short; small edits inline; haiku/sonnet agents only for multi-step work.

## Done and working (per Aly)

- Dailies bundled in and shown only on the main account (`npp_main_account`). Premium-menu dailies trimmed on side accounts (`onMainAcct()`).
- Pins overlap fix: pins mount waits for `#nppFoot`; `layoutSidebar` waits for `#npHud` (`hudWait`).
- All Pets (account-drawer): passive tracker, ZERO page requests. Data `npp_allpets_v1`, tags `npp_allpets_tags_v1`. Duplicates fixed in 1.3.12 (`apDedupe`: a pet name lives under the most recently collected account only). 1.3.16: apCollect skips saving when half or more of the collected pets belong to another account (stale `npqol_qr_data` snapshot after a swap would otherwise let apDedupe steal them), unless the live home carousel confirms them; one local collect pass on every page load again. 1.3.17: apDedupe never deletes across accounts; data mirrored to localStorage backup; footer Delete data button. 1.3.18: per-pet delete, per-account delete/block in the Accounts popup, unblock pills in footer.
- Sidebar light mode works (4.1.10: nested-CSS `&.npp-side-light` fix).

## Sidebar layout now (5.4.19)

- All sidebar CSS overrides live at the END of `LAYOUT_CSS` in labelled blocks: "sidebar type scale", "top half tidy 4.1.11", "sidebar round 5/6/7". Edit these in place; don't add new override blocks.
- User card -> NP/NC/Bank segmented strip (half overlaps the card bottom) -> Accounts / All Pets tiles (white in light mode, no counts) -> pet card (image full-bleed via inline `PET_IMG_STYLE`; name over the image bottom-left, hover shows subtitle pill above it + copy button; Lv/age + eye/edit/stats strip under the image; stats panel) -> Recent/Pinned (left-aligned, pin shows on hover).
- Pet name colour: `npp_pet_tone_v1` localStorage cache (shared by patcher + account-drawer). Image fetched via GM_xmlhttpRequest blob (needs `@connect pets.neopets.com`, `images.neopets.com`), 48px canvas, corners all >=240 => black name, else white + shadow; pending names hidden, 3s timeout -> white.
- Bank: drawer removed; strip has a Bank link with an inline SVG icon. No real Neopets bank icon URL exists (~40 probed). The nav's own Bank entry shows a shop icon from Neopets itself; fix only if Aly supplies a real icon URL.
- Accounts drawer: X removes any saved account except the current one (also its All Pets data). Accounts drawer + All Pets window follow the dark/light toggle.
- All Pets window: title "All Pets" (30px CafeteriaBlack), Active + UFT/Permie/Maybe badges top-right of image, pet name white CafeteriaBlack (black on plain-white images), names link to petlookup/userlookup (links only, never fetch userlookup). Copied trade list has no "(username)".

## Open / unverified (start here)

1. Aly to confirm on Neopets 5.4.19: the two strips (NP/NC/Bank under username; Lv/age under pet image) are no longer broken/gapped; name colour speed; stats panel centring in light mode; Cafeteria font on All Pets names.
2. If any strip is still wrong: ask for a screenshot + DevTools computed style of that element BEFORE editing.
3. Possible stale scripts: always confirm the Tampermonkey version first if a report doesn't match the code.

## Page and data facts (verified from Aly's console output)

- `localStorage.npqol_qr_data` = `{ts, data:{pets:[{name, sci:'', actions:[…], isActive}], active:{name, colour, species, gender, level…}}}`. Only the active pet has colour/species.
- The patcher swaps per-account localStorage keys on an account change (`ACCT_KEYS`, which includes `npqol_qr_data`), so right after a swap the Quick Ref data is the new account's OLD snapshot.
- `/home/` carousel: `.hp-carousel-pet` and `.hp-carousel-nameplate` carry `data-name`, `data-species`, `data-color`, `data-gender`, `data-level`, `data-active`, `data-petimage`. Slides can be `slick-cloned` duplicates.
- `quickref.phtml` redirects to `/home/`. The home page `petCare*` popup and the pound page's `petN_table` are NOT the user's pets.
- Crisp pet image: `https://pets.neopets.com/cpn/<Name>/1/7.png` (600px). Dock `.qrPet` has `data-bg` and `data-name`.
- `userlookup.phtml` shows a captcha. NEVER fetch it from scripts (ban risk; Aly's #1 priority is safety).
- The vendor Modern Interface script is NOT in `vendor/` (only a README). Its markup is unseen; ask Aly for HTML via console snippets.
4. Dailies (5.4.23): eye flicker fixed. STILL OPEN, waiting on Aly console output: move #nppDaily smaller + anchored right above the quick icons (no overlap when the window is short); premium dropdown shows every daily as available; Expellibox styling works; 5.4.24 removed its 10s delay. 5.4.25 (dailies 1.0.3): Expellibox opens in a small popup sized to the result panel; panel no longer jumps (own keyframes). 5.4.26: Expellibox page hides header/sidebar; JellyNeo icon on item panels opens a small price popup at the mouse (patcher top IIFE). 5.4.27: both popups close when Aly clicks back on Neopets. JN price confirmed correct by Aly. 5.4.28: card drops the JN checkbox (input, empty label). Unverified. Light-mode Recent/Pinned rows, pet link buttons now white; .rEmpty dark in light mode.

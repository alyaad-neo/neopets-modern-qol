# NOTES: account-drawer

Keep this file short. It is the map the agent reads before every task.

## What it does

Neopets account switcher: lists your accounts in a draggable drawer, lets you pick a main account (☆), syncs accounts from NeoPass, and swaps sessions. Works alongside the Modern Interface patcher (modern mode) or standalone (floating button).

## Type

- Single-file. Edit and upload: `Neopets - Accounts Drawer-1.0.0.js`

## Pages it runs on

- `*://*.neopets.com/*` — excluded: root, index, login/logout, neopass, signin, popup pages, ncmall

## Feature map

| Feature | File | Search for (function names, CSS classes, button text) |
| --- | --- | --- |
| CSS styles | lines 62–145 | `#nqAcctDrawer`, `#nqAcctTab`, `#nqAvatar`, `#nqLogoutBtn`, `#nqSwapBtn` |
| Storage keys/constants | lines 46–51 | `MAIN_KEY`, `ACCTS_KEY`, `MAN_KEY`, `NP_KEY`, `PROF_KEY`, `DIRTY_KEY` |
| Account list helpers | lines 154–172 | `readAccts`, `writeAccts`, `noteAccount`, `seenAccounts`, `readNP`, `readManual`, `allAccts` |
| Avatar cache | lines 175 | `readProf` |
| NeoPass sync | lines 178–206 | `parseNeoPass`, `neoPassFetch`, `syncNeoPass` |
| Swap session | lines 209–234 | `swapAccount` |
| Drawer build/wire | lines 244–400 | `buildDrawer`, `wireDrawer`, `nqAcctRow`, `nqAcctStar`, `nqAcctX` |
| Modern mode mount | lines 403–462 | `mountModern`, `#nqUser`, `#nqAcctTab`, `#nqAvatar`, `#nqLogoutBtn`, `#nqSwapBtn` |
| Standalone mode mount | lines 464–491 | `mountStandalone`, `#nqStandaloneAcct`, `#nqStandaloneAcctToggle` |
| Avatar updater | lines 493–517 | `updateAvatar`, `#nqAvatar`, `nqAvInit` |
| Profile fetch & cache | lines 520–570 | `pickProfImgs`, `profFromFrame`, `refreshProfile`, `maybeRefreshProfile` |
| Settings watcher | lines 571–584 | `watchSettingsForAvatar`, `markProfDirty` |
| All Pets overlay | search `All Pets` block | `parseUserlookup`, `apRefresh`, `openAllPets`, `apRender`, `#nqAP`, `.nqAcctAllPets` |
| Boot | lines 587–601 | `mount`, `detectMode`, `nq:main`, `nq:drawer` |

## Depends on

- `unsafeWindow` — access to Neopets globals (`appInsightsUserName`)
- `GM_xmlhttpRequest` + `@connect account.neopets.com` — NeoPass sync
- `localStorage` — all state (accounts, main account, profile cache)
- Modern Interface patcher's `#nqUser` card (for modern mode); falls back to standalone

## All Pets (passive, zero network)

- "All Pets" button in the drawer opens a full-screen overlay (#nqAP): tabs All/UFT/Permanent/Maybe/Untagged, account chips, search, sort, copy name, status + note per pet, "Copy trade list": `Name (CAT) - Colour Species - note` (colour/species on by default; colour/species, category and note each optional, switches in the caret menu next to it, saved in `nq_ap_prefs`). Copies UFT pets, or in Pick mode the picked pets of any tag.
- Data: no requests. `apCollect` reads the patcher's `localStorage nq_qr_data` (tolerant walk for objects with name + species/colour/level) and the `.qrPet` dock DOM, on load (2.5s, 9s), every 30s, and on open. Only the logged-in account is collected; others show "Log in to this account once".
- Storage (GM): `nq_allpets_v1` = {account: {t, pets:[{name,img,species,color,level,active}]}}; `nq_allpets_tags_v1` = {lowercasePetName: {s:"uft"|"perm"|"maybe", n:note}}.
- pet-trading-qol keeps its tradelist in GM storage (per-script), so UFT cannot be pre-filled from it.
- Swap Active clicks the dock's own Make Active link (`#qrDock .qrOverlay a`); other accounts use `swapAccount`. No auto-chaining.
- Unverified: exact nq_qr_data shape beyond `data.active` (other pets come from the dock DOM).


## Don't touch

- The CSS is self-contained so standalone and modern modes look the same. The patcher no longer carries copies of these selectors.
- `MODE` (line 237) is decided by `detectMode()` at mount time, not at script load: `#nqUser` appears after document-start. The boot MutationObserver upgrades a standalone mount to modern if the card appears later.
- `swapAccount` opens a new window to logout.phtml — never auto-logs in.
- Profile fetch uses a hidden iframe fallback when the direct fetch fails (403 or CORS).

## Lessons learned

<!-- Add notes here as they come up. -->
- All Pets details: colour/species/level come from data.active (active pet) and from /home/ `.hp-carousel-nameplate` data-* attributes, only for pets already in the account list. Quick Ref redirects to /home/; its petCare popup and pound `petN_table` are NOT the user's pets.

- #nqListsMod (Accounts / Pets tiles under the user card) is built by mountLists(); All Pets button removed from the drawer; user card restyled compact, #nqAcctTab hidden.

## 1.3.10
- Sidebar tile renamed "All Pets". Every saved account except the logged-in one has an X; removing confirms, then clears it from accounts/manual/NeoPass/seen/main and deletes its All Pets data and orphaned tags.
- All Pets: pet names link to petlookup.phtml?pet=, account names to userlookup.phtml?user= (plain links, no fetch). Pet name is now white CafeteriaBlack text over the image bottom-left (hidden while the hover overlay shows).

## 1.3.12
- All Pets: name colour per card (apNameDark via canvas corner sampling, cached, lazy IntersectionObserver), alt font on pet text, UFT/Permie/Maybe pill badges under the Active badge (.apBadges).
- Lesson (duplicate pets): the same pet name was stored under two accounts (pet transfer / stale per-account snapshot) and the render listed every account, so it showed twice; the home carousel also has slick-cloned slides. Fix: collection skips .slick-cloned, apDedupe() runs on save and once on load (per-account by lowercase name; cross-account keeps the newest-collected account), render dedupes again.

- 1.3.13: All Pets name tone via GM blob fetch (default light); CafeteriaBlack !important on card name/info and h2 (30px).
- 1.3.25: tone helpers (`loadBlob`, `toneRead/Save/Probe`) come from modern-qol 75-pet via `NQ.tone`.

## 1.3.16-1.3.17
- Lesson (pets lost after logout/swap): apDedupe moved pets to the newest-collected account, so one stale nq_qr_data save erased the real owner. Now apDedupe only dedupes inside an account; apRender alone picks the newest owner for display. apCollect also skips saves where half or more of the pets belong to another account (unless the home carousel confirms them).
- All Pets data and tags are mirrored to localStorage (nq_allpets_v1_bak, nq_allpets_tags_v1_bak) and merged back on read (newer t per account wins), so a reinstall or second script copy does not lose them. Footer "Delete data" button (data-act=wipe, confirm) clears both copies.

## 1.3.18
- All Pets: trash icon on each card overlay (data-act=delpet) deletes that pet name from every account entry + its orphaned tag. Accounts popup rows (.apAcRow) have delete (acdel, not the logged-in account) and block (acblock) buttons. Shared removal code is removeAccount(nm) (also used by the drawer X).
- Block list: localStorage nq_ap_block_v1 (lowercase). Blocked accounts are never collected (apCollect), listed (apOrdered) or auto-added (autoAccts/noteAccount). Footer shows Blocked: pills; click one to unblock. apBlocked/apSetBlock are function declarations because autoAccts/noteAccount (earlier in the file) call them.

## 1.3.19
- All Pets trade pick mode: toolbar "Pick pets" (.apPickBtn, data-act=pick) switches to the UFT tab and adds data-pick checkboxes on UFT cards; apState.picked; the copy button (apTradeLbl) then copies only picked pets. Edit mode turns pick mode off.
- 1.3.30: categories 4L/WN/RW/RN/MS. Tag field `c` in `nq_allpets_tags_v1` (`-` = none, absent = auto). Auto (`autoCat`): exactly 4 letters = 4L, letters only = WN, else none; RW/RN/MS are manual only (Aly declined a bundled dictionary). With Category on, WN and uncategorized pets are copied unlabeled below the labeled ones after a blank line. Edit mode has a category row per card and a bulk Category row. Badge `.apCat` on the card. Search matches the category.
- Since bundle 5.5.36 Quick Ref data gives colour/species/gender/level for every pet (`data.pets[]`), not just the active one.

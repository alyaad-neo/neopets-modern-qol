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
| CSS styles | lines 62–145 | `#nppAcctDrawer`, `#nppAcctTab`, `#nppAvatar`, `#npLogoutBtn`, `#npSwapBtn` |
| Storage keys/constants | lines 46–51 | `MAIN_KEY`, `ACCTS_KEY`, `MAN_KEY`, `NP_KEY`, `PROF_KEY`, `DIRTY_KEY` |
| Account list helpers | lines 154–172 | `readAccts`, `writeAccts`, `noteAccount`, `seenAccounts`, `readNP`, `readManual`, `allAccts` |
| Avatar cache | lines 175 | `readProf` |
| NeoPass sync | lines 178–206 | `parseNeoPass`, `neoPassFetch`, `syncNeoPass` |
| Swap session | lines 209–234 | `swapAccount`, `clearNotifCaches` |
| Drawer build/wire | lines 244–400 | `buildDrawer`, `wireDrawer`, `nppAcctRow`, `nppAcctStar`, `nppAcctX` |
| Modern mode mount | lines 403–462 | `mountModern`, `#npUser`, `#nppAcctTab`, `#nppAvatar`, `#npLogoutBtn`, `#npSwapBtn` |
| Standalone mode mount | lines 464–491 | `mountStandalone`, `#nppStandaloneAcct`, `#nppStandaloneAcctToggle` |
| Avatar updater | lines 493–517 | `updateAvatar`, `#nppAvatar`, `nppAvInit` |
| Profile fetch & cache | lines 520–570 | `pickProfImgs`, `profFromFrame`, `refreshProfile`, `maybeRefreshProfile` |
| Settings watcher | lines 571–584 | `watchSettingsForAvatar`, `markProfDirty` |
| All Pets overlay | search `All Pets` block | `parseUserlookup`, `apRefresh`, `openAllPets`, `apRender`, `#nppAP`, `.nppAcctAllPets` |
| Boot | lines 587–601 | `mount`, `detectMode`, `npp:main`, `npp:drawer` |

## Depends on

- `unsafeWindow` — access to Neopets globals (`appInsightsUserName`)
- `GM_xmlhttpRequest` + `@connect account.neopets.com` — NeoPass sync
- `localStorage` — all state (accounts, main account, profile cache)
- Modern Interface patcher's `#npUser` card (for modern mode); falls back to standalone

## All Pets (passive, zero network)

- "All Pets" button in the drawer opens a full-screen overlay (#nppAP): tabs All/UFT/Permanent/Maybe/Untagged, account chips, search, sort, copy name, status + note per pet, "Copy trade list" (`Name - Colour Species (account)`).
- Data: no requests. `apCollect` reads the patcher's `localStorage npqol_qr_data` (tolerant walk for objects with name + species/colour/level) and the `.qrPet` dock DOM, on load (2.5s, 9s), every 30s, and on open. Only the logged-in account is collected; others show "Log in to this account once".
- Storage (GM): `npp_allpets_v1` = {account: {t, pets:[{name,img,species,color,level,active}]}}; `npp_allpets_tags_v1` = {lowercasePetName: {s:"uft"|"perm"|"maybe", n:note}}.
- pet-trading-qol keeps its tradelist in GM storage (per-script), so UFT cannot be pre-filled from it.
- Swap Active clicks the dock's own Make Active link (`#qrDock .qrOverlay a`); other accounts use `swapAccount`. No auto-chaining.
- Unverified: exact npqol_qr_data shape beyond `data.active` (other pets come from the dock DOM).


## Don't touch

- The CSS is self-contained so standalone and modern modes look the same. The patcher no longer carries copies of these selectors.
- `MODE` (line 237) is decided by `detectMode()` at mount time, not at script load: `#npUser` appears after document-start. The boot MutationObserver upgrades a standalone mount to modern if the card appears later.
- `swapAccount` opens a new window to logout.phtml — never auto-logs in.
- Profile fetch uses a hidden iframe fallback when the direct fetch fails (403 or CORS).

## Lessons learned

<!-- Add notes here as they come up. -->
- All Pets details: colour/species/level come from data.active (active pet) and from /home/ `.hp-carousel-nameplate` data-* attributes, only for pets already in the account list. Quick Ref redirects to /home/; its petCare popup and pound `petN_table` are NOT the user's pets.

# HANDOFF: merge the Modern Interface into the bundle (one codebase)

Start a new chat with: "Read `neopets-modern-qol/HANDOFF-merge.md` and `AGENTS.md`, then do stage 0."

Work in stages. Stop after each stage and tell Aly what to test. Do not start the next stage until she says it works.

## Goal

Today Aly runs two Tampermonkey scripts:

1. **Neopets - Modern Interface** 4.2.0 by marius@clraik (MIT, Greasy Fork #581877). It's a third-party base skin of about 8,060 lines. The original is at `dist/Neopets - Modern Interface-4.2.0 (1).js`.
2. **Her bundle**, `dist/Neopets - Modern QOL.user.js` (bundle `@version 5.4.34`). It's built by `node bundle.js` from `dailies-qol`, `modern-interface-patcher`, `account-drawer` and `page-pins-qol`.

The patcher spends most of its code fighting the base script from outside. It overrides CSS 3 to 5 times, hides its markup, mutes its requests and moves elements it hid. The goal is **one codebase that Aly owns**:

- The base script becomes a source project inside the bundle, so there is one upload.
- Every workaround is removed. Where the patcher replaced a base feature, keep Aly's version and delete the base one. Don't hide it.
- Delete dead and unused code, settings, storage keys and CSS.
- Afterwards, rewrite it into one consistent structure, naming and style, as if written from scratch. It should read as Aly's code, not "base plus patches".

**License (required):** the base is MIT. The merged header and one comment block at the top of the merged code must keep this line: `Based on "Neopets - Modern Interface" by marius@clraik, MIT License.` Rewriting the code is fine. Removing the credit is not.

## Hard rules (on top of AGENTS.md)

- Account safety comes first. Add nothing that clicks, submits or requests on Aly's behalf. Removing background requests is good. Adding any is not allowed without asking her.
- Behavior must stay the same except for removals listed here or approved by Aly. When unsure whether a base feature is used, ask her with one short question. Don't guess.
- Keep the pristine original in `vendor/` and never edit that copy. The editable copy lives in `projects/`.
- The AGENTS.md rule "patcher edits only, never the Modern Interface" changes after stage 1. Update AGENTS.md in stage 1.
- Line endings: patcher, account-drawer and dailies use CRLF; page-pins is LF. Never use `sed -i`. Check with node afterwards.
- Run `node bundle.js` after every change. It must print `OK`. Bump `@version` in `projects/_bundle/00-header.js` every time.
- Keep chats short. If this chat goes past about 15 rounds, update this file with progress and tell Aly to start a new chat.

## Stage 0: checkpoint and file moves

1. `git status`. There is a lot of uncommitted work. Commit it: `git add -A` then `git commit -m "checkpoint before Modern Interface merge"`.
2. Move `dist/Neopets - Modern Interface-4.2.0 (1).js` to `vendor/Neopets - Modern Interface-4.2.0.js`, unchanged. Use `git mv` if it's tracked, plain `mv` if not. `dist/` should only hold the bundle output.
3. Report and stop.

## Stage 1: base script becomes a bundle project (no behavior change)

1. Create `projects/modern-interface/` with a copy of the vendor file and a NOTES.md from `projects/_template/`.
2. In `bundle.js`, add it to `sources` **first**. The others expect `data-np-modern-interface` and the `W.__np*` APIs to exist, and dailies must still come before the patcher. Order: `modern-interface`, `dailies-qol`, `modern-interface-patcher`, `account-drawer`, `page-pins-qol`. Update the comment that says "four projects".
3. Merge the headers in `projects/_bundle/00-header.js`:
   - Add the base script's `@grant`, `@connect` and `@icon` entries and the credit line in `@description`.
   - Do NOT copy `@downloadURL` or `@updateURL`. They would let Greasy Fork overwrite Aly's script.
   - **The base script has extra excludes the bundle lacks:** `https://www.neopets.com/~*`, `*://*.neopets.com/faeriefragments*`, `*://*.neopets.com/talesofdacardia*`, `https://www.neopets.com/games/game.phtml?*`. Don't add them to the shared header, because the other projects (dailies, JellyNeo popup) may need those pages. Instead, the base project's code must return early on those paths, plus `items.jellyneo.net`.
4. `node bundle.js`. Update AGENTS.md: "Known projects", "Final bundle", and the vendor rules.
5. Tell Aly: upload the bundle and **disable the separate Modern Interface script in Tampermonkey**. Everything should look and work exactly as before. Report and stop.

## Stage 2: delete the workarounds and the replaced base features

Do these one group at a time. Run `node bundle.js` after each, and check for leftovers with `grep -n` on the IDs listed. For each item, delete the base side and the patcher's fight against it.

**Alerts bell.** DONE (bundle 5.5.1, removed base bell + bellNotif fetches, muteVendorAlerts, clearNotifCaches in patcher and drawer, dead .npp-bell CSS, MAIL_SVG/BELL_SVG, #nppNotifHead). Aly uses Neopets' own bell (patcher `setupBell`, `#nppBell`).
- Base: the `bellNotif()` IIFE (search `BELL DROPDOWN`), `#npxBell`, `#npxBellDot`, `.bellMenu`, `#npxBellList`, the `.bell*` CSS, and its fetches of `/nf.phtml` and `/`. Also storage keys `npqol_notifs_v2` and `npqol_notifs_hidden_v1`.
- Patcher: `muteVendorAlerts` and its calls, the `.npp-bell*` shadow CSS (dead), and the unused `MAIL_SVG` and `BELL_SVG` constants. Check whether `clearNotifCaches`, which exists in both the patcher and account-drawer, is still needed once those keys are gone.

**Header right side.** DONE (bundle 5.5.2: base .right markup/CSS, NST clock, search toggle and / key removed; patcher .right hide removed). The patcher hides the base `.right`: `#npxSearchToggle`, `#npxSearch`, `#npxNst`, `#npxBell`, `#npxNews`. Aly's versions are `#nppTools` (search), `.npp-clock` and the patcher's New Features link in Community. Delete the base markup, its CSS and its JS (search toggle, `/` key, NST timer), and the patcher's `.right { display: none }`.

**Header CSS.** DONE (bundle 5.5.3: base-selector rules folded into base barStyle with their !important flags kept; SHADOW_CSS now holds only npp-*/edit-row/hamburger rules; Quests link restored in base .left). The patcher's `SHADOW_CSS` overrides the base top-bar CSS inside the shadow root (`.btn`, `.menu`, `.left`, `.inner`, carets, media queries). Fold the winning values into the base CSS, then delete both the losing rules and the override.

**Sidebar and HUD.** DONE (bundle 5.5.4: `tools/css-dedupe.js` deleted 389 declarations that can never win: 49 spans in base HUD_CSS, 285 in patcher PAGE/LAYOUT/BAR_CSS, incl. everything PET_IMG_STYLE overrides inline; re-run reports 0). Not done, needs Aly: base cards/parts that are only hidden by patcher CSS (`#npBank`, `#npQrActive`, `#npUser .shieldSlot/.avatarSlot/.meta`). QuickRef may feed the pet card, so check before deleting. Patcher NOTES say many `#npHud` rules exist 3 to 5 times: the base CSS, then overrides including "sidebar v4.1.2", "top half tidy 4.1.11" and "sidebar round 5/6/7". Keep only the final computed result for each element. Watch for the base's inline `!important` styles, such as the `PET_IMG_STYLE` constant.

**Backgrounds and colors.** DONE (bundle 5.5.5: base full DTI list, favorites, trash, reload, status, accent swatches, "Full inventory bar" checkbox (now always on) and base top-bar painting removed; patcher list hacks, recolor fallback and dead picker CSS removed; picker auto-shuffles on first open; old keys `npqol_dti_bgs_v6`, `npqol_bg_favs_v1`, `npqol_bg_hidden_v1`, `npqol_inv_menubar_v1` are deleted on load). The patcher has its own color picker (`injectPicker`, `#nppColors`) and DTI shuffle/search (`discoverBgs`, `kwSearch`). Find the base's right-sidebar theme and background picker (`#npBgSidebar`, `#npBgHandle`). Ask Aly which parts she still uses, then delete what's replaced.

**Cross-script plumbing.** DONE (bundle 5.5.7 + 5.5.8), tested. 5.5.7: bundle.js now emits `const NQ = {};` before the projects, a shared object the page cannot see. All `W.__np*`/`W.__npp*` bridges became `NQ.*` (`NQ.base`, `getAccent`, `applyAccent`, `onAccent`, `getBtnTheme`, `applyBtnTheme`, `saveBtnTheme`, `onBtnTheme`, `btnThemes`, `btnThemesData`, `btnIconUrl`, `btnFallbackChain`, `attachBtnFallback`, `sideBtns`, `cleanImg`, `dailies`). `np:btn-theme` and `np:accent` events became `NQ.onBtnTheme`/`NQ.onAccent` listener lists. Deleted: unused `__npTabConfig`/`__npRegisterTab`, `__npBtnFallbackUrl`, `saveAccent`/`resetAccent`, `__nppCore`; the patcher's `data-np-modern-interface` MutationObserver (now `if (NQ.base) boot()`), dailies `isModernInterface()` + its MutationObserver and 1s recheck; patcher `applySynced` 300ms wait loop (runs once), setupTools 300ms `measure` poll (now a ResizeObserver on the column) and its 2s icon/theme poll. `unsafeWindow` stays only for page globals (`appInsightsUserName`, `bodyHeightAdjust2020`, `neopetsResetPins`). The `data-np-modern-interface` attribute stays because CSS selectors use it. 5.5.8 removed the patcher's 200ms x100 boot loop and its endless 1500ms pet/NC loop. The base header (`#npx-host` shadow, menus, Premium button) and `NQ.sideBtns` exist synchronously, so `patchShadow`, `setupClock`, `fixNcNavLinks`, `setupPremium`, `lockShortcuts`, `lockShopkeeper` run once in `boot()`. Everything that needs `<body>` (HUD, `#btnOverlay`, `#npxSideBtnHost`) or Neopets markup runs in one idempotent `build()` at body creation (one-shot MutationObserver on `<html>` childList), DOMContentLoaded (`#npBgSidebar`, bell, native Premium links, `#ncanchor`, shop prices) and load. New hooks: `NQ.dailies.onCard(fn)` (dailies creates `#nppDaily` late, after `whenUser`) runs `setupDailyFold`; `NQ.onQrData(fn)` (base `qrModule.writeCache`) plus a `storage` listener run `renderPetInfo`. `fixPetImg` relies on its card MutationObserver (now also watches `src`) and ResizeObserver. `npp-wait` is removed by `unwait()` (called from `build`, `accountGuard`, the pet sync) with the same 2.2s pet / 3s hard fallbacks. `syncPetImg` polls 200ms only on the first page after an account swap, max 9s. `fixNcNavLinks` also runs from the header menu observers. Polls still left (not boot-related, candidates if Aly still sees slowness): Premium menu `csync` 400ms and `updateSnow` 1s (patcher `setupPremium`), dailies `renderSidebar` 1s / `ncPull` 4s / menu 1s, `accountGuard` 100ms until the username appears, the clock, base bank recheck and side-button `bindWatcher` 8s. Original brief:
- the `data-np-modern-interface` waits (patcher, dailies `isModernInterface()`)
- `unsafeWindow` and `W.__npApplyAccent`, `__npApplyBtnTheme`, `__npSideBtns`, `__npBtnIconUrl`, `__npGetBtnTheme`, `__npAttachBtnFallback`
- the `np:btn-theme` events between scripts
- the patcher's polling `setInterval` loops that only exist because it can't see when the base finishes building

Keep `W.appInsightsUserName`: that one comes from Neopets itself.

**Requests.** DONE (bundle 5.5.9), waiting on Aly's test. Deleted dead code: the base user-card `userlookup` fetch (only `#npUserRefresh` could trigger it, and the patcher hid it; button, spinner and `.loading` CSS gone) and the base Make Active fetch (the patcher's capture handler always pre-empts it). Aly removed: the drawer's hidden `userlookup` iframe avatar fallback, the NeoPass daily auto-sync (Sync button kept), and the base bank background refresh (page-load, 5-min and tab-focus). On `/bank.phtml` the bank card now parses the page itself with no fetch. Clicking the balance and deposit/withdraw still fetch. Old keys `npp_np_auto_ts`, `npp_prof_frame_ts` are deleted on load. Kept: quickref (load if >5 min), bank POST + click refresh, drawer avatar `userlookup` (24h), NeoPass Sync button, logout on swap, patcher Make Active, JellyNeo Symol/Tarla (hourly max), DTI GraphQL (picker only), pet image tone blobs. Original brief: List every `fetch(` and `GM_xmlhttpRequest(` left in the bundle, with what triggers it and how often. Show Aly the list and delete any she doesn't want. Keep the 403 backoff (`np403BackoffActive`, `npNote403`) for whatever stays.

**Other base features.** DONE (bundle 5.5.10), waiting on Aly's test. Kept: phone guard, 403 backoff, accent/button-theme APIs, layout + native hiding, top-bar menus + Edit links, first-visible-child align, custom scrollbar, pet preload, bank PIN, page restyles, NP, QuickRef data + dock, bank card (in NP drawer), icon column + size. Deleted (always hidden by the patcher): user card avatar/shield/avatar+stamp counts and Profile Settings gear; `#npHudResizer`; frame resize handles and saved size (patcher already wiped `npqol_frame_size_v1` every load); `#npQrActive` card + QuickRef settings (only filtered that card); icon layouts cols/row, side, shift, X, offset, right column, swap, editor Layout/Spread/Height/Size groups (DEFAULT_CFG and loadConfig merge right into left; patcher `lockShortcuts` gone; patcher size buttons stay). Patcher hides, SYNC_KEYS and dead editor CSS for these removed; old keys + `npqol_hud_userlookup:*` deleted on load. Original brief: Make a short table of each remaining base feature (the `/* ===` section banners were stripped in 5.5.5; read them in `vendor/`): kept as-is, restyled by the patcher, or replaced. Ask Aly about anything unclear.

After stage 2, tell Aly what to test (list below). Report and stop.

## Stage 3: restructure and rewrite

1. Convert to a split project per AGENTS.md "Splitting a project". Make one project, for example `projects/modern-qol/src/`, with `05-utils`, `10-styles`, `20-header`, `30-sidebar`, `40-backgrounds`, `50-bell`, and so on, plus `90-main`. Do it in stages, with a checkpoint commit before each move.
   - Dailies, account-drawer and page-pins can stay separate projects or become feature files. Ask Aly.
2. Once files are split and tested, rewrite in place:
   - Use one naming scheme. Pick one prefix (for example `nq-` for classes and IDs, `nq_` for storage keys) instead of today's mix of `np-`, `npx`, `npp`, `npqol_` and `npp_`.
   - Use one CSS block per element.
   - Use one helper set: `$`, `esc`, `LSget`/`LSset`, `shadow()`. These exist in several copies today.
   - Use one boot path.
   - **Storage keys: renaming them loses Aly's saved settings.** Add a one-time migration that copies each old key to its new name on first run, or keep the old names. Ask her which.
3. Update every NOTES.md, AGENTS.md and `modern-interface-patcher/HANDOFF.md`. Delete this file when done.

## What to test after each stage (for Aly)

1. Header: menus open and close, frosted dropdowns, "Edit links" row, search, clock, Neopets bell and dropdown. On a retired-UI page the bell should link to the alerts page.
2. Sidebar: user card, NP/NC/bank, active pet card, pins and recents, accounts drawer, dailies card, quick icons and nesting.
3. Background and color picker, light and dark sidebar.
4. Shops: price highlight on 10k/25k items, shopkeeper image locked for 5s, JellyNeo popup.
5. Dailies: Trudy's Surprise marked done on visit, Expellibox popup, Snowager.
6. NC Mall page, login/logout pages (UI stripped), popups.
7. DevTools Network tab: no new background requests to neopets.com while idle.

## Current state (2026-10-28)

- Stage 0 and 1 done. Stage 2: Alerts bell, Header right side, Header CSS are DONE and tested. Sidebar and HUD DONE (5.5.4). Backgrounds and colors DONE (5.5.5), waiting on Aly's test. All comments stripped from modern-interface and the patcher in 5.5.5 (only the MIT credit line kept). Cross-script plumbing DONE (5.5.7 bridges, 5.5.8 boot loop), tested. Requests DONE (5.5.9), waiting on Aly's test. Other base features DONE (5.5.10), waiting on Aly's test. Next: after Aly confirms, stage 2 is complete; tell her what to test, then stage 3.
- Aly confirmed the active-pet card fix (5.5.6: base renderActivePetImage now prepends the img). She suspects the bundle slows page loads: 22 setInterval and 31 MutationObservers (19 subtree). Removing the polling loops is the main goal of Cross-script plumbing.
- Bundle 5.5.11: modern-qol 5.0.0 (from modern-interface 4.2.10 + patcher 4.1.37), dailies 1.0.8, account-drawer 1.3.21, page-pins 1.0.6.
- Stage 3 step 1 DONE (bundle 5.5.11), waiting on Aly's test. Aly chose: dailies, account-drawer, page-pins stay separate projects; storage keys get a one-time migration to `nq_*`. `modern-interface` + `modern-interface-patcher` are now `projects/modern-qol/src/` (18 files, see its NOTES.md). Originals in `projects/modern-qol/original/`. Code moved as-is except: one shared top-frame and host guard; the base path/phone `return`s became `npBaseOff()` so `NQ.base` is only set when the base runs, and the three base IIFEs (`20-layout`, `25-hud`, `30-backgrounds`) start with `if (!NQ.base || ...) return;`; `90-main` defines `NQ.boot`, which bundle.js calls after dailies. Patcher top-level code now runs before dailies (checked: `accountGuard` is async, dailies reads storage only after DOMContentLoaded).
- Aly confirmed the split. `original/` deleted (commit a6c28e0).
- Bundle 5.5.12 (modern-qol 5.0.1), waiting on Aly's test: the three base IIFEs are now named functions `startLayout`, `startHud`, `startBackgrounds`, called from the last line of `15-core` when `NQ.base` (same run order as before). Their `!NQ.base` guards are gone; the double-run guards stay. 30-backgrounds' own `W`, `LSget`, `LSset` were deleted (it uses 15-core's; identical results). 20-layout's shadow root `root` is now `barRoot`. Only top-level duplicate left: `style` (one inside `startLayout`, one inside `startBackgrounds`, so no clash).
- Aly confirmed 5.5.12.
- Bundle 5.5.13 (modern-qol 5.0.2), waiting on Aly's test: 41 constants and pure functions moved out of the `start*` functions to file level (e.g. `THEME`, `FRAME`, `KILL`, `menus`, `HUD_CSS`, bank PIN and pet-image helpers, `LS` and sizes in 30). Moved verbatim (sorted-lines diff shows only the call lines changed). The `start*` calls moved from the end of 15-core to the end of each base file, so the file-level constants exist first; run order unchanged. Tool: `node tools/lift-decls.js projects/modern-qol/src [--apply]` reports what can move: a declaration moves only if it is a function, or a const/let whose value has no calls, `new`, property reads or plain identifiers, and everything it references also moves; its name must not appear in any other src file. Still inside `start*`: DOM nodes (`host`, `barRoot`, `bar`, `hud`, cards), values read from `NQ` (`_iconUrl`, `_initialTheme`, `icons`), and every function that uses them.
- Aly confirmed 5.5.13.
- Bundle 5.5.14 (modern-qol 5.0.3), waiting on Aly's test: one helper set. The 15-core helpers (`W`, `root`, `rs`, `path`, `$`, `LSget`, `LSset`, `LSdel`, `esc`, `shadow`) now sit right after the host guard, so `npBaseOff` can use them. Deleted local copies: bankModule `$` (now `$(sel, cardBank)`), userModule and npModule `sGet`/`sSet`, sideBtnEditor `esc`, setCSSVars `root`. Every `localStorage.getItem/setItem/removeItem` and `document.querySelector` in modern-qol is now `LSget`/`LSset`/`LSdel`/`$`, except: `ppCachePut` (needs the setItem failure to bail out), `localStorage.length`/`key(i)` loops, and 10-jellyneo (runs before 15-core, also on items.jellyneo.net). Redundant `try` blocks around them are left for the rewrite. Still shadowing core names (naming step): 25-hud sideBtnEditor `root` (its shadow root), bank graph `W = 220`, 90-main `root = $('#npNp')`.
- Aly confirmed 5.5.14.
- Bundle 5.5.15 (modern-qol 5.0.4, dailies 1.0.9, drawer 1.3.22, page-pins 1.0.7), waiting on Aly's test: storage keys renamed. Aly chose all four projects. Every `npqol_`/`npp_` key (localStorage, sessionStorage, GM) is now `nq_` with the rest of the name unchanged (version suffixes kept). `projects/_bundle/10-migrate.js`, emitted by bundle.js right after `const NQ = {}`, copies old localStorage keys to `nq_*` once (skips `npqol_pp_png*` cache; flag `nq_migrated`) and the GM keys `npp_sync` (inner key names remapped), `npp_nc_cd`, `npp_allpets_v1`, `npp_allpets_tags_v1`. Old keys are not deleted (rollback safety; a later cleanup can remove them). `npp_acct_` prefix loops now `slice(8)`. Dead-key deletions in 90-main etc. were renamed too, which still works because migration copies before they run.
- Aly confirmed 5.5.15.
- Bundle 5.5.16 (modern-qol 5.0.5), waiting on Aly's test: bug fixes. JellyNeo popup also opens for JellyNeo links inside Neopets' `p.search-helper` row (no `iph-icon--jellyneo` class there). Pet stats collapsed unless `nq_stats_open` is `1`. Icon Size feature deleted at Aly's request (`getIconSize`/`setIconSize`, `--np-side-icon-size`, `.nppSizeGrp` buttons + CSS, sync key); sidebar shortcut icons fixed 36px (the base `!important` var rule had overridden the 36px sidebar rule, so icons overflowed), header search + bell fixed 36px (`measure` in 65-tools). `nq_side_icon_size_v1` deleted on load.
- Aly reports pages sometimes hang on load; unknown if the bundle causes it. Asked her for a navigation-timing snippet result (server vs DOM ready vs load, slowest resources). Suspects if it is the script: whole-document subtree MutationObservers that run during parsing (15-core:124, 20-layout:1092, 25-hud:769/1975/2218/2474, 30-backgrounds:515, 90-main:52, drawer docMo, page-pins docMo, dailies body observer), the 25-hud `bindWatcher` 80ms fast timer, and the 90-main `npFitMo` font-fit loop.
- Bundle 5.5.17: migration pass 2 (`nq_migrated` = `2`). `nq_acct_<user>` snapshots and `nq_theme_<user>` themes are JSON objects whose inner keys still had old `npqol_`/`npp_` names, so an account swap restored data under old names (empty new keys, theme-check reload). Pass 2 renames the inner keys. Aly reports the sidebar takes 10-15s to appear on initial load; not diagnosed yet (hide classes cap at 3s/5s, so it is not `npp-wait`).
- Class/ID rename PAUSED (nothing edited). Inventory: 418 `np-`/`npx`/`npp`/`np[A-Z]` tokens (classes, IDs, CSS vars, keyframes, JS names); scratchpad classifier found 146 with no creation site, mostly dynamically built names but also Neopets-owned ones that must stay (`np-text__2020`, `np-meter__2020`, likely `np-table`, `np-table-row-even`, `np-templates`, `np-stepper-btn`). Mapping npx/npp/np -> nq collides on `np-shadow`/`npp-shadow`, `npSpin`/`nppSpin`, `np-nc`/`npp-nc`; pick distinct names for those. Do it after the hang question is settled.
- Next (after Aly confirms 5.5.16): class/ID naming (`nq-` for `np-`/`npx`/`npp` classes and IDs; check Neopets-owned names are left alone), then CSS one block per element. Each a small step with a checkpoint commit.
- Start a new chat with: "Read neopets-modern-qol/HANDOFF-merge.md and AGENTS.md, then continue stage 3." (only after Aly confirms 5.5.16 works)
- CSS dedupe tool: `node tools/css-dedupe.js <base.js> <patcher.js> --report out.txt` lists dead declarations (add `--apply` to delete them). It only removes a declaration when a rule matching the same element always beats it (same media or broader, importance, specificity, order, shorthands). Its facts are hardcoded: the HUD cards are direct children of `#npHud`, `npp-css` is present wherever `#npHud` shows, and PET_IMG_STYLE is inline. Check those still hold before you re-use it. A comment heading a group gets deleted with the group's first rule if that rule is dead, so restore it by hand.
- Lessons from this run:
  - Before deleting base markup, grep the patcher for code that MOVES it (e.g. patchShadow moved the Quest Log link into .left). Quests was lost in 5.5.2 and restored in 5.5.3.
  - Folded CSS keeps the patcher's !important flags so precedence is unchanged. Strip them in stage 3.
  - Git Bash heredocs mangle backslashes. Write node edit scripts with the Write tool into the scratchpad.

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

**Sidebar and HUD.** Patcher NOTES say many `#npHud` rules exist 3 to 5 times: the base CSS, then overrides including "sidebar v4.1.2", "top half tidy 4.1.11" and "sidebar round 5/6/7". Keep only the final computed result for each element. Watch for the base's inline `!important` styles, such as the `PET_IMG_STYLE` constant.

**Backgrounds and colors.** The patcher has its own color picker (`injectPicker`, `#nppColors`) and DTI shuffle/search (`discoverBgs`, `kwSearch`). Find the base's right-sidebar theme and background picker (`#npBgSidebar`, `#npBgHandle`). Ask Aly which parts she still uses, then delete what's replaced.

**Cross-script plumbing.** Once everything is one codebase, replace the bridges with direct calls and delete the wait logic:
- the `data-np-modern-interface` waits (patcher, dailies `isModernInterface()`)
- `unsafeWindow` and `W.__npApplyAccent`, `__npApplyBtnTheme`, `__npSideBtns`, `__npBtnIconUrl`, `__npGetBtnTheme`, `__npAttachBtnFallback`
- the `np:btn-theme` events between scripts
- the patcher's polling `setInterval` loops that only exist because it can't see when the base finishes building

Keep `W.appInsightsUserName`: that one comes from Neopets itself.

**Requests.** List every `fetch(` and `GM_xmlhttpRequest(` left in the bundle, with what triggers it and how often. Show Aly the list and delete any she doesn't want. Keep the 403 backoff (`np403BackoffActive`, `npNote403`) for whatever stays.

**Other base features.** Make a short table of each remaining base feature (search the `/* ===` section banners): kept as-is, restyled by the patcher, or replaced. Ask Aly about anything unclear.

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

- Stage 0 and 1 done. Stage 2: Alerts bell, Header right side, Header CSS are DONE and tested. Next: **Sidebar and HUD**.
- Bundle 5.5.3: modern-interface 4.2.3, patcher 4.1.31, dailies 1.0.6, account-drawer 1.3.20, page-pins 1.0.6.
- Start a new chat with: "Read neopets-modern-qol/HANDOFF-merge.md and AGENTS.md, then do the Sidebar and HUD group of stage 2."
- Lessons from this run:
  - Before deleting base markup, grep the patcher for code that MOVES it (e.g. patchShadow moved the Quest Log link into .left). Quests was lost in 5.5.2 and restored in 5.5.3.
  - Folded CSS keeps the patcher's !important flags so precedence is unchanged. Strip them in stage 3.
  - Git Bash heredocs mangle backslashes. Write node edit scripts with the Write tool into the scratchpad.

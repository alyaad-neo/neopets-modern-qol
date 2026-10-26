# HANDOFF: modern-interface-patcher

## Goal

- Keep `modern-interface-patcher`, `account-drawer`, and `page-pins-qol` as separate source projects for agent editing.
- Ship one combined Tampermonkey file: `dist/Neopets - Modern QOL.user.js`.
- Rebuild that bundle after every change to any of the three.

## What's done

- `bundle.js` builds the final file: strips each source's userscript header, keeps each body as its own IIFE, concatenates in order (patcher -> account drawer -> page pins), and runs `node --check`.
- Bundle header lives in `projects/_bundle/00-header.js` at version `5.0.0`.
- Current sources: patcher `4.0.2`, account drawer `1.0.2`, page pins `1.0.1`.
- Current output: `dist/Neopets - Modern QOL.user.js` (236.8 KB, 3393 lines).
- Patcher cleanup done: account drawer, avatar, and recent/pinned code removed; clock moved to the header; NP/NC and pet folds removed; logout text white; pinned cards use the gold style.
- Avatar fix done in account drawer: mount-time `detectMode()`, plus standalone -> modern observer upgrade.
- `node --check` passes for all three sources and the bundle.
- Docs updated: `AGENTS.md`, `projects/_bundle/NOTES.md`, this file, and the patcher `NOTES.md` lessons.

## What's left

- Aly: upload `dist/Neopets - Modern QOL.user.js` to Tampermonkey.
- Aly: disable or remove the separate "Neopets - Accounts Drawer" and "Neopets - Recently Viewed + Pin Pages" scripts. The bundle keeps the patcher's name, so it updates that entry.
- Browser test was not done here. Verify:
  - header clock sits top-right and matches the nav link colour
  - sidebar avatar renders
  - account drawer opens, switches accounts, and NeoPass sync works
  - recent and pinned cards populate; pinned cards use the gold style
  - logout text is white
  - NP/NC and pet cards have no fold button; daily notices still fold
- For any source change: bump `projects/_bundle/00-header.js` `@version`, run `node bundle.js`, then upload the new `dist` file.

## Decisions

- The three separate projects are the source of truth. Do not copy code into `_bundle` or `dist`.
- Keep the patcher's `@name` and `@namespace` in the bundle: Tampermonkey updates the existing entry and preserves GM storage/theme. The output filename can differ (`Modern QOL`).
- Do not merge the three bodies into one IIFE. Keep separate IIFEs; names such as `MODE`, `curUser`, `readAccts`, `$`, `LSget`, and `esc` repeat.
- The combined header must keep `@connect account.neopets.com` for account-drawer NeoPass. The patcher header alone no longer has it.
- Bundle header version is independent of source versions. Bump `5.0.0` -> `5.0.1` etc. on every source/bundle change.
- `bundle.js` requires exactly one `.js` per source project. It discovers the filename, so versioned filenames are okay.

## Files changed

- New: `bundle.js`
- New: `projects/_bundle/00-header.js`
- New: `projects/_bundle/NOTES.md`
- New: `dist/Neopets - Modern QOL.user.js` (generated; never edit)
- New: `projects/modern-interface-patcher/HANDOFF.md`
- `AGENTS.md` — final bundle workflow
- `projects/modern-interface-patcher/Neopets - Modern Interface PATCHER-4.0.0.js` — `4.0.2`: cleanup, clock, folds
- `projects/modern-interface-patcher/NOTES.md` — feature map + lessons
- `projects/account-drawer/Neopets - Accounts Drawer-1.0.0.js` — `1.0.2`: avatar fix, white logout
- `projects/account-drawer/NOTES.md`
- `projects/page-pins-qol/Neopets - Recently Viewed + Pin Pages-1.0.0.js` — `1.0.1`: gold pinned style
- `projects/page-pins-qol/NOTES.md`

## Tricky things to watch out for

- Stale `dist` is the main risk. Any edit to any of the three must end with `node bundle.js`.
- Bump the bundle header version, not just the source version, or Tampermonkey may not offer the update.
- `bundle.js` strips through the first `// ==/UserScript==`; source headers must stay at byte 0. Do not add a BOM or preamble.
- Page-pins is `@grant none` standalone but sandboxed in the bundle because the patcher grants `unsafeWindow`. It already uses `W = unsafeWindow`; verify localStorage/pins after changes.
- Account drawer `MODE` must be detected at mount, not document-start. `#npUser` is absent at document-start; the observer upgrades standalone -> modern.
- The clock is in the shadow header `.bar`, not the footer. `#nppBottom` no longer exists; page-pins appends to `#nppFoot`.
- `setupFold()` is gone. Do not re-add a fold button to `#npNp` or `#npActivePet`. `setupDailyFold()` remains.
- Keep the auth-page exclusions in the bundle header; all three sources skip login/logout.
- Do not rename the bundle's `@name`/`@namespace` casually. It would create a new Tampermonkey entry and lose existing GM storage/theme.
- The bundle is generated. Never hand-edit `dist/`.

## First step for the next agent

Read `AGENTS.md`, `projects/_bundle/NOTES.md`, and this file. For a feature fix, edit the owning source project, rebuild the bundle, and tell Aly the single file to upload.

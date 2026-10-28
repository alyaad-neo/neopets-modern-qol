# NOTES: _bundle

Build-only project. The four feature projects are the source of truth.

## What it does

Combines `modern-qol`, `dailies-qol`, `account-drawer`, and `page-pins-qol` into one upload file: `dist/Neopets - Modern QOL.user.js`.

## Type

- Not a userscript. `00-header.js` holds the final header only.
- Build from the repo root: `node bundle.js`

## Build steps

1. Edit the feature in its own project (`modern-qol`: edit `src/`; `bundle.js` runs `build.js` for it).
2. Bump `@version` in `00-header.js`.
3. Run `node bundle.js`.
4. Upload `dist/Neopets - Modern QOL.user.js`; disable or remove any separate scripts, including the Greasy Fork Modern Interface.

## Order

0. `const NQ = {}` and `10-migrate.js`: one-time copy of every old `npqol_*`/`npp_*` localStorage key (and GM keys `npp_sync`, `npp_nc_cd`, `npp_allpets_v1`, `npp_allpets_tags_v1`) to `nq_*`, flagged by `nq_migrated`. Old keys are kept so an older bundle still works. All projects use `nq_*` keys only.
1. `modern-qol` (sets `NQ.base`, defines `NQ.boot`)
2. `dailies-qol`, then `NQ.boot()` (so `NQ.dailies` exists when modern-qol boots)
3. `account-drawer`
4. `page-pins-qol`

Each source keeps its own IIFE, so function names do not collide.

## Don't touch

- Never edit `dist/` by hand; rebuild it.
- Keep each single-file source project to exactly one `.js` file; `bundle.js` discovers it automatically. A project with `src/` is built with `build.js`.
- Keep `@connect www.jellyneo.net` and `ncmall.neopets.com` (dailies).
- Keep `@connect account.neopets.com` (NeoPass sync) and the `unsafeWindow` / `GM_xmlhttpRequest` grants in `00-header.js`.

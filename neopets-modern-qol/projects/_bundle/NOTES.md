# NOTES: _bundle

Build-only project. The three feature projects are the source of truth.

## What it does

Combines `modern-interface-patcher`, `account-drawer`, and `page-pins-qol` into one upload file: `dist/Neopets - Modern QOL.user.js`.

## Type

- Not a userscript. `00-header.js` holds the final header only.
- Build from the repo root: `node bundle.js`

## Build steps

1. Edit the feature in its own project and run `node --check` on that project's `.js`.
2. Bump `@version` in `00-header.js`.
3. Run `node bundle.js`.
4. Upload `dist/Neopets - Modern QOL.user.js`; disable or remove the three separate scripts.

## Order

1. `modern-interface-patcher`
2. `account-drawer`
3. `page-pins-qol`

Each source keeps its own IIFE, so function names do not collide.

## Don't touch

- Never edit `dist/` by hand; rebuild it.
- Keep each source project to exactly one `.js` file; `bundle.js` discovers it automatically.
- Keep `@connect account.neopets.com` (NeoPass sync) and the `unsafeWindow` / `GM_xmlhttpRequest` grants in `00-header.js`.

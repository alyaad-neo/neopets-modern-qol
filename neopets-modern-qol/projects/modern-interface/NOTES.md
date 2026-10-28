# NOTES: modern-interface

Keep this file short. It is the map the agent reads before every task.

## What it does

The base skin: fixed top bar, content frame, left sidebar HUD (`#npHud`: user card, NP, bank, QuickRef), right sidebar color theme and DTI backgrounds. Based on "Neopets - Modern Interface" 4.2.0 by marius@clraik, MIT License (Greasy Fork #581877). Now Aly's own copy, bundled first in `dist/Neopets - Modern QOL.user.js`.

## Type

- Single-file. Edit `Neopets - Modern Interface-4.2.0.js`. Upload the bundle (`node bundle.js`), not this file.
- The pristine original is `vendor/Neopets - Modern Interface-4.2.0.js`. Never edit that one.

## Pages it runs on

Bundle header `@match` lines. Its own gates (top of the file) return early on: iframes, hosts other than www./ncmall.neopets.com (so not items.jellyneo.net), path `/`, `/~*`, `/faeriefragments*`, `/talesofdacardia*`, `/games/game.phtml?*`. These replace the standalone script's extra `@exclude` lines.

## Feature map

No comments in the code (stripped 4.2.5). Section banners are only in `vendor/`. Three IIFEs: core & layout, HUD, background & decor (`npBgBoot`).

| Feature | Search for |
| --- | --- |
| Shared gates | `Bundle gate`, `PHONE GUARD` |
| Top bar bell | removed 4.2.1 (Neopets bell via patcher `setupBell`) |
| Sidebar HUD | `#npHud`, `PET_IMG_STYLE` |
| Backgrounds picker shell (handle, panel, button style, top bar select, recolor, save/cancel) | `#npBgSidebar`, `#npBgHandle`, `buildUI` |
| Inventory menu bar | always full (`html:root body .inv-menubar`) |

## Depends on

`unsafeWindow` (exposes `W.__np*` APIs used by the patcher and dailies). Sets `data-np-modern-interface`.

## Don't touch

- Keep the credit line `Based on "Neopets - Modern Interface" by marius@clraik, MIT License.` at the top of the code and in the bundle header.

## Lessons learned

- 2026-10-27: stage 1 of `HANDOFF-merge.md`: copied from vendor unchanged except the credit comment and the `Bundle gate` block. Line endings: LF.
- 2026-10-28 (4.2.4): HUD_CSS lost every declaration the patcher always overrides (see `tools/css-dedupe.js`). What is left in HUD_CSS for #npHud cards is only what still applies. `#npBank` and `#npQrActive` are still built but hidden by patcher PAGE_CSS.

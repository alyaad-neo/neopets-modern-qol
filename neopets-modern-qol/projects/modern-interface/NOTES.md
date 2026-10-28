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

Search the `/* ===` section banners. Three IIFEs: core & layout (~line 157), HUD (~2520), background & decor (~6760).

| Feature | Search for |
| --- | --- |
| Shared gates | `Bundle gate`, `PHONE GUARD` |
| Top bar bell | `BELL DROPDOWN`, `#npxBell` |
| Sidebar HUD | `#npHud`, `PET_IMG_STYLE` |
| Backgrounds | `#npBgSidebar`, `#npBgHandle` |

## Depends on

`GM_xmlhttpRequest` + `@connect impress*.openneo.net` (DTI backgrounds), `unsafeWindow` (exposes `W.__np*` APIs used by the patcher and dailies). Sets `data-np-modern-interface`.

## Don't touch

- Keep the credit line `Based on "Neopets - Modern Interface" by marius@clraik, MIT License.` at the top of the code and in the bundle header.

## Lessons learned

- 2026-10-27: stage 1 of `HANDOFF-merge.md`: copied from vendor unchanged except the credit comment and the `Bundle gate` block. Line endings: LF.

# NOTES: petpage-gen

## What it does

All Pets toolbar "Petpage" button opens #nqPP: a builder that turns the Up for Trade (or picked) pets into copy-paste petpage HTML, with a live preview.

## Type

- Single-file, bundle only (needs `NQ.ap` from account-drawer, so it is bundled right after it). `Neopets - Petpage Builder-1.0.0.js`

## Map

| Feature | Search for |
| --- | --- |
| Colour themes (seeded from the Neomail username hash + Shuffle) | `THEMES`, `hash`, `P.shift` |
| Petpage HTML output (trading cards: full-bleed art, foil strip, Georgia name + year pill, caps detail line; lift() fakes a soft shadow with two hairline rings) | `function build`, `card`, `row`, `lift`, `foil`, `fade` |
| Neopian birth year `(Y28)` from `born` | `nyear`, `yr` |
| Builder UI + CSS | `CSS`, `shell`, `render` |
| Prefs per account | `nq_pp_prefs:<user>` (localStorage) |

## Rules for the output (confirmed from a saved petpage, 2026-10-28)

- Inline styles only. Neopets rewrites blocked values to `-blocked-`.
- Blocked: `font:` shorthand (the size/line-height slash), quotes in values (everything after a quote is lost), multi-word font names (only one-word fonts work), CSS gradients, decimals like `.2px` / `-.5px`, box-shadow (silently removed), empty `alt=""` (breaks the next attribute).
- Works: longhand font-size/line-height/font-weight in whole px, one-word font-family lists, hex colours, border-radius in px (not %), padding/margin, whole-number letter-spacing, text-transform, overflow:hidden.
- Gradient workaround: a row of solid-colour table cells (top bar). Community workaround for bigger areas is a hosted gradient image.
- filter-test.html: paste into a petpage to test more workarounds (style-block prefix, data-URL images, shadows, negatives).

## Data

- Duo theme (default): white/black with acc->acc2 only in the title band and card frames. gframe() = gradient border: table with a row of 12 gradient cells top and bottom, solid start/end cells as sides, card in a colspan cell, outer div radius + overflow hidden. Small accents use AC (t.ac, ink in Duo).

- Title band: a 3-row table, one cell per title letter plus 16 filler cells each side, each cell a step of acc->acc2 (smooth gradient with no CSS gradient). Table bg = middle colour and border-spacing 0 hide seams.
- Hover: <style> block. Inline styles beat stylesheets, so the img has only HTML width/height (fills the tile). .nqppA:hover / .nqppR:hover enlarge it about 8% and pull it back with negative margin-left/top to stay centred. Neopets dropped hspace/vspace (tested), so do not use them.
- Detail line wraps (min-height 2 lines) so long notes are not cut off.
- Border option P.border: frame (gframe around the card) or divider (hairline card + gradient strip between art and name).
- Preview iframe body gets zoom = iframe width / window width, so it shows the same columns as the real page in this window.
- Stale tab warning: the credit link carries title="nqpp <build ms>". Copy saves nq_pp_copy {t}. On any page, a textarea holding an older nqpp stamp than the last copy shows a red banner (checkStale).
- Bundle header excludes preview_homepage.phtml and ~petpages.

- Avatar: on open the builder calls NQ.ap.refreshProf (account-drawer refreshProfile, one userlookup fetch) when the cached avatar is over 5 min old. A pasted petpage cannot update its own avatar.

- Age: Quick Ref `age` per pet (25-hud parse) -> account-drawer apCollect stores `born` (timestamp). Pets get it after their account's Quick Ref loads once.

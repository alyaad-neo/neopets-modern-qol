# NOTES: petpage-gen

## What it does

All Pets toolbar "Petpage" button opens #nqPP: a builder that turns the Up for Trade (or picked) pets into copy-paste petpage HTML, with a live preview.

## Type

- Single-file, bundle only (needs `NQ.ap` from account-drawer, so it is bundled right after it). `Neopets - Petpage Builder-1.0.0.js`

## Map

| Feature | Search for |
| --- | --- |
| Colour themes (seeded from the Neomail username hash + Shuffle) | `THEMES`, `hash`, `P.shift` |
| Petpage HTML output | `function build`, `card`, `row` |
| Age text from `born` | `ageText` |
| Builder UI + CSS | `CSS`, `shell`, `render` |
| Prefs per account | `nq_pp_prefs:<user>` (localStorage) |

## Rules for the output

- Inline styles only, no `<style>`, no scripts, no `position`, no rgba (Neopets filters block them in style blocks). Hex colours only; gradients always follow a solid fallback.
- Layout is inline-block cards / tables so nothing depends on flex or grid.
- Images are `pets.neopets.com/cpn/<name>/1/7.png`, so they stay current with customisation.

## Data

- Age: Quick Ref `age` per pet (25-hud parse) -> account-drawer apCollect stores `born` (timestamp). Pets get it after their account's Quick Ref loads once.

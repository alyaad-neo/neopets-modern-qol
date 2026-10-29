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

- Every src/url() must END in an image extension (.png .jpg .gif ...); a ?query makes Neopets refuse to save the page. cleanUrl() strips queries; NEO_IMG requires the extension.
- Outside-host <img src> is rewritten to www.neopets.com/redirect/fansite.phtml?r=... and the save fails (Mis-matched quotes). Outside images cannot be used as <img>.
- Neopets rewrites blocked values to `-blocked-` or silently drops the property. `<style>` blocks, classes and `:hover` survive (filter-test, 2026-10-28).
- Blocked/removed: `font:` shorthand with a slash, leading-dot decimals (`.2px`), CSS gradients, box-shadow, text-shadow, transform, opacity, rgba, backdrop-filter, `border-radius` in %, `background-size`, data: URLs (inline and in style blocks), the `//*{}` prefix, empty `alt=""`, `hspace`/`vspace` on our images.
- Works: font longhands, `font` shorthand without slash, unquoted multi-word fonts (`Trebuchet MS`), decimals with a leading zero (`0.5px`), unitless line-height, negative margins and letter-spacing, hex colours, border-radius in px, background-image url() to images.neopets.com / pets.neopets.com (inline and style block), background-repeat/position/attachment:fixed.
- No transparency is possible in code. Only route to a frosted look: a hosted semi-transparent PNG as background-image (external hosts untested).
- Gradient workaround: rows of solid-colour table cells (title band, gframe borders, strips).
- filter-test.html holds the test rows; rerun it before relying on anything new.

## Status (2026-10-28)

- Reverted to the 5.5.53 design (Duo theme, gradient title band, gradient frames/dividers) at Aly's request. The later editorial redesign, Neopets pattern/scene backgrounds, accent sampling and frosted-glass uploads (commit 2115b16) were removed from the code. Their filter findings stay above in Rules.
- Old saved prefs from the later versions (theme light/warm/dark, etc.) fall back to defaults in loadPrefs.

## Data

- Edit Pet Page (/editpage.phtml?pet_name=X, any pet): a "Build trade petpage" button (#nqPPEdit) is inserted above the largest textarea and opens the builder; floating bottom-right if no textarea is found. Generic selector on purpose (the page markup was never inspected).

- Age: Quick Ref `age` per pet (25-hud parse) -> account-drawer apCollect stores `born` (timestamp). Pets get it after their account Quick Ref loads once.
- Background search: NQ.dtiPage (modern-qol 45-colors). Only images.neopets.com / pets.neopets.com URLs (NEO_IMG).
- Hover: <style> block; img has only HTML width/height; .nqppA/.nqppR/.nqppM:hover enlarge + negative margins to stay centred.
- Preview iframe zoom = iframe width / window width.
- Stale tab warning: credit link title="nqpp <build ms>"; copy saves nq_pp_copy; checkStale banner.
- Bundle header excludes preview_homepage.phtml and ~petpages.


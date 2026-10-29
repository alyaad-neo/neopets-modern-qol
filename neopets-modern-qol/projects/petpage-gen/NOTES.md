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

## Design (1.1, editorial gallery, 2026-10-28)

- Hero: 2-column table. Left: accent bar, big title, intro, Looking for, accent Neomail pill + View lookup link. No art column (mosaic removed as redundant).
- Background sources (P.bgSrc): Patterns (default) = Neopets tiled backgrounds, scraped from /backgrounds_tiled.phtml (141 seamless 200px GIFs on images.neopets.com/backgrounds/, cached in localStorage nq_pp_tiles_v1 for 7 days); output = fixed, repeating CSS background + rounded sheet (P.bgKind tile). Scenes = DTI search, stretched mode below. /backgrounds.phtml full-screen 1024x768 wallpapers exist but only as .zip downloads (JPG not hosted), so unusable without uploading.
- Scene background (P.bgKind scene): Neopets backgrounds max out at 600x600 (DTI sizes 600/300/150; checked). No tiling: one <img> sized to the estimated page height (1700-3200px), centred with text-align:center + margin:0 -9999px, then <br>, then the sheet as an inline-block width:100% pulled up with a negative margin-top. Page colour beyond the image = average image colour (P.bgEdge from pickAccent). Stretching makes it soft; accepted as a backdrop.
- Accent: pickAccent() samples the picked background on a 48px canvas (most saturated hue bin) -> P.bgAcc; otherwise seeded from the username; Shuffle accent overrides. Themes: light / warm / dark page tones only.
- Grid: borderless cards, soft grey image tile, name + year pill, caps species, note in accent; list layout = hairline rows.
- Rejected along the way: gradient frames/bands (Duo), frosted copies and frost tiles (no blur possible; uploads), stretched thumbnails (blocky).

## Data

- Age: Quick Ref `age` per pet (25-hud parse) -> account-drawer apCollect stores `born` (timestamp). Pets get it after their account Quick Ref loads once.
- Background search: NQ.dtiPage (modern-qol 45-colors). Only images.neopets.com / pets.neopets.com URLs (NEO_IMG).
- Hover: <style> block; img has only HTML width/height; .nqppA/.nqppR/.nqppM:hover enlarge + negative margins to stay centred.
- Preview iframe zoom = iframe width / window width.
- Stale tab warning: credit link title="nqpp <build ms>"; copy saves nq_pp_copy; checkStale banner.
- Bundle header excludes preview_homepage.phtml and ~petpages.

## Frosted glass (1.2)

- Outside hosts: <img src> from other sites is rewritten to fansite.phtml and the save fails; CSS background-image url() from other sites survives (Neopets rewrites https to http; browsers auto-upgrade, image loads). Tested 2026-10-28.
- makeGlass(): one 1920x2880 JPG. Top 1440 = background blurred (patterns tiled first, scenes cover-scaled) and slightly toned; bottom 1440 = same blur under a 74% white (or dark) layer = glass. Downloads; preview uses a local blob URL (never in the copied code).
- User uploads to postimg, pastes the Direct link (P.glass, must end .jpg/.png; P.glassFor ties it to P.bg). Page: outer div background = image, fixed, center 0. Sheet: same image, fixed, center -1440px, so the glass half lines up with the backdrop.
- Screens taller than 1440px show the glass half below the backdrop; wider than 1920 show P.bgEdge.

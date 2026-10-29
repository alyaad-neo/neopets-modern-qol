# HANDOFF: petpage builder (petpage-gen)

Read `AGENTS.md`, then `projects/petpage-gen/NOTES.md` (feature map, every confirmed Neopets filter rule, design history). This file is only the current state.

## Where it stands (bundle 5.5.62, petpage-gen 1.2.0, committed in this handoff)

- All Pets toolbar has a **Petpage** button (account-drawer) that opens the builder (`projects/petpage-gen/`, bundled right after account-drawer, reads `NQ.ap`).
- The builder outputs paste-ready petpage HTML. Design: "editorial gallery": big title, intro, Looking for, accent Neomail pill + View lookup, a count/sort rule, and borderless pet cards (grey tile, name + Neopian year pill `Y28`, caps species, note in the accent colour). Hover zoom via a `<style>` block. Credit `CSS BY ALYAAD` at the bottom.
- **Background** section: Patterns (Neopets tiled backgrounds, scraped from `/backgrounds_tiled.phtml`, fixed + seamless) or Scenes (Dress to Impress search, Neopets-hosted only). The accent colour is sampled from the picked background.
- **Frosted glass:** "Make frosted backdrop" renders one 1920x2880 JPG (blurred backdrop on top, glass layer below) and downloads it. The preview shows it at once. Aly uploads it to postimg and pastes the Direct link; then the page uses it as a fixed background and the sheet uses the glass half, aligned.
- Stale-tab warning, preview zoom matching the real column count, and the `preview_homepage.phtml` exclude are all in place.

## Not verified yet

- Frosted glass end to end on a real petpage: upload to postimg, paste the link, save, view. Outside-site CSS backgrounds passed the host test, but this exact image hasn't been saved on a petpage.
- The pattern list scrape runs on the real site only (the local test used a seeded copy).
- Aly's last design reaction is pending (the frosted preview looked right in testing).

## Open ideas Aly raised

- She wants it to look impressive and professional, not amateur. She liked the frosted look best. Keep the content crisp and the effects subtle.
- Full-screen Neopets wallpapers (`/backgrounds.phtml`, 1024x768) exist only as .zip downloads; the builder could unzip one and feed it to "Make frosted backdrop" for higher-quality scenes.

## Gotchas

- Every `src`/`url()` must END in an image extension; a `?query` makes Neopets refuse the save (`cleanUrl()`).
- Never use `<img>` for outside-hosted images (rewritten to `fansite.phtml`; save fails).
- Heredocs mangle backslashes on this machine; write regex edits with the Edit tool.
- Another chat may be editing modern-qol at the same time: the bundle build can hit a locked dist file (just rerun), and someone else may already have bumped `@version` (check before bumping).
- Test page for the builder: a local server serving the builder with a stub `NQ` (see NOTES). The built-in browser can read Neopets pages (images.neopets.com allows CORS).

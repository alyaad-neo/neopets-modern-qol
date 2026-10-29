# HANDOFF: petpage builder (petpage-gen)

Read `AGENTS.md`, then `projects/petpage-gen/NOTES.md` (feature map, every confirmed Neopets filter rule, design history). This file is only the current state.

## Where it stands (bundle 5.5.64, petpage-gen 1.2.2)

- Edit Pet Page (`/editpage.phtml?pet_name=…`) gets a "Build trade petpage" button above its main textarea that opens the builder. Tested on a stand-in page only; the real page's markup was never inspected.

- All Pets toolbar has a **Petpage** button (account-drawer) that opens the builder (`projects/petpage-gen/`, bundled right after account-drawer, reads `NQ.ap`).
- The design is back to the 5.5.53 version, Aly's choice: Duo theme (white/black, gradient only in the title band and card borders), gradient frame or gradient divider option, Neopian year pill (`Y28`), hover zoom via a `<style>` block, `CSS BY ALYAAD` credit, stale-tab warning, and preview zoom.
- Removed again: the editorial redesign, the background picker (Neopets patterns and Dress to Impress scenes), accent sampling, and frosted-glass uploads. They live in commit 2115b16 if ever wanted back.
- `loadPrefs` resets theme/font/size values the old design doesn't know (saved by the later versions).

## Not verified yet

- The restored 5.5.53 output was last checked on a real petpage before the hover/notes fixes; worth one more save-and-view.

## Gotchas

- Every `src`/`url()` must END in an image extension; a `?query` makes Neopets refuse the save.
- Never use `<img>` for outside-hosted images (rewritten to `fansite.phtml`; save fails). Outside CSS backgrounds do survive.
- Heredocs mangle backslashes on this machine; write regex edits with the Edit tool.
- Another chat may be editing modern-qol at the same time: the bundle build can hit a locked dist file (just rerun), and someone else may already have bumped `@version` (check before bumping).

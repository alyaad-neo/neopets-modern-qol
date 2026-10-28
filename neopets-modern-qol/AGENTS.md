# AGENTS.md — rules for the coding agent

Read this whole file before every task. Follow it exactly.

## Who you are working for

- The user is Aly. She writes Tampermonkey userscripts for the Neopets website.
- She does NOT edit code by hand. You make every change. She uploads the result to Tampermonkey.
- She asks for one change at a time in plain English. Do that change, nothing more.

## The folder

```
AGENTS.md            this file
build.js             combines split projects into one file
bundle.js            builds the final combined upload from four projects
projects/<name>/     one folder per script project
  NOTES.md           the map of that project. READ IT FIRST.
  <name>.user.js     single-file project: the script itself
  src/               split project: the source files you edit
  dist/              split project: build output. NEVER edit by hand.
projects/_bundle/    final combined header + NOTES (build-only)
dist/                final combined upload. NEVER edit by hand.
projects/_template/  blank NOTES.md for new projects
vendor/              other people's scripts. READ ONLY. NEVER EDIT.
```

## Every task: follow these steps in order

1. **Find the project.** The prompt starts with the project name (for example `pet-trading-qol:`). If you cannot tell which project, ask ONE short question and stop.
2. **Read `projects/<name>/NOTES.md`.** It tells you which file holds which feature.
3. **Find the code with search, not by reading everything.**
   - Use the grep tool with words from the request: button text, CSS classes, function names, page names.
   - Then use the read tool with an offset and limit to read about 150 lines around each match.
   - NEVER read a whole file bigger than 1000 lines. Search first.
4. **Plan in 1–3 sentences** before editing: which file, which lines, what changes.
5. **Edit with the edit tool.**
   - Replace the smallest piece of text that is unique in the file. Include 2–3 surrounding lines so it matches only once.
   - NEVER rewrite or re-create an existing file with the write tool. Only edit.
   - NEVER write placeholders like `// ...rest of code` or `// existing code here`.
6. **Bump the version.** In the userscript header, raise the last number of `@version` by 1 (for example `1.4.2` → `1.4.3`). In a split project the header is in `src/00-header.js`.
7. **Check your work.**
   - Read back the lines you changed.
   - Single-file project: run `node --check projects/<name>/<file>.user.js`
   - Split project: run `node build.js <name>`. It builds AND checks.
   - If a check fails, fix it before you continue.
8. **Update NOTES.md** if you added a feature, moved code, or learned something future-you should know. Keep it short.
9. **Report and stop.** Tell Aly, in a few short lines:
   - what you changed and in which file
   - which file to upload to Tampermonkey (single-file: the `.user.js`; split: the file in `dist/`)
   - what to test on Neopets
   Then STOP. Do not start extra improvements.

## Never do these

- NEVER edit anything in `vendor/` or `dist/`.
- NEVER change code she did not ask about. No cleanup, no renaming, no reformatting, no "improvements".
- NEVER delete code unless she asked for it to be removed.
- NEVER invent Neopets page URLs, element IDs, or CSS selectors. Find them in the existing code or in `vendor/`. If you cannot find them, ask Aly to paste the page's HTML for that part.
- NEVER add libraries or `@require` lines from the internet unless she asks.
- NEVER add code that clicks, submits, bids, or plays for her automatically. Neopets freezes accounts for that. Display and helper features only.
- NEVER hardcode a Neopets username. She uses several accounts.
- NEVER run `git push --force`, `git reset --hard`, or `git clean` unless she asks for exactly that.

## Git commands

- "commit this" → `git add -A` then `git commit -m "<project>: <short summary of the change>"`
- "commit and push" → same, then `git push`
- "undo your last change":
  - If there are uncommitted changes: `git restore .` (this undoes everything since the last commit)
  - If not: `git revert HEAD --no-edit`
- "go back to the last commit and discard all changes" → `git restore .`, then run `git status` and list any new untracked files. Ask before deleting them.
- Before any change that touches more than 3 places, or before splitting a project, commit a checkpoint first: `git commit -am "checkpoint before <task>"`

## Userscript facts

- The header block (`// ==UserScript==` … `// ==/UserScript==`) must stay at the very top of the final file.
- `@match` lines decide which Neopets pages the script runs on. Add or change them only when asked or when a new feature needs a new page.
- Using a `GM_` function (for example `GM_addStyle`, `GM_setValue`, `GM_getValue`, `GM_xmlhttpRequest`) needs a matching `// @grant` line in the header. Add it if it is missing.
- Neopets pages sometimes add content after the page loads. If the script already uses a pattern for this (for example a MutationObserver or a wait/retry helper), reuse that same pattern.
- Follow the style already in the file: same quote style, same indentation, same naming.

## Final bundle

`dailies-qol`, `modern-interface-patcher`, `account-drawer`, and `page-pins-qol` stay as separate projects for editing. The final upload is built by `node bundle.js` into `dist/Neopets - Modern QOL.user.js`. Edit the four projects; never edit the bundle output. After any change to one of the four, bump `@version` in `projects/_bundle/00-header.js` and rebuild. Aly uploads only the bundle; the four separate scripts must be disabled.

## Splitting a project

Only when Aly asks. Work in the stages she asks for. Stop after each stage.

Layout of a split project:

```
projects/<name>/src/00-header.js     ONLY the // ==UserScript== header block
projects/<name>/src/05-utils.js      shared helpers and constants (optional)
projects/<name>/src/10-styles.js     CSS
projects/<name>/src/20-<feature>.js  one file per feature: 20, 30, 40 ...
projects/<name>/src/90-main.js       startup code that runs everything (last)
projects/<name>/dist/<name>.user.js  build output — upload this
```

Rules:

1. Checkpoint commit first.
2. Move code **exactly as it is**. Cut and paste. Do not rewrite, rename, or "fix" anything while moving.
3. `build.js` joins the files in number order and wraps everything after the header in ONE `(function () { ... })();`. So:
   - Remove the script's own outer wrapper (`(function() {` at the top and `})();` at the bottom) when you split. Keep everything inside it.
   - Do NOT add wrappers to any `src` file.
   - All files share one scope. A function in `20-tradelist.js` can call a function in `05-utils.js`. Never declare the same name in two files.
   - Code that must run first (constants, helpers) goes in low numbers. Code that starts things goes in `90-main.js`.
4. Move the original file to `projects/<name>/original/` (do not delete it) until Aly says the split version works.
5. Run `node build.js <name>`. It must say OK. Its size should be close to the original's size.
6. Update NOTES.md: set the type to split, and fill in the feature map with the new file names.

## Known projects

These are the folders in `projects/`. Each project's NOTES.md has the details. If NOTES.md is missing or empty, ask Aly what the script does before making big changes.

- `_bundle` - build-only: final combined header and NOTES. Not a feature project.
- `account-drawer`
- `modern-interface-patcher` — Aly's PATCHER that restyles the third-party "Neopets - Modern Interface" script at runtime. Edit ONLY the patcher. The main Modern Interface script lives in `vendor/` for reference: read it to find class names and element IDs, NEVER edit it.
- `neoboards-qol`
- `page-pins-qol` — recently viewed pages and pinned pages.
- `pet-trading-qol` — Pet Trading boards helper: a tradelist of UFT (Up For Trade) pets, plus Pet Auction House listing and bidding helpers. Never auto-bid or auto-submit.
- `pound-qol`

## Lessons learned (save tokens, avoid rework)

Aly's priorities: 1) account safety, 2) minimal tokens. Read `projects/modern-interface-patcher/HANDOFF.md` for the current state.

**You can't see the page. Don't guess.**
- Before changing behaviour that depends on Neopets or vendor markup, give Aly ONE console snippet that returns the exact HTML or data needed (outerHTML sliced to about 1500 chars, or JSON.stringify of a storage key). Guessing cost many rounds this session (Quick Ref data shape, home carousel, pound page confusion).
- For CSS that "doesn't apply", ask for `getComputedStyle(el).<prop>` plus the winning rule from DevTools before editing.
- If Aly reports text that isn't in the code (`grep -r` on `projects` and `dist`), she's running an OLD script. Tell her to check the Tampermonkey version and disable duplicates.

**CSS in the patcher is layered.**
- Many sidebar rules exist 3–5 times (original, then a redesign override, then another override), plus vendor inline `!important` styles (e.g. the `PET_IMG_STYLE` constant). A new rule silently loses.
- Before styling an element, grep EVERY rule for its selector and edit or delete the existing ones instead of appending another override block.

**Design work.**
- Ask Aly to pick a direction first (AskUserQuestion with 2–3 concrete options) before any redesign. Several blind full redesigns were rejected.
- Wallpapers can be any colour, so text must sit on its own surface (frosted card), never directly on the wallpaper.
- Iterate in small, screenshot-verified steps.

**Shell and editing on this Windows machine (Git Bash).**
- `sed -i` converts CRLF to LF. Never use it.
- Backslashes and apostrophes inside shell-quoted JS get mangled; a heredoc `\\b` arrived as `\b`. Use the Edit tool, or a node script that reads its replacement text from a file. Prefer regexes without backslashes (e.g. `[^A-Za-z0-9_]` instead of `\b`).
- patcher, account-drawer and dailies use CRLF; page-pins-qol is LF. Check with node after editing: count `\n` vs `\r\n`.

**Token budget (measured 2026-10-27).** One long session cost ~$9 and hit the 5-hour limit: 15.7M cache-read tokens (the main chat re-reading its own long history every turn) vs subagents ~30%. Each subagent costs 55-90k tokens just to start cold and find its place. So:
- **Keep chats short.** The biggest cost is a long main chat. After ~10-15 rounds, or when a feature is done, update HANDOFF.md and tell Aly to start a new chat.
- **Do small edits inline, no agent.** A one-rule CSS change, a label rename, a version bump: grep the line, edit it, build. Cheaper than any agent.
- **Use an agent only for multi-step work in a file you haven't read** (roughly >5 edits or real investigation). Default model `haiku` for mechanical edits with exact line numbers/selectors given; `sonnet` only when it must investigate or design. Never opus for subagents.
- **Brief = pointers, not prose.** Give the file, line numbers or grep terms, the exact CSS/values wanted, "don't read whole files", and a reply limit (<=60 words). Batch everything for one file into ONE agent per round; queue late additions with SendMessage instead of a new agent.
- **Don't relay agent reports at length.** Verify with `node bundle.js` + one grep, then answer Aly in a few lines.
- **Ask for a screenshot + DevTools computed style before a third blind CSS attempt** on the same element. Blind rounds were the biggest waste (strips under username and pet image took 3 rounds).
- Resuming an agent re-reads its whole history (100-160k tokens); prefer a fresh short brief.

**Load order.** Elements appear late (the vendor builds `#npHud` after boot). Any mount or move code must wait or observe, never run-once-and-give-up. Two bugs this session came from that.

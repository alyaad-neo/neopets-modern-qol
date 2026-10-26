# NOTES: neoboards-qol

Keep this file short. It is the map the agent reads before every task.

## What it does

Neopets Neoboards helper: removes the old formatting buttons, adds a scrollable smiley grid, and a live preview box under the message textarea (title + body).

## Type

- Single-file. Edit and upload: `Neopets - Neoboards Tweaks-1.0.0.js`

## Pages it runs on

- `*://*.neopets.com/neoboards*` — runs on all Neoboards pages (reply and create topic)

## Feature map

| Feature | File | Search for (function names, CSS classes, button text) |
| --- | --- | --- |
| CSS styles | lines 23–36 | `.npNbSmilies`, `.npNbPreview`, `.npNbPreviewBody` |
| Smiley list | lines 44–101 | `NB_SMILIES` (180+ entries: emoticons, neopet species, regions, items, holidays) |
| Reply/setup | lines 104–168 | `setupNeoboardReply`, `.topicReplyContainer`, `.topicCreateContainer`, `textarea[name="message"]` |
| Smiley grid | lines 112–129 | `npNbSmilies`, `button[data-code]`, `insertSmiley` |
| Live preview | lines 131–167 | `npNbPreview`, `npNbPreviewTitle`, `npNbPreviewBody`, `codeRe` regex |
| Polling mount | lines 171–178 | `tries`, `iv` (100ms poll, 100 tries = 10s), `DOMContentLoaded` |
| MutationObserver fallback | lines 181–184 | observes `document.documentElement` for re-rendered reply form |

## Depends on

- `unsafeWindow.insertSmiley` — tries to call Neopets' built-in smiley inserter first, falls back to manual text insertion
- No `@grant` lines needed (all standard DOM APIs)

## Don't touch

- `NB_SMILIES` array (lines 44–101): 180+ Neopets smiley codes mapped to image filenames. Do not modify unless explicitly requested.
- Polling interval (100ms × 100 tries = 10s): balances responsiveness with performance.
- `codeRe` regex built from `NB_SMILIES` sorted by length descending (longest codes first to avoid partial matches).

## Lessons learned

<!-- Add notes here as they come up. -->

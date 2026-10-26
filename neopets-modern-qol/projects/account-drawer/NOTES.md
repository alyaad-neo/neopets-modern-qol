# NOTES: account-drawer

Keep this file short. It is the map the agent reads before every task.

## What it does

Neopets account switcher: lists your accounts in a draggable drawer, lets you pick a main account (☆), syncs accounts from NeoPass, and swaps sessions. Works alongside the Modern Interface patcher (modern mode) or standalone (floating button).

## Type

- Single-file. Edit and upload: `Neopets - Accounts Drawer-1.0.0.js`

## Pages it runs on

- `*://*.neopets.com/*` — excluded: root, index, login/logout, neopass, signin, popup pages, ncmall

## Feature map

| Feature | File | Search for (function names, CSS classes, button text) |
| --- | --- | --- |
| CSS styles | lines 62–145 | `#nppAcctDrawer`, `#nppAcctTab`, `#nppAvatar`, `#npLogoutBtn`, `#npSwapBtn` |
| Storage keys/constants | lines 46–51 | `MAIN_KEY`, `ACCTS_KEY`, `MAN_KEY`, `NP_KEY`, `PROF_KEY`, `DIRTY_KEY` |
| Account list helpers | lines 154–172 | `readAccts`, `writeAccts`, `noteAccount`, `seenAccounts`, `readNP`, `readManual`, `allAccts` |
| Avatar cache | lines 175 | `readProf` |
| NeoPass sync | lines 178–206 | `parseNeoPass`, `neoPassFetch`, `syncNeoPass` |
| Swap session | lines 209–234 | `swapAccount`, `clearNotifCaches` |
| Drawer build/wire | lines 244–399 | `buildDrawer`, `wireDrawer`, `nppAcctRow`, `nppAcctStar`, `nppAcctX` |
| Modern mode mount | lines 402–461 | `mountModern`, `#npUser`, `#nppAcctTab`, `#nppAvatar`, `#npLogoutBtn`, `#npSwapBtn` |
| Standalone mode mount | lines 463–490 | `mountStandalone`, `#nppStandaloneAcct`, `#nppStandaloneAcctToggle` |
| Avatar updater | lines 492–516 | `updateAvatar`, `#nppAvatar`, `nppAvInit` |
| Profile fetch & cache | lines 519–569 | `pickProfImgs`, `profFromFrame`, `refreshProfile`, `maybeRefreshProfile` |
| Settings watcher | lines 570–583 | `watchSettingsForAvatar`, `markProfDirty` |
| Boot | lines 586–595 | `mount`, `npp:main`, `npp:drawer` |

## Depends on

- `unsafeWindow` — access to Neopets globals (`appInsightsUserName`)
- `GM_xmlhttpRequest` + `@connect account.neopets.com` — NeoPass sync
- `localStorage` — all state (accounts, main account, profile cache)
- Modern Interface patcher's `#npUser` card (for modern mode); falls back to standalone

## Don't touch

- The CSS is duplicated so standalone mode works without the core. When the core is installed, its copies of the same selectors win (higher specificity).
- `MODE` detection (line 237–240): checks for `#npUser` to decide modern vs standalone.
- `swapAccount` opens a new window to logout.phtml — never auto-logs in.
- Profile fetch uses a hidden iframe fallback when the direct fetch fails (403 or CORS).

## Lessons learned

<!-- Add notes here as they come up. -->

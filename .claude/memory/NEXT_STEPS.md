# Next steps

_Updated 2026-09-23_

## Now
- Nothing pending; waiting for the next task.

## Not planned (decided — see DECISIONS.md)
- No further `index.html` extractions.

## Optional, only if asked
- Sheets use `max-height:93%`: on light theme a tall sheet may come close to the
  status bar on small iPhones (not checked).
- Installed PWA: `black-translucent` status-bar meta keeps its icons white; iOS
  can't switch it at runtime (the Expo app is fixed).
- Harden the `sync-html.js` leftover check (see ISSUES.md).
- Remove unused `STD_DAY_HOURS` / `shiftMix` in `engine.js` (separate cleanup task).
- Motion audit leftovers left by the user (see DECISIONS.md): A12 paint pop cut
  by the full re-render; B3 theme switch fades the page while cards snap.

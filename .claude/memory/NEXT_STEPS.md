# Next steps

_Updated 2026-09-23_

## Now
- Phone check of v4.31 (iPhone): type in a sheet field (shift name, bonus,
  salary), tap +/−, a toggle or an icon → the keyboard should stay up and typing
  continue; Save/Cancel/Done should still close it. Android now keeps the
  keyboard up too.
  - If iOS still drops it (the old field is removed and the rebuilt one focused
    in the same tap): `keyboardDisplayRequiresUserAction={false}` on the WebView
    in `mobile/App.js`.

## Not planned (decided — see DECISIONS.md)
- No further `index.html` extractions.

## Optional, only if asked
- Harden the `sync-html.js` leftover check (see ISSUES.md).
- Remove unused `STD_DAY_HOURS` / `shiftMix` in `engine.js` (separate cleanup task).
- Motion audit leftovers (decided, not fixed):
  - A11b: a sheet reopened within 260 ms of closing jumps to hidden first (rare; needs new code).
  - A12: paint pop cut by the full re-render — left by the user (barely visible).
  - B3: theme switch fades the page 0.3 s while cards snap — left, the user sees no problem.
  - Tapping the dim during a drag-dismiss still snaps the dim.

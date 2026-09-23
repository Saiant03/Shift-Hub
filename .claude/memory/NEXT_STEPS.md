# Next steps

_Updated 2026-09-23_

## Now
- Nothing pending; waiting for the next task.

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

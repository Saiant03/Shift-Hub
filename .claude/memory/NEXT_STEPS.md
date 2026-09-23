# Next steps

_Updated 2026-09-23_

## Now
- Phone check of v4.32–v4.33: Cancel on a sheet, then at once tap another
  shift → the new sheet rises from where the old one was (no drop). Swipe a
  sheet down, then at once tap the dim → the dim keeps fading.

## Not planned (decided — see DECISIONS.md)
- No further `index.html` extractions.

## Optional, only if asked
- Harden the `sync-html.js` leftover check (see ISSUES.md).
- Remove unused `STD_DAY_HOURS` / `shiftMix` in `engine.js` (separate cleanup task).
- Motion audit leftovers left by the user (see DECISIONS.md): A12 paint pop cut
  by the full re-render; B3 theme switch fades the page while cards snap.

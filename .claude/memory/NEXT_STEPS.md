# Next steps

_Updated 2026-09-23_

## Now
- User phone check of v4.22–v4.25 (Reduce Motion sheets, spring-back + close,
  dialog Cancel → reopen, Edit brush bar scroll).

## Not planned (decided — see DECISIONS.md)
- No further `index.html` extractions.

## Optional, only if asked
- Harden the `sync-html.js` leftover check (see ISSUES.md).
- Remove unused `STD_DAY_HOURS` / `shiftMix` in `engine.js` (separate cleanup task).
- Deferred motion-audit findings (confirmed, not fixed):
  - A6: pressing an open (swiped) shift row — `.swipe .front:active` overrides its offset.
  - A7: `renderSheetUpdate` drops focus from a sheet text field (keyboard drops on iOS).
  - A9: selection ring snaps on rapid taps (animates from the last target, not its position).
  - A10: calendar grid resizes when the day card wraps (small phones).
  - A11: a sheet closed during its entrance / reopened during its exit jumps first.
  - A12: paint pop cut by the full re-render (low visibility).
  - Tapping the dim during a drag-dismiss still snaps the dim.
  - B1 Today has no month slide; B2 sub-sheet height snaps; B3 theme switch half-fades;
    B4 delete from the editor has no row collapse; B5 Edit repeat panel double press;
    B6 `.shine` sweep only while pressed.
  - C1: onboarding aurora + opaque chips with `backdrop-filter` (cost unmeasured).

# Next steps

_Updated 2026-09-23_

## Now
- v4.31 keyboard fix — proposed, awaiting the user's approval:
  - Problem (iPhone): typing in a sheet field (shift name, bonus, holiday name,
    salary), then tapping +/−, a toggle or an icon closes the keyboard; the
    command itself applies.
  - Cause: on a real tap the field loses focus at `mousedown`, before `click`,
    so v4.27's focus restore in `renderSheetUpdate` finds nothing to restore.
    Seen in Chromium with CDP touch; the v4.27 test used `element.click()` and
    missed it.
  - Fix: one document `mousedown` listener in `index.html` — when a text field in
    `#sheet` is focused and the target is a `[data-action]` control in `#sheet`
    (not an input/textarea/label), prevent the default (the focus move); the click
    still runs and v4.27 refocuses the rebuilt field. Verified in a scratch copy:
    focus kept after +, icon and toggle; Save/Cancel still close and blur.
    Also changes Android: the keyboard stays there too.
  - Test: rewrite the v4.27 focus test with real CDP taps (red on v4.30).
  - Phone check needed. If iOS still drops the keyboard (the old field is removed
    and the new one focused in the same tap), next step: `keyboardDisplayRequiresUserAction={false}`
    on the WebView in `mobile/App.js`.

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

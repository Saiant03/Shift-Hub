# Current state

_Updated 2026-09-23 · v4.41_

## Project
- Shift Hub v4.41 on `main`; `node test.mjs` = 104/104.
- v4.33 verified on the phone (Expo WebView). v4.21 also verified as PWA (offline).

## Just finished
- Motion audit fixes, one commit per group, tests red on the old code first:
  v4.22–v4.25 (round 1: Reduce Motion, dialog race, brush bar scroll, spring-back);
  v4.26 press states (open row, repeat panel), v4.27 sheets keep the focused field,
  v4.28 calendar (ring from its position, Today slide, 2-line day card on short
  narrow screens), v4.29 sheets (close mid-entrance, height morph, editor delete
  collapses), v4.30 shimmer removed, no blur behind onboarding chips.
- v4.31: a tapped sheet control no longer takes focus from the field being typed
  in (document `mousedown` preventDefault in `index.html`); the v4.27 focus test
  now uses real CDP taps (red on v4.30).
- Motion audit leftovers closed: v4.32 a sheet opened while the previous one
  is still closing rises from where it is (A11b); v4.33 tapping the dim during
  a swipe-dismiss no longer snaps it (`closeSheet` ignores an already-closed sheet).
  The press-state test helper now waits 400 ms (it was racing a 0.2 s transition).

## In progress
- 5-task HUB/iOS batch (plan agreed via Q&A, one commit each): v4.34 HUB month
  swipe slides the pay card + counts old→new pay (phone-verified); v4.35 shift reorder:
  hold ~450 ms + drag (`ro` gesture, touchmove claim on `#shiftlist` only); v4.36
  its limits: hidden Move up/down buttons (`.srbtn`, `moveShift`) for VoiceOver and
  edge auto-scroll while dragging (v4.35–v4.36 phone-verified); v4.37 extra earnings
  get their segment in the composition bar (phone-verified); v4.38 the bar shows 4
  pay groups (base accent, `OT_COLOR` blue, `PREM_COLOR` violet, `EXTRA_COLOR` green)
  (phone-verified); v4.39 the separate KPI card is gone: bar + effective-net line sit
  in the Pay breakdown card, whose summary rows (colored dots) are the bar's key, so
  each amount shows once (phone-verified); v4.40 `.screen` starts at
  `top: env(safe-area-inset-top)` (was only padding, so scrolled content passed under
  the clock) + 12 px top fade; test emulates the inset via CDP
  `Emulation.setSafeAreaInsetsOverride` (phone-verified); v4.41 native status bar:
  `applyAppearance` posts `bar:light|dark` (Auto resolved via matchMedia, live on
  system change, once per change), App.js `<StatusBar style>` light theme → dark icons
  (light/dark phone-verified; Auto needed `userInterfaceStyle: automatic` in
  app.json, not yet phone-checked).

## Working pattern that proved reliable
- Audit/plan first (boundary, dependencies, load-time code, tests), wait for
  approval, then implement exactly the plan, verify, commit one task, push `main`.
- Tests first (red on the old code), then the fix, then the full suite.
- Gesture/focus tests must use real CDP touch taps, not `element.click()`:
  click() skips pointerdown/mousedown, which is where focus moves on a tap.
- The user verifies each release on the phone (`npm run tunnel`, sync line
  shows the payload size in chars) before the next stage starts.

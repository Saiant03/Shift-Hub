# Current state

_Updated 2026-09-23 · v4.31_

## Project
- Shift Hub v4.31 on `main`; `node test.mjs` = 87/87.
- v4.30 verified on the phone (Expo WebView). v4.31 (keyboard fix) not yet
  checked on the phone. v4.21 also verified as PWA (offline).

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

## In progress
- Nothing. v4.31 awaits the phone check (NEXT_STEPS.md). No uncommitted work.

## Working pattern that proved reliable
- Audit/plan first (boundary, dependencies, load-time code, tests), wait for
  approval, then implement exactly the plan, verify, commit one task, push `main`.
- Tests first (red on the old code), then the fix, then the full suite.
- Gesture/focus tests must use real CDP touch taps, not `element.click()`:
  click() skips pointerdown/mousedown, which is where focus moves on a tap.
- The user verifies each release on the phone (`npm run tunnel`, sync line
  shows the payload size in chars) before the next stage starts.

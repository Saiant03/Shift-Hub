# Current state

_Updated 2026-09-23 · v4.41_

## Project
- Shift Hub v4.41 on `main`; `node test.mjs` = 104/104.
- v4.41 verified on the phone (Expo WebView); PWA offline checked at v4.40.

## Just finished (HUB/iOS batch, v4.34–v4.41, all phone-verified)
- v4.34 HUB month swipe: pay card slides in + counts old→new pay.
- v4.35–v4.36 shift reorder: hold ~450 ms + drag (`ro`), hidden Move up/down
  buttons for VoiceOver (`moveShift`), edge auto-scroll.
- v4.37–v4.39 pay breakdown: one card; 4-group composition bar (base accent,
  `OT_COLOR`, `PREM_COLOR`, `EXTRA_COLOR`) whose summary rows carry the color key;
  the separate KPI card is gone.
- v4.40 `.screen` starts at the top safe-area inset (scrolled content no longer
  passes under the clock); tested via CDP `Emulation.setSafeAreaInsetsOverride`.
- v4.41 native status bar follows the theme on screen (`bar:light|dark` → App.js
  `expo-status-bar`); Auto works after `userInterfaceStyle: automatic` (app.json).

## In progress
- Nothing. No uncommitted work.

## Working pattern that proved reliable
- Audit/plan first (boundary, dependencies, load-time code, tests), wait for
  approval, then implement exactly the plan, verify, commit one task, push `main`.
- Tests first (red on the old code), then the fix, then the full suite.
- Gesture/focus tests must use real CDP touch taps, not `element.click()`:
  click() skips pointerdown/mousedown, which is where focus moves on a tap.
- The user verifies each release on the phone (`npm run tunnel`, sync line
  shows the payload size in chars) before the next stage starts.

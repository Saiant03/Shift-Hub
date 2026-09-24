# Current state

_Updated 2026-09-24 · v4.47_

## Project
- Shift Hub v4.47 on `main`; `node test.mjs` = 111/111.
- v4.46 verified on the phone (Expo WebView); PWA offline checked at v4.40.

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

- v4.42 Calendar grid no longer shrinks when a week gets its first shift or
  another week is selected: the week line and the day card's badge line keep
  their space when empty (phone-verified).

## Cleanup batch (v4.43–v4.45)
- v4.43 tall sheets stop 12 px below the status bar (`max-height:min(93%, 100% − inset-top − 12px)`).
- sync-html leftover check matches `<script … src=` with other attributes first.
- v4.44 removed unused `STD_DAY_HOURS` / `shiftMix`.
- v4.45 theme switch: no background fade on `.phone` / `.bgwash`.

- v4.46 paint pop (A12) completes across the render at release.

- Test seed race fixed (test.mjs only, no app change); 80/80 repeated reload runs green.

- v4.47 HUB backup nudge: card (no new strings) when there are shifts and no backup in 30 days; tap opens Backup; `markBackup` sets `hubDirty` so it disappears on close. Not yet verified on the phone.

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
- Before a multi-part task, a short Q&A (AskUserQuestion) to confirm choices;
  the user then approves each step and verifies it on the phone.
- The user is not technical: reply in plain Romanian, give copy-paste terminal
  steps one at a time, no jargon.

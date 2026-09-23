# Current state

_Updated 2026-09-23 · v4.30_

## Project
- Shift Hub v4.30 on `main`; `node test.mjs` = 87/87.
- v4.25 verified on the phone (Expo WebView); v4.26–v4.30 in Chromium only —
  phone check pending. v4.21 also verified as PWA (offline).

## Just finished
- Motion audit fixes, one commit per group, tests red on the old code first:
  v4.22–v4.25 (round 1: Reduce Motion, dialog race, brush bar scroll, spring-back);
  v4.26 press states (open row, repeat panel), v4.27 sheets keep the focused field,
  v4.28 calendar (ring from its position, Today slide, 2-line day card on short
  narrow screens), v4.29 sheets (close mid-entrance, height morph, editor delete
  collapses), v4.30 shimmer removed, no blur behind onboarding chips.

## In progress
- Nothing. No uncommitted work.

## Working pattern that proved reliable
- Audit/plan first (boundary, dependencies, load-time code, tests), wait for
  approval, then implement exactly the plan, verify, commit one task, push `main`.
- Tests first (red on the old code), then the fix, then the full suite.
- The user verifies each release on the phone (`npm run tunnel`, sync line
  shows the payload size in chars) before the next stage starts.

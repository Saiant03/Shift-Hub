# Current state

_Updated 2026-09-23 · v4.25_

## Project
- Shift Hub v4.25 on `main`; `node test.mjs` = 76/76.
- v4.21 verified on the phone (Expo WebView) and as PWA (offline);
  v4.22–v4.25 verified in Chromium only — phone check pending.

## Just finished
- Motion audit (Phase 1) and fix round 1, one commit each:
  v4.22 Reduce Motion (sheets never blank, onboarding glow static),
  v4.23 confirm-dialog reopen race, v4.24 Edit brush bar keeps its scroll,
  v4.25 sheet spring-back (no content blink, no stale timers, dim fades on close).
  9 regression tests added; each was red on the old code.

## In progress
- Nothing. No uncommitted work.

## Working pattern that proved reliable
- Audit/plan first (boundary, dependencies, load-time code, tests), wait for
  approval, then implement exactly the plan, verify, commit one task, push `main`.
- Tests first (red on the old code), then the fix, then the full suite.
- The user verifies each release on the phone (`npm run tunnel`, sync line
  shows the payload size in chars) before the next stage starts.

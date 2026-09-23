# Current state

_Updated 2026-09-23 · v4.21_

## Project
- Shift Hub v4.21 on `main`; `node test.mjs` = 67/67.
- Verified on the phone (Expo WebView) and as PWA (offline).

## Just finished
- `index.html` decomposition, closed after a final audit: 8 extracted classic
  scripts (see CLAUDE.md → Files), each moved byte-for-byte and verified by a
  rebuild + `cmp` against the previous commit, the WebView test and a phone check.
- CLAUDE.md synced with that architecture.
- This memory system (`.claude/memory/`).

## In progress
- Nothing. No uncommitted work.

## Working pattern that proved reliable
- Audit/plan first (boundary, dependencies, load-time code, tests), wait for
  approval, then implement exactly the plan, verify, commit one task, push `main`.
- The user verifies each release on the phone (`npm run tunnel`, sync line
  shows the payload size in chars) before the next stage starts.

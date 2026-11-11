# Current state

_Updated 2026-11-11 · No stage in progress or authorized. The stage-by-stage history up to this date is in `archive/stage-history-2026-09-to-11.md`; closed plans and their audits are in `archive/`._

## App
- Web app 2.4 (display `APP_VERSION` 2.4, asset build b95, 2026-11-11): CSS only — calendar day-card two-line reserve 88 px at ≤419×798 (was 84 px at ≤410×780) and calendar header buttons `padding: 8px 8px` at ≤374 px, retuned to Chrome 153 text metrics. Pushed to `main`; awaiting the user's Expo check (no visible change expected on a 390 px iPhone). Previous: 2.3 (b94, 400160b = Cleanup C).
- The approved remediation plan (1.0–1.10), polish stages 2.0–2.2 (incl. the reorder corrective b93) and Cleanup C (2.3) are done and user-verified in Expo on the iPhone; real reminder delivery verified 2026-10-06. The plan is closed.
- Never verified: VoiceOver (except one web onboarding check at 1.4), Android, other platforms.
- Versioning: display 1.0 … 1.9, 1.10, 2.0 … (one step per released phase); asset build `b<N>` only goes up; v4.78 = 1.0 = b79.

## Mobile (Expo wrapper)
- Expo SDK 58: expo ~58.0.23, react-native 0.88.1, react 19.3.0, react-native-webview 14.0.1, expo-* 58.x; `mobile/package-lock.json` is in git (2026-11-11). User-verified in Expo on the iPhone 2026-11-11: app, backup share sheet, reminders, haptics, status bar.
- Run from `mobile/`: `npm install`, then `npm run tunnel` (ngrok). With Expo Go signed in, the CLI needs `npx expo login --no-browser` (ISSUES.md).
- Runs through Expo Go only; no standalone build (no Apple Developer account). A native Xcode/Swift iPhone app is intended later; no stage exists.

## Tests and tooling
- `node test.mjs` = 306/306 (2026-11-11) on the rebuilt container (Playwright 1.63, Chrome 153 at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, symlink `/opt/pw-browsers/chromium`). `test.mjs` finds the `chrome-linux64` build; touch helpers that read state after a CDP `touchMove` wait one frame (`frame()`), since Chrome 153 delivers it on the next frame; the sheet-close and day-card tests no longer compare fixed pixel heights. Chrome 153 rounds `line-height: normal` per ascent/descent (Plus Jakarta Sans 2.071, unchanged since 2023), which is why the 2.4 thresholds moved.
- Skills: 17 in `.claude/skills/` (the only copy; upstreams in `.claude/skills.lock`); the SessionStart hook prints `Skills: 17/17`.
- Session-only tool: impeccable engine (`tool-install-record.md`).

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

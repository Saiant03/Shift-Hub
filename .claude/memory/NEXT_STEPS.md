# Next steps

_Updated 2026-11-24 — FIX_PLAN_2 stages 1–4 (2.36–2.39, b129–b137) done and user-verified in Expo; re-audit of 2.39/b137 done (`FINAL_AUDIT.md` → "Re-audit 2.39 / b137": 450/450, 0 blockers, 1 important R1, 14 minor); merge waits for the user's decision (one more short fix stage recommended)._

## Next
- NEXT (2026-11-24): re-audit of 2.39/b137 done (FINAL_AUDIT.md → "Re-audit 2.39 / b137"): 0 blockers, 1 important (R1: with 100 own shifts, turning paid leave into a normal shift deletes the newest shift on reload), 14 minor. Recommendation: one short fix stage (R1 + R2, R4–R9, R12, R13), then the merge Work → main after the user confirms. Do not start the merge without the user's confirmation. VoiceOver (I8, M13) still deferred.
- Redesign stages 0–7 (2.13–2.32) are done and user-verified in Expo. Build plan `.claude/docs/REDESIGN_BUILD_PLAN.md` is closed; mockups: https://claude.ai/artifact/TfH1wL3s8buHiNF82bA3nE; `.claude/docs/REDESIGN_MOCKUP_SPEC.md` kept for reference.
- 2.11 (b102) Expo hardening user-verified in Expo (2026-11-12), incl. a real reminder (on time, once). The 2026-11 audit is done for the web/Expo build. App Store items belong to the future native Swift app (user, 2026-11-11).
- Before the Swift app (MacBook expected Christmas 2026), user wants: an Apple-style redesign, a more interactive onboarding that teaches the app (concept not decided yet), sick leave (RO first: day 1 unpaid). Proposed: decide design/onboarding via mockups, build them in SwiftUI rather than twice; then a Swift handoff spec (engine rules, backup format, screens). Pay engine stays net-based (DECISIONS 2026-11-16). Nothing approved yet.

## Deferred (not chosen 2026-11-11 — not done)
- Onboarding stagger/aurora (G3): kept as is (user, 2026-11-11). Reduced-motion fades and `theme-color`/manifest per theme: not chosen. Proposal text: `archive/POLISH_PROPOSAL.md`.
- Sick leave (see "Not planned").

## Closed without work (reopen only if a problem is reported)
- Cleanup candidates kept in 2.3 as uncertain (dark tokens written once, shared icon-tile class, per-declaration pruning under Soft UI `!important`, `.bgwash`, `body.pwa` rules): see Stage 2.3 in `archive/stage-history-2026-09-to-11.md`.
- Reorder/swipe follow-ups (variable-height pitch, re-grab during settle, SW_STALE/SW_V tuning).

## Not planned (decided — see DECISIONS.md)
- No further `index.html` extractions.
- PWA status-bar style stays as it is.
- Standalone build (EAS/TestFlight) until the user buys an Apple Developer account. A native Xcode/Swift app is intended later (no stage yet).
- Sick leave (medical days), worldwide: user marks sick days, pay computed per each country's law (all 34 presets, not only RO). Needs a research pass per country first. Open points: the app is net-based while most laws use gross averages (RO: gross average of last 6 months, rate by duration, employer vs. fund days); some countries have no national rule (US, CA, CH, AE) → mark-only or clearly labelled estimate. Not started.

## Handoff facts
- `ONLY=<substring> node test.mjs` filters tests; the full suite takes ~15 min; date-dependent tests use `s8open`; Chromium touch emulation snaps taps to nearby clickables (test hit areas with `elementFromPoint`, see `t9zone`). Delegates must not commit or push; the coordinator reviews, verifies and delivers.
- Expo: `npm install`, then `npm run tunnel` in `mobile/` (ngrok; Expo CLI login needed while Expo Go is signed in — see ISSUES); if ngrok fails in a Codespace, `npm run codespace` (port 8081 Public).
- Delivery: directly to `main` under the standing permission (CLAUDE.md); stop after each stage for the user's phone verification. The redesign lives on `Work` until the user approves the merge; docs also go to `main`.
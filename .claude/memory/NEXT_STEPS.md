# Next steps

_Updated 2026-11-11 — active plan: `PLAN.md` (approved 2026-11-11): 2.5 UI details A → 2.6 UI details B → 2.7 touch targets → 2.8 year summary, one stage at a time with the user's Expo check in between. Anything outside it needs the user's decision._

## Next
- User's Expo check of 2.8 (b99, pushed 2026-11-11): Settings shows 2.8; HUB → Income history → "Total 2026 ›" opens the year sheet; ‹ › changes the year; figures plausible next to the HUB months (the year total can differ by 1 from adding the rounded month figures).
- After that `PLAN.md` is complete; anything further needs the user's decision (see Deferred).

## Deferred (not chosen 2026-11-11 — not done)
- Polish not chosen: ring/tab-pill durations, onboarding stagger/aurora (G3), haptics with Reduce Motion and reduced-motion fades (G5), `theme-color`/manifest, native `#0F0F13` background. Proposal text: `archive/POLISH_PROPOSAL.md`.
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
- Delivery: directly to `main` under the standing permission (CLAUDE.md); stop after each stage for the user's phone verification.
- Facts from 1.0 checks: the SW caches Google Fonts CSS + font file at runtime in the current cache; icon.png has ~4400 light pixels outside the maskable safe circle — not changed.

# Next steps

_Updated 2026-11-12 — no active plan. Done and user-verified: deferred-items plan 2.5–2.8 (`archive/DEFERRED_ITEMS_PLAN.md`) and polish 2.9 (`archive/POLISH_29_PLAN.md`). Anything further needs the user's decision._

## Next
- 2.10 (b101) hardening implemented and pushed; waiting for the user's Expo check (Settings shows 2.10; fonts look unchanged; backup and restore work). Audit 2026-11: App Store items (privacy policy, support URL, 1024 px icon, iPad, encryption key, privacy manifest, pay disclaimer) belong to the future native Swift app (user, 2026-11-11); remaining audit items for the web/Expo build (WebView navigation lock, reminder date check, CSP) not scheduled.
- Nothing else scheduled. Candidates (user's choice): sick leave, the native Swift app, the remaining deferred polish below.

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
- Delivery: directly to `main` under the standing permission (CLAUDE.md); stop after each stage for the user's phone verification.
- Facts from 1.0 checks: the SW caches Google Fonts CSS + font file at runtime in the current cache; icon.png has ~4400 light pixels outside the maskable safe circle — not changed.

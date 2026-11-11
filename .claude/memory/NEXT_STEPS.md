# Next steps

_Updated 2026-11-11 — no active plan; nothing is approved or started. Any new work (feature, polish, native change) needs the user's explicit decision first._

## Deferred (never approved — not done)
- Optional polish: G2 (swipe-delete bounce, stepper press scale, `valpop`), G3 (onboarding stagger/aurora), G5 (haptics independent of Reduce Motion, reduced-motion fades), long-press visual feedback, ring/tab-pill durations, `theme-color`/manifest (rest of G6). Proposal text: `archive/POLISH_PROPOSAL.md`, `archive/POLISH_PLAN.md`.
- Cleanup candidates kept in 2.3 as uncertain (dark tokens written once, shared icon-tile class, per-declaration pruning under Soft UI `!important`, `.bgwash`, `body.pwa` rules): see Stage 2.3 in `archive/stage-history-2026-09-to-11.md`.
- Reorder/swipe follow-ups noted earlier (variable-height pitch, re-grab during settle, SW_STALE/SW_V tuning).
- Touch targets left below 44 px (would need layout changes): calendar day cells 37–38 px wide at 320 px, list rows 40–42 px tall (Region/day/quick sheets), weekday chips 45×35, bonus frequency segments 84×35, icon tiles 42×42, Add holiday 63×40.

## On hold (user's call)
- Year summary: "Total <year> ›" row under the Income history card opens a sheet with year total, 4-group bar + rows, days/leave/paid H/OT H, monthly average, 12 month bars, ‹ › year switch. Proposed, not approved.

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

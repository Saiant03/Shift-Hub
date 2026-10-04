# Next steps

_Updated 2026-10-05 — approved remediation plan CLOSED; no implementation stage is authorized_

## Status
- Approved remediation plan (1.0–1.10) and the implemented polish stages (2.0, 2.1, 2.2 + reorder corrective b93) plus Cleanup C (2.3, build b94, 400160b) are complete and user-verified in Expo on the iPhone (2.3: 2026-10-05). Current build to run: display 2.3 / b94 (`shifthub-b94`).
- Nothing is approved or started. Any new work (feature, polish, native change) needs the user's explicit decision first.

## Still open (separate checks, do not reopen any stage)
- 2.0 real reminder delivery on the iPhone: notification body text (12/24 h), delivery at start−60 min, no duplicate notifications. Method: a disposable shift ~70 min ahead, reminders on; flip iPhone Settings → General → Date & Time → 24-Hour Time, reopen the app, read the notification body once it fires; one notification per shift; repeat the other way. Already-scheduled text updates only when the app is next opened.
- Never verified: VoiceOver (only the web onboarding check noted for 1.4), Android, other platforms. Do not report them as tested.

## Deferred (never approved — not done)
- Optional polish: G2 (swipe-delete bounce, stepper press scale, `valpop`), G3 (onboarding stagger/aurora), G5 (haptics independent of Reduce Motion, reduced-motion fades), long-press visual feedback, ring/tab-pill durations, `theme-color`/manifest (rest of G6). Proposal text: `POLISH_PROPOSAL.md`, `POLISH_PLAN.md`.
- Cleanup candidates retained in 2.3 as uncertain (dark tokens written once, shared icon-tile class, per-declaration pruning under Soft UI `!important`, `.bgwash`, `body.pwa` rules): see CURRENT_STATE Stage 2.3.
- Possible reorder/swipe follow-ups noted earlier (variable-height pitch, re-grab during settle, SW_STALE/SW_V tuning): not approved.

## Handoff facts
- `ONLY=<substring> node test.mjs` filters tests; the full suite takes ~15 min; date-dependent tests use `s8open`; Chromium touch emulation snaps taps to nearby clickables (test hit areas with `elementFromPoint`, see `t9zone`). Delegates must not commit or push; the coordinator reviews, verifies and delivers.
- Expo: `npm run tunnel` in `mobile/` (default); if ngrok fails in a Codespace, `npm run codespace` (port 8081 Public).
- Delivery: directly to `main` under the standing permission (CLAUDE.md); stop after each stage for the user's phone verification.
- Facts from 1.0 checks: the SW caches Google Fonts CSS + font file at runtime in the current cache; icon.png has ~4400 light pixels outside the maskable safe circle — not changed.

## Earlier (UI/a11y audit part 2, v4.66–v4.78 — kept for the pending phone checks)
1. v4.66 text/labels (done, phone-verified).
2. v4.67 Settings/Export cleanup (done, phone-verified).
3. v4.68 touch targets (done, phone-verified). Not changed (outside the audit list, would need layout changes): calendar day cells 37–38 px wide at 320 px, list rows 40–42 px tall (Region/day/quick sheets, full width), weekday chips 45×35, bonus frequency segments 84×35, icon tiles 42×42, Add holiday 63×40.
4. v4.69 contrast (done, phone-verified).
4b. v4.76 readable ink on shift colours + v4.77 TODAY marker (website-verified; Expo not verified).
5. v4.70 zoom + 11 px tab labels: phone-tested, multi-touch paint bug reported; user decided no pinch zoom. v4.71 correction phone-verified.
6. v4.72 native time inputs (phone-verified); v4.73 ± removed from Start/End + cue: website-verified; Expo check pending.
7. v4.74 onboarding: country step before salary (website-verified; Expo not verified).
8. v4.75 day sheet: shift list removed from the full day sheet; long-press quick sheet is the assign path (website-verified; Expo not verified).
9. v4.78 calendar header fit at 320 px, all languages (done; awaiting user website check; Expo not verified).
- Pending Expo/phone checks: v4.73–v4.78. The touch-target exceptions listed under 3 remain; the audit is not fully compliant.

## On hold (user's call)
- Year summary: "Total <year> ›" row under the Income history card opens a sheet with year total, 4-group bar + rows, days/leave/paid H/OT H, monthly average, 12 month bars, ‹ › year switch. Proposed, not approved.

## Not planned (decided — see DECISIONS.md)
- No further `index.html` extractions.
- PWA status-bar style stays as it is.
- Standalone build (EAS/TestFlight) until the user buys an Apple Developer account.
- Sick leave (medical days), worldwide: user marks sick days, pay computed per each country's law (all 34 presets, not only RO). Needs a research pass per country first. Open points: the app is net-based while most laws use gross averages (RO: gross average of last 6 months, rate by duration, employer vs. fund days); some countries have no national rule (US, CA, CH, AE) → mark-only or clearly labelled estimate. Not started.

# Next steps

_Updated 2026-09-30 (after 1.2)_

## Now (frontend audit remediation — plan: `.claude/memory/REMEDIATION_PLAN.md`; status table in CURRENT_STATE.md)
1. User: check 1.2 on the iPhone site/PWA (Settings shows "Shift Hub 1.2"; Delete all data / Restore / swipe-delete confirm fades + scales in; Cancel keeps the data and the sheet open and usable; with Reduce Motion it appears instantly; optionally VoiceOver reads the title + message, starts on Cancel). Optionally run `/review-animations` on the 1.2 commit. Expo unverified for 1.0–1.2.
2. Only after that confirmation: Stage 3 (1.3, build b82) — delete confirmations (D3) exactly as in the plan: `deleteShift` (editor), `bonusDel`, `chDel` through `confirmDialog`; new keys "Delete bonus?" / "Delete holiday?" (6 languages); shift reuses the swipe text; target by shift id / bonus id / holiday `{m,d,name}`. Add the optional focus-fallback argument to `confirmDialog` there (not added in 1.2: no caller needed it yet) — fallback after delete: next row, else + / Name field / holiday name field. Tests: Cancel leaves state + localStorage identical; OK deletes only the target (middle of 3); focus lands on the fallback.
   Where to look: `confirmDialog` (index.html, after the pointercancel listener); its 7 tests follow `a11y: a sheet is a named AX dialog` in test.mjs.
- Stop after every stage for the user's phone verification.
- Delivery: each verified stage is pushed directly to `main` (standing permission, CLAUDE.md).
- Open decisions: time-format policy (stage 1.10); optional polish groups G1–G6 (none approved); small 10.5–11.5 px text evaluation pending.
- Facts from 1.0 checks: the SW caches Google Fonts CSS + font file at runtime in the current cache (dropped with the old cache on each release); icon.png is full-bleed but ~4400 light pixels (calendar corners, up to 231 px from centre) fall outside the 204.8 px maskable safe circle — not changed.

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

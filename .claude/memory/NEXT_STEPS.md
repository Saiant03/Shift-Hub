# Next steps

_Updated 2026-09-29_

## Now (UI/a11y audit part 2 — approved; one stage per release, phone check between)
1. v4.66 text/labels (done, phone-verified).
2. v4.67 Settings/Export cleanup (done, phone-verified).
3. v4.68 touch targets (done, phone-verified). Not changed (outside the audit list, would need layout changes): calendar day cells 37–38 px wide at 320 px, list rows 40–42 px tall (Region/day/quick sheets, full width), weekday chips 45×35, bonus frequency segments 84×35, icon tiles 42×42, Add holiday 63×40.
4. v4.69 contrast (done, phone-verified).
4b. Shift-colour day numbers: dark digits automatically on light shift colours (white on #F2A63C = 2.04:1); also the shift-editor preview. Separate stage, user agreed.
5. v4.70 zoom + 11 px tab labels: phone-tested, multi-touch paint bug reported; user decided no pinch zoom. v4.71 correction phone-verified.
6. v4.72 native time inputs (phone-verified); v4.73 ± removed from Start/End + cue: awaiting phone check.
7. Onboarding: country step before salary (currency shown at salary).
8. Day sheet: remove the "Assign a shift" list from the full day sheet (extras/overtime/holiday stay there); keep the long-press quick sheet as the assign path; do not move the selector to the card. Check the draft save cannot change the assigned shift (incl. Off, paid leave), VoiceOver access, help texts that describe the removed list. Separate stage after v4.67 phone check.
9. Visual fix: German "Kalender"/"Heute" collision at 320 px (reproduce first).

## On hold (user's call)
- Year summary: "Total <year> ›" row under the Income history card opens a sheet with year total, 4-group bar + rows, days/leave/paid H/OT H, monthly average, 12 month bars, ‹ › year switch. Proposed, not approved.

## Not planned (decided — see DECISIONS.md)
- No further `index.html` extractions.
- PWA status-bar style stays as it is.
- Standalone build (EAS/TestFlight) until the user buys an Apple Developer account.
- Sick leave (medical days), worldwide: user marks sick days, pay computed per each country's law (all 34 presets, not only RO). Needs a research pass per country first. Open points: the app is net-based while most laws use gross averages (RO: gross average of last 6 months, rate by duration, employer vs. fund days); some countries have no national rule (US, CA, CH, AE) → mark-only or clearly labelled estimate. Not started.

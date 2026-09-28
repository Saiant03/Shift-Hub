# Next steps

_Updated 2026-09-28_

## Now (UI/a11y audit part 2 — approved; one stage per release, phone check between)
1. v4.66 text/labels (done, phone-verified).
2. v4.67 Settings/Export cleanup (done, phone-verified).
3. v4.68 touch targets (done, awaiting phone check). Not changed (outside the audit list, would need layout changes): calendar day cells 37–38 px wide at 320 px, list rows 40–42 px tall (Region/day/quick sheets, full width), weekday chips 45×35, bonus frequency segments 84×35, icon tiles 42×42, Add holiday 63×40.
4. Light contrast: accent #F0600F on white 3.29 (links, Save, amounts, Edit), white on accent buttons 3.29, --muted3 3.57 (dark 3.28), red 3.91 — token-level tweaks.
5. Zoom/text: drop maximum-scale/user-scalable=no, larger tab labels (9.5 px); check WebView.
6. Shift editor: native `<input type=time>` for Start/End (minutes storage unchanged).
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

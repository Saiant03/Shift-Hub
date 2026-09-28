# Next steps

_Updated 2026-09-28_

## Now (UI/a11y audit part 2 — approved; one stage per release, phone check between)
1. v4.66 text/labels (done, awaiting phone check).
2. Settings/Export cleanup: Export gets its own icon; remove "Run setup again" (+ runOnboard, its i18n key); remove `.csvbox` preview (Copy CSV stays).
3. Touch targets: invisible hit-area expansion (::before) for sheet header links (~18 px tall), steppers (36×32), toggles (50×30), month nav (34), settings/add (40), colour presets (28); 1×1 VoiceOver move buttons are an exception.
4. Light contrast: accent #F0600F on white 3.29 (links, Save, amounts, Edit), white on accent buttons 3.29, --muted3 3.57 (dark 3.28), red 3.91 — token-level tweaks.
5. Zoom/text: drop maximum-scale/user-scalable=no, larger tab labels (9.5 px); check WebView.
6. Shift editor: native `<input type=time>` for Start/End (minutes storage unchanged).
7. Onboarding: country step before salary (currency shown at salary).
8. Day sheet "Assign a shift" list removal — ON HOLD: it is the only tap path to assign a shift (the card under the calendar opens this sheet); needs the user's choice.

## On hold (user's call)
- Year summary: "Total <year> ›" row under the Income history card opens a sheet with year total, 4-group bar + rows, days/leave/paid H/OT H, monthly average, 12 month bars, ‹ › year switch. Proposed, not approved.

## Not planned (decided — see DECISIONS.md)
- No further `index.html` extractions.
- PWA status-bar style stays as it is.
- Standalone build (EAS/TestFlight) until the user buys an Apple Developer account.
- Sick leave (medical days), worldwide: user marks sick days, pay computed per each country's law (all 34 presets, not only RO). Needs a research pass per country first. Open points: the app is net-based while most laws use gross averages (RO: gross average of last 6 months, rate by duration, employer vs. fund days); some countries have no national rule (US, CA, CH, AE) → mark-only or clearly labelled estimate. Not started.

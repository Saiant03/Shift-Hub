# Next steps

_Updated 2026-10-04 (2.2 pushed to main, review-animations Approve; waiting for the user's Expo check)_

## Stage 2.2 corrective (reorder drag, build b93) — see CURRENT_STATE; Stage 2.2 is NOT fully accepted until the user retests the reorder in Expo
State: `/review-animations` Approve (after the scale/z-index release fix), 305/305, pushed to `main` as b93 (display 2.2). Waiting for the user's Expo retest; do not mark the reorder issue resolved before it. Expo retest checklist is in the final report (reorder through neighbours up/down, hover at a boundary, quick reversals, release while rows move, swipe/delete unchanged). Possible follow-ups (not approved): variable-height pitch if the user's rows differ in height; swap-start feel (RO_H).
User report 2026-10-04 (recording not available to Claude): during hold-and-drag of Paid leave through Night and Mid, up and down repeatedly, neighbouring rows look overlapped and jump between positions. Horizontal swipe/delete/cancel: working (user-verified).

## Stage 2.2 (b92) — horizontal swipe verified by the user; reorder issue open (above)
State: implemented, `/review-animations` Approve (no code change), 297/297, pushed to `main` (deployment status: see CURRENT_STATE). Settings must show "Shift Hub 2.2". Possible follow-up (not approved): re-grab during settle jump, SW_STALE/SW_V tuning after the Expo feel check. Expo checklist: flick left on a disposable shift opens the row (compare with a slow drag of the same short distance: stays closed); slow drag past ~half the button opens; right flick closes; pulling far left resists and settles; tap/vertical scroll/jitter do nothing; the red bin still asks for confirmation, Cancel keeps the shift; hold-and-drag reorder, calendar long-press and Edit painting unchanged. Stage 2.1 is user-verified (2026-10-04). Still open from 2.0: real reminder-delivery check. NOT approved/started: long-press feedback, G2, cleanup C (last).

## Stage 2.1 (b91) — user-verified in Expo 2026-10-04 (kept for the record)
Pushed to `main` (deployment not checked by me unless stated in CURRENT_STATE). `/review-animations` ran on the 2.1 diff on the user's request: Approve, no code change (details in CURRENT_STATE). After delivery Settings must show "Shift Hub 2.1". Expo checklist: Done-close of Settings and of a day sheet vs. drag-dismiss (same feel, Done unchanged length); open and Done-close repeatedly and fast, with a reopen right after; toggles in Salary/Settings flip as before; a toast (e.g. delete a shift) fades/rises as before; brush chips in Calendar Edit; Reduce Motion on/off while a sheet closes; HUB/Calendar tab changes still instant. Only automated checks can see: computed `transition-property` lists, the exact animation curve and 260 ms, the 36 rapid close/reopen cases, reduced-motion mid-slide settling. NOT approved and not started: G2, Stage 2.2 (gestures), cleanup C (last).
Open from 2.0 (not closed): real reminder delivery and duplicate-notification check on the iPhone (use a disposable shift ~70 min ahead; flip 24-Hour Time; reopen the app; read the notification body once at start−60 min; one notification per shift).

## Stage 2.0 (b90) — user-verified in Expo 2026-10-04 EXCEPT the reminder delivery check (above)
Original 2.0 checklist, kept for the reminder item: pushed to `main`; not deployed/verified by me. Settings must show "Shift Hub 2.0". Expo checklist: (1) theme: app Light + iPhone Dark, app Dark + iPhone Light, Auto then switch the iPhone theme while the app is open; shift editor → tap the time pill (picker), type in the shift name (keyboard), long-press text (selection menu): note per surface whether it follows the app or the phone — a surface that ignores it is a documented limitation, not a failure of 2.0; (2) small text: HUB ("Today/Next shift", income-history month labels) and Calendar day card (currency), also de/fr; (3) reminders: use a DISPOSABLE test shift starting ~70 min from now (note your existing schedule first, restore after), reminders on; change iPhone Settings → General → Date & Time → 24-Hour Time, reopen Shift Hub, wait for the notification (fires at start−60 min) and read the body ("Starts at 6:30 AM" vs "06:30"), the firing time must not change and only one notification per shift; repeat the other way. Already-scheduled text updates only when the app is next opened. 2.1, 2.2 and cleanup C have NOT started (need the user's go-ahead).

## Earlier: frontend audit remediation — plan: `.claude/memory/REMEDIATION_PLAN.md`; status table in CURRENT_STATE.md)
1. Stage 1.9 verified (267/267), pushed to `main`; Expo build to test = display 1.9 / b88 (Settings shows "Shift Hub 1.9"; cache `shifthub-b88`); user-verified in Expo (2026-10-03); the check covered: a bonus (tap the bin near its edges/corners, cancel, then confirm; toggle next to it must only toggle) and a custom holiday (× near its edges; cancel keeps it, confirm removes only it); the bonus Frequency options (2×2 grid, check German/French/Romanian, pick each, save, reopen). Stage 1.8 user-verified in Expo (2026-10-03).
2. Stage 1.10 (build b89) is complete: pushed to `main` and user-verified in Expo on the iPhone (2026-10-04). The next release is 2.0. Nothing is started. Proposal (NOT approved, versions provisional): `.claude/memory/POLISH_PROPOSAL.md`; revised stage plan: `.claude/memory/POLISH_PLAN.md` (2.0 proposed first; 2.1/2.2 conditional) — G1–G6, small text, reminder text; waiting for the user's per-item decisions. Planned: cleanup C stays the final stage of the approved plan (waits for the user's instruction). Not approved: polish groups G1–G6 and any change after the small-text evaluation. Separate open decision: the shift-reminder text ("Starts at …") still uses 24 h (reminders were out of scope for 1.10).
   Handoff from 1.9: `ONLY=<substring> node test.mjs` filters tests; the full suite takes ~15 min; tests that need a fixed "today" use `s8open`; Chromium touch emulation snaps taps to nearby clickables, so test hit areas with an `elementFromPoint` scan (`t9zone`), not "tap outside". Delegates must not commit or push; the coordinator reviews, verifies and delivers (in 1.9 the delegate's tests were thin and its 4-in-a-row frequency layout overflowed in German at 320 px; the coordinator rewrote the tests and changed the layout).
- Expo from a Codespace when ngrok fails ("failed to start tunnel"): `npm run codespace` in `mobile/` (= sync + `EXPO_PACKAGER_PROXY_URL` from the Codespace's forwarded URL + `expo start`); port 8081 must be Public in the Ports tab; works over mobile data. `npm run tunnel` stays the default.
- Stop after every stage for the user's phone verification.
- Delivery: each verified stage is pushed directly to `main` (standing permission, CLAUDE.md).
- Open decisions: polish groups G1–G6 (none approved); small 10.5–11.5 px text evaluation pending (changes after it unapproved); reminder text 24 h vs device setting. Cleanup C is approved in the plan, final, awaiting instruction.
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

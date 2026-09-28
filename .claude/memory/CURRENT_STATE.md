# Current state

_Updated 2026-09-28 · v4.65_

## Project
- Shift Hub v4.65 on `main`; `node test.mjs` = 155/155.
- v4.46 verified on the phone (Expo WebView); PWA offline checked at v4.40.

## Just finished (HUB/iOS batch, v4.34–v4.41, all phone-verified)
- v4.34 HUB month swipe: pay card slides in + counts old→new pay.
- v4.35–v4.36 shift reorder: hold ~450 ms + drag (`ro`), hidden Move up/down
  buttons for VoiceOver (`moveShift`), edge auto-scroll.
- v4.37–v4.39 pay breakdown: one card; 4-group composition bar (base accent,
  `OT_COLOR`, `PREM_COLOR`, `EXTRA_COLOR`) whose summary rows carry the color key;
  the separate KPI card is gone.
- v4.40 `.screen` starts at the top safe-area inset (scrolled content no longer
  passes under the clock); tested via CDP `Emulation.setSafeAreaInsetsOverride`.
- v4.41 native status bar follows the theme on screen (`bar:light|dark` → App.js
  `expo-status-bar`); Auto works after `userInterfaceStyle: automatic` (app.json).

- v4.42 Calendar grid no longer shrinks when a week gets its first shift or
  another week is selected: the week line and the day card's badge line keep
  their space when empty (phone-verified).

## Cleanup batch (v4.43–v4.45)
- v4.43 tall sheets stop 12 px below the status bar (`max-height:min(93%, 100% − inset-top − 12px)`).
- sync-html leftover check matches `<script … src=` with other attributes first.
- v4.44 removed unused `STD_DAY_HOURS` / `shiftMix`.
- v4.45 theme switch: no background fade on `.phone` / `.bgwash`.

- v4.46 paint pop (A12) completes across the render at release.

- Test seed race fixed (test.mjs only, no app change); 80/80 repeated reload runs green.

- v4.47 HUB backup nudge: card (no new strings) when there are shifts and no backup in 30 days; tap opens Backup; `markBackup` sets `hubDirty` so it disappears on close. On the phone: hidden as expected (recent backup).
- v4.48 night hours paid (tester feedback): stepper under the night toggle in the shift editor; toggle label now shows the real night %. User approved.

## Audit fix batch (one stage at a time, user verifies each)
- v4.49 stage 1: Delete all data also removes `shifthub_v4_prev` (restore safety copy). Phone-verified.
- v4.50 stage 2: sw.js caches only ok responses (opaque Google Fonts CSS still cached); a failed page load serves the cached copy; `r.update()` rejection now caught. Test runs a local HTTP server (SW needs http). Approved.
- v4.51 stage 3: HUB "Net per paid hour" = (grand − additions) / (paidH + vacH + otDayH + otNightH), shown when that is > 0; premiums % = (night+weekend+holiday)/grand. Display only, monthTotals untouched. Phone-verified.
- v4.52 stage 4: aria-labels (month nav, steppers → Previous/Next month/day/year, Decrease/Increase, Remove, Delete, Hex colour, shift icon names), Backup counts (one/other), badges wknd/hol., delete confirm uses `shiftName(s)` (plain text; `shiftLabel` = esc(shiftName)).
- v4.53 ro fixes: delete confirm "X — tura va fi ștearsă…" (gender-neutral); Backup counts use `{de}` via Intl.PluralRules ("20 de ture"; 0/1/2–19/101 unchanged). Phone-verified.
- v4.54 stage 5: every shift deletable (editor + swipe), incl. m/a/n and the last paid leave. Persisted `leaveOff` (set in saveState = no vac shift left) stops normalize() re-adding "Paid leave"; old saves/backups without the key still get it. `applyBrush` ignores a deleted brush. Phone-verified.
- Audit batch (stages 1–5) done and verified.

## UI/UX audit (one stage at a time, user verifies each)
- v4.55 stage A: day sheet (card under the calendar) lists the shifts + Off at the top as a draft (`state.draftShift`, `mday:<id>`); Save applies shift + extras together, Cancel/close discard. Onboarding step 4 and the empty-month card (now a plain hint, no longer a button into Edit) say "pick a day, then tap the card below". Phone-verified.
- v4.56 stage B1: number format defaults to Device default (`auto`) for new installs; saves/backups without `region.nf` (≤ v4.55) move to `auto` once, `nf:1` keeps a later manual pick. Display only. Phone-verified (Device default follows the phone language; user keeps it that way).
- v4.57 stage B2a: onboarding "Continue" translated; Settings/Salary counts agree at 0/1/many (`trN` in settings.js: one/other key + Romanian {de}); Settings row subtitles wrap instead of ellipsis (DE/IT cut at 320 px). Phone-verified.
- v4.58 stage B2b: `shiftName` translates m/a/n while the stored name is still Morning/Afternoon/Night (`DEF_SHIFT`), like Paid leave; reminder titles use it; the editor shows the translated name and saving it unchanged keeps the stored one. Data, backup, CSV keep stored names. Phone-verified.
- v4.59 stage B2c: country names via `Intl.DisplayNames` in the app language (English fallback), sorted with `Intl.Collator` (`countryName`/`countryOrder` in countries.js, `COUNTRY_ORDER` gone); onboarding puts the explicit, supported `navigator.language` region first (not selected); `detectCountry` no longer guesses from a bare language or falls back to RO. Phone-verified.
- v4.60 stage B2d: HUB "Next shift" card — name on its own line (wraps, no ellipsis), then date · hours; today: "Today" only as the label + hours; paid leave: name once, date only when future. Tests check real geometry (text ranges inside the card, not clipped). Phone-verified.

- v4.61 stage C1: all 7 toggles (onboarding premiums, Salary premiums, reminders, bonuses, day holiday, shift leave/night) are `role="switch"` + `aria-checked` + `aria-label` from the visible label (tr, current language); the visible label is `aria-hidden` so it is read once (bonus names stay visible in their edit button). Tests read Chromium's AX tree. Layout pixel-identical. Phone-verified.
- v4.62 stage C2: `#sheet` is a named dialog (`role=dialog`, `aria-modal`, `aria-labelledby="sheettitle"` = each sheet's title); open → background (`#screen`, `#tabbar`, `#onboard`, body siblings) `inert`, focus on the sheet container; close (Done/Cancel/Save/backdrop/drag) → focus back to the opener, else the same `data-action`, else the active tab; in-place refresh refocuses by `data-action`. Implemented by a cheaper-model subagent, reviewed by the coordinator. Touch layout pixel-identical. Phone-verified.
- v4.63 stage C3: toasts announced via a hidden `#toastlive` (`role=status`, polite; the app has no error/success split); visible `#toast` is `aria-hidden`. `toast()` clears the region and writes the text 100 ms later (latest call wins → same text re-announced, no duplicates), clears it at the 1500 ms hide. Focus untouched; region sits outside `#sheet`, not inert. Implemented by a cheaper-model subagent, reviewed by the coordinator. Pixel-identical. Phone-verified (VoiceOver announces it, also inside an open sheet).

## Small UI fixes
- v4.64 sheet headers with a title (`.sheethdr:has(>.t)`) are a 3-column grid: title centred when it fits, wraps between the buttons otherwise (DE/FR/IT overlap at 320 px in the shift editor and Extra earnings). CSV export header unchanged. Phone-verified.
- v4.65 onboarding ready card: monthly unit via `tr('{amt}/mo')` in all six languages. Phone-verified.

## In progress
- Nothing. No uncommitted work.

## Working pattern that proved reliable
- Audit/plan first (boundary, dependencies, load-time code, tests), wait for
  approval, then implement exactly the plan, verify, commit one task, push `main`.
- Tests first (red on the old code), then the fix, then the full suite.
- Gesture/focus tests must use real CDP touch taps, not `element.click()`:
  click() skips pointerdown/mousedown, which is where focus moves on a tap.
- The user verifies each release on the phone (`npm run tunnel`, sync line
  shows the payload size in chars) before the next stage starts.
- Before a multi-part task, a short Q&A (AskUserQuestion) to confirm choices;
  the user then approves each step and verifies it on the phone.
- The user is not technical: reply in plain Romanian, give copy-paste terminal
  steps one at a time, no jargon.

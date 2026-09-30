# Current state

_Updated 2026-09-30 · 1.0 (build b79)_

## Project
- Current version: 1.0 (build b79) on `main` (Stage V, commit 6b7406a; fast-forwarded to `main` 2026-09-30, which also merged PR #2). The site auto-deploys from `main`; deployment not checked by Claude. `node test.mjs` = 202/202.
- Versioning (user decision): display `APP_VERSION` 1.0, 1.1 … 1.9, 1.10, 2.0 … (two integers, one step per released phase); asset build `b<N>` (script `?v=` + `shifthub-b<N>` SW cache) only goes up. v4.78 = 1.0 = b79.
- v4.46 verified on the phone (Expo WebView); PWA offline checked at v4.40.

## Remediation stages (plan: `.claude/memory/REMEDIATION_PLAN.md`)
Status words: implemented = committed + pushed on a branch · merged = in `main` · deployed = live on the site (auto-deploys from `main`) · user-verified = user checked it on the phone.

| Version | Stage | Implemented | Merged | Deployed | User-verified |
|---|---|---|---|---|---|
| 1.0 (b79) | V: version-only release, no behaviour change | yes (6b7406a) | yes (pushed to `main`; PR #2) | expected via auto-deploy, not checked | no |
| 1.1 … | stages 1–10, optional groups, cleanup | not started | – | – | – |

Stage V checks done [Chromium only]: 4.78→1.0 update leaves one cache (`shifthub-b79`), scripts load `?v=b79`, `shifthub_v4` + `shifthub_v4_prev` byte-identical, offline relaunch works, screens pixel-identical except the Settings version line; playwright-cli shows "Shift Hub 1.0"; code-review (built-in) no findings; ponytail-review "Lean already". Not verified: iPhone (browser, installed PWA), Expo on the phone.

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

- One flake seen once: "a11y: an error toast (invalid backup)" (touch tap before the Backup sheet was ready); 8/8 green alone.
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

## UI/a11y audit, part 2 (one stage at a time, user verifies each)
- v4.66 stage 1: weekend badge ro/it "weekend"; stepper buttons named "<row label>: <verb>" (keys "Decrease {x}"/"Increase {x}", plain Decrease/Increase removed); German day+month dates "12. September" via `dayNum(d)` (index.html, next to monthName; other languages unchanged); day-sheet extra line keeps "· Wochenende" together (no "·" at a line end, 320 px de). Implemented by a cheaper-model subagent, reviewed by the coordinator. Phone-verified (iPhone).
- v4.67 stage 2: Export row has its own `I.file` icon (Backup keeps `I.upload`); "Run setup again" row, `runOnboard`, `I.rotate` and its i18n key removed (first-run onboarding unchanged); Export sheet has no CSV preview (Copy CSV + toast unchanged; `.csvbox` stays for Backup). Implemented by a cheaper-model subagent, reviewed by the coordinator. Phone-verified (iPhone: Settings, Export, Copy CSV).
- v4.68 stage 3: touch targets — one shared invisible centred `::before` (max(100%,44px) square) on `.link` (sheet header Cancel/Save/Done/back), `.stepper button` (z-index:1 so the value label never takes the minus's edge), `.toggle`, `.navbtn`, `.editbtn` (Edit/Today), gear, Add. Colour presets 36×36 = their pitch (28 + 8 gap) — 44 would overlap neighbours. Edit hit is 57×43 (10 px above the › arrow; the arrow keeps its 44). 48 screenshots (320 px, light/dark, en/de/ro) byte-identical to v4.67. VoiceOver `.srbtn` untouched (1×1). Tests by a cheaper-model subagent, reviewed by the coordinator. Phone-verified (iPhone, touch works well).
- v4.69 stage 4: contrast (user picked option B: keep the bright orange fills). Light: `--accent-ink:#A84800` for all orange text/glyphs (`color:var(--accent)` → `--accent-ink`; dark ink = #FF7A3D), `--on-accent:#2A1206` (dark text on orange, as in dark mode), `--red:#C02E34`, new `--on-red` (light #fff, dark #2A1206: Restore backup, dialog Delete, hol. badge), `--text2:#62636D`, `--text3:#6C6D77`; dark `--text3:#878891`; day-card premium badges `color-mix(hue 55%, var(--text))`. Measured on rendered colours over composited backgrounds (both themes, 320 px): every text run ≥ its WCAG threshold except the exceptions below. Non-text indicators (borders, caret, toggles, rings, fills) keep --accent. 3 contrast tests (rendered colours over composited backgrounds) fail on v4.68, pass now. Tests by a cheaper-model subagent, reviewed by the coordinator. Phone-verified (iPhone: contrast and appearance approved).
  Exceptions (not changed): white day numbers / shift-editor preview on user-chosen shift colours (amber #F2A63C 2.04:1, indigo 4.47:1) → own later stage (user's choice); adjacent-month `.cell.dim` days (faded by design); non-text: light off-switch track 1.26:1 vs card (iOS-like, state also by knob position + aria-checked), selected-day ring #F0600F on the page 2.99:1.

- v4.70 stage 5: pinch zoom + tab labels 9.5→11 px. Phone-tested with a reported multi-touch bug: in Calendar Edit mode two fingers painted across days. User then decided: no pinch zoom in the app.
- v4.71 stage 5 correction: pinch zoom reverted (viewport `maximum-scale=1, user-scalable=no` and the v4.69 touch-action values are back). Kept: 11 px tab labels; second-finger guards on lp/ro/sw/sd. Paint fix: `painting` = {id, snapshot of assignments + selISO}; only a primary pointer starts a stroke, only that pointer paints/finishes it; any second pointerdown in Edit mode (anywhere) restores the snapshot unsaved, re-renders and sets suppressClick. Single-finger pointercancel still keeps the stroke. Tests: real two-finger CDP paint cases (together, mid-stroke, outside the grid, third finger) + pinch does not zoom. Implemented by a cheaper-model subagent, reviewed and completed by the coordinator (cancel now also for a second finger off the grid). Phone-verified (iPhone: no pinch zoom, two fingers don't paint, normal use fine).
- v4.72 stage 6: shift editor Start/End values are native `<input type=time>` (`tpick` in sheets.js, ids shStart/shEnd, aria-label Start/End); ± steppers kept. `pickTime` (input + change) updates state.d and swaps only the preview + night-hours value — no re-render, so the iOS picker stays open. Empty value restored on blur. Minutes storage unchanged; any minute now possible. Implemented by a cheaper-model subagent, reviewed by the coordinator. Phone-verified (iPhone: picker opens, preview updates, times save).
- v4.73 stage 6 follow-up: Start/End rows have no ± (sM/sP/eM/eP removed); `timeRow` in sheets.js = label + cue "Tap to set time" (6 languages; label column aria-hidden, input named Start/End) + a 96×44 time pill. Break/leave/night-hours steppers unchanged. Same editor for edit and + (new). Implemented by a cheaper-model subagent, reviewed by the coordinator. Website-verified by the user (start/end pick + save, edit and new shift); Expo/phone check still pending (no Codespaces access).
- v4.74 stage 7: onboarding order welcome → country → salary → shifts → calendar → premiums → ready (`ONB_COUNTRY_STEP=1`); the salary step shows the chosen currency; the premiums Weekend row shows the chosen country's weekend (`weekendLabel(days)`; e.g. IL/SA Fri / Sat). No text/i18n changes; region still written only at Start; saved users/backups untouched. Implemented by a cheaper-model subagent, reviewed by the coordinator. Website-verified by the user (country before salary, correct currency, salary kept when going back); Expo not verified (no Codespaces access).
- v4.75 stage 8: full day sheet (card under the calendar) no longer lists shifts: only Extra preview (follows the stored shift), overtime, holiday, Cancel/Save; `draftShift`/`mday` removed, `saveMeta` never touches assignments. Assigning = long-press quick sheet (rows now `aria-pressed`) or Edit-mode paint; VoiceOver/keyboard: hidden `.srbtn` "Assign a shift" after the day card opens the quick sheet for the selected day. Onboarding calendar step + empty-month hint now say long-press to assign (6 languages). Implemented by a cheaper-model subagent, reviewed by the coordinator. Website-verified by the user (long-press assign + simplified overtime/holiday sheet); Expo checks for v4.73–v4.75 still open (no Codespaces access).
- v4.76 stage 4b: ink on shift colours = `onColor(hex)` (index.html): white when white reaches 4.5:1, else black (≥4.67:1) → ≥4.5:1 for any colour. Used for calendar day numbers (also `paintCellVisual`), shift tiles (Shifts list, HUB upcoming, day card), shift-editor preview (all text inherits; live picker updates it). Work cells carry `--on`: today outline on a shift day = the ink colour, OT/holiday dots get a 1.5px ring in it. All 12 presets now get black ink (white was 1.98–4.47:1). Preview icon tile overlay unchanged (white icon worst case 3.0:1). Stored colours untouched. Tests cover presets + light/medium/dark/boundary customs, both themes. Implemented by a cheaper-model subagent, reviewed by the coordinator. Website-tested: readable numbers, live editor ink and icons OK; reported issue: orange TODAY marker gone (fixed in v4.77), so not fully verified.
- v4.77 TODAY marker: v4.76 had made the today outline the ink colour, and `.cell.today.sel` removed it. Now today = `.circ::after` inner ring (inset 3px, 2px `--accent`; no shift: `--accent-ink`, ≥3:1 on the grey cell) with 1px ink lines (`--on`) on shift days, so it shows on any colour, also orange. Selection stays the `.calsel` edge ring + halo; both show when today is selected. Tests: today unselected / today selected / after re-render + tab switch, 5 colours, both themes. Tests by a cheaper-model subagent, CSS and review by the coordinator. Website-verified by the user (v4.76 + v4.77 together: TODAY keeps a persistent orange marker distinct from the selected-day ring); Expo not verified.
- v4.78 calendar header (audit item 9): at 320 px the title touched Today (de 1.6 px, it 2.2 px, fr/pt 0 px + horizontal overflow in fr; fr also at 340 px) — title + Today + Edit + gaps were wider than the 288 px row. Title `font-size:min(26px,7vw)` + 8 px margin; `@media (max-width:374px)` `.editbtn` padding 8px 10px, 13px, min-height 32 (height and 44 px hit areas unchanged); row `flex-wrap` only as a safety net (no shipped language wraps 320–430 px, so the grid keeps its height). Geometry test (7 languages × Edit on/off at 320 px + Today/Edit taps) fails on v4.77. Implemented by a cheaper-model subagent, reviewed by the coordinator. Awaiting user website check; Expo not verified.
- Text is px-based: iOS Larger Text (Dynamic Type) does not change it; not planned unless the user asks.

## Skills
- 69 skills from Saiant03/Skills@64abace in `.claude/skills/`; SessionStart hook runs `.claude/skills.sh` (check). Discovery verified 2026-09-30: 66 model-invocable; `review-animations`, `pick-ui-library`, `prototype` are user-invoked only (`disable-model-invocation`). `code-review` is a Claude Code built-in, not part of the 69.
- Session-only tools (lost when the container resets): impeccable engine 0.1.5 (`~/.impeccable/bin/0.1.5`, sha256 cf5231a4…7f19), `@playwright/cli` 0.1.22 (global npm). Reinstall only when permitted.

## Frontend audit 2026-09-30
- Reports: impeccable 13/20, review-animations "Block"; remediation plan approved in stages (1.1 count-up + launch, 1.2 dialog, 1.3 delete confirmations, 1.4 onboarding isolation, 1.5 field names/file control/headings, 1.6 HUB month arrows, 1.7 live reduced motion, 1.8 untranslated text + Export text, 1.9 44 px targets, 1.10 time format if decided; optional polish groups need approval; ponytail cleanup last).
- User decisions: no launch shimmer/count-up (count-up only on month change); visible HUB month arrows; confirm dialog for editor/bonus/holiday deletes; cleanup last.

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

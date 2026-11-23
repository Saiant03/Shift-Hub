# Shift Hub redesign — final audit (branch `Work`, 2.32 / b125)

_Date: 2026-11-23. Read-only audit of `git diff origin/main...Work` (24 files, +2920/−1189) and of the whole app as it runs now. No app file was changed. Fixes are planned separately with the user._

## Method and what was actually applied

- **Tests:** `node test.mjs` full suite — **390/390 passed** (exit 0).
- **Playwright pass** (Chromium, `pageerror` + console errors captured): every tab and all 15 sheets at 320×640 and 430×932, light and dark (77 shots); onboarding all steps at 320 light `de`, 430 dark `ro`, 320 dark `fr`; worst-case pass at 320×568 in all six languages (long unbreakable shift/bonus/holiday names, net 9,876,543, premiums 200–300 %, HUF/CHF/NOK/USD/EUR/RON, a white and a black shift colour, 34-country list); Reduce Motion probe of running animations. **`pageerror` empty in every run.**
- **Plan greps:** `backdrop-filter`: 0 active blurs (4 dead blur declarations overridden by `none!important`); `Plus Jakarta`: 0 code hits (docs/memory only); new hard-coded hex: 31 token definitions + 11 direct CSS uses (all on the always-dark HUB hero/stack or `html/body` black) + 2 JS (`#8C8598` "Off" swatch); translations: 234 literal `tr()` keys + variable-keyed ones, **0 missing** in ro/es/de/fr/it/pt; version sync APP_VERSION 2.32 = b125 on all nine scripts = `sw.js` cache and precache.
- **Skills — pass 1** (subagents): ponytail-review and ponytail-audit read and followed; code-review, tech-debt and testing-strategy lenses applied by hand; owasp-security-audit applied; accessibility measured in Chromium; motion skills' SKILL.md read; impeccable-finish-reviewer and impeccable-motion-reviewer subagents (design lenses applied informally).
- **Skills — pass 2** (user asked for every tool to be run for real; each loaded with the Skill tool and applied by Opus unless noted): `security-review` (after pointing the local `origin/HEAD` at `main`; sub-task scan of the diff, 0 new vulnerabilities), `code-review` (high, 4 angles, 10 findings reported), `engineering:tech-debt` (scored table, phased plan), `engineering:testing-strategy` (test plan), `impeccable` critique (dual-agent: Assessment A design review + Assessment B detector, isolated, both resumed after a rate limit) and audit (scored), `design:design-critique`, `emil-design-eng`, `apple-design`, `frontend-design`, `web-design-guidelines` (rules fetched fresh from vercel-labs), `mobile-native`, `hig-compliance-auditor` (foundations, web/PWA and checklist references), `break-ui` (dev-only Demo / Worst case / Empty / One / 100-and-40k toggle harness in the scratchpad, every state at 320, 430 and 200 % zoom), `design:accessibility-review` (own re-check: keyboard order, Escape, calendar semantics), `improve-animations` (recon + audit + vet; no plan files written — the plan is decided with the user), `animation-performance`, `gestures`, `choreograph`, `ponytail-review`, `ponytail-audit`, `owasp-security-audit:security-audit` (all ten category guides). **Not runnable by the model:** `review-animations` (user-invocable only — run `/review-animations` yourself). **Not done:** real VoiceOver, Android, frame-rate traces on a device, `npm audit` (needs approval).
- **Scores:** impeccable critique (Nielsen) **29/40**; impeccable audit **15/20 (Good)** — a11y 3, performance 3, theming 3, responsive 3, integrity 3 (PASS); HIG: 0 critical, 3 high (targets, Dynamic Type, VoiceOver calendar), 4 medium, 2 low; OWASP: 0 high/medium, 2 low (A10), 1 informational (A02); detector: 6 CSS hits, all false positives or deliberate except the 320 px holiday-dot overlap.
- Every finding below was checked by Opus in the code or a screenshot. Dropped as unproven or not a defect: the 120 ms opacity crossfade of the Settings push under Reduce Motion (allowed by the spec, ≤120 ms opacity), the grey glass controls on the HUB hero in the light theme (user-approved in 2.29; text measures 7.7–8.6:1), pinch zoom disabled (user decision, DECISIONS 2026-09-28), per-screen card radii 22/24/28 (they follow the mockups per screen), the dot-font word space (copied verbatim from all five mockups — see M10 for legibility).

Severity: **blocker** = must fix before merge to `main`; **important** = should fix before merge; **minor** = can wait. "Pre-existing" = also on `main`.

## Blockers

None.

## Important

### I1 — Shifts, bonuses and custom holidays above 100 are silently deleted on the next launch (pre-existing)
- **Where:** `index.html:1432` (additions `.slice(0,100)`), `:1435` (shifts `.slice(0,100)`), custom holidays capped in `normalize`; no cap in `saveShift` (`index.html:1574`), the bonus save or `chAdd`.
- **Evidence:** audit probe created 105 shifts through `openNewShift(); saveShift()`, assigned a day to the last one, saved and reloaded: 109 in memory → 100 after reload, the assignment gone, no message.
- **Repro:** add 101+ shifts (or bonuses / custom holidays), assign the newest, restart the app.
- **Fix:** refuse the 101st with a toast in the three add paths (one new `tr` key × 6 languages) and a test.

### I2 — A crafted backup with `region.country:"constructor"` breaks the app on every launch (pre-existing)
- **Where:** `index.html:1448` `COUNTRIES[R.country]?R.country:DR.country` accepts inherited keys; `holidays.js:20` then iterates `C.d` (undefined) and throws on every render. `applyBackup` saves before rendering, so it persists.
- **Repro:** restore `{"app":"shifthub","v":4,"data":{"region":{"country":"constructor","nf":1},"salary":{"net":1000}}}`.
- **Fix:** `Object.hasOwn(COUNTRIES,R.country)` in `normalize` (same check wherever `COUNTRIES[x]` validates input).

### I3 — Four sheets were not restyled: day extras, quick assign, year and month
- **Where:** `sheets.js:9` (`sheetDayMeta`, class `inner mdsheet`, plain-text Cancel/Save links), `index.html:1884-1895` (`sheetQuickDay`, `inner qsheet`, plain "Done" link), `sheets.js:103-121` (`sheetYear`, `inner`, inline 20 px `h2`, white `.card`s with shadow on the white sheet, text "Close" link 4 px from the arrows), `sheets.js:122-132` (`sheetMonth`, same).
- **Evidence:** `shots/430-light-sheet-{meta,quick,year,month}.png` vs `430-light-sheet-{shift,settings,stNet}.png`: the restyled sheets use `.inner.shsheet` (dot-font title, glass pill buttons, grey cards on the white sheet); these four do not. Three different header treatments are visible.
- **Fix:** move them onto `.inner.shsheet` with the shift editor's header (`sheets.js:67-69`, `.shsave > .glass`), grey `.grp` cards; keep the date as a plain title where a dot title would not fit ("12 Noiembrie").

### I4 — The Shifts tab replays a long row + track cascade on every visit, on top of the tab slide
- **Where:** `index.html:1112` sets `shfEnter=tab==='shifts'` on every `switchTab`; `:1106` adds `.shfin`; `:739-740` animate rows `60ms + i×45ms` over `--d4` and tracks `260ms + i×45ms + j×200ms` over `--d4`, while `:1113` plays the 240 ms screen slide. HUB has no entrance on tab switch; Calendar only assembles its title.
- **Evidence:** with 8 shifts the tracks finish ~1.1–1.5 s after the switch; the comment at `:1113` says "no staggered entrance".
- **Repro:** Calendar → Shifts, repeatedly.
- **Fix:** keep the title assembly and the slide; run the row/track cascade only on first launch/after onboarding (as the HUB cascade does). Confirm with the user, who accepted stage 5 with it.
- **Same root, found in pass 2 (choreograph):** every open of the shift editor and the Settings pages rises the sheet (420 ms) *and* cascades its blocks (`index.html:778`, `140ms + j×40ms`) — two entrances on one container, uniform gaps.

### I5 — The Settings push cannot be caught mid-flight
- **Where:** `index.html:1211` `pgBuild` starts with `pgEnd()`, which snaps any running push to its end.
- **Repro:** open a Settings row and tap Back (or edge-swipe) within 420 ms: the page jumps to fully open, then reverses from there.
- **Fix:** when `pg` is running, read the current position from the top layer's computed transform and `pgRun` from that value in the other direction.

### I6 — Reduce Motion: a cancelled edge swipe back makes the page flash out and back
- **Where:** `index.html:1222-1223` reduce branch animates `top` `1→0` whenever `top!==inc`, ignoring the target; `egEnd(false)` at `:1807` calls `pgRun(c0,1,…)`; the inline `translateX` from the drag stays during the fade.
- **Repro:** Reduce Motion on, open a Settings page, drag 30 px from the left edge, release.
- **Fix:** in the reduce branch animate `[{opacity:c0},{opacity:c1}]` and clear the inline transforms first.

### I7 — New controls under 44 px
- **Where / measured:** `.brktoggle` (Pay details row) `min-height:36px` (`index.html:536`) → 246×36 at 320; `.hcirc` round buttons 36×36 (`:535`); HUB week-strip days `.wday` 33×56 at 320 (`:527`); onboarding salary field `#onbnet` 83×23 at 320 (`:1296`, the card around it is not a label); onboarding practice-week cells 35×35; weekday picker `.gp` 36×44 at 320. (Calendar cells remain the documented exception. The other entries of the automatic "small" list are covered by the 44 px `::before` expanders at `:135` — verified with `elementFromPoint`.)
- **Fix:** `min-height:44px` on `.brktoggle`; a `::before` expander on `.hcirc`; make the salary card a `<label>` or give `#onbnet` 44 px; widen `.wday`/`.gp` where the row allows.

### I8 — Calendar days do not tell VoiceOver which day is today or selected (pre-existing)
- **Where:** `calendar.js:70` cell label `"{day} {month}, {shift|Off}{holiday}"`; no `aria-current`, `aria-pressed` or `aria-selected` on `.today` / `.sel` cells (also absent on `main`); the `.weekhdr` letters are read as seven loose letters.
- **Fix:** `aria-current="date"` on today, `aria-pressed="true"` on the selected cell, `aria-hidden="true"` on `.weekhdr`.

### I9 — The native island in `mobile/App.js` has no runtime test
- **Where:** `test.mjs:4585-4604` only read `App.js` as text (`includes`, regex). The hit-test, the scroll dead-band, the `ico:` validator and the mini state are untested; a JSX typo passes all 390 tests and only shows up in Expo.
- **Fix:** move the pure parts (section hit-test, `nextMini`, `ico:` validation) into a plain module like `mobile/islandBridge.js` and assert them from `test.mjs`.

## Minor

| # | Finding | Where | Evidence / repro | Proposed fix |
|---|---|---|---|---|
| M1 | Done tapped, then a tab switch within 360 ms, fires a second full render of the new tab (the guide asks for exactly this sequence) | `index.html:1922-1924` (`toggleEdit` rAF loop never checks `state.tab`; `switchTab` does not clear `editClosing`) | probe: 2 renders, both on HUB, ~300 ms after the switch | in the loop's end branch, if `state.tab!=='calendar'` clear `editClosing`/`editMode` and return |
| M2 | Quick-assign sheet overflows at 320 with an unbreakable shift name: rows and title run past the viewport, "Copy from yesterday" squeezed | `index.html:1888-1890`, `.inner.qsheet .optrow` `:672`, header grid `:128` | `shots/break-*-sheet-quick.png`, report "PAST-VIEWPORT r383" in all 6 languages | `min-width:0;overflow-wrap:anywhere` on the row label; ellipsis on the muted name |
| M3 | Long custom-holiday name hard-clipped; Settings net value loses its currency to the ellipsis | `index.html:807` `.stsheet .slbl` | `shots/break-de-light-sheet-stHol.png`, `-settings.png` | `overflow-wrap:anywhere` on `.slbl` |
| M4 | Holiday dot touches two-digit day numbers at 320 | `index.html:626-628` | `shots/320-light-calendar.png` ("30") | smaller inset under 360 px |
| M5 | Calendar day card leaves a dangling "·" when its line wraps | `calendar.js` day-card meta | `shots/320-light-calendar.png`, `break-de-light-calendar-sel.png` | keep "·" with the next span (`white-space:nowrap`) |
| M6 | Dark theme: the web/PWA island keeps the light specular spot and sheen (the native island on the phone is unaffected) | flat overrides `index.html:577-579` are scoped to `.screen …/.inner.shsheet/.onboard`; `#tabbar` (`:93`, `:839`) is outside | `shots/430-dark-*.png` | apply the same `--gspot/--grim/--gsheen` rules to `#tabbar.glass` |
| M7 | Out-of-month day numbers are 2.3:1 (light) / 3.1:1 (dark) yet tappable (pre-existing, was .32) | `index.html:617` `.cell.dim{opacity:.35}` | pixel-sampled contrast | opacity ≈ .55 or a text token |
| M8 | Native placeholder `#757575` is 3.6–4.0:1 on `.tinput` | `index.html:85` (only `:801` styles a placeholder) | measured | `.tinput::placeholder{color:var(--text2);opacity:1}` |
| M9 | Off-state switch track, segmented track and input edge are 1.1–1.3:1 (non-text contrast) | tokens `index.html:261-281`, `:78`, `:829`, `:85` | computed | design call: a hairline border on off switches/inputs |
| M10 | Dot-font titles shrink without a floor (ro "Săptămâna asta" pitch 1.0, it "Questa settimana" 0.93 at 320); `&` and `'` are missing, so "Currency & format", "Backup & restore" and `de-CH` amounts (`6'246`) fall back to plain text | `hub.js:12`, `calendar.js:90`, `index.html:1030` vs the 1.2 px floor in `settings.js:7`; `dots.js` table | audit probes `titles.mjs`, `swiss.mjs` | one floor in `dotGlyphSVG` (`dots.js:183`); draw `&` and `'` |
| M11 | Focus ring invisible on the HUB hero in the light theme (keyboard / Switch Control only) | `index.html:49,361` ring `#0A0A0A`, hero `:486` | 1.03–1.16:1 | `.hero :focus-visible{outline-color:#fff!important}` |
| M12 | Sheets ignore Escape (pre-existing) | only the alert dialog has a keydown (`index.html:1881`) | Escape on Settings leaves it open | one keydown → the sheet's close/back action |
| M13 | Minor semantics: HUB section titles are not headings; five decorative SVGs (`.hci`, guide cards, `.chevd`, `.hpill` icon) lack `aria-hidden`; tour caption read twice (`.ct` + `#coachlive`); language rows lack `radiogroup`/`lang` | `hub.js`, `dots.js:190`, `index.html:1358-1364`, `settings.js` | Chromium AX tree | add the attributes |
| M14 | Motion tokens not used everywhere: `cubic-bezier(.32,.72,0,1)` (= `--e-ios`) written out 8×, `(.2,1,.32,1)` 4×, `(.2,.9,.3,1)` 5×; press feedback has 5 scale/duration variants; count-up durations 360/420/460/500/700 ms in JS; timers hand-coupled to CSS (`stackFlip` 360, onboarding clone 320) | e.g. `index.html:107,1113,1190,1207,1593,1786`, `settings.js:32`, `:47`, `:236-237`, `:372` | grep | one set of JS constants read from the CSS tokens; one press pair |
| M15 | Layout animations: island transitions width/height/padding on every scroll-direction change (web `:93`, native `App.js:172` JS driver); the repeat→day morph animates height + `grid-template-rows` with a per-frame `offsetLeft` read for the ring (`:1099-1105`, `:1923-1927`); row delete animates height/margin (`:227`); `@property --gx/--gy` are registered `inherits:true` and transitioned 400 ms on every glass press (`:474-476`, style recalc of the subtree + repaint) | as listed | frame cost not measured on a device | transform/opacity where possible; measure first |
| M16 | HUB card stack ignores release velocity (flips only at |dx| ≥ 70) and cannot be caught during its 360 ms fly | `index.html:1846-1858` | code | add a velocity threshold |
| M17 | Guide finger assumes the full island even when the native island has shrunk to the pill (code reading; not reproduced on the phone) | `tourPlace` `index.html:1370-1372` | page is never told about the mini state | post the mini state to the page |
| M18 | Country list opens at the top; the selected country is below the fold | `settings.js:123` | `shots/430-light-sheet-stCountry.png` | scroll the `.on` row into view on open |
| M19 | Corrupt `shifthub_v4` JSON is overwritten on the next save without a copy (pre-existing) | `loadState` `index.html:1459` | code | keep the raw string under a `_corrupt` key |
| M20 | Native bridge hardening: `ownUrl` lets non-http(s) schemes through with `originWhitelist:['*']`; no overall message length cap (`lbl:`, `backup:` unbounded) | `mobile/App.js:16`, `onWebMessage` | only reachable from a compromised page (CSP blocks forms/frames) | check on a device first, then tighten |
| M21 | Dead code: 6 unused keys × 6 languages in `i18n.js` ("Estimated net pay for {m} {y}", "Pay breakdown", "Next shift", "Net per paid hour", "Income history", "Attendance bonus, 13th salary…"); `dotWidth` (`dots.js:145`); `case 'onbGoto'` (`index.html:1973`); CSS `.sp` (`:34`), `.r14` (`:310`); 4 dead `backdrop-filter: blur` declarations (`:37,104,203,231`, kept off only by `!important` at `:307,327,328`); `react-native-safe-area-context` with no import (check peers first) | as listed | grep | delete |
| M22 | Doc drift: ARCHITECTURE still describes the guide as a dim with a clip-path hole and bubbles (now a ghost finger + caption) and old page ids `stCur/stNf/stWs/stWe` (now `stCurNf/stWeek`); CLAUDE.md lists eight JS files (no `dots.js`, also missing from the bump rule), calls `sw.js` cache-first (documents are network-first); NEXT_STEPS line 3 says both "user-verified" and "not yet phone-verified" and still mentions `expo-symbols`; `<title>` sits in `<body>` (`index.html:11`); manifest colours still `#0F0F13` while the page is `#000` | docs, `manifest.json` | read | update the docs with the merge |
| M24 | HUB stack drag does not lock to one pointer: a second finger moves or ends the drag | `index.html:1852-1858` (stk handlers ignore `e.pointerId`) | code-review / emil multi-touch rule | store the first `pointerId` and ignore others |
| M25 | Restore backup is the loudest control (solid red, full width) though rare and protected by a safety copy; its confirm says "cannot be undone" while `shifthub_v4_prev` exists; the backup reminder card sits second on the HUB, between the amount and the week | `sheets.js:154`, `hub.js:96` | impeccable critique A, verified in code | secondary style for Restore (red only inside the confirm); match the confirm text to the safety copy; decide the reminder's place with the user |
| M26 | The page ignores `prefers-reduced-transparency` and `prefers-contrast`: the web/PWA glass stays translucent for those users (the native island falls back correctly) | `index.html` (0 rules) | grep | solid `--gtc` values under those queries |
| M27 | Worst-case data (break-ui): weekly total pushes "HUF" past the card at 320 with a 9-digit salary; year sheet label touches its amount; a #FFFFFF shift colour disappears on the light calendar; a shift with start = end is silently paid as 24 h | `hub.js:47`, `sheets.js:103-121`, `calendar.js` tiles, engine (start=end) | `scratchpad/breakui/out/worst-320-*.png` | fit/wrap the week footer; gap on year rows; hairline ring for near-page colours; decide start = end (reject or label 24 h) |
| M28 | Onboarding salary field `#onbnet` has no programmatic label (the visible text is not a `<label>`); Settings amount inputs rely on adjacent text; several placeholders lack "…" | `index.html:1296`, `settings.js` stNet/bonuses | web-design-guidelines | wrap in `<label>` / `aria-label` |
| M23 | Test hygiene: `test.mjs:1827` has an `|| true` assertion; 564 fixed sleeps; ~15 min serial run. Untested: dot-glyph coverage beyond month names, the 100-item caps, a large-data time budget, Calendar morph interruptions, Settings pages across a language change, onboarding reload mid-flow | `test.mjs` | read | remove the tautology; add the listed tests by risk |

## What is good

- **Cosmetic-only holds:** `normalize`, `exportBackup`, `applyBackup` and `SK` are byte-identical to `main`; the engine only lost `csvExport` (user decision) and nothing references it; the only data-side change is three new shift icons.
- **Tests green and behaviour-first:** 390/390 with real CDP touch, six-language loops, Reduce Motion variants, `pageerror` asserted; no `pageerror` in any of this audit's runs, including net 0, no shifts, only paid leave, year 2100, 999,999,999 and all six languages at 320 px.
- **Translations complete:** 0 missing keys in any language; all accented dot glyphs present for ro/es/de/fr/it/pt.
- **Plan rules met:** no active `backdrop-filter`, no Plus Jakarta in code, build/version/SW in sync, fonts self-hosted.
- **Security:** every user string goes through `esc`/`shiftLabel` (incl. the new dot-font `aria-label`); backup import is size-capped, versioned, confirmed, validated (hex colours, icon whitelist, ISO keys, caps) with a `_prev` safety copy; the native bridge validates every message (`ico:` 4 path strings ≤ 20000 chars, `notif:` ≤ 30 bounded items, enum `tab:`/`thm:`), never injects page values into native JS, locks the backup filename; `sw.js` same-origin only.
- **Scale:** 40000 assignments + 100 shifts + 100 additions → HUB/Calendar render 17 ms, save 11 ms (desktop).
- **Motion:** one token set exists (`--d1..4`, `--e-out/--e-ios/--e-pop`); global Reduce Motion kill-switch plus JS `reduce` gates (count-up jumps, FLIP, stack, onboarding, title assembly, ghost finger, confetti, tiles, morph); the native island honours `isReduceMotionEnabled`; the sheet drag is 1:1, rubber-banded, velocity-aware and catchable; no endless rAF loops; global `pointermove` listeners return at once when idle.
- **Accessibility basics:** sheets/onboarding/dialogs make the background inert; focus moves in and back to the opener; tabs have `role=tab`/`aria-selected`; dot-font numbers are `role=img` with the real text, read once; count-ups never spam live regions; `<html lang>` follows the app language; every icon-only button is labelled.
- **Design:** HUB, Calendar, Shifts, Settings and Onboarding match their mockups and each other (glass tokens, flat dark variant, grey cards on white sheets, dot-font titles); the 26,070,534 HUF hero fits at 320 px; German at 320 px has no page-level overflow outside the quick sheet; all 34 countries listed and sorted with accents.

## Counts

Blockers 0 · Important 9 (3 pre-existing: I1, I2, I8) · Minor 28 (groups; 4 pre-existing: M7, M12, M19, part of M20). Pass 2 added M24–M28 and the sheet-cascade note under I4; nothing new reached blocker or important, and no pass-1 finding was disproved.

Working notes of pass 2 (per-skill outputs) are not committed; the findings above are the verified result.

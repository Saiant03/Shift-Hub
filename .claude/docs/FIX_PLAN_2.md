# Fix plan 2 — everything from the re-audit of 2.35/b128 (branch `Work`)

## Context

The re-audit (`.claude/docs/FINAL_AUDIT.md` → "Re-audit 2.35 / b128", 2026-11-23) found 0 blockers, 1 important (N1: the 100th own shift is lost on reload when paid leave exists; the limits test masks it), 11 new minor items, 3 partial and 8 open old findings. The user wants all of them fixed, staged by job, before the `Work` → `main` merge. Decisions (user, 2026-11-23, question rounds):

- VoiceOver (I8, M13) stays **deferred**.
- 200 % zoom: **reflow only** (no full Dynamic Type / rem rewrite).
- Today vs selected: today becomes a **thin grey ring**, selection keeps the thick black ring.
- Onboarding salary: **remove the input card under the ± buttons; tapping the big number lets the user type the salary**; 0 stays allowed; the HUB shows **"Set your salary"** when net is 0.
- Native: **all three** (M20 bridge, M17 guide vs mini island, I9 testable island logic) in one stage.
- Critique: **expand abbreviations** and **add a legend for the day dots**; backup card stays where it is.
- Minor design/a11y: **all** (M9, M10, M18, N5).
- Test-suite sleep cleanup: **not now** (only the masking limits test is fixed).

## Rules for every stage

Read CLAUDE.md, `.claude/memory/CURRENT_STATE.md`, `NEXT_STEPS.md`, this plan, the relevant part of `FINAL_AUDIT.md` and `.claude/docs/ARCHITECTURE.md` first; short question round only for what this plan leaves open. Ponytail: smallest diff, no engine change, backup format unchanged. Sonnet writes code and tests (model explicit), Opus reviews every diff with `ponytail-review` (max 2 correction rounds); Haiku writes the i18n strings, Opus checks them. New text via `tr()` in all six languages. Bump `APP_VERSION` + `b<N>` together (9 script tags + `sw.js` cache/precache). A new test per fix, red on the old code. `node test.mjs` full suite in the background, waited for; Playwright screenshots 320/430 light/dark of every touched screen, `pageerror` empty. Commit + push to `Work` only; docs/memory also to `main`; stop for the user's Expo check.

## Stage 1 — Data and dependencies (2.36, b129)

1. **N1 cap.** `normalize()` (`index.html`, shifts block ~1482): cap the **non-leave** shifts at 100 and keep the existing leave shift wherever it sits (so its name/colour/times survive too); `saveShift` keeps counting non-leave shifts (`>=100`). No other change.
2. **N2 test.** Rewrite the limits test (`test.mjs` ~4540) to use the app's real order (default shifts, leave 4th, new shifts appended through `openNewShift(); saveShift()` with unique ids), assign a day to the newest, reload, and assert: 100 own shifts, the newest and its assignment present, the leave shift unchanged. Add a restore case: 100 own + a renamed/recoloured leave at position 101 → leave kept as is.
3. **N10.** `npm audit fix` (no `--force`) in `mobile/`; commit only `package-lock.json` if it changes; record what remains.

Verify: full suite; user checks in Expo: add a shift, reload, `npm run tunnel` works.

## Stage 2 — Onboarding salary, HUB, Calendar clarity and wording (2.37, b130)

1. **Onboarding salary** (`index.html`, onboarding `step===2` ~1338): delete the `.obfld` input card; keep the big dot number and the ± buttons; the number becomes the tap target: `<label for="onbnet">` wraps the number, and a numeric `<input id="onbnet" inputmode="numeric">` sits over it (transparent, 16 px+ font so iOS does not zoom); typing updates the dots live via the existing `syncOnbNet`/`onbNetUI`; keep a visually hidden label text "Net monthly salary" so the a11y name test still holds (update the test to the new markup). 0 stays allowed.
2. **HUB "Set your salary"** (`hub.js` ~95, next to the existing `guide(...)` "Add your shifts" card): when `state.salary.net===0`, show a `guide` card "Set your salary to see your estimated pay." that opens Settings → Net salary (`stNet`); reuse `guide()`; new string ×6.
3. **Today vs selected (N7):** `.cell.today::after` → thin grey ring (e.g. 1.5 px `var(--text2)`, ≥ 3:1 against the page in both themes, measured); `.calsel` stays the thick black ring; onboarding practice week follows the same rule.
4. **Abbreviations:** daybar badges (`calendar.js:30-32`) "+100% hol." → "Holiday +100%", "{h}h OT" → "Day overtime {h} h", "{h}h OT·n" → "Night overtime {h} h" (fit check at 320 in all languages; wrap allowed); Settings Premiums row value "4/4" → "{n} on" (`settings.js:47`); "1 wks" → plural-aware ("1 week" / "{n} weeks", `calendar.js:52`, via `Intl.PluralRules` or two keys). Unused keys removed.
5. **Dot legend:** each daybar badge gets the same marker as its calendar dot (a small dot in the dot's colour before the text), so the day card explains the dots; no new legend block.

Verify: new tests (onboarding tap-to-type updates the value and the dots; HUB card at net 0 opens stNet; today ring colour/width and contrast; badge texts in 7 languages fit at 320; plural "1 week"); screenshots onboarding all steps (3 runs), HUB empty, calendar-sel light/dark; user checks in Expo.

## Stage 3 — Layout, accessibility and motion polish (2.38, b132)

1. **N3** bonuses list name: `overflow-wrap:anywhere` on the name in the bonus row (`settings.js:84`).
2. **N4 reflow at 200 %** (true 215 px viewport): shift-editor time rows (Start/End/Break) wrap the pill under the label instead of overflowing; HUB next-shift card (`.hcard`) lets the amount wrap/shrink; no `scrollWidth > clientWidth` on any tab or sheet at 215 px.
3. **N5** Calendar Edit brushes: 44 px hit area via a `::before` expander (look stays 38 px).
4. **M9** non-text contrast: hairline border on the off switch track, the segmented track and `.tinput` edges, ≥ 3:1 in both themes.
5. **M10** dot font (`dots.js`): draw `&` and `'` (so "Currency & format", "Backup & restore" and `de-CH` amounts render in dots) and one minimum pitch floor in the shared drawing path (the 1.2 px floor from `settings.js:7` moved to `dotSVG`).
6. **M18** Country page opens scrolled to the selected country (`.on` row into view on open, not on every refresh).
7. **N9** `.tabhi` width and `.hdots i` width transitions → `transform: scaleX()` (same look); **M14** leftovers: the 6 overshoot literals → one token each in `.phone` (`--e-spring2` style names), read through `MO` where JS uses them.
8. **N11** `autocomplete="off"` on `#shname`, `#bonusname`, `#chname`; `translate="no"` on the brand name.
9. **N12** ARCHITECTURE.md: `dots.js` entry and the new onboarding salary / HUB salary card notes.

Verify: new tests (215 px no overflow on every tab/sheet; brush hit area 44; contrast values; `&`/`'` glyphs present and a long title never below the floor; country list scrolled to selection; no width transition on `.tabhi`/`.hdots i`; tokens defined once); break-ui harness (5 states, 320/430/200 %) re-run; screenshots; user checks in Expo.

## Stage 4 — Native wrapper (2.39, b133 if the page changes)

1. **I9 testable island logic:** move the pure parts of the native island out of `mobile/App.js` into `mobile/islandLogic.js` (plain functions, no React: section hit-test from x/width, next mini state from scroll delta incl. the 24 px / 4 px dead-bands, `ico:` payload validation, `lbl:` parsing); `App.js` imports them; `test.mjs` imports the module and asserts each case. Check that `mobile/sync-html.js` and Expo bundling are unaffected.
2. **M17 guide vs mini island:** when the native island changes mini state, `App.js` injects `window.shIslMini&&shIslMini(0|1)`; the page stores it and `tourPlace` uses the 64×52 pill rect when mini (same as the web `islMini` path).
3. **M20 bridge:** `ownUrl` allows only the own https origin plus `about:blank`/`data:` needed by the WebView (verify on the device which ones are actually used before narrowing); `onWebMessage` rejects messages over a fixed length (e.g. 64 KB, above the largest legitimate `ico:`/`backup:` payload — measure it first).

Verify: new `test.mjs` cases for `islandLogic.js` and for `shIslMini` → `tourPlace`; full suite; user checks in Expo: island tap/scroll/mini, guide with the mini island, backup share, reminders, haptics, status bar.

## Final — Re-audit, then merge

Full re-audit with the same tools as 2026-11-23, new section in `FINAL_AUDIT.md`, stop. After the user confirms: `git fetch origin main`, merge `Work` into `main` (no force-push), push, update memory.

## Not in this plan (user decisions)

VoiceOver (I8, M13); full Dynamic Type; backup card placement; test-suite sleep cleanup.

## On approval

Save this plan as `.claude/docs/FIX_PLAN_2.md` (Work + main), point `NEXT_STEPS.md` at it, then start Stage 1 only.

## Status

- Plan approved by the user 2026-11-23.
- Stage 1 (2.36, b129): IMPLEMENTED on Work 2026-11-23, USER-VERIFIED in Expo 2026-11-23. normalize() caps own and paid-leave shifts at 100 each (user decision 2026-11-23: 100 + 100 templates), order kept; saveShift unchanged (counts own shifts; a 101st leave made by toggling leave on an existing shift would still be dropped on reload — not addressed, needs 100 leave templates). Limits test rewritten with the app's real order + new restore test (both red on the old code). npm audit fix (lock only): 5 moderate -> 3, all minimatch via @expo/fingerprint (fix only via Expo 52 downgrade). node test.mjs 425/425.
- Stage 2 (2.37, b130): IMPLEMENTED on Work 2026-11-23, waiting for the user's Expo check. Onboarding salary: input card removed; the big dot number is a `<label for="onbnet">` with a transparent 16 px numeric input over it (tap selects the amount, typing feeds the dots live, focus ring on the number; sr-only "Net monthly salary"). HUB: net 0 shows only "Set your salary to see your estimated pay." (opens stNet; user decision: the shifts card returns once net > 0). Today ring 1.5 px `--text2` (≥ 3:1 measured, light/dark, Calendar and practice week); selection unchanged. Badges "Holiday +{p}%" (pale red, user decision), "Day/Night overtime {h} h", Premiums "{n} on", repeat "week"/"weeks"; old keys removed. Dot legend: holiday badge red dot, both overtime badges gold dot (same as the calendar's single overtime dot, user decision). On short screens (≤ 479 × 798) the badge line scrolls sideways so the grid never resizes (user decision). node test.mjs 431/431. Corrective b131 (user report 2026-11-24, display stays 2.37): Calendar Done no longer snaps the grid at the end of the morph — the cells and the selection ring now also scale to their final height during the 360 ms (transform only; the jump existed since before 2.36); new test; node test.mjs 432/432. Stage 3 moves to b132, stage 4 to b133.

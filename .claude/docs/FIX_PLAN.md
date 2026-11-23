# Shift Hub redesign — fix plan before merging `Work` into `main`

_Written 2026-11-23 from `.claude/docs/FINAL_AUDIT.md` (read it for evidence, repro steps and line numbers; lines move, search by function name). Decisions: the user, in the 2026-11-23 question rounds. Three stages on branch `Work`, one per session; each stops for the user's check in Expo on the iPhone. Then a full re-audit, then the merge after the user confirms._

## Primary goal

Close the important findings of the final audit (except VoiceOver) plus the chosen minor ones, without changing how pay is computed, so the redesign can replace the live app.

## Decisions (user, 2026-11-23)

- Scope before merge: important findings + selected minor ones; VoiceOver work (calendar day semantics I8, headings, landmarks) is deferred to a later stage.
- Pre-existing bugs (caps, inherited-key country, corrupt JSON) are fixed now, in stage 1.
- Limits: shifts stay at **100**; additions (bonuses) and custom holidays rise to **300**; reaching any limit shows a message (six languages) and adds nothing.
- Start = end on a shift: the editor refuses to save; shifts already stored with start = end are **corrected on load to end = start + 8 h** (normalize).
- Cascades: the Shifts row/track cascade and the sheet block cascade play **only on first launch / after onboarding**; the dot-font title assembly stays.
- The 4 old sheets (day extras, quick assign, year, month) get the **full Settings look**.
- Restore backup becomes a secondary (grey) button; red only inside the confirm, whose text mentions the safety copy.
- Glass press release **160 ms**, no overshoot.
- Island: only the **web** island is optimised (transform-based shrink, flat on the dark theme); the native island stays as it is. No `backdrop-filter` (CLAUDE.md rule stays).
- Calendar Edit → Done morph: same look, cheaper animation.
- HUB stack: flick (velocity) also flips, catchable mid-flight (no 360 ms lock), one pointer only.
- Near-page shift colours (white on light, black on dark) get an automatic hairline.
- Extras in: Reduce Motion short opacity fades (≤ 120 ms) for toggles/accordions; opaque glass under `prefers-reduced-transparency` / `prefers-contrast` (web); `npm audit fix` in `mobile/` (non-breaking); Escape closes sheets.
- Frame measurement: done by Opus in Chromium with CPU throttling (before/after), no app code.
- Docs updated in stage 3 and also pushed to `main`; manifest colours with the app on `Work`.
- Final: a **full re-audit** with every tool (as on 2026-11-23), then merge after the user confirms.

## Rules for every stage

- Read CLAUDE.md, `.claude/memory/CURRENT_STATE.md`, `NEXT_STEPS.md`, this plan and the relevant part of `FINAL_AUDIT.md` first. Short question round only for anything this plan leaves open.
- Ponytail: smallest diff; no engine change except the start = end correction in `normalize()`; backup format unchanged.
- Sonnet writes code and tests (model passed explicitly); Opus reviews every diff (`ponytail-review`), at most 2 correction rounds; subagents never touch git.
- New user-facing text via `tr()` with all six languages in `i18n.js`.
- Bump `APP_VERSION` and `b<N>` together (index.html script tags + `sw.js` cache/precache).
- `node test.mjs` full suite green (run in the background, wait for it), a new test for every fix, Playwright screenshots 320/430 light/dark, `pageerror` empty.
- Commit and push to `Work` only; stop for the user's Expo check; update this plan's status and memory.

## Stage 1 — Data and bugs (2.33, b126)

1. **Limits with a message.** `normalize()` (index.html): additions and custom holidays cap 300 (shifts stay 100). Add paths refuse at the limit with a toast: `saveShift` (new shift only), the bonus save, `chAdd`. One new string, e.g. "You can add up to {n}." in six languages. Tests: at 100 shifts the 101st is refused, count stays 100 after reload; at 300 additions / holidays the same; a backup with 101 shifts still keeps paid leave (existing test).
2. **Inherited-key country.** `normalize()`: `Object.hasOwn(COUNTRIES, R.country)` (and the same check anywhere `COUNTRIES[x]` validates input). Test: restore `{"region":{"country":"constructor"}}` → country falls back, no pageerror, app renders after reload.
3. **Corrupt saved JSON.** `loadState()`: in the `catch`, copy the raw string to `shifthub_v4_corrupt` (try/catch) before anything can overwrite it. Wipe ("Delete all data") also removes that key. Test: seed invalid JSON → app starts with defaults, the raw text is in `shifthub_v4_corrupt`.
4. **Start = end.** Shift editor save refuses equal start and end with a message (six languages); `normalize()` sets `end = (start + 480) % 1440` when `start === end`. Tests: editor refuses; a stored 0–0 shift loads as 0–480.
5. **Done → tab switch.** `toggleEdit` closing rAF loop: when `state.tab!=='calendar'`, clear `editClosing`/`editMode` and return without `renderScreen` (or clear them in `switchTab`). Test: Edit → Done → switch to HUB within 360 ms → exactly one HUB render.
6. **Stale stack timer.** `stackFlip` timeout: `if(!f.isConnected){stFly=0;return;}` before `mark()`. Test: flip, re-render within 360 ms → no pageerror, dots match the new stack.
7. **`npm audit fix`** in `mobile/` (no `--force`); commit `package.json`/`package-lock.json` only if they change; `npm audit` shows 0 moderate or the remaining reason is noted. The user checks `npm run tunnel` in Expo.

Verification: full suite, the new tests, screenshots unchanged except the toast; user checks in Expo (add/limit message, a restore, Calendar Done → HUB, tunnel works).

## Stage 2 — Motion (2.34, b127)

1. **Cascades only on first launch.** `switchTab` stops setting `shfEnter` on every visit (set it only where the HUB cascade is enabled: launch / after onboarding); sheet block cascade `.inner.shsheet.shin>[data-k]` only on that same first-run condition; title assembly stays. Update the comment at `switchTab`.
2. **Interruptible Settings push.** `pgBuild`: when `pg` is running, read the top layer's live position (computed transform → `c`), and `pgRun` from it in the other direction instead of `pgEnd()` first. Test: Back 150 ms into a push → no jump (position continuous).
3. **Reduce Motion.** `pgRun` reduce branch animates `[{opacity:c0},{opacity:c1}]` and clears inline transforms; the global kill rule allows ≤ 120 ms opacity transitions on toggles/accordions (spec allowance). Tests: cancelled edge swipe under Reduce Motion never drops the page's opacity below its start; no transform animation runs under Reduce Motion.
4. **Glass press** release `transition: transform 160ms cubic-bezier(0.23,1,0.32,1)` (keep the .18 s press-in); unify the legacy `.press`, `.card.press`, dialog buttons and steppers on the same pair.
5. **HUB stack.** Lock to the first `pointerId`; flip when |dx| ≥ 70 **or** release speed > ~0.5 px/ms (from the last pointer samples); allow a new grab while flying (no `stFly` input lock; retarget from the live transform).
6. **Calendar Done morph.** Reserve the chip-row height so the grid does not re-lay out; animate only opacity/transform of chips and card content; drop the per-frame `offsetLeft` read for the ring (compute once). Same look.
7. **Web island.** Shrink via transform / `clip-path: inset()` on a fixed-size layer (no width/height/padding transition); apply the flat dark-glass tokens (`--gspot`, `--grim`, `--gsheen`) to `#tabbar`. Native island untouched.
8. Small: `@property --gx/--gy` → `inherits:false`; row delete → FLIP translate of the rows below instead of height/margin; drop the permanent `will-change` on `.swipe .front`; motion literals → the existing tokens / one set of JS constants.

Verification: Chromium frame measurement with CPU throttling (4×–6×), before vs after, for: tab → Shifts, open shift editor, Calendar Done, HUB scroll (island), stack flick, Settings push + Back; full suite; screenshots; user checks feel in Expo.

## Stage 3 — Design and cleanup (2.35, b128)

1. **Four sheets in the Settings look:** `sheetDayMeta`, `sheetQuickDay`, `sheetYear`, `sheetMonth` → `.inner.shsheet` header (glass pill buttons Done/Cancel/Save, dot title where it fits, plain date title where it does not), grey cards on the white sheet, same close vocabulary ("Done"). Functions unchanged.
2. **Touch targets ≥ 44 px:** `.brktoggle` min-height 44, `.hcirc` 44 hit area (`::before`), `.wday` width where the row allows, `#onbnet` 44 high or the card becomes its `<label>`, onboarding week cells, `.gp` at 320.
3. **Contrast:** `.cell.dim` to ≥ 4.5:1 (opacity ≈ .55 or a text token); `.tinput::placeholder{color:var(--text2);opacity:1}`.
4. **Long names / worst case:** `overflow-wrap:anywhere` + `min-width:0` on quick-sheet rows and `.stsheet .slbl`; weekly total footer fits at 320 with a 9-digit salary; year-sheet rows keep a gap; dangling "·" kept with the next span; holiday dot inset under 360 px.
5. **Near-page colours:** hairline ring on tiles/swatches when the shift colour is too close to the page tone (both themes).
6. **Restore backup:** secondary style; red only in the confirm; confirm text mentions the safety copy (six languages).
7. **Escape** closes the open sheet (same action as its close/back button); **web glass** opaque under `prefers-reduced-transparency` / `prefers-contrast: more`.
8. **Label** for `#onbnet` (and `aria-label` on the Settings amount inputs).
9. **Dead code:** `dotWidth`, `case 'onbGoto'`, 6 unused keys × 6 languages, `.sp`, `.r14`, the 4 dead `backdrop-filter: blur` declarations, `react-native-safe-area-context` if no Expo peer needs it, the `|| true` test assertion, the violet-tinted sheet shadow → neutral.
10. **Docs:** ARCHITECTURE (guide = ghost finger; page ids `stCurNf`/`stWeek`), CLAUDE.md (`dots.js` in the Files list and the bump rule; `sw.js` network-first for documents), NEXT_STEPS (no contradictions), `<title>` into `<head>`, manifest colours. Docs also pushed to `main`.

Verification: full suite + new tests (targets, contrast values, sheet headers, Escape), break-ui harness re-run (all five states), screenshots 320/430 light/dark; user checks in Expo.

## Final — Full re-audit, then merge

Re-run every audit tool used on 2026-11-23 (code, security, design, accessibility, motion, break-ui, npm audit, Chromium frame measurement), update `FINAL_AUDIT.md`, and stop. After the user confirms: `git fetch origin main`, merge `Work` into `main` (no force-push), push, update memory.

## Deferred (not in this plan)

VoiceOver (calendar today/selected, headings, landmarks, tour caption read twice, language radiogroup); Dynamic Type / text-size scaling; native island animation; HUB backup-reminder card placement; remaining placeholder wording; `text-wrap: balance` on headings.

## Status

- Stage 1: implemented on `Work` 2026-11-23 (2.33, b126) — all 7 items; 6 new tests (each red on the old code), `node test.mjs` 396/396; `npm audit fix` changed only `mobile/package-lock.json` (@expo/fingerprint 0.21.9 → 0.21.10), audit now 5 moderate (was 4), all in Expo dev tooling (@expo/cli → glob, expo → @expo/fingerprint → minimatch 10.x); the only full fix is `--force` = breaking downgrade to Expo 52, not done. USER-VERIFIED in Expo 2026-11-23.
- Stage 2: not started.
- Stage 3: not started.
- Final re-audit and merge: not started.

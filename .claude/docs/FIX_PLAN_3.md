# Fix plan 3 — short fix stage after the re-audit of 2.39/b137 (branch `Work`)

## Context

The re-audit (`.claude/docs/FINAL_AUDIT.md` → "Re-audit 2.39 / b137", 2026-11-24) found 0 blockers, 1 important (R1: with 100 own shifts, turning paid leave into a normal shift loses the newest shift on reload) and 14 minor items. The user wants one short stage before the `Work` → `main` merge: R1, R2, R4–R9, R12, R13. Not in this stage (after the merge): R3, R10, R11, R14, R15. Still deferred: VoiceOver (I8, M13). No engine change, backup format unchanged.

Decisions (user, 2026-11-24, question round):

- R2: raise the import limit only; a foreign file over the limit keeps the existing "Invalid backup file" toast (no new string).
- R4: on short screens each day-card badge shows its coloured dot + the short value ("+2 h", "+100%"); the full label stays in `aria-label`; the grid does not move.
- R8: the full ≤ 259 px rule (smaller cell font, cell icon hidden, 2 px gap, minimum row height with vertical scroll when it does not fit) plus the short month name in the HUB hero (`Intl`, `month:'short'`).

## Rules

Same as `FIX_PLAN_2.md` "Rules for every stage": read CLAUDE.md, memory, this plan, the re-audit section and `ARCHITECTURE.md` first. Ponytail: smallest diff. Sonnet writes code and tests (model explicit), Opus reviews every diff with `ponytail-review` (max 2 correction rounds); Haiku writes any i18n strings and documents, Opus checks them. A new test per fix, red on the old code. Bump `APP_VERSION` 2.40 + b138 (9 script tags + `sw.js` cache/precache); further correctives b139+, display stays 2.40. `node test.mjs` full suite in the background, waited for; Playwright screenshots 320/430 light/dark (+215 for R8) of every touched screen, `pageerror` empty. Commit + push to `Work` only; docs/memory also to `main`; stop for the user's Expo check. The merge does not start until the user confirms.

## Stage — 2.40, b138

1. **R1** `saveShift` (`index.html` ~1639): on edit, refuse with the existing toast "You can add up to {n}." when `state.shifts.filter(s=>!s.vac&&s.id!==state.editingId).length+(state.d.vac?0:1)>100`. Test: 100 own + leave, a day on the newest; edit the leave into a normal shift; Save is refused; after reload the newest shift and its day exist.
2. **R2** import limit 5e6 → 8e6 at both checks (`index.html` ~1556 text, ~1690 file size), same as `msgOk` in `mobile/App.js`. Test: the export of the largest state `normalize` allows re-imports.
3. **R4** in the `(max-width:479px) and (max-height:798px)` query (`index.html` ~663): badges show dot + short value; full label in `aria-label`. Test at 320×640: no badge text cut (scrollWidth ≤ clientWidth), every badge has the full label for screen readers.
4. **R5** `calDone` (`index.html` ~1153): the cell content is not stretched during the morph (translate the cell; scale only a background layer, or counter-scale the content). Test at 320×640 mid-morph: `.dn` effective scaleY 1 (±0.01).
5. **R6** `onbNetUI` (`index.html` ~1335): typing sets the value directly (no count-up, no pop); pop + count-up stay for − / +. Test: after one key, `#onbdots` shows the typed value at once.
6. **R7** `.wday.today` (`index.html` ~538): the Calendar's thin 1.5 px `var(--text2)` ring; contrast ≥ 3:1 measured in both themes. Test.
7. **R8** ≤ 259 px rule for the Calendar grid and short month name in the HUB hero (see decisions). Test at 215×466: every cell digit inside its cell's rectangle, no horizontal scroll.
8. **R9** `.screen.cal .repbtn` (`index.html` ~675): 44 px hit area. Test with `elementFromPoint`.
9. **R12** HUB stack: negative `data-p` cards keep the front card's background; stack transform on `--e-ios`. Test mid-animation: the returning card's background is opaque and it does not pass its rest position.
10. **R13** Done crossfade: `dbIn` on `var(--d1) ease`, no delay. Test on duration/delay.

Verify: full suite; screenshots; user checks in Expo.

## Status

- Plan written 2026-11-24. Not started.

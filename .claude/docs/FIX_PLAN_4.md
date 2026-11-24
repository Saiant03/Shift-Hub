# Fix plan 4 — rest of the re-audit 2.39/b137 + HUB spacing, year card and new icon (branch `Work`)

## Context

After FIX_PLAN_3 (2.40/b138, user-verified, merged into `main`), the re-audit of 2.39/b137 (`.claude/docs/FINAL_AUDIT.md` → "Re-audit 2.39 / b137") still has five minor items open: R3, R10, R11, R14, R15, plus notes left after 2.40 and the "Design notes". The user also wants the HUB widgets to breathe (they look cramped), the year total to follow the month shown in the HUB, an entrance/transition for the year sheet, and a new minimalist black-and-white glass app icon. Not in this plan: VoiceOver (I8, M13), N10 (Expo dependencies, needs Expo 52), M23 (test sleeps), the pay engine, the backup format.

## Measured before (HUB, 2.40/b138, real data: 7 months of shifts, 3 bonuses, backup 45 days old)

Screenshots and `measure.json` from the session scratchpad (`hub/before/`, 320/390/430 light/dark, 215 light, breakdown closed/open; pageerror empty).

| Card | Padding | Radius | Title → content | Gap to next |
|---|---|---|---|---|
| hero (dark panel) | 16/20/24/20 | 0 0 36 36 | 28 (label → number) | 12 |
| Last backup guide | 10/14 | 28 | — | 12 |
| This week | 14 | 28 | 10 | 12 |
| Pay details | 16 (title button 44 px tall, so the title sits ~28 px from the top) | 28 | 10 | 12 |
| Last 6 months | 16 | 24 | 38 (room for the value pill) | — |

Side gutter 16. Fonts: `.hlbl` 15/500, `.hrange` 13/400, `.wmeta` 12/400, tile label `.tl` 11/400, `.hblbl` 12/400, guide title 14/600, stack card 15/600 + 16/700, `.hpill` 12/600. Card titles are dot-font SVGs 18 px high (pitch 1.4); at 320 "Last 6 months" falls back to plain text. No horizontal overflow at 320/390/430/215; at 215 the week tiles already touch.

Variants shown to the user (real app with injected CSS, images `cmp-390-light/-dark`, `cmp-320-light`, `cmp-215-light`): A "Ordonat" (all 16, title → content 12), **B "Aerisit" (chosen)**, C "Spațios" (24/24/20).

## Decisions (user, 2026-11-24, question rounds)

- HUB spacing: **B** — 16 px between cards, 24 px under the hero, 20 px inner padding, 16 px title → content, everything on the 4/8 scale; at ≤ 259 px (200 % zoom) the inner padding falls back to 12 px.
- R11: the hours setting is called **"Standard hours / day"** in both places (row and page field; "Full-day norm" removed). The list of extra sums is **"Extra earnings"** everywhere (Settings row, page, HUB); a single item stays "bonus" ("Add a bonus", "Edit bonus"); the key "Additional bonuses" is removed.
- Notes after 2.40: **a** (truncation at 215 px) and **b** (today ring stretches in the Done morph) are in; **c** (day card grows with all five badges) is not.
- Design notes: fuller card titles, scroll hint on horizontal strips, one easing family in the HUB stack are in; flick threshold stays 0.5 px/ms; the brand orange is **not** used — the app stays black and white.
- New (user): "Total {year}" and the 6-month chart follow the month shown in the HUB (January 2027 → Aug 2026 – Jan 2027, "Total 2027", the year sheet opens on 2027). The year sheet gets motion like the HUB month change.
- New (user): new app icon, minimalist black and white with glass: **variant 3 "HUB bars in glass"** (two frosted glass pills and one solid white pill rising left to right on a black radial background with a soft glow behind the white pill), in stage 2.
- Two stages, an Expo check after each.

## Rules

Same as `FIX_PLAN_3.md` / `FIX_PLAN_2.md`: read CLAUDE.md, memory, this plan, the re-audit section and `ARCHITECTURE.md` first. Ponytail: smallest diff. Sonnet writes code and tests (model explicit); Opus reviews every diff with `ponytail-review` (max 2 correction rounds, then Opus fixes it and says so); Haiku writes i18n ×6 and documents, Opus checks them. A new test per item, red on the old code. `node test.mjs` full suite in the background, waited for; Playwright screenshots before/after at 320/390/430 light/dark (+215) of every touched screen, `pageerror` empty. Commit + push to `Work` only; docs/memory also to `main`. Stop for the user's Expo check after each stage; the `Work` → `main` merge only after the user confirms.

## Stage 1 — 2.41, b139 (correctives b140+ would push stage 2 to the next free build)

Skills: ponytail, ponytail-review; animate, review-animations (by hand: not model-invocable), animation-performance for R14, R15, note b and the stack easing.

1. **R3** `normalize` (`index.html` ~1502): duplicate shift ids are dropped in the same filter, before the 100/100 counters (one `seen` set inside the filter; the later dedupe block goes). Test: a crafted backup with 100 own shifts where the first 10 entries repeat one id, plus 10 more unique ones → after restore 100 own shifts with unique ids, the last unique ones kept (red on old code: fewer than 100).
2. **R10** `settings.js:49`: Currency row gets its own icon (new `I.coins`, a stroke icon in the same style as `I.wallet`). Test: the Net salary and Currency rows' icon markup differs.
3. **R11** `settings.js:23` field label → `tr('Standard hours / day')`; `settings.js:48` row → `tr('Extra earnings')`; keys "Full-day norm" and "Additional bonuses" removed from all six languages if no other use (grep). Haiku edits `i18n.js`, Opus checks. Test: the row label equals the page title ("Extra earnings") and the hours row label equals the field label; no `TR` entry for the removed keys.
4. **R14** Calendar Edit entrance (`.cacc` `index.html:620`, `calEdit` path ~1170–1185): no `grid-template-rows` transition on entry; the same clip-path/transform technique as `calDone` (layout set once, clip and translate animate); the selection ring is placed once, at the end of the entrance (no second move). Test: during the entrance `document.getAnimations()` / transitions animate no layout property (no `grid-template-rows`, height, width, top, margin); the ring's transform sampled after the animation ends does not change for 300 ms.
5. **R15** the two easing literals become tokens: toggle knob (`index.html:81`) → a `.phone` token (e.g. `--e-knob`, same curve), ring move (`index.html:1185`) → `MO` from a `.phone` token. Test: no `cubic-bezier(` outside the `.phone` token line in `index.html` CSS/JS.
6. **Note a** at ≤ 259 px: the Calendar month title uses the short month name (`Intl`, as the HUB hero does since R8); the HUB stack card shows the full time on its second line (the "· 8 H" tail drops, the title line may wrap to two lines inside a taller card only at ≤ 259 px). Test at 215×466: no `text-overflow` truncation (scrollWidth ≤ clientWidth) on the Calendar title and the stack card's title/time.
7. **Note b** Done morph (`calDone`): the today ring (pseudo-element) is counter-scaled like the digits and icons. Test at 320×640 mid-morph: the today ring's effective scaleY is 1 (±0.01).
8. **Stack easing** `.hcard` (`index.html:513`): opacity on `var(--e-ios)` like the transform (one family both ways). Test: computed transition timing of transform and opacity is the same curve on front, behind and gone cards.

Verify: full suite, screenshots (Calendar, Calendar Edit, Settings, Net salary page, Extra earnings page, HUB) 320/390/430 light/dark + 215; user checks in Expo.

## Stage 2 — 2.42, b140 (or the next free build)

Skills: impeccable critique + audit **before and after** (scores reported), frontend-design, apple-design, emil-design-eng, mobile-native, break-ui, design:accessibility-review (contrast and touch targets after the re-layout), animate / review-animations / animation-performance for the year sheet.

1. **HUB spacing B** (CSS only, `index.html` ~529–577): `#screen.hub` tokens `--hg:16px` (gap between cards), `--hg0:24px` (under the hero), `--hp:20px` (card padding), `--ht:16px` (title → content), `--hi:16px` (inner blocks such as the week footer); guide card padding `12px var(--hp)`; one radius for every HUB card (28); the Pay details title button keeps its 44 px target with a negative 12 px margin so its title lines up with the others; the chart keeps room for the value pill (`--ht` + 28). At ≤ 259 px `--hp:12px`. The hero inside, the Calendar grid and the tab bar do not change. No content or engine change.
2. **Fuller titles**: HUB card title dot pitch 1.4 → 1.6 where it fits (the existing width fallback to text stays).
3. **Year follows the HUB month** (`hub.js` `histData`, `histCard`; `openYear` in `index.html` ~2019): the six months end at `state.viewY/viewM` (that month highlighted), the pill reads "Total {viewY}", the year sheet opens on `viewY`; the "hide when no history" check uses the same window and year.
4. **Year sheet motion** (`sheets.js` `sheetYear`, `yrPrev/yrNext` ~2020): on ‹ › the content slides 12 px in the arrow's direction and fades in (`--d3`, `--e-out`, the HUB month-change keyframes), the total counts from the old to the new value, the bars move from their old to their new height (transform `scaleY`, no height animation); on opening, the bars grow in a short stagger from the bottom and the total counts up from 0. Reduced motion: instant. Interruptible (a quick second tap starts from the current state).
5. **Scroll hint** on the Calendar brush bar and the day-card badge strip: the edge fades only on the side where more content exists (scroll-driven mask where supported; otherwise a class set when `scrollWidth > clientWidth` and updated on scroll, passive listener, no per-frame work).
6. **New app icon** (variant 3 "HUB bars in glass", drawn as SVG and rendered with Chromium): `icon.png` 512, `mobile/assets/icon.png` 1024, `favicon.png`, Android adaptive background (black) / foreground (artwork at 66 %) / monochrome (white silhouette). `manifest.json` `background_color`/`theme_color` only if they reference the old orange. `splash-icon.png` unchanged. Expo Go keeps showing its own icon (the new one is visible as the PWA home-screen icon or in a native build).

Tests: layout test at 320/390/430/215 — every gap between HUB cards equal (16, 24 under the hero), card padding 20 (12 at ≤ 259), title → content 16, no horizontal overflow and no truncated text at 320 and 215; break-ui data (long bonus names, 1,234,567 pay, 300 bonuses) without overflow; the chart's last bar equals the shown month and the pill shows its year (January 2027 case); year sheet: ‹ › starts a transform/opacity animation and no layout-property animation, reduced motion none; scroll hint present only when the strip overflows; icon files exist at the right sizes.

Verify: impeccable critique/audit scores before and after; accessibility review (contrast, 44 px targets); full suite; screenshots HUB (breakdown closed/open), year sheet, Calendar 320/390/430 light/dark + 215; user checks in Expo.

## Status

- Plan written 2026-11-24 after three question rounds. Nothing implemented yet; waiting for the user's approval of stage 1.

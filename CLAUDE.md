# Shift Hub — working rules

Single-file PWA: everything lives in `index.html` (inline CSS + vanilla JS),
plus `sw.js` (service worker) and `manifest.json`. No build step, no
dependencies. Bump the `shifthub-vNN` cache name in `sw.js` **and**
`APP_VERSION` in `index.html` (keep them in sync) whenever you change
`index.html`/`manifest.json` so clients get the update. Primary target is the
**mobile** app; the web/PWA is the test/demo surface.

## Ponytail — lazy senior dev mode

Lazy means efficient, not careless. The best code is the code never written.
Before writing any code, stop at the first rung that holds:

1. Does this need to be built at all? (YAGNI)
2. Does it already exist in this codebase? Reuse the helper/util/pattern that's here.
3. Does the standard library / browser API already do this? Use it.
4. Does a native platform feature cover it? Use it.
5. Does an already-present pattern solve it? Use it.
6. Can this be one line? Make it one line.
7. Only then: write the minimum code that works.

Run the ladder *after* understanding the problem: read the task and the code
it touches, trace the real flow, then climb. A bug fix targets the root cause
(fix the shared function once), not the symptom.

Rules:
- No abstractions, dependencies, or boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Shortest working diff wins — but only once you understand the problem.
- Question complex requests: "Do you actually need X, or does Y cover it?"

Never lazy about: understanding the problem, input validation at trust
boundaries, error handling that prevents data loss, security, accessibility,
and anything explicitly requested.

## Project specifics

- Keep the pay engine correct: base is pro-rata (`net × min(1, worked+leave
  hours / (workingDays × stdHours))`); premiums use the region hourly rate;
  additional non-shift earnings (bonuses / 13th salary) are a separate layer
  added on top (see the pay engine below).
- i18n: English source strings are the keys; add new user-facing text via
  `tr('...')` and add the key to **all six** languages in `TR`
  (ro, es, de, fr, it, pt; fallback is English) with `Object.assign(TR.xx,{…})`
  blocks near `tr`. Localize months/weekdays via `monthName`/`dow*`. Prefer
  browser `Intl` (e.g. `Intl.RelativeTimeFormat`) over hand-rolled per-language
  text when it removes strings.
- Verify visually with the pre-installed Chromium via Playwright before
  committing UI or logic changes.

## Files

- `index.html` — the entire app (inline CSS + vanilla JS). Single source of truth.
- `sw.js` — service worker (cache-first; cache name `shifthub-v<APP_VERSION>`).
- `manifest.json`, `icon.png` — PWA metadata / icon.
- `test.mjs` — regression tests (`node test.mjs`): Playwright + Chromium against the
  real `index.html`, real touch input via CDP. No install step, no dependencies.
- `mobile/` — Expo wrapper. `App.js` = a `react-native-webview` that loads the
  HTML; `sync-html.js` copies `../index.html` into `mobile/htmlSource.js` at
  start (**`htmlSource.js` is generated, not in git — never edit by hand**).
  `App.js` handles `hap:` (native haptics) and `backup:` (native share sheet)
  messages posted from the web layer.

## Process map (where things live — search by function name, lines move)

**State & persistence.** Global `state` object; `SK[]` = persisted keys;
`saveState()`/`loadState()` write/read `localStorage['shifthub_v4']`. Every
mutation ends with `saveState()`. `reduce` = prefers-reduced-motion.

**Render pipeline.** `renderAll()` → `applyAppearance` + `renderTabbar` +
`renderScreen` + `renderOnboard`. `renderScreen(animate)` sets
`#screen.innerHTML = screenHTML()` — a **full re-render** —
→ `screenHub()` / `screenCalendar()` / `screenShifts()`. Prefer **surgical
updates** over full re-renders on hot paths:
- `selectDay(iso)` — day tap: moves the ring (`placeSelRing`), toggles `.sel`,
  refreshes the daybar (`daybarInner`) and week line (`weeklineHTML`); no full
  re-render.
- `histSelect(i)` — income-history bar tap: highlights the bar + updates the label.
- `moveRing`/`placeSelRing`/`paintCellVisual` — used while painting the calendar.

**Pay engine (month-scoped).** `baseHourly(y,m)` = `net / (workingDays ×
stdHours)`. `dayBreakdown({iso,y,m,d}, bh)` → one day's `{total, base, night,
weekend, holiday, otDay, otNight, …}`. `monthTotals(y,m)` sums the month →
`{base, bonusTotal, additions, grand, paidH, …}` and is **memoized** in
`_mtCache` keyed `y.m`; the cache is cleared in `saveState()` and
`clearHolidayCache()` (any data change). `additionsTotal`/`additionForMonth`
compute non-shift earnings from `state.salary.additions[]`. `weekTotalOf(iso)`
sums a weekStart-aware week; `weekDaysOf(iso)` returns its 7 ISO days.

**Sheets & gestures.** `renderSheet()`/`renderSheetUpdate()`; `sheetHTML()`
routes `state.sheet` → `sheetDayMeta`/`sheetShift`/`sheetSettings`/`sheetSalary`/
`sheetRegion`/`sheetBackup`/`sheetQuickDay`/`sheetBonuses`/`sheetExport`.
Global gesture listeners (no central arbiter — keep them from fighting):
`sd` (sheet drag-to-dismiss), `msw` (month swipe on `#calgrid`), `lp`
(long-press day → `openQuickDay`), `painting` (edit-mode paint), `sw`
(swipe-to-delete shift row). `suppressClick` swallows the phantom click after a
gesture. **Sheet scroll vs. drag:** `sdDecide()` picks the owner on the first
~4px — the sheet only for a downward pull with the sheet *and* any nested list
under the finger at `scrollTop 0`; everything else stays native scroll. The claim
is enforced by a non-passive `touchmove` on `#sheet` calling `preventDefault()`
(`touch-action` can't change mid-gesture and pointer `preventDefault` can't stop
a pan — don't go back to either). `state.hubDirty` = a sheet edit changed data;
closing a sheet (Done, backdrop, swipe) re-renders the screen only when it's set. `hap(p)` → native bridge on the Expo WebView, else `navigator.vibrate`
(guarded by `reduce`).

**Feature map (built).**
- Hub: net-pay hero, KPIs + composition bar, **effective net/hour + premiums %**,
  collapsible pay breakdown, **6-month income-history mini chart**, upcoming card.
- Calendar: **surgical day-select**, **"Today" button** (off-month only),
  **repeat-week panel** (daybar turns into a 1/2/4-week selector in Edit mode,
  fills gaps only), "this week" total, long-press quick-assign sheet, month swipe.
- Shifts: templates + editor with a **≈ per-shift earnings estimate** in the preview.
- Settings: regrouped; **additional earnings (bonuses / 13th salary)**; region;
  salary; backup with a **last-backup / "only on this phone"** trust line.
- Onboarding: multi-step product intro; country choice is required (drives
  currency, holidays, premiums).
- Haptics: light tick on day-select and on swipe-dismiss of a sheet.

## Dev workflow (per task)

1. Understand the problem and the real flow before touching code (ponytail).
2. Write the minimal diff; add i18n keys for any new string in all six languages.
3. Bump `APP_VERSION` (index.html) **and** the `shifthub-vNN` cache (sw.js), in sync.
4. Run `node test.mjs` (must stay green; add a test for what you fixed). Then visual test with the pre-installed Chromium via Playwright (module at
   `/opt/node22/lib/node_modules/playwright`, binary at
   `/opt/pw-browsers/chromium-*/chrome-linux/chrome` — pass `executablePath`).
   Seed `localStorage['shifthub_v4']` with a `state` subset (note: shift
   `start`/`end` are **minutes**, e.g. 390 = 06:30). Assert `page.on('pageerror')`
   stayed empty.
5. Commit with a clear message (no model identifiers in commits/code).
6. Commit and push to **`main`** (the single source: the site auto-deploys from
   it and the mobile app pulls it). On mobile the user runs `npm run tunnel`
   from `mobile/` (= `sync-html.js` + `expo start --tunnel`) — never
   `expo start` directly, or the sync is skipped and the phone shows the old build.

**Always work directly on `main` — never create a new branch, even in a fresh
session.** This repo is developed by working and committing straight on `main`;
do not open feature branches or PRs. If a session starts you on a
session-named branch, first `git fetch origin` (session branches can leave a
stale `origin/main` and even histories with no common ancestor), then switch to
`main` (`git checkout main`), align it to the remote (`git branch -f main
origin/main` while not checked out on it, or `git reset --hard origin/main` once
on it), and **delete the session branch** (`git branch -D <session-branch>`).
Never push a session branch. `main` is the only long-lived branch; leftover
session branches are just clutter to delete.

**Concurrency — important.** More than one Claude session may push to `main` at
the same time. **Always `git fetch origin main` and rebase onto it before
pushing**; if a push is rejected, integrate (reset/rebase onto the newer
`origin/main`, re-apply your change, re-bump the version) — **never
force-push** over someone else's commits.

_Minimal-code rules adapted from [ponytail](https://github.com/DietrichGebert/ponytail) (MIT)._

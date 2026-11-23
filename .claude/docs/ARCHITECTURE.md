# Shift Hub — architecture and process map

Read this before touching app code (index.html and the JS files). Search by function name; lines move.

## Process map (where things live — search by function name, lines move)

**State & persistence.** Global `state` object; `SK[]` = persisted keys (not the
view: every launch opens on today); `DEFAULTS` = pristine copy of those keys.
`saveState()`/`loadState()` write/read `localStorage['shifthub_v4']` (a failed
write shows a toast). Everything read from storage or a backup goes through
`normalize(o)` (type/range checks → defaults, old-format migrations) — add new
persisted fields there. Restore (`applyBackup`) replaces all keys (missing →
defaults) and keeps the replaced data in `shifthub_v4_prev`. `TODAY` is a `let`,
refreshed by `refreshToday()` on visibilitychange/focus. Every mutation ends
with `saveState()`. `esc()` escapes quotes too — use it (or `shiftLabel`) for
any user text in a template, text or attribute. `reduce` = prefers-reduced-motion.

**Render pipeline.** `renderAll()` → `applyAppearance` + `renderTabbar` +
`renderScreen` + `renderOnboard`. `renderScreen()` sets
`#screen.innerHTML = screenHTML()` — a **full re-render** —
→ `screenHub()` / `screenCalendar()` / `screenShifts()`. Tab changes go through
`switchTab(tab)`: rendered complete on its first frame (the Shifts row cascade plays only on the first visit after launch/onboarding; its dot-font title assembles on every visit); the whole screen then slides 12px in from the side of the new tab and fades in from .4
over 240 ms (`--e-ios`), interruptible, none under Reduce Motion. Each
tab keeps its own scroll (`tabScroll`). `renderTabbar()` builds the buttons once
(rebuilds only on language change) and just moves `.on`. Prefer **surgical
updates** over full re-renders on hot paths:
- `selectDay(iso)` — day tap: moves the ring (`placeSelRing`), toggles `.sel`,
  refreshes only the day card (`.daybar`, `daybarInner`); no full re-render.
- `histSelect(i)` — income-history bar tap: highlights the bar + updates the label.
- `moveRing`/`placeSelRing`/`paintCellVisual` — used while painting the calendar.
- Motion tokens live on `.phone` (`--d1..4`, `--e-ios/out/pop/press/sheet/glide`); JS reads them once into `MO` — use those, not literals.

**Pay engine (month-scoped, in `engine.js`).** `baseHourly(y,m)` = `net / (workingDays ×
stdHours)`. `dayBreakdown({iso,y,m,d}, bh, cap)` → one day's `{total, base, night,
weekend, holiday, otDay, otNight, …}`; `cap` = `monthTotals(y,m).cap` (the base
cap factor, so day/week figures add up to the month — pass it everywhere
except inside `monthTotals`). Overtime on a day with no shift returns an
`otOnly` breakdown (paid, but not a work day and not part of the norm); paid
leave gets no overtime or premiums. `monthTotals(y,m)` sums the month →
`{base, cap, bonusTotal, additions, grand, paidH, …}` and is **memoized** in
`_mtCache` keyed `y.m`; the cache is cleared in `saveState()` and
`clearHolidayCache()` (any data change). `additionsTotal`/`additionForMonth`
compute non-shift earnings from `state.salary.additions[]`. `weekTotalOf(iso)`
sums a weekStart-aware week; `weekDaysOf(iso)` returns its 7 ISO days.
Holidays (in `holidays.js`): `countryHolidaySet` computes real dates first, then observed
substitutes (`obsShift` modes `mon`/`sun`/`jp`/`us`) moved past days already off,
filed under their own year. `test.mjs` holds hand-computed engine fixtures — keep
them green when touching any of this.

**Sheets & gestures.** `renderSheet()` (open: fresh, `scrollTop 0`) /
`renderSheetUpdate()` (navigation with `state.sheetDir` between the Settings list and
its pages = `sheetPush`: an iOS push with both layers in the DOM, the sheet at one fixed
height (`.sheet.fixh`), plus a left-edge swipe back that tracks the finger (a running push can be reversed by Back or caught by the edge swipe from its live position, `pgHold`) — or an in-place refresh
that keeps inner-list scroll and the focused field (by `id`, with its caret), slides
changed toggles from their old state and pops only changed stepper values — matched
by `data-action`); `sheetHTML()`
routes `state.sheet` → `sheetDayMeta`/`sheetShift`/`sheetSettings`/the Settings pages
(`stNet`/`stPrem`/`stStd` via `sheetSalary(page)`, `stCountry`/`stCur`/`stNf`/`stWs`/`stWe`/`stHol`/`stLang`
via `sheetRegion(page)`)/`sheetBackup`/`sheetQuickDay`/`sheetBonuses`
(`sheetDayMeta`/`sheetShift`/`sheetBackup` live in `sheets.js`; the Settings sheets share the shift editor look, `.inner.shsheet`, and the Settings search filters rows in place via `setFilter`).
Global gesture listeners (no central arbiter — keep them from fighting):
`sd` (sheet drag-to-dismiss), `msw` (month swipe on `#calgrid`), `lp`
(long-press day → `openQuickDay`), `painting` (edit-mode paint), `sw`
(swipe-to-delete shift row), `ro` (hold-and-drag shift reorder; its non-passive
`touchmove` claim sits on `#shiftlist` only). `suppressClick` swallows the phantom click after a
gesture and is cleared by the next `pointerdown` (never by a timer — timers ate
the user's next real tap). One shared `pointercancel` listener finishes/drops
`painting`/`lp`/`sw`/`msw`/`ro` (the sheet has its own); any new gesture needs a line
there. Edit mode blocks only the calendar grid's month swipe. **Sheet scroll vs. drag:** `sdDecide()` picks the owner on the first
~4px — the sheet only for a downward pull with the sheet *and* any nested list
under the finger at `scrollTop 0`; everything else stays native scroll. The claim
is enforced by a non-passive `touchmove` on `#sheet` calling `preventDefault()`
(`touch-action` can't change mid-gesture and pointer `preventDefault` can't stop
a pan — don't go back to either). The pending post-drag clean-up timer (spring-back,
close during a spring-back) lives in `sh._sb`; a drag claim (`sdDecide`), `closeSheet`
and `renderSheet` clear it first, so a stale timer never fires into a newer sheet state.
`state.hubDirty` = a sheet edit changed data;
closing a sheet (Done, backdrop, swipe) re-renders the screen only when it's set. `hap(p)` → native bridge on the Expo WebView, else `navigator.vibrate`
(guarded by `reduce`).

**Feature map (built).**
- Hub (`hub.js`, HubV2 redesign 2.14): full-bleed dark panel `.hero` (dot-font net, delta vs last month, month pill → `sheetMonth`, month swipe on the panel except on `.hstack`), 3D stack of the next 3 shifts (`stk` gesture, one pointer, flips on distance ≥ 70 px or a flick > 0.5 px/ms, catchable mid-flight; `stackFlip`/`stackDone`; tap = `gotoDay`), real-current-week strip, collapsible Pay details (4 tiles; open = grey composition bar + component rows), 6-month chart (`histSelect` surgical), backup nudge. Figures carry `data-k`/`data-count`; `countUp` runs many jobs in one rAF; `hubAfterRender` plays the entrance (`#screen.enter`) only at launch/after onboarding; `syncBar()` posts `bar:dark` while the panel is under the status bar.
- Calendar (`calendar.js`): **surgical day-select**, **"Today" button** (off-month only),
  **repeat-week panel** (daybar turns into a 1/2/4-week selector in Edit mode,
  fills gaps only), long-press quick-assign sheet, month swipe. Assignment motion uses a one-shot `calFx` map (`calendar.js`) consumed by the next `screenCalendar` render: new assignments play `tilePop` and the ripple `.rip`, erased ones play the shrink `.was`; `afterPaint` carries running drop/ripple/shrink animations across its render; the dot-font title assembles only when entering the Calendar tab (`calEnter` → `.calin` on `#screen`).
- Shifts: templates + editor with a **≈ per-shift earnings estimate** in the preview;
  night shifts can set **night hours paid** (`nightMin`, 30-min steps; unset = all paid hours, via `nightHours(s)` — night premium only, base/OT untouched);
  reorder by hold-and-drag or hidden Move up/down buttons (VoiceOver).
- Settings (`settings.js`): regrouped; **additional earnings (bonuses / 13th salary)**; region;
  salary; backup with a **last-backup / "only on this phone"** trust line.
- Onboarding (Onboard2, `renderOnboard`/`onbPane` in `index.html`): 7 steps in one persistent shell (top Back + progress, pane per step with a fly-in and a leaving clone, fixed footer). Country choice is required and applied to `state.region` in memory at once (`onbRegion`; only Start saves). Step 4 is a practice week that reuses the Calendar's tiles/chips (`calCell`/`calBrushes`) and the real paint handlers; its assignments are snapshotted on entry and rolled back whenever the step is left (`onbEnter4`/`onbLeave4`), so nothing is saved.
- First-use guide (`TOUR`, `tourEv` hooks): coach marks on the real screens, started once after onboarding when `localStorage['shifthub_tour']` is unset (not in the backup). One `#coach` layer: a dim whose clip-path hole lets taps reach the target, a bubble, a polite status; each step ends only on the real action (`tourEv('tab:calendar')`, `'edit:on'`, `'brush'`, `'paint'`, `'edit:off'`, `'month'`, `'newshift'`, `'sheet'`).
- Haptics: light tick on day-select and on swipe-dismiss of a sheet.
- Shift reminders (native app only; row hidden unless App.js injects `SH_NATIVE.notif`):
  `syncReminders()` builds up to 30 local reminders 60 min before each assigned
  non-leave shift in the next 31 days and posts `notif:{items}` only when the list
  changed (called from `saveState`/`refreshToday`/`shNotif`). App.js asks permission
  only on `notif:{req:1}` (user tap) and reports `shNotif({granted,canAsk,req})` on
  load/resume; the toggle shows `state.reminders && granted`.


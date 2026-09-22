// Shift Hub regression tests. Run: node test.mjs
// Uses the preinstalled Playwright + Chromium (no install step) against the real index.html,
// with real touch input via CDP so gesture tests go through the browser's touch-action/scroll pipeline.
import { createRequire } from 'node:module';
import { readdirSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const exe = (() => { try { const d = readdirSync('/opt/pw-browsers').find(n => /^chromium-\d+$/.test(n)); const p = d && `/opt/pw-browsers/${d}/chrome-linux/chrome`; return p && existsSync(p) ? p : undefined; } catch { return undefined; } })();
const APP = new URL('./index.html', import.meta.url).href;
const browser = await pw.chromium.launch({ executablePath: exe });

// seed: a returning user; fill:true assigns weekday shifts (m / every 3rd day n) for the current month, computed in-page
async function open(seed = { onboarded: true, fill: true }, { tz = 'Europe/Bucharest', time } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, timezoneId: tz });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(s => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    if (s.fill) { const t = new Date(), y = t.getFullYear(), m = t.getMonth(), n = new Date(y, m + 1, 0).getDate(); s.assignments = {};
      for (let d = 1; d <= n; d++) { const w = new Date(y, m, d).getDay(); if (w && w < 6) s.assignments[`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`] = d % 3 ? 'm' : 'n'; }
      delete s.fill; }
    localStorage.setItem('shifthub_v4', JSON.stringify(s));
  }, seed);
  if (time) await page.clock.install({ time }); // fake clock (only where a test needs to move "today")
  await page.goto(APP); await page.waitForFunction(() => document.getElementById('screen').children.length > 0);
  const cdp = await ctx.newCDPSession(page);
  const T = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: x === undefined ? [] : [{ x, y }] }); // touchEnd / touchCancel carry no points
  // vertical finger drag from (x,y0) to (x,y1) in `steps` moves, one per ~frame
  const drag = async (x, y0, y1, steps = 24) => { await T('touchStart', x, y0);
    for (let i = 1; i <= steps; i++) { await page.waitForTimeout(16); await T('touchMove', x, y0 + (y1 - y0) * i / steps); }
    await T('touchEnd'); };
  const tap = async (x, y) => { await T('touchStart', x, y); await T('touchEnd'); };
  const swipe = async (x0, y0, x1, y1, steps = 12, ms = 16) => { await T('touchStart', x0, y0);
    for (let i = 1; i <= steps; i++) { await page.waitForTimeout(ms); await T('touchMove', x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps); }
    await T('touchEnd'); };
  return { page, errors, drag, tap, swipe, touch: T, close: () => ctx.close() };
}

const tests = []; const test = (name, fn) => tests.push([name, fn]);

/* ===== 1. Bottom-sheet gesture ownership ===== */
// Records the sheet's translateY each frame and any pointercancel while a gesture runs.
async function sheetGesture(app, openSheet, { from, to, steps = 24, preScroll = 0, x = 195 } = {}) {
  const { page, drag } = app;
  await page.evaluate(openSheet); await page.waitForTimeout(600); // let the entrance finish
  const top = await page.evaluate(ps => { const sh = document.getElementById('sheet'); sh.scrollTop = ps;
    window.__cancel = 0; window.__ty = []; window.__rec = true;
    document.addEventListener('pointercancel', () => window.__cancel++, { once: true });
    const loop = () => { if (!window.__rec) return; window.__ty.push(new DOMMatrix(getComputedStyle(sh).transform).m42); requestAnimationFrame(loop); }; loop();
    return sh.getBoundingClientRect().top; }, preScroll);
  await drag(x, top + from, top + to, steps); await page.waitForTimeout(650);
  return page.evaluate(() => { window.__rec = false; const sh = document.getElementById('sheet');
    return { cancels: window.__cancel, maxY: Math.max(...window.__ty), endY: new DOMMatrix(getComputedStyle(sh).transform).m42, scrollTop: sh.scrollTop, sheet: state.sheet }; });
}

test('sheet: pull down at scrollTop 0 tracks the finger and dismisses (Settings)', async () => {
  const app = await open(); const r = await sheetGesture(app, () => { state.sheet = 'settings'; renderSheet(); }, { from: 150, to: 400 });
  assert.equal(r.cancels, 0, 'browser must not take the gesture (pointercancel)'); assert.ok(r.maxY >= 200, `sheet followed only ${r.maxY}px`);
  assert.equal(r.sheet, null); assert.deepEqual(app.errors, []); await app.close();
});
test('sheet: pull from the handle dismisses a tall sheet (Edit shift)', async () => {
  const app = await open(); const r = await sheetGesture(app, () => openShift('m'), { from: 12, to: 262 });
  assert.equal(r.cancels, 0); assert.equal(r.sheet, null); assert.deepEqual(app.errors, []); await app.close();
});
test('sheet: a short pull springs back', async () => {
  const app = await open(); const r = await sheetGesture(app, () => openShift('m'), { from: 150, to: 210, steps: 12 });
  assert.equal(r.sheet, 'shift'); assert.ok(r.maxY >= 40, `followed only ${r.maxY}px`); assert.equal(Math.round(r.endY), 0); await app.close();
});
test('sheet: when scrolled, a downward drag scrolls the content and never moves the sheet', async () => {
  const app = await open(); const r = await sheetGesture(app, () => openShift('m'), { from: 150, to: 300, preScroll: 200 });
  assert.equal(r.sheet, 'shift'); assert.equal(Math.round(r.maxY), 0); assert.ok(r.scrollTop < 200, `scrollTop ${r.scrollTop}`); await app.close();
});
test('sheet: an upward drag at the top scrolls the content', async () => {
  const app = await open(); const r = await sheetGesture(app, () => openShift('m'), { from: 500, to: 300 });
  assert.equal(r.sheet, 'shift'); assert.equal(Math.round(r.maxY), 0); assert.ok(r.scrollTop > 100, `scrollTop ${r.scrollTop}`); await app.close();
});
test('sheet: a scrolled nested list (Region countries) keeps the drag', async () => {
  const app = await open(); const { page } = app;
  await page.evaluate(() => { state.sheet = 'region'; renderSheet(); }); await page.waitForTimeout(600);
  const box = await page.evaluate(() => { const g = [...document.querySelectorAll('#sheet .grp')].find(g => g.scrollHeight > g.clientHeight); g.scrollTop = 200; const r = g.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 20 }; });
  await app.drag(box.x, box.y, box.y + 150); await page.waitForTimeout(500);
  const r = await page.evaluate(() => ({ list: [...document.querySelectorAll('#sheet .grp')].find(g => g.scrollHeight > g.clientHeight).scrollTop, y: new DOMMatrix(getComputedStyle(document.getElementById('sheet')).transform).m42, sheet: state.sheet }));
  assert.equal(r.sheet, 'region'); assert.equal(Math.round(r.y), 0); assert.ok(r.list < 200, `list scrollTop ${r.list}`); await app.close();
});
test('sheet: taps on controls inside a sheet still work', async () => {
  const app = await open(); const { page } = app;
  await page.evaluate(() => { state.sheet = 'salary'; renderSheet(); }); await page.waitForTimeout(600);
  const p = await page.evaluate(() => { const r = document.querySelector('[data-action="bon:weekend"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, on: state.salary.weekend.on }; });
  await app.tap(p.x, p.y); await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => state.salary.weekend.on), !p.on); await app.close();
});
test('sheet: a new sheet and a sub-sheet open at the top; in-place refresh keeps the scroll', async () => {
  const app = await open(); const { page } = app;
  const r = await page.evaluate(async () => { const sh = document.getElementById('sheet'), w = ms => new Promise(r => setTimeout(r, ms)); const o = {};
    state.sheet = 'region'; renderSheet(); await w(500); sh.scrollTop = 300;
    document.querySelector('[data-action="stdP"]').click(); o.inPlace = sh.scrollTop;
    closeSheet(); await w(400); openShift('m'); o.newSheet = sh.scrollTop; closeSheet(); await w(400);
    state.sheet = 'settings'; renderSheet(); await w(500); sh.scrollTop = 80; document.querySelector('[data-action="openRegion"]').click(); o.subSheet = sh.scrollTop;
    return o; });
  assert.equal(r.inPlace, 300); assert.equal(r.newSheet, 0); assert.equal(r.subSheet, 0); await app.close();
});
test('sheet: swipe-dismiss after a salary edit refreshes the HUB behind it', async () => {
  const app = await open(); const { page } = app;
  await page.evaluate(() => { state.sheet = 'salary'; renderSheet(); }); await page.waitForTimeout(600);
  await page.evaluate(() => { document.querySelector('[data-action="bpp:night"]').click(); document.querySelector('[data-action="bon:weekend"]').click(); });
  const top = await page.evaluate(() => document.getElementById('sheet').getBoundingClientRect().top);
  await app.drag(195, top + 12, top + 312); await page.waitForTimeout(700); // from the handle (top+150 is the salary input, which is excluded)
  const r = await page.evaluate(() => ({ sheet: state.sheet, shown: document.querySelector('.hero .v span').textContent, want: fmtN(monthTotals(state.viewY, state.viewM).grand) }));
  assert.equal(r.sheet, null); assert.equal(r.shown, r.want, JSON.stringify(r)); await app.close();
});

/* ===== 2. Tab transitions ===== */
// Clicks a tab and samples every screen child's computed opacity for `frames` animation frames.
const tabFrames = (page, tab, frames = 12) => page.evaluate(({ tab, frames }) => new Promise(res => {
  const out = []; document.querySelector(`[data-action="tab:${tab}"]`).click();
  const f = () => { const sc = document.getElementById('screen');
    out.push({ min: Math.min(...[...sc.children].map(k => +getComputedStyle(k).opacity)), kids: sc.children.length, grid: !!document.getElementById('calgrid') });
    if (out.length < frames) requestAnimationFrame(f); else res(out); };
  requestAnimationFrame(f); }), { tab, frames });

test('tabs: the destination screen is fully visible from its first frame', async () => {
  const app = await open();
  for (const tab of ['calendar', 'shifts', 'hub', 'calendar']) {
    const fr = await tabFrames(app.page, tab);
    assert.ok(fr.every(x => x.kids > 0 && x.min === 1), `${tab}: ${JSON.stringify(fr.slice(0, 3))}`);
    if (tab === 'calendar') assert.ok(fr[0].grid, 'calendar grid present on the first frame');
  }
  assert.deepEqual(app.errors, []); await app.close();
});
test('tabs: a month change right after switching never blanks the grid', async () => {
  const app = await open(); const { page } = app;
  await tabFrames(page, 'calendar', 2);
  const min = await page.evaluate(() => new Promise(res => { document.querySelector('[data-action="nextMonth"]').click(); const v = []; const f = () => { v.push(+getComputedStyle(document.getElementById('calgrid')).opacity); if (v.length < 20) requestAnimationFrame(f); else res(Math.min(...v)); }; requestAnimationFrame(f); }));
  assert.ok(min >= 0.25, `grid opacity dropped to ${min}`); await app.close(); // 0.25 = the month slide's own starting opacity
});
test('tabs: each tab keeps its own scroll position', async () => {
  const shifts = [{ id: 'm', name: 'Morning', start: 390, end: 930, brk: 60, color: '#F2A63C', icon: 'sun', night: false }, { id: 'n', name: 'Night', start: 1350, end: 450, brk: 60, color: '#6366F1', icon: 'moon', night: true },
    ...[...Array(14)].map((_, i) => ({ id: 'x' + i, name: 'S' + i, start: 480, end: 960, brk: 30, color: '#3B82F6', icon: 'sun', night: false }))]; // keep m/n: the seeded days use them (and make the HUB scrollable)
  const app = await open({ onboarded: true, fill: true, shifts }); const { page } = app;
  const r = await page.evaluate(async () => { const sc = document.getElementById('screen'), go = t => document.querySelector(`[data-action="tab:${t}"]`).click();
    sc.scrollTop = 40; const hub = sc.scrollTop; go('shifts'); const shiftsEntry = sc.scrollTop; sc.scrollTop = 300; const shifts = sc.scrollTop;
    go('hub'); const hubBack = sc.scrollTop; go('shifts'); return { hub, shiftsEntry, shifts, hubBack, shiftsBack: sc.scrollTop }; });
  assert.ok(r.hub > 0 && r.shifts > 0, JSON.stringify(r));
  assert.equal(r.shiftsEntry, 0); assert.equal(r.hubBack, r.hub); assert.equal(r.shiftsBack, r.shifts); await app.close();
});
test('tabs: tab buttons are reused (only .on moves); a language change relabels them', async () => {
  const app = await open(); const { page } = app;
  const r = await page.evaluate(() => { const before = [...document.querySelectorAll('.tabbtn')];
    document.querySelector('[data-action="tab:shifts"]').click(); const after = [...document.querySelectorAll('.tabbtn')];
    const same = before.every((b, i) => b === after[i]), on = after.map(b => b.classList.contains('on'));
    state.lang = 'ro'; renderAll(); return { same, on, label: document.querySelectorAll('.tabbtn')[2].textContent }; });
  assert.ok(r.same); assert.deepEqual(r.on, [false, false, true]); assert.equal(r.label, 'Ture'); await app.close();
});
test('tabs: HUB numbers do not re-animate on a return visit', async () => {
  const app = await open(); const { page } = app;
  await tabFrames(page, 'calendar', 2); await tabFrames(page, 'hub', 2);
  const names = await page.evaluate(() => [...document.querySelectorAll('.hero .v span, .statcol .v span')].map(s => getComputedStyle(s).animationName));
  assert.ok(names.length && names.every(n => n === 'none'), names.join(',')); await app.close();
});

/* ===== 3. Pay engine ===== */
// Deterministic engine state: Romania, net 4000, 8h norm, default premiums (OT 75, night 25, weekend 10, holiday 100), default shifts
// (m = 06:30–15:30 −60 = 8h, n = 22:30–07:30 −60 = 8h night, hol = 8h paid leave). Sep 2026 = 22 working days → bh = 4000/176.
const ENGINE_BASE = () => {
  state.region = { country: 'RO', currency: 'RON', locale: 'en-US', weekendDays: [0, 6], weekStart: 1, stdHours: 8, customHolidays: [] };
  state.salary = { net: 4000, overtime: { on: true, pct: 75 }, night: { on: true, pct: 25 }, weekend: { on: true, pct: 10 }, holiday: { on: true, pct: 100 }, additions: [] };
  state.assignments = {}; state.dayMeta = {}; clearHolidayCache(); saveState();
};
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} != ${b}`);
async function engine(fn, opts) { const app = await open({ onboarded: true }, opts); await app.page.evaluate(ENGINE_BASE);
  const r = await app.page.evaluate(fn); assert.deepEqual(app.errors, []); await app.close(); return r; }
const BH = 4000 / 176, B = BH * 8; // Sep 2026 hourly rate and one 8h day

test('pay: hourly rate and per-day premiums', async () => {
  const r = await engine(() => { const A = (iso, id, meta) => { state.assignments[iso] = id; if (meta) state.dayMeta[iso] = meta; };
    const d = iso => { const [y, m, dd] = iso.split('-').map(Number); return dayBreakdown({ iso, y, m: m - 1, d: dd }, baseHourly(y, m - 1)); };
    A('2026-09-01', 'm'); A('2026-09-05', 'm'); A('2026-09-02', 'n'); A('2026-09-06', 'n'); A('2026-12-01', 'm'); A('2026-09-07', 'hol'); A('2026-09-13', 'hol');
    A('2026-09-03', 'm', { otDay: 2, otNight: 1, holiday: false }); A('2026-09-12', 'm', { otDay: 0, otNight: 1, holiday: false }); A('2026-09-08', 'm', { otDay: 0, otNight: 0, holiday: true }); saveState();
    return { wd: workingDaysInMonth(2026, 8), wdDec: workingDaysInMonth(2026, 11), bh: baseHourly(2026, 8), wk: d('2026-09-01').total, sat: d('2026-09-05').total,
      night: d('2026-09-02').total, nightSun: d('2026-09-06').total, hol: d('2026-12-01').total, ot: d('2026-09-03'), otWe: d('2026-09-12'),
      leave: d('2026-09-07').total, leaveSun: d('2026-09-13').total, marked: d('2026-09-08').total }; });
  assert.equal(r.wd, 22); assert.equal(r.wdDec, 21); near(r.bh, BH, 'hourly');
  near(r.wk, B, 'weekday'); near(r.sat, B * 1.1, 'Saturday +10%'); near(r.night, B * 1.25, 'night +25%'); near(r.nightSun, B * 1.35, 'night on Sunday');
  near(r.hol, 4000 / 168 * 8 * 2, 'RO public holiday 1 Dec +100% (Dec: 21 working days)');
  near(r.ot.otDay, BH * 1.75 * 2, 'OT day'); near(r.ot.otNight, BH * 2.0, 'OT night = OT% + night%'); near(r.ot.total, B + BH * (3.5 + 2.0), 'OT day total');
  near(r.otWe.otNight, BH * 2.1, 'OT night on a Saturday'); near(r.leave, B, 'paid leave'); near(r.leaveSun, B, 'paid leave on Sunday: base only'); near(r.marked, B * 2, 'day marked as holiday');
});
test('pay: base is pro-rata, capped at net; paid leave counts toward the norm', async () => {
  const r = await engine(() => { const wd = monthISOs(2026, 8).filter(x => !isWeekend(x.y, x.m, x.d));
    const run = f => { state.assignments = {}; f(); saveState(); return monthTotals(2026, 8); };
    return { full: run(() => wd.forEach(x => state.assignments[x.iso] = 'm')), half: run(() => wd.slice(0, 11).forEach(x => state.assignments[x.iso] = 'm')),
      leave: run(() => wd.forEach((x, i) => state.assignments[x.iso] = i ? 'm' : 'hol')),
      over: run(() => { wd.forEach(x => state.assignments[x.iso] = 'm'); state.assignments['2026-09-05'] = state.assignments['2026-09-12'] = 'm'; }) }; });
  near(r.full.base, 4000, 'full norm'); near(r.full.grand, 4000, 'full norm grand'); near(r.half.base, 2000, 'half norm');
  near(r.leave.base, 4000, 'leave fills the norm'); assert.equal(r.leave.days, 21); assert.equal(r.leave.vacDays, 1);
  near(r.over.base, 4000, 'over the norm: base capped'); near(r.over.weekend, 2 * B * 0.1, 'weekend premium still paid on top');
});
test('pay: additional earnings by frequency', async () => {
  const r = await engine(() => { state.salary.additions = [
      { id: 'a', name: 'M', amount: 100, freq: 'monthly', on: true }, { id: 'b', name: 'W', amount: 60, freq: 'weekly', on: true },
      { id: 'c', name: 'A', amount: 1200, freq: 'annual', month: 9, on: true }, { id: 'd', name: 'O', amount: 500, freq: 'once', month: 9, year: 2026, on: true },
      { id: 'e', name: 'Off', amount: 999, freq: 'monthly', on: false }]; saveState();
    return { sep26: additionsTotal(2026, 8), aug26: additionsTotal(2026, 7), sep27: additionsTotal(2027, 8), grand: monthTotals(2026, 8).grand }; });
  const w = 60 * 52 / 12; near(r.sep26, 100 + w + 1200 + 500, 'Sep 2026'); near(r.aug26, 100 + w, 'Aug 2026'); near(r.sep27, 100 + w + 1200, 'Sep 2027'); near(r.grand, r.sep26, 'grand with no shifts');
});
test('pay: week total across a month boundary, for each week start', async () => {
  const r = await engine(() => { ['2026-11-30', '2026-12-01', '2026-12-02', '2026-12-06'].forEach(i => state.assignments[i] = 'm'); saveState();
    const o = {}; for (const ws of [1, 0, 6]) { state.region.weekStart = ws; o[ws] = weekTotalOf('2026-12-01'); } return o; });
  const nov = 4000 / 160 * 8, dec = 4000 / 168 * 8; // Nov 2026: 20 working days; 30 Nov and 1 Dec are RO holidays
  near(r[1], nov * 2 + dec * 2 + dec + dec * 1.1, 'Mon start (30 Nov–6 Dec)'); near(r[0], nov * 2 + dec * 2 + dec, 'Sun start (29 Nov–5 Dec)'); near(r[6], nov * 2 + dec * 2 + dec, 'Sat start (28 Nov–4 Dec)');
});
test('pay: memo is invalidated by data and region changes', async () => {
  const r = await engine(() => { state.assignments['2026-12-02'] = 'm'; saveState(); const a = monthTotals(2026, 11).grand;
    state.salary.net = 8000; saveState(); const b = monthTotals(2026, 11).grand; state.region.country = 'DE'; clearHolidayCache(); return { a, b, c: monthTotals(2026, 11).grand }; });
  near(r.b, r.a * 2, 'net doubled'); assert.ok(Math.abs(r.c - r.b) > 1, 'DE has a different December norm');
});
test('pay: public holiday sets (Easter rules and observed substitute days)', async () => {
  const r = await engine(() => { const H = (c, y) => { state.region.country = c; clearHolidayCache(); return [...holidaysFor(y)]; };
    return { ro: H('RO', 2026), de: H('DE', 2026), gb21: H('GB', 2021), gb22: H('GB', 2022), gb27: H('GB', 2027), nz22: H('NZ', 2022), us21: H('US', 2021), us22: H('US', 2022), jp26: H('JP', 2026), jp27: H('JP', 2027) }; });
  for (const d of ['2026-04-10', '2026-04-12', '2026-04-13', '2026-05-31', '2026-06-01']) assert.ok(r.ro.includes(d), 'RO Orthodox ' + d);
  for (const d of ['2026-04-03', '2026-04-06', '2026-05-14', '2026-05-25']) assert.ok(r.de.includes(d), 'DE Western ' + d);
  assert.ok(r.gb21.includes('2021-12-27') && r.gb21.includes('2021-12-28'), 'GB 2021: Christmas Sat → Mon 27, Boxing Day Sun → Tue 28');
  assert.ok(r.gb22.includes('2022-12-26') && r.gb22.includes('2022-12-27'), 'GB 2022: Christmas Sun → Tue 27');
  assert.ok(r.gb27.includes('2027-12-27') && r.gb27.includes('2027-12-28'), 'GB 2027 substitutes');
  assert.ok(r.nz22.includes('2022-01-03') && r.nz22.includes('2022-01-04'), 'NZ 2022: 1–2 Jan → Mon 3 + Tue 4');
  assert.ok(r.us21.includes('2021-12-31'), 'US: New Year 2022 (Sat) observed Fri 31 Dec 2021');
  assert.ok(!r.us22.some(d => d.startsWith('2021')), 'US 2022 set holds only 2022 dates');
  assert.ok(r.jp26.includes('2026-05-06'), 'JP: Sun 3 May → first free weekday, Wed 6 May');
  assert.ok(!r.jp27.includes('2027-03-22'), 'JP: a Saturday holiday gets no substitute');
});
test('pay: identical results and consistent calendars in DST-edge timezones', async () => {
  const fp = () => { for (const p of ['2026-03-2', '2026-10-2']) for (let d = 3; d <= 9; d++) state.assignments[p + d] = 'n'; saveState(); // night shifts across the EU DST changes
    const next = iso => { const [y, m, d] = iso.split('-').map(Number), z = new Date(Date.UTC(y, m - 1, d + 1)); return z.toISOString().slice(0, 10); }; const bad = [];
    for (let y = 2026; y <= 2027; y++) for (let m = 0; m < 12; m++) { const xs = monthISOs(y, m); state.viewY = y; state.viewM = m; const cs = calendarCells();
      for (let i = 1; i < cs.length; i++) if (next(cs[i - 1].iso) !== cs[i].iso) bad.push('cells ' + cs[i].iso);
      for (const x of xs) { const w = weekDaysOf(x.iso); if (!w.includes(x.iso) || w.some((v, i) => i && next(w[i - 1]) !== v)) bad.push('week ' + x.iso); } }
    return JSON.stringify({ bad, a: monthTotals(2026, 2), b: monthTotals(2026, 9), w1: weekTotalOf('2026-03-29'), w2: weekTotalOf('2026-10-25'), h: [...holidaysFor(2026)].sort() }); };
  const ref = await engine(fp); assert.deepEqual(JSON.parse(ref).bad, []);
  for (const tz of ['America/Santiago', 'America/Havana', 'Europe/London', 'Australia/Lord_Howe', 'Asia/Tehran']) assert.equal(await engine(fp, { tz }), ref, tz);
});
// Corrections from the audit
test('pay: overtime on a day off is paid (outside the norm); leave days offer no overtime', async () => {
  const app = await open({ onboarded: true }); const { page } = app; await page.evaluate(ENGINE_BASE);
  const r = await page.evaluate(() => { state.assignments['2026-09-01'] = 'm'; state.dayMeta['2026-09-05'] = { otDay: 4, otNight: 0, holiday: false }; saveState();
    const t = monthTotals(2026, 8); state.assignments['2026-09-07'] = 'hol'; saveState(); state.viewY = 2026; state.viewM = 8; state.selISO = '2026-09-07'; openDayMeta();
    return { otDay: t.otDay, otDayH: t.otDayH, days: t.days, paidH: t.paidH, base: t.base, leaveHasOT: !!document.querySelector('#sheet [data-action="otDayP"]') }; });
  near(r.otDay, BH * (1 + 0.75 + 0.10) * 4, 'OT on a Saturday off'); assert.equal(r.otDayH, 4); assert.equal(r.days, 1); assert.equal(r.paidH, 8);
  near(r.base, 4000 * 8 / 176, 'base unchanged by OT'); assert.equal(r.leaveHasOT, false, 'no OT steppers on a leave day'); await app.close();
});
test('pay: per-day figures (day bar, week, CSV) add up to the month, under and over the norm', async () => {
  const r = await engine(() => { const sum = () => { saveState(); const t = monthTotals(2026, 8), bh = baseHourly(2026, 8);
      const days = monthISOs(2026, 8).reduce((s, x) => { const b = dayBreakdown(x, bh, t.cap); return s + (b ? b.total : 0); }, 0);
      const csv = csvExport(2026, 8).split('\n').slice(1).reduce((s, l) => s + +l.split(',').pop(), 0); return { month: t.grand - t.additions, days, csv }; };
    monthISOs(2026, 8).filter(x => !isWeekend(x.y, x.m, x.d)).slice(0, 15).forEach(x => state.assignments[x.iso] = 'm'); const under = sum();
    monthISOs(2026, 8).forEach(x => state.assignments[x.iso] = x.d % 3 ? 'm' : 'n'); state.dayMeta['2026-09-10'] = { otDay: 2, otNight: 0, holiday: false }; const over = sum();
    return { under, over }; });
  for (const k of ['under', 'over']) { near(r[k].days, r[k].month, k + ': Σ days'); assert.ok(Math.abs(r[k].csv - r[k].month) <= 16, `${k}: CSV ${r[k].csv} vs ${r[k].month}`); }
});
test('pay: a day from the adjacent month uses its own month\'s rate in the day bar', async () => {
  const app = await open({ onboarded: true }); const { page } = app; await page.evaluate(ENGINE_BASE);
  const r = await page.evaluate(() => { state.assignments['2026-11-30'] = 'm'; saveState(); state.viewY = 2026; state.viewM = 11; switchTab('calendar'); selectDay('2026-11-30');
    return { shown: document.querySelector('.daybar span.num[style*="font-size:16px"]').textContent, want: fmtN(4000 / 160 * 8 * 2) }; });
  assert.equal(r.shown, r.want); await app.close();
});

/* ===== 4. Calendar gestures ===== */
const center = (page, sel) => page.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
// a weekend day of the current month (the seed leaves weekends empty)
const freeDay = page => page.evaluate(() => monthISOs(state.viewY, state.viewM).find(x => isWeekend(x.y, x.m, x.d) && !state.assignments[x.iso]).iso);

test('calendar: a cancelled paint stroke keeps what was painted and stops painting', async () => {
  const app = await open(); const { page } = app;
  await page.evaluate(() => { switchTab('calendar'); state.editMode = true; state.brush = 'n'; renderScreen(); });
  const iso = await freeDay(page); const p = await center(page, `.cell[data-iso="${iso}"]`);
  await app.touch('touchStart', p.x, p.y); await app.touch('touchCancel'); await page.waitForTimeout(100);
  const r = await page.evaluate(iso => ({ painting, saved: JSON.parse(localStorage.getItem('shifthub_v4')).assignments[iso] }), iso);
  assert.equal(r.painting, false); assert.equal(r.saved, 'n'); assert.deepEqual(app.errors, []); await app.close();
});
test('calendar: a cancelled long-press does not open the quick-assign sheet', async () => {
  const app = await open(); const { page } = app;
  await page.evaluate(() => switchTab('calendar')); const p = await center(page, '.cell.paintable');
  await app.touch('touchStart', p.x, p.y); await page.waitForTimeout(100); await app.touch('touchCancel'); await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => state.sheet), null); await app.close();
});
test('shifts: a cancelled row swipe does not leave the row half-open', async () => {
  const app = await open(); const { page } = app;
  await page.evaluate(() => switchTab('shifts')); const p = await center(page, '.swipe .front');
  await app.touch('touchStart', p.x, p.y); for (const dx of [-8, -20, -40]) { await page.waitForTimeout(16); await app.touch('touchMove', p.x + dx, p.y); }
  await app.touch('touchCancel'); await page.waitForTimeout(50);
  assert.equal(await page.evaluate(() => document.querySelector('.swipe .front').style.transform), ''); await app.close();
});
test('hub: a cancelled touch on the pay card leaves no month-swipe behind', async () => {
  const app = await open(); const { page } = app; const p = await center(page, '.hero');
  await app.touch('touchStart', p.x, p.y); await app.touch('touchCancel');
  assert.equal(await page.evaluate(() => msw), null); await app.close();
});
test('hub: the month swipe on the pay card works even if the calendar was left in Edit mode', async () => {
  const app = await open(); const { page } = app;
  await page.evaluate(() => { state.editMode = true; switchTab('hub'); }); const m0 = await page.evaluate(() => state.viewM); const p = await center(page, '.hero');
  await app.swipe(p.x + 100, p.y, p.x - 100, p.y); await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => state.viewM), (m0 + 1) % 12); await app.close();
});
test('calendar: a tap right after a swipe-dismiss is not swallowed', async () => {
  const app = await open(); const { page } = app;
  await page.evaluate(() => { switchTab('calendar'); state.sheet = 'settings'; renderSheet(); }); await page.waitForTimeout(600);
  const top = await page.evaluate(() => document.getElementById('sheet').getBoundingClientRect().top);
  await app.drag(195, top + 12, top + 300, 3); // fast flick: short dismiss animation
  await page.waitForFunction(() => !document.getElementById('backdrop').classList.contains('show'), null, { polling: 'raf' }); // tap the moment the sheet is gone
  const iso = await freeDay(page); const p = await center(page, `.cell[data-iso="${iso}"]`);
  await app.tap(p.x, p.y); await page.waitForTimeout(80);
  const r = await page.evaluate(() => ({ sheet: state.sheet, sel: state.selISO })); assert.equal(r.sheet, null); assert.equal(r.sel, iso); await app.close();
});

/* ===== 5. State, persistence, backup ===== */
const BAD = { shifts: null, assignments: { x: 'y', '2026-09-01': 'nope' }, region: 'bad', dayMeta: [1, 2], lang: 42,
  salary: { net: 'abc', night: { on: 'yes', pct: 9999 }, additions: [{ id: '"><img>', amount: 5 }, { id: 'ok', name: 'Bonus', amount: '250', freq: 'weird' }] } };
const loaded = page => page.evaluate(() => ({ shifts: state.shifts.map(s => s.id).join(), net: state.salary.net, night: state.salary.night, add: state.salary.additions,
  region: state.region.country, assignments: Object.keys(state.assignments).length, lang: state.lang, rendered: !!document.querySelector('.hero') }));
const assertDefaults = r => { assert.equal(r.shifts, 'm,a,n,hol'); assert.equal(r.net, 4000); assert.deepEqual(r.night, { on: true, pct: 25 }); assert.equal(r.region, 'RO');
  assert.deepEqual(r.add, [{ id: 'ok', name: 'Bonus', amount: 250, freq: 'monthly', on: true }]); assert.equal(r.assignments, 0); assert.equal(r.lang, 'en'); assert.ok(r.rendered); };
test('backup: a malformed backup is normalized before it is saved, so the next launch works', async () => {
  const app = await open(); await app.page.evaluate(BAD => applyBackup({ app: 'shifthub', data: BAD }), BAD);
  assertDefaults(await loaded(app.page)); const saved = await app.page.evaluate(() => JSON.parse(localStorage.getItem('shifthub_v4'))); assert.deepEqual(app.errors, []); await app.close();
  const next = await open(saved); assertDefaults(await loaded(next.page)); assert.deepEqual(next.errors, []); await next.close(); // "relaunch" on what was saved
});
test('storage: already-corrupted saved data still loads and renders', async () => {
  const app = await open(BAD); assertDefaults(await loaded(app.page)); assert.deepEqual(app.errors, []); await app.close();
});
test('backup: a partial backup replaces everything and keeps a safety copy of the old data', async () => {
  const app = await open(); const { page } = app;
  const r = await page.evaluate(() => { state.dayMeta['2026-09-02'] = { otDay: 2, otNight: 0, holiday: false }; state.region.country = 'DE'; saveState(); const before = localStorage.getItem('shifthub_v4');
    applyBackup({ app: 'shifthub', data: { assignments: { '2026-09-03': 'a' } } });
    return { meta: state.dayMeta, country: state.region.country, asg: state.assignments, prev: localStorage.getItem('shifthub_v4_prev') === before }; });
  assert.deepEqual(r.meta, {}); assert.equal(r.country, 'RO'); assert.deepEqual(r.asg, { '2026-09-03': 'a' }); assert.ok(r.prev); await app.close();
});
test('backup: export → restore → export round-trips exactly; null data is rejected', async () => {
  const app = await open(); const { page } = app;
  const r = await page.evaluate(() => { state.salary.additions.push({ id: 'b1', name: 'Q', amount: 300, freq: 'annual', month: 6, on: true }); state.dayMeta['2026-09-04'] = { otDay: 1, otNight: 2, holiday: true };
    state.region.customHolidays.push({ m: 3, d: 8, name: 'Women' }); saveState(); const a = JSON.parse(exportBackup()).data; applyBackup({ app: 'shifthub', data: a });
    const b = JSON.parse(exportBackup()).data; restoreFromText('{"app":"shifthub","data":null}'); return { a, b, toast: document.getElementById('toast').textContent, dlg: !!document.querySelector('.dlg') }; });
  assert.deepEqual(r.b, r.a); assert.equal(r.toast, 'Not a ShiftHub backup'); assert.equal(r.dlg, false); await app.close();
});
test('storage: the old format and old default colours still load', async () => {
  const app = await open({ netMonthly: 5000, shifts: [{ id: 'm', name: 'Morning', start: 390, end: 930, brk: 60, color: '#9B7FB8', icon: 'sun', night: false }] }); const { page } = app;
  const r = await page.evaluate(() => ({ net: state.salary.net, m: shiftById('m').color, hol: !!shiftById('hol'), onboarded: state.onboarded }));
  assert.deepEqual(r, { net: 5000, m: '#F2A63C', hol: true, onboarded: true }); await app.close();
});
test('names with quotes and markup survive editing and render as text', async () => {
  const app = await open(); const { page } = app; const name = `The "early" <b>one</b> & 'co'`;
  const r = await page.evaluate(name => { shiftById('m').name = name; saveState(); openShift('m'); const inField = document.getElementById('shname').value; saveShift(); switchTab('shifts');
    return { inField, saved: shiftById('m').name, shown: document.querySelector('.swipe[data-id="m"] .front').textContent.includes(name), injected: !!document.querySelector('#screen b') }; }, name);
  assert.equal(r.inField, name); assert.equal(r.saved, name); assert.ok(r.shown); assert.equal(r.injected, false); await app.close();
});
test('sheet: picking a currency keeps the list where it was', async () => {
  const app = await open(); const { page } = app;
  const r = await page.evaluate(async () => { state.sheet = 'region'; renderSheet(); await new Promise(r => setTimeout(r, 500));
    const list = () => [...document.querySelectorAll('#sheet .grp')].filter(g => g.scrollHeight > g.clientHeight)[1]; list().scrollTop = 600; const before = list().scrollTop;
    const opt = list().querySelectorAll('.optrow')[30]; opt.click(); return { before, after: list().scrollTop, cur: state.region.currency, want: opt.dataset.action.split(':')[1] }; });
  assert.ok(r.before > 0); assert.equal(r.after, r.before); assert.equal(r.cur, r.want); await app.close();
});
test('launch opens on the current month; a resume on a later day moves "today"', async () => {
  const app = await open({ onboarded: true, fill: true, viewY: 2020, viewM: 0, selISO: '2020-01-15' }, { time: new Date('2026-09-30T22:00:00+03:00') }); const { page } = app;
  const a = await page.evaluate(() => ({ y: state.viewY, m: state.viewM, sel: state.selISO }));
  await page.clock.setSystemTime(new Date('2026-10-01T08:00:00+03:00')); /* Bucharest, UTC+3 in DST */ await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  const b = await page.evaluate(() => { switchTab('calendar'); return { today: isoOf(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()), m: state.viewM, ring: document.querySelector('.cell.today').dataset.iso }; });
  assert.deepEqual(a, { y: 2026, m: 8, sel: '2026-09-30' }); assert.deepEqual(b, { today: '2026-10-01', m: 9, ring: '2026-10-01' }); await app.close();
});
test('a day sheet left open across midnight saves to the day it was opened for', async () => {
  const app = await open({ onboarded: true }, { time: new Date('2026-09-21T23:58:00+03:00') }); const { page } = app;
  await page.evaluate(() => { switchTab('calendar'); selectDay('2026-09-21'); openDayMeta(); state.draftOtDay = 3; });
  await page.clock.setSystemTime(new Date('2026-09-22T00:05:00+03:00')); await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  const r = await page.evaluate(() => { const today = isoOf(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()); saveMeta();
    return { today, d21: state.dayMeta['2026-09-21'], d22: state.dayMeta['2026-09-22'] || null }; });
  assert.deepEqual(r, { today: '2026-09-22', d21: { otDay: 3, otNight: 0, holiday: false }, d22: null }); assert.deepEqual(app.errors, []); await app.close();
});
test('salary input rejects negatives; a failed save is reported', async () => {
  const app = await open(); const { page } = app;
  const r = await page.evaluate(() => { state.sheet = 'salary'; renderSheet(); const i = document.getElementById('netinput'); i.value = '-500'; i.dispatchEvent(new Event('input', { bubbles: true }));
    const net = state.salary.net; Storage.prototype.setItem = () => { throw new Error('QuotaExceededError'); }; saveState(); return { net, toast: document.getElementById('toast').textContent }; });
  assert.equal(r.net, 0); assert.equal(r.toast, 'Could not save on this device'); await app.close();
});

/* ===== 6. iOS / WebView ===== */
test('platform: no page overscroll; UI text is not selectable, inputs are', async () => {
  const app = await open(); const r = await app.page.evaluate(() => { state.sheet = 'backup'; renderSheet(); const cs = el => getComputedStyle(el);
    return { html: cs(document.documentElement).overscrollBehaviorY, body: cs(document.body).overscrollBehaviorY, ui: cs(document.querySelector('.tabbtn')).userSelect,
      input: cs(document.getElementById('backuptext')).userSelect }; }); // -webkit-touch-callout is WebKit-only: checked on the iPhone, not here
  assert.deepEqual(r, { html: 'none', body: 'none', ui: 'none', input: 'text' }); await app.close();
});

/* ===== 7. Performance ===== */
test('perf: no backdrop blur on the tab bar or behind sheets/dialogs; no spotlight cards', async () => {
  const app = await open(); const r = await app.page.evaluate(async () => { state.sheet = 'settings'; renderSheet(); confirmDialog('t', 'm', 'ok', () => {});
    await new Promise(r => setTimeout(r, 400)); /* after the .3s fade */ const bf = id => getComputedStyle(document.getElementById(id)).backdropFilter;
    return { tabbar: bf('tabbar'), backdrop: bf('backdrop'), dlg: bf('dlgback'), spots: document.querySelectorAll('.spot').length,
      dim: getComputedStyle(document.getElementById('backdrop')).backgroundColor }; });
  assert.deepEqual(r, { tabbar: 'none', backdrop: 'none', dlg: 'none', spots: 0, dim: 'rgba(10, 5, 20, 0.42)' }); assert.deepEqual(app.errors, []); await app.close();
});

/* ===== 8. Polish ===== */
test('polish: a toggled switch slides; only the changed stepper value pops', async () => {
  const app = await open(); const r = await app.page.evaluate(async () => { state.sheet = 'salary'; renderSheet(); await new Promise(r => setTimeout(r, 600));
    document.querySelector('[data-action="bon:weekend"]').click(); const slide = document.querySelector('[data-action="bon:weekend"] i').getAnimations().length;
    const untouched = document.querySelector('[data-action="bon:night"] i').getAnimations().length;
    document.querySelector('[data-action="bpp:night"]').click(); const pops = [...document.querySelectorAll('.stepper')].map(st => [st.querySelector('button').dataset.action, st.querySelector('.sv b').getAnimations().length]);
    return { slide, untouched, pops }; });
  assert.ok(r.slide > 0, 'knob transition runs'); assert.equal(r.untouched, 0); assert.deepEqual(r.pops.filter(p => p[1] > 0).map(p => p[0]), ['bpm:night']); await app.close();
});
test('polish: CSV quotes shift names (commas and quotes stay in one column)', async () => {
  const app = await open(); const r = await app.page.evaluate(() => { shiftById('m').name = 'Early, "A"'; saveState();
    return csvExport(state.viewY, state.viewM).split('\n').find(l => l.includes('Early')); });
  assert.ok(r.includes(',"Early, ""A""",'), r); await app.close();
});
test('CSV: every row matches the header; OT columns filled; formula names neutralised', async () => {
  const r = await engine(() => { shiftById('m').name = '=HYPERLINK("x")'; ['2026-09-01', '2026-09-03', '2026-09-07'].forEach(i => state.assignments[i] = 'm');
    state.assignments['2026-09-08'] = 'hol'; state.dayMeta['2026-09-03'] = { otDay: 2, otNight: 1, holiday: false }; state.dayMeta['2026-09-08'] = { otDay: 3, otNight: 0, holiday: false };
    state.dayMeta['2026-09-05'] = { otDay: 4, otNight: 0, holiday: false }; saveState(); return csvExport(2026, 8).split('\n'); });
  const cols = l => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).filter(Boolean).length; // quote-aware field count
  const n = cols(r[0]); assert.equal(n, 8); for (const l of r.slice(1)) assert.equal(cols(l), n, l);
  assert.equal(r.length, 31); assert.ok(r[3].startsWith('3,"\'=HYPERLINK(""x"")",8.0,2,1,no,no,'), r[3]);
  assert.ok(r[5].startsWith('5,Off,0,4,0,yes,no,'), r[5]); assert.ok(r[8].startsWith('8,"Paid leave",8.0,0,0,no,no,'), 'leave: no OT ' + r[8]);
});

/* ===== runner ===== */
let failed = 0;
for (const [name, fn] of tests) {
  try { await fn(); console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('FAIL  ' + name + '\n      ' + String(e.message || e).split('\n').filter(Boolean).slice(0, 14).join(' | ')); }
}
await browser.close();
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exitCode = failed ? 1 : 0;

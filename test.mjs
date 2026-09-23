// Shift Hub regression tests. Run: node test.mjs
// Uses the preinstalled Playwright + Chromium (no install step) against the real index.html,
// with real touch input via CDP so gesture tests go through the browser's touch-action/scroll pipeline.
import { createRequire } from 'node:module';
import { readdirSync, existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const exe = (() => { try { const d = readdirSync('/opt/pw-browsers').find(n => /^chromium-\d+$/.test(n)); const p = d && `/opt/pw-browsers/${d}/chrome-linux/chrome`; return p && existsSync(p) ? p : undefined; } catch { return undefined; } })();
const APP = new URL('./index.html', import.meta.url).href;
const browser = await pw.chromium.launch({ executablePath: exe });

// seed: a returning user; fill:true assigns weekday shifts (m / every 3rd day n) for the current month, computed in-page
async function open(seed = { onboarded: true, fill: true }, { tz = 'Europe/Bucharest', time, native, vp = { width: 390, height: 844 }, rm } = {}) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: true, timezoneId: tz, reducedMotion: rm ? 'reduce' : 'no-preference' }); // rm: prefers-reduced-motion
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(s => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    if (s.fill) { const t = new Date(), y = t.getFullYear(), m = t.getMonth(), n = new Date(y, m + 1, 0).getDate(); s.assignments = {};
      for (let d = 1; d <= n; d++) { const w = new Date(y, m, d).getDay(); if (w && w < 6) s.assignments[`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`] = d % 3 ? 'm' : 'n'; }
      delete s.fill; }
    localStorage.setItem('shifthub_v4', JSON.stringify(s));
  }, seed);
  if (time) await page.clock.install({ time }); // fake clock (only where a test needs to move "today")
  if (native) await page.addInitScript(() => { window.SH_NATIVE = { notif: 1 }; window.__msgs = []; window.ReactNativeWebView = { postMessage: m => window.__msgs.push(m) }; }); // what App.js injects
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
// Spring-back: records per frame the sheet's translateY, its content's opacity, .grab, and the effective dim (backdrop alpha × opacity).
const sheetRec = page => page.evaluate(() => { const sh = document.getElementById('sheet'), bd = document.getElementById('backdrop'); window.__sf = []; window.__sr = true;
  const loop = () => { if (!window.__sr) return; const b = getComputedStyle(bd), a = b.backgroundColor.match(/\(([^)]+)\)/)[1].split(','), i = sh.querySelector('.inner');
    window.__sf.push({ y: new DOMMatrix(getComputedStyle(sh).transform).m42, op: i ? +getComputedStyle(i).opacity : 1, grab: sh.classList.contains('grab'), dim: (a.length > 3 ? +a[3] : 1) * +b.opacity });
    requestAnimationFrame(loop); }; loop(); });
const sheetRecStop = page => page.evaluate(() => { window.__sr = false; return window.__sf; });
// open Settings fresh, let the entrance finish, then a short pull that springs back (the spring-back runs for 440 ms after release); returns the sheet's top
const shortPull = async (app, rec) => { const { page } = app;
  await page.evaluate(() => { state.sheet = 'settings'; renderSheet(); }); await page.waitForTimeout(700);
  const top = await page.evaluate(() => document.getElementById('sheet').getBoundingClientRect().top);
  if (rec) await sheetRec(page); await app.drag(195, top + 30, top + 90, 10); return top; };
test('sheet: a short pull springs back without the content blinking', async () => {
  const app = await open(); const { page } = app;
  await shortPull(app, true); await page.waitForTimeout(800); const f = await sheetRecStop(page);
  assert.equal(Math.min(...f.map(x => x.op)), 1, 'content opacity dipped after the spring-back');
  assert.equal(await page.evaluate(() => state.sheet), 'settings'); assert.equal(Math.round(f.at(-1).y), 0); assert.deepEqual(app.errors, []); await app.close();
});
test('sheet: a second pull during the spring-back keeps the drag', async () => {
  const app = await open(); const { page } = app;
  const top = await shortPull(app); await page.waitForTimeout(150);
  await sheetRec(page); await app.drag(195, top + 30, top + 110, 40); const f = await sheetRecStop(page); // ~640 ms: outlives the first pull's 440 ms spring-back timer
  assert.ok(f.length > 10 && f.slice(3).every(x => x.grab), `.grab dropped mid-drag at frame ${f.findIndex((x, i) => i > 2 && !x.grab)}`);
  assert.equal(Math.min(...f.map(x => x.op)), 1, 'content blinked during the drag');
  await page.waitForTimeout(700); assert.equal(await page.evaluate(() => state.sheet), 'settings'); assert.deepEqual(app.errors, []); await app.close();
});
test('sheet: closing during the spring-back never reopens it and the dim fades', async () => {
  const app = await open(); const { page } = app;
  await shortPull(app); await page.waitForTimeout(200);
  await sheetRec(page); await app.tap(195, 40); await page.waitForTimeout(700); const f = await sheetRecStop(page); // tap the dim above the sheet
  const out = f.findIndex(x => x.y > 100);
  assert.ok(out >= 0 && f.slice(out).every(x => x.y >= 100), `sheet came back up: ${f.map(x => Math.round(x.y))}`);
  const drop = Math.max(...f.slice(1).map((x, i) => f[i].dim - x.dim)); assert.ok(drop <= 0.2, `dim dropped ${drop.toFixed(2)} in one frame`);
  const r = await page.evaluate(() => ({ sheet: state.sheet, show: document.getElementById('sheet').classList.contains('show') }));
  assert.deepEqual(r, { sheet: null, show: false }); assert.ok(f.at(-1).dim < 0.01); assert.deepEqual(app.errors, []); await app.close();
});
test('sheet: tapping the dim while a swiped-away sheet slides out lets the dim fade', async () => {
  const app = await open(); const { page } = app;
  await page.evaluate(() => { state.sheet = 'settings'; renderSheet(); }); await page.waitForTimeout(700);
  const top = await page.evaluate(() => document.getElementById('sheet').getBoundingClientRect().top);
  await sheetRec(page); await app.drag(195, top + 150, top + 390, 8); await page.waitForTimeout(40); await app.tap(195, 40); await page.waitForTimeout(700); const f = await sheetRecStop(page);
  const drop = Math.max(...f.slice(1).map((x, i) => f[i].dim - x.dim)); assert.ok(drop <= 0.2, `dim dropped ${drop.toFixed(2)} in one frame`);
  const r = await page.evaluate(() => ({ sheet: state.sheet, show: document.getElementById('sheet').classList.contains('show') }));
  assert.deepEqual(r, { sheet: null, show: false }); assert.ok(f.at(-1).dim < 0.01); assert.deepEqual(app.errors, []); await app.close();
});
test('sheet: a sheet opened right after closing during the spring-back stays open', async () => {
  const app = await open(); const { page } = app;
  await shortPull(app); await page.waitForTimeout(60); await app.tap(195, 40); await page.waitForTimeout(120);
  await page.evaluate(() => openShift('m')); await page.waitForTimeout(900);
  const r = await page.evaluate(() => { const sh = document.getElementById('sheet'); return { sheet: state.sheet, show: sh.classList.contains('show'), y: Math.round(new DOMMatrix(getComputedStyle(sh).transform).m42) }; });
  assert.deepEqual(r, { sheet: 'shift', show: true, y: 0 }); assert.deepEqual(app.errors, []); await app.close();
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
// Hand-computed fixtures (expected values never come from the engine itself)
test('pay: combined premiums (night + weekend + public holiday), OT on a holiday off, leave on a holiday', async () => {
  const r = await engine(() => { const DAY = iso => { const [y, m, d] = iso.split('-').map(Number); return dayBreakdown({ iso, y, m: m - 1, d }, baseHourly(y, m - 1)); };
    state.assignments['2026-08-15'] = 'n'; state.dayMeta['2026-08-15'] = { otDay: 1, otNight: 2, holiday: false }; // Sat 15 Aug: RO public holiday
    state.dayMeta['2026-12-01'] = { otDay: 2, otNight: 0, holiday: false }; state.assignments['2026-12-25'] = 'hol'; saveState();
    return { wd: workingDaysInMonth(2026, 7), sat: DAY('2026-08-15'), otOff: DAY('2026-12-01'), leave: DAY('2026-12-25').total }; });
  const bh = 4000 / 168; assert.equal(r.wd, 21); // Aug and Dec 2026 both have 21 working days
  near(r.sat.base + r.sat.night + r.sat.weekend + r.sat.holiday, bh * 8 * (1 + 0.25 + 0.10 + 1.00), 'night shift on a Saturday holiday');
  near(r.sat.otDay, bh * (1 + 0.75 + 0.10 + 1.00), 'OT day: OT + weekend + holiday'); near(r.sat.otNight, bh * (1 + 0.75 + 0.25 + 0.10 + 1.00) * 2, 'OT night: all four');
  near(r.sat.total, bh * 8 * 2.35 + bh * 2.85 + bh * 6.2, 'day total');
  assert.ok(r.otOff.otOnly); near(r.otOff.total, bh * (1 + 0.75 + 1.00) * 2, 'OT on a weekday public holiday off');
  near(r.leave, bh * 8, 'paid leave on a public holiday: base only');
});
test('pay: switched-off premiums and overtime pay nothing; leave ignores stale OT', async () => {
  const r = await engine(() => { const DAY = iso => { const [y, m, d] = iso.split('-').map(Number); return dayBreakdown({ iso, y, m: m - 1, d }, baseHourly(y, m - 1)); };
    state.assignments['2026-09-07'] = 'hol'; state.dayMeta['2026-09-07'] = { otDay: 3, otNight: 0, holiday: false }; state.assignments['2026-09-02'] = 'n';
    state.assignments['2026-09-03'] = 'm'; state.dayMeta['2026-09-03'] = { otDay: 2, otNight: 1, holiday: false }; state.dayMeta['2026-09-05'] = { otDay: 4, otNight: 0, holiday: false }; saveState();
    const leave = DAY('2026-09-07'); state.salary.night.on = false; state.salary.overtime.on = false; saveState();
    return { leave, night: DAY('2026-09-02').total, ot: DAY('2026-09-03'), offDay: DAY('2026-09-05'), t: monthTotals(2026, 8) }; });
  near(r.leave.total, B, 'leave'); assert.equal(r.leave.otDay, 0); near(r.night, B, 'night off: base only');
  near(r.ot.total, B, 'OT off: shift base only'); assert.equal(r.ot.otDay + r.ot.otNight, 0); assert.equal(r.offDay, null, 'OT-only day with OT off');
  assert.equal(r.t.otTotal, 0); assert.equal(r.t.night, 0);
});
test('pay: custom norm hours, custom weekend days, part-hour shifts', async () => {
  const r = await engine(() => { const add = (id, start, end, brk) => state.shifts.push({ id, name: id, start, end, brk, color: '#3B82F6', icon: 'sun', night: false });
    add('s6', 480, 840, 0); add('s75', 480, 960, 30); state.region.stdHours = 6; saveState();
    const wd = monthISOs(2026, 8).filter(x => !isWeekend(x.y, x.m, x.d)); const o = { bh: baseHourly(2026, 8) };
    wd.slice(0, 11).forEach(x => state.assignments[x.iso] = 's6'); saveState(); o.half = monthTotals(2026, 8).base; o.day = dayBreakdown(wd[0], o.bh).total;
    wd.forEach(x => state.assignments[x.iso] = 's6'); saveState(); o.full = monthTotals(2026, 8).base;
    state.region.stdHours = 8; state.region.weekendDays = [5, 6]; state.assignments = { '2026-09-04': 'm', '2026-09-06': 'm', '2026-09-08': 's75' }; clearHolidayCache(); saveState();
    const D = iso => dayBreakdown({ iso, y: 2026, m: 8, d: +iso.slice(8) }, baseHourly(2026, 8));
    return { ...o, wdFS: workingDaysInMonth(2026, 8), fri: D('2026-09-04').total, sun: D('2026-09-06').total, part: D('2026-09-08') }; });
  near(r.bh, 4000 / (22 * 6), '6h norm hourly'); near(r.day, 4000 / 22, 'one full 6h day'); near(r.half, 2000, '11 of 22 days'); near(r.full, 4000, 'full 6h norm');
  assert.equal(r.wdFS, 22, 'Sep 2026 Sun–Thu'); near(r.fri, B * 1.1, 'Friday is weekend'); near(r.sun, B, 'Sunday is a work day');
  assert.equal(r.part.reg, 7.5); near(r.part.total, BH * 7.5, '08:00–16:00 minus 30 min');
});
test('pay: overnight shifts stay in their start month; month lengths; bonuses across the year change', async () => {
  const r = await engine(() => { state.assignments['2026-09-30'] = 'n'; state.salary.additions = [
      { id: 'a', name: 'A', amount: 1000, freq: 'annual', month: 12, on: true }, { id: 'o', name: 'O', amount: 300, freq: 'once', month: 12, year: 2026, on: true }]; saveState();
    const sep = monthTotals(2026, 8), oct = monthTotals(2026, 9);
    return { sepDays: sep.days, sepNightH: sep.nightH, sepNight: sep.night, octDays: oct.days, octPay: oct.grand - oct.additions,
      wd: [workingDaysInMonth(2026, 1), workingDaysInMonth(2028, 1), workingDaysInMonth(2026, 9)],
      add: [additionsTotal(2026, 11), additionsTotal(2027, 0), additionsTotal(2027, 11)] }; });
  assert.equal(r.sepDays, 1); assert.equal(r.sepNightH, 8); near(r.sepNight, B * 0.25, 'night premium in September');
  assert.equal(r.octDays, 0); assert.equal(r.octPay, 0); assert.deepEqual(r.wd, [20, 21, 22], 'Feb 2026, Feb 2028 (leap), Oct 2026');
  assert.deepEqual(r.add, [1300, 0, 1000], 'Dec 2026, Jan 2027, Dec 2027');
});
test('pay: zero and empty cases never produce NaN', async () => {
  const r = await engine(() => { state.shifts.push({ id: 'z', name: 'z', start: 480, end: 540, brk: 120, color: '#3B82F6', icon: 'sun', night: false });
    const D = iso => dayBreakdown({ iso, y: 2026, m: 8, d: +iso.slice(8) }, baseHourly(2026, 8));
    const o = { empty: D('2026-09-01'), zero: additionForMonth({ amount: 0, freq: 'monthly' }, 2026, 8), none: monthTotals(2026, 8).grand };
    state.assignments['2026-09-01'] = 'z'; saveState(); o.brk = D('2026-09-01').total;
    state.assignments['2026-09-02'] = 'n'; state.dayMeta['2026-09-02'] = { otDay: 2, otNight: 2, holiday: false }; state.salary.net = 0; saveState(); o.net0 = monthTotals(2026, 8).grand;
    state.salary.net = 4000; state.region.weekendDays = [0, 1, 2, 3, 4, 5, 6]; clearHolidayCache(); saveState();
    const t = monthTotals(2026, 8); o.allWe = { wd: workingDaysInMonth(2026, 8), bh: baseHourly(2026, 8), base: t.base, grand: t.grand, day: D('2026-09-02').total }; return o; });
  assert.equal(r.empty, null); assert.equal(r.zero, 0); assert.equal(r.none, 0); assert.equal(r.brk, 0, 'break longer than the shift'); assert.equal(r.net0, 0, 'net 0');
  assert.deepEqual(r.allWe, { wd: 0, bh: 0, base: 0, grand: 0, day: 0 }, 'no working days');
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

/* ===== 4b. Mobile audit fixes ===== */
test('calendar: the selection ring stays on the tapped day when the day card grows (375x667)', async () => {
  const app = await open(undefined, { vp: { width: 375, height: 667 } }); const { page } = app;
  const r = await page.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    ['night', 'weekend', 'holiday', 'overtime'].forEach(k => { state.salary[k].on = true; });
    state.assignments['2026-08-15'] = 'n'; state.dayMeta['2026-08-15'] = { otDay: 3, otNight: 2, holiday: true }; saveState(); // a Saturday: 5 badges → a taller day card
    switchTab('calendar'); state.viewY = 2026; state.viewM = 7; renderScreen(); await w(400);
    selectDay('2026-08-03'); await w(500); selectDay('2026-08-15'); await w(500);
    const a = document.querySelector('.calsel').getBoundingClientRect(), b = document.querySelector('.cell[data-iso="2026-08-15"]').getBoundingClientRect();
    return [a.top - b.top, a.left - b.left, a.height - b.height]; });
  assert.ok(r.every(v => Math.abs(v) < 1), 'ring vs cell (top, left, height): ' + JSON.stringify(r)); assert.deepEqual(app.errors, []); await app.close();
});
test('sheet: closing it (Done, backdrop, swipe) leaves no focused field inside the hidden sheet', async () => {
  const app = await open(); const { page } = app; const out = {};
  const openFocused = () => page.evaluate(async () => { state.sheet = 'salary'; renderSheet(); await new Promise(r => setTimeout(r, 600)); document.getElementById('netinput').focus(); });
  const focusedInSheet = () => page.evaluate(() => document.getElementById('sheet').contains(document.activeElement));
  // .click(): like iOS, tapping a button does not move focus off the field
  await openFocused(); await page.evaluate(() => document.querySelector('#sheet [data-action="sheetClose"]').click()); out.done = await focusedInSheet();
  await page.waitForTimeout(400); await openFocused(); await page.evaluate(() => document.getElementById('backdrop').click()); out.backdrop = await focusedInSheet();
  await page.waitForTimeout(400); await openFocused();
  const top = await page.evaluate(() => document.getElementById('sheet').getBoundingClientRect().top);
  await app.touch('touchStart', 195, top + 12); await page.evaluate(() => document.getElementById('netinput').focus()); // keep the field focused, as iOS does
  for (let i = 1; i <= 12; i++) { await page.waitForTimeout(16); await app.touch('touchMove', 195, top + 12 + 25 * i); } await app.touch('touchEnd'); await page.waitForTimeout(600);
  out.swipe = await focusedInSheet(); out.sheet = await page.evaluate(() => state.sheet);
  assert.deepEqual(out, { done: false, backdrop: false, swipe: false, sheet: null }); assert.deepEqual(app.errors, []); await app.close();
});
test('bonuses: an unfinished bonus survives toggling or deleting another bonus', async () => {
  const app = await open({ onboarded: true, fill: true, salary: { net: 4000, additions: [{ id: 'b1', name: 'A', amount: 100, freq: 'monthly', on: true }, { id: 'b2', name: 'B', amount: 50, freq: 'monthly', on: true }] } });
  const r = await app.page.evaluate(() => { state.sheet = 'salary'; renderSheet(); document.querySelector('[data-action="openBonuses"]').click();
    const f = () => [document.getElementById('bonusname').value, document.getElementById('bonusamt').value];
    document.getElementById('bonusname').value = '13th salary'; document.getElementById('bonusamt').value = '3000';
    document.querySelector('[data-action="bonusTog:b1"]').click(); const tog = f();
    document.querySelector('[data-action="bonusDel:b2"]').click(); const del = f();
    return { tog, del, ids: state.salary.additions.map(a => a.id + ':' + a.on) }; });
  assert.deepEqual(r, { tog: ['13th salary', '3000'], del: ['13th salary', '3000'], ids: ['b1:false'] }); assert.deepEqual(app.errors, []); await app.close();
});
test('calendar: sliding after a long-press opened the quick-assign sheet does not change the month', async () => {
  const app = await open(); const { page } = app;
  await page.evaluate(() => switchTab('calendar')); const m0 = await page.evaluate(() => state.viewM);
  const p = await center(page, '.cell.paintable[data-iso$="-15"]'); const dir = p.x < 195 ? 1 : -1;
  await app.touch('touchStart', p.x, p.y); await page.waitForTimeout(600);
  for (let i = 1; i <= 10; i++) { await page.waitForTimeout(16); await app.touch('touchMove', p.x + dir * 10 * i, p.y); } await app.touch('touchEnd'); await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(() => ({ sheet: state.sheet, m: state.viewM })), { sheet: 'quick', m: m0 }); assert.deepEqual(app.errors, []); await app.close();
});
test('shifts: the last paid-leave shift offers no delete (editor or swipe); with two, both can go', async () => {
  const app = await open(); const { page } = app;
  const one = await page.evaluate(() => { switchTab('shifts'); openShift('hol'); const editor = !!document.querySelector('#sheet [data-action="shiftDelete"]'); closeSheet();
    return { editor, swipe: !!document.querySelector('.swipe[data-id="hol"] .del') }; });
  await page.waitForTimeout(400); const p = await center(page, '.swipe[data-id="hol"] .front');
  await app.swipe(p.x, p.y, p.x - 120, p.y); await page.waitForTimeout(350);
  one.opened = await page.evaluate(() => document.querySelector('.swipe[data-id="hol"]').classList.contains('open'));
  const two = await page.evaluate(() => { state.shifts.push({ id: 'c1', name: 'Unpaid leave', start: 540, end: 1020, brk: 0, color: '#8B5CF6', icon: 'coffee', night: false, vac: true }); saveState(); renderScreen();
    openShift('hol'); const editor = !!document.querySelector('#sheet [data-action="shiftDelete"]'); closeSheet();
    return { editor, swipe: ['hol', 'c1'].every(id => document.querySelector(`.swipe[data-id="${id}"] .del`)) }; });
  assert.deepEqual({ one, two }, { one: { editor: false, swipe: false, opened: false }, two: { editor: true, swipe: true } }); assert.deepEqual(app.errors, []); await app.close();
});
test('calendar: changing the viewed month writes nothing, keeps the pay memo and schedules nothing', async () => {
  const app = await open(); const r = await app.page.evaluate(() => { switchTab('calendar'); let writes = 0, syncs = 0;
    const set = Storage.prototype.setItem; Storage.prototype.setItem = function () { writes++; return set.apply(this, arguments); };
    const sync = window.syncReminders; window.syncReminders = function () { syncs++; return sync.apply(this, arguments); };
    const k = state.viewY + '.' + state.viewM, memo = monthTotals(state.viewY, state.viewM);
    changeMonth(1); changeMonth(-1); changeMonth(-1); changeMonth(1);
    const done = { writes, syncs, memoKept: _mtCache[k] === memo, month: state.viewY + '.' + state.viewM === k };
    Storage.prototype.setItem = set; window.syncReminders = sync; return done; });
  assert.deepEqual(r, { writes: 0, syncs: 0, memoKept: true, month: true }); assert.deepEqual(app.errors, []); await app.close();
});
test('salary: the net salary is capped at the supported maximum (1e9) in Salary and onboarding', async () => {
  const typeNet = (page, id) => page.evaluate(id => { const i = document.getElementById(id); i.value = '12000000000'; i.dispatchEvent(new Event('input', { bubbles: true })); return state.salary.net; }, id);
  let app = await open(); let page = app.page;
  await page.evaluate(() => { state.sheet = 'salary'; renderSheet(); }); const sheet = await typeNet(page, 'netinput');
  await page.reload(); await page.waitForTimeout(300); const reloaded = await page.evaluate(() => state.salary.net); await app.close();
  app = await open(); page = app.page;
  await page.evaluate(() => { state.onboarded = false; state.onbStep = 1; renderOnboard(); }); const onb = await typeNet(page, 'onbnet');
  const next = await page.evaluate(() => { syncOnbNet(); return state.salary.net; });
  assert.deepEqual({ sheet, reloaded, onb, next }, { sheet: 1e9, reloaded: 1e9, onb: 1e9, next: 1e9 }); assert.deepEqual(app.errors, []); await app.close();
});

/* ===== 4c. Motion audit fixes ===== */
test('reduced motion: sheets open with their content visible (new sheet, sub-sheet, another sheet)', async () => {
  const app = await open(undefined, { rm: true }); const { page } = app;
  const r = await page.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), sh = document.getElementById('sheet');
    const look = () => { const cs = getComputedStyle(sh.querySelector('.inner')); return { op: cs.opacity, tf: cs.transform, y: Math.round(new DOMMatrix(getComputedStyle(sh).transform).m42) }; };
    const o = {}; state.sheet = 'settings'; renderSheet(); await w(100); o.settings = look();
    document.querySelector('[data-action="openSalary"]').click(); await w(100); o.salary = look();
    closeSheet(); openShift('m'); await w(100); o.shift = look(); return o; });
  for (const k in r) assert.deepEqual(r[k], { op: '1', tf: 'none', y: 0 }, k + ' ' + JSON.stringify(r[k]));
  assert.deepEqual(app.errors, []); await app.close();
});
test('reduced motion: the onboarding glow does not pulse', async () => {
  const app = await open(undefined, { rm: true }); const { page } = app;
  const r = await page.evaluate(() => [0, 6].map(step => { state.onboarded = false; state.onbStep = step; state.onbDir = 'f'; renderOnboard();
    return getComputedStyle(document.querySelector('.ob-glow'), '::before').animationName; }));
  assert.deepEqual(r, ['none', 'none']); assert.deepEqual(app.errors, []); await app.close();
});
test('dialog: Cancel then reopening right away keeps the new dialog', async () => {
  const app = await open(); const { page } = app;
  const r = await page.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), back = document.getElementById('dlgback'); const o = {};
    switchTab('shifts'); confirmDialog('A', 'x', 'Delete', () => {}); await w(400);
    back.querySelector('[data-dlg="cancel"]').click(); await w(120); // reopen inside the 260 ms clean-up window of the first close
    let ok = 0; confirmDialog('B', 'x', 'Delete', () => ok++); await w(400);
    o.dialog = !!back.querySelector('.dlg'); o.shown = back.classList.contains('show');
    back.querySelector('[data-dlg="ok"]')?.click(); await w(400); o.ok = ok; o.cleared = back.innerHTML === ''; return o; });
  assert.deepEqual(r, { dialog: true, shown: true, ok: 1, cleared: true }); assert.deepEqual(app.errors, []); await app.close();
});
// six shifts: at 375 px the Edit brush bar overflows and has to be scrolled to reach the later ones
const SHIFTS6 = [
  { id: 'm', name: 'Morning', start: 390, end: 930, brk: 60, color: '#F2A63C', icon: 'sun', night: false },
  { id: 'a', name: 'Afternoon', start: 870, end: 1410, brk: 60, color: '#14B8A6', icon: 'sunset', night: false },
  { id: 'n', name: 'Night', start: 1350, end: 450, brk: 60, color: '#6366F1', icon: 'moon', night: true },
  { id: 'c1', name: 'Weekend long', start: 420, end: 1140, brk: 30, color: '#3B82F6', icon: 'star', night: false },
  { id: 'c2', name: 'Training day', start: 480, end: 960, brk: 30, color: '#22C08A', icon: 'briefcase', night: false },
  { id: 'hol', name: 'Paid leave', start: 540, end: 1020, brk: 0, color: '#EC5A99', icon: 'coffee', night: false, vac: true }];
const editBrushbarAtEnd = async (page, brush) => { // Calendar in Edit mode, brush bar scrolled all the way right; returns that scrollLeft
  await page.evaluate(b => { if (b) state.brush = b; switchTab('calendar'); document.querySelector('[data-action="toggleEdit"]').click(); }, brush); await page.waitForTimeout(500);
  return page.evaluate(() => { const b = document.querySelector('.brushbar'); b.scrollLeft = b.scrollWidth; return b.scrollLeft; }); };
test('calendar: picking a brush keeps the Edit brush bar scroll (375x667)', async () => {
  const app = await open({ onboarded: true, shifts: SHIFTS6 }, { vp: { width: 375, height: 667 } }); const { page } = app;
  const max = await editBrushbarAtEnd(page); assert.ok(max > 0, 'the brush bar must overflow');
  const p = await center(page, '.brush[data-action="brush:c2"]'); await app.tap(p.x, p.y); await page.waitForTimeout(150);
  const r = await page.evaluate(() => { const b = document.querySelector('.brush[data-action="brush:c2"]');
    return { left: document.querySelector('.brushbar').scrollLeft, brush: state.brush, on: b.classList.contains('on'), visible: b.getBoundingClientRect().right <= innerWidth }; });
  assert.deepEqual(r, { left: max, brush: 'c2', on: true, visible: true }); assert.deepEqual(app.errors, []); await app.close();
});
test('calendar: painting keeps the Edit brush bar scroll on every frame (375x667)', async () => {
  const app = await open({ onboarded: true, shifts: SHIFTS6 }, { vp: { width: 375, height: 667 } }); const { page } = app;
  const max = await editBrushbarAtEnd(page, 'c2'); assert.ok(max > 0, 'the brush bar must overflow');
  const c = await page.evaluate(() => { const c = document.querySelectorAll('#calgrid .cell.paintable')[9], r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, iso: c.dataset.iso }; });
  await page.evaluate(() => { window.__bl = []; window.__rec = true; const loop = () => { if (!window.__rec) return; window.__bl.push(document.querySelector('.brushbar').scrollLeft); requestAnimationFrame(loop); }; loop(); });
  await app.tap(c.x, c.y); await page.waitForTimeout(300);
  const r = await page.evaluate(iso => { window.__rec = false; return { frames: window.__bl, painted: state.assignments[iso] }; }, c.iso);
  assert.equal(r.painted, 'c2'); assert.ok(r.frames.length > 5 && r.frames.every(v => v === max), `scrollLeft per frame: ${[...new Set(r.frames)]} (want ${max})`);
  assert.deepEqual(app.errors, []); await app.close();
});
// :active press state (mouse press: Chromium applies :active to a held mouse button); released off the target so no click fires
const pressed = async (page, sel, probe = sel) => { const p = await center(page, sel); await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.waitForTimeout(400); // past the 0.2 s press transition even when the first frames after load are slow
  const t = await page.evaluate(s => getComputedStyle(document.querySelector(s)).transform, probe); await page.mouse.move(2, 2); await page.mouse.up(); await page.waitForTimeout(250); return t; };
test('shifts: pressing an open (swiped) row keeps it open; a closed row still presses', async () => {
  const app = await open(); const { page } = app; const row = '.swipe[data-id="m"] .front';
  await page.evaluate(() => switchTab('shifts')); await page.waitForTimeout(300);
  const closed = await pressed(page, row); const p = await center(page, row);
  await app.swipe(p.x + 100, p.y, p.x - 60, p.y, 10); await page.waitForTimeout(500);
  const swiped = await pressed(page, row);
  assert.deepEqual({ closed, swiped }, { closed: 'matrix(0.98, 0, 0, 0.98, 0, 1)', swiped: 'matrix(1, 0, 0, 1, -76, 0)' }); assert.deepEqual(app.errors, []); await app.close();
});
test('calendar: pressing a repeat-week button presses only the button, not the whole panel', async () => {
  const app = await open(); const { page } = app;
  await page.evaluate(() => switchTab('calendar')); await page.waitForTimeout(300);
  const dayCard = await pressed(page, '.daybar'); // the day card is a button: it still presses
  await page.evaluate(() => { document.querySelector('[data-action="toggleEdit"]').click(); renderScreen(); }); await page.waitForTimeout(300); // after any re-render the entrance no longer masks it
  const panel = await pressed(page, '.brush[data-action="repweek:4"]', '.daybar'), button = await pressed(page, '.brush[data-action="repweek:4"]');
  assert.deepEqual({ dayCard, panel, button }, { dayCard: 'matrix(0.98, 0, 0, 0.98, 0, 1)', panel: 'none', button: 'matrix(0.97, 0, 0, 0.97, 0, 0)' });
  assert.equal(await page.evaluate(() => state.sheet), null); assert.deepEqual(app.errors, []); await app.close();
});
test('sheets: a tapped control keeps the field being typed in (shift name, bonus name, salary)', async () => {
  // real touch taps: the compat mousedown is where a tap moves focus off the field (element.click() skips it)
  const app = await open(); const { page } = app;
  const tapOn = async sel => { const [x, y] = await page.evaluate(s => { const el = document.querySelector(s); el.scrollIntoView({ block: 'center' }); const b = el.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, sel);
    await app.tap(x, y); await page.waitForTimeout(80); };
  await page.evaluate(() => { switchTab('shifts'); openShift('m'); }); await page.waitForTimeout(600);
  await page.focus('#shname'); await page.keyboard.press('End'); await page.keyboard.type('X');
  await tapOn('[data-action="sP"]'); await tapOn('[data-action^="shIcon:"]:not(.on)'); await tapOn('[data-action="shNight"]'); await page.keyboard.type('Y'); // keeps typing where it was
  const shift = await page.evaluate(() => ({ active: document.activeElement.id, value: document.getElementById('shname').value, start: state.d.start }));
  await tapOn('[data-action="shiftSave"]'); await page.waitForTimeout(400); // Save still closes the sheet and drops the keyboard
  const saved = await page.evaluate(() => ({ sheet: state.sheet, focused: document.getElementById('sheet').contains(document.activeElement) }));
  await page.evaluate(() => { state.sheet = 'bonuses'; renderSheet(); }); await page.waitForTimeout(600);
  await page.focus('#bonusname'); await page.keyboard.type('13th'); await tapOn('[data-action="bfreq:annual"]');
  const bonus = await page.evaluate(() => ({ active: document.activeElement.id, value: document.getElementById('bonusname').value, freq: state.bonusDraft.freq }));
  await page.evaluate(() => { closeSheet(); state.sheet = 'salary'; renderSheet(); }); await page.waitForTimeout(600);
  await page.focus('#netinput'); await tapOn('[data-action="bon:weekend"]'); // a number field (no caret API)
  const salary = await page.evaluate(() => document.activeElement.id);
  await tapOn('[data-action="backSettings"]'); // navigating to another sub-sheet does not refocus anything
  const navigated = await page.evaluate(() => document.activeElement.tagName);
  assert.deepEqual({ shift, saved, bonus, salary, navigated }, { shift: { active: 'shname', value: 'MorningXY', start: 420 }, saved: { sheet: null, focused: false }, bonus: { active: 'bonusname', value: '13th', freq: 'annual' }, salary: 'netinput', navigated: 'BODY' });
  assert.deepEqual(app.errors, []); await app.close();
});
test('calendar: a day tapped while the ring is still moving continues from where the ring is', async () => {
  const app = await open(); const { page } = app;
  const r = await page.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); switchTab('calendar'); await w(200);
    const c = [...document.querySelectorAll('#calgrid .cell.paintable')], pos = () => { const m = new DOMMatrix(getComputedStyle(document.querySelector('.calsel')).transform); return [Math.round(m.m41), Math.round(m.m42)]; };
    selectDay(c[2].dataset.iso); await w(500); selectDay(c[20].dataset.iso); await w(90); // mid-flight towards c[20]
    const before = pos(); selectDay(c[5].dataset.iso); const after = pos(); await w(600);
    return { before, after, midFlight: before[0] !== c[20].offsetLeft || before[1] !== c[20].offsetTop, end: pos(), target: [c[5].offsetLeft, c[5].offsetTop] }; });
  assert.ok(r.midFlight, 'the ring had already arrived — the scenario did not run');
  assert.deepEqual(r.after, r.before, 'the ring jumped when the new day was tapped'); assert.deepEqual(r.end, r.target); assert.deepEqual(app.errors, []); await app.close();
});
test('calendar: Today slides in from the direction of the current month', async () => {
  const app = await open(); const { page } = app;
  const r = await page.evaluate(() => { const names = () => document.getElementById('calgrid').getAnimations().map(a => a.animationName); switchTab('calendar');
    changeMonth(3); document.querySelector('[data-action="today"]').click(); const fromLater = names();
    changeMonth(-2); document.querySelector('[data-action="today"]').click(); const fromEarlier = names();
    return { fromLater, fromEarlier, onToday: state.viewM === TODAY.getMonth() && state.viewY === TODAY.getFullYear(), gridSlide }; });
  assert.deepEqual(r, { fromLater: ['gridInL'], fromEarlier: ['gridInR'], onToday: true, gridSlide: '' }); assert.deepEqual(app.errors, []); await app.close();
});
test('calendar: on short narrow screens a day card that wraps does not resize the grid; tall screens unchanged', async () => {
  const r = {};
  for (const [w, h] of [[375, 667], [390, 844], [414, 736]]) {
    const app = await open(undefined, { vp: { width: w, height: h } });
    r[w + 'x' + h] = await app.page.evaluate(() => { const t = new Date(), days = monthISOs(t.getFullYear(), t.getMonth());
      const busy = days.find(x => { const s = assignedShift(x.iso); return s && s.night; }), off = days.find(x => !assignedShift(x.iso));
      state.dayMeta[busy.iso] = { otDay: 2, otNight: 3, holiday: true }; saveState(); switchTab('calendar'); // five badges: wraps to two lines below ~410 px
      const m = () => ({ cell: Math.round(document.querySelector('#calgrid .cell').getBoundingClientRect().height * 10) / 10, card: Math.round(document.querySelector('.daybar').getBoundingClientRect().height) });
      selectDay(off.iso); const o = m(); selectDay(busy.iso); const b = m(); return { sameCell: o.cell === b.cell, offCard: o.card }; });
    assert.deepEqual(app.errors, []); await app.close(); }
  assert.deepEqual(r, { '375x667': { sameCell: true, offCard: 84 }, '390x844': { sameCell: true, offCard: 61 }, '414x736': { sameCell: true, offCard: 61 } });
});
test('sheet: closing during its entrance leaves from where it is (no jump up first)', async () => {
  const app = await open(); const { page } = app;
  await page.evaluate(() => { const sh = document.getElementById('sheet'); window.__y = []; window.__sr = true;
    const loop = () => { if (!window.__sr) return; window.__y.push(new DOMMatrix(getComputedStyle(sh).transform).m42); requestAnimationFrame(loop); }; state.sheet = 'settings'; renderSheet(); loop(); });
  await page.waitForTimeout(150); await page.evaluate(() => { window.__mark = window.__y.length; document.getElementById('backdrop').click(); }); await page.waitForTimeout(600);
  const y = await page.evaluate(() => { window.__sr = false; return window.__y.slice(window.__mark - 1); });
  assert.ok(y.every((v, i) => !i || v >= y[i - 1] - 1), `moved up after the close: ${y.map(Math.round)}`); assert.equal(Math.round(y.at(-1)), 808);
  await page.evaluate(() => openShift('m')); await page.waitForTimeout(700); // the next sheet opens normally
  const r = await page.evaluate(() => { const sh = document.getElementById('sheet'); return { cls: sh.className, y: Math.round(new DOMMatrix(getComputedStyle(sh).transform).m42), inline: sh.style.cssText }; });
  assert.deepEqual(r, { cls: 'sheet show', y: 0, inline: '' }); assert.deepEqual(app.errors, []); await app.close();
});
test('sheet: a sheet opened while the previous one is still closing rises from where it is (no drop first)', async () => {
  const app = await open(); const { page } = app;
  const r = await page.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), sh = document.getElementById('sheet');
    switchTab('shifts'); openShift('m'); await w(700); closeSheet(); await w(100); // Cancel, then the next sheet 0.1 s later
    const top0 = sh.getBoundingClientRect().top; state.sheet = 'settings'; renderSheet(); const tops = []; // a sheet of another height
    for (let i = 0; i < 40; i++) { await new Promise(r => requestAnimationFrame(r)); tops.push(sh.getBoundingClientRect().top); }
    await w(200); return { drop: Math.round(Math.max(...tops) - top0), moved: Math.round(top0 - tops.at(-1)) > 100, cls: sh.className, inline: sh.style.cssText, y: Math.round(new DOMMatrix(getComputedStyle(sh).transform).m42), sheet: state.sheet }; });
  assert.deepEqual(r, { drop: 0, moved: true, cls: 'sheet show', inline: '', y: 0, sheet: 'settings' }); assert.deepEqual(app.errors, []); await app.close();
});
test('sheet: navigating to a shorter or taller sub-sheet moves its top edge smoothly', async () => {
  const app = await open(); const { page } = app;
  const nav = async action => { await page.evaluate(() => { const sh = document.getElementById('sheet'); window.__t = []; window.__sr = true;
      const loop = () => { if (!window.__sr) return; window.__t.push(Math.round(sh.getBoundingClientRect().top)); requestAnimationFrame(loop); }; loop(); });
    await page.evaluate(a => document.querySelector(`#sheet [data-action="${a}"]`).click(), action); await page.waitForTimeout(450);
    const t = await page.evaluate(() => { window.__sr = false; return window.__t; }); const steps = t.slice(1).map((v, i) => Math.abs(v - t[i]));
    return { moved: t.at(-1) !== t[0], smooth: Math.max(...steps) < 150 && new Set(t).size >= 5, clean: await page.evaluate(() => { const sh = document.getElementById('sheet'); return sh.style.height === '' && !sh.getAnimations().length; }) }; };
  await page.evaluate(() => { state.sheet = 'settings'; renderSheet(); }); await page.waitForTimeout(700);
  const shorter = await nav('export'); // Settings → Export: ~350 px shorter
  await page.evaluate(() => { closeSheet(); state.sheet = 'backup'; renderSheet(); }); await page.waitForTimeout(700);
  const taller = await nav('backSettings'); // Backup → Settings
  const ok = { moved: true, smooth: true, clean: true }; assert.deepEqual({ shorter, taller }, { shorter: ok, taller: ok }); assert.deepEqual(app.errors, []); await app.close();
});
test('shifts: deleting from the editor collapses the row like swipe-delete', async () => {
  const app = await open(); const { page } = app;
  await page.evaluate(() => { state.shifts.push({ id: 'c1', name: 'Custom', start: 600, end: 900, brk: 30, color: '#3B82F6', icon: 'star', night: false }); saveState(); switchTab('shifts'); openShift('c1'); }); await page.waitForTimeout(600);
  await page.evaluate(() => { window.__h = []; window.__sr = true; const loop = () => { if (!window.__sr) return; const el = document.querySelector('.swipe[data-id="c1"]'); window.__h.push(el ? Math.round(el.getBoundingClientRect().height) : 0); requestAnimationFrame(loop); }; loop();
    document.querySelector('[data-action="shiftDelete"]').click(); });
  await page.waitForTimeout(100); const taps = await page.evaluate(() => { const el = document.querySelector('.swipe[data-id="c1"]'); return el ? getComputedStyle(el).pointerEvents : 'gone'; });
  await page.waitForTimeout(500); const h = await page.evaluate(() => { window.__sr = false; return window.__h; });
  const r = await page.evaluate(() => ({ deleted: !state.shifts.some(s => s.id === 'c1'), sheet: state.sheet, toast: document.getElementById('toast').textContent }));
  assert.ok(new Set(h.filter(v => v > 0 && v < h[0])).size >= 4, `row heights: ${[...new Set(h)]}`); assert.equal(taps, 'none', 'a collapsing row must not take taps');
  assert.deepEqual(r, { deleted: true, sheet: null, toast: 'Shift deleted' }); assert.deepEqual(app.errors, []); await app.close();
});
test('buttons: no press-only shimmer on Download backup, Copy CSV, the dialog and onboarding', async () => {
  const app = await open(); const { page } = app;
  const r = await page.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), after = el => getComputedStyle(el, '::after').content, o = {};
    state.sheet = 'backup'; renderSheet(); await w(100); o.backup = after(document.querySelector('[data-action="backupDownload"]'));
    closeSheet(); state.sheet = 'export'; renderSheet(); await w(100); o.csv = after(document.querySelector('[data-action="csvCopy"]')); closeSheet();
    confirmDialog('A', 'x', 'Delete', () => {}); o.dialog = after(document.querySelector('[data-dlg="ok"]'));
    state.onboarded = false; state.onbStep = 0; renderOnboard(); o.onboarding = after(document.querySelector('#onboard [data-action="onbNext"]'));
    o.shineLeft = document.querySelectorAll('.shine').length; return o; });
  assert.deepEqual(r, { backup: 'none', csv: 'none', dialog: 'none', onboarding: 'none', shineLeft: 0 }); assert.deepEqual(app.errors, []); await app.close();
});
test('onboarding: the chips and the chosen-country card have no backdrop blur over the animated background', async () => {
  const app = await open(); const { page } = app;
  const r = await page.evaluate(() => { const bf = sel => getComputedStyle(document.querySelector(sel)).backdropFilter;
    state.onboarded = false; state.onbStep = 0; renderOnboard(); const chip = bf('.ob-feat');
    state.onbStep = 6; state.onbCountry = 'RO'; renderOnboard(); return { chip, chosen: bf('.ob-chosen') }; });
  assert.deepEqual(r, { chip: 'none', chosen: 'none' }); assert.deepEqual(app.errors, []); await app.close();
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

/* ===== Shift reminders (native bridge; App.js is stubbed) ===== */
const NOW = '2026-03-27T10:00:00+02:00'; // Fri; Bucharest switches to summer time on Sun 29 Mar at 03:00
const notifs = page => page.evaluate(() => window.__msgs.filter(m => m.startsWith('notif:')).map(m => JSON.parse(m.slice(6))));
const toggle = page => page.evaluate(() => { const b = document.querySelector('[data-action="notif"]'); return b ? b.getAttribute('aria-pressed') : null; });
const openSettings = page => page.evaluate(() => { state.sheet = 'settings'; renderSheet(); });
test('reminders: hidden on web/PWA; the old notifications=true is not consent', async () => {
  const app = await open({ onboarded: true, notifications: true }); await openSettings(app.page);
  assert.equal(await toggle(app.page), null, 'no native support → no reminder row');
  assert.equal(await app.page.evaluate(() => state.reminders), false); assert.deepEqual(app.errors, []); await app.close();
});
test('reminders: permission asked only on the user\'s tap; the toggle is on only once granted', async () => {
  const app = await open({ onboarded: true, notifications: true, assignments: { '2026-03-28': 'm' } }, { native: true, time: NOW }); const { page } = app;
  assert.deepEqual(await notifs(page), [], 'nothing sent (no permission request) at launch');
  await page.evaluate(() => shNotif({ granted: true, canAsk: true })); // already allowed at OS level (e.g. Android 12): still off, nothing scheduled
  assert.deepEqual(await notifs(page), [{ items: [] }]); await openSettings(page); assert.equal(await toggle(page), 'false');
  await page.evaluate(() => { shNotif({ granted: false, canAsk: true }); document.querySelector('[data-action="notif"]').click(); });
  assert.deepEqual((await notifs(page)).at(-1), { req: 1 }); assert.equal(await toggle(page), 'false', 'not on before the answer');
  await page.evaluate(() => shNotif({ granted: false, canAsk: false, req: true }));
  assert.equal(await toggle(page), 'false'); assert.equal(await page.evaluate(() => state.reminders), false);
  assert.ok(await page.evaluate(() => document.getElementById('toast').classList.contains('show')), 'denied → points to system settings');
  await page.evaluate(() => { document.querySelector('[data-action="notif"]').click(); shNotif({ granted: true, canAsk: false, req: true }); });
  assert.equal(await toggle(page), 'true'); assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('shifthub_v4')).reminders), true);
  assert.equal((await notifs(page)).at(-1).items.length, 1); assert.deepEqual(app.errors, []); await app.close();
});
test('reminders: 60 min before; leave, past and out-of-window days skipped; overnight, DST and midnight-crossing leads', async () => {
  const seed = { onboarded: true, reminders: true, shifts: [{ id: 'm', name: 'Morning', start: 390, end: 930, brk: 60, color: '#F2A63C', icon: 'sun', night: false },
    { id: 'n', name: 'Night', start: 1350, end: 450, brk: 60, color: '#6366F1', icon: 'moon', night: true }, { id: 'e', name: 'Early', start: 30, end: 510, brk: 0, color: '#14B8A6', icon: 'sun', night: false },
    { id: 'hol', name: 'Paid leave', start: 540, end: 1020, brk: 0, color: '#EC5A99', icon: 'coffee', night: false, vac: true }],
    assignments: { '2026-03-27': 'm', '2026-03-28': 'n', '2026-03-29': 'm', '2026-03-30': 'hol', '2026-03-31': 'e', '2026-04-27': 'm', '2026-04-28': 'm' } };
  for (const [tz, want] of [['Europe/Bucharest', ['2026-03-28T21:30:00+02:00', '2026-03-29T05:30:00+03:00', '2026-03-30T23:30:00+03:00', '2026-04-27T05:30:00+03:00']],
                             ['Asia/Tokyo', ['2026-03-28T21:30:00+09:00', '2026-03-29T05:30:00+09:00', '2026-03-30T23:30:00+09:00', '2026-04-27T05:30:00+09:00']]]) {
    const app = await open(seed, { native: true, time: NOW, tz }); await app.page.evaluate(() => shNotif({ granted: true }));
    const items = (await notifs(app.page)).at(-1).items;
    assert.deepEqual(items.map(i => i.at), want.map(Date.parse), tz); // today's 06:30 already passed, paid leave and day 32 excluded
    assert.deepEqual(items.slice(0, 3).map(i => [i.title, i.body]), [['Night', 'Starts at 22:30'], ['Morning', 'Starts at 06:30'], ['Early', 'Starts at 00:30']]);
    assert.deepEqual(app.errors, []); await app.close();
  }
});
test('reminders: max 30; unchanged schedule not resent; edits, revoke, resume and turning off reschedule', async () => {
  const assignments = {}; for (let i = 1; i <= 40; i++) { const d = new Date(2026, 2, 27 + i); assignments[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`] = 'm'; }
  const app = await open({ onboarded: true, reminders: true, assignments }, { native: true, time: NOW }); const { page } = app;
  await page.evaluate(() => shNotif({ granted: true })); let n = await notifs(page);
  assert.equal(n.length, 1); assert.equal(n[0].items.length, 30); assert.equal(n[0].items[0].at, Date.parse('2026-03-28T05:30:00+02:00'));
  await page.evaluate(() => { saveState(); shNotif({ granted: true }); document.dispatchEvent(new Event('visibilitychange')); state.sheet = 'settings'; renderSheet(); });
  assert.equal((await notifs(page)).length, 1, 'same schedule → nothing resent');
  await page.evaluate(() => { state.assignments['2026-03-28'] = 'hol'; saveState(); }); n = await notifs(page);
  assert.equal(n.length, 2); assert.equal(n[1].items[0].at, Date.parse('2026-03-29T05:30:00+03:00'), 'leave day dropped');
  await page.evaluate(() => shNotif({ granted: false })); // revoked in system Settings
  assert.deepEqual((await notifs(page)).at(-1), { items: [] }); assert.equal(await toggle(page), 'false');
  await page.evaluate(() => shNotif({ granted: true })); assert.equal(await toggle(page), 'true'); assert.equal((await notifs(page)).at(-1).items.length, 30);
  await page.clock.setSystemTime(new Date('2026-03-29T12:00:00+03:00')); await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); // resume later: window rolls forward
  n = (await notifs(page)).at(-1).items; assert.equal(n.length, 30); assert.equal(n[0].at, Date.parse('2026-03-30T05:30:00+03:00'));
  const before = (await notifs(page)).length; await page.evaluate(() => document.querySelector('[data-action="notif"]').click());
  n = await notifs(page); assert.equal(n.length, before + 1); assert.deepEqual(n.at(-1), { items: [] }, 'off → cancel all');
  assert.equal(await toggle(page), 'false'); assert.equal(await page.evaluate(() => state.reminders), false); assert.deepEqual(app.errors, []); await app.close();
});

/* ===== Backup & restore through the real UI (file picker, native share) ===== */
// Shape of a backup made by the Expo app's Backup > Download (all persisted keys, v4), used as the regression fixture
const MOBILE_BACKUP = { app: 'shifthub', v: 4, exportedAt: '2026-09-23T07:12:00.000Z', data: {
  salary: { net: 5200, overtime: { on: true, pct: 75 }, night: { on: true, pct: 25 }, weekend: { on: false, pct: 50 }, holiday: { on: true, pct: 100 }, additions: [{ id: 'b1', name: '13th', amount: 5200, freq: 'annual', month: 12, on: true }] },
  shifts: [{ id: 'm', name: 'Early', start: 390, end: 870, brk: 30, color: '#F2A63C', icon: 'sun', night: false }, { id: 'n', name: 'Night', start: 1320, end: 360, brk: 0, color: '#6366F1', icon: 'moon', night: true },
    { id: 'hol', name: 'Paid leave', start: 540, end: 1020, brk: 0, color: '#EC5A99', icon: 'coffee', night: false, vac: true }],
  assignments: { '2026-09-21': 'm', '2026-09-22': 'n', '2026-09-25': 'hol' }, dayMeta: { '2026-09-22': { otDay: 0, otNight: 2, holiday: false } },
  appearance: 'dark', reminders: true, region: { country: 'DE', currency: 'EUR', locale: 'de-DE', weekendDays: [0, 6], weekStart: 1, stdHours: 8, customHolidays: [] },
  onboarded: true, lang: 'de', lastBackupAt: 1790140000000 } };
const TMP = join(tmpdir(), 'shifthub-test-' + process.pid) + '/';
const tmpFile = (name, text) => { mkdirSync(TMP, { recursive: true }); const f = TMP + name; writeFileSync(f, text); return f; };
const openBackupSheet = async page => { await page.evaluate(() => { state.sheet = 'backup'; renderSheet(); }); await page.waitForTimeout(500); };
const pickFile = async (page, file) => { const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('label:has(#backupfile)')]); await fc.setFiles(file); await page.waitForTimeout(300); };
const dlgOpen = page => page.evaluate(() => !!document.querySelector('#dlgback.show .dlg'));
const snapshot = page => page.evaluate(() => ({ cur: localStorage.getItem('shifthub_v4'), prev: localStorage.getItem('shifthub_v4_prev') }));

test('backup: Download → change data → pick that exact file → restore brings the original state back', async () => {
  const app = await open(); const { page } = app; await openBackupSheet(page);
  const before = await page.evaluate(() => { state.dayMeta['2026-09-02'] = { otDay: 2, otNight: 0, holiday: false }; state.appearance = 'dark'; saveState(); return JSON.parse(exportBackup()).data; });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-action="backupDownload"]')]);
  const file = TMP + dl.suggestedFilename(); mkdirSync(TMP, { recursive: true }); await dl.saveAs(file);
  assert.match(dl.suggestedFilename(), /^shifthub-backup-\d{4}-\d{2}-\d{2}\.json$/);
  await page.evaluate(() => { state.salary.net = 1; state.assignments = {}; state.dayMeta = {}; state.lang = 'fr'; saveState(); }); await openBackupSheet(page);
  await pickFile(page, file); assert.ok(await dlgOpen(page), 'confirm must open'); await page.click('[data-dlg="ok"]'); await page.waitForTimeout(300);
  const after = await page.evaluate(() => JSON.parse(exportBackup()).data);
  assert.deepEqual({ ...after, lastBackupAt: null }, { ...before, lastBackupAt: null }); assert.deepEqual(app.errors, []); await app.close();
});
test('backup: the same file can be picked again after Cancel or a failed read; the picker has no type filter', async () => {
  const app = await open(); const { page } = app; await openBackupSheet(page);
  const good = tmpFile('same.json', JSON.stringify(MOBILE_BACKUP)), bad = tmpFile('bad.json', '{ not json');
  await pickFile(page, good); assert.ok(await dlgOpen(page)); await page.click('[data-dlg="cancel"]'); await page.waitForTimeout(350);
  assert.equal(await page.evaluate(() => document.getElementById('backupfile').value), '', 'input reset after the read');
  await pickFile(page, good); assert.ok(await dlgOpen(page), 'same file again → confirm again'); await page.click('[data-dlg="cancel"]'); await page.waitForTimeout(350);
  await pickFile(page, bad); await pickFile(page, bad); assert.equal(await dlgOpen(page), false);
  await pickFile(page, good); assert.ok(await dlgOpen(page), 'after a failed file the good one still works');
  assert.equal(await page.evaluate(() => document.getElementById('backupfile').hasAttribute('accept')), false, 'content is validated, not the file type');
  assert.deepEqual(app.errors, []); await app.close();
});
test('backup: the mobile-format backup restores from a .json or a text file (fixture)', async () => {
  for (const name of ['shifthub-backup-2026-09-23.json', 'backup.txt']) {
    const app = await open(); const { page } = app; await openBackupSheet(page);
    await pickFile(page, tmpFile(name, JSON.stringify(MOBILE_BACKUP, null, 2))); await page.click('[data-dlg="ok"]'); await page.waitForTimeout(300);
    const r = await page.evaluate(() => JSON.parse(exportBackup()).data); assert.deepEqual(r, MOBILE_BACKUP.data, name); assert.deepEqual(app.errors, []); await app.close();
  }
});
test('backup: malformed, foreign, empty and newer-version backups are rejected without touching data', async () => {
  const app = await open(); const { page } = app; const s0 = await snapshot(page);
  const cases = [['{ not json', 'Invalid backup file'], ['[]', 'Not a ShiftHub backup'], ['{"app":"other","v":4,"data":{"shifts":[]}}', 'Not a ShiftHub backup'],
    ['{"app":"shifthub","data":null}', 'Not a ShiftHub backup'], ['{"app":"shifthub","data":[1]}', 'Not a ShiftHub backup'], ['{"app":"shifthub","data":"x"}', 'Not a ShiftHub backup'],
    ['{"app":"shifthub","v":4,"data":{}}', 'Not a ShiftHub backup'], ['{"app":"shifthub","v":4,"data":{"foo":1}}', 'Not a ShiftHub backup'],
    ['{"app":"shifthub","v":5,"data":{"assignments":{}}}', 'This backup was made by a newer version of Shift Hub']];
  for (const [text, msg] of cases) {
    const r = await page.evaluate(t => { restoreFromText(t); return { toast: document.getElementById('toast').textContent, dlg: !!document.querySelector('#dlgback.show .dlg, #dlgback .dlg') }; }, text);
    assert.equal(r.toast, msg, text); assert.equal(r.dlg, false, text);
  }
  assert.deepEqual(await snapshot(page), s0, 'nothing written');
  const ok = await page.evaluate(() => { restoreFromText('{"app":"shifthub","data":{"netMonthly":3000}}'); return !!document.querySelector('#dlgback .dlg'); }); // older, unversioned format still accepted
  assert.ok(ok); assert.deepEqual(app.errors, []); await app.close();
});
test('backup: native Download sends today\'s filename and exactly exportBackup(); restoring reminders asks no permission', async () => {
  const app = await open({ onboarded: true }, { native: true }); const { page } = app; await openBackupSheet(page);
  const r = await page.evaluate(() => { const exp = exportBackup(); document.querySelector('[data-action="backupDownload"]').click();
    const m = window.__msgs.find(x => x.startsWith('backup:')), nl = m.indexOf('\n');
    return { name: m.slice(7, nl), body: m.slice(nl + 1), exp, today: isoOf(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()) }; });
  const noTime = t => { const o = JSON.parse(t); delete o.exportedAt; return o; };
  assert.equal(r.name, `shifthub-backup-${r.today}.json`); assert.deepEqual(noTime(r.body), noTime(r.exp));
  await page.evaluate(() => shNotif({ granted: false, canAsk: true })); await page.evaluate(() => { window.__msgs.length = 0; });
  await openBackupSheet(page); await pickFile(page, tmpFile('rem.json', JSON.stringify(MOBILE_BACKUP))); await page.click('[data-dlg="ok"]'); await page.waitForTimeout(300);
  const n = await notifs(page); assert.equal(await page.evaluate(() => state.reminders), true, 'preference restored');
  assert.ok(n.every(o => !o.req && (!o.items || o.items.length === 0)), JSON.stringify(n)); assert.deepEqual(app.errors, []); await app.close();
});

/* ===== WebView payload (mobile/sync-html.js → htmlSource.js) ===== */
// Fixed pay case run in both the normal page and the synced payload (after ENGINE_BASE): RO December 2026 with day and
// night shifts, a weekend night, overtime, 1 Dec (public holiday) worked, and a monthly addition.
const PAY_FIXTURE = () => { state.lang = 'en'; state.salary.additions = [{ id: 'a', name: 'Bonus', amount: 100, freq: 'monthly', on: true }];
  for (let d = 1; d <= 11; d++) state.assignments['2026-12-' + String(d).padStart(2, '0')] = d === 5 ? 'n' : 'm';
  state.dayMeta['2026-12-02'] = { otDay: 2, otNight: 1, holiday: false }; saveState();
  const t = monthTotals(2026, 11); return { t: JSON.parse(JSON.stringify(t)), hol: dayBreakdown({ iso: '2026-12-01', y: 2026, m: 11, d: 1 }, baseHourly(2026, 11), t.cap), csv: csvExport(2026, 11) }; };

// App.js loads the synced HTML as a string with baseUrl https://shifthub.local/ — nothing is served there,
// so every local script must be inlined. Serve the payload the same way and fail on any leftover script fetch.
test('webview: synced payload is self-contained, renders, translates, picks a country, adds a holiday, pays the same, shows the HUB and calendar, repeats a week, opens Settings and every sheet; versions agree', async () => {
  const rd = f => readFileSync(new URL(f, import.meta.url), 'utf8');
  execFileSync(process.execPath, [new URL('./mobile/sync-html.js', import.meta.url).pathname], { stdio: 'pipe' });
  const out = rd('./mobile/htmlSource.js'), html = JSON.parse(out.slice(out.indexOf('export default ') + 15, out.lastIndexOf(';')));
  assert.ok(!/<script src="(?![a-z]+:)/i.test(html), 'no local <script src> left'); assert.ok(html.includes('const TR={'), 'TR inlined');
  assert.ok(html.includes('const COUNTRIES={'), 'COUNTRIES inlined'); assert.ok(html.includes('function holidaysFor('), 'holidays inlined');
  assert.ok(html.includes('function monthTotals('), 'engine inlined'); assert.ok(html.includes('function screenHub('), 'hub inlined');
  assert.ok(html.includes('function screenCalendar('), 'calendar inlined'); assert.ok(html.includes('function sheetSettings('), 'settings inlined');
  assert.ok(html.includes('function sheetExport('), 'sheets inlined');
  const idx = rd('./index.html'), v = idx.match(/const APP_VERSION='([^']+)'/)[1];
  const sv = [...idx.matchAll(/<script src="[\w.-]+\.js\?v=([^"]+)"/g)].map(m => m[1]);
  assert.ok(sv.length && sv.every(x => x === v), 'script ?v= matches APP_VERSION: ' + sv);
  assert.equal(rd('./sw.js').match(/shifthub-v([\d.]+)/)[1], v, 'sw cache matches APP_VERSION');
  for (const [, f] of idx.matchAll(/<script src="([\w.-]+\.js)\?v=/g)) assert.ok(rd('./sw.js').includes(`'${f}?v=${v}'`), `sw precaches the versioned ${f}`);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage(), errors = [], leaked = []; page.on('pageerror', e => errors.push(String(e)));
  await ctx.route('**/*', r => { const u = r.request().url();
    if (u === 'https://shifthub.local/') return r.fulfill({ contentType: 'text/html', body: html });
    if (/\.js(\?|$)/.test(u) && !/\/sw\.js$/.test(u)) leaked.push(u); return r.abort(); });
  await page.addInitScript(() => localStorage.setItem('shifthub_v4', JSON.stringify({ onboarded: true, lang: 'en',
    region: { country: 'US', currency: 'USD', locale: 'en-US', weekendDays: [0, 6], weekStart: 0, stdHours: 8, customHolidays: [] } })));
  await page.goto('https://shifthub.local/'); await page.waitForFunction(() => document.getElementById('screen').children.length > 0);
  assert.match(await page.textContent('#tabbar'), /Shifts/);
  await page.evaluate(() => { state.lang = 'ro'; saveState(); renderAll(); });
  assert.match(await page.textContent('#tabbar'), /Ture/, 'Romanian tab label');
  await page.evaluate(() => { state.sheet = 'region'; renderSheet(); }); await page.waitForTimeout(500);
  await page.click('[data-action="country:DE"]'); // Region list is built from COUNTRY_ORDER; the pick reads COUNTRIES.DE
  assert.deepEqual(await page.evaluate(() => [state.region.country, state.region.currency, state.region.weekStart]), ['DE', 'EUR', 1]);
  assert.deepEqual(await page.evaluate(() => [holidaysFor(2026).has('2026-04-06'), holidaysFor(2026).has('2026-04-13')]), [true, false], 'DE Easter Monday, not RO Orthodox');
  const draft = () => page.evaluate(() => [state.chDraft.m, state.chDraft.d]); // custom holiday via the Region sheet steppers (daysInMon clamps/wraps)
  await page.click('[data-action="chDm"]'); assert.deepEqual(await draft(), [1, 31], '1 Jan − 1 day wraps to 31');
  await page.click('[data-action="chMp"]'); assert.deepEqual(await draft(), [2, 29], 'February clamps the day to 29');
  await page.click('[data-action="chMp"]'); await page.click('[data-action="chDp"]'); assert.deepEqual(await draft(), [3, 30]);
  await page.click('[data-action="chAdd"]');
  assert.deepEqual(await page.evaluate(() => [holidaysFor(2026).has('2026-03-30'), isHolISO('2026-03-30'), isHolISO('2026-03-31')]), [true, true, false], 'custom holiday counted');
  await page.click('[data-action="nfmt:de-DE"]'); // the click case resets engine's _nfLoc from the main script
  assert.deepEqual(await page.evaluate(() => [state.region.locale, fmtN(1234), _nfLoc]), ['de-DE', '1.234', 'de-DE']);
  await page.evaluate(ENGINE_BASE); const wv = await page.evaluate(PAY_FIXTURE), web = await engine(PAY_FIXTURE); // same pay in the payload and the page
  assert.ok(wv.t.grand > 0 && wv.t.additions === 100 && wv.hol.holiday > 0 && wv.t.otDay > 0 && wv.t.night > 0 && wv.t.weekend > 0, JSON.stringify(wv.t));
  assert.deepEqual(wv, web, 'identical pay in WebView payload and page');
  await page.evaluate(() => closeSheet()); await page.waitForTimeout(500); // the Region sheet from above is still open
  const hub = await page.evaluate(() => { const y = TODAY.getFullYear(), m = TODAY.getMonth(); state.viewY = y; state.viewM = m; // HUB on the current month
    for (let d = 1; d <= 10; d++) state.assignments[isoOf(y, m, d)] = 'm'; saveState(); state.tab = 'hub'; renderScreen();
    return { hero: document.querySelector('.hero .v span').textContent, want: fmtN(monthTotals(y, m).grand), bars: document.querySelectorAll('.histbar').length,
      on: [...document.querySelectorAll('.histbar')].findIndex(b => b.classList.contains('on')), label: document.getElementById('histlabel').textContent }; });
  assert.equal(hub.hero, hub.want, 'hero shows the month total'); assert.deepEqual([hub.bars, hub.on], [6, 5], 'six bars, current month selected');
  await page.click('[data-action="histBar:4"]');
  const h2 = await page.evaluate(() => ({ on: [...document.querySelectorAll('.histbar')].findIndex(b => b.classList.contains('on')), label: document.getElementById('histlabel').textContent }));
  assert.equal(h2.on, 4, 'tapped bar highlighted'); assert.notEqual(h2.label, hub.label, 'label follows the tapped bar');
  // Calendar on March 2027 (RO, week starts Monday): source week Mon 1 m, Tue 2 n, Wed 3 m; next week already has Tue 9 = hol
  const cal = await page.evaluate(() => { const A = state.assignments; A['2027-03-01'] = 'm'; A['2027-03-02'] = 'n'; A['2027-03-03'] = 'm'; A['2027-03-09'] = 'hol';
    saveState(); state.viewY = 2027; state.viewM = 2; state.selISO = '2027-03-20'; state.tab = 'calendar'; renderScreen();
    const before = [document.querySelector('.daybar').textContent, document.getElementById('weekline').textContent]; selectDay('2027-03-01');
    return { cells: document.querySelectorAll('#calgrid .cell').length, want: calendarCells().length, before,
      after: [document.querySelector('.daybar').textContent, document.getElementById('weekline').textContent], week: fmtN(weekTotalOf('2027-03-01')) }; });
  assert.equal(cal.cells, cal.want, 'grid has calendarCells() cells');
  assert.notDeepEqual(cal.after, cal.before, 'day bar and week line follow the selected day'); assert.ok(cal.after[1].includes(cal.week), 'week line shows weekTotalOf');
  await page.click('[data-action="toggleEdit"]'); await page.click('[data-action="repweek:1"]'); // repeat this week once, filling gaps only
  assert.deepEqual(await page.evaluate(() => ['08', '09', '10', '11', '14', '15'].map(d => state.assignments['2027-03-' + d] || null)), ['m', 'hol', 'm', null, null, null],
    'empty days copied, existing Tue 9 kept, source Off days and the week after left alone');
  // Settings → Salary → back → Bonuses, through the real buttons (HUB gear → sheet rows)
  const sheet = () => page.evaluate(() => ({ s: state.sheet, text: document.getElementById('sheet').textContent }));
  await page.click('[data-action="toggleEdit"]'); await page.evaluate(() => switchTab('hub'));
  await page.click('[data-action="openSettings"]'); await page.waitForTimeout(500);
  let sh = await sheet(); assert.equal(sh.s, 'settings'); assert.ok(await page.$('#sheet [data-action="openRegion"]'), 'Region row');
  assert.ok(sh.text.includes(await page.evaluate(() => (COUNTRIES[state.region.country] || {}).n)), 'Region row names the country');
  await page.click('#sheet [data-action="openSalary"]'); await page.waitForTimeout(500);
  sh = await sheet(); assert.equal(sh.s, 'salary'); assert.ok(await page.$('#netinput'), 'net salary input');
  assert.ok(sh.text.includes(await page.evaluate(() => weekendLabel())), 'Salary shows weekendLabel()');
  await page.click('#sheet [data-action="backSettings"]'); await page.waitForTimeout(500);
  await page.click('#sheet [data-action="openBonuses"]'); await page.waitForTimeout(500);
  assert.equal((await sheet()).s, 'bonuses'); await page.fill('#bonusname', 'Night bonus');
  await page.click('#sheet [data-action="bfreq:weekly"]'); await page.waitForTimeout(300); // bfreq → syncBonusDraft() + re-render
  assert.deepEqual(await page.evaluate(() => [document.getElementById('bonusname').value, state.bonusDraft.name, state.bonusDraft.freq]), ['Night bonus', 'Night bonus', 'weekly'], 'typed name survives the re-render');
  // sheets.js: Export (sheetExport had no test) and Backup from Settings, the day sheet, the shift editor
  await page.click('#sheet [data-action="backSettings"]'); await page.waitForTimeout(500);
  await page.click('#sheet [data-action="export"]'); await page.waitForTimeout(500);
  assert.deepEqual(await page.evaluate(() => [state.sheet, document.querySelector('#sheet .csvbox').textContent === csvExport(state.viewY, state.viewM)]), ['export', true], 'Export shows csvExport()');
  await page.evaluate(() => closeSheet()); await page.waitForTimeout(500);
  await page.click('[data-action="openSettings"]'); await page.waitForTimeout(500); await page.click('#sheet [data-action="openBackup"]'); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => state.sheet), 'backup'); assert.ok(await page.$('#sheet [data-action="backupDownload"]'), 'backup Download button');
  await page.evaluate(() => closeSheet()); await page.waitForTimeout(500);
  await page.evaluate(() => { state.selISO = '2027-03-01'; openDayMeta(); }); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => state.sheet), 'meta');
  for (const a of ['otDayM', 'otDayP', 'otNightM', 'otNightP']) assert.ok(await page.$(`#sheet [data-action="${a}"]`), 'day sheet overtime stepper ' + a);
  await page.evaluate(() => closeSheet()); await page.waitForTimeout(500);
  await page.evaluate(() => openNewShift()); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => state.sheet), 'shift'); assert.ok(await page.$('#sheet .cpick .sv'), 'colour picker');
  for (const a of ['sM', 'sP', 'eM', 'eP']) assert.ok(await page.$(`#sheet [data-action="${a}"]`), 'shift editor stepper ' + a);
  await page.evaluate(() => closeSheet()); await page.waitForTimeout(500);
  assert.deepEqual(leaked, []); assert.deepEqual(errors, []); await ctx.close();
});

/* ===== runner ===== */
let failed = 0;
for (const [name, fn] of tests) {
  try { await fn(); console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('FAIL  ' + name + '\n      ' + String(e.message || e).split('\n').filter(Boolean).slice(0, 14).join(' | ')); }
}
await browser.close(); rmSync(TMP, { recursive: true, force: true });
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exitCode = failed ? 1 : 0;

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
async function open(seed = { onboarded: true, fill: true }, { tz = 'Europe/Bucharest' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, timezoneId: tz });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(s => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    if (s.fill) { const t = new Date(), y = t.getFullYear(), m = t.getMonth(), n = new Date(y, m + 1, 0).getDate(); s.assignments = {};
      for (let d = 1; d <= n; d++) { const w = new Date(y, m, d).getDay(); if (w && w < 6) s.assignments[`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`] = d % 3 ? 'm' : 'n'; }
      delete s.fill; }
    localStorage.setItem('shifthub_v4', JSON.stringify(s));
  }, seed);
  await page.goto(APP); await page.waitForFunction(() => document.getElementById('screen').children.length > 0);
  const cdp = await ctx.newCDPSession(page);
  const T = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  // vertical finger drag from (x,y0) to (x,y1) in `steps` moves, one per ~frame
  const drag = async (x, y0, y1, steps = 24) => { await T('touchStart', x, y0);
    for (let i = 1; i <= steps; i++) { await page.waitForTimeout(16); await T('touchMove', x, y0 + (y1 - y0) * i / steps); }
    await T('touchEnd'); };
  const tap = async (x, y) => { await T('touchStart', x, y); await T('touchEnd'); };
  return { page, errors, drag, tap, close: () => ctx.close() };
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

/* ===== runner ===== */
let failed = 0;
for (const [name, fn] of tests) {
  try { await fn(); console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('FAIL  ' + name + '\n      ' + String(e.message || e).split('\n').filter(Boolean).slice(0, 4).join(' | ')); }
}
await browser.close();
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exitCode = failed ? 1 : 0;

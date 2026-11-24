// Pure parts of the native island in App.js (no React), so test.mjs can run them.
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// finger x → section index 0..2 and the pill offset; the full island (width iw) is centred, 6 px padding each side
const sectionAt = (x, screenW, iw) => { const sw = (iw - 12) / 3, r = x - (screenW - iw) / 2 - 6; return { i: clamp(Math.floor(r / sw), 0, 2), px: clamp(r - sw / 2, 0, 2 * sw) }; };
// scroll y → [new anchor, mini] (mini null = unchanged); same dead-bands as the page: top 24 px expands, moves under 4 px from the anchor are ignored
const nextMini = (anchor, y) => anchor === null ? [y, null] : y <= 24 ? [y, false] : Math.abs(y - anchor) < 4 ? [anchor, null] : [y, y > anchor];
// 'ico:' payload → the 4 path strings, or null: exactly 4 short strings of path-data characters only
const parseIco = (v) => { let a; try { a = JSON.parse(v); } catch (_) { return null; } return Array.isArray(a) && a.length === 4 && a.every((x) => typeof x === 'string' && x.length <= 20000 && /^[MmAaVvHhLlZz0-9 .,eE-]*$/.test(x)) ? a : null; };
// 'lbl:a|b|c[|hint]' → { labels, hint } or null
const parseLbl = (v) => { const a = v.split('|'); return a.length === 3 || a.length === 4 ? { labels: a.slice(0, 3), hint: a[3] || '' } : null; };
module.exports = { sectionAt, nextMini, parseIco, parseLbl };

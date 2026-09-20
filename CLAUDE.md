# Shift Hub — working rules

Single-file PWA: everything lives in `index.html` (inline CSS + vanilla JS),
plus `sw.js` (service worker) and `manifest.json`. No build step, no
dependencies. Bump the `shifthub-vNN` cache name in `sw.js` whenever you
change `index.html`/`manifest.json` so clients get the update.

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
  hours / (workingDays × stdHours))`); premiums use the region hourly rate.
- i18n: English source strings are the keys; add new user-facing text via
  `tr('...')` and add the key to each language in `TR` (fallback is English).
  Localize months/weekdays via the existing `monthName`/`dow*` helpers.
- Verify visually with the pre-installed Chromium via Playwright before
  committing UI or logic changes.

_Minimal-code rules adapted from [ponytail](https://github.com/DietrichGebert/ponytail) (MIT)._

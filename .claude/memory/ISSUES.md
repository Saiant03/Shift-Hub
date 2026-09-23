# Known issues

_Remove an entry once it is resolved._

- **Intermittent test failure (unidentified).** One non-pay test failed once
  (66/67) on the untouched v4.16 baseline; name not captured, never reproduced
  since (~12 full runs). If it recurs: keep the full `node test.mjs` output and
  record the test name here.
- **`sync-html.js` leftover check is narrow.** It only matches tags written
  `<script src="…">`; a tag with another attribute before `src` would pass the
  sync-time check. The WebView test still catches it. Fix: match
  `/<script[^>]*\ssrc="(?![a-z]+:)/i`.
- **Unused code:** `STD_DAY_HOURS` and `shiftMix` in `engine.js` (pre-existing).
- **Memory files are public.** The site auto-deploys from `main`, so
  `.claude/memory/` is served with it — never write secrets or personal data here.

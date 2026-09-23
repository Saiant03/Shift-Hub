# Known issues

_Remove an entry once it is resolved._

- **Intermittent test failure: `salary: the net salary is capped at the supported
  maximum (1e9)…`.** Failed once in a full run (v4.29 work), got `reloaded: 4000`;
  passes 12/12 alone. Probably also the unnamed one-off failure seen at v4.16.
  The test reloads the page right after the typed value is saved, so the write likely hasn't reached storage yet (test race,
  not an app bug). If it recurs, re-run; a fix would wait briefly before `reload()`.
- **Keyboard closes on sheet controls (iPhone).** Fixed in v4.31 in Chromium;
  unconfirmed on the phone (see NEXT_STEPS.md). Remove once verified.
- **`sync-html.js` leftover check is narrow.** It only matches tags written
  `<script src="…">`; a tag with another attribute before `src` would pass the
  sync-time check. The WebView test still catches it. Fix: match
  `/<script[^>]*\ssrc="(?![a-z]+:)/i`.
- **Unused code:** `STD_DAY_HOURS` and `shiftMix` in `engine.js` (pre-existing).
- **Memory files are public.** The site auto-deploys from `main`, so
  `.claude/memory/` is served with it — never write secrets or personal data here.

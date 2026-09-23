# Decisions

Format: `DATE — DECISION — REASON`. Only what future sessions need; the code
and CLAUDE.md hold the rest.

- 2026-09-23 — Local JS is inlined into the WebView payload by `mobile/sync-html.js` — App.js loads an HTML string with `baseUrl https://shifthub.local/`, which serves no files; an external script would only fail on the phone.
- 2026-09-23 — Script tags carry `?v=<APP_VERSION>` and `sw.js` precaches those exact URLs — the SW is cache-first for non-documents, so an unversioned script could run stale under a new `index.html`.
- 2026-09-23 — Extract only definition-only sections, byte-for-byte, `"use strict";` first, loaded before the main script — keeps init order and listener registration unchanged; cross-file globals are only touched at call time.
- 2026-09-23 — Every extraction extends the single WebView test (serve payload at `https://shifthub.local/`, abort other requests, fail on any local `.js` request or pageerror) — `file://` tests cannot catch a mobile-only break.
- 2026-09-23 — Decomposition stopped at v4.21 — what remains in `index.html` runs at load, owns shared state, or registers order-sensitive listeners; the rest is too small to justify a file.
- 2026-09-23 — Persistent memory lives in `.claude/memory/` (Markdown in Git) — keeps working context across sessions without long conversations.

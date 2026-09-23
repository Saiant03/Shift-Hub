# Decisions

Format: `DATE — DECISION — REASON`. Only what future sessions need; the code
and CLAUDE.md hold the rest.

- 2026-09-23 — Local JS is inlined into the WebView payload by `mobile/sync-html.js` — App.js loads an HTML string with `baseUrl https://shifthub.local/`, which serves no files; an external script would only fail on the phone.
- 2026-09-23 — Script tags carry `?v=<APP_VERSION>` and `sw.js` precaches those exact URLs — the SW is cache-first for non-documents, so an unversioned script could run stale under a new `index.html`.
- 2026-09-23 — Extract only definition-only sections, byte-for-byte, `"use strict";` first, loaded before the main script — keeps init order and listener registration unchanged; cross-file globals are only touched at call time.
- 2026-09-23 — Every extraction extends the single WebView test (serve payload at `https://shifthub.local/`, abort other requests, fail on any local `.js` request or pageerror) — `file://` tests cannot catch a mobile-only break.
- 2026-09-23 — Decomposition stopped at v4.21 — what remains in `index.html` runs at load, owns shared state, or registers order-sensitive listeners; the rest is too small to justify a file.
- 2026-09-23 — Persistent memory lives in `.claude/memory/` (Markdown in Git) — keeps working context across sessions without long conversations.
- 2026-09-23 — The Edit brush bar keeps its scroll by a read/restore of `scrollLeft` around `renderScreen()`, not a surgical brush toggle — painting (`afterPaint`) re-renders too, and the full render keeps week line, repeat panel, `.sel` and today chip correct.
- 2026-09-23 — One settle-timer handle per sheet (`sh._sb`) for spring-back / close-during-spring-back, cleared by drag claim, close and open — stale timers were firing into newer sheet states (reopen flash, lost `.grab`, hidden new sheet).

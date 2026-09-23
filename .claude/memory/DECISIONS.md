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
- 2026-09-23 — The day card reserves two lines (84 px) only at max-width 410 and max-height 780 — only there does the grid take the leftover height and the badges wrap; elsewhere the look is unchanged.
- 2026-09-23 — The `.shine` press shimmer was removed, not completed — bound to :active it only flashed a sliver, and on the dialog/onboarding the button disappears at once anyway.
- 2026-09-23 — Left as is by the user: theme-switch fade (B3) and the paint-pop cut (A12) — not visible enough to be worth a change.
- 2026-09-23 — `mobile/app.json` `userInterfaceStyle` is `automatic` — `dark` locked the WebView's prefers-color-scheme to dark, so the Auto theme (and the status bar that follows it) never followed iOS.
- 2026-09-23 — HUB pay: one Pay breakdown card with a 4-group composition bar (base, overtime, premiums, extra); its summary rows are the color key; no separate KPI card — seven look-alike slices were unreadable and the KPI card repeated the summary amounts (user's call).
- 2026-09-23 — Extra earnings share one color (`EXTRA_COLOR`), no per-bonus color field — keeps bonus persistence unchanged (user declined a new persisted field).
- 2026-09-23 — Shift order = the `state.shifts` array itself; reorder by hold ~450 ms + drag, plus visually hidden Move up/down buttons — no second source of order; the buttons keep it usable with VoiceOver (user chose the gesture over visible buttons).
- 2026-09-23 — Safe area is handled by the scroller's position (`.screen` `top: env(safe-area-inset-top)`), not padding — padding scrolls away with the content; no hard-coded status-bar height.
- 2026-09-23 — The native status bar follows the theme the page reports (`bar:light|dark` → App.js `expo-status-bar`) — the page is the only theme source (Auto resolved there via matchMedia); no HTML status bar.

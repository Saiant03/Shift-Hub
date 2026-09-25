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
- 2026-09-23 — Theme-switch fade (B3) removed at v4.45 (page and cards switch together) — user choice.
- 2026-09-23 — A12 fixed at v4.46 by carrying running paint pops across `afterPaint`'s full render (same `currentTime`, original `style` restored on `animationend`) and dropping `tilePop`'s 100% frame so it lands on the cell's own scale — keeps the full render that syncs week line / repeat panel / totals; no timers.
- 2026-09-23 — Installed PWA keeps `black-translucent` (white status-bar icons) — iOS can't switch it at runtime; the Expo app is the target and already follows the theme.
- 2026-09-23 — `mobile/app.json` `userInterfaceStyle` is `automatic` — `dark` locked the WebView's prefers-color-scheme to dark, so the Auto theme (and the status bar that follows it) never followed iOS.
- 2026-09-23 — HUB pay: one Pay breakdown card with a 4-group composition bar (base, overtime, premiums, extra); its summary rows are the color key; no separate KPI card — seven look-alike slices were unreadable and the KPI card repeated the summary amounts (user's call).
- 2026-09-23 — Extra earnings share one color (`EXTRA_COLOR`), no per-bonus color field — keeps bonus persistence unchanged (user declined a new persisted field).
- 2026-09-23 — Shift order = the `state.shifts` array itself; reorder by hold ~450 ms + drag, plus visually hidden Move up/down buttons — no second source of order; the buttons keep it usable with VoiceOver (user chose the gesture over visible buttons).
- 2026-09-23 — Safe area is handled by the scroller's position (`.screen` `top: env(safe-area-inset-top)`), not padding — padding scrolls away with the content; no hard-coded status-bar height.
- 2026-09-23 — The native status bar follows the theme the page reports (`bar:light|dark` → App.js `expo-status-bar`) — the page is the only theme source (Auto resolved there via matchMedia); no HTML status bar.
- 2026-09-23 — Under the calendar grid, optional content keeps its space as a hidden real element (week line `visibility:hidden`, invisible zero-width badge on the day card) — the grid takes the leftover height, so anything appearing below it resized every cell; hidden real elements match the true height on any font, no px values.
- 2026-09-24 — No standalone build (EAS) for now; the phone keeps running the app via Expo Go + `npm run tunnel` — an iPhone build needs a paid Apple Developer account (user declined for now) and no Android phone is available; EAS itself is free, revisit if the account is bought.
- 2026-09-25 — Reload tests open with `durable` (a second page must see the seed, else a fresh context) and the seed runs only on `?seed` — under load ~1 in 6 fresh contexts never persist their first page's localStorage (reload finds it empty); the old sessionStorage guard was lost the same way and re-seeded. Chromium test quirk, not the app.
- 2026-09-25 — Night hours paid is one number per shift (`nightMin`, manual, unset = whole paid shift) — tester feedback; user chose manual per shift over an automatic 22–06 window or per-day overrides.

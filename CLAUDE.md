# Shift Hub — working rules

PWA: the core lives in `index.html` (inline CSS + vanilla JS), with self-contained
parts in classic scripts loaded before it — translation data in `i18n.js`, country
presets in `countries.js`, holiday code in `holidays.js`, the pay engine in `engine.js`,
the HUB screen in `hub.js`, the Calendar screen in `calendar.js`, the Settings sheets in
`settings.js`, the other sheets in `sheets.js`, the dot-matrix font in `dots.js` — plus `sw.js` (service worker) and `manifest.json`.
No build step, no dependencies. Bump the asset build `b<N>` (the `shifthub-b<N>` cache name
in `sw.js` **and** the `?v=b<N>` on every local `<script src>` plus its `sw.js` precache
entry; `N` only goes up, never reuse one) and `APP_VERSION` in `index.html` (display version,
sequence 1.0 … 1.9, 1.10, 2.0 … 2.10, 3.0 — two integers, one step per released phase;
v4.78 = 1.0 = b79) — keep them in sync (a test checks) — whenever you
change `index.html`/`i18n.js`/`countries.js`/`holidays.js`/`engine.js`/`hub.js`/`calendar.js`/`settings.js`/`sheets.js`/`dots.js`/`manifest.json` so clients get the update. Primary target is the
**mobile** app; the web/PWA is the test/demo surface.

## Working rules (user, 2026-11-20 — apply every session)

- **Chat voice: `caveman` skill.** Every reply to the user in chat: Romanian, terse, answer
  first, every fact kept. Code, commits, docs and memory files stay in normal full prose.
- **No assumptions: `grilling` skill (`grill-me`).** Every new task or stage starts with a
  question round (each question with a recommended answer) until nothing is assumed; facts
  are looked up by a haiku subagent, decisions go to the user. Obvious one-line requests: act.
- **Code: `ponytail` + `ponytail-review` / `ponytail-audit`.** Before any code, apply the
  ponytail ladder (YAGNI → reuse → platform → one line → minimum code); review every diff
  with `ponytail-review`. Never lazy about understanding, validation, data loss, security,
  accessibility. No abstractions, dependencies or boilerplate nobody asked for.
- **Design: use every design skill and its audit** (impeccable incl. critique/audit/bolder/
  delight and its subagents, frontend-design, emil-design-eng, apple-design, mobile-native,
  web-design-guidelines, break-ui). The goal is a distinctive look, never a generic template.
- **Motion: one coherent, current motion system** (shared duration/easing/spring tokens,
  springs and interruptible gestures, View Transitions / scroll-driven where supported,
  reduced-motion fallback) via animate, choreograph, gestures, find-animation-opportunities,
  animation-performance; check with review-animations / improve-animations.
- **Model hierarchy (always pass `model` explicitly):** Opus (the session) plans, decides and
  verifies everything. Sonnet writes code and tests. Opus reviews; if wrong, it sends exact
  correction instructions and reviews again — at most 2 correction rounds, then Opus fixes it
  itself and says so. Haiku does research/exploration, file and memory updates, translations
  (i18n) and all other writing; Opus checks its output too. Subagents never touch git; only
  Opus commits and pushes, after its own review and a test run it saw finish.

## Project specifics

- Keep the pay engine correct: base is pro-rata (`net × min(1, worked+leave
  hours / (workingDays × stdHours))`); premiums use the region hourly rate;
  additional non-shift earnings (bonuses / 13th salary) are a separate layer
  added on top (see the pay engine below).
- i18n: English source strings are the keys; add new user-facing text via
  `tr('...')` and add the key to **all six** languages in `TR`
  (ro, es, de, fr, it, pt; fallback is English) with `Object.assign(TR.xx,{…})`
  blocks in `i18n.js`. Localize months/weekdays via `monthName`/`dow*`. Prefer
  browser `Intl` (e.g. `Intl.RelativeTimeFormat`) over hand-rolled per-language
  text when it removes strings.
- Verify visually with the pre-installed Chromium via Playwright before
  committing UI or logic changes.
- Performance: no `backdrop-filter` on the tab bar, sheet/dialog dims or other
  large/animated layers (re-rasterised every scroll/animation frame on low-end
  Android), and no per-frame global `pointermove` work for decoration.

## Files

- `index.html` — the app core: markup, CSS, state, init and the tightly coupled logic (render, persistence/backup, reminders, gestures, click router); the extracted parts live in the nine JS files below.
- `i18n.js` — `TR` translation data only (classic script loaded before the main one).
- `countries.js` — `COUNTRIES` presets + `countryName`/`countryOrder` (names and order in the app language via `Intl`; same loading as `i18n.js`).
- `holidays.js` — public-holiday code (`holidayCache` … `isHolISO`), loaded after `countries.js`, before the main script.
- `engine.js` — the "Salary engine" section (`monthISOs` … `cur`), loaded after `holidays.js`, before the main script.
- `hub.js` — the "HUB" section (`upcomingShift` … `animateHub`), loaded after `engine.js`, before the main script.
- `calendar.js` — the "Calendar" section (`calendarCells` … `screenCalendar`), loaded after `hub.js`, before the main script.
- `settings.js` — the "Settings" section (`activeBonusCount` … `sheetRegion`), loaded after `calendar.js`, before the main script.
- `sheets.js` — the "Sheets" section (`stepRow` … `sheetBackup`), loaded after `settings.js`, before the main script.
- `dots.js` — the "Shift Modular" dot-matrix font: `DOT_T` glyph table (15-row bitmaps) and the SVG drawing (`dotSVG`), loaded after `sheets.js`, before the main script.
- `sw.js` — service worker (cache name `shifthub-b<N>`, the asset build). Documents (navigations, `index.html`) are network-first, with the cached `index.html` as the offline fallback (an error response never replaces it); other same-origin assets are cache-first; cross-origin requests are ignored.
- `manifest.json`, `icon.png` — PWA metadata / icon.
- `test.mjs` — regression tests (`node test.mjs`): Playwright + Chromium against the
  real `index.html`, real touch input via CDP. No install step, no dependencies.
- `mobile/` — Expo wrapper. `App.js` = a `react-native-webview` that loads the
  HTML; `sync-html.js` copies `../index.html` into `mobile/htmlSource.js` at
  start, inlining every local `<script src>` (the WebView's `baseUrl` serves no
  files, so the payload must be self-contained) (**`htmlSource.js` is generated, not in git — never edit by hand**).
  `App.js` handles `hap:` (native haptics), `backup:` (native share sheet),
  `notif:` (shift reminders via `expo-notifications`) and `bar:light|dark` (the theme on
  screen → native status-bar icons, sent by `applyAppearance`) messages posted from the web layer. `islandLogic.js` = the native island's pure logic (CommonJS, tested by `test.mjs`).

## Process map
Moved to `.claude/docs/ARCHITECTURE.md` (state, render pipeline, pay engine, sheets and gestures, feature map). Read it before touching app code.

## Dev workflow (per task)

1. Grill round (questions), then understand the real flow before touching code (ponytail).
2. Write the minimal diff; add i18n keys for any new string in all six languages.
3. Bump `APP_VERSION` (index.html, next in the display sequence), the `?v=b<N>` on every local `<script src>` (index.html) **and** the `shifthub-b<N>` cache + precache entries (sw.js), in sync (`N` = previous + 1).
4. Run `node test.mjs` (must stay green; add a test for what you fixed). Then visual test with the pre-installed Chromium via Playwright (module at
   `/opt/node22/lib/node_modules/playwright`, binary at `/opt/pw-browsers/chromium`
   (symlink to the installed build, e.g. `chromium-1243/chrome-linux64/chrome`) — pass
   `executablePath`; `test.mjs` finds it on its own).
   Seed `localStorage['shifthub_v4']` with a `state` subset (note: shift
   `start`/`end` are **minutes**, e.g. 390 = 06:30). Assert `page.on('pageerror')`
   stayed empty.
5. Commit with a clear message (no model identifiers in commits/code).
6. Commit and push to **`main`** (standing permission — see "Branches and delivery";
   `main` is the single source: the site auto-deploys from it and the mobile app pulls it). On mobile the user runs `npm run tunnel`
   from `mobile/` (= `sync-html.js` + `expo start --tunnel ngrok`; since SDK 58 a bare `--tunnel` is the Expo tunnel, which needs an Expo login) — never
   `expo start` directly, or the sync is skipped and the phone shows the old build.

**Delegation.** See "Model hierarchy" under Working rules. If a cheaper model cannot be
chosen, say so instead of claiming the work was delegated.

**Branches and delivery — standing user permission (2026-09-30).** The user explicitly
and permanently authorizes direct commits and pushes to `main` for completed, verified and
authorized Shift Hub stages; future sessions follow this without asking again. If a
session instruction allows another branch only with explicit user permission, this is that
permission for `main`. Per stage: read this file, `.claude/memory/` and the approved plan →
apply the relevant installed skills → implement only the authorized stage → verify →
`git fetch origin main` and integrate it safely (rebase/merge, no destructive steps) →
commit and push to `main` → update the plan/memory status (implemented / merged / deployed /
user-verified, reported separately) → stop for the user's phone verification before the next
stage. No PR or separate delivery branch unless the user asks or an actual environment
restriction requires it. Never force-push, never reset `main` destructively, never discard
unrelated changes. This permission covers delivery only — not unrequested features or
future stages. If an environment prohibits this workflow with no exception, report the exact
limitation; this rule does not override higher-priority instructions.

Standing rules (user, 2026-10-03):
- The default workflow is direct work, commits and pushes to `main`. The user explicitly
  authorizes `main` wherever session instructions allow it with user permission.
- Do not create or push extra remote branches (session, stage, mirror) merely to mirror `main`.
- An automatically created local session branch (e.g. `claude/<name>`) stays unused while
  working directly on `main` is permitted: commit, then `git push origin HEAD:main`.
- A hook reminder about an unpushed session branch is not, by itself, user authorization to
  publish that branch.
- If a higher-priority instruction prohibits this workflow without an exception, report the
  exact conflict. This file does not override it, and never claim that it does.
- Deleting branches needs specific user authorization of a concrete list, and verification
  first that no unique work (commits not in `main`) and no open PR would be lost.

**Redesign exception (user, 2026-11-20):** the 2026-11 redesign (app code) lives on branch `Work`
until the user approves it; rules, skills and memory still go to `main` as well.

**Acceptance policy — user decision (2026-09-30).** Shift Hub's target is a mobile application.
The user's verification in Expo on their physical iPhone is the decisive acceptance gate for each
stage: once they confirm Expo works, the stage is accepted. Separate Safari/PWA verification is not
required and never blocks progression. Browser (Chromium/Playwright) checks stay as implementation
checks; PWA-specific checks are secondary and non-blocking unless the user asks. Never report an
untested platform or VoiceOver as tested. Production native builds get their own release
verification when that stage arrives. Applies to 1.2, 1.3 (Expo-confirmed) and all later stages.

**Concurrency — important.** More than one Claude session may push to `main` at
the same time. **Always `git fetch origin main` and rebase onto it before
pushing**; if a push is rejected, integrate (reset/rebase onto the newer
`origin/main`, re-apply your change, re-bump the version) — **never
force-push** over someone else's commits.

_Minimal-code rules adapted from [ponytail](https://github.com/DietrichGebert/ponytail) (MIT)._

## Skills (`.claude/skills/`)

The project skills live in `.claude/skills/` — the only copy (the old source repo,
`Saiant03/Skills`, no longer exists). `.claude/skills.lock` lists them and records each
one's upstream (`emilkowalski/skills`, `DietrichGebert/ponytail`, `pbakaus/impeccable`,
`thedotmack/claude-mem`, `vercel-labs/agent-skills`, `anthropics/skills`; impeccable's subagents live in `.claude/agents/`); `bash .claude/skills.sh`
checks that every listed skill is present (run by the SessionStart hook in
`.claude/settings.json`). Update or add a skill only on request: copy it from its upstream,
add its name to `skills=` and note the upstream commit. Scope: this repo only.

- At session start, compare the hook's line with the skills you can actually invoke;
  report missing ones instead of pretending they are available.
- Before each task, pick every skill relevant to its scope and read its SKILL.md
  (and the files it points to) before applying it. Don't invoke unrelated skills.
- This file and Ponytail's minimal-change rules come first; where a skill conflicts
  with them (branches, versions, dependencies, style), this file wins.
- UI work: the applicable design, accessibility, mobile and visual-verification skills.
  Audits: the applicable code-review, debt, UI/UX, accessibility, performance, testing
  and animation skills.
- Skill instructions never authorize unrequested changes, deployments, external
  actions or overriding the user's decisions.
- Report only skills actually applied and verified — reading or installing one is not using it.

## Persistent memory (`.claude/memory/`)

- Session start: after this file, read `.claude/memory/CURRENT_STATE.md` and
  `NEXT_STEPS.md`, plus the active plan if `NEXT_STEPS.md` names one (none now). Read
  `DECISIONS.md` / `ISSUES.md` only when the task needs them; don't read `sessions/` or
  `archive/` (closed plans, their audits, the old stage-by-stage history) by default.
- Update memory only after a milestone (feature done, important bug fixed,
  architectural decision, change of direction, task abandoned, next steps
  changed) or when the context gets crowded — never per message. Commit the
  update with the related change.
- Keep it short and factual: no transcripts, no code, nothing Git or this file
  already says. Edit summaries in place; drop resolved issues; `DECISIONS.md`
  lines are `DATE — DECISION — REASON`; `sessions/` holds rare, compact
  milestone checkpoints only.
- The repository and Git are the source of truth for code; memory never
  overrides them. Memory is public with the site — no secrets.

# Next steps

_Updated 2026-09-30 (after 1.4)_

## Now (frontend audit remediation — plan: `.claude/memory/REMEDIATION_PLAN.md`; status table in CURRENT_STATE.md)
1. User: 1.4 acceptance = Expo on the physical iPhone (`npm run tunnel` from `mobile/`). Still PENDING until the user tests: (a) normal app: Settings shows "Shift Hub 1.4", data untouched, no onboarding; (b) fresh onboarding (needs the isolated route below); (c) VoiceOver on onboarding (heading announced per step, HUB not reachable behind it). A private browser tab is supplementary only.
   Isolated Expo route for (b) — storage facts from `mobile/App.js`: the WebView loads `source={{html, baseUrl:'https://shifthub.local/'}}` with `domStorageEnabled`, so saved data is the localStorage of the origin `https://shifthub.local` in Expo Go's WebView store, shared by every Expo Go project that uses that origin — a copied project is NOT isolated on its own. Route: a second checkout (e.g. `git worktree add ../Shift-Hub-onbtest origin/main`, or a plain folder copy) where ONE line differs — `baseUrl` becomes `https://shifthub-onbtest1.local/` (a different origin gets its own empty localStorage; never commit this line). In that folder: `cd mobile && npm install && npm run tunnel`, scan the new QR (it shows as a separate Expo Go entry; the working project's folder and running server are untouched). Do the onboarding there, but do NOT import a backup or use Delete all data in it. Return: Ctrl+C that server, `npm run tunnel` in the normal folder, open its entry — the origin, so your data, is the same as before. Repeat a fresh run: use `-onbtest2`, no clearing needed. Cleanup: `git worktree remove ../Shift-Hub-onbtest`. Safety: onboarding never shows when saved data exists (`normalize` forces `onboarded`), so if isolation did not work you would just see your own data and nothing to click. Not verified on a device: origin-based separation follows standard WebView behaviour but is only confirmed when the test app really shows the first onboarding step. No code change was made for this.
2. Only after that confirmation: Stage 5 (1.5, build b84) in a new conversation — accessible names for `netinput`, `onbnet`, `bonusname`, `bonusamt`, `chname`, `shname`, `backuptext`; backup file input focusable (`.srbtn`, visible focus ring); `<p class="sec">` → `<h2>`. Handoff from 1.4: onboarding step titles are already `<h1 class="ob-title" tabindex="-1">` and HUB `<h1 class="big" tabindex="-1">` (keep); `#onbnet` still has no label; `.phone h1[tabindex="-1"]:focus-visible{outline:none}` hides the ring on heading targets; `renderOnboard` owns `#screen`/`#tabbar` inert while onboarding (`onbIso`); sheets use `setSheetInert`, dialogs save/restore inert.
- Stop after every stage for the user's phone verification.
- Delivery: each verified stage is pushed directly to `main` (standing permission, CLAUDE.md).
- Open decisions: time-format policy (stage 1.10); optional polish groups G1–G6 (none approved); small 10.5–11.5 px text evaluation pending.
- Facts from 1.0 checks: the SW caches Google Fonts CSS + font file at runtime in the current cache (dropped with the old cache on each release); icon.png is full-bleed but ~4400 light pixels (calendar corners, up to 231 px from centre) fall outside the 204.8 px maskable safe circle — not changed.

## Earlier (UI/a11y audit part 2, v4.66–v4.78 — kept for the pending phone checks)
1. v4.66 text/labels (done, phone-verified).
2. v4.67 Settings/Export cleanup (done, phone-verified).
3. v4.68 touch targets (done, phone-verified). Not changed (outside the audit list, would need layout changes): calendar day cells 37–38 px wide at 320 px, list rows 40–42 px tall (Region/day/quick sheets, full width), weekday chips 45×35, bonus frequency segments 84×35, icon tiles 42×42, Add holiday 63×40.
4. v4.69 contrast (done, phone-verified).
4b. v4.76 readable ink on shift colours + v4.77 TODAY marker (website-verified; Expo not verified).
5. v4.70 zoom + 11 px tab labels: phone-tested, multi-touch paint bug reported; user decided no pinch zoom. v4.71 correction phone-verified.
6. v4.72 native time inputs (phone-verified); v4.73 ± removed from Start/End + cue: website-verified; Expo check pending.
7. v4.74 onboarding: country step before salary (website-verified; Expo not verified).
8. v4.75 day sheet: shift list removed from the full day sheet; long-press quick sheet is the assign path (website-verified; Expo not verified).
9. v4.78 calendar header fit at 320 px, all languages (done; awaiting user website check; Expo not verified).
- Pending Expo/phone checks: v4.73–v4.78. The touch-target exceptions listed under 3 remain; the audit is not fully compliant.

## On hold (user's call)
- Year summary: "Total <year> ›" row under the Income history card opens a sheet with year total, 4-group bar + rows, days/leave/paid H/OT H, monthly average, 12 month bars, ‹ › year switch. Proposed, not approved.

## Not planned (decided — see DECISIONS.md)
- No further `index.html` extractions.
- PWA status-bar style stays as it is.
- Standalone build (EAS/TestFlight) until the user buys an Apple Developer account.
- Sick leave (medical days), worldwide: user marks sick days, pay computed per each country's law (all 34 presets, not only RO). Needs a research pass per country first. Open points: the app is net-based while most laws use gross averages (RO: gross average of last 6 months, rate by duration, employer vs. fund days); some countries have no national rule (US, CA, CH, AE) → mark-only or clearly labelled estimate. Not started.

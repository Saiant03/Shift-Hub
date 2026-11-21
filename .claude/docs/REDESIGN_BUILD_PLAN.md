# Shift Hub redesign — build plan (branch `Work`)

_Approved direction and decisions: 2026-11-20/21 (user). Plan written 2026-11-21. Execution starts in a new conversation, one stage per session, and stops after each stage for the user's verification in Expo on the iPhone._

## Primary goal

The Shift Hub app on the user's iPhone looks and moves like the approved mockups (canvas "Shift Hub redesign", https://claude.ai/artifact/TfH1wL3s8buHiNF82bA3nE — HubV2, Calendar2, Shifts2, Settings2, Onboard2, Modular): monochrome HubV2 look, Hanken Grotesk + the "Shift Modular" dot typeface, a floating island with real Apple Liquid Glass, one shared motion system — while every number, shift and saved setting stays exactly as before.

## Decisions this plan rests on (user, 2026-11-21)

- Colour: **monochrome, exactly the HubV2 tokens** (light page #F2F2EF, card #FFFFFF, text #0A0A0A, secondary #5C5C5C, hairline #E4E4E0, track #EDEDEA; dark page #000, card #141414, text #FFF, secondary #A1A1A1, hairline #262626, track #1F1F1F). Accent colour not decided; no accent until the user picks one (rejected so far: coral #EC625F on greys #313131/#414141/#525252, and orange/blue/amber variants). Shift colours stay user-chosen via the existing colour picker.
- Shift Modular is **drawn from code** (SVG paths from the mockups' dot table), not a font file.
- Settings follow the **Settings2 mockup** (grouped list with search, values visible, the same sub-sheets as the app).
- Island: **native Liquid Glass via `expo-glass-effect`**, proven first by a phone test (stage 0) that checks look, tap, shrink/expand on scroll and a finger glide across the 3 sections. Simulated glass in the page is the fallback and the web/PWA look.
- Stages in order 0–7, each on `Work`, each bumping `APP_VERSION` (2.13, 2.14, …) and build `b<N>` (b106, …); `Work` merges to `main` only when the user approves the whole redesign. This plan and memory updates also go to `main`.
- Cosmetic only: no pay-engine, data-model or backup-format change.

## Phase 0 — Documentation discovery (done 2026-11-21; re-check at the start of each stage)

**How this serves the primary goal:** every later stage copies from these verified facts instead of guessing APIs, so nothing on the phone breaks unexpectedly.

### Allowed APIs (with sources)

- `expo-glass-effect` ~58.0.5 for SDK 58 (expo/expo `sdk-58` `packages/expo/bundledNativeModules.json`); "Included in Expo Go" (https://docs.expo.dev/versions/latest/sdk/glass-effect/). Imports: `GlassView`, `GlassContainer`, `isLiquidGlassAvailable`, `isGlassEffectAPIAvailable`. `GlassView` props: `glassEffectStyle` ('clear' | 'regular' | 'none' | `{style, animate, animationDuration}`), `isInteractive`, `tintColor`, `colorScheme` ('auto'|'light'|'dark'), plus View props. `GlassContainer`: `spacing`. Guard with `isGlassEffectAPIAvailable()` (some iOS 26 betas crash) and respect `AccessibilityInfo.isReduceTransparencyEnabled()`. Never put opacity < 1 on a `GlassView` or its parents (glass stops rendering); fade with `glassEffectStyle: {style, animate: true}` or toggle `'none'`. Copy the examples from https://docs.expo.dev/versions/latest/sdk/glass-effect.md verbatim.
- `react-native-webview` 14.0.1: `ref.injectJavaScript(str)` (already used at `mobile/App.js` `window.shNotif` / `window.shClock`), `injectedJavaScript` (after load; must end with `true;`; needs `onMessage` set on iOS), `injectedJavaScriptBeforeContentLoaded` (already used for `window.SH_NATIVE`), `onMessage` → `event.nativeEvent.data` (string). Source: react-native-webview `docs/Reference.md`.
- React Native: `Animated.spring` (config `toValue`, `stiffness`/`damping`/`mass` or `bounciness`/`speed`, `useNativeDriver` required; width/position cannot use the native driver → use `transform` or JS driver), `PanResponder.create` (`onStartShouldSetPanResponder`, `onPanResponderGrant/Move/Release/Terminate`; `gestureState.dx/moveX/vx`), `Pressable` (`style={({pressed}) => …}`). Sources: reactnative.dev/docs/animated, /panresponder, /pressable.
- Hanken Grotesk: SIL OFL 1.1 (https://github.com/marcologous/hanken-grotesk). Reproducible files: npm `@fontsource-variable/hanken-grotesk`, `files/hanken-grotesk-latin-wght-normal.woff2` and `files/hanken-grotesk-latin-ext-wght-normal.woff2` (family "Hanken Grotesk Variable", weight 100 900 per fontsource; repo README says 300–900 — check the axis in the file). Verify latin-ext's `unicode-range` covers U+0218–U+021B (ș ț) before relying on it.

### Where things live (repo, 2026-11-21, b105)

- `mobile/App.js`: WebView props (`source={{html, baseUrl:'https://shifthub.local/'}}`, `contentInsetAdjustmentBehavior="never"`, `bounces={false}`), `onWebMessage` handles `hap:`, `backup:`, `bar:light|dark`, `notif:` after `ownUrl()`; ref stored in `web`. No SafeAreaView. `mobile/sync-html.js` inlines `<script src="x.js?v=…">` and `url(fonts/x.woff2)` (regexes at its top) into `mobile/htmlSource.js`.
- `index.html`: tabs `TABS` / `renderTabbar()` / `moveTabHi()` / `switchTab(tab)` (state `state.tab`, per-tab scroll `tabScroll`); page scroller `#screen`, sheet scroller `#sheet`; `.tabbar` CSS (backdrop-filter overridden to none — must stay none, test "perf: no backdrop blur on the tab bar"); tokens on `.phone` (`--bg … --sh-sm`, radii `--r-card/--r-tile/--r-pill`, motion `--e-spring`, `--e-out`; durations are literals), dark overrides `.phone[data-appearance="dark"]` and the `prefers-color-scheme` block for `auto`; `applyAppearance` posts `bar:`; `postNative()`; CSP meta on line 2 (`font-src 'self' data:`); `@font-face` Plus Jakarta Sans lines 6–7; `APP_VERSION`; local scripts `?v=b105`.
- `sw.js`: cache `shifthub-b105`, precache list incl. `fonts/PlusJakartaSans-*.woff2`.
- `test.mjs`: `ONLY=<substring>`; build-sync assertions inside "webview: synced payload is self-contained…"; font tests "font: Plus Jakarta Sans is self-hosted…" and "mobile: sync-html inlines the fonts as data URIs"; CSP test; tab tests (destination visible from first frame, per-tab scroll, buttons reused, labels ≥11px, iOS safe area, status-bar theme).
- `.claude/docs/ARCHITECTURE.md` says `switchTab` is instant with no entrance animation ("do not add a fade-in") — stage 3 must decide this with the user against the mockups' tab transition before changing it.
- Mockup sources: read with the Artifact `read` action (`project/<Name>.dc.html`); shared rules in `.claude/docs/REDESIGN_MOCKUP_SPEC.md` (dot table + `dotLayout/dotWidth/dotPath/dotBox`, `.glass`, depth, motion tokens).

### Anti-patterns (all stages)

- No `backdrop-filter` on the tab bar/island, sheet or dialog dims or any large/animated layer; no per-frame global `pointermove`.
- No new dependencies in the web app; in `mobile/` only `expo-glass-effect` (via `npx expo install`).
- No invented `GlassView` props, no opacity animation on glass, no width animation with `useNativeDriver: true`.
- Never edit `mobile/htmlSource.js` by hand; never run `expo start` without the sync (`npm run tunnel`).
- No engine/data/backup changes; no new user-facing text without `tr()` keys in all six languages.
- Subagents never touch git; Opus reviews every diff (`ponytail-review`) and runs `node test.mjs` before committing.

## Stage 0 — Native glass island test (mobile only)

_Status 2026-11-21: native glass works in Expo on the iPhone (user); island widened to 320px, black pill replaced by a coloured icon over a faint pill, awaiting re-check. User choices: SF Symbols via `expo-symbols` (second mobile dependency, approved), glass style 'clear', island hidden under sheets/dialogs/onboarding, labels in the app language._

**How this serves the primary goal:** proves on the real phone, before any redesign work, that the island can be real Liquid Glass — or settles early that it stays simulated.

What to implement (`mobile/` only; `index.html` untouched):
1. `npx expo install expo-glass-effect` in `mobile/` (commit `package.json` + `package-lock.json`).
2. In `App.js`, when `isGlassEffectAPIAvailable()`: an absolutely positioned island at the bottom (4px above the home indicator, like HubV2) made of `GlassContainer` + `GlassView` with 3 `Pressable` sections (HUB / Calendar / Ture, icons as in HubV2). Copy the GlassView/GlassContainer examples from the Expo docs page.
3. Tap → `web.injectJavaScript("switchTab('calendar');true;")` (ids `hub|calendar|shifts`); hide the web tab bar only in this case via `injectedJavaScript` adding a style `#tabbar{display:none}` — so without glass support the app is unchanged.
4. Scroll → injected script (after load) adds a passive `scroll` listener on `#screen`, rAF-throttled, posting `scr:<y>`, and posts `tab:<id>` when `state.tab` differs from the last value it sent (read `state.tab` in the listener and on a click handler added with `addEventListener`; no page function is wrapped or changed). Native handles `scr:`/`tab:` in `onWebMessage` (after `ownUrl`). Down-scroll past ~24px → island shrinks to a centred 64×52 pill showing the active icon; up-scroll or tap → expands. Animate with `Animated.spring` on `transform: scaleX` / translate (native driver) or JS-driver width — no opacity on glass.
5. Glide: `PanResponder` on the island; finger drag tracks a highlight 1:1 across the 3 sections; release selects that section; `hap:`-equivalent light haptic on section change (`Haptics.selectionAsync` or existing impact).
6. Reduce Transparency on → fall back to the web tab bar (no native island).

Verification: Expo Go on the iPhone (user): glass looks right over HUB and Calendar in light and dark; tap switches; shrink/expand on scroll; glide selects; nothing else changed (backup, haptics, reminders, status bar). Repo: `node test.mjs` green (App.js static tests). Bump `APP_VERSION`/`b<N>` only if a web file changed (it should not).
Outcome recorded in memory: native glass yes/no, any limits found. If no → revert stage 0 and stage 3 uses simulated glass.

## Stage 1 — Tokens, fonts, motion base

_Status 2026-11-21: stage 0 accepted in Expo (native glass works). Stage 1 implemented on `Work` (2.13, b106), awaiting the user's Expo test. User choices: draw the missing accented letters for the other languages; keep red/gold status colours; switch card shadows now._

**How this serves the primary goal:** every later screen draws from one set of HubV2 colours, fonts and motion values, so the screens match each other and the mockups.

What to implement:
1. Fonts: add `fonts/HankenGrotesk-latin.woff2` and `-latin-ext.woff2` (from the fontsource package files above) + its OFL text; `@font-face` lines as for Plus Jakarta (same `unicode-range` pattern, `font-display: swap`); `.phone` font-family → 'Hanken Grotesk'; numbers `font-weight:700; font-variant-numeric: tabular-nums`. Remove Plus Jakarta files and rules. Update `sw.js` precache, the two font tests and nothing else in the CSP (still `font-src 'self' data:`).
2. Colours: replace the light/dark values of the existing `.phone` tokens with the HubV2 values (keep token names; map `--bg`, `--card`, `--text`, `--text2`, `--divider`, `--fill` etc.). `--accent*` tokens become neutral (text colour) until an accent is chosen.
3. Motion tokens on `.phone`: `--d1 160ms --d2 240ms --d3 360ms --d4 520ms`, `--e-out cubic-bezier(.22,1,.36,1)`, `--e-ios cubic-bezier(.32,.72,0,1)`, `--e-pop cubic-bezier(.34,1.56,.64,1)` (copy from REDESIGN_MOCKUP_SPEC.md); keep `--e-spring` as an alias until no rule uses it; reduced-motion block per spec.
4. `dots.js` (new classic script, loaded before the main script, `?v=b<N>`, precached, inlined by sync-html): copy `dotTable`'s `var T` and `dotLayout/dotWidth/dotPath/dotBox` VERBATIM from HubV2.dc.html, plus one function returning `<svg role="img" aria-label="…">` markup. Not used by any screen yet except one smoke use behind nothing (or none) — screens adopt it in their stages. Extend the webview payload test to require it inlined.

Verification: tests green (font, CSP, build sync, webview payload); Playwright screenshots light/dark at 390 and 320 show Hanken everywhere and HubV2 greys; Romanian diacritics render in Hanken (ș ț ă â î); user checks in Expo.

## Stage 2 — HUB

**How this serves the primary goal:** the screen the user opens most becomes the approved HubV2 layout.

Copy from HubV2.dc.html (structure, CSS, motion) into `hub.js` + CSS: near-black hero panel with the big net amount in Shift Modular (decimals dimmed, count-up), "Săptămâna asta" strip, 3D next-shifts stack, collapsible "Detalii de plată" (closed: 4 tiles; open: composition bar, 4 rows, total), 6-month chart last, entrance stagger, press springs. All figures from the existing engine (`monthTotals`, `payGroups`/`payComp`); shift colours from the user's shifts. New strings via `tr()` in six languages (Haiku translates, Opus checks).
Verification: existing HUB tests updated only where layout changed, new tests for the collapsible card and the week strip; pay figures identical to before for the same seed; screenshots vs mockup; user checks in Expo.

## Stage 3 — Island

**How this serves the primary goal:** the bottom navigation becomes the floating island of the mockups — real glass on the phone if stage 0 passed.

If stage 0 passed: promote the stage-0 island to final (icons and labels from HubV2, live icons, theme-aware `colorScheme`, accessibility labels/roles via `accessibilityRole="tab"` and `accessibilityState`). If not: restyle `.tabbar` in the page as the simulated `.glass` island from the spec (no backdrop-filter), shrinking to a pill on `#screen` scroll. Decide with the user the tab transition (ARCHITECTURE.md currently forbids an entrance fade on `switchTab`).
Verification: tab tests green or deliberately updated; status-bar and safe-area tests green; user checks in Expo.

## Stage 4 — Calendar

**How this serves the primary goal:** the calendar matches Calendar2 while keeping every existing gesture and menu.

Copy Calendar2.dc.html styling and motion into `calendar.js` + CSS; keep the current interactions (day sheet, long-press quick assign, Edit mode painting, repeat week 1/2/4, swipe months, selection ring). Dot-font title.
Verification: all calendar/gesture tests green (real CDP touch); screenshots vs mockup; user checks in Expo.

## Stage 5 — Shifts (Ture)

**How this serves the primary goal:** the shift list and editor match Shifts2 with the same swipe-to-delete, reorder and wheel time pickers.

Copy Shifts2.dc.html styling and motion into the shifts screen and `sheetShift` (`sheets.js`); colour picker unchanged in function.
Verification: reorder/swipe/editor tests green; user checks in Expo.

## Stage 6 — Settings

**How this serves the primary goal:** Settings becomes the Settings2 layout — grouped list with search and visible values — with the existing sub-sheets restyled.

Copy Settings2.dc.html into `sheetSettings` and restyle `sheetSalary`, `sheetBonuses`, `sheetRegion`, `sheetBackup` (`settings.js`, `sheets.js`) without removing any control; search filters rows by localized label (reuse `coFold`); new strings in six languages.
Verification: settings/region/backup tests green, new test for search; user checks in Expo.

## Stage 7 — Onboarding

**How this serves the primary goal:** first launch matches Onboard2 and teaches the app with the real gestures.

Copy Onboard2.dc.html (the 7 steps as in the app) styling and motion into the onboarding code in `index.html`.
Verification: onboarding tests green (incl. inert/VoiceOver-related ones); user checks a fresh install in Expo.

## Final phase — Verification before merging `Work` into `main`

**How this serves the primary goal:** confirms the whole redesign is consistent and safe before it replaces the live app.

- Grep: no `backdrop-filter` except overridden-to-none rules; no `Plus Jakarta`; no hard-coded hex outside tokens in new CSS; every new string has six translations.
- `node test.mjs` full suite green; build-sync test green.
- Playwright pass over all screens, light/dark, 320 and 430 widths, `pageerror` empty.
- `ponytail-review` of the whole `Work` diff vs `main`; motion check (`review-animations`).
- User accepts in Expo on the iPhone → merge `Work` into `main` (no force-push), update memory.

## Not now

Accent colour · sick leave · native Swift app · Android verification · PWA-specific polish.

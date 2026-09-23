# 2026-09-23 — index.html decomposition (v4.13 → v4.21)

- 8 stages, one commit + phone check each: i18n → countries → holidays → engine
  → hub → calendar → settings → sheets. `index.html` 2175 → 1317 lines.
- Each stage added one WebView assertion group; gaps closed on the way:
  custom holidays / `daysInMon`, `nfmt` + cross-file `_nfLoc`, income-history
  tap, repeat-week (was untested), `sheetExport` (was untested).
- Final audit: no duplicates, no broken references, versions/precache
  consistent → decomposition complete; CLAUDE.md synced afterwards.

# Plan: finisaje rămase — Etapa 2.9 (b100)

## Context
Planul 2.5–2.8 e închis. Au rămas finisajele neselectate (`NEXT_STEPS.md` → Deferred). Alegerile tale (2026-11-11):
- **Durate:** mai scurte. În plus, ai semnalat un bug vizual: când ziua selectată e chiar ziua de azi, inelul de selecție se suprapune cu inelul zilei de azi.
- **Onboarding** (animația pașilor, aurora): rămâne cum e.
- **Reduce Motion:** vibrațiile rămân pornite; fără fade-uri noi.
- **Culori:** fundalul nativ din Expo urmează tema. `theme-color`/manifest rămân cum sunt.
- `color-scheme` e deja făcut (`applyAppearance`, `index.html:794-798`), deci nu intră.

Toate sunt mici, deci intră într-o singură etapă: 2.9 (b100), cu o singură verificare în Expo.

## Bug confirmat (captură Chromium, 390px, light și dark)
Când e selectată ziua de azi, celula are două desene care se adună:
- inelul de selecție `.calsel` (`index.html:223`, `:411`), animat de `placeSelRing` (`index.html:711-727`);
- inelul interior al zilei de azi, `.screen.cal .cell.today .circ::after` (`index.html:408-409`), cu conturul închis `--on` pe zilele cu tură.

Rezultă 3–4 linii concentrice. Când selectezi altă zi, totul arată corect.

## Modificări
1. **Bug inel** (CSS, `index.html:408`): regula inelului zilei de azi devine `.screen.cal .cell.today:not(.sel) .circ::after` (cauza: îl suprascria pe `.screen.cal .cell.sel .circ::after{display:none}` de la linia 219). Implementat așa după review, în locul unei reguli noi.
   - Cât timp ziua de azi e selectată, se vede doar inelul de selecție. Ziua de azi rămâne recognoscibilă după cifra îngroșată și fundalul accent (zilele fără tură).
   - `.sel` se mută deja prin `selectDay` (`index.html:729-738`), deci nu e nevoie de JS.
2. **Inel mai scurt** (`placeSelRing`, `index.html:724`):
   - `duration:360` → `240`;
   - curba devine una cu depășire mai mică (`cubic-bezier(.3,1.15,.4,1)`), scrisă direct în apel.
   - `--e-spring` nu se schimbă, pentru că îl folosește și `valpop` (`index.html:210`).
3. **Pastila tab-ului** (`.tabhi` și `.tabbtn`, `index.html:120-123`): `.34s` → `.26s`, cu aceeași curbă pentru pastilă și etichetă, ca să rămână sincronizate.
4. **Vibrații cu Reduce Motion** (`hap`, `index.html:890`): scot `if(reduce)return;`.
   - Reduce Motion oprește doar mișcarea.
   - `navigator.vibrate` și puntea `hap:` rămân neschimbate.
5. **Fundal nativ după temă** (`mobile/App.js`):
   - `container` și `web` primesc fundalul din `barTheme`: `light` → `#F5F4F1` (`--bg` light, `index.html:298`), `dark` → `#0F0F13`.
   - Valoarea inițială vine din `Appearance.getColorScheme()` (react-native), nu e fixată pe `'dark'`. Așa tema Auto pornește deja corect, iar mesajul `bar:` corectează restul.
   - `app.json` (fundalul de lansare dinainte de JS) rămâne `#0F0F13`.
6. **Versiune:**
   - `APP_VERSION` 2.9;
   - `?v=b100` pe toate scripturile locale;
   - `shifthub-b100` în `sw.js` și în lista de precache.

## Teste noi în `test.mjs` (roșii pe codul vechi)
- `ring27`-style, prefix `polish29:`:
  - azi selectat → `::after` al zilei de azi are `display:none`;
  - altă zi selectată → inelul zilei de azi e vizibil;
  - 320 și 390px, light și dark.
- Inelul animat are durata 240 (din `getAnimations()[0].effect.getTiming()`).
- `transition-duration` pe `.tabhi` și `.tabbtn` este `0.26s`.
- Cu `rm:true` și `native:true`, un tap pe o zi trimite `hap:light` (`window.__msgs`). Tot sub Reduce Motion, inelul nu se animă (testele `reduce live:` existente rămân verzi).
- `App.js` nu se poate testa în `test.mjs`: îl verifici pe telefon.

## Fișiere
`index.html`, `sw.js`, `test.mjs`, `mobile/App.js`, apoi memoria (`CURRENT_STATE`, `NEXT_STEPS`, `DECISIONS`). Planul se salvează în `.claude/memory/PLAN.md` ca plan activ.

## Skill-uri
- ponytail: diff minim.
- emil-design-eng / animate: durate și curbe.
- mobile-native: haptică, fundal nativ.
- ponytail-review: review independent cu Sonnet.

## Delegare
- Implementarea și testele: subagent Sonnet, fără git.
- Review independent: al doilea subagent Sonnet.
- Eu verific diff-ul, capturile și suita completă, apoi fac push direct pe `main`.

## Verificare
1. `node test.mjs` complet verde; testele noi au fost roșii înainte de modificare.
2. Capturi Playwright: azi selectat / altă zi selectată, 320 și 390px, light și dark, 7 limbi, fără `pageerror`.
3. `node mobile/sync-html.js`: payload-ul conține 2.9.
4. `git fetch` + rebase, push pe `main`, memoria actualizată, stop pentru Expo.

## Expo (ce verifici tu)
- În Setări scrie „Shift Hub 2.9”.
- **Calendar:** atingi ziua de azi și vezi un singur inel curat. Atingi alte zile: inelul sare mai repede, cu bounce mai mic.
- **Tab-uri:** pastila se mută mai repede.
- **Reduce Motion pornit** (Setări iPhone → Accesibilitate → Mișcare): atingerea unei zile vibrează în continuare și nu animă nimic.
- **Tema aplicației Light** (cu iPhone-ul pe Dark și invers): la pornire și la marginile ecranului nu mai apare negru în tema deschisă. Doar prima clipă a lansării poate rămâne închisă.

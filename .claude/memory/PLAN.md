# Plan: lucrurile amânate (fără Swift)

## Context
Aplicația e la 2.4 (b95), 306/306 teste, verificată în Expo. În `NEXT_STEPS.md` au rămas lucruri amânate. Deciziile tale (2026-11-11):
- **Ordinea:** întâi detaliile UI, apoi țintele de atingere, apoi rezumatul anual.
- **Detalii UI:**
  - dispar săgețile de pe cardul cu suma din HUB;
  - apăsări mai calme;
  - semnal la apăsare lungă;
  - HUB gol mai curat;
  - backup fără cod vizibil;
  - căutare de țară;
  - plus alte îmbunătățiri pe care le găsesc eu (am găsit una: întoarcerea rapidă la luna curentă în HUB).
- **Ținte de atingere:** repar ce se poate.
- **Rezumat anual:** da.
- **Rămân amânate:** concediul medical, Swift și finisajele pe care nu le-ai ales (durate inel/tab, onboarding, vibrații cu Reduce Motion, `theme-color`, fundal nativ).

Fiecare etapă e o versiune separată. Fluxul pentru fiecare:
1. Teste noi (roșii pe codul vechi), apoi `node test.mjs` verde.
2. Verificare vizuală în Chromium: 320 și 390px, light și dark, 7 limbi, fără `pageerror`.
3. Bump de versiune: `APP_VERSION`, `?v=b<N>`, `shifthub-b<N>`.
4. Push pe `main` și actualizarea memoriei.
5. Stop pentru verificarea ta în Expo.

Delegare (vezi Etapa 0): implementarea o face un subagent Sonnet, explorarea un subagent Haiku. Eu verific diff-ul, testele și comportamentul înainte de livrare.

## Etapa 0 — doar documentație (fără versiune)
- **`CLAUDE.md` → Delegation:** agenții care doar citesc sau explorează rulează pe `model: "haiku"`. Implementarea rulează pe un model mai ieftin decât sesiunea (Sonnet), iar modelul se alege explicit la fiecare pornire. Motiv: cererea ta; până acum agenții moșteneau Opus.
- **`NEXT_STEPS.md`:** planul de mai jos devine planul activ. Fac și două mutări:
  - Mut în „Închise fără lucru (doar dacă apare o problemă)”:
    - candidații de curățenie păstrați în 2.3;
    - urmările pentru reordonare și swipe.
  - Notez finisajele nealese ca neselectate pe 2026-11-11, iar concediul medical ca amânat.
- **`DECISIONS.md`:** săgețile din HUB se scot, la cererea ta. Asta inversează decizia de la 1.6.

## Etapa 2.5 (b96) — detalii UI, partea A (HUB și atingeri)
1. **Săgețile din HUB dispar vizual** (`hub.js:79-81`).
   - Butoanele `prevMonth`/`nextMonth` rămân, dar primesc clasa existentă `.srbtn` (`index.html:243`, screen-reader only, același model ca Move up/down). Așa VoiceOver și tastatura pot schimba în continuare luna.
   - Luna se schimbă vizual prin swipe pe card, care există deja.
   - Eticheta „Salariu net estimat pentru noiembrie 2026” încape acum pe un rând.
   - Teste: rescriu cele 10 teste `hub arrows:` (`test.mjs:3174-3259`).
     - Se păstrează: nume accesibile, Enter/Space, granița decembrie–ianuarie, Reduce Motion, fără overflow.
     - Se înlocuiesc testele de zonă vizibilă de 44px cu: butoanele nu se văd și nu ocupă loc, iar o atingere pe card nu schimbă luna.
2. **Întoarcere la luna curentă în HUB** (găsit de mine).
   - Doar când HUB-ul arată altă lună: un buton mic „Today”, în stilul `.editbtn`, cu același comportament ca în Calendar.
   - Refolosesc logica din `case 'today'` (`index.html:1323`) sau `changeMonth` până la luna curentă, cu numărarea sumei existentă.
   - Fără text nou: cheia `Today` există deja.
3. **HUB gol:** cardul „Detaliu plată” nu se afișează când `t.grand===0` (`screenHub`, `hub.js`). Rămâne cardul care trimite în Calendar.
4. **Apăsări mai calme** (`index.html`):
   - `.swipe .del`: intră din `scale(.9)` cu opacitate, ~200ms ease-out, nu din `.6` cu curbă 1.56 (linia 237).
   - Stepper `:active`: `.95`, nu `.88` (liniile 155 și 199).
   - `valpop`: pornește de la `.9`, nu `.6` (linia 205).
5. **Semnal la apăsare lungă** (gestul `lp`, `index.html:1083-1091`):
   - Clasa `.lpress` se pune pe celulă la `pointerdown`. Se scoate la declanșare, la mișcare peste 10px, la al doilea deget, la `pointerup` și în listener-ul comun `pointercancel`.
   - CSS: celula se micșorează ușor (~.94) pe durata ținerii, cu tranziție ease-out. Doar transform, deci nu interferează cu `.sel` (1.06), `tilePop` sau pictarea, care e oricum doar în Edit.
   - Sub Reduce Motion nu se micșorează nimic.
   - Teste prin atingeri CDP reale: clasa apare și dispare corect în toate cazurile, foaia rapidă se deschide tot la 450ms, tap-ul normal și pictarea rămân neschimbate.
- **Skill-uri:** ponytail, emil-design-eng/animate și gestures (punctele 4–5), web-design-guidelines (punctul 1). `/review-animations` îl rulezi tu, dacă vrei, pentru că se invocă doar de utilizator.
- **Expo:** HUB fără săgeți; swipe între luni; butonul Today; HUB fără date; swipe-delete; +/− rapid; apăsare lungă pe o zi.

## Etapa 2.6 (b97) — detalii UI, partea B (Backup și țări)
1. **Backup fără cod vizibil** (`sheetBackup`, `sheets.js`):
   - Textul JSON ajunge într-un `<details>` nativ, cu `<summary>` „Arată datele” (cheie nouă în 6 limbi).
   - Download, Copiază și restaurarea nu se schimbă.
   - Testele de backup existente rămân verzi.
2. **Căutare țară** (Regiune `settings.js:112-118` și onboarding `index.html:812`):
   - Câmp `type=search` deasupra listei, cu font de cel puțin 16px, ca iOS să nu facă zoom (regula mobile-native).
   - Filtrează după numele localizat (`countryName`) și după cod, fără diacritice (`normalize('NFD')`).
   - Starea căutării e temporară, nu se salvează (nu intră în `SK`).
   - `renderSheetUpdate` păstrează deja focusul și cursorul după `id`.
   - Mesaj când nu găsește nimic (cheie nouă). Ordinea `countryOrder` se păstrează.
   - Teste: filtrare în 7 limbi („rom”, „ger”, „Österreich”…), fără diacritice, focusul rămâne, alegerea țării merge ca înainte, onboarding-ul nu poate continua fără țară.
- **Skill-uri:** mobile-native, web-design-guidelines, break-ui (doar ca test cu date extreme; nu adaug comutatorul lui în aplicație).
- **Expo:** Backup („Arată datele”, Download, Copiază, restaurare); Regiune și onboarding cu căutare, inclusiv tastatura.

## Etapa 2.7 (b98) — ținte de atingere
- `.optrow` (`index.html:150`) primește `min-height:44px`. Asta acoperă rândurile din Regiune și din foaia rapidă.
- „Add holiday” (`settings.js:146`) primește `min-height:44px`.
- Pictogramele din editorul de tură `.icb` (`index.html:171`) trec de la 42 la 44px. Rândul face deja wrap.
- Butoanele de weekend din Regiune (`settings.js:120`) primesc `min-height:44px` direct. Nu folosesc `::before`, pentru că `.brushbar` taie conținutul cu `overflow`.
- Excepție documentată: celulele calendarului (~37px la 320px). 7 coloane nu încap mai late.
- Teste: dimensiuni de cel puțin 44px la 320 și 390px (ca la `t9zone`, cu `elementFromPoint`), fără overflow, 7 limbi.

## Etapa 2.8 (b99) — rezumat anual
- **Motor** (`engine.js`): `yearTotals(y)` adună cele 12 `monthTotals(y,m)` câmp cu câmp, folosind cache-ul existent.
  - `payGroups(t)` e extras din `hub.js:48-51`: base, overtime, premiums, extra, cu culorile existente.
  - Îl folosesc și HUB-ul, și foaia, deci nu există cod dublat.
- **Intrare:** rândul „Total <an> ›” în cardul Istoric venituri (`histCard`, `hub.js:34`). Acțiunea `openYear` setează `state.yearY` (temporar, nu în `SK`) și `state.sheet='year'`, apoi `renderSheet()`.
- **Foaia** `sheetYear()` (`sheets.js`, rutare în `sheetHTML`, `index.html:724`):
  - antet cu Close (modelul `sheetExport`) și ‹ an › (`navbtn`, acțiuni `yrPrev`/`yrNext`, `renderSheetUpdate` fără slide, an între 2000 și 2100);
  - totalul anului;
  - bara pe 4 grupe și rândurile ei (`compbar`/`sumrow`);
  - zile lucrate, concediu, ore plătite, ore suplimentare;
  - media lunară, calculată pe lunile cu date;
  - 12 bare lunare (markup-ul `.histchart`, cu `aria-label` pentru fiecare lună).
- **i18n:** refolosesc `Total`, `Year`, `Previous year`/`Next year`, `Base pay`, `Paid hours`, `Overtime hours`, `{n} work days`, `{n} leave`. Chei noi în 6 limbi: „Total {y}”, „Monthly average”.
- **Teste:**
  - `yearTotals` este egal cu suma pe luni (un bonus anual se numără o singură dată);
  - foaia se deschide la tap pe rând;
  - comutarea anului actualizează cifrele;
  - sumele se potrivesc cu `fmtN`;
  - 320 și 390px, 7 limbi, sume mari (break-ui).
- **Expo:** tap pe „Total 2026”, ‹ ›, cifrele față de HUB.

## Verificare (la fiecare etapă)
1. `node test.mjs`: tot verde, iar testele noi au fost roșii înainte de modificare.
2. Playwright cu `/opt/pw-browsers/chromium`: capturi 320/390, light/dark, 7 limbi, `pageerror` gol.
3. Versiunile sincronizate (testul existent verifică asta). Test `webview:` pentru payload-ul mobile.
4. `git fetch` și rebase, push pe `main`, memoria actualizată (implementat, livrat, apoi verificat de tine).
5. Stop: tu verifici în Expo (`git pull`, `npm run tunnel`), apoi trecem la etapa următoare.

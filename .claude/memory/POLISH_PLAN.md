<!-- UPDATE 2026-10-04 (later): Stage 2.0 user-verified in Expo (theme selectors, small text, general checks) except reminder delivery/duplicates (still pending). Stage 2.1 authorized ONLY for: explicit transition lists on .toggle/.toast/.brush + .sheet.hide on cubic-bezier(.32,.72,0,1), duration unchanged; implemented as 2.1/b91; /review-animations run (user-invoked): Approve; pushed to main; awaiting the user's Expo acceptance. G2, ring/pill durations, 2.2 and C: not approved, not started. -->
<!-- UPDATE 2026-10-04: Stage 2.0 (3 items) approved by the user, implemented as 2.0/b90, pushed; Expo verification pending. 2.1/2.2/C not started and not approved. -->
<!-- REVISED PLAN (2026-10-04, Europe/Bucharest). PROPOSAL ONLY: not an approval for 2.0, 2.1 or 2.2; versions provisional; cleanup C stays last. Companion to POLISH_PROPOSAL.md. -->

# Plan revizuit: finisaje după 1.10 (etapele 2.0, 2.1, 2.2)

Doar plan. Nu e aprobare de implementare pentru 2.0, 2.1 sau 2.2. Nu se schimbă cod de aplicație și nu se bumpează versiuni la această revizuire. 2.0 e prima etapă propusă; 2.1 și 2.2 rămân condiționate; curățenia C rămâne ultima.

## Ce s-a schimbat față de planul anterior
1. `colorScheme` e un candidat, nu o dovadă pentru selectorul nativ de oră/tastatură din Expo. Separ comportamentul calculat în browser de cel nativ real și definesc verificări manuale (Light+Dark, Dark+Light, Auto).
2. Am urmărit tot drumul memento-urilor. Concluzie: `timeStr→clockStr` singur nu ajunge; trebuie și o sincronizare la schimbarea 12/24 h (o linie în `shClock`). Testul 24→12→24 e specificat mai jos.
3. „`mobile/` neatins” e înlocuit cu regula: calea existentă cea mai mică; modificare de wrapper doar cu motiv concret, în scopul aprobat; modificări native mai largi sau dependențe noi = decizie separată.
4. Textul mic: lizibilitatea și un aspect utilizabil contează mai mult decât înălțimea identică a cardului; se permite cel mai mic ajustaj justificat.
5. Baze de test: 2.0 față de 1.10, 2.1 față de 2.0 acceptat, 2.2 față de 2.1 acceptat. Teste roșu→verde doar pentru schimbări reale de comportament, nu pentru ajustări cosmetice. Suita completă pe arborele final.
6. Duratele inelului și pastilei rămân neschimbate fără aprobare explicită; pragurile de viteză sunt candidate de validat; feedbackul la apăsare lungă se alege separat.
7. Data acceptării `expo-localization` se corectează la 2026-10-04 (Europe/Bucharest) în `DECISIONS.md` (linia „Deviation: `expo-localization`…”, încă înregistrată 2026-10-03).

## Procedură permanentă (fluxul din CLAUDE.md)
1. Citesc CLAUDE.md, memoria (`CURRENT_STATE`, `NEXT_STEPS`, `POLISH_PROPOSAL`) și reconfirm ce e aprobat pentru etapă.
2. Delegare: coordonatorul (acest model) deține scopul, revizuirea și corectitudinea; un subagent pe model mai ieftin (Haiku) implementează editările și testele după un brief limitat cu criterii de acceptare, fără git (nu face commit/push). Coordonatorul verifică diff-ul, rescrie testele slabe, rulează testele și livrează. Dacă nu se poate alege un model mai ieftin, spun asta în raport.
3. Verificare: teste noi `polish<N>:`; `ONLY=polish node test.mjs` în iterare; `node test.mjs` complet (~15 min) pe arborele final, văzut terminat și verde, înainte de livrare. Gesturile: atingeri CDP reale. Teste dependente de dată: ceas fix (`s8open`).
4. Verificare vizuală Playwright + Chromium la 320/390 px, light/dark, `pageerror` gol.
5. Versiuni în sincron: `APP_VERSION` (index.html), `?v=b<N>` pe toate cele 8 `<script src>`, `shifthub-b<N>` + precache în `sw.js`; N = anterior + 1 (b90, b91, b92). Testul de sincron există.
6. i18n: nu se așteaptă texte noi; dacă apare unul, în toate cele 6 limbi.
7. Skill-uri aplicate și raportate onest: ponytail, emil-design-eng / apple-design (curbe, viteză), mobile-native (`color-scheme`), web-design-guidelines, playwright-cli, code-review (built-in), ponytail-review pe diff. `review-animations` doar invocat de tine (`/review-animations` pe diff-ul 2.1/2.2); nu îl ocolesc.
8. Livrare: `git fetch origin main`, rebase, commit (fără identificatori de model; doar linia `Claude-Session:`), `git push origin HEAD:main`; fără branch-uri extra, fără PR, fără force-push. Actualizez memoria (implementat / merged / deployed / verificat de tine, separate). Mă opresc pentru verificarea ta în Expo.

## Etapa 2.0 (b90, propusă prima) — integrare cu telefonul și text mic
Se implementează doar punctele aprobate; fiecare se poate scoate independent. Comparație față de 1.10.

### A. `color-scheme` (G6)
Candidat: în `applyAppearance` (index.html ~841) `document.documentElement.style.colorScheme=t` cu tema rezolvată `t`; pentru Auto, candidat alternativ `'light dark'` ca iOS să decidă singur (de ales după verificare). Fără `theme-color`, fără manifest.
Trebuie separate două lucruri:
- Browser (Chromium, automat): valoarea calculată `getComputedStyle(documentElement).colorScheme` pentru Light, Dark, Auto și la schimbarea live a sistemului (`emulateMedia`). Dovedește doar că CSS-ul e setat.
- Nativ pe iPhone (manual, singura dovadă): nu pot și nu pretind că verific selectorul nativ de oră sau tastatura din Chromium.
Verificări manuale în Expo, fiecare cu rezultat pe suprafață (urmează aplicația / urmează telefonul / neclar): selectorul de oră din editorul de tură, tastatura (câmpul de nume al turei; tastatura numerică la salariu), meniul de selecție/copiere, textarea de la Backup; cazuri: aplicație Light + telefon Dark, aplicație Dark + telefon Light, Auto cu schimbarea temei telefonului în timp ce aplicația e deschisă.
Dacă o suprafață nu e afectată de candidat: raportez limitarea, nu declar succes și nu extind scopul. Soluția de rezervă (necesită decizie separată, nu e în plan): `Appearance.setColorScheme` din React Native prin mesajul `bar:` existent, cu `null` pentru Auto, ar schimba și `prefers-color-scheme` din WebView, deci cere analiză separată.

### B. Text memento — drumul complet (inspectat)
Fluxul actual: `syncReminders` (index.html 919) construiește lista (`at` din minute; corp `tr('Starts at {t}',{t:timeStr(...)})`), compară semnătura JSON cu `remSig` (în memorie, `null` la pornire) și trimite `notif:{items}` doar dacă s-a schimbat; `App.js` `replaceSchedule` face `cancelAllScheduledNotificationsAsync()` apoi `scheduleNotificationAsync` pentru fiecare element (max 30, doar `at > now`, identificatori generați de Expo, nu stabili), serializat prin coada `run`.
Constatări:
- Semnătura include corpul, deci o schimbare de text NU e suprimată de deduplicare.
- Actualizarea înlocuiește tot setul (anulează tot și reprogramează): număr, momente (`at`) și titluri rămân identice; identificatorii se schimbă oricum la fiecare replasare (comportament existent); nu există duplicate, pentru că anularea precede programarea și coada serializează.
- Declanșarea la schimbarea orei 12/24 h: `App.js` la `AppState active` apelează `sendStatus(false)` (→ `shNotif` → `syncReminders`, asincron) și injectează `shClock(v)`. `shClock` (index.html 928) nu apelează `syncReminders`, deci se bazează pe ordinea celor două apeluri (negarantată). Modificarea necesară, în index.html, fără wrapper: `shClock` apelează `syncReminders()` după ce actualizează `clock24`. Dedublarea prin semnătură previne retrimiterea inutilă.
- Limite acceptate și documentate: textul se reface doar când aplicația revine în prim-plan (JS nu rulează în fundal); dacă schimbi setarea și nu deschizi aplicația, notificările deja programate păstrează textul vechi; la pornire la rece `remSig` e `null`, deci prima sincronizare retrimite lista (acoperă și cazul aplicației închise). Elementele cu `at` trecut în timpul înlocuirii sunt omise (ca astăzi).
- Politica rămâne: lead 60 min, orizont 31 zile, max 30, permisiuni, `timeStr` pentru input/CSV, calcule de plată neatinse. Wrapperul `App.js` nu se modifică în 2.0 (calea existentă ajunge). Dacă testele sau Expo arată altceva, explic nevoia concretă înainte de a-l atinge.
Test nou, comparație 24→12→24 (harness `native:true`, opțiunea `h24`): pornește pe 24 h, `shNotif({granted:true})` → lista A (corp 24 h); `shClock(false)` → exact o nouă postare B: aceeași lungime (ex. 30 cu 40 de zile atribuite), aceleași `at` în aceeași ordine, titluri identice, corp 12 h (`Starts at 10:30 PM` cu NBSP), fără `at` duplicat; `shClock(true)` → postare C egală cu A; `shClock` cu aceeași valoare → nicio postare; ordinea inversă (`shNotif` înainte de `shClock`) → lista finală corectă; revocare / dezactivare → `{items:[]}` ca azi. Roșu pe 1.10 (corpul rămâne 24 h, nicio postare).
Acceptare manuală pe iPhone: o tură care începe peste ~70 min cu memento activ; schimbi „24-Hour Time”, revii în aplicație, aștepți notificarea (declanșare la start−60) și citești corpul; repeți în sens invers; ora de declanșare neschimbată, o singură notificare. Latura nativă (App.js) nu poate fi rulată în Chromium: acolo verificarea e citirea codului plus testul manual.

### C. Text mic (3 locuri)
`calendar.js:42` (10 px), `.hblbl` (index.html:103, 10,5 px), `hub.js:16` (10,5 px) → cea mai mică valoare lizibilă, 11–12 px. Prioritate: lizibilitate și layout utilizabil, nu înălțime identică. Se păstrează geometria dacă se poate; dacă nu, cel mai mic ajustaj justificat de înălțime/spațiu. Interzis: micșorarea altui text, tăierea conținutului, înghesuirea etichetelor ca să treacă o aserțiune.
Verificări: dimensiunea calculată a fiecărui text; fără suprapuneri sau depășiri (7 limbi × 320/390 × light/dark); etichetele graficului de istoric nu se ating; spațiu rămas în Calendar la 320×568 și 390×844: măsor înălțimea celulei zilei înainte/după și raportez; o scădere peste ~4 px (prag candidat) ți-o prezint explicit. Test geometric cu aserțiuni de lizibilitate, nu „identic cu 1.10”.
Expo: HUB (Next shift, istoric) și Calendar cu zi încărcată în germană/franceză.

## Etapa 2.1 (b91, condiționată) — mișcare (G1 + G2), față de 2.0 acceptat
- Fără schimbare de durată pentru inelul zilei și pastila tab-ului (rămân 360 ms / 340 ms) decât la aprobarea ta explicită, cu valorile alese de tine.
- Candidate igienă (efect vizual nul sau minim): `transition` cu proprietăți explicite pe `.toggle`, `.toast`, `.brush` (aceleași durate și curbe ca acum); `.sheet.hide` pe curba de la tragere `cubic-bezier(.32,.72,0,1)` (singura schimbare vizibilă: foaia la „Done”).
- G2 opțional, aprobat separat: buton ștergere din swipe, stepper `:active`, `valpop`.
- Păstrate: instant la tab-uri, fără fade la temă, numărătoarea la schimbarea lunii, mișcare redusă = zero animații, întreruptibilitatea inelului (`from`), focus.
- Teste: `transition-property` fără `all` pe selectorii atinși; curba `.sheet.hide`; testele `reduce live:` și cele de swipe (test.mjs:1162) rămân verzi. Roșu→verde doar pentru curba foii și `transition-property`; restul = verificare de neregresie, nu teste fabricate.
- Înainte de livrare: rulezi `/review-animations` pe diff.

## Etapa 2.2 (b92, condiționată) — gesturi (G4), față de 2.1 acceptat
- Swipe cu viteză: pragurile (~0,11 px/ms, deplasare minimă ~12 px) sunt candidate de validat cu teste CDP cu timpi simulați și pe telefon, nu valori stabilite; rezistență peste −76 px cu `rubber()` existent doar vizual. Păstrate: arbitrajul gesturilor (`sw`, `lp`, `painting`, `msw`, `ro`, `sd`), garda celui de-al doilea deget, `pointercancel`, `suppressClick`, ieșirea la intenție verticală, focus, întreruperea.
- Feedback la apăsare lungă: selectabil separat; dacă nu e aprobat, nu se face. Dacă se face: doar transform, nu interferează cu pictarea din Edit, inelul sau `suppressClick`.
- Teste (atingeri CDP reale): flick scurt deschide, tragere lentă sub prag nu, peste limită rezistență, flick spre dreapta închide, swipe apoi scroll vertical, două degete, reordonare neafectată, apăsare lungă încă deschide foaia rapidă la 450 ms.

## Neplanificat (decizie separată)
G3 (stagger/aurora), G5 (haptică, fade-uri sub Reduce Motion), `theme-color`/manifest, fundalul nativ `#0F0F13`, podea de 12 px peste tot, modificări native sau dependențe noi.

## Salvare după aprobare (doar documentație, direct pe `main`)
Actualizez `POLISH_PROPOSAL.md` cu această revizuire (propunere, nu aprobare), `NEXT_STEPS.md` (handoff), corectez în `DECISIONS.md` data acceptării `expo-localization` la 2026-10-04 (liniile vecine neatinse; dacă și „Cleanup C stays…” trebuie mutată, o spui tu), apoi commit și `git push origin HEAD:main`. Fără branch-uri extra, hook-uri sau curățare de branch-uri.

## Singurele decizii nerezolvate
1. Aprobi începerea 2.0 și ce intră: `color-scheme`, text memento, cele 3 texte mici (fiecare da/nu)?
2. Dacă `color-scheme` nu afectează o suprafață nativă pe iPhone: oprim la raportarea limitării sau deschidem separat soluția nativă de rezervă?
3. 2.1 și 2.2: le aprobi acum sau după acceptarea 2.0; durate noi pentru inel/pastilă (implicit: nu); G2 și feedbackul la apăsare lungă (implicit: nu)?

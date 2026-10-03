<!-- PROPOSAL, not an approval. Written 2026-10-04 (Europe/Bucharest) after 1.10 (b89) was user-verified.
     Nothing here is approved or started until the user says so. Versions are provisional.
     Evidence labels: [O] observed in the running app (2026-09-30 audit, Chromium, re-checked against today's code by reading) ·
     [C] code-only (read today, not run) · [H] performance hypothesis, not measured · [P] subjective preference. -->

# Propunere: finisaje opționale după 1.10 (G1–G6, text mic, text memento)

Stare: doar propunere. Nicio versiune consumată; următoarea livrare e 2.0 și așteaptă aprobarea ta. Etapa C (curățenia) rămâne ultima în planul aprobat; implementarea ei nu e autorizată aici.

## Ce se mai aplică după 1.0–1.10
- Rezolvate deja, nu mai apar: numărătoarea negativă și sclipirea de la pornire (1.1), intrarea dialogului (1.2), mișcarea redusă live (1.7), ținte de 44 px (1.9), ora 12/24 h (1.10).
- Încă valabile, verificate azi în cod [C]: inelul zilei 360 ms cu depășire (`placeSelRing`, `--e-spring`), pastila tab-ului 340 ms, `.toggle`/`.toast`/`.brush` cu `transition` fără proprietăți (= `all`), `.sheet.hide` pe `ease` 260 ms vs. tragerea pe `cubic-bezier(.32,.72,0,1)`, butonul roșu din swipe din `scale(.6)` cu curbă 1.56, stepper `:active` .88 + `valpop` din .6, stagger pe fiecare pas din onboarding, `.aurora` cu `blur(46px)` animat în buclă, swipe de rând cu prag fix −44 px și limită −76 px fără viteză, apăsare lungă fără semnal vizual, `hap()` oprit de `reduce`.
- `color-scheme`: nu există nicăieri în `index.html` [C]. `theme-color` e fix `#0F0F13`.

## Grupuri

| Grup | Se vede pe telefon | Recomandare | Etapă provizorie |
|---|---|---|---|
| G1 timp și curbe | inelul zilei și pastila tab-ului puțin mai scurte; foaia se închide cu aceeași curbă la „Done” ca la tragere; restul invizibil | face: transition explicit pe toggle/toast/brush + curba foii; durate: testezi și alegi | 2.1 |
| G2 apăsări și bounce | butonul de ștergere din swipe apare mai calm; valoarea stepper-ului nu mai „sare” din mic | opțional, în aceeași etapă cu G1 | 2.1 |
| G3 onboarding | doar prima utilizare; mai puțină așteptare pe pașii 2–7; fundal fix | amână (aurora statică doar dacă vizezi Android slab) | – |
| G4 gesturi | un flick scurt pe un rând îl deschide; tragere peste limită cu rezistență; opțional semnal la apăsare lungă | swipe cu viteză: da; semnal la apăsare lungă: decizie separată | 2.2 |
| G5 mișcare redusă / haptică | doar cu „Reduce Motion” pornit | păstrează comportamentul actual; decizie de produs | – |
| G6 temă | selectorul de oră, tastatura și meniul de selecție urmează tema aplicației, nu a iPhone-ului | face (`color-scheme`); `theme-color` = doar browser, nu | 2.0 |

## G1 – timp și curbe
1. Observabil: inelul care sare pe ziua atinsă și pastila tab-ului. Acum: inel 360 ms cu depășire mică (.34,1.32,.42,1) [O]; pastilă 340 ms, depășire mică [O]. Propus: inel 220–260 ms, depășire redusă; pastilă ~250 ms, aceeași curbă pentru pastilă și etichetă; `.toggle`/`.toast`/`.brush` cu proprietăți explicite; `.sheet.hide` pe `cubic-bezier(.32,.72,0,1)`.
2. Beneficiu: atingerea unei zile e cea mai frecventă acțiune din Calendar; 360 ms e peste pragul de ~300 ms al ghidului. Cost: depășirea dă caracter și e deja întreruptibilă; mai scurt nu e automat mai bun. Transition-urile explicite și curba foii nu schimbă nimic vizibil în afară de foaia la „Done” [C].
3. Recomandare: curba foii + transition explicit = da (igienă, risc mic). Duratele inelului/pastilei = [P]; le facem într-o variantă și decizi tu pe telefon, altfel rămân.
4. Expo: apeși rapid zile diferite; schimbi tab-urile; deschizi o foaie și o închizi cu „Done” apoi tragând; comuți toggle-uri repetat. Nu se măsoară FPS pe telefon.
5. Decizie: durate noi pentru inel/pastilă (da / nu / testez întâi).

## G2 – apăsări și bounce
1. Observabil: ștergerea prin swipe și butoanele +/− din foi. Acum: buton din `scale(.6)`, curbă 1.56, 340 ms [O]; stepper `:active` .88, valoarea animă din .6 la fiecare apăsare, 240 ms [C]. Propus: buton din .9 + opacitate, ~200 ms; stepper `:active` .95, `valpop` din .9.
2. Beneficiu: apăsările în serie rapidă (pași de 30 min la durată) nu mai pâlpâie; un bounce mare pe „șterge” e nepotrivit ca ton. Cost: pierzi puțin din „jucăuș”; [P].
3. Recomandare: opțional, doar împreună cu G1 (aceleași fișiere, un singur ciclu de test). Dacă îți place cum arată acum, păstrează.
4. Expo: swipe pe un rând, apoi ± de zece ori rapid pe durată/pauză.
5. Decizie: da/nu pentru G2 (independent de G1).

## G3 – onboarding
1. Observabil doar la o instalare nouă. Acum: tot stagger-ul (termină la ~740 ms) se reia la fiecare din 7 pași, plus alunecare 440 ms [O]; `.aurora` cu `filter:blur(46px)` pe strat mare, animat 18 s în buclă, plus `obPulse` [C]. Propus: stagger doar la primul pas; aurora statică.
2. Beneficiu: mai puțină așteptare pe pași; mai puțin lucru pentru GPU. Cost: aurora statică pierde o mișcare lentă a fundalului. Cost de performanță pe iPhone: [H], nemăsurat; riscul real e Android slab (regula din CLAUDE.md).
3. Recomandare: amână. Se vede o singură dată pe instalare și se verifică greu (reset de date). Aurora statică doar dacă apar raportări de încetineală.
4. Expo: instalare nouă / ștergere date, parcurs complet.
5. Decizie: amâni (recomandat) sau aprobi aurora statică.

## G4 – gesturi
1. Observabil: swipe pe rândul unei ture; apăsare lungă pe o zi. Acum: rândul se deschide doar dacă ai tras peste 44 px la eliberare, indiferent de viteză; limita e un perete la −76 px [O][C]; apăsarea lungă (450 ms) nu arată nimic cât ții degetul, doar vibrează la final pe telefon [C]. Propus: deschidere și la viteză > ~0,11 px/ms; rezistență progresivă peste −76 cu `rubber()` (există deja pentru foi); opțional micșorare ușoară a celulei după ~150 ms.
2. Beneficiu: un flick scurt, firesc pe iPhone, nu mai e ignorat. Cost: atinge `sw`, `pointercancel`, `suppressClick` (regulile de gesturi din CLAUDE.md) și are nevoie de teste CDP; feedbackul la apăsare lungă interacționează cu pictarea din Edit și cu inelul [C].
3. Recomandare: swipe cu viteză = da. Feedback la apăsare lungă = decizie separată, nu bloca swipe-ul pe ea.
4. Expo: flick scurt pe rând (deschide), tragere lentă sub prag (se închide), peste limită (rezistență), swipe pe rând apoi scroll vertical, reordonare cu apăsare lungă să nu se schimbe.
5. Decizie: swipe cu viteză (da/nu); feedback la apăsare lungă (da/nu).

## G5 – mișcare redusă și haptică
1. Observabil doar cu Reduce Motion pornit. Acum: zero animații (aprobat) și `hap()` iese imediat sub `reduce`, deci nici vibrația nu mai merge [C]. Variante: haptică independentă; fade-uri scurte (150–200 ms) sub `reduce`.
2. Beneficiu: haptica nu e mișcare, iar fade-ul ajută înțelegerea schimbării. Cost: schimbă comportamentul aprobat și cele 11 teste `reduce live:`; nu e reparație de accesibilitate.
3. Recomandare: păstrează acum. Dacă vrei haptică cu Reduce Motion, e o schimbare mică de o linie, dar e decizie de produs. Fade-urile: amână.
4. Expo: Reduce Motion pornit/oprit în timp ce aplicația e deschisă; ziua tap, foaie, dialog.
5. Decizie: haptica rămâne legată de Reduce Motion (da/nu); fade-uri sub `reduce` (da/nu).

## G6 – temă
1. Observabil pe iPhone: dacă tema aplicației (Light/Dark) diferă de cea a iPhone-ului, selectorul nativ de oră din editorul de tură, tastatura și meniul de selecție rămân în tema iPhone-ului, nu a aplicației [C]; nu l-am testat pe telefon. Acum: fără `color-scheme`. Propus: `color-scheme` setat din tema rezolvată în `applyAppearance` (acolo se calculează deja pentru `bar:`).
2. Beneficiu: control nativ coerent cu ecranul. Cost: o linie; fără impact pe tema Auto. `theme-color` și `manifest.json`: doar bară de browser/PWA instalat; WebView-ul Expo nu le folosește, deci nu aduce nimic pe telefon.
3. Recomandare: `color-scheme` = da (etapa 2.0). `theme-color` = nu (PWA/browser, secundar). Separat: fundalul nativ `#0F0F13` din `App.js`/`app.json` poate apărea la pornire sau la overscroll în tema deschisă; neobservat, ar fi o modificare nativă, o decizie ulterioară.
4. Expo: iPhone în Dark, aplicația în Light (și invers) → editor tură → atingi ora: selectorul trebuie să urmeze aplicația; la fel tastatura din câmpul de nume; apoi Auto și schimbarea temei iPhone live.
5. Decizie: da/nu pentru `color-scheme`.

## Evaluare separată: text mic
Măsurat în cod [C] (nu am rulat aplicația acum); contrastul a fost deja verificat la 1.0 (v4.69). Textul e în px, fără Dynamic Type și fără pinch zoom (decizii), deci nu poate fi mărit de utilizator.
- Sub 11 px (3 locuri): 10 px moneda sub totalul zilei (`calendar.js:42`); 10,5 px etichetele din istoricul de venit (`.hblbl`, `index.html:103`); 10,5 px „Next shift/Today” pe cardul din HUB (`hub.js:16`).
- 11 px: etichete de secțiune majuscule (`.sec`, `hub.js:31`, `sheets.js:29`), litere zile (`.weekhdr`), insigne (`.badge`), etichete tab (decis la v4.70), CSV/JSON monospace, nota din Regiune (`settings.js:128`), subtitluri de rând.
- 11,5 px: notele de sub grupuri în Setări/Backup/Export (`settings.js:64,70,105,148`, `sheets.js:105,125,133`), `.statcol .l`, `.brk .sub`, versiunea.
Implicație: la 11,5 vs 12 diferența nu se vede; cele 3 locuri sub 11 sunt singurele clar mici, iar notele de 11,5 conțin instrucțiuni reale. Risc la mărire: cardurile de zi au fost reglate să nu ocupe un rând în plus în 7 limbi la 320 px (1.8), graficul de istoric are 6 etichete pe lățime fixă.
Recomandare: ridică doar cele 3 locuri la 11–12 px (cu verificare geometrică 320/390 × 7 limbi); lasă restul. Variantă mai largă (podea de 12 px peste tot) = amânată, ar muta aspectul.
Expo: HUB (Next shift, istoric), Calendar (zi cu tură, 320 px dacă ai un telefon mic sau Zoom afișare) în germană/franceză.
Decizie: cele 3 locuri (da/nu); podea de 12 px peste tot (nu, recomandat).

## Evaluare separată: text memento
Acum: `syncReminders` pune în corp `timeStr(s.start)` (24 h, "Starts at 22:30"); momentul programării vine din minute și nu depinde de text [C]. Propus: `clockStr` în corp, deci „Starts at 10:30 PM” pe un iPhone în 12 h, 24 h altfel, ca în aplicație (AM/PM fix, spațiu fără întrerupere). Titlul nu se schimbă.
Efect: doar textul notificării. Programarea (`at`, REM_LEAD, REM_MAX, REM_DAYS, semnătura) rămâne neatinsă; textul e fixat la programare, iar la schimbarea setării 12/24 h el se reface la următoarea sincronizare (la reluarea aplicației `shNotif` apelează `syncReminders`; semnătura include corpul, deci lista se retrimite). `shClock` nu apelează `syncReminders` direct; nu e nevoie.
Recomandare: da, în 2.0 (consecvent cu politica din 1.10). Limită: textul vechi rămâne până la reluarea aplicației.
Expo: activezi memento, vezi corpul unei notificări programate (ex. memento la 1 min) cu 24-Hour Time pornit și oprit; confirmi că ora de declanșare e aceeași.
Decizie: da/nu.

## Etape provizorii (versiuni de confirmat după aprobare)
| Versiune | Conținut | Condiție |
|---|---|---|
| 2.0 | G6 `color-scheme` + text memento + cele 3 texte sub 11 px | dacă aprobi cel puțin una; fiecare punct se poate scoate |
| 2.1 | G1 (curbe/transition, durate după alegerea ta) + G2 | dacă aprobi; înainte de implementare: tu rulezi `/review-animations` pe diff (skill invocat doar de utilizator) |
| 2.2 | G4 swipe cu viteză (+ feedback apăsare lungă dacă aprobi) | dacă aprobi; teste CDP pentru gesturi |
| – | G3, G5, `theme-color`, fundal nativ | amânate/neaprobate |
| ultima | C: curățenie | rămâne ultima; implementarea așteaptă instrucțiunea ta |
Fiecare etapă: teste noi, `node test.mjs` verde, verificare în Expo, oprire pentru tine. Nimic aici nu e aprobat.

## Cum s-a făcut evaluarea
Citite și aplicate: ponytail (cea mai mică schimbare, o linie unde se poate), emil-design-eng (frecvență, durate, ease-out, întreruptibilitate, viteză la gesturi, mișcare redusă = mai blândă, nu zero), mobile-native (color-scheme / theme-color / test pe hardware). `review-animations` nu a fost rulat: se invocă doar de utilizator. Aplicația nu a fost pornită pentru această propunere; etichetele [O] vin din auditul din 2026-09-30 (Chromium, CDP), reconfirmate acum prin citirea codului actual. Fără subagenți, fără teste rulate; nimic din Expo/iPhone nu a fost verificat de mine.

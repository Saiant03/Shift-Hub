# Shift Hub v4.78: etapa de animații a auditului frontend (review-animations)

Nu s-a modificat niciun fișier. Standardele sunt cele din `.claude/skills/review-animations/STANDARDS.md`.

Metoda: am inventariat toată mișcarea din `index.html`, `hub.js` și `calendar.js`, apoi am observat-o în aplicația pornită. Am folosit Chromium 1194, ecran 390×844, atingeri reale trimise prin CDP și `document.getAnimations()` citit după fiecare interacțiune, plus măsurători cadru cu cadru. Scripturile sunt `anim-run.mjs` și `anim-run2.mjs` (scratchpad). Nu am testat pe telefon real și nici fluiditatea pe Android slab.

Etichete: **[O]** = comportament observat în aplicație · **[C]** = constatare doar din cod · **[P]** = preferință/subiectiv.

Decizii intenționate pe care le păstrez (nu sunt constatări):
- tab-urile schimbă conținutul instant (CLAUDE.md), ceea ce e corect după standard;
- fără fade la schimbarea temei (v4.45);
- shimmer-ul `.shine` a fost eliminat;
- pop-ul de pictare se transmite peste re-randare (A12);
- HUB numără suma când schimbi luna prin swipe (funcție cerută);
- fără pinch zoom.

## Partea 1: constatări

| Before | After | Why |
|---|---|---|
| **[O]** `hub.js:110` `const p=Math.min(1,(now-start)/dur)`. Primul cadru al numărătorii arată **„-7”** (măsurat: 182 → 0 → -7 → 5 → 17 …) | `const p=Math.max(0,Math.min(1,(now-start)/dur))` | Timpul primit de la `requestAnimationFrame` e anterior lui `performance.now()`, deci `p<0`, iar funcția de ease produce un salariu negativ pe ecran |
| **[O]** `hub.js:122` + `index.html:733`: `animateHub` rulează într-un `requestAnimationFrame` după randare. Primul cadru arată suma finală „182”, apoi 0, apoi numără | La lansare, în HTML se scrie 0 când urmează intro-ul (sau `animateHub` rulează înainte de primul paint) | Sclipire final → 0 → final: exact numărul pe care utilizatorul îl caută |
| **[O]** `index.html:1285`: `.show` se adaugă în rAF pe un `.dlg` abia inserat. Dialogul apare direct cu opacitate 1 și scale 1 (măsurat pe fiecare cadru); se estompează doar fundalul | `void back.offsetWidth;` înainte de `classList.add('show')` | Intrarea gândită (scale .9 → 1 + fade, 280 ms) nu rulează niciodată; dialogul de ștergere „sare” peste un fundal care încă se estompează |
| **[O]** `hub.js:119,122`: shimmer 1050 ms + numărătoare 720 ms **la fiecare pornire** | Numărătoarea rămâne doar la swipe-ul de lună; shimmer-ul se scoate (sau rămâne doar la prima pornire / „celebrate”) | Frecvență: aplicația se deschide de multe ori pe zi ca să vezi suma; asta întârzie citirea cu ~0,7 s. **Funcție intenționată, decizia e a ta** |
| **[O]** `index.html:751`: inelul de selecție a zilei, WAAPI 360 ms `cubic-bezier(.34,1.32,.42,1)`, cu depășire | 200–240 ms `cubic-bezier(0.23,1,0.32,1)`, fără depășire | Atingerea unei zile e cea mai frecventă acțiune din Calendar (de zeci de ori pe zi); limita pentru UI e < 300 ms |
| **[O]** `index.html:147,150`: pastila tab-ului și culoarea etichetei, 340 ms `cubic-bezier(.3,1.1,.35,1)` | 220–250 ms, aceeași curbă pentru amândouă (sincronizarea rămâne) | De zeci de ori pe zi, peste 300 ms. Conținutul instant rămâne așa |
| **[O]** `index.html:136`: `.toggle{transition:.2s}` (= `all`; observat: `background-color` 200 ms `ease`) | `transition: background-color 200ms ease` | `transition: all` e declanșator de escaladare; butonul rotund (knob) are deja tranziția lui separată |
| **[O]** `index.html:221`: `.toast{transition:.25s}` (= `all`, `ease` implicit) | `transition: opacity 250ms ease, transform 250ms cubic-bezier(0.23,1,0.32,1)` | Proprietăți explicite; curbă de intrare mai puternică. Toast-ul e deja întreruptibil (observat: textul se înlocuiește fără restart) |
| **[O]** `index.html:272`: butonul roșu din swipe apare din `scale(.6)` cu `cubic-bezier(.34,1.56,.5,1)` în 340 ms | din `scale(.9)` + opacitate, 200 ms `cubic-bezier(0.23,1,0.32,1)` | Nimic nu apare din mult sub .9; un „bounce” mare pe un buton de ștergere nu se potrivește ca personalitate |
| **[O]** `index.html:1143`: rândul se deschide doar dacă `t<-44`. Un flick rapid de 40 px rămâne închis (observat); limita e fixă la −76 px (observat `matrix(...,-76,0)`) | Se deschide și dacă viteza > ~0,11 px/ms; rezistență peste −76 cu `rubber()` (există deja pentru foi) | Standardele cer impuls și frecare în loc de perete invizibil; foaia din aceeași aplicație le are deja pe amândouă |
| **[C]** `index.html:231,233,237`: stepper `:active{scale(.88)}` + `valpop` din `scale(.6)`/opacitate .3, 240 ms, arc, la fiecare apăsare | `:active` `scale(.95)`; `valpop` din `scale(.9)` (sau scos) | Apăsarea ar trebui să rămână între .95 și .98; stepper-ul se apasă în serie rapidă |
| **[C]** `index.html:157`: `.sheet.hide` 260 ms `ease`, dar închiderea prin tragere folosește `cubic-bezier(.32,.72,0,1)` (observat) | `.sheet.hide{animation:sheetOut .26s cubic-bezier(0.32,0.72,0,1) forwards}` | Aceeași foaie iese cu două curbe diferite; curbele implicite din CSS sunt prea slabe |
| **[O]** `index.html:806`: WAAPI pe `height` 280 ms la navigarea în sub-foi; `index.html:499` `.ob-dot` pe `width`; `index.html:282` rând șters pe `height`/`margin` | `.ob-dot` → `transform: scaleX()`; înălțimea foii și ștergerea rândului se pot lăsa (rare, fără alternativă GPU simplă) | Proprietăți de layout. Punctul din onboarding are o rezolvare ușoară pe GPU |
| **[O]** `index.html:322`: la „mișcare redusă”, `*{animation:none;transition:none}`. Observat: 0 animații, foaia apare instant | Sub `reduce` rămân fade-uri de 150–200 ms (foaie, fundal, toast, dialog); se scot doar mișcările de poziție/scalare | Mișcare redusă înseamnă mai blândă, nu zero; fade-ul ajută la înțelegerea schimbării |
| **[O]** `index.html:728`: `reduce` e citit o singură dată. Cu „mișcare redusă” pornită **în timp ce aplicația e deschisă**, inelul zilei tot sare 360 ms (observat) | `const rmq=matchMedia('(prefers-reduced-motion: reduce)')` și `rmq.matches` citit la momentul apelului | CSS-ul respectă setarea imediat, dar JS-ul abia după repornire |
| **[O][P]** `index.html:1118`: apăsarea lungă de 450 ms nu are niciun semnal vizual cât ții degetul (0 animații observate). Pe iOS web nu există vibrație | Celula se micșorează ușor (`scale(.97)`, doar transform) după ~150 ms de ținut | O apăsare lungă, deliberată, ar trebui să arate că „se încarcă” |
| **[O][P]** `index.html:1270` + `250`: swipe-ul de lună nu urmărește degetul (`transform: none` în timpul tragerii) și glisează 360 ms după eliberare | Păstrat; opțional 280 ms | Un calendar iOS urmărește degetul 1:1, dar nu e o eroare |
| **[O][P]** `index.html:156,163`: foaia urcă 420 ms, iar conținutul face în plus scale .96 → 1 + fade 400 ms cu 60 ms întârziere (se așază la 460 ms) | Conținutul doar cu opacitate (fără scale) | Două mișcări suprapuse; durata e în limita pentru „drawer” (200–500 ms) |
| **[O][P]** `index.html:492-497`: fiecare pas din onboarding re-execută tot stagger-ul (termină la 740 ms, observat) + alunecarea de 440 ms | Stagger doar la primul pas; la pașii următori, doar alunecarea | E prima utilizare, deci „delight” e permis; la 7 pași, însă, se simte lent |
| **[C]** `index.html:300,488`: `.aurora` cu `filter:blur(46px)` pe un strat mare animat 18 s în buclă, plus `obPulse` în buclă | Aurora statică (fără animație) sau cu blur mai mic | Riscul de re-rasterizare pe Android slab din regulile CLAUDE.md. „Mișcare redusă” e deja tratată aici ✓ |

## Partea 2: verdict

1. **Regresii care strică senzația:**
   - număr negativ la pornire [O];
   - sclipire final → 0 [O];
   - dialogul de confirmare fără animația de intrare [O];
   - numărătoare + shimmer la fiecare pornire (frecvență mare) [O, intenționat].
2. **Simplificări ratate:**
   - shimmer-ul de lansare;
   - pop-ul stepper-ului;
   - re-stagger la fiecare pas din onboarding [P];
   - bucla aurora.
3. **Performanță:**
   - `width` la `.ob-dot`;
   - `height` la sub-foi și la ștergerea rândului (acceptabil, fiind rare);
   - `filter: blur` pe stratul animat.
4. **Întreruptibilitate și timp:**
   - inelul zilei (360 ms) și pastila tab-ului (340 ms), peste 300 ms la acțiuni frecvente;
   - swipe-ul rândului fără impuls și cu limită fixă;
   - apăsarea lungă fără semnal în timpul ținerii.
5. **Origine, fizică, coeziune:**
   - butonul de ștergere din `scale(.6)` cu bounce 1,56;
   - două curbe diferite la ieșirea foii;
   - `transition: all` la toggle și la toast.
6. **Accesibilitate:**
   - oprirea globală elimină și fade-urile;
   - `reduce` nu se actualizează în timpul rulării;
   - haptica e oprită de „mișcare redusă” (din auditul anterior).

Ce e foarte bine și trebuie păstrat:
- tragerea foii: 1:1, rubber-band, închidere după viteză, pointer capture, protecție la al doilea deget; întreruperea în timpul deschiderii pleacă din poziția curentă (observat);
- inelul zilei e întreruptibil (pleacă din transform-ul curent);
- toast-ul e întreruptibil (observat);
- toggle-urile rămân corecte la apăsări rapide (observat: stare, `aria-checked` și knob sincronizate);
- ridicarea la reordonare și așezarea în slot;
- feedback de apăsare `scale(.97)` în 120 ms;
- conținutul tab-urilor e instant;
- „celebrate” rulează o singură dată;
- „mișcare redusă” e tratată explicit pe aproape toate căile JS.

**Decizie: Block** (după criteriile stricte ale skill-ului): există regresii observate care strică senzația și animații pe acțiuni frecvente. Nu înseamnă că aplicația e inutilizabilă. Cele mai mici remedieri, în ordine:
1. `Math.max(0, …)` în `countUp`;
2. `void back.offsetWidth` în `confirmDialog`;
3. 0 în markup înainte de numărătoare;
4. apoi duratele (inel / pastilă) și `transition: all`.

Numărătoarea și shimmer-ul de la pornire sunt decizia ta.

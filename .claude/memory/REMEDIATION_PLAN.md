<!-- Approved remediation plan (source of truth for stages 1.0 onward).
     Approved 2026-09-30 by the user, with one correction applied below: `code-review` is a
     Claude Code built-in skill (verified available; not one of the 69 vendored skills);
     where it is unavailable, use `ponytail-review` + a normal manual review — never install
     another skill or claim an unavailable one was used.
     Stage status (implemented / merged / deployed / user-verified) lives in CURRENT_STATE.md,
     not here. Audit reports referenced below: .claude/memory/audits/2026-09-30-*.md.
     The plan text is kept as approved (Romanian). -->

# Plan revizuit (3): remedierile din auditul frontend Shift Hub

Doar plan. Nimic nu se implementează până nu aprobi explicit o etapă.

## Context
Surse: `.claude/memory/audits/2026-09-30-frontend.md`, `.claude/memory/audits/2026-09-30-animations.md`, CLAUDE.md, `.claude/memory/*`. Scopul: erorile confirmate și problemele de accesibilitate se repară cu diff minim (ponytail). Recomandările vizuale subiective rămân separate și neaprobate. Un verdict „Block” al unui skill nu autorizează redesign.

### Decizii confirmate explicit de tine în conversație
- **D1.** Pornirea HUB: suma apare direct, fără numărătoare; shimmer-ul se scoate; numărătoarea rămâne **doar** la schimbarea lunii.
- **D2.** Săgeți ‹ › vizibile pentru lună în HUB.
- **D3.** Confirmare prin dialogul existent la ștergerea turei din editor, a bonusului și a sărbătorii personalizate.
- **D4.** Curățenia ponytail vine ultima.
- **D5.** Politica de versiuni de mai jos (baseline v4.78 → 1.0; secvența 1.0 … 1.10 → 2.0 … 2.10 → 3.0).

### Decizii existente în proiect (păstrate)
Conținutul tab-urilor apare instant; fără pinch zoom; fără fade la schimbarea temei; pop-ul de pictare (A12); bara de stare PWA `black-translucent`; sub mișcare redusă nu rulează nicio animație (comportamentul actual, păstrat).

Faptul că textul e în px **nu** aprobă textul mic: constatarea 10,5–11,5 px rămâne deschisă pentru evaluare.

## Ramură și livrare
- Ierarhia reală a instrucțiunilor: instrucțiunea sesiunii desemnează ramura `claude/clever-franklin-5o1rdm`. Commit-urile și push-urile (`git push -u origin claude/clever-franklin-5o1rdm`) merg acolo.
- CLAUDE.md cere `main`, dar asta nu suprascrie instrucțiunea de mediu, și nici aprobarea ta nu o poate suprascrie.
- Fără ștergeri de ramuri, `reset`, force-push sau curățenie distructivă.
- Ajungerea pe `main` se face în afara acestei restricții: tu faci merge, sau îmi ceri explicit un PR.

## Reguli comune pentru orice etapă
1. **Oprire:** după versiunea 1.0 și după fiecare etapă următoare mă opresc și aștept verificarea ta (site / telefon) înainte să continui.
2. **Versiuni:** fiecare etapă finalizată avansează o singură dată în secvența D5. Planificarea, auditurile, etapele sărite și propunerile neaprobate nu consumă versiuni. Finisajele aprobate și înrudite se grupează într-o singură etapă cu o singură versiune.
3. **Implementare:** o face un sub-agent pe un model mai ieftin (CLAUDE.md), cu brief și criterii de acceptare. Eu verific diff-ul, testele și comportamentul. Dacă nu se poate alege un model mai ieftin, o spun.
4. **Teste:** teste de regresie cu sens pentru erorile reparate. Pentru text și stil ajung verificarea vizuală controlată sau o aserțiune simplă, fără „red-first” artificial. `node test.mjs` rămâne verde.
5. **Dovezi etichetate:**
   - **[Chromium]** = Playwright cu `/opt/pw-browsers/chromium-1194`;
   - **[cod]** = constatare din inspecția codului;
   - **[manual]** = iPhone / VoiceOver / Expo, făcute de tine.
   - Nicio platformă netestată nu e raportată ca „trecută”.
   - Scripturile din audit (`audit-run.mjs`, `anim-run.mjs` din scratchpad) le refolosesc doar dacă mai există; altfel refac verificările în `test.mjs`.
6. **Skill-uri (politica ta):**
   - la fiecare etapă aleg doar skill-urile relevante, le citesc `SKILL.md` înainte, le verific disponibilitatea și uneltele (motorul impeccable și `playwright-cli` se pierd la resetarea containerului; le reinstalez după `tool-install-record.md` doar dacă instalarea e permisă atunci, altfel raportez);
   - CLAUDE.md și ponytail au prioritate; recomandările skill-urilor nu autorizează modificări suplimentare;
   - **`review-animations` are `disable-model-invocation`: îți cer tu să-l pornești (`/review-animations`)** înainte de verificarea etapelor cu mișcare;
   - raportul fiecărei etape spune ce skill-uri au fost **efectiv aplicate**, ce verificări s-au făcut și ce a rămas neverificat.
7. **Memoria** se actualizează la final de etapă (în `CURRENT_STATE` / `NEXT_STEPS` / `DECISIONS` notez versiunea nouă).

Skill-urile pe care le voi cita, cu rolul lor:
- **ponytail**: diff minim;
- **code-review**: revizuirea diff-ului pentru erori;
- **playwright-cli**: verificare interactivă în browser;
- **impeccable**: `context`, apoi `detect` pe fișierele UI modificate (cerut de `impeccable context`), și playbook-urile `harden`/`audit` ca listă de verificare;
- **web-design-guidelines**: reguli pentru formulare, focus și a11y;
- **ui-ux-pro-max**: o căutare punctuală în ghidurile UX pentru comportamentul în cauză;
- **mobile-native**: ținte tactile și touch pe mobil;
- **review-animations**: doar prin invocarea ta;
- **emil-design-eng / apple-design**: doar pentru finisaje de mișcare aprobate.

---

## Etapa V (1.0): release doar de versiune, fără schimbare de comportament
**Inventar confirmat [cod]:**
- `APP_VERSION='4.78'` (`index.html:550`), afișat în Setări (`settings.js:44`);
- `?v=4.78` pe 8 `<script src>` (`index.html:540-547`);
- `sw.js`: cache-ul `shifthub-v4.78` + 8 URL-uri precache `?v=4.78`;
- `test.mjs:1503-1507`: impune `?v=` = `APP_VERSION` și cache = `APP_VERSION`;
- CLAUDE.md: regulile de incrementare;
- `mobile/app.json` și `mobile/package.json`: `1.0.0`, fără `buildNumber` / `versionCode` (Expo Go, fără EAS), deci niciun contor monoton nativ. **Rămân neschimbate.**

**Separarea versiunii afișate de identificatorul tehnic** (singura abstracție necesară, pentru că versiunea afișată se resetează):
- `APP_VERSION='1.0'`: doar pentru afișare.
- Identificator tehnic nou, monoton, **continuă numărătoarea 4.NN**: build 79 pentru 1.0, 80 pentru 1.1 etc.
  - `?v=b79` pe toate scripturile, cache-ul `shifthub-b79`, precache `…?v=b79`;
  - prefixul `b` nu a apărut niciodată; istoricul local e scurt (de la v4.45), așa că verific cu `git log -S` pe istoricul disponibil și, dacă se poate doar în citire, pe istoric mai adânc;
  - nu refolosesc `shifthub-v1.0` / `?v=1.0`.
- Nu se schimbă (formate de date, nu versiuni): cheia `shifthub_v4` și `shifthub_v4_prev` din `localStorage`, formatul de backup `v:4`. Nimic nu se șterge sau migrează.

**Test actualizat (`test.mjs`):**
- toate `?v=` sunt egale între ele și cu tokenul din `sw.js` (`shifthub-b<N>`), iar precache-ul conține exact acele URL-uri;
- `APP_VERSION` respectă `^\d+\.\d+$`.
- „Build-ul nu scade” se verifică la release, pe lista de verificare (testul nu vede istoricul).

**Documentare:**
- CLAUDE.md: regula de incrementare devine „`APP_VERSION` urmează secvența D5, iar `?v=b<N>` + `shifthub-b<N>` cresc cu 1 la fiecare release”;
- DECISIONS.md: o linie `2026-… — v4.78 = 1.0 (build 79) — …`;
- intrările istorice v4.x rămân neschimbate.

**Cum primește o instalare existentă noul release:**
- `sw.js` are alt conținut, deci browserul instalează noul SW, care precache-uiește `?v=b79`, face `skipWaiting` și la `activate` șterge orice cache în afară de `shifthub-b79`;
- `index.html` vine network-first;
- datele din `localStorage` nu sunt atinse;
- în Expo, `sync-html.js` reinlinează scripturile (fără SW în WebView), iar Setări arată 1.0.

**Verificare specifică versiunii:**
- **[Chromium] actualizare de pe 4.78:**
  1. servesc exportul `git archive HEAD` (v4.78) într-un director din scratchpad;
  2. seed de date + backup `shifthub_v4_prev`, SW înregistrat, cache `shifthub-v4.78` prezent;
  3. comut serverul pe noul build și reîncarc de 2 ori.
  4. Aștept:
     - un singur cache, `shifthub-b79`;
     - Setări afișează „Shift Hub 1.0”;
     - scripturile se cer cu `?v=b79`;
     - `localStorage` (`shifthub_v4`, `shifthub_v4_prev`) identic byte cu byte;
     - reîncărcare offline (`context.setOffline(true)`) funcțională;
     - `pageerror` gol.
- **[Chromium] fonturi (verificare de fapt, fără modificări):** listez cheile din cache după încărcare și separ CSS-ul Google (`fonts.googleapis.com`, opac) de fișierele de font (`fonts.gstatic.com`, CORS). Verific dacă supraviețuiesc schimbării de versiune (cache-ul vechi se șterge) și ce font apare la prima pornire offline după actualizare.
- **[Chromium] iconița din manifest:** randez `icon.png` cu mască circulară în zona sigură maskable (cerc 80%). Estimarea din cod: colțurile calendarului ies probabil din cerc. Rezultatul decide dacă e nevoie de o imagine nouă (propunere separată, nu intră aici).
- Capturile de ecran sunt identice vizual cu v4.78, cu excepția versiunii din Setări; `node test.mjs` verde.
- **[manual]:** Setări arată 1.0 pe site, în PWA-ul instalat și în Expo.

**Skill-uri:**
- ponytail: un singur identificator nou, fără alte abstracții;
- code-review: diff-ul;
- playwright-cli: verificarea interactivă a actualizării.

---

## A. Reparații confirmate
### Etapa 1 (1.1): numărătoarea corectă + pornirea aprobată (D1)
- `hub.js` `countUp`: limitez **progresul** `p` la [0, 1] (`Math.min(1, Math.max(0, …))`), nu valoarea. Ultimul cadru scrie `fmtN(to)`.
- `animateHub`: fără `.shimfx` (CSS `shimmove` șters) și fără numărătoare la lansare; `celebrate` rămâne. La lansare suma se randează direct cu valoarea finală; **nicio inițializare cu 0 fără animație**.
- `changeMonth`: numărătoarea la schimbarea lunii se păstrează.
- Teste [Chromium]:
  - total pozitiv; total 0 (lună goală);
  - totaluri negative nu sunt suportate (`normalize()`: net ≥ 0, sume > 0), deci aserțiunea este că nicio valoare afișată nu e negativă;
  - schimbări rapide de lună prin **swipe-ul existent** (3 la rând): valoarea finală = `monthTotals(y,m).grand` formatat;
  - anulare: schimb tab-ul în timpul numărătorii, revin, suma e corectă;
  - mișcare redusă: fără animație, valoarea finală din primul cadru;
  - lansare: primul cadru arată suma finală, fără `.shimfx`.
- Skill-uri: ponytail; code-review; playwright-cli; **review-animations (îl pornești tu)** pe diff.

### Etapa 2 (1.2): dialogul de confirmare (intrare + focus + izolare, complet aici)
- **Reproducere întâi** [Chromium]: `transitionrun` nu apare pe `.dlg`. Aleg cea mai mică remediere fiabilă după reproducere (candidați: citirea stilului înainte de `.show`, dublu rAF).
- **`confirmDialog`:**
  - `role="alertdialog"`, `aria-modal`, `aria-labelledby` / `aria-describedby`;
  - focus inițial pe „Anulează”; Escape = Anulează; Tab ciclează în dialog.
  - **Izolare:** cât e deschis, tot ce e în spate e `inert`, **inclusiv o foaie deschisă**.
  - **La închidere:**
    - dacă există o foaie deschisă, revine exact starea ei (foaia accesibilă, fundalul ei încă `inert`) și focusul pe controlul care a deschis dialogul din foaie;
    - fără foaie, `inert` se scoate și focusul revine pe elementul care a deschis dialogul;
    - dacă acel element a dispărut, focusul merge pe un element de rezervă, dat ca parametru de apelant (implicit: containerul foii sau tab-ul activ).
- Teste [Chromium]:
  - tranziția pornește (verificat prin eveniment, nu printr-un cadru anume); sub mișcare redusă dialogul apare, e utilizabil și nu are tranziții;
  - dialog peste foaie (Restore / Delete all data): la Anulează, Tab rămâne în foaie și fundalul rămâne `inert`;
  - dialog fără foaie: focusul revine corect.
- [manual]: VoiceOver anunță dialogul.
- Skill-uri: web-design-guidelines (focus/modal); impeccable `detect` pe fișierul modificat; ui-ux-pro-max (căutare „focus not obscured” / dialog); playwright-cli; code-review; review-animations (invocat de tine).

### Etapa 3 (1.3): confirmare la ștergeri (D3)
- `shiftDelete` (editor), `bonusDel` și `chDel` trec prin `confirmDialog`. Chei noi „Delete bonus?” și „Delete holiday?” (6 limbi); pentru tură refolosesc textul de la swipe.
- Ținta corectă: id-ul turei, id-ul bonusului, iar pentru sărbătoare obiectul `{m,d,name}` (nu indexul luat la randare).
- Focusul de rezervă după ștergere (primit de `confirmDialog` din Etapa 2):
  - tură → rândul următor, altfel butonul +;
  - bonus → rândul următor, altfel câmpul Name;
  - sărbătoare → următoarea din listă, altfel câmpul cu numele sărbătorii.
- Teste: Anulează păstrează starea și `localStorage` identice; confirmarea șterge doar elementul vizat (inclusiv cel din mijloc dintr-o listă de 3); focusul ajunge pe rezervă.
- Skill-uri: ponytail (refolosesc `confirmDialog`); web-design-guidelines (acțiuni distructive); playwright-cli; code-review.

### Etapa 4 (1.4): onboarding izolat
- Cât e afișat, `#screen` și `#tabbar` sunt `inert`. Focusul inițial e pe titlul pasului (`tabindex=-1`) și trece pe titlul fiecărui pas nou.
- La „Start”: `inert` se scoate și focusul ajunge pe titlul HUB.
- Teste [Chromium]: Tab nu iese din `#onboard`; „HUB” lipsește din arborele de accesibilitate cât timp e deschis; focusul e corect după „Start”.
- [manual]: VoiceOver.
- Skill-uri: impeccable (playbook `harden`, `detect`); web-design-guidelines; playwright-cli; code-review.

### Etapa 5 (1.5): nume accesibile + controlul de fișier + titluri
- Câmpurile `netinput`, `onbnet`, `bonusname`, `bonusamt`, `chname`, `shname` și `backuptext` primesc `<label for>` sau `aria-labelledby` spre textul vizibil; unde nu există text vizibil, `aria-label` cu chei existente.
- **Backup:** input-ul de fișier devine focusabil, ascuns vizual cu `.srbtn` în loc de `display:none`. Eticheta primește inel de focus vizibil (`:focus-within`), iar Enter/Space îl deschid.
- `<p class="sec">` devine `<h2 class="sec">`, cu stilul resetat.
- Teste [Chromium]:
  - nume accesibil nevid pentru fiecare câmp în **toate cele 7 limbi**;
  - Tab ajunge la controlul de fișier, conturul e vizibil, Enter declanșează `filechooser`;
  - regresie vizuală controlată: titlurile nu se schimbă.
- Skill-uri: web-design-guidelines (formulare / etichete); ui-ux-pro-max (căutare „input labels”); impeccable `detect`; playwright-cli; code-review.

### Etapa 6 (1.6): săgeți de lună în HUB (D2)
- Refolosesc `.navbtn`, `I.chevL`/`I.chevR`, `prevMonth`/`nextMonth` și etichetele traduse existente, pe cardul cu suma, fără overflow la 320 px.
- Teste:
  - săgețile schimbă luna (atingere + tastatură);
  - **testele specifice săgeților pentru numărătoare** (apăsări rapide, valoarea finală corectă);
  - fără overflow la 320/390 px în 7 limbi;
  - atingere reală la marginea zonei de 44 px.
- Skill-uri: mobile-native (ținte tactile); impeccable `detect`; playwright-cli; code-review; review-animations (invocat de tine) dacă apar schimbări de mișcare.

### Etapa 7 (1.7): mișcare redusă aplicată live (eroare)
- `const reduce` devine `let reduce`, actualizat de `change` pe același `matchMedia`; toate apelurile rămân la fel.
- Comportamentul sub mișcare redusă rămâne cel actual: **nicio animație**.
- Animațiile **deja în curs** când se activează setarea (inelul WAAPI, înălțimea foii, numărătoarea) se termină imediat în starea finală corectă (de exemplu `finish()` pe animațiile WAAPI ale aplicației; numărătoarea scrie valoarea finală).
- Teste [Chromium]:
  - activare cu o animație în curs: starea finală e corectă (poziția inelului = ziua selectată, suma finală, foaia complet deschisă);
  - activare, apoi o acțiune nouă: nicio animație pornită;
  - dezactivare: animațiile revin.
- Skill-uri: review-animations (invocat de tine); ponytail; playwright-cli; code-review.

### Etapa 8 (1.8): texte netraduse + textul fals din Export
- Prin `tr()`, cu chei noi în 6 limbi unde lipsesc:
  - `hmLabel` (reutilizez cheia existentă `{h} H`);
  - „h OT” / „OT·n”, „Custom”, „none”;
  - „Untitled” din handler-ul `shname`.
- `sheetExport`: înlocuiesc fraza falsă („Downloads are blocked in preview…”) cu o frază corectă (propunere: „Copies this month's CSV to the clipboard.”), în 6 limbi.
- Verificare: în de/fr/ro nu mai rămân literale englezești pe ecranele afectate; regresie vizuală la 320 px.
- Skill-uri: ponytail; impeccable (playbook `clarify` doar ca listă de verificare); playwright-cli; code-review.

### Etapa 9 (1.9): ținte de 44 px la ștergerea bonusului și a sărbătorii
- `bonusDel` și `chDel` intră în lista `::before` existentă (`index.html:180`). Dacă zona s-ar suprapune cu toggle-ul vecin, măresc întâi distanța dintre ele.
- Chip-urile de frecvență primesc padding lateral minim.
- Teste [Chromium]:
  - atingeri CDP reale la marginile zonei de 44 px lovesc butonul corect;
  - atingeri la granița toggle/coș lovesc fiecare propria țintă (fără suprapunere);
  - regresie vizuală pentru chip-uri.
- Skill-uri: mobile-native; web-design-guidelines; playwright-cli; code-review.

### Etapa 10 (1.10, condiționată): formatul orei
Pornește doar după decizia privind politica orei. Dacă e amânată, nu consumă 1.10.
- Se schimbă doar **afișarea**. Valorile stocate, calculele, `<input type=time>`, CSV-ul și memento-urile rămân neschimbate.
- `Intl.DateTimeFormat` nu garantează potrivirea cu pickerul nativ; politica aleasă se verifică [Chromium] cu localele en-US, en-GB, de-DE, ro-RO.
- **Acceptare [manual] pe iPhone**, cu setarea „24-Hour Time” pornită și oprită.
- Skill-uri: web-design-guidelines (Intl); playwright-cli; code-review.

### Evaluare (fără versiune): lizibilitatea textului de 10,5–11,5 px
Măsor [Chromium] toate textele sub 12 px (unde apar, ce conțin, ce contrast au). Rezultatul și o propunere îți vor fi prezentate pentru decizie; se implementează doar dacă aprobi, ca etapă separată.
Skill-uri: ui-ux-pro-max („readable font size”), impeccable `detect`.

---

## B. Finisaje opționale (niciunul aprobat; grupate dacă le aprobi)

| Grup | Conține | Ce propune |
|---|---|---|
| G1 timp și curbe | O1, O2, O3, O6 | Inelul zilei ~220 ms fără depășire; pastila tab-ului ~240 ms; `.toggle` / `.toast` cu proprietăți explicite; închiderea foii cu curba de la tragere |
| G2 scalări și bounce | O4, O5 | Butonul de ștergere din swipe fără bounce, de la `.9`; stepper `.95` / pop de la `.9` |
| G3 onboarding | O7, O8 | Stagger doar la primul pas; aurora statică |
| G4 gesturi | O11, O12 | Swipe pe rând după viteză + rezistență; feedback vizual la apăsarea lungă |
| G5 mișcare redusă extinsă | O9, O10 | Haptica independentă de mișcarea redusă; fade-uri scurte sub mișcare redusă |
| G6 temă | O13 | `theme-color` + `color-scheme` după temă |

Fiecare grup aprobat devine **o singură** etapă cu **o singură** versiune, înainte de curățenie.
Skill-uri: review-animations (invocat de tine), emil-design-eng / apple-design pentru G1–G4, mobile-native pentru G4, playwright-cli, code-review.

## Etapa C (ultima): curățenie ponytail (D4)
- **Reverific întâi** fiecare afirmație de cod mort sau cheie nefolosită după etapele anterioare. Nu șterg nimic refolosit între timp (de ex. `{h} H`, „Untitled”, chei noi).
- **De șters:**
  - straturile CSS vechi (tema violet, „v11”: `.dotpat`, `.beamborder`, `@property`, `.gradtext` + clasa din `hub.js`);
  - rama de desktop (`.device`, `.tagline`, `body.pwa`), cu `.aurora` păstrat;
  - identificatorii și clasele moarte confirmate;
  - ramura `claude.use('downloads')`.
- **De simplificat:**
  - `duration(d)` în `sheetShift`;
  - o clasă comună pentru tile-ul de iconiță;
  - token-urile temei închise scrise o singură dată, **doar dacă** se păstrează preferința stocată light/dark/auto și actualizarea live în Auto (`darkMQ`).
- **Regresie vizuală controlată** (înlocuiește „identic byte cu byte”):
  - aceleași date de pornire și ceas fix (`clock.install`);
  - fonturi încărcate (`document.fonts.ready` + verificare că Plus Jakarta e activ);
  - animații stabile (`screenshot({animations:'disabled'})` după stabilizare);
  - același Chromium, viewport și DPR 2;
  - comparare pixel cu prag mic; **orice diferență semnificativă se investighează**.
- **Matricea de capturi (168):**
  - 21 de vederi: HUB, HUB detalii, Calendar, Calendar Edit, Ture, Setări, Salariu, Bonusuri, Regiune, Backup, Export, editor tură, foaia zilei, foaia rapidă + 7 pași de onboarding;
  - × lățimi {320, 390} × teme {light, dark} × limbi {en, de} = 21 × 2 × 2 × 2 = **168**.
- Teste suplimentare: Auto urmează schimbarea temei sistemului în timpul rulării; preferința se păstrează după reîncărcare.
- Skill-uri: ponytail-audit (reverificare), ponytail-review (pe diff), code-review, playwright-cli.

## Tabel etape → versiuni

| Versiune | Etapă | Condiție |
|---|---|---|
| **1.0** | V: doar versiune (baseline v4.78, build 79) | după aprobarea ta |
| 1.1 | 1: numărătoare + pornire (D1) | |
| 1.2 | 2: dialog | |
| 1.3 | 3: confirmări la ștergere (D3) | |
| 1.4 | 4: onboarding izolat | |
| 1.5 | 5: nume accesibile, fișier, titluri | |
| 1.6 | 6: săgeți HUB (D2) | |
| 1.7 | 7: mișcare redusă live | |
| 1.8 | 8: texte + Export | |
| 1.9 | 9: ținte de 44 px | |
| 1.10 | 10: formatul orei | doar dacă decizi politica; altfel următoarea etapă ia 1.10 |
| 2.0, 2.1 … | grupuri aprobate G1–G6, apoi evaluarea textului mic dacă e aprobată | numai cele aprobate, în ordinea aprobării |
| următoarea liberă (2.x) | C: curățenie (D4) | ultima |

Build-ul tehnic crește cu 1 la fiecare rând (79, 80, …), indiferent de versiunea afișată.

## Acoperirea constatărilor

| Constatare | Tratare |
|---|---|
| Număr negativ, sclipire, pornire (shimmer / numărătoare) | Etapa 1 |
| Dialog fără animație de intrare; focus și izolare în dialog | Etapa 2 |
| Ștergeri fără confirmare | Etapa 3 |
| Onboarding accesibil din spate | Etapa 4 |
| Câmpuri fără etichetă; control de fișier; lipsa titlurilor | Etapa 5 |
| Luna din HUB doar prin swipe | Etapa 6 |
| Mișcarea redusă nu se aplică live | Etapa 7 |
| Texte netraduse; text fals în Export | Etapa 8 |
| Ținte mici (bonus / sărbătoare / chip-uri) | Etapa 9 |
| Ora în două formate | Etapa 10, decizie deschisă |
| Text de 10,5–11,5 px | Evaluare, apoi decizia ta |
| Fonturi Google în cache | De verificat în Etapa V (CSS vs fișiere de font) |
| Iconița manifestului „any maskable” | De verificat în Etapa V (zona sigură); imagine nouă doar dacă e necesar și aprobat |
| `theme-color` fix | G6 opțional |
| `.del` din swipe e `div` | Amânat (alternativa din editor există); verificare [manual] VoiceOver |
| Durate, curbe, bounce, stagger, aurora, haptica, fade-uri, gesturi | G1–G5 opționale |
| `.ob-dot` pe `width`; swipe de lună care nu urmărește degetul | Amânate (rar / preferință) |
| Placeholder fără „…”, `autocomplete`, mesaje de eroare fără soluție | Amânate (necesită decizie de redactare) |
| `user-scalable=no` | Păstrat (decizie documentată) |
| Detector: glow / clip / occlusion / gradient | Glow: stil existent; restul fals pozitive |
| Ponytail A1–A8 | Etapa C |
| Android slab, Expo, VoiceOver real | Doar [manual] |

## Decizii încă deschise
1. Cum verifici fiecare etapă, dat fiind că push-ul merge pe ramura de sesiune: faci checkout local pe ramură pentru telefon, sau îmi ceri explicit un PR pe care îl combini tu în `main` (site).
2. Politica pentru formatul orei afișate (Etapa 10).
3. Ce grupuri opționale (G1–G6) aprobi, dacă aprobi vreunul.

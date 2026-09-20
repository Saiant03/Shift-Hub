# Shift Hub — versiunea Expo (pentru testare pe telefon)

Această aplicație Expo afișează **exact** `index.html` din rădăcina proiectului
într-un WebView pe tot ecranul. Nu duplică logica: `index.html` rămâne singura
sursă de adevăr, iar `sync-html.js` îl copiază automat în `htmlSource.js`
înainte de fiecare pornire.

PWA-ul original (`../index.html`, `../sw.js`, `../manifest.json`) rămâne
neatins.

## De ce ai nevoie (o singură dată)

- **Node.js** (LTS) instalat pe calculator — https://nodejs.org
- Aplicația **Expo Go** pe telefon (App Store / Google Play)
- Telefonul și calculatorul pe **aceeași rețea Wi-Fi**

## Cum pornești

Într-un terminal, în folderul `mobile`:

```bash
npm install        # o singură dată — descarcă librăriile
npm start          # de fiecare dată când vrei să testezi
```

`npm start` regenerează automat pagina din `../index.html` și pornește Expo.
Apoi apare un **cod QR** în terminal:

- **iPhone:** deschide aplicația **Cameră**, îndreapt-o spre QR, apasă
  notificarea „Open in Expo Go".
- **Android:** deschide **Expo Go** și apasă „Scan QR code".

Aplicația se deschide pe telefon. Când modifici `../index.html`, oprești
(`Ctrl+C`) și dai iar `npm start` ca să vezi noua versiune.

## Structură

| Fișier          | Ce face                                                        |
| --------------- | -------------------------------------------------------------- |
| `App.js`        | Ecranul: un WebView pe tot ecranul                             |
| `sync-html.js`  | Copiază `../index.html` în `htmlSource.js`                     |
| `htmlSource.js` | Generat automat — **nu edita manual**                         |
| `app.json`      | Numele, iconița, orientarea aplicației                         |

## Note

- Datele tale se salvează în `localStorage` (pe telefon), la fel ca în PWA.
- Fontul Google se încarcă din internet; offline, se folosește fontul de sistem.
- `sw.js` (service worker) nu rulează aici — nu e nevoie, pagina e locală.

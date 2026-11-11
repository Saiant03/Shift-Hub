# Shift Hub — aplicația Expo (testare pe iPhone)

Aplicația Expo afișează `index.html` din rădăcina proiectului într-un WebView pe tot
ecranul. Logica nu e duplicată: `index.html` (și scripturile lui) rămân singura sursă,
iar `sync-html.js` le copiază în `htmlSource.js` la fiecare pornire. În plus, `App.js`
face legătura cu telefonul: vibrații (haptics), backup prin meniul de partajare,
memento-uri pentru ture (notificări) și culoarea barei de status.

## De ce ai nevoie

- Aplicația **Expo Go** pe telefon (App Store), actualizată. Proiectul e pe Expo SDK 58.
- Un terminal cu Node.js: de obicei Codespace-ul proiectului.
- Un cont Expo, dacă ești logat în Expo Go pe telefon (vezi mai jos).

## Cum pornești

În folderul `mobile`:

```bash
npm install
```

O dată după un Codespace nou și după fiecare schimbare de dependențe. Instalează exact
versiunile din `package-lock.json`.

```bash
npm run tunnel
```

De fiecare dată când vrei să testezi. Regenerează pagina din `../index.html` și pornește
Expo printr-un tunel ngrok, deci telefonul nu trebuie să fie în aceeași rețea. Scanează
codul QR cu camera iPhone-ului și deschide-l în Expo Go. După o modificare în
`../index.html`, oprește (`Ctrl+C`) și rulează din nou `npm run tunnel`.

Nu porni direct cu `expo start`: fără `sync-html.js`, telefonul arată versiunea veche.

## Probleme cunoscute

- **„You're signed in to Expo Go … but not signed in to Expo CLI”:** rulează o dată
  `npx expo login --no-browser` (user și parolă în terminal). Login-ul prin browser nu
  merge din Codespace. Rămâne valabil până la un rebuild al Codespace-ului.
- **Tunelul ngrok pică în Codespace:** încearcă din nou. Alternativ: `npm run codespace`,
  apoi fă portul 8081 public (`gh codespace ports visibility 8081:public -c $CODESPACE_NAME`).
- **`expo: not found`:** lipsește `npm install`.

## Structură

| Fișier              | Ce face                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| `App.js`            | WebView-ul pe tot ecranul + haptics, backup, notificări, bara de status |
| `sync-html.js`      | Copiază `../index.html` cu scripturile inline în `htmlSource.js`         |
| `htmlSource.js`     | Generat automat, nu e în git — **nu edita manual**                      |
| `app.json`          | Numele, iconița, orientarea aplicației și pluginurile Expo               |
| `package-lock.json` | Versiunile exacte ale dependențelor                                      |

## Note

- Datele se salvează în `localStorage` pe telefon, la fel ca în PWA.
- Fontul Google se încarcă din internet; offline se folosește fontul de sistem.
- `sw.js` (service worker) nu rulează aici: pagina e locală.

# Known issues

_Remove an entry once it is resolved._

- **Intermittent test failure: `salary: the net salary is capped at the supported
  maximum (1e9)…`.** Failed once in a full run (v4.29 work), got `reloaded: 4000`;
  passes 12/12 alone. Probably also the unnamed one-off failure seen at v4.16.
  The test reloads the page right after the typed value is saved, so the write likely hasn't reached storage yet (test race,
  not an app bug). If it recurs, re-run; a fix would wait briefly before `reload()`.
  Same race hit the v4.35 shift-reorder reload test once (defaults came back); that
  test now waits 300 ms before `reload()`. Salary race seen again once at v4.43.
- **Memory files are public.** The site auto-deploys from `main`, so
  `.claude/memory/` is served with it — never write secrets or personal data here.
- **`npm run tunnel` can fail in the Codespace** (`CommandError: failed to start
  tunnel … session closed` = ngrok side, not the project; the `libatk` DevTools
  error in the same output is harmless). Retry first. Fallback without ngrok:
  `npm run sync && EXPO_PACKAGER_PROXY_URL=https://$CODESPACE_NAME-8081.app.github.dev npx expo start`,
  then `gh codespace ports visibility 8081:public -c $CODESPACE_NAME` in a second
  terminal (a private port returns a login redirect → Expo Go "failed to parse manifest").

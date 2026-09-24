# Known issues

_Remove an entry once it is resolved._

- **Memory files are public.** The site auto-deploys from `main`, so
  `.claude/memory/` is served with it — never write secrets or personal data here.
- **`npm run tunnel` can fail in the Codespace** (`CommandError: failed to start
  tunnel … session closed` = ngrok side, not the project; the `libatk` DevTools
  error in the same output is harmless). Retry first. Fallback without ngrok:
  `npm run sync && EXPO_PACKAGER_PROXY_URL=https://$CODESPACE_NAME-8081.app.github.dev npx expo start`,
  then `gh codespace ports visibility 8081:public -c $CODESPACE_NAME` in a second
  terminal (a private port returns a login redirect → Expo Go "failed to parse manifest").

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
- **Expo Go signed in → "not signed in to Expo CLI"** (SDK 58): a signed-in Expo Go asks for a signed manifest. Run `npx expo login --no-browser` in the Codespace (the default browser login redirects to an unreachable localhost); it persists until the Codespace is rebuilt.
- **`git pull` in the Codespace aborts on `mobile/package-lock.json`** ("untracked working tree files would be overwritten"): a lockfile created by a local `npm install` before it was committed (2026-11-11). Fix once: `rm mobile/package-lock.json && git pull`. Always confirm the phone shows the expected version in Settings.

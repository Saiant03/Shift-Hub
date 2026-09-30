# Tool install record

Session-only tools (the container resets; reinstall only when permitted). Pinned versions; verify before use.

| Tool | Version | Source | Checksum (full, from the official source) | Installed at |
|---|---|---|---|---|
| impeccable engine | 0.1.5 (`.claude/skills/impeccable/scripts/VERSION`) | `https://github.com/pbakaus/impeccable/releases/download/engine-v0.1.5/impeccable-linux-x64`, fetched by `.claude/skills/impeccable/scripts/impeccable` (verifies the `.sha256` sidecar, fails closed) | sha256 `cf5231a4b1ae66996c85b033800b1dad0797e590eae2f21ef2579430af187f19` (release sidecar; local `sha256sum` identical) | `~/.impeccable/bin/0.1.5/impeccable` (binary prints `4.0.0` for `--version`) |
| `@playwright/cli` | 0.1.22 | npm registry `https://registry.npmjs.org/@playwright/cli/-/cli-0.1.22.tgz` | integrity `sha512-6WMkQNM4VEzqMkdr/l60X9Cr7i+tI/arK87IWz2K7pB6j8I2ZJ8KN+1JfhJDLnK+SXnab6Op8xGt4adcGLsyfA==`, shasum `8f4bb69e84084f1fabcb4ba08f491f7e16894a06` (`npm view`) | global npm (`/opt/node22/bin/playwright-cli`); bundles its own `playwright`/`playwright-core` 1.64.0-alpha, the global `playwright` 1.56.1 used by `test.mjs` is untouched |

Reinstall:
- impeccable: `.claude/skills/impeccable/scripts/impeccable --version` (downloads + verifies), then `sha256sum ~/.impeccable/bin/0.1.5/impeccable` must equal the value above.
- playwright-cli: `npm view @playwright/cli@0.1.22 dist.integrity` must equal the value above, then `npm install -g @playwright/cli@0.1.22`.

Recorded 2026-09-30 (Stage 3 session): the original record was not in the repo; values re-fetched from the official sources above, not reconstructed from the truncated hash in memory (which matches: `cf5231a4…7f19`).

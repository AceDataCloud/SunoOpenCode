# Reproduce the free host acceptance

Use Node 22+ and the exact official host, without touching your global installation:

```sh
npm install --prefix /tmp/opencode-host-check --no-save @opencode/cli@2.0.26
OPENCODE_BIN=/tmp/opencode-host-check/node_modules/.bin/opencode \
OPENCODE_E2E_OUTPUT=/tmp/opencode-host-check/evidence.json npm run test:e2e
```

The committed runner packs this repository, extracts that artifact in its own new
temporary directory, and starts a private loopback OpenCode server. It strips all
inherited API keys/tokens, uses isolated XDG directories and an empty model feed,
and checks the native plugin, Key/env entry, disabled MCP and bundled Skill.
It stops the private server and removes only its own temporary directory.

This is **real host + packed package + no credential** acceptance. It does not
exercise the remote Git installer, live authentication, service word search in the
official directory, tools/call, generation, existing-task results, unique billing
or acquisition. Those are separate evidence levels. Do not label this full E2E.

`npm test` covers credential rotation/revocation and user-owned configuration with
a small test host. Earlier live auth checks retain their original dates/heads.
CI uploads host-e2e.json with exact source head, host/package version, package hash
and packed files so missing Skill/assets are reviewable without exposing secrets.

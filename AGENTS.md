# SunoOpenCode

This repository owns only the OpenCode 2 native Suno adapter and onboarding.
Suno API transport, schemas, task normalization and billing remain in
AceDataCloud/MCPs (`suno/`, published as SunoMCP). Do not duplicate them here.

- Run `npm test`, `npm run check` and `npm pack --dry-run` before a PR.
- Add no billable generation, model request, task submission or retry to install,
  startup, tests or CI. Live acceptance requires an explicitly approved budget.
- Credential destinations are fixed to `https://suno.mcp.acedata.cloud/mcp`.
  Never accept a user-configurable host with a saved token.
- Keep native credential storage in OpenCode; never write credentials to config,
  Skill content, logs or README. Credential changes must update in-memory headers.
- Existing user-owned MCP entries take precedence over plugin defaults.
- Keep English and Chinese onboarding in sync. Cite screenshot dates and distinguish
  native integration from upstream directory approval and paid task acceptance.

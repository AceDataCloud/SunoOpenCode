# Suno by Ace Data Cloud for OpenCode

A native **OpenCode 2** plugin for Suno music, lyrics and task results. Install one plugin, connect your Ace API Token through OpenCode's `/connect`, and use Suno tools without maintaining an MCP JSON block. It reuses [SunoMCP](https://github.com/AceDataCloud/SunoMCP); it does not copy the API implementation or add a model fallback.

Independent integration by **Ace Data Cloud**. It is not made or endorsed by the Suno or OpenCode teams. [简体中文](readme/README_zh_Hans.md) · [Privacy](PRIVACY.md) · [Source/provenance](docs/SOURCES.md).

## 1. Install the released plugin

Requires **OpenCode 2.0.26+**. Check `opencode --version`; OpenCode 1 has a different plugin API.
See [OpenCode's plugin manager](https://opencode.ai/v2/docs/plugins/).

The implementation is merged on `main`. Install through the official Git-package mechanism:

```bash
opencode plugin add github:AceDataCloud/SunoOpenCode
```

For a fixed version, use the **v0.1.0** Git release:

```bash
opencode plugin add 'github:AceDataCloud/SunoOpenCode#v0.1.0'
```

If your network cannot reach the HTTPS shortcut, the official Git SSH form uses your existing GitHub SSH access:

```bash
opencode plugin add 'git+ssh://git@github.com/AceDataCloud/SunoOpenCode.git#v0.1.0'
```

[Release notes and source archive](https://github.com/AceDataCloud/SunoOpenCode/releases/tag/v0.1.0).
Git release and npm publication are separate: npm availability is not claimed here.
The [OpenCode community-directory submission](https://github.com/anomalyco/opencode/pull/56666)
remains under review and is not an endorsement or an in-product marketplace listing.
If you installed an earlier candidate target, remove that exact target with `opencode plugin remove`
before adding the released target. Install only one copy.

Installing registers **Suno by Ace Data Cloud** as a native key/env connection,
a fixed hosted MCP server, and a task Skill. It does not select your chat model or authorize generation.

## 2. Register or sign in and obtain an application API Token

1. Open [Ace Applications](https://platform.acedata.cloud/console/applications?utm_source=github&utm_medium=referral&utm_campaign=evergreen&utm_content=opencode_suno_plugin_readme_key), register/sign in, and find **General application**. If none exists, choose **Initialize General Application**.
2. Check Suno service access, application balance and [current pricing](https://platform.acedata.cloud/models?utm_source=github&utm_medium=referral&utm_campaign=evergreen&utm_content=opencode_suno_plugin_readme_pricing). A dedicated application's token may only access that service.
3. Copy the API Key, or choose **Manage Keys → Create** for a separately named `OpenCode Suno` token.

![Copy an API key or open Manage Keys — Ace account tutorial, not OpenCode](assets/get-api-key-en.png)

4. Review expiry and usage limits. If enabling **Allowed APIs**, include `/suno/audios` and `/suno/tasks` for music and same-task lookup. Other operations, such as lyrics, may need additional APIs.

![Create a separate restricted application key — redacted Ace tutorial](assets/create-api-key-en.png)

These existing author-owned screenshots are from the SunoDify tutorial commit shown in each URL, reused 2026-10-18. They show Ace account steps, not OpenCode; real key characters are redacted. The screenshot name `Dify tutorial` is from that source; use `OpenCode Suno` for this integration. Copy the raw token, without `Bearer `, spaces or quotes. A `platform-...` management token is not a generation API Token. No free-credit amount is promised.

## 3. Paste the token in OpenCode

Restart/reload OpenCode after installation. Enter:

```text
/connect
```

Choose **Suno by Ace Data Cloud → Ace Data Cloud API Token — Suno**, then paste the raw application token. OpenCode owns credential storage; the plugin only resolves it in memory for the fixed Suno MCP URL. It does not write the key to your project or prompts. Open `/mcp` to check `suno-by-acedatacloud`; connection is disabled until a key exists.

For an environment-based connection, export `ACEDATACLOUD_SUNO_API_TOKEN` to the **server process** before starting OpenCode. An already running background service does not inherit a different terminal's exports. Use `opencode --standalone` for an isolated first check. Never paste the key into a chat prompt.

![Official OpenCode terminal reference; not this plugin or Ace execution](assets/opencode-original-1.png)

Official original screenshot, collected 2026-10-17; original capture date and exact version unknown. This shows the actual OpenCode TUI and model/tool output layout. It does **not** show this plugin's `/connect` dialog or prove Ace execution. The native plugin dialog screenshot is pending coordinated UI capture; exact labels above were verified through the local OpenCode 2 API, not an invented image.

## 4. First use without generating media

Ask OpenCode:

```text
Show the currently available Suno music models using suno_list_models.
Do not generate anything or call another service.
```

This inspects the service's model information; your selected chat model may still bill for conversation. Check the actual tool schema instead of assuming a historical model name or duration is supported.

## 5. Create once, then query the same task

After explicitly approving the current Suno price and your budget, ask for one music request using `suno_generate_music`. Preserve the returned `task_id`. Query it with **`suno_get_task`**, never by repeating the generation tool.

```text
Query Suno task <your-existing-task-id> with suno_get_task.
Do not submit, retry or regenerate any media. Report its current state and
only identify audio links as final when the task confirms completion.
```

`pending`/`processing` means wait and query the **same ID**. A preview URL, green connection or the model saying “done” is not a terminal service result. The current remote MCP normalizes confirmed success to `complete` and confirmed failure to `failed`; use its returned status and final `audio_url` values. On failure/timeout/rate limit, inspect the original task before deciding whether to approve another billable submission. Installation performs no generation and no automatic paid retries.

## Troubleshooting

| Symptom | Check |
|---|---|
| No Suno entry | Verify OpenCode 2, plugin installation target and loaded plugin list; reload. |
| Disabled MCP | Connect a key or export the token to the server process. |
| 401/403 | Raw application token, expiry, Suno access, Allowed APIs, balance. Never send a key to support. |
| Pending task | Query the same task ID; never generate to poll. |
| 429/5xx/timeout | Keep the original task/trace ID, reduce concurrency and inspect status before any new charge. |
| Duplicate/user-defined server | An existing `suno-by-acedatacloud` MCP config takes precedence; this plugin does not overwrite it. |

Chat-model charges and Suno charges are separate. Successful installation/connection is not a completed song, unique-bill proof or evidence of customer revenue. [API documentation](https://platform.acedata.cloud/documents/suno-mcp?utm_source=github&utm_medium=referral&utm_campaign=evergreen&utm_content=opencode_suno_plugin_readme_docs) · [Support](https://github.com/AceDataCloud/SunoOpenCode/issues).

[Reproduce the free packed-package host check](docs/VERIFY.md). This is not a generation, official-listing or billing test.

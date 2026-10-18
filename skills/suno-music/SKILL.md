---
name: suno-music
description: Suno music, lyrics, covers and same-task audio results through Ace Data Cloud in OpenCode. Use the installed Suno MCP tools; check price and obtain authorization before billable actions.
license: MIT
compatibility: OpenCode 2.0.26 or later with Suno by Ace Data Cloud installed.
metadata:
  author: acedatacloud
  service: suno
---

# Suno by Ace Data Cloud

This is an Ace Data Cloud integration. It is not an official Suno or OpenCode product.

## Connect

Install the plugin, open `/connect`, choose **Suno by Ace Data Cloud**, and enter a
raw Ace application API Token. Keep it in OpenCode credential storage, never in a
prompt. Alternatively export `ACEDATACLOUD_SUNO_API_TOKEN` to the server process.
If tools are missing, confirm the plugin is loaded, the credential is connected,
and the `suno-by-acedatacloud` MCP server is connected. Do not ask to see the key.

## First use

1. Start with `suno_list_models` or `suno_list_actions` to inspect the current tool
   contract without generating media. Do not guess models, duration or tool fields.
2. Before `suno_generate_music`, custom music, lyrics, covers or any other billable
   operation, confirm the user's request, current service price and available budget.
   Installing or connecting this plugin never authorizes a generation.
3. Submit the approved generation once. Preserve the exact returned `task_id`.
4. Call `suno_get_task` with that same ID until a terminal result. Pending or processing
   is not failure. Never resubmit a generation to poll, retry or obtain a final URL.
5. Report state and actual final audio URLs only when the returned task confirms
   completion. A preview URL or successful connection is not a finished song.
6. For failed, cancelled, rate-limited or timed-out tasks, report the original status
   and task ID; obtain approval before a new billable submission. Do not promise refunds.

The remote Suno MCP owns schemas, API transport and result normalization. Inspect
its current tools instead of calling a different service or inventing fallbacks.
Keep model chat charges separate from Suno service charges. A task result does not
prove the unique billing record or an acquisition conversion.

## Account and price

- Applications: https://platform.acedata.cloud/console/applications?utm_source=github&utm_medium=referral&utm_campaign=evergreen&utm_content=opencode_suno_plugin_skill_key
- Current pricing: https://platform.acedata.cloud/models?utm_source=github&utm_medium=referral&utm_campaign=evergreen&utm_content=opencode_suno_plugin_skill_pricing

Use General application or a separate Suno-capable application. For a restricted
key, allow `/suno/audios` and `/suno/tasks`; advanced tools may require other APIs.
A `platform-...` management token is not an application API Token.

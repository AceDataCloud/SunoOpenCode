# Privacy and cost

The plugin registers Suno tools in OpenCode through the existing hosted Suno MCP.
OpenCode stores a manually entered application API Token; the plugin resolves it
in memory and sends a Bearer header only to `https://suno.mcp.acedata.cloud/mcp`.
The plugin never writes the token to project configuration, Skill text or logs.
The optional `ACEDATACLOUD_SUNO_API_TOKEN` is read by the OpenCode server process.

Installing/loading the plugin does not submit generation. An authorized user/model
tool action sends the selected prompt and media references through the Suno MCP
and Ace Data Cloud API. Check service access, balance and current price before use.
OpenCode model conversations may have separate costs. No trial amount is promised.
Do not submit personal or copyrighted content without appropriate rights.

An existing user-defined MCP entry with the plugin server name takes precedence;
its destination and credential settings are managed by that user, not this plugin.
Remove the plugin from OpenCode to stop its registrations. Revoke or rotate saved
keys in Ace Applications and remove stored credentials from OpenCode when needed.
The remote service's retention and task access policies remain its own contract.

Support: dev@acedata.cloud or https://github.com/AceDataCloud/SunoOpenCode/issues

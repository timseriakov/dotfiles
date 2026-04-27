# MCP naming rules

## Critical MCP disambiguation

There are two different names that must never be confused:

- `playwriter` is the MCP server available in this OpenCode setup.
- `playwright` is a browser testing framework and must not be used as an MCP server name unless it is explicitly configured.

When the user says "playwriter mcp", "Playwriter MCP", or asks to use the MCP for browser/page automation in this setup, always use the MCP server named exactly:

`playwriter`

Never silently rewrite `playwriter` to `playwright`.

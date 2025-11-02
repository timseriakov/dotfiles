# Codex CLI Instructions

## MCP via MCPProxy

- Use a single MCP server: MCPProxy at `http://localhost:8080/mcp/`.
- MCPProxy routes to all underlying servers (GitLab, Atlassian, SQVR GraphQL, Perplexity, Serena, etc.).
- Always discover and call tools through MCPProxy; do not connect to servers directly.

## Tool Selection (Decision Matrix)

- Code edits across many files → `morphllm-fast-apply` via MCPProxy.
- Project-wide search/navigation/memory → `serena` via MCPProxy.
- Web search → `perplexity-mcp` via MCPProxy.
- Jira/Confluence ops → `atlassian` via MCPProxy.
- GitLab issues/MRs/files → `gitlab` via MCPProxy.
- GraphQL queries to SQVR → `sqvr-graphql` via MCPProxy.
- And other MCP (get a list from MCPProxy)

Ask MCPProxy for the most relevant tool by plain language; it returns and executes the right tool.

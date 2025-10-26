# Gemini Instructions

## MCP Server Access via MCPProxy

**IMPORTANT**: All MCP servers are accessed through MCPProxy (http://localhost:8080/mcp/) for token optimization and intelligent tool discovery.

**How it works:**
- Gemini connects to a single MCPProxy endpoint via `mcp-remote`
- MCPProxy uses BM25 search to find the most relevant tools across all servers
- This reduces token usage by ~99% compared to loading all tools upfront

**Available servers through MCPProxy:**
- morphllm-fast-apply (pattern-based bulk edits)
- sequential-thinking (complex multi-step reasoning)
- serena (semantic code understanding, project memory)
- perplexity-mcp (AI-powered reasoning)
- sqvr-graphql (GraphQL API integration)
- gitlab (GitLab integration)
- atlassian (Jira/Confluence integration)

**Usage:** Simply request tools by natural language - MCPProxy will automatically find and provide the right tools. No manual tool selection needed.

**Configuration:** MCP servers managed in `~/dev/dotfiles/mcpproxy/mcp_config.json`

## Git Commit Best Practices

### ⚠️ Pre-commit Hook Rules
This repository uses `pre-commit` hooks that automatically fix file formatting:
- `end-of-file-fixer` - adds newlines at end of files
- `trailing-whitespace` - removes trailing spaces

### 🚫 Avoid These Patterns:
- Making commits while actively editing files
- Sequential small commits during development
- Committing without letting pre-commit auto-fix

### ✅ Recommended Workflow:
1. **Complete all file modifications** before committing
2. **Add newlines at end of new files**:
   ```python
   # Example file.py
   print("last line of code")

   ```
3. **Commit all changes together**:
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   ```
4. **Allow pre-commit to auto-fix** formatting issues

### 🎯 Best Practices:
- Work → Complete → Commit (not Work → Commit → Work → Commit)
- Group related changes into logical commits
- Let pre-commit handle formatting - don't manually fight it
- Always end files with empty lines to avoid hook conflicts

### File Creation Guidelines:
Ensure all text files end with newline character to prevent pre-commit conflicts.

## Configuration
Pre-commit configuration is in `.pre-commit-config.yaml` - hooks run automatically on commit.

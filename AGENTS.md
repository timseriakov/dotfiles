# AI Agents Instructions

## Git Workflow for AI Tools

### ⚠️ Critical: Pre-commit Hook Behavior

This repository has automated formatting hooks:

- `end-of-file-fixer` - automatically adds newlines to file endings
- `trailing-whitespace` - removes trailing spaces

### 🚫 Common Issues to Avoid:

- **File modification conflicts**: Committing while files are being edited
- **Hook interference**: Making commits during active file operations
- **Incremental commit spam**: Multiple small commits instead of logical groups

### ✅ Correct Workflow Pattern:

```
1. Receive user request
2. Plan all necessary changes
3. Execute ALL file modifications
4. Create files with proper endings (newline at EOF)
5. Stage and commit everything together
6. Let pre-commit auto-fix formatting
```

### 📁 File Creation Standards:

Always create files with trailing newlines:

**JavaScript/TypeScript:**

```javascript
function example() {
  return "code";
}
```

**Python:**

```python
def example():
    return "code"

```

**Shell/Config files:**

```bash
#!/bin/bash
echo "script content"

```

### 🔧 Git Commands:

```bash
# Preferred approach:
git add .
git commit -m "Complete feature implementation"

# Avoid:
git add file1.js
git commit -m "partial change"
git add file2.js  # This can conflict with hooks!
git commit -m "another change"
```

### 💡 Pro Tips:

- Pre-commit hooks are your friend - let them fix formatting
- Batch operations prevent conflicts
- End files with empty lines to satisfy POSIX standards
- Single logical commits are better than multiple incremental ones

## Implementation

All AI tools (Claude, Gemini, ChatGPT, Copilot, etc.) should follow this pattern when working with this repository.

## MCPProxy Policy

- All AI tools must use MCPProxy only: `http://localhost:8080/mcp/`.
- No direct connections to individual MCP servers — always route via MCPProxy.
- See `CODEX.md` for details and the tool decision matrix.

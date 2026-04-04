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

## Dotfiles Deployment Model

**What**
All configuration files are stored in the dotfiles repository:

`/Users/tim/dev/dotfiles`

Application config locations (e.g. `~/.hammerspoon/`, `~/Library/Preferences/qutebrowser/`) contain links pointing **into** the repository.

**Why**

- Single source of truth: editing files in the repo immediately updates the live configuration
- Centralized storage in Git: full history of changes, ability to rollback, audit, and sync across machines

**Where**
All config directories are organized inside:

`/Users/tim/dev/dotfiles/`

Examples:

- `qutebrowser/`
- `hammerspoon/`
- etc.

**Implementation Details**

- Most links are symlinks from app directories → dotfiles repo
- Some may be hardlinks (same inode), which behaves equivalently for this use case
- New files (e.g. userscripts) may require manual linking into the target app directory

**Key Principle**
Never edit configs in-place inside application directories — always edit inside the dotfiles repo.

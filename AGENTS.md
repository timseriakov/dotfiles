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

## Dual-Yazi tmux Kitty Image Preview

This workstation intentionally uses `jtianling/tap/dual-yazi`, not upstream `yazi`.

If image previews work in Kitty outside tmux but fall back to Chafa inside tmux, check `yazi --debug` inside tmux. The broken signature is:

- `Emulator.detect: ... Left(Tmux) ...`
- `Adapter.matches: Chafa`

For this setup, dual-yazi 26.3.0 can detect tmux itself and then map `Brand::Tmux` to no graphical adapters. The local compatibility patch is to build dual-yazi with tmux mapped to Kitty graphics protocol:

```rust
// yazi-adapter/src/adapters.rs
B::Tmux => vec![A::Kgp],
```

Rebuild/install procedure after dual-yazi updates:

```sh
rm -rf /tmp/dual-yazi-fix
git clone --depth 1 https://github.com/jtianling/dual-yazi.git /tmp/dual-yazi-fix
cd /tmp/dual-yazi-fix
python3 - <<'PY'
from pathlib import Path
p = Path('yazi-adapter/src/adapters.rs')
s = p.read_text()
s = s.replace('B::Tmux => vec![],', 'B::Tmux => vec![A::Kgp],')
p.write_text(s)
PY
cargo build --release -p yazi-fm -p yazi-cli
mkdir -p ~/.local/bin
cp target/release/yazi target/release/ya ~/.local/bin/
chmod 755 ~/.local/bin/yazi ~/.local/bin/ya
```

Fish must prefer `~/.local/bin` before Homebrew; `fish/conf.d/10-path.fish` uses `fish_add_path -gpm ~/.local/bin` for that. Verify with:

```sh
command -v yazi
# expected: /Users/tim/.local/bin/yazi
yazi --debug
# inside tmux expected: Adapter.matches: Kgp
```

Keep tmux passthrough enabled in `.tmux.conf`:

```tmux
set -g allow-passthrough on
set -ga update-environment TERM
set -ga update-environment TERM_PROGRAM
set -g terminal-features 'xterm-kitty:passthrough:clipboard:ccolour:cstyle:focus:title:RGB'
```

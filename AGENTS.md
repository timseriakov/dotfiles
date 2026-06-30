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

This workstation intentionally uses `jtianling/tap/dual-yazi`, not upstream `yazi`, because the current Kitty + tmux + Yazi image preview path works correctly and is fragile. Do not "simplify" it back to upstream Yazi, Chafa, or default tmux terminal settings.

Working contract agents must preserve:

- `command -v yazi` must resolve to `/Users/tim/.local/bin/yazi`.
- Fish must keep `~/.local/bin` ahead of Homebrew; `fish/conf.d/10-path.fish` uses `fish_add_path -gpm ~/.local/bin`.
- `.tmux.conf` must keep Kitty passthrough enabled and advertise Kitty features:

```tmux
set -g allow-passthrough on
set -ga update-environment TERM
set -ga update-environment TERM_PROGRAM
set -g terminal-features 'xterm-kitty:passthrough:clipboard:ccolour:cstyle:focus:title:RGB'
set -g default-terminal "xterm-kitty"
set -ga terminal-overrides ",xterm-kitty:Tc"
```

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

Verify after changes:

```sh
command -v yazi
# expected: /Users/tim/.local/bin/yazi
yazi --version
# expected current pinned build: Yazi 26.3.0 (c8921e3 2026-06-14)
yazi --debug
# inside tmux expected: Adapter.matches: Kgp
```

If an agent needs to edit terminal, tmux, Fish path, Kitty, Chafa, or Yazi config, it must preserve this contract first.

## Hunk — live diff review with agents

Hunk (`hunk diff` / `hunk show`) — интерактивный просмотрщик diff'ов в терминале.
Агент может подключиться к запущенному hunk через `hunk session ...`:

```text
Load the Hunk skill and use it for this review. Run `hunk skill path` to get the skill path.
```

Skill даёт агенту команды: `hunk session list|get|review|navigate|reload|comment add|comment apply`.
После загрузки скилла агент видит твой текущий diff, может листать файлы и оставлять inline-заметки.

### Quick start для агента

```bash
hunk skill path                      # путь к SKILL.md
hunk session list                    # список активных hunk-окон
hunk session review --repo . --json  # посмотреть что открыто
hunk session navigate --file F --hunk N  # перейти к файлу/хунку
hunk session comment add --file F --new-line N --summary "..."  # заметка
```

### Git pager (опционально)

Заменить delta на hunk как git pager:

```bash
git config --global core.pager 'hunk pager'
```

Или алиасы для выборочного использования:

```bash
git config --global alias.hdiff "-c core.pager='hunk pager' diff"
git config --global alias.hshow "-c core.pager='hunk pager' show"
```

### Конфиг

`~/.config/hunk/config.toml` → `hunk/config.toml` в dotfiles (symlink).
Тема: Nord+, watch mode включён.

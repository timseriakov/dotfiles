# Automatic English Keyboard Layout Switching in qutebrowser

This feature automatically switches to English keyboard layout when entering qutebrowser's internal command/prompt modes, similar to how Neovim automatically switches to English layout when exiting insert mode.

## How it works

1. **Userscript**: `userscripts/switch-to-english` uses `im-select` to switch to English (ABC) layout
2. **Helper function**: `en(cmd)` in config.py wraps commands with layout switching
3. **Key binding overrides**: Modified key bindings that enter command/prompt modes to first switch to English layout

## Affected key bindings

The following qutebrowser internal modes now automatically switch to English layout:

### Command mode
- `:` - Enter command mode

### Search modes
- `/` - Forward search
- `?` - Backward search

### Tab/URL opening
- `t` / `е` - Open new tab prompt
- `Cmd+t` / `Cmd+е` - Open new tab prompt (macOS)

### Navigation prompts
- `Space+Space` - Tab selection prompt
- `ge` - Edit current URL

### Session management
- `Space+ss` - Save session prompt
- `Space+sl` - Load session prompt
- `Space+sd` - Delete session prompt
- `Space+sr` - Rename session prompt

### Tab management
- `Space+tm` - Move tab prompt
- `Space+tw` - Take tab prompt
- `Space+tt` - Select tab prompt

### Settings
- `Space+cS` - Set configuration prompt

## Requirements

- `im-select` must be installed: `brew install daipeihust/tap/im-select`
- The userscript must be executable: `chmod +x userscripts/switch-to-english`

## Disable Layout Switch Tooltip

To disable the blue "RU/EN" tooltip that appears when switching layouts:

```bash
./scripts/disable-keyboard-layout-tooltip.sh
```

This runs once and permanently disables the macOS keyboard layout indicator popup. You may need to log out and back in for changes to take effect.

## Implementation details

Each affected key binding uses the `en()` helper function:
```python
config.bind(":", en("cmd-set-text :"))
config.bind("t", en("cmd-set-text -s :open -t"))
```

The `en()` function chains commands: `spawn -u switch-to-english ;; original-command`

# Automatic English Keyboard Layout Switching in qutebrowser

This feature provides automatic English keyboard layout switching for qutebrowser, similar to Neovim's InsertLeave behavior. It includes:

1. **Mode change switching** - English layout when leaving insert mode
2. **Command mode switching** - English layout for all command/prompt modes
3. **Preserve multilingual input** - Keep current layout when in insert mode for typing in other languages

## How it works

### Core Components

1. **Layout switching userscript**: `userscripts/switch-to-english` - Simple 3-line script using `im-select`
2. **Insert mode detection**: Greasemonkey script detecting when leaving input fields
3. **Mode change overrides**: Modified insert mode bindings to switch layout on mode changes
4. **Command mode switching**: All command/prompt modes automatically switch to English

### Automatic Switching Scenarios

**Leaving Insert Mode**
- When pressing Escape to leave insert mode
- When clicking outside input fields on web pages
- Similar to Neovim's InsertLeave behavior

**Command/Prompt Modes**
- All colon commands (`:`)
- Tab/URL opening prompts
- Session management prompts
- Any other qutebrowser internal input modes

**Search modes preserve current layout** (`/`, `?`) - you may want to search in Russian or English

**Preserved Multilingual Input**
- Entering insert mode preserves current keyboard layout
- Typing in web page input fields keeps your chosen language
- Only switches to English when leaving input contexts

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

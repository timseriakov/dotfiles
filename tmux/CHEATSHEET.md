# Tmux Cheat Sheet

## Daily minimum

- `Ctrl-a` — leader
- `Ctrl-a c` — new window
- `Ctrl-a Enter` — split horizontal
- `Ctrl-a =` — split vertical
- `cmd+f` / `cmd+а` — persistent popup shell
- `Ctrl-a f` — внутри popup переносит его в обычное окно; вне popup ничего не делает
- `Ctrl-a g` — внутри popup переносит его в vertical split родительского окна; вне popup ничего не делает
- `Ctrl-a G` — внутри popup переносит его в horizontal split родительского окна; вне popup ничего не делает
- `cmd+alt+f` / `cmd+alt+а` — ephemeral popup shell
- `Ctrl-a s` or `cmd+s` / `cmd+ы` — session picker
- `Ctrl-a S` — popup session picker
- `Ctrl-a w` — workmux dashboard popup
- `Ctrl-a v` — copy-mode
- `y` / `Enter` — copy
- `q` — quit copy-mode
- `Ctrl-a r` — reload config
- `cmd+j` / `cmd+о`, `cmd+k` / `cmd+л` — prev / next window
- `cmd+h` / `cmd+р`, `cmd+l` / `cmd+д` — prev / next session

## If Russian layout

- `v` `м`
- `y` `н`
- `q` `й`
- `r` `к`
- `e` `у`
- `w` `ц`

## Remember

- `Ctrl-b` disabled
- popup shell has persistent and ephemeral modes
- windows auto-rename by active process
- full bind map: `tmux/KEYBINDINGS.md`
- full guide: `tmux/README.md`

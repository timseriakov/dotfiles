# Tmux Keybindings

Отдельная карта биндов для текущего tmux-setup.

## Basics

- `Ctrl-a` — leader
- `Ctrl-a Ctrl-a` — отправить literal `Ctrl-a` в приложение
- `Ctrl-a r` — reload config

## Windows and panes

| Key                | Action                              |
| ------------------ | ----------------------------------- |
| `Ctrl-a c`         | новое окно в текущей директории     |
| `Ctrl-a Enter`     | split horizontal                    |
| `Ctrl-a =`         | split vertical                      |
| `cmd+t` / `cmd+е`  | новое окно через kitty → `F1`       |
| `cmd+a` / `cmd+ф`  | новое окно через kitty → `F1`       |
| `cmd+q` / `cmd+й`  | убить pane через kitty → `F2`       |
| `alacritty: cmd+a` | убить окно через alacritty → `F3`   |
| `cmd+enter`        | horizontal split через kitty → `F4` |
| `cmd+z` / `cmd+я`  | zoom/unzoom pane через kitty → `F5` |
| `cmd+r` / `cmd+к`  | rename window через kitty → `F6`    |
| `cmd+j` / `cmd+о`  | предыдущее окно через kitty → `F9`  |
| `cmd+k` / `cmd+л`  | следующее окно через kitty → `F10`  |

## Layout and moving things

| Key                         | Action                                    |
| --------------------------- | ----------------------------------------- |
| `Ctrl-a i`                  | переместить окно перед указанным индексом |
| `Ctrl-a u`                  | swap окна с указанным индексом            |
| `Ctrl-a m`                  | перенести pane в выбранное окно           |
| `Ctrl-a M`                  | втянуть pane из другого окна в текущее    |
| `Ctrl-a E`                  | `select-layout -E`                        |
| click по status line        | перейти в окно                            |
| middle click по status line | закрыть окно                              |

## Popup and sessions

| Key                       | Action                                    |
| ------------------------- | ----------------------------------------- |
| `cmd+f` / `cmd+а`         | persistent popup shell через kitty → `F7` |
| `cmd+alt+f` / `cmd+alt+а` | ephemeral popup shell через kitty → `F8`  |
| `Ctrl-a f`                | persistent popup shell                    |
| `Ctrl-a F`                | ephemeral popup shell                     |
| `Ctrl-a s`                | `sesh` session picker                     |
| `Ctrl-a C`                | создать named session                     |
| `Ctrl-a X`                | убить текущую session                     |
| `Ctrl-a S`                | перейти к прошлой session                 |
| `Ctrl-a @`                | вынести pane в отдельную session          |

## Workmux

| Key        | Action                       |
| ---------- | ---------------------------- |
| `Ctrl-a e` | `workmux sidebar`            |
| `Ctrl-a b` | `choose-tree -Zw`            |
| `Ctrl-a w` | popup `workmux dashboard -s` |
| `Ctrl-a W` | full `workmux dashboard`     |
| `Tab`      | `workmux last-agent`         |
| `L`        | `workmux last-done`          |

## Copy mode

| Key        | Action                                                      |
| ---------- | ----------------------------------------------------------- |
| `Ctrl-a v` | войти в copy-mode                                           |
| `v` / `м`  | начать выделение                                            |
| `y` / `н`  | копировать selection                                        |
| `Enter`    | копировать selection                                        |
| `q` / `й`  | выйти; если есть selection — скопировать в `pbcopy` и выйти |
| `a` / `ф`  | выйти из copy-mode                                          |
| `i` / `ш`  | очистить selection                                          |
| `p` / `з`  | выйти и вставить buffer                                     |
| `Ctrl-v`   | выйти и вставить buffer                                     |
| `F1`       | выделить всё в copy-mode                                    |

## Search helpers

| Key                | Action                                                              |
| ------------------ | ------------------------------------------------------------------- |
| `alacritty: cmd+f` | copycat search через alacritty → `F11`                              |
| `cmd+u` / `cmd+г`  | copycat mode для URL/path/session-like шаблонов через kitty → `F12` |
| `Ctrl-a ?`         | copycat search                                                      |
| `Ctrl-a /`         | search по scrollback через fuzzback                                 |

## RU layout duplicates

Если раскладка осталась русской, часть биндов всё равно дублируется:

- `r` / `к`
- `v` / `м`
- `y` / `н`
- `q` / `й`
- `e` / `у`
- `w` / `ц`

## Notes

- `Ctrl-b` отключён.
- Часть сценариев copy-mode использует `pbcopy`.
- Popup shell бывает двух типов: persistent и ephemeral.
- Setup глубоко интегрирован с `workmux`.

## Kitty passthrough notes

Если смотришь на tmux-конфиг напрямую, часть действий живёт на внутренних `F*`, но в реальном использовании ты жмёшь kitty-бинды:

- `cmd+t` / `cmd+е` и `cmd+a` / `cmd+ф` → `F1`
- `cmd+q` / `cmd+й` → `F2`
- `cmd+enter` → `F4`
- `cmd+z` / `cmd+я` → `F5`
- `cmd+r` / `cmd+к` → `F6`
- `cmd+f` / `cmd+а` → `F7`
- `cmd+alt+f` / `cmd+alt+а` → `F8`
- `cmd+j` / `cmd+о` → `F9`
- `cmd+k` / `cmd+л` → `F10`
- `cmd+u` / `cmd+г` → `F12`

Не подтверждено через kitty-layer: `F3`, `F11`. Но они подтверждены через `alacritty/alacritty.toml`: `cmd+a → F3`, `cmd+f → F11`.

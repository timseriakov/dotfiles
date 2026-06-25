# Tmux Setup Guide

Краткий user-facing справочник по текущей tmux-настройке.

## Daily cheat sheet

Если забыл почти всё, помни это:

- `Ctrl-a` — leader
- `Ctrl-a c` — новое окно
- `Ctrl-a Enter` — split horizontal
- `Ctrl-a =` — split vertical
- `cmd+f` / `cmd+а`, `cmd+alt+f` / `cmd+alt+а` — persistent / ephemeral popup shell
- `Ctrl-a s` or `cmd+s` / `cmd+ы` — session picker
- `Ctrl-a S` — popup session picker
- `Ctrl-a w` — workmux dashboard popup
- `Ctrl-a v` — copy-mode
- `y` / `Enter` — копировать в copy-mode
- `q` — выйти из copy-mode
- `Ctrl-a r` — reload config
- `cmd+j` / `cmd+о`, `cmd+k` / `cmd+л` — предыдущее / следующее окно

## Что это за setup

Эта настройка делает из tmux рабочую оболочку, а не просто мультиплексор:

- `Ctrl-a` — основной leader
- перед tmux-командами раскладка старается переключиться в English
- окна автоматически переименовываются по активному процессу
- есть popup shell, monitor session, session picker, интеграция с `workmux`
- мышь, copy-mode и status line настроены ближе к GUI/tab UX

## Где что лежит

- `~/.tmux.conf` — основной конфиг
- `tmux/pane-app-name.sh` — вычисляет имя окна по реальному процессу
- `tmux/title-mappings.conf` — сокращения и иконки приложений
- `tmux/popup-shell.sh` — popup shell
- `tmux/sesh-fzf-picker.sh` — session picker
- `fish/functions/tmux.fish` — wrapper вокруг `tmux`
- `fish/functions/tmux-monitor.fish` — monitor session
- `fish/conf.d/90-tmux-hooks.fish` — refresh title после команд

## Базовые принципы

### Leader

- главный leader: `Ctrl-a`
- встроенный `Ctrl-b` отключён
- двойной `Ctrl-a` отправляет literal `Ctrl-a` в приложение

### Русская раскладка

Во многих биндах есть дубли под RU layout. Примеры:

- `r` / `к`
- `v` / `м`
- `y` / `н`
- `q` / `й`
- `e` / `у`
- `w` / `ц`

Если забыл переключить раскладку, часть биндов всё равно сработает.

## Таблица основных биндов

### Everyday

| Клавиша            | Действие                                                       |
| ------------------ | -------------------------------------------------------------- |
| `Ctrl-a`           | leader                                                         |
| `Ctrl-a r`         | reload config                                                  |
| `Ctrl-a c`         | новое окно в текущей директории                                |
| `Ctrl-a Enter`     | split horizontal                                               |
| `Ctrl-a =`         | split vertical                                                 |
| `cmd+t` / `cmd+е`  | новое окно через kitty → `F1`                                  |
| `cmd+a` / `cmd+ф`  | новое окно через kitty → `F1`                                  |
| `cmd+q` / `cmd+й`  | убить pane через kitty → `F2`                                  |
| `alacritty: cmd+a` | убить окно через alacritty → `F3`                              |
| `cmd+enter`        | horizontal split через kitty → `F4`                            |
| `cmd+z` / `cmd+я`  | zoom/unzoom pane через kitty → `F5`                            |
| `cmd+r` / `cmd+к`  | rename window через kitty → `F6`                               |
| `cmd+s` / `cmd+ы`  | session picker через kitty → `Ctrl-a s`                        |
| `cmd+j` / `cmd+о`  | предыдущее окно через kitty → `F9`                             |
| `cmd+k` / `cmd+л`  | следующее окно через kitty → `F10`                             |
| `cmd+h` / `cmd+р`  | предыдущая session, кроме popup/alacritty/monitor → `Ctrl-a (` |
| `cmd+l` / `cmd+д`  | следующая session, кроме popup/alacritty/monitor → `Ctrl-a )`  |

### Layout / move

| Клавиша                     | Действие                                  |
| --------------------------- | ----------------------------------------- |
| `Ctrl-a i`                  | переместить окно перед указанным индексом |
| `Ctrl-a u`                  | swap окна с указанным индексом            |
| `Ctrl-a m`                  | перенести pane в выбранное окно           |
| `Ctrl-a M`                  | втянуть pane из другого окна в текущее    |
| `Ctrl-a E`                  | `select-layout -E`                        |
| click по status line        | перейти в окно                            |
| middle click по status line | закрыть окно                              |

### Popup / sessions

| Клавиша                   | Действие                                                         |
| ------------------------- | ---------------------------------------------------------------- |
| `cmd+f` / `cmd+а`         | persistent popup shell через kitty → `F7`                        |
| `cmd+alt+f` / `cmd+alt+а` | ephemeral popup shell через kitty → `F8`                         |
| `Ctrl-a f`                | promote popup в окно (только внутри popup)                       |
| `Ctrl-a g`                | promote popup в vertical split (только внутри popup)             |
| `Ctrl-a G`                | promote popup в horizontal split (только внутри popup)           |
| `Ctrl-a s`                | `sesh` session picker                                            |
| `cmd+s` / `cmd+ы`         | `sesh` session picker через kitty                                |
| `cmd+h` / `cmd+р`         | previous session через kitty; пропускает popup/alacritty/monitor |
| `cmd+l` / `cmd+д`         | next session через kitty; пропускает popup/alacritty/monitor     |
| `Ctrl-a C`                | создать named session                                            |
| `Ctrl-a X`                | убить текущую session                                            |
| `Ctrl-a S`                | popup session picker                                             |
| `Ctrl-a @`                | вынести pane в отдельную session                                 |

### Workmux

| Клавиша         | Действие                                 |
| --------------- | ---------------------------------------- |
| `Ctrl-a e`      | `workmux sidebar`                        |
| `Ctrl-a b`      | `choose-tree -Zw`                        |
| `Ctrl-a w`      | popup `workmux dashboard -s`             |
| `Ctrl-a W`      | full `workmux dashboard`                 |
| `Alt+Tab`       | открыть sidebar и выбрать next agent     |
| `Alt+Shift+Tab` | открыть sidebar и выбрать previous agent |
| `Tab`           | `workmux last-agent`                     |
| `L`             | `workmux last-done`                      |

### Copy mode

| Клавиша    | Действие                                                    |
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

### Search helpers

| Клавиша            | Действие                                                            |
| ------------------ | ------------------------------------------------------------------- |
| `alacritty: cmd+f` | copycat search через alacritty → `F11`                              |
| `cmd+u` / `cmd+г`  | copycat mode для URL/path/session-like шаблонов через kitty → `F12` |
| `Ctrl-a ?`         | copycat search                                                      |
| `Ctrl-a /`         | search по scrollback через fuzzback                                 |

## Popup shell

Есть два режима popup shell.

### Persistent

Открывается через:

- `cmd+f` / `cmd+а`

Что делает:

- открывает popup через отдельную session, привязанную к текущей tmux-вкладке
- popup state сохраняется для этой вкладки между открытиями
- `Ctrl-a f` внутри самого popup переносит текущее popup-окно в обычное окно родительской tmux-session
- `Ctrl-a g` внутри самого popup переносит его в vertical split родительского окна
- `Ctrl-a G` внутри самого popup переносит его в horizontal split родительского окна
- вне popup `Ctrl-a f`, `Ctrl-a g` и `Ctrl-a G` ничего не делают

### Ephemeral

Открывается через:

- `cmd+alt+f` / `cmd+alt+а`
- `Ctrl-a F`

Что делает:

- открывает ephemeral popup для текущей tmux-вкладки
- session пересоздаётся каждый раз
- session удаляется после закрытия
- удобно для одноразовых задач

## Session picker

Открывается через:

- `Ctrl-a s`
- `cmd+s` / `cmd+ы`
- `cmd+h` / `cmd+р` для previous session, пропуская popup/alacritty/monitor
- `cmd+l` / `cmd+д` для next session, пропуская popup/alacritty/monitor

Внутри picker:

- `Ctrl-a` — показать всё
- `Ctrl-t` — только tmux sessions
- `Ctrl-g` — config targets
- `Ctrl-s` — поиск директорий через `fd`
- `Ctrl-x` — kill session
- `Tab` / `Shift-Tab` — навигация

## Popup session picker

Открывается через:

- `Ctrl-a S`

Что делает:

- показывает только popup sessions
- отображает label проекта, текущую команду и тип popup
- справа показывает metadata header и live preview содержимого session
- выбирает popup session напрямую через tmux

## Workmux integration

Этот tmux-конфиг глубоко завязан на `workmux`.

Самое полезное:

- `Ctrl-a e` — sidebar
- popup shell (`cmd+f` / `cmd+alt+f`) перед открытием автоматически закрывает `workmux sidebar` в текущем окне, если он открыт
- `Ctrl-a w` — popup dashboard
- `Ctrl-a W` — full dashboard
- `Alt+Tab` — сначала пытается `workmux sidebar next`, а если sidebar ещё не открыт — открывает sidebar и повторяет переключение; если переключать некуда, tmux не показывает ошибку
- `Alt+Shift+Tab` — то же самое, но через `workmux sidebar prev`; для совместимости повешено и на `M-S-Tab`, и на `M-BTab`
- `Tab` — прыгнуть к last agent
- `L` — прыгнуть к last done

## Автоматические названия окон

Включён `automatic-rename` с кастомной логикой.

Что это даёт:

- окно обычно называется по реальному активному процессу, а не по shell-wrapper
- названия сокращаются и иконизируются через `tmux/title-mappings.conf`
- итог обычно выглядит как:
  - `󱋊 /dotfiles`
  - ` /project`
  - ` /tmp`

Если названия не обновляются, смотреть сюда:

- `tmux/pane-app-name.sh`
- `fish/conf.d/90-tmux-hooks.fish`
- `automatic-rename-format` в `~/.tmux.conf`

## Monitor session

Есть отдельная служебная session: `monitor`.

Что внутри обычно живёт:

- `btop`
- `battery` (`jolt`)
- `ports` (`snitch -t -l -e`)
- `network` (`netwatch`)
- `disk` (`duf`)
- `asitop`

Как использовать:

- `tmux-monitor` — перейти/attach к monitor session
- `tmux-monitor --no-attach` — только создать/обновить её

## Clipboard / mouse / terminal

### Clipboard

- включён `set-clipboard on`
- подключён `tmux-yank`
- часть copy-mode сценариев использует `pbcopy`

### Mouse

- click по pane фокусит pane
- если pane уже активна, click передаётся приложению
- выделение мышью не выбрасывает из copy-mode
- status line кликабельна как tab bar

### Terminal

Настройка оптимизирована под:

- macOS
- Kitty
- Fish
- Neovim

Если странно ведут себя `Esc`, функциональные клавиши, passthrough или focus, смотреть terminal settings в `~/.tmux.conf`.

## tmux-palette local patch

`eduwass/tmux-palette` is installed by TPM under `~/.tmux/plugins/tmux-palette`.
After plugin updates, reapply these tiny local patches if `Ctrl-d` / `Ctrl-u` stop paging the palette like Vim, or user commands stop appearing before built-ins:

```ts
// ~/.tmux/plugins/tmux-palette/src/palette.ts
const NAV_KEYS: Record<string, number> = {
  "\x1b[A": -1,
  "\x10": -1,
  "\x1b[B": 1,
  "\x0e": 1,
  "\x15": -10, // Ctrl-u: page up
  "\x04": 10, // Ctrl-d: page down
  "\x1b[5~": -10,
  "\x1b[6~": 10,
};
```

```ts
// ~/.tmux/plugins/tmux-palette/src/cli.ts
const merged = [...extras, ...baseItems].filter((i) => !hidden.has(i.title));
```

Check after patch:

```sh
cd ~/.tmux/plugins/tmux-palette && bun test
```

## Recovery / persistence

Подключены:

- `tmux-resurrect`
- `tmux-continuum`

Полезно помнить:

- `Ctrl-a Ctrl-s` — save
- `Ctrl-a Ctrl-r` — restore

## Зависимости

Конфиг предполагает наличие ряда внешних инструментов:

- `tmux`
- `fish`
- `kitty`
- `im-select`
- `tpm`
- `sesh`
- `fzf-tmux`
- `fd`
- `workmux`
- `pbcopy`
- `btop`
- `jolt`
- `snitch`
- `netwatch`
- `duf`
- `asitop`

Если какая-то функция не работает, сначала проверить наличие этих утилит.

## Быстрый debug checklist

### Не работает leader / странные бинды

Смотреть:

- prefix section в `~/.tmux.conf`
- `@switch_to_english_cmd`
- наличие `im-select`

### Не обновляются названия окон

Смотреть:

- `tmux/pane-app-name.sh`
- `fish/conf.d/90-tmux-hooks.fish`
- `automatic-rename-format`

### Не работает popup shell

Смотреть:

- `tmux/popup-shell.sh`
- бинды `cmd+f` / `cmd+а`, `cmd+alt+f` / `cmd+alt+а` и `Ctrl-a f/F`

### Не работает session picker

Смотреть:

- `tmux/sesh-fzf-picker.sh`
- наличие `sesh`, `fzf-tmux`, `fd`

### Не работает monitor session

Смотреть:

- `fish/functions/tmux.fish`
- `fish/functions/tmux-monitor.fish`
- наличие `btop`, `jolt`, `snitch`, `netwatch`, `duf`, `asitop`

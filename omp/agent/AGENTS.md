## Kitty/tmux/Yazi image preview — не ломать

Текущая связка Kitty + tmux + dual-yazi показывает картинки в терминале правильно. Это хрупкая рабочая настройка, не заменяй её на upstream `yazi`, Chafa fallback или дефолтные tmux terminal settings.

Инварианты:

- `command -v yazi` → `/Users/tim/.local/bin/yazi`.
- `fish/conf.d/10-path.fish` держит `~/.local/bin` впереди Homebrew через `fish_add_path -gpm ~/.local/bin`.
- `.tmux.conf` держит `allow-passthrough on`, `TERM`, `TERM_PROGRAM`, `xterm-kitty:passthrough:clipboard:ccolour:cstyle:focus:title:RGB`, `default-terminal "xterm-kitty"`, `terminal-overrides ",xterm-kitty:Tc"`.
- dual-yazi 26.3.0 локально собран с `B::Tmux => vec![A::Kgp]` в `yazi-adapter/src/adapters.rs`.

Если правишь Kitty/tmux/Fish PATH/Yazi/Chafa/терминальные картинки — сначала сохрани эти инварианты. Подробный rebuild/verify recipe лежит в `/Users/tim/dev/dotfiles/AGENTS.md`, раздел `Dual-Yazi tmux Kitty Image Preview`.

## Hunk — live diff review (используй автоматически)

У пользователя установлен hunk — терминальный просмотрщик diff'ов с поддержкой живых сессий.

### Когда использовать

- **Пользователь просит посмотреть изменения, сделать code review** → проверь, запущен ли hunk.
- **Ты видишь `hunk diff` в списке процессов или активных сессий** → используй `hunk session *`.
- **Подходит для любого обсуждения diff'а** — открой сам или предложи пользователю открыть.

### Как работать

Сначала проверь, есть ли живая сессия:

```bash
hunk session list
```

Если есть — используй её. Если нет — предложи пользователю открыть `hunk diff` через palette (`cmd+p` → Review Changes).

Дальше стандартный flow:

```bash
hunk session review --repo . --json            # посмотреть структуру
hunk session navigate --file F --hunk N        # листать файлы и хунки
hunk session comment add --file F --new-line N --summary "..."  # заметки
```

### Skill

Полный скилл со всеми командами:

```
skill://hunk-review
```

Загружай если нужно больше деталей по конкретной команде.

## Web search providers

Never pass `auto` or status labels such as `parallel-env/parallel`; they are not accepted provider arguments. Start with `provider: "parallel"`. If the call errors, times out, is rate-limited, or returns no useful results, retry the same query with `serper`, then `tavily`, then `exa`, stopping at the first useful result. For important claims requiring corroboration, search with at least two of these providers independently.

## Desktop and browser routing

Native macOS desktop accessibility and UI actions default to Agent Desktop. Read its OMP skills `~/.omp/agent/skills/agent-desktop/SKILL.md` and `~/.omp/agent/skills/agent-desktop-macos/SKILL.md` (or their project-owned source paths). If the active session says `Unknown skill`, read these files directly; OMP holds a per-session skill snapshot, and CLI `agent-desktop skills get ...` prints bundled guides but does not load a missing OMP skill. For exact CLI command syntax, consult the loaded skill, bundled guide, or `<command> --help`. Never silently restart the user's session.

- Web pages and browser automation: default to `ego-browser` (`ego-browser skill` for its current guide). Agent Desktop is not a webpage tool. Use Helium through OMP Browser Relay only when the task needs an existing Helium tab or ego-browser is unsuitable, and only with per-call `app.relay=true` plus an explicit intended `app.target`; never target a random/foreground tab or enable Relay globally.
- Check permissions read-only when unknown. Do not request/grant permissions or open System Settings unless the user explicitly asks. MCP calls go through MCPProxy only.

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

<!-- plannotator-inbox:start v1 · added by Plannotator. Remove it in the Inbox's Settings or with `plannotator uninstall` -->

## Plannotator Inbox

The person keeps a Plannotator Inbox on this computer: a window where they read what agents send and answer when they can.
If you have a `plannotator_inbox` tool or a `plannotator-inbox` MCP server, use its `send_message` when the person isn't here to answer in this chat: to ask a decision only they can make (as a `:::question` block), or to hand over finished long work (put the files to read in `attachments`). Then keep working.
Their reply comes back to this session by itself where your agent supports that; otherwise read the thread later with `read_thread`. When they are here, ask in this chat instead.

<!-- plannotator-inbox:end -->

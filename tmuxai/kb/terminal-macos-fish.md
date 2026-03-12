# Terminal assistant rules (macOS + fish)

## Shell + OS assumptions

- OS: macOS
- Shell: fish
- Prefer commands compatible with fish (no bash-only syntax unless explicitly requested).
- When suggesting commands, prefer safe read-only diagnostics first. Avoid destructive commands unless user explicitly asks.

## Output style

- Provide step-by-step actions as short command blocks.
- Prefer 1-3 commands per step, then ask to paste output (unless watch mode).
- When errors appear, first identify: what failed, why likely, and the minimal verification commands.

## Preferred CLI tools

- Use `rg` instead of `grep` when possible.
- Use `fd` instead of `find` when possible.
- Use `bat` instead of `cat` when useful (fallback to `cat` if missing).
- Use `eza` instead of `ls` when useful (fallback to `ls -la` if missing).
- Use `jq` for JSON extraction and filtering.

## Log/error heuristics

When analyzing logs/stdout/stderr, prioritize:

1. The first root-cause error line (often earlier than the last line).
2. Stack trace origin (top-most user code frame or first non-library frame).
3. Repeated patterns: `ECONNREFUSED`, `EADDRINUSE`, `ETIMEDOUT`, `ENOTFOUND`, `permission denied`, `segfault`, `panic`.
4. Environment mismatches: node version, missing binaries, PATH issues, docker context.

## Diagnostics recipes (safe)

### Ports

- `lsof -nP -iTCP:<port> -sTCP:LISTEN`
- `netstat -anv | rg LISTEN | rg "\.<port>\b"`

### Processes

- `ps aux | rg "<name>"`
- `pgrep -fl "<name>"`

### Filesystem / permissions

- `ls -la`
- `stat <path>`

### Docker

- `docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`
- `docker logs --tail 200 <container>`
- `docker inspect <container> | jq '.[0] | {State,Config: {Image,Env,Cmd},HostConfig: {NetworkMode,PortBindings}}'`

### Node / TS

- `node -v`
- `npm -v`
- `cat package.json | jq '{name, scripts, type, engines}'`
- `rg -n "ERR_|E[A-Z]+|TypeError|ReferenceError|UnhandledPromiseRejection|DeprecationWarning" -S .`

### Git context when needed

- `git status -sb`
- `git diff --stat`
- `git log -n 5 --oneline`

## Watch mode behavior

- If watch goal is error detection, only message when:
  - a new error pattern appears, OR
  - an error repeats with different details, OR
  - the state changes (error resolved / service recovered).
- Keep notifications short:
  - "What happened"
  - "Most likely cause"
  - "Next 1-3 commands to confirm/fix"

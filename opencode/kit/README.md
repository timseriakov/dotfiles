# CliKit Plugin for OpenCode

Turn raw OpenCode into a disciplined delivery workflow: **discuss → create → start → verify → ship**.

CliKit is the workflow layer for OpenCode — curated agents, slash commands, runtime hooks, memory artifacts, and quality gates that help you move from vague request to verified change without inventing your process every session.

_README structure inspired by [GSD / get-shit-done](https://github.com/gsd-build/get-shit-done) and [OpenCodeKit](https://opencodekit.xyz/)._

## Why CliKit exists

OpenCode is powerful, but the hard part is not calling a model — it is keeping planning, execution, verification, and handoff aligned as the task gets bigger.

CliKit adds that missing structure:

- **Workflow orchestration** — opinionated commands for discuss/create/start/verify/ship
- **Agent library** — specialized roles for build, plan, explore, review, research, oracle, and vision
- **Memory system** — discussion, plan, research, review, and handoff artifacts that survive across sessions
- **Safety + quality hooks** — git guard, security checks, truncation, memory digest, and prompt-context helpers
- **Verification loop** — compressed packet execution plus explicit verification before landing changes

## Start here

### Install in 3 steps

```bash
# 1) Install Beads Rust for local task tracking
br --version

# 2) Initialize tracker state in your project
br init

# 3) Install CliKit for OpenCode
bun x clikit-plugin install
```

Need the full install notes, Windows binary path, or MCP details? Jump to [Installation](#installation).

### Pick a workflow

**Quick feature / fix**

```text
/discuss → /create → /start → /verify → /ship
```

**Deeper feature / research-heavy change**

```text
/discuss → /create → /design → /start → /verify → /ship
```

**Audit existing work before landing**

```text
/verify → /ship
```

## What you get

- **7 specialized agents** — build, plan, explore, review, vision, oracle, research
- **14 slash commands** — including `/discuss`, `/create`, `/start`, `/verify`, `/ship`, `/debug`, `/research`, `/design`, `/status`
- **26 workflow skills** — planning, debugging, testing, integration, and session-management skills
- **11 runtime hooks/modules** — git guard, security check, truncator, memory digest, beads context, tilth reading, and more
- **Structured memory** — templates plus saved discussions, plans, research, reviews, handoffs, and PRDs
- **Configurable runtime** — per-agent overrides, hook toggles, workflow mode selection, and extended permissions

## Trust & compatibility

- **OpenCode-first** plugin architecture
- **Compressed workflow** with packetized execution and embedded verification
- **Beads Rust (`br`)** as the preferred local tracker workflow
- **Shared-workspace friendly** defaults with optional legacy `beads-village` compatibility
- **Published package**: [`clikit-plugin` on npm](https://www.npmjs.com/package/clikit-plugin)

## Docs map

- `README.md` — install, workflows, commands, skills, config
- `AGENTS.md` — repo-wide execution policy and tracker workflow
- `command/` — slash command definitions and execution rules
- `src/agents/` — agent prompts and behavior contracts
- `skill/` — reusable workflow skills
- `schemas.md` — canonical packet / artifact / tracker schemas
- `memory/_templates/` — discussion, plan, research, review, PRD, and handoff templates

---

## Features

- **7 Specialized Agents**: build, plan, explore, review, vision, oracle, research
- **14 Slash Commands**: /discuss, /create, /start, /ship, /verify, /debug, /design, /research, /commit, /pr, and more
- **26 Workflow Skills**: TDD, debugging, research, integrations, ritual-workflow, and more
- **7 Internal Utilities**: memory (read/search/get/timeline/update/admin), observation, context-summary, cass-memory (used by hooks, not directly registered as agent tools)
- **11 Runtime Hooks/Modules**: todo enforcer, empty output sanitizer, git guard, security check, subagent blocker, truncator, memory digest, todo→beads sync, beads-context, cass-memory, and tilth-reading
- **Memory System**: Templates, discussions, plans, research artifacts with FTS5 search
- **Extended Permissions**: doom_loop, external_directory controls
- **Configurable**: Enable/disable agents, override models, customize behavior

## Installation

### Step 1 — Install Beads Rust (`br`)

CliKit now prefers [beads_rust](https://github.com/Dicklesworthstone/beads_rust) (`br`) for persistent task tracking in `.beads/`. Classic `bd` + Dolt are no longer required for the default workflow.

**Windows (native binary):**

1. Download the latest `br-v*-windows_amd64.zip` asset from the GitHub Releases page.
2. Extract `br.exe`.
3. Place it on your `PATH` (for example under `%APPDATA%\npm`).

**macOS / Linux / Windows via WSL:**

```bash
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/beads_rust/main/install.sh" | bash
```

Verify:

```bash
br --version
```

### Step 2 — Initialize `.beads/` in your project

```bash
cd your-project
br init
```

This creates the `.beads/` task-tracking directory. Do this once per project. If `.beads/` already exists, keep it and use `br sync --import-only` after pulling or rebasing older state.

### Step 3 — Install CliKit

```bash
# Install CliKit globally for OpenCode
bun x clikit-plugin install

# Restart OpenCode
```

The plugin is registered in `~/.config/opencode/opencode.json`.

CliKit injects default MCP server entries at runtime when missing:

- `context7` (`https://mcp.context7.com/mcp`)
- `grep` (`https://mcp.grep.app`)
- `human-mcp` (`npx @goonnguyen/human-mcp`)

`beads-village` is no longer injected by default. If you still rely on the legacy MCP workflow for reservations or inbox-style coordination, add it manually.

Recommended environment variables:

- `CONTEXT7_API_KEY` for Context7
- `GOOGLE_GEMINI_API_KEY` for Human MCP

## Quick Start

After installation, use these commands:

**Quick mode** (simple features):

```
/discuss → /create → /start → /verify → /ship
```

**Deep mode** (complex features, research, UI):

```
/discuss → /create → /design → /start → /verify → /ship
```

Workflow notes:

- All 14 commands work **standalone** - the pipeline is recommended, not required
- `/discuss` runs a pre-create discussion phase — clarify intent, confirm assumptions, and save a planning-ready discussion artifact
- `/create` explores codebase first, consumes discussion context, runs a mandatory pre-plan research pass, then produces a single XML-structured plan
- `/start` executes the plan, one Task Packet at a time — creates a minimal inline plan if none exists
- `/verify` runs all 4 gates (typecheck, tests, lint, build) + deep review — use anytime, not just pre-ship
- `/ship` finalizes work in the shared checkout — commit, sync, and land on the repo default branch; `/pr` is optional and only for explicit PR-based exceptions
- `/research` is an optional standalone research command — it reads discussion context first, closes decision gaps with external evidence, and saves a planning-ready report
- `/design` implements UI/UX with variant exploration and a11y — uses Vision agent
- `br` + `.beads/` is the preferred persistent task source of truth; `beads-village` is optional legacy compatibility only
- Plans decompose work into **Task Packets** (1 concern, 1–3 files, one verify bundle)

## Configuration

Create `clikit.jsonc` (preferred) or `clikit.json` in one of these locations:

- **User (global)**:
  - Linux/macOS: `~/.config/opencode/clikit.jsonc` (or `clikit.json`)
  - Windows: `%APPDATA%\opencode\clikit.jsonc` (or `clikit.json`)
- **Project**: `.opencode/clikit.jsonc` (or `clikit.json`)

Legacy `clikit.config.json` is still supported for backward compatibility.

Project config overrides user config.

### Example Configuration

```json
{
  "$schema": "https://unpkg.com/clikit-plugin@latest/schema.json",
  "disabled_agents": ["review"],
  "disabled_commands": ["security"],
  "disabled_skills": ["playwright"],
  "skills": {
    "enable": ["test-driven-development", "systematic-debugging"],
    "disable": ["sharing-skills"]
  },
  "agents": {
    "vision": {
      "model": "openai/gpt-4o"
    },
    "build": {
      "model": "anthropic/claude-sonnet-4-5-20250514",
      "temperature": 0.2,
      "permission": {
        "doom_loop": "deny",
        "external_directory": "ask"
      }
    }
  },
  "hooks": {
    "session_logging": false,
    "tool_logging": false,
    "todo_enforcer": {
      "enabled": true,
      "beads_authoritative": true,
      "warn_on_incomplete": false
    },
    "empty_message_sanitizer": { "enabled": true },
    "git_guard": { "enabled": true },
    "security_check": { "enabled": true },
    "subagent_question_blocker": { "enabled": true },
    "truncator": { "enabled": true, "packet_friendly": true },
    "memory_digest": { "enabled": true, "compact_mode": true },
    "todo_beads_sync": { "enabled": false, "mode": "disabled" },
    "cass_memory": { "enabled": true },
    "beads_context": { "enabled": true, "active_only": true, "ready_limit": 3 }
  },
  "workflow": {
    "mode": "compressed",
    "active_roles": ["build", "plan", "review", "coordinator"],
    "use_packets": true,
    "embed_verify_in_start": true,
    "verify_is_audit": true,
    "subagent_call_budget": 2
  }
}
```

### Configuration Options

| Option                  | Type                    | Default      | Description                                    |
| ----------------------- | ----------------------- | ------------ | ---------------------------------------------- |
| `disabled_agents`       | `string[]`              | `[]`         | Agent names to disable                         |
| `disabled_commands`     | `string[]`              | `[]`         | Command names to disable                       |
| `disabled_skills`       | `string[]`              | `[]`         | Skill names to disable                         |
| `agents`                | `object`                | `{}`         | Per-agent overrides (model, temperature, etc.) |
| `commands`              | `object`                | `{}`         | Per-command overrides                          |
| `skills`                | `object \| string[]`    | `{}`         | Skill enable/disable and per-skill overrides   |
| `hooks.session_logging` | `boolean`               | `false`      | Session lifecycle logging                      |
| `hooks.tool_logging`    | `boolean`               | `false`      | Tool execution logging                         |
| `workflow.mode`         | `classic \| compressed` | `compressed` | Select compressed packet workflow              |

### Hooks

| Hook                        | Default | Description                                                                                                        |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `todo_enforcer`             | on      | Optional UI warning; Beads can remain authoritative                                                                |
| `empty_message_sanitizer`   | on      | Replaces empty tool outputs with placeholder                                                                       |
| `git_guard`                 | on      | Blocks dangerous git commands (force push, hard reset, rm -rf)                                                     |
| `security_check`            | on      | Scans for secrets/credentials before git commits                                                                   |
| `subagent_question_blocker` | on      | Prevents subagents from asking clarifying questions                                                                |
| `truncator`                 | on      | Truncates large outputs to prevent context overflow                                                                |
| `memory_digest`             | on      | Generates `memory/_digest.md` index + topic files (`decision.md`, `learning.md`, etc.) from SQLite observations    |
| `todo_beads_sync`           | off     | Legacy compatibility mirror for syncing todos into `.beads/` exports                                               |
| `beads_context`             | on      | Injects active `.beads/` task state into prompts when local Beads data exists                                      |
| `cass_memory`               | on      | Loads embedded memory context on session start and runs idle reflection (`cassMemoryContext`, `cassMemoryReflect`) |
| `tilth_reading`             | on      | Enhances `read` tool output via tilth when available for smarter file reads                                        |

## Agents

| Agent      | Mode     | Description                                                                                                       |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `build`    | primary  | Primary code executor, implements plans                                                                           |
| `plan`     | primary  | Handles `/discuss` intent locking and `/create` planning, producing discussion artifacts and XML-structured plans |
| `oracle`   | subagent | Deep code inspection + architecture trade-off analysis                                                            |
| `research` | subagent | External evidence specialist; writes research artifacts for `/research` and Plan's pre-plan pass                  |
| `explore`  | subagent | Fast codebase exploration                                                                                         |
| `review`   | subagent | Code review & quality gate                                                                                        |
| `vision`   | subagent | Design direction + visual implementation                                                                          |

Default active roles in compressed workflow: `build`, `plan`, `review`, plus coordinator logic in runtime. `explore`, `research`, `oracle`, and `vision` are on-demand specialists.

## Commands

Run with `/command-name` in OpenCode. **All 14 commands work standalone** — the pipeline is a recommended flow, not a requirement.

### Workflow pipeline

| Command     | Standalone? | One-liner                                                                                                           |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `/discuss`  | ✅          | Pre-create discussion phase — lock intent, confirm assumptions, save planning-ready artifact                        |
| `/create`   | ✅          | Explore codebase → load discussion context → run mandatory pre-plan research → produce a single XML-structured plan |
| `/research` | ✅          | Optional standalone research pass — read discussion context, gather evidence, save planning-ready report            |
| `/design`   | ✅          | UI/UX design + implementation — variant exploration, a11y, responsive (Vision agent)                                |
| `/start`    | ✅          | Execute plan packets — creates minimal inline plan if none exists                                                   |
| `/ship`     | ✅          | Commit + land shared-checkout changes on the default branch — self-review built in, `/verify` recommended           |
| `/verify`   | ✅          | Full 4-gate check (typecheck, tests, lint, build) + deep code review                                                |

### Utilities (all standalone)

| Command    | One-liner                                                            |
| ---------- | -------------------------------------------------------------------- |
| `/debug`   | Reproduce → 5-Whys root cause → fix → regression test                |
| `/status`  | Workspace snapshot — task tracker state, git state, active artifacts |
| `/init`    | Bootstrap CliKit — scaffold dirs + write tailored AGENTS.md          |
| `/handoff` | Auto-capture session state for graceful pause                        |
| `/resume`  | Pick up cold from latest handoff, no warm-up questions               |
| `/commit`  | Auto-detect type/scope → perfect Conventional Commit message         |
| `/pr`      | Optional PR flow for explicit branch-based review exceptions         |

## Skills

22 workflow skills organized into 5 categories:

> `using-git-worktrees` and `finishing-a-development-branch` are legacy skill names kept for compatibility. Their current guidance follows the shared-workspace, direct-to-default-branch workflow.

### Planning & Workflow (4)

| Skill                | Use When                                           |
| -------------------- | -------------------------------------------------- |
| `writing-plans`      | Requirements clear, need implementation plan       |
| `executing-plans`    | Plan exists, need to execute tasks                 |
| `ritual-workflow`    | Starting any task — DISCOVER→PLAN→IMPLEMENT→VERIFY |
| `session-management` | Managing context growth or switching tasks         |

### Development (4)

| Skill                            | Use When                                                                |
| -------------------------------- | ----------------------------------------------------------------------- |
| `deep-research`                  | Exploring unfamiliar code or complex features                           |
| `source-code-research`           | API docs insufficient, need library internals                           |
| `using-git-worktrees`            | Legacy alias — shared checkout on the default branch, no worktrees      |
| `finishing-a-development-branch` | Legacy alias — finish and land from the shared default-branch workspace |

### Testing & Quality (5)

| Skill                            | Use When                              |
| -------------------------------- | ------------------------------------- |
| `test-driven-development`        | Implementing any feature              |
| `condition-based-waiting`        | Flaky tests from race conditions      |
| `testing-anti-patterns`          | Avoiding testing mistakes             |
| `verification-before-completion` | Marking any task complete             |
| `vercel-react-best-practices`    | React/Next.js code review or refactor |

### Debugging (3)

| Skill                  | Use When                 |
| ---------------------- | ------------------------ |
| `systematic-debugging` | Encountering a bug       |
| `root-cause-tracing`   | Finding original trigger |
| `defense-in-depth`     | Multi-layer validation   |

### Integration & Collaboration (6)

| Skill                    | Use When                                                                          |
| ------------------------ | --------------------------------------------------------------------------------- |
| `beads`                  | Multi-agent task coordination with `br` and optional legacy beads-village helpers |
| `playwright`             | Browser automation and E2E testing                                                |
| `chrome-devtools`        | Web debugging and performance analysis                                            |
| `requesting-code-review` | After completing a task                                                           |
| `receiving-code-review`  | Handling review feedback                                                          |
| `writing-skills`         | Creating new skills                                                               |

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Type check
bun run typecheck

# Full local verification
bun run verify

# Watch mode
bun run dev
```

## Structure

```
.opencode/
├── src/
│   ├── index.ts      # Plugin entrypoint
│   ├── config.ts     # Config loader
│   ├── types.ts      # Type definitions
│   ├── agents/       # Agent loaders
│   ├── skill/        # Skill loaders
│   ├── tools/        # Internal utilities (memory, context-summary, cass-memory)
│   └── hooks/        # Runtime hooks (11 modules + index)
├── skill/            # Skill definitions (*.md)
├── command/          # Command definitions (*.md)
├── memory/           # Memory system
│   ├── _templates/   # Document templates (discussion, plan, research, handoff, review, PRD)
│   ├── discussions/  # Discussion artifacts
│   ├── plans/        # Implementation plans
│   ├── research/     # Research artifacts
│   ├── reviews/      # Code reviews
│   ├── handoffs/     # Session handoffs
│   ├── beads/        # Optional compatibility bead metadata
│   └── prds/         # Product requirements
└── clikit.jsonc
```

## License

MIT

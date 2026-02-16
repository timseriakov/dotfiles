# LikeC4 Agent Playbook

Use this playbook whenever the user asks to design, visualize, review, or evolve software architecture.

## Goal

Deliver architecture-as-code artifacts that are:

- executable (CLI commands work),
- versioned (DSL committed in repo),
- reviewable (clear views and relationships),
- up to date with code changes.

## Trigger Conditions

Apply this playbook when request mentions any of:

- architecture diagram
- C4 / context / container / component
- system landscape / boundaries / services
- dependency map / integration map
- "visualize architecture from code"

## Required Workflow

1. Define scope and audience:
- Identify system boundary and primary stakeholders.
- Pick minimal set of views (usually context + container first).

2. Locate or initialize model:
- Reuse existing LikeC4 model if present.
- Otherwise create a dedicated architecture folder (for example `docs/architecture/`).
- If no model exists, bootstrap from `/Users/tim/dev/dotfiles/opencode/templates/likec4-starter/docs/architecture/model.c4`.

3. Model structure first, then relationships:
- Create stable identifiers for systems, containers, components.
- Add technology and responsibility metadata.
- Add explicit directional relationships with concise labels.

4. Create focused views:
- Keep each view intentional; avoid "everything everywhere" views.
- Split large views into domain or team scopes.

5. Validate before handoff:
- Run `npx likec4 validate` and fix all errors.
- Run `npx likec4 start` for interactive preview.

6. Produce deliverables:
- For static publishing: `npx likec4 build -o ./dist`.
- For artifacts in docs/PRs: `npx likec4 export <format> -o <path>`.

## Quality Gates (must pass)

- No unnamed or ambiguous relationships.
- No orphaned elements that never appear in views.
- Naming is domain-oriented, not implementation-noise.
- Views are readable without explaining every line in chat.
- CLI validation passes.

## Default Output Contract

When task includes architecture changes, return:

1. Changed files list.
2. Commands executed and validation result.
3. What each view is for (one sentence per view).
4. Optional next step: export/publish command.

## Prompt Snippets for Agents

### Planner/Orchestrator Prompt

"Use LikeC4 to produce architecture-as-code changes. Create or update model files, add focused views (context/container/component as needed), validate with `npx likec4 validate`, and provide a preview/build command. Prefer small iterative updates over one massive diagram."

### Builder Prompt

"Implement the architecture model in LikeC4 DSL. Keep IDs stable, relationships explicit, and views readable. After edits, run `npx likec4 validate`; if valid, run `npx likec4 start` command suggestion and prepare optional `build`/`export` commands."

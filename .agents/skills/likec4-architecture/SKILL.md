---
name: likec4-architecture
description: Build and maintain software architecture as code with LikeC4 DSL. Use when tasks mention architecture diagrams, C4/context/container/component views, system landscape, dependency/integration maps, or when the user wants architecture generated/evolved from code. Apply for creating new `.c4`/`.likec4` models, updating existing models, validating with LikeC4 CLI, and preparing preview/build/export outputs.
---

# LikeC4 Architecture

Model software architecture in LikeC4, keep it executable, and return validation-backed outputs.

## Workflow

1. Scope the model:
- Identify system boundary and audience.
- Start with context and container views unless user asks otherwise.

2. Locate model files:
- Reuse existing `.c4`/`.likec4` files when present.
- If missing, bootstrap from `assets/likec4-starter/docs/architecture/model.c4`.

3. Model structure before visuals:
- Define stable element IDs and meaningful names.
- Add explicit directional relationships with short labels.
- Add technology/description fields where helpful.

4. Keep views focused:
- Build small, purposeful views.
- Split crowded diagrams by domain, team, or bounded context.

5. Validate and package:
- Run `npx likec4 validate` and fix all errors.
- Provide `npx likec4 start` preview command.
- If requested, provide `build`/`export` commands.

## Required Quality Gates

- Do not leave unlabeled ambiguous relationships.
- Do not leave orphan elements that never appear in views.
- Prefer domain names over implementation noise in element titles.
- Finish only after successful CLI validation.

## Command Set

Use the minimal commands needed for the task:

```sh
npx likec4 validate
npx likec4 start
npx likec4 build -o ./dist
npx likec4 export png -o ./assets/architecture
```

## Output Contract

When architecture files change, return:

1. Changed files.
2. Validation result.
3. One-line purpose for each view.
4. Preview/build/export command(s) relevant to the request.

## Resources

- CLI and modeling checklist: `references/likec4-checklist.md`
- Starter model template: `assets/likec4-starter/docs/architecture/model.c4`
- Bootstrap helper: `scripts/bootstrap_likec4_starter.sh`

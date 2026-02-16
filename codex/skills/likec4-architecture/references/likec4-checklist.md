# LikeC4 Checklist

## Modeling checklist

- Define clear element types and stable IDs.
- Name systems/containers/components using domain language.
- Label relationships with intent verbs (`Reads`, `Publishes`, `Calls`, `Consumes`).
- Keep each view legible without verbal explanation.

## Minimal deliverables by task type

- New architecture request:
  - model file with context + container views
  - validation command result
  - preview command
- Update architecture request:
  - changed views + changed relationships only
  - validation command result
- Documentation/export request:
  - build or export command and output path

## Common anti-patterns

- One giant view containing all elements.
- Relationship labels that say only `Uses` everywhere.
- Element names matching only repo folder names, not business concepts.
- Finishing without CLI validation.

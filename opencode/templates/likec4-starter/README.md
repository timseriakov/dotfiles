# LikeC4 Starter Template

Bootstrap for architecture-as-code in a new project.

## Files

- `docs/architecture/model.c4` - starter LikeC4 model with context and container views.

## Quick Start

1. Copy template into your project root:

```sh
cp -R /Users/tim/dev/dotfiles/opencode/templates/likec4-starter/docs ./
```

2. Validate:

```sh
npx likec4 validate
```

3. Run live preview:

```sh
npx likec4 start
```

4. Build static site:

```sh
npx likec4 build -o ./dist
```

5. Optional artifact export:

```sh
npx likec4 export png -o ./assets/architecture
```

## Agent Usage Rule

When no architecture model exists, start from this template and then adapt:

- rename element IDs to domain terms,
- update technologies and descriptions,
- keep relationship labels explicit,
- split views when a single view gets crowded.

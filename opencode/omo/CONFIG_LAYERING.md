# OmO Config Layering

This directory is an overlay layer on top of `../base/opencode.jsonc`.

## Merge order

1. `base/opencode.jsonc`
2. `omo/opencode.jsonc`
3. `omo/oh-my-openagent.jsonc` (symlink to the active OmO profile)

## Why this exists

- `base/` keeps the shared OpenCode setup so plain OpenCode can run without Oh My OpenAgent.
- `omo/` adds OmO-specific overrides without mutating the base profile.
- The active OmO agent/category routing should stay on logical `omniroute/*` aliases rather than hardcoded vendor model IDs.

## Current intent

- Keep OmO routing on logical aliases such as:
  - `omniroute/reasoning-main`
  - `omniroute/reasoning-cheap`
  - `omniroute/coding-main`
  - `omniroute/coding-cheap`
  - `omniroute/quick-free`
  - `omniroute/deep-premium`
  - `omniroute/research-fast`
  - `omniroute/writing-cheap`
- Keep provider/model metadata and manual provider whitelists in `base/opencode.jsonc` as the source of truth.
- Avoid enabling `google` in the OmO overlay unless there is a deliberate OmO-specific reason.
- Avoid changing `oh-my-openagent_omniroute.jsonc` unless routing itself must change.

## Safety rule for future edits

When updating OmniRoute combo metadata, treat context limits, modalities, and provider-specific options as unverified until they are confirmed by the active CLI behavior or the OmniRoute API. Use conservative values for heterogeneous combos.

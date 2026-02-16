#!/usr/bin/env bash
set -euo pipefail

# Copy the starter model into the current repository root.
SKILL_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$SKILL_DIR/assets/likec4-starter/docs"
DST="${1:-.}"

if [[ ! -d "$SRC" ]]; then
  echo "Starter template not found: $SRC" >&2
  exit 1
fi

mkdir -p "$DST"
cp -R "$SRC" "$DST/"

echo "Copied LikeC4 starter to $DST/docs/architecture/model.c4"
echo "Next: run 'npx likec4 validate'"

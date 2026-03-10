#!/bin/bash

#
# omo-release-watcher.sh
#
# Shell wrapper for the oh-my-openagent release watcher.
# Ensures OPENAI_API_KEY from fish/secrets.fish is available
# before running the Node.js watcher.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WATCHER_JS="$SCRIPT_DIR/omo-release-watcher.js"

# Source OPENAI_API_KEY from fish secrets
# fish vars use set -gx, convert to bash compatible format
if [ -f "$HOME/dev/dotfiles/fish/secrets.fish" ]; then
  # Extract OPENAI_API_KEY from fish set command
  OPENAI_API_KEY=$(grep '^set -gx OPENAI_API_KEY' "$HOME/dev/dotfiles/fish/secrets.fish" | sed 's/set -gx OPENAI_API_KEY //' | sed 's/^ *//' || true)
  export OPENAI_API_KEY
else
  echo "[ERROR] fish/secrets.fish not found in $HOME/dev/dotfiles/fish/"
  exit 1
fi

# Verify OPENAI_API_KEY was loaded
if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "[ERROR] OPENAI_API_KEY could not be extracted from fish/secrets.fish"
  exit 1
fi

if [ -z "${GITHUB_TOKEN:-}" ] && [ -f "$HOME/dev/dotfiles/fish/secrets.fish" ]; then
  GITHUB_TOKEN=$(grep '^set -gx GITHUB_TOKEN' "$HOME/dev/dotfiles/fish/secrets.fish" | sed 's/set -gx GITHUB_TOKEN //' | sed 's/^ *//' || true)
  if [ -n "$GITHUB_TOKEN" ]; then
    export GITHUB_TOKEN
  fi
fi

if [ -z "${GITHUB_TOKEN:-}" ] && command -v gh >/dev/null 2>&1; then
  GITHUB_TOKEN="$(gh auth token 2>/dev/null || true)"
  if [ -n "$GITHUB_TOKEN" ]; then
    export GITHUB_TOKEN
  fi
fi

# Run the Node.js watcher
exec /Users/tim/.volta/tools/image/node/22.22.0/bin/node "$WATCHER_JS" "$@"

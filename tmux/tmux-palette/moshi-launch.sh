#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
XDG_CONFIG_HOME="$ROOT/tmux/moshi-xdg" exec "$HOME/.tmux/plugins/tmux-palette/bin/tmux-palette.sh" "$@"

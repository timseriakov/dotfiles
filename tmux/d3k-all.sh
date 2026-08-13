#!/usr/bin/env bash
set -euo pipefail

window=${1:-}
project=/Users/tim/dev/my/urban-prime-mono
pane_script=${D3K_PANE_SH:-/Users/tim/dev/dotfiles/tmux/d3k-pane.sh}

if [[ -z "$window" || "$window" == '#{'* ]]; then
  window=$(tmux display-message -p '#{window_id}')
fi

if [[ -n "${D3K_CRM_PORT:-}" ]]; then
  crm_port=$D3K_CRM_PORT
else
  crm_port=$(cd "$project" && node scripts/wt-dev-env status | sed -n 's/^crm_port=//p')
fi

if [[ -z "$crm_port" ]]; then
  tmux display-message 'd3k:all: cannot determine CRM port'
  exit 1
fi

"$pane_script" left crm "$window"

crm_ready() {
  curl -fsSL --max-time 1 -o /dev/null "http://127.0.0.1:${crm_port}/admin"
}

for _ in {1..30}; do
  if ! crm_ready; then
    break
  fi
  sleep 0.5
done

if crm_ready; then
  tmux display-message "d3k:all: CRM did not stop on port ${crm_port}"
  exit 1
fi

for _ in {1..120}; do
  if crm_ready; then
    "$pane_script" right web "$window"
    exit 0
  fi
  sleep 1
done

tmux display-message "d3k:all: CRM did not become ready on port ${crm_port}"
exit 1

#!/usr/bin/env bash
set -euo pipefail

service=${1:-}
case "$service" in
  crm|web) ;;
  *)
    printf 'Usage: %s {crm|web} [project_path]\n' "${0##*/}" >&2
    exit 2
    ;;
esac

project=${2:-$PWD}
cd "$project"

project_key=$(printf '%s' "$project" | cksum | cut -d' ' -f1)
status_file=$(mktemp)
log_file=${D3K_LOG_FILE:-/tmp/d3k-restart-${service}-${project_key}.log}
{ pnpm "d3k:${service}:kill"; printf '%s' $? >"$status_file"; } >"$log_file" 2>&1 &
kill_pid=$!

for _ in {1..50}; do
  [[ -s "$status_file" ]] && break
  sleep 0.1
done

if [[ ! -s "$status_file" ]]; then
  kill "$kill_pid" 2>/dev/null || true
fi
wait "$kill_pid" 2>/dev/null || true
rm -f "$status_file"

exec pnpm "d3k:${service}"


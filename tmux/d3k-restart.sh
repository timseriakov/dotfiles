#!/usr/bin/env bash
set -euo pipefail

service=${1:-}
case "$service" in
  crm|web) ;;
  *)
    printf 'Usage: %s {crm|web}\n' "${0##*/}" >&2
    exit 2
    ;;
esac

cd /Users/tim/dev/my/urban-prime-mono

status_file=$(mktemp)
{ pnpm "d3k:${service}:kill"; printf '%s' $? >"$status_file"; } >"/tmp/d3k-restart-${service}.log" 2>&1 &
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


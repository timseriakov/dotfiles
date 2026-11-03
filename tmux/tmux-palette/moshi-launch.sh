#!/usr/bin/env bash
set -euo pipefail

TMUX_BIN="$(command -v tmux)"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
PLUGIN_DIR="$HOME/.tmux/plugins/tmux-palette"
CMD_FILE="$(mktemp)"
trap 'rm -f "$CMD_FILE"' EXIT

socket="${TMUX_SOCKET:-${TMUX:-}}"
socket="${socket%%,*}"
client="${TMUX_CLIENT:-}"
[[ -n "$socket" ]] || { printf 'moshi-launch: TMUX_SOCKET or TMUX is required\n' >&2; exit 2; }

tmux_cmd=("$TMUX_BIN" -S "$socket")
if [[ -z "$client" && "${TMUX:-}" == "$socket,"* ]]; then
  client="$("${tmux_cmd[@]}" display-message -p -t "\$${TMUX##*,}:" '#{client_name}')"
fi
[[ -n "$client" ]] || { printf 'moshi-launch: no attached client; set TMUX_CLIENT explicitly\n' >&2; exit 2; }
session="$("${tmux_cmd[@]}" display-message -p -t "$client" '#{session_name}')"
client_theme="$("${tmux_cmd[@]}" show-options -qv -t "$session" @client_theme)"
client_height="$("${tmux_cmd[@]}" display-message -p -t "$client" '#{client_height}')"
client_width="$("${tmux_cmd[@]}" display-message -p -t "$client" '#{client_width}')"
client_pane="$("${tmux_cmd[@]}" display-message -p -t "$client" '#{pane_id}')"
client_session="$("${tmux_cmd[@]}" display-message -p -t "$client" '#{session_id}')"
client_target="$("${tmux_cmd[@]}" display-message -p -t "$client" '#{session_id}:#{window_id}.#{pane_id}')"
server_pid="$("${tmux_cmd[@]}" display-message -p -t "$client" '#{server_pid}')"

PALETTE="${1:-commands}"
shift || true
# Remaining args (e.g. --category=Tools) affect both sizing and the popup.
EXTRA_ARGS=("$@")

LIGHT_XDG="$ROOT/tmux/moshi-xdg"
MEASURE_ENV=()
POPUP_ENV=()
printf -v PALETTE_BIN 'TMUX_SOCKET=%q TMUX_CLIENT=%q %q' "$socket" "$client" "$SCRIPT_PATH"
if [[ "$client_theme" == "moshi-light" ]]; then
  MEASURE_ENV=("XDG_CONFIG_HOME=$LIGHT_XDG")
  POPUP_ENV=(-e "XDG_CONFIG_HOME=$LIGHT_XDG")
  printf -v PALETTE_BIN 'TMUX_SOCKET=%q TMUX_CLIENT=%q XDG_CONFIG_HOME=%q %q' "$socket" "$client" "$LIGHT_XDG" "$SCRIPT_PATH"
fi
printf -v PALETTE_BIN_Q '%q' "$PALETTE_BIN"

# The client-targeted queries keep sizing and tmux format expansion attached
# to the keypressing client, even when another client is more recently active.
MEASURE="$(env ${MEASURE_ENV[@]+"${MEASURE_ENV[@]}"} bun "$PLUGIN_DIR/src/cli.ts" "$PALETTE" --measure "--cw=$client_width" "--ch=$client_height" ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"})"
IFS=$'\t' read -r WANT_H WANT_W WANT_PADX WANT_BORDER WANT_BODY_STYLE WANT_BORDER_STYLE <<< "$MEASURE"
WANT_H="${WANT_H:-20}"
WANT_W="${WANT_W:-90}"
WANT_PADX="${WANT_PADX:-3}"
WANT_BORDER="${WANT_BORDER:-none}"
WANT_BODY_STYLE="${WANT_BODY_STYLE:-default}"
WANT_BORDER_STYLE="${WANT_BORDER_STYLE:-default}"

# Cap by client size, leaving breathing room (mobile mode already uses full dims).
MAX_H=$(( client_height - 2 ))
H=$(( WANT_H > MAX_H ? MAX_H : WANT_H ))
W=$(( WANT_W > client_width - 4 ? client_width - 4 : WANT_W ))
if [ "$WANT_W" -ge "$client_width" ]; then H="$client_height"; W="$client_width"; fi
H="${TMUX_PALETTE_HEIGHT:-$H}"
W="${TMUX_PALETTE_WIDTH:-$W}"

BORDER_ARGS=(-B -s "$WANT_BODY_STYLE")
if [ "$WANT_BORDER" != "none" ]; then
  BORDER_ARGS=(-b "$WANT_BORDER" -s "$WANT_BODY_STYLE" -S "$WANT_BORDER_STYLE")
fi

ARG_STR=""
for a in "$PALETTE" ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}; do
  ARG_STR+=" $(printf %q "$a")"
done

BORDERED=0
[ "$WANT_BORDER" != "none" ] && BORDERED=1

"${tmux_cmd[@]}" display-popup -c "$client" ${POPUP_ENV[@]+"${POPUP_ENV[@]}"} \
  -e "TMUX=$socket,$server_pid,$client_session" -e "TMUX_PANE=$client_pane" -e "TMUX_SOCKET=$socket" -e "TMUX_CLIENT=$client" \
  "${BORDER_ARGS[@]}" -w "$W" -h "$H" -E \
  "TMUX_PALETTE_CMD=$(printf %q "$CMD_FILE") TMUX_PALETTE_BIN=$PALETTE_BIN_Q TMUX_PALETTE_PADX=$WANT_PADX TMUX_PALETTE_BORDERED=$BORDERED exec bun $(printf %q "$PLUGIN_DIR/src/cli.ts")$ARG_STR"

if [ -s "$CMD_FILE" ]; then
  CMD="$(cat "$CMD_FILE")"
  case "$CMD" in
    tmux:*)
      ACTION="$("${tmux_cmd[@]}" display-message -p -t "$client" "${CMD#tmux:}")"
      printf '%s\n' "$ACTION" | "${tmux_cmd[@]}" source-file -t "$client_target" - || true
      ;;
    shell:*)
      ACTION="$("${tmux_cmd[@]}" display-message -p -t "$client" "${CMD#shell:}")"
      eval "$ACTION" || true
      ;;
  esac
fi
exit 0

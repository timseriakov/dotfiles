#!/usr/bin/env bash
set -euo pipefail

SESSION_FORMAT=$'#{session_name}\t#{@is_popup_session}\t#{@popup_parent_window_id}\t#{@popup_kind}\t#{@popup_label}\t#{@popup_start_directory}'
PANE_FORMAT=$'#{pane_id}\t#{pane_active}'
SCRIPT_PATH="/Users/tim/dev/dotfiles/tmux/popup-sesh-fzf-picker.sh"
PREVIEW_CMD="$SCRIPT_PATH --preview {}"
PREVIEW_BORDER_RGB=$'\033[38;2;129;161;193m'
PREVIEW_COLOR_RESET=$'\033[0m'

print_preview_divider() {
  local width="${FZF_PREVIEW_COLUMNS:-${COLUMNS:-62}}"
  local line=""

  (( width > 0 )) || width=62
  printf -v line '%*s' "$width" ''
  line="${line// /─}"

  printf '\n%s%s%s\n\n' "$PREVIEW_BORDER_RGB" "$line" "$PREVIEW_COLOR_RESET"
}

popup_kind_icon() {
  case "${1:-}" in
    persistent) printf '' ;;
    ephemeral) printf '' ;;
    *) printf '󱂬' ;;
  esac
}

list_popup_sessions() {
  local session_name=""
  local is_popup_session=""
  local parent_window_id=""
  local popup_kind=""
  local popup_label=""
  local popup_start_directory=""
  local display_label=""
  local pane_command=""
  local kind_icon=""
  local list_label=""

  while IFS=$'\t' read -r session_name is_popup_session parent_window_id popup_kind popup_label popup_start_directory; do
    [[ "$session_name" == _popup* ]] || continue
    [[ "$is_popup_session" == "1" ]] || continue

    display_label="${popup_label:-$session_name}"
    pane_command="$(tmux display-message -p -t "$session_name" '#{pane_current_command}' 2>/dev/null || true)"
    kind_icon="$(popup_kind_icon "$popup_kind")"
    list_label="${display_label} (${pane_command:-shell}) ${kind_icon}"
    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$session_name" "$list_label" "$display_label" "${popup_kind:-popup}" "${pane_command:-shell}" "$kind_icon" "$popup_start_directory" "$parent_window_id"
  done < <(tmux list-sessions -F "$SESSION_FORMAT" 2>/dev/null)
}

resolve_popup_preview_pane() {
  local session_name="$1"
  local panes=""
  local pane_id=""
  local pane_active=""
  local first_pane=""

  panes="$(tmux list-panes -t "$session_name" -F "$PANE_FORMAT" 2>/dev/null || true)"
  [[ -n "$panes" ]] || return 1

  while IFS=$'\t' read -r pane_id pane_active; do
    [[ -n "$pane_id" ]] || continue
    [[ -z "$first_pane" ]] && first_pane="$pane_id"
    if [[ "$pane_active" == "1" ]]; then
      printf '%s\n' "$pane_id"
      return 0
    fi
  done <<< "$panes"

  [[ -n "$first_pane" ]] || return 1
  printf '%s\n' "$first_pane"
}

popup_session_preview_line() {
  local line="$1"
  local session_name=""
  local display_label=""
  local popup_kind=""
  local pane_command=""
  local popup_start_directory=""
  local parent_window_id=""
  local pane_id=""
  local pane_output=""
  local kind_icon=""

  IFS=$'\t' read -r session_name _list_label display_label popup_kind pane_command kind_icon popup_start_directory parent_window_id <<< "$line"

  printf '\n'
  printf '%s\n' "${display_label:-$session_name}"
  printf 'kind: %s %s' "${kind_icon:-󱂬}" "${popup_kind:-popup}"
  printf ' · command: %s' "${pane_command:-shell}"
  printf ' · parent: %s\n' "$parent_window_id"
  printf 'dir: %s\n' "$popup_start_directory"
  printf 'session: %s\n' "$session_name"
  print_preview_divider

  if pane_id="$(resolve_popup_preview_pane "$session_name")"; then
    if pane_output="$(tmux capture-pane -e -p -t "$pane_id" -S -200 2>/dev/null || true)"; then
      if [[ -n "$pane_output" ]]; then
        printf '%s\n' "$pane_output"
      else
        printf '[empty pane scrollback]\n'
      fi
      return 0
    fi
  fi

  printf '[preview unavailable]\n'
  printf 'pane closed or capture failed\n'
}

if [[ "${1:-}" == "--preview" ]]; then
  popup_session_preview_line "${2:-}"
  exit 0
fi

popup_sessions="$(list_popup_sessions || true)"

if [[ -z "$popup_sessions" ]]; then
  tmux display-message "No popup sessions"
  exit 0
fi

selected="$(printf '%s\n' "$popup_sessions" | fzf-tmux -p 100%,100% \
  --no-sort --ansi --cycle --layout=reverse --border=none \
  --delimiter=$'\t' \
  --with-nth='2' \
  --nth='2,3,4,5,6,7' \
  --prompt='󱂬 ' \
  --header='popup sessions' \
  --bind='tab:down,btab:up' \
  --preview-window='right:70%:border-left' \
  --preview="$PREVIEW_CMD" \
  --color='fg:#D8DEE9,bg:#2E3440,hl:#BF616A,fg+:#E5E9F0,bg+:#3B4252,hl+:#BF616A' \
  --color='info:#81A1C1,prompt:#81A1C1,pointer:#BF616A,marker:#EBCB8B,spinner:#5E81AC,header:#5E81C1,border:#81A1C1' || true)"

if [[ -n "$selected" ]]; then
  session_name="${selected%%$'\t'*}"
  tmux switch-client -t "$session_name"
fi

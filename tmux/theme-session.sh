#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${TMUX_SOCKET:-}" ]]; then
  socket="$TMUX_SOCKET"
elif [[ -n "${TMUX:-}" ]]; then
  socket="$TMUX"
else
  socket="${1:?usage: theme-session.sh SOCKET toggle|light|dark CLIENT THEME}"
  shift
fi
socket="${socket%%,*}"
mode="${1:?usage: theme-session.sh SOCKET toggle|light|dark CLIENT THEME}"
client="${2:?usage: theme-session.sh SOCKET toggle|light|dark CLIENT THEME}"
theme="${3:?usage: theme-session.sh SOCKET toggle|light|dark CLIENT THEME}"
[[ "$theme" =~ ^[[:alnum:]_-]+$ ]] || { echo 'invalid theme slug' >&2; exit 2; }
root="$(cd "$(dirname "$0")/.." && pwd)"
tmux_cmd=(tmux -S "$socket")
session="$("${tmux_cmd[@]}" display-message -p -t "$client" '#{session_name}')"
suffix="-$theme"
if [[ "$mode" == toggle ]]; then
  case "$session" in *"$suffix") mode=dark ;; *) mode=light ;; esac
fi

case "$mode" in
  light)
    case "$session" in
      *"$suffix")
        light_session="$session"
        origin="$("${tmux_cmd[@]}" show-option -qv -t "$light_session" @client_theme_origin)"
        [[ -n "$origin" ]] || origin="${session%"$suffix"}"
        ;;
      *)
        light_session="$session$suffix"
        origin="$session"
        if ! "${tmux_cmd[@]}" has-session -t "$light_session" 2>/dev/null; then
          "${tmux_cmd[@]}" new-session -d -s "$light_session" -t "$session"
        fi
        ;;
    esac
    "${tmux_cmd[@]}" set-option -t "$light_session" @client_theme "$theme"
    "${tmux_cmd[@]}" set-option -t "$light_session" @client_theme_origin "$origin"
    "${tmux_cmd[@]}" set-option -t "$light_session" status-style 'fg=colour0,bg=default,nounderscore,nooverline'
    "${tmux_cmd[@]}" set-option -t "$light_session" status 2
    "${tmux_cmd[@]}" set-option -t "$light_session" @light_windows_before_active '#{W:#{?#{e|<:#{window_index},#{active_window_index}}, #{window_index},}}'
    "${tmux_cmd[@]}" set-option -t "$light_session" status-format[0] '#[align=left]#[fg=colour4]#[bg=default]#[bold] #{@client_theme_origin} #[nobold]#[fg=colour8]│#[norange]#[list=on align=left]#{W:#[range=window|#{window_index}]#[fg=colour8]#[bg=default]#[nobold] #I #W #F │,#[range=window|#{window_index}]#[list=focus]#[fg=colour6]#[bg=default]#[bold] #I #W #F #[nobold]#[fg=colour8]│#[list=on align=left]}#[nolist]'
    "${tmux_cmd[@]}" set-option -t "$light_session" status-format[1] '#[align=left]#[fg=colour8]#[bg=default]#{R:─,#{e|+|:2,#{w:@client_theme_origin}}}#[fg=colour8]#{?#{E:@light_windows_before_active},┴,┘}#[norange]#[list=on align=left]#{W:#[range=window|#{window_index}]#{R:─,#{e|+|:#{e|+|:#{e|+|:#{w:window_index},#{w:window_name}},#{w:window_flags}},4}}#{?loop_last_flag,┘,#{?#{==:#{window_index},#{E;s|.* ||:@light_windows_before_active}},┘,┴}},#[range=window|#{window_index}]#[list=focus]#{R: ,#{e|+|:#{e|+|:#{e|+|:#{w:window_index},#{w:window_name}},#{w:window_flags}},4}}#{?loop_last_flag,╵,└}#[list=on align=left]}#[nolist]'
    "${tmux_cmd[@]}" switch-client -c "$client" -t "$light_session"
    ;;
  dark)
    case "$session" in *"$suffix") origin="${session%"$suffix"}" ;; *) exit 0 ;; esac
    "${tmux_cmd[@]}" switch-client -c "$client" -t "$origin"
    ;;
  *)
    printf 'usage: %s toggle|light|dark CLIENT THEME\n' "$0" >&2
    exit 2
    ;;
esac

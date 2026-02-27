# Nord color palette for fish UI (completions/pager/hints)
# Applies only to interactive shells
if not status is-interactive
    return
end

# Base Nord palette (hex without '#') for readability
set -l nord0 2e3440; set -l nord1 3b4252; set -l nord2 434c5e; set -l nord3 4c566a
set -l nord4 d8dee9; set -l nord5 e5e9f0; set -l nord6 eceff4
set -l nord7 8fbcbb; set -l nord8 88c0d0; set -l nord9 81a1c1; set -l nord10 5e81ac
set -l nord11 bf616a; set -l nord12 d08770; set -l nord13 ebcb8b; set -l nord14 a3be8c; set -l nord15 b48ead

# Pager / completions — remove harsh yellow descriptions
set -U fish_pager_color_prefix $nord8                       # typed prefix
set -U fish_pager_color_completion $nord5                   # candidates
set -U fish_pager_color_description $nord4                  # slightly lighter descriptions
set -U fish_pager_color_progress "$nord6 --background=$nord2"

# Selected line colors
set -U fish_pager_color_selected_background "--background=$nord2"
set -U fish_pager_color_selected_prefix $nord8
set -U fish_pager_color_selected_completion $nord6
set -U fish_pager_color_selected_description $nord4

# Secondary (every other row) — slightly dimmer
set -U fish_pager_color_secondary_prefix $nord8
set -U fish_pager_color_secondary_completion $nord4
set -U fish_pager_color_secondary_description $nord3

# Legacy fish color overrides
set -g fish_color_autosuggestion 555 brblack
set -g fish_color_command blue
set -g fish_color_comment red
set -g fish_color_cwd green
set -g fish_color_cwd_root red
set -g fish_color_end green
set -g fish_color_error brred
set -g fish_color_escape brcyan
set -g fish_color_history_current --bold
set -g fish_color_host normal
set -g fish_color_host_remote yellow
set -g fish_color_normal normal
set -g fish_color_operator brcyan
set -g fish_color_param cyan
set -g fish_color_quote yellow
set -g fish_color_redirection cyan --bold
set -g fish_color_search_match --background=111
set -g fish_color_selection white --bold --background=brblack
set -g fish_color_status red
set -g fish_color_user brgreen
set -g fish_color_valid_path --underline

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

## Only pager colors below — no core syntax overrides

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

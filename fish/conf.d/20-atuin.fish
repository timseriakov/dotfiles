set -gx ATUIN_NOBIND true

atuin init fish | source
source "$HOME/.atuin/bin/env.fish"


bind \cr _atuin_search
bind -M insert \cr _atuin_search

# Fish 4.3+ migration cleanup:
# Remove legacy universal vars that trigger fish_frozen_* regeneration.

for var in (set --names --universal | string match -r '^fish_pager_color_.*')
    set -eU $var
end

set -eU fish_key_bindings

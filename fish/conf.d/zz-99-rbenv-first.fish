# Ensure rbenv shims first, purge bad paths, and dedupe PATH/fish_user_paths.

# Config
set -l RB_SHIMS ~/.rbenv/shims
set -l RB_BIN ~/.rbenv/bin
set -l BAD ~/.gem/ruby/2.6.0/bin {cargo_bin} /opt/homebrew/bin/bin

# --- Clean fish_user_paths (remove BAD + duplicates)
set -l _cleaned_fup
for p in $fish_user_paths
    if not contains -- $p $BAD
        if not contains -- $p $_cleaned_fup
            set _cleaned_fup $_cleaned_fup $p
        end
    end
end

# Prepend rbenv to fish_user_paths
set -l _final_fup
for p in $RB_SHIMS $RB_BIN $_cleaned_fup
    if test -n "$p"; and not contains -- $p $_final_fup
        set _final_fup $_final_fup $p
    end
end
set -U fish_user_paths $_final_fup

# --- Clean PATH itself (some scripts modify PATH directly)
# Remove BAD + duplicates while keeping order
set -l _tmp_path
for p in $PATH
    if not contains -- $p $BAD
        if not contains -- $p $_tmp_path
            set _tmp_path $_tmp_path $p
        end
    end
end

# Ensure rbenv shims are the very first entries in PATH
set -l _final_path
for p in $RB_SHIMS $RB_BIN $_tmp_path
    if test -n "$p"; and not contains -- $p $_final_path
        set _final_path $_final_path $p
    end
end
set -gx PATH $_final_path

# Initialize rbenv for interactive shells
status --is-interactive; and rbenv init - fish | source

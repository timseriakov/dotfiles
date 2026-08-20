#!/usr/bin/env fish
# Tooling initialization (keep light; interactive-only where possible)

# Keep shims available immediately; initialize each manager only on first use.
if type -q rbenv
    fish_add_path -gpm ~/.rbenv/shims
    function rbenv
        functions --erase rbenv
        command rbenv init - fish | source
        command rbenv $argv
    end
end

if type -q pyenv
    fish_add_path -gpm ~/.pyenv/shims
    function pyenv
        functions --erase pyenv
        command pyenv init - | source
        command pyenv $argv
    end
end

if type -q mole
    function mole
        functions --erase mole
        set -l output (command mole completion fish 2>/dev/null)
        test -n "$output"; and echo "$output" | source
        command mole $argv
    end
end

# OrbStack
if test -f ~/.orbstack/shell/init2.fish
    source ~/.orbstack/shell/init2.fish 2>/dev/null
end

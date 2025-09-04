#!/usr/bin/env fish
# Tooling initialization (keep light; interactive-only where possible)

# rbenv (interactive init)
if status --is-interactive; and type -q rbenv
    rbenv init - fish | source
end

# pyenv (interactive init)
if status --is-interactive; and type -q pyenv
    pyenv init - | source
end

# OrbStack
if test -f ~/.orbstack/shell/init2.fish
    source ~/.orbstack/shell/init2.fish 2>/dev/null
end

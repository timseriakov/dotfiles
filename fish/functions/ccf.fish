# ccf — fish wrapper for find-claude-session with directory persistence
function ccf
    if test (count $argv) -gt 0
        if test "$argv[1]" = --help -o "$argv[1]" = -h
            find-claude-session --help
            return
        end
    end
    # Evaluate shell snippet produced by find-claude-session (drop blank lines)
    eval (find-claude-session --shell $argv | sed '/^$/d')
end

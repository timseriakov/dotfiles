# ji-managed: do not edit
function ji --description 'ji workspace switcher (with cd directive support)'
    if set -q COMPLETE
        command ji $argv
        return $status
    end

    set -l directive_file (mktemp)

    JI_DIRECTIVE_FILE=$directive_file command ji $argv
    set -l exit_code $status

    if test -s $directive_file
        eval (string collect <$directive_file)
        set -l directive_status $status
        if test $exit_code -eq 0
            set exit_code $directive_status
        end
    end

    command rm -f $directive_file
    return $exit_code
end

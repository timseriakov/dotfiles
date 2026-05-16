function wpu --description 'WP-CLI for Urban-Prime LocalWP'
    set -l wrapper /Users/tim/localwp/urban-prime/bin/wpu

    if not test -x "$wrapper"
        echo "wpu: repo-local wrapper not found or not executable: $wrapper" >&2
        return 127
    end

    "$wrapper" $argv
end

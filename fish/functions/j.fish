function j
    set tmp (mktemp -t "che-cwd.XXXXXX")
    che $argv --cwd-file="$tmp"
    if set cwd (cat "$tmp"); and test -n "$cwd"; and test "$cwd" != "$PWD"
        builtin cd "$cwd"
    end
    rm -f "$tmp"
end

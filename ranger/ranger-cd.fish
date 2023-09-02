#!/usr/local/bin/fish
set tempfile '/tmp/chosendir'
ranger --choosedir="$tempfile" $argv
if test -f "$tempfile"
    cat "$tempfile"
    rm -f "$tempfile"
end


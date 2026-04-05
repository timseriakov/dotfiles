#!/usr/bin/env fish

set -l raw (lazycommit commit 2>/dev/null)

if test $status -ne 0
    exit 1
end

set -l cleaned

for line in (string split \n -- $raw)
    set line (string trim -- $line)

    if test -z "$line"
        continue
    end

    set line (string replace -r '^[0-9]+[\.\)]\s*' '' -- $line)
    set line (string replace -r '^[-*]\s*' '' -- $line)
    set line (string replace -r '^["'\''](.*)["'\'']$' '$1' -- $line)

    if test -z "$line"
        continue
    end

    if string match -rq '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?:\s.+' -- $line
        set cleaned $cleaned "$line"
        continue
    end

    if string match -rq '^[[:alnum:]].+' -- $line
        set cleaned $cleaned "$line"
    end
end

printf '%s\n' $cleaned | awk '!seen[$0]++'

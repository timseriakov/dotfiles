#!/usr/bin/env fish
# fifc (fuzzy insert from candidates)

function __fifc_unique --description 'filter unique values preserving order'
    awk '!(x[$0]++)'
end

set -g __fifc_version 2
set -q FIFC_HISTORY || set -g FIFC_HISTORY ~/.cache/fifc
set -q FIFC_MAX  || set -g FIFC_MAX 10000
set -q FIFC_FZF_OPTS || set -g FIFC_FZF_OPTS "--height 40% --reverse --ansi"

function _fifc_hist_file; echo "$FIFC_HISTORY/$argv[1].txt"; end
function _fifc_hist_save
    set -l file (_fifc_hist_file $argv[1])
    mkdir -p (dirname $file)
    printf %s\n $argv[2..-1] | __fifc_unique | tail -n $FIFC_MAX >$file
end
function _fifc_hist_load
    set -l file (_fifc_hist_file $argv[1])
    test -f $file; and cat $file
end

function fifc --description 'Fuzzy select from candidates and insert'
    set -l name $argv[1]
    set -l prompt $argv[2]
    set -l src_fn $argv[3]
    set -l cmp_fn $argv[4]
    set -l cb_fn  $argv[5]

    set -l src (eval $src_fn)
    set -l hist (_fifc_hist_load $name)
    set -l list (printf %s\n $hist $src | __fifc_unique)
    if test (count $list) -eq 0
        commandline -f repaint
        return
    end

    set -l chosen (printf %s\n $list | fzf $FIFC_FZF_OPTS --prompt "$prompt> ")
    test -n "$chosen"; or return
    set -l result (eval $cb_fn "$chosen")
    if test -n "$result"
        commandline -it -- $result
        _fifc_hist_save $name $chosen $hist
    end
end

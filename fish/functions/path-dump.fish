function path-dump --description "Pretty-print PATH with indices and dedup info"
    set -l seen
    set -l i 1

    for p in $PATH
        set_color cyan
        printf "%2d " $i
        set_color normal
        printf "%s" $p

        if contains -- $p $seen
            set_color red
            printf "  (duplicate)"
        else
            set seen $seen $p
        end

        set_color normal
        echo
        set i (math $i + 1)
    end
end

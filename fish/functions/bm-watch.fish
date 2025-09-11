function bm-watch --description "Watch current folder and auto-sync Basic Memory"
    set -l proj (pwd)
    set -l project_name (basename $proj)
    set -l memdir "$proj/basic-memory"

    if not test -d $memdir
        mkdir -p $memdir/notes
        echo "Created $memdir"
        basic-memory project add $project_name $memdir
    end

    if not type -q watchexec
        echo "watchexec not found. Installing via brew..."
        brew install watchexec
    end

    echo "Watching $proj for changes. Press Ctrl+C to stop."
    watchexec -r -w $proj -- \
        uvx --from git+https://github.com/basicmachines-co/basic-memory.git@main \
        basic-memory --project $project_name sync
end

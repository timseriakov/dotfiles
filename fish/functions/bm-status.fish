function bm-status --description "Check Basic Memory status for current project"
    set -l proj (pwd)
    set -l project_name (basename $proj)
    set -l memdir "$proj/basic-memory"

    if not test -d $memdir
        mkdir -p $memdir/notes
        echo "Created $memdir"
        basic-memory project add $project_name $memdir
    end

    echo "Checking Basic Memory status for project: $project_name"
    uvx --from git+https://github.com/basicmachines-co/basic-memory.git@main \
        basic-memory --project $project_name status
end

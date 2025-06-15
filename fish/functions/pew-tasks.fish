# Minimal working prototype: pew-tasks.fish

function pew-tasks --description "fzf + glow TUI for pew tasks"
    set -l pew_config (fd pew.yaml . --hidden --exclude node_modules --exclude .git | head -n1)
    if test -z "$pew_config"
        echo "❌ pew.yaml not found"
        return 1
    end

    set -l project_root (dirname $pew_config)
    set -l task_file (awk '$1 == "primary:" { print $2; exit }' $pew_config)

    if test -z "$task_file"
        echo "❌ No primary task file defined in pew.yaml"
        return 1
    end

    set -l task_path "$project_root/$task_file"
    if test ! -f "$task_path"
        echo "❌ Task file does not exist: $task_path"
        return 1
    end

    # Detect current milestone from 👉 or offer choice
    set -l milestone (awk '/^## / { current = $0 } /👉/ { print current; exit }' $task_path | sed 's/^## //')

    if test -z "$milestone"
        set milestone (grep '^## ' $task_path | sed 's/^## //' | fzf --prompt="Select milestone: ")
    end

    if test -z "$milestone"
        echo "❌ No milestone selected"
        return 1
    end

    echo "📌 Milestone: $milestone"

    # fzf choice to add task or skip
    set -l add_choice (printf "➕ Добавить новую задачу\n⏭ Пропустить\n" | fzf --prompt="Добавить задачу? " --height=3 --border)
    if test "$add_choice" = "➕ Добавить новую задачу"
        echo -n "📝 Task text: "
        read -l new_task
        if test -n "$new_task"
            set -l tmpfile (mktemp)
            awk -v ms="## $milestone" -v task="$new_task" '
                BEGIN { added=0 }
                $0 == ms { print; added=1; next }
                /^## / && added==1 { print "- [ ] " task; added=2 }
                { print }
                END { if (added == 1) print "- [ ] " task }
            ' "$task_path" >$tmpfile && mv $tmpfile $task_path
            echo "✅ Added task: $new_task"
        end
    end

    set -l tasks (awk -v ms="## $milestone" '
        BEGIN { keep = 0 }
        $0 == ms { keep = 1; next }
        /^## / && $0 != ms { keep = 0 }
        keep && /^- \[ \] / { print }
    ' $task_path)

    if test -z "$tasks"
        echo "No tasks under milestone $milestone"
        return 0
    end

    set -l selected (printf "%s\n" $tasks | fzf \
        --prompt="Task: " \
        --preview "echo {} | sed 's/^- \[ \] //' | glow -")

    if test -z "$selected"
        echo "Cancelled."
        return 0
    end

    # Rewrite file with 👉
    set -l tmp (mktemp)
    sed 's/👉 //' $task_path >$tmp
    set -l pattern (echo $selected | sed 's/[]\\/$*.^[]/\\&/g')
    set -l clean (string replace -r '^- \[ \] ' '' "$selected" | string trim)
    set -l replacement "- [ ] 👉 $clean"
    sed -i '' "s/^$pattern/$replacement/" $tmp
    mv $tmp $task_path

    echo "✅ Updated 👉 to: $selected"

    if type -q pew
        echo "🚀 Running pew next task"
        pew next task
    end
end

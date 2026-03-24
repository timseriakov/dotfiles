function _fifc_preview_file -d "Preview the selected file with the right tool depending on its type"
    set -l file_type (_fifc_file_type "$fifc_candidate")
    
    # Path to real chafa binary (bypass local shim)
    set -l real_chafa "/opt/homebrew/bin/chafa"
    if not test -x "$real_chafa"
        set real_chafa (command -v chafa)
    end

    switch $file_type
        case txt
            if type -q bat
                bat --color=always $fifc_bat_opts "$fifc_candidate"
            else
                cat "$fifc_candidate"
            end
        case json
            if type -q bat
                bat --color=always -l json $fifc_bat_opts "$fifc_candidate"
            else
                cat "$fifc_candidate"
            end
        case image pdf
            if set -q KITTY_WINDOW_ID; or string match -q "xterm-kitty" "$TERM"
                set -l kitten_cmd "kitten"
                if test -x "/Applications/kitty.app/Contents/MacOS/kitten"
                    set kitten_cmd "/Applications/kitty.app/Contents/MacOS/kitten"
                end
                $kitten_cmd icat --clear --transfer-mode=memory --stdin=no --place="$FZF_PREVIEW_COLUMNS"x"$FZF_PREVIEW_LINES"@0x0 "$fifc_candidate"
                for i in (seq $FZF_PREVIEW_LINES)
                    echo
                end
            else if test -x "$real_chafa"
                set -l chafa_flags
                set -l needs_padding 0
                
                if set -q TERM_PROGRAM; and string match -q "iTerm.app" "$TERM_PROGRAM"
                    set -a chafa_flags --format iterm
                    if set -q TMUX
                        set -a chafa_flags --passthrough tmux
                    end
                    set needs_padding 1
                else
                    # Alacritty / Fallback
                    # Force safe symbols and restrict colors to 256 to avoid issues
                    set -a chafa_flags --format symbols --symbols -all+block+ascii --colors 256
                    set needs_padding 0
                end

                # DEBUG: Log the command being executed
                # echo "CMD: $real_chafa -s "$FZF_PREVIEW_COLUMNS"x"$FZF_PREVIEW_LINES" $chafa_flags $fifc_chafa_opts $fifc_candidate" >> /tmp/fifc_debug.log

                $real_chafa -s "$FZF_PREVIEW_COLUMNS"x"$FZF_PREVIEW_LINES" $chafa_flags $fifc_chafa_opts "$fifc_candidate"
                
                if test "$needs_padding" = 1
                    for i in (seq $FZF_PREVIEW_LINES)
                        echo
                    end
                end
            else
                _fifc_preview_file_default "$fifc_candidate"
            end
        case archive
            if type -q 7z
                7z l ""$fifc_candidate"" | tail -n +17 | awk '{ print $6 }'
            else
                _fifc_preview_file_default "$fifc_candidate"
            end
        case binary
            if type -q hexyl
                hexyl $fifc_hexyl_opts "$fifc_candidate"
            else
                _fifc_preview_file_default "$fifc_candidate"
            end
    end
end

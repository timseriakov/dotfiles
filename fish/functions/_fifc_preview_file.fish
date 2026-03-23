function _fifc_preview_file -d "Preview the selected file with the right tool depending on its type"
    set -l file_type (_fifc_file_type "$fifc_candidate")

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
            # Kitty native high-res preview (best for tmux/fzf)
            if set -q KITTY_WINDOW_ID; or string match -q "xterm-kitty" "$TERM"
                # kitten icat handles tmux passthrough automatically and correctly
                # --place specifies dimensions in cells (cols x rows) @ offset
                # --clear ensures no ghosting from previous previews
                /Applications/kitty.app/Contents/MacOS/kitten icat --clear --transfer-mode=memory --stdin=no --place="$FZF_PREVIEW_COLUMNS"x"$FZF_PREVIEW_LINES"@0x0 "$fifc_candidate"
                
                # We still need to output newlines so fzf 'scrolls' correctly
                # and doesn't draw text over our image.
                for i in (seq $FZF_PREVIEW_LINES)
                    echo
                end
            else if type -q chafa
                set -l chafa_flags
                if set -q TERM_PROGRAM; and string match -q "iTerm.app" "$TERM_PROGRAM"
                    set -a chafa_flags --format iterm
                end
                if set -q TMUX
                    set -a chafa_flags --passthrough tmux
                end
                if not contains -- --format $chafa_flags
                    set -a chafa_flags --format symbols --symbols all
                end

                chafa -s "$FZF_PREVIEW_COLUMNS"x"$FZF_PREVIEW_LINES" $chafa_flags $fifc_chafa_opts "$fifc_candidate"
                
                for i in (seq $FZF_PREVIEW_LINES)
                    echo
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

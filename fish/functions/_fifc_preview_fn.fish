function _fifc_preview_fn -d "Preview the function definition"
    if type -q bat
        type $fifc_candidate | bat --style=plain --color=always --decorations=never --language fish $fifc_bat_opts
    else
        type $fifc_candidate
    end
end

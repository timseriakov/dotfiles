function _fifc_preview_dir -d "List content of the selected directory"
    if type -q eza
        eza --color=always --icons --group-directories-first $fifc_exa_opts $fifc_candidate
    else
        ls --color=always $fifc_ls_opts $fifc_candidate
    end
end

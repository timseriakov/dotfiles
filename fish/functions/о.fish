function о --description 'Switch to English layout and launch yazi (via j)'
    if command -q im-select
        im-select com.apple.keylayout.ABC
    end
    j $argv
end

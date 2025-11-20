# ~/.config/fish/functions/brew.fish
function brew --wraps=/opt/workbrew/bin/brew --description "Workbrew Homebrew wrapper"
    /opt/workbrew/bin/brew $argv
end

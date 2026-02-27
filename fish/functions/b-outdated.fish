function b-outdated --description 'Show brew outdated formulae and casks separately'
    echo -e "\033[1;34m📦 Outdated Formulae:\033[0m"
    brew outdated --formula
    echo -e "\n\033[1;35m🧃 Outdated Casks:\033[0m"
    brew outdated --cask
end

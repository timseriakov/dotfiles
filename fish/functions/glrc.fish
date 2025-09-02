function glrc --wraps='cd ~/dev/dotfiles/glance && nvim ./glance.yml' --description 'alias glrc cd ~/dev/dotfiles/glance && nvim ./glance.yml'
  cd ~/dev/dotfiles/glance && nvim ./glance.yml $argv

end

function default-browser-helium --description 'Set Helium as default system browser'
  $HOME/dev/dotfiles/bin/set-default-browser net.imput.helium
  or return
  set -gx BROWSER helium
end

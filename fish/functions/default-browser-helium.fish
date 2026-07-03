function default-browser-helium --description 'Set Helium as default system browser'
  $HOME/dev/dotfiles/bin/set-default-browser net.imput.helium
  set -gx BROWSER helium
end

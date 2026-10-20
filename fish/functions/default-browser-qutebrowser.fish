function default-browser-qutebrowser --description 'Set qutebrowser as default system browser'
  $HOME/dev/dotfiles/bin/set-default-browser org.qutebrowser.qutebrowser
  or return
  set -gx BROWSER qutebrowser
end

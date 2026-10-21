function toggle-default-browser --description 'Toggle between Helium and qutebrowser as the default browser'
  set current_browser (duti -d http)
  or return
  if test "$current_browser" = net.imput.helium
    default-browser-qutebrowser
  else
    default-browser-helium
  end
end

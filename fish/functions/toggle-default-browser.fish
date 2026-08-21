function toggle-default-browser --description 'Toggle between Helium and qutebrowser as the default browser'
  if test "$BROWSER" = helium
    default-browser-qutebrowser
  else
    default-browser-helium
  end
end

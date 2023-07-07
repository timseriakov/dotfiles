function fish_user_key_bindings
  fish_vi_key_bindings
  for mode in insert default visual
      bind -M $mode \ck 'history --merge ; up-or-search'
      bind -M $mode \cj 'history --merge ; down-or-search' 
  end

  bind -M insert -m default jj backward-char force-repaint
end

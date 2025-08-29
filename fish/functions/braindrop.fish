function braindrop \
  --wraps='/Users/tim/.local/bin/braindrop' \
  --description 'Braindrop with qutebrowser opener'
  # Restrict the opener for this invocation only to avoid changing global defaults
  env BROWSER="$HOME/dev/dotfiles/bin/open-in-qute" /Users/tim/.local/bin/braindrop $argv
end

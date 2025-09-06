# Define interactive abbreviations for common commands
if not status is-interactive
    return
end

# Editors and quick openers
abbr -a v nvim
abbr -a vv 'nvim .'
abbr -a 'o.' 'open .'
abbr -a R 'glow README.md'
abbr -a so 'source ~/.config/fish/config.fish'
abbr -a f-source 'source ~/.config/fish/config.fish'

# npm
abbr -a n npm
abbr -a ni 'npm install'
abbr -a nid 'npm install -D'
abbr -a nr 'npm run'
abbr -a nd 'npm run dev'
abbr -a nb 'npm run build'
abbr -a nrm 'npm uninstall'
abbr -a npk 'npx npkill'

# pnpm
abbr -a p pnpm
abbr -a pi 'pnpm install'
abbr -a pd 'pnpm dev'
abbr -a px pnpx

# yarn
abbr -a y yarn
abbr -a ydd 'yarn add'
abbr -a yddd 'yarn add -D'
abbr -a yrm 'yarn remove'
abbr -a ys 'yarn start'
abbr -a yb 'yarn build'
abbr -a yd 'yarn dev'

# bun
abbr -a b bun
abbr -a ba 'bun a'
abbr -a bi 'bun i'
abbr -a bid 'bun i -D'
abbr -a bd 'bun dev'
abbr -a bdd 'bun add'
abbr -a bddd 'bun add -D'
abbr -a bx bunx

# Docker
abbr -a dcu 'docker compose up'
abbr -a dcub 'docker compose up --build'
abbr -a dcubd 'docker-compose up --build -d'

# Aider, Claude and Codex
abbr -a a 'aider -c $HOME/.aider.conf.yml'
abbr -a cl 'claude --append-system-prompt (cat $HOME/.claude/auto-plan-mode.txt)'
abbr -a cl-haiku 'claude --model claude-3-5-haiku-20241022'
abbr -a cl-opus 'claude --model claude-opus-4-20250514'
abbr -a clup 'npm install -g @anthropic-ai/claude-code'
abbr -a a-openai-gpt-4o 'aider --model gpt-4o -c $HOME/.aider.conf.yml'
abbr -a a-openai-gpt-4.1 'aider --model openai/gpt-4.1 --editor-model openai/gpt-4.1-nano --weak-model openai/gpt-4.1-nano -c $HOME/.aider.conf.yml'
abbr -a a-gemini 'aider --model gemini -c $HOME/.aider.conf.yml'
abbr -a a-gemini-2.5-pro-free 'aider --model openrouter/google/gemini-2.5-pro-exp-03-25:free -c $HOME/.aider.conf.yml'
abbr -a a-openrouter-gpt-4o 'aider --model openrouter/openai/gpt-4o -c $HOME/.aider.conf.yml'
abbr -a a-codestral 'aider --model codestral/codestral-latest -c $HOME/.aider.conf.yml'
abbr -a a-claude-3.7-sonnet 'aider --model openrouter/anthropic/claude-3.7-sonnet -c $HOME/.aider.conf.yml'
abbr -a cx codex
abbr -a cx-4.1 'codex -m gpt-4.1'
abbr -a cx-4.1-mini 'codex -m gpt-4.1-mini'
abbr -a cx-4.1-nano 'codex -m gpt-4.1-nano'

# CLI utilities
abbr -a gg lazygit
abbr -a bt btop
abbr -a web carbonyl
abbr -a mdp 'glow --pager'
abbr -a srv 'npx http-server .'
abbr -a serve 'npx serve .'
abbr -a ff 'npx fast-cli'
abbr -a icat 'kitten icat'
abbr -a hg 'hgrep --theme Nord'
abbr -a ipinfo 'curl -s ipinfo.io'
abbr -a ipinfo-more 'curl -s ipwho.is'
abbr -a vtop 'vtop --theme nord'

# Git
abbr -a gl 'git slog'
abbr -a gd 'git sdiff'

# Bun helpers (additional)
abbr -a bb 'bun run build'
abbr -a brm 'bun remove'

# Brew helpers
abbr -a bri 'brew install'
abbr -a brr 'brew uninstall'
abbr -a brrm 'brew uninstall'
abbr -a brugh 'brew upgrade gh'
abbr -a brc 'nvim ~/dev/dotfiles/Brewfile'

# Backlog helpers
abbr -a bl backlog
abbr -a blb 'backlog board'
abbr -a blw 'backlog browser'

# Misc shorties
abbr -a c bat
abbr -a cbc 'cb cp'
abbr -a cbp 'cb p'
abbr -a cpr 'cp -r'
abbr -a chmd chmod-cli
abbr -a cr crush
abbr -a de deno
abbr -a de-it 'docker exec -it'
abbr -a ge gemini
abbr -a grc 'cd ~/.gemini'
abbr -a m mmv
abbr -a mtrx 'cmatrix -C blue -s'
abbr -a mtrx-cyan 'cmatrix -C cyan -s'
abbr -a nrc 'cd ~/dev/dotfiles/nvim/lua && nvim .'
abbr -a sshh ggh

# Open configs/projects
abbr -a krc 'nvim ~/.config/kitty/kitty.conf'
abbr -a qrc 'nvim ~/dev/dotfiles/qutebrowser/config.py'
abbr -a trc 'nvim ~/.tmux.conf'
abbr -a glarc 'nvim ~/Library/LaunchAgents/app.glance.plist'
abbr -a glrc 'cd ~/dev/dotfiles/glance && nvim ./glance.yml'
abbr -a yrc 'nvim ~/dev/dotfiles/yazi'
abbr -a aidrc 'nvim ~/dev/dotfiles/.aider.conf.yml'
abbr -a arc 'nvim ~/dev/dotfiles/aerospace/aerospace.toml'
abbr -a frc 'nvim ~/dev/dotfiles/fish/config.fish'
abbr -a secrets 'nvim ~/dev/dotfiles/fish/secrets.fish'

# Misc simple
abbr -a cls clear
abbr -a cbs 'cb show'
abbr -a ccc 'cb cp'
abbr -a ppp 'cb p'
abbr -a rf 'rm -rf'
abbr -a rfl 'rm -rf *.lock'
abbr -a t taskell
abbr -a tt 'taskell TODO.md'

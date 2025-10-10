# Define interactive abbreviations for common commands
if not status is-interactive
    return
end

# Editors and quick openers
abbr -a v nvim
abbr -a vv 'nvim .'
abbr -a o open
abbr -a 'o.' 'open .'
abbr -a R 'glow --pager'
abbr -a RM 'glow README.md'
abbr -a ef 'exec fish'
abbr -a wt branchlet

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
abbr -a yi 'yarn ios'
abbr -a yiv 'yarn ios --verbose'
abbr -a yan 'yarn android'
abbr -a yanv 'yarn android --verbose'
abbr -a yb 'yarn build'
abbr -a yd 'yarn dev'
abbr -a wd 'watchman watch-del .; watchman watch-project .' # mobile RN project related

# bun
abbr -a b bun
abbr -a ba 'bun a'
abbr -a bi 'bun i'
abbr -a bid 'bun i -D'
abbr -a bd 'bun dev'
abbr -a bdd 'bun add'
abbr -a bddd 'bun add -D'
abbr -a bx bunx
abbr -a de-it 'docker exec -it'

# Git
abbr -a gl 'git slog'
abbr -a gd 'git sdiff'
abbr -a gvd 'git vdiff'
abbr -a gvl 'git vlog'
abbr -a gprune 'git remote prune origin'
abbr -a gg lazygit
abbr -a пп lazygit

# Brew helpers
abbr -a bri 'brew install'
abbr -a brrm 'brew uninstall'
abbr -a brugh 'brew upgrade gh'
abbr -a brc 'nvim ~/dev/dotfiles/Brewfile'
abbr -a brewfile-dump 'brew bundle dump --global --force'
abbr -a brewfile-cleanup 'brew bundle cleanup --force'
abbr -a brewfile-upgrade 'brew bundle upgrade --global'

# Deno
abbr -a de deno

# Docker
abbr -a dcu 'docker compose up'
abbr -a dcub 'docker compose up --build'
abbr -a dcubd 'docker-compose up --build -d'
abbr -a de-it 'docker exec -it'

# CLaude Code
abbr -a cl 'claude --append-system-prompt (cat $HOME/.claude/auto-plan-mode.txt)'
abbr -a cl-haiku 'claude --model claude-3-5-haiku-20241022'
abbr -a cl-opus 'claude --model claude-opus-4-20250514'
# Claude Code tools
abbr -a cc-update 'npm install -g @anthropic-ai/claude-code'
abbr -a ccline-update 'npm update -g @cometix/ccline'
abbr -a cc-tw tweakcc # or 'npx -y tweakcc@latest'
abbr -a cc-history 'npx -y cchistory@latest'
abbr -a cc-log 'cclogviewer -input'
abbr -a cc-exp 'npx -y ccexp@latest'
abbr -a cc-mon 'claude-monitor  --time-format 24h'
abbr -a cc-cmd claude-cmd
abbr -a lm lsh # Translates natural language to shell commands using LLM

# Gemini
abbr -a ge gemini
abbr -a geup 'brew install gemini-cli'
abbr -a gec 'bat google_accounts.json && rm -rf oauth_creds.json installation_id  google_accounts.json'

# Codex
abbr -a cx codex
abbr -a cx-4.1 'codex -m gpt-4.1'
abbr -a cx-4.1-mini 'codex -m gpt-4.1-mini'
abbr -a cx-4.1-nano 'codex -m gpt-4.1-nano'

# Other AI tools
abbr -a aid 'aider -c $HOME/.aider.conf.yml'
abbr -a cr cursor-agent

# Backlog.md helpers
abbr -a bl backlog
abbr -a t 'backlog board'
abbr -a tt 'backlog browser'

# z jumps
abbr -a zd 'z dot'
abbr -a zm 'z mobile'
abbr -a zl 'z dl'

# Open configs
abbr -a krc 'nvim ~/.config/kitty/kitty.conf'
abbr -a nrc 'cd ~/dev/dotfiles/nvim/lua && nvim .'
abbr -a nprc 'cd ~/dev/dotfiles/nvim/lua/plugins/ && nvim .'
abbr -a qrc 'nvim ~/dev/dotfiles/qutebrowser/config.py'
abbr -a trc 'nvim ~/.tmux.conf'
abbr -a glarc 'nvim ~/Library/LaunchAgents/app.glance.plist'
abbr -a glrc 'cd ~/dev/dotfiles/glance && nvim ./glance.yml'
abbr -a grc 'cd ~/.gemini'
abbr -a yrc 'nvim ~/dev/dotfiles/yazi'
abbr -a aidrc 'nvim ~/dev/dotfiles/.aider.conf.yml'
abbr -a frc 'nvim ~/dev/dotfiles/fish/config.fish'
abbr -a arc 'nvim ~/dev/dotfiles/fish/conf.d/30-abbr.fish'
abbr -a secrets 'nvim ~/dev/dotfiles/fish/secrets.fish'
abbr -a tokens 'nvim ~/dev/dotfiles/fish/secrets.fish'

# Misc
abbr -a cls clear

abbr -a cbs 'cb show'
abbr -a ccc 'cb cp'
abbr -a ppp 'cb p'
abbr -a cpr 'cp -r'

abbr -a rf 'rm -rf'
abbr -a rfl 'rm -rf *.lock'

abbr -a lsl 'ls -l -a | grep '^l'' # show simlinks
abbr -a c bat
abbr -a chmd chmod-cli
abbr -a m mmv
abbr -a mtrx 'cmatrix -C blue -s'
abbr -a mtrx-cyan 'cmatrix -C cyan -s'
abbr -a sshh ggh

abbr -a icat 'kitten icat'
abbr -a hg 'hgrep --theme Nord'
abbr -a fxp 'fx package.json'

abbr -a srv 'npx http-server .'
abbr -a serve 'npx serve .'
abbr -a ff 'npx fast-cli'

abbr -a ipinfo 'curl -s ipinfo.io'
abbr -a ipinfo-more 'curl -s ipwho.is'

abbr -a bt btop
abbr -a vtop 'vtop --theme nord'

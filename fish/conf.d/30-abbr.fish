# Define interactive abbreviations for common commands
if not status is-interactive
    return
end

# Editors and quick openers
abbr -a v nvim
abbr -a vv 'nvim .'
abbr -a мм 'nvim .'
abbr -a op open
abbr -a 'o.' 'open .'
abbr -a R 'glow --pager'
abbr -a RM 'glow README.md'
abbr -a ef 'exec fish'
abbr -a fe 'exec fish'
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
abbr -a ys 'yarn start --reset-cache'
abbr -a yi 'yarn ios'
abbr -a yiv 'yarn ios --verbose'
abbr -a yan 'yarn android:pre-build && yarn android && watchman watch-del .; watchman watch-project .'
abbr -a yanv 'yarn android --verbose'
abbr -a yb 'yarn build'
abbr -a yd 'yarn dev'
abbr -a wd 'watchman watch-del .; watchman watch-project .' # mobile RN project related

# bun
abbr -a b bun
abbr -a ba 'bun a'
abbr -a bi 'bun i'
abbr -a bid 'bun i -D'
abbr -a bde 'bun dev'
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
abbr -a tg tig
abbr -a prs 'env -u GITHUB_TOKEN gh dash'
abbr -a g-redeploy 'git commit --allow-empty -m "chore: trigger redeploy"'

# Brew helpers
abbr -a bri 'brew install'
abbr -a brrm 'brew uninstall'
abbr -a brs 'brew services'
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
abbr -a clr 'claude --append-system-prompt (cat $HOME/.claude/auto-plan-mode.txt) --resume'
abbr -a clc 'claude --append-system-prompt (cat $HOME/.claude/auto-plan-mode.txt) --continue'
abbr -a .c 'cd ~/.claude'
abbr -a c. 'cd ~/.claude'
abbr -a mp mcpproxy
abbr -a mp-restart '$HOME/dev/dotfiles/mcpproxy/fix-mcpproxy.sh'
abbr -a mpr '$HOME/dev/dotfiles/mcpproxy/fix-mcpproxy.sh'
abbr -a cl-haiku 'claude --model claude-3-5-haiku-20241022'
abbr -a cl-opus 'claude --model claude-opus-4-20250514'
# Claude Code tools
abbr -a ccup 'npm install -g @anthropic-ai/claude-code'
abbr -a ccline-up 'npm update -g @cometix/ccline'
abbr -a cc-tw tweakcc # or 'npx -y tweakcc@latest'
abbr -a cc-history 'npx -y cchistory@latest'
abbr -a cc-logviewer 'cclogviewer -input'
abbr -a cc-exp 'npx -y ccexp@latest'
abbr -a cc-mon 'claude-monitor  --time-format 24h'
abbr -a cc-cmd claude-cmd
abbr -a cc-log 'npx -y vibe-log-cli@latest'
abbr -a lm lsh # Translates natural language to shell commands using LLM

# Gemini
abbr -a ge gemini
abbr -a geup 'npm install -g @google/gemini-cli'
# abbr -a geup 'brew install gemini-cli'
abbr -a geclear 'bat --style=plain --decorations=never --color=always google_accounts.json && rm -rf oauth_creds.json installation_id  google_accounts.json'

# Codex
abbr -a cx codex
abbr -a cxup 'npm install -g @openai/codex'
abbr -a cx-4.1 'codex -m gpt-4.1'
abbr -a cx-4.1-mini 'codex -m gpt-4.1-mini'
abbr -a cx-4.1-nano 'codex -m gpt-4.1-nano'

# OpenCode
abbr -a o opencode
abbr -a oup 'npm install -g opencode-ai && rm /Users/tim/.volta/tools/image/packages/opencode-ai/lib/node_modules/opencode-ai/bin/opencode && ln -s ../node_modules/opencode-darwin-arm64/bin/opencode /Users/tim/.volta/tools/image/packages/opencode-ai/lib/node_modules/opencode-ai/bin/opencode'
abbr -a oweb 'openchamber --daemon --port 1911'
abbr -a o-manager 'bunx opencode-manager'
abbr -a orc 'cd ~/dev/dotfiles/opencode && nvim .'
abbr -a ocd 'cd ~/dev/dotfiles/opencode && yazi'
abbr -a o-repare 'rm /Users/tim/.volta/tools/image/packages/opencode-ai/lib/node_modules/opencode-ai/bin/opencode && ln -s ../node_modules/opencode-darwin-arm64/bin/opencode /Users/tim/.volta/tools/image/packages/opencode-ai/lib/node_modules/opencode-ai/bin/opencode'
abbr -a oskills 'npx -y openskills'
abbr -a os '~/.config/opencode/omoc-switch'

# Other AI tools
abbr -a aid 'aider -c $HOME/.aider.conf.yml'
abbr -a cr cursor-agent
abbr -a ag 'npx -y @augmentcode/auggie --rules $HOME/dev/claude/CLAUDE.md'
abbr -a agc 'npx -y @augmentcode/auggie session continue --rules $HOME/dev/claude/CLAUDE.md'
abbr -a goo goose
abbr -a amp 'npx -y @sourcegraph/amp@latest'
abbr -a add-mcp 'npx -y add-mcp'

abbr -a qw qwen
abbr -a qwup 'npm i @qwen-code/qwen-code@latest -g'

# z jumps
abbr -a dev 'cd ~/dev'
abbr -a zd 'z dot'
abbr -a dl 'z dl'
abbr -a do 'cd ~/dev/dotfiles'

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
abbr -a frc 'nvim ~/dev/dotfiles/fish/config.fish && exec fish'
abbr -a arc 'nvim ~/dev/dotfiles/fish/conf.d/30-abbr.fish && exec fish'
abbr -a envs 'nvim ~/dev/dotfiles/fish/secrets.fish && exec fish'
abbr -a tokens 'nvim ~/dev/dotfiles/fish/secrets.fish && exec fish'

# Misc
abbr -a cls clear

abbr -a cbs 'cb show'
abbr -a ccc 'cb cp'
abbr -a ppp 'cb p'
abbr -a cpr 'cp -r'

abbr -a pwdc 'pwd | tee /dev/tty | pbcopy'

abbr -a rf 'rm -rf'
abbr -a rfl 'rm -rf *.lock'

abbr -a lsl 'ls -l -a | grep '^l'' # show simlinks
abbr -a c 'bat --style=plain --decorations=never --color=always'
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
abbr -a ff 'npx -y fast-cli'

abbr -a ipinfo 'curl -s -H "Authorization: Bearer $IPINFO_TOKEN" https://api.ipinfo.io/lite/me'
abbr -a ipinfo-more 'curl -s ipwho.is'

abbr -a bt btop
abbr -a vtop 'vtop --theme nord'

abbr -a r rum
abbr -a uvx-serena 'uvx --from git+https://github.com/oraios/serena serena'

abbr -a beads /Users/tim/.local/bin/bd
abbr -a trrnts /opt/homebrew/bin/bv

abbr -a va ekphos

abbr -a kkll rip
abbr -a ports snitch

abbr -a mu 'mole uninstall'
abbr -a hn clx
abbr -a take tmux-take-alacritty
abbr -a tk tmux-take-alacritty

abbr -a webm2telegram-gif 'ffmpeg -i input.webm \
  -movflags +faststart \
  -pix_fmt yuv420p \
  -vf "fps=30,scale=512:-2:flags=lanczos" \
  -c:v libx264 -profile:v baseline -level 3.0 \
  -an -loop 0 output.mp4'

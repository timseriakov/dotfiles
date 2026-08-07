# tmuxai

## Install the CLI

Run the official package:

```
brew install tmuxai
```

## Wire up this repo-managed config

From your dotfiles repository:

```
cd ~/dev/dotfiles/tmuxai && ./install.sh
```

## Required environment variables

- `OMNIROUTE_TMUX_AI_API_KEY` (used by the `fast` and `smart` models)

Keep secrets out of version control; `config.yaml` references the key via `${OMNIROUTE_TMUX_AI_API_KEY}`.

## Launch tmuxai

Once installed and configured, start the assistant with:

```
tmuxai
```

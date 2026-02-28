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

- `OPENROUTER_API_KEY` (used by the default `fast` model)
- `OPENAI_API_KEY` (optional, powers the `codex` fallback)
- `GOOGLE_API_KEY` (optional, only needed if you enable `gemini-flash`)

Keep secrets out of version control; the YAML references them via `${VAR}`.

## Launch tmuxai

Once installed and configured, start the assistant with:

```
tmuxai
```

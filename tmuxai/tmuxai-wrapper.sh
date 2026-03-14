#!/usr/bin/env fish

# TmuxAI v2.1.0 has a bug where environment variables are not expanded
# inside the 'models:' map in config.yaml.
# This wrapper bypasses the bug by forcing a fallback to the legacy 'openai'
# configuration and supplying the API key via environment variables.

# Force top-level OpenAI config which TmuxAI expands correctly
set -gx TMUXAI_OPENAI_API_KEY "$OPENAI_API_KEY"
set -gx TMUXAI_OPENAI_MODEL "gpt-5-mini"

# Clear default_model to ensure it falls back to the top-level OpenAI config
set -gx TMUXAI_DEFAULT_MODEL ""

exec /opt/homebrew/bin/tmuxai $argv

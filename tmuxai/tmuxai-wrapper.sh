#!/usr/bin/env fish

# TmuxAI v2.1.0 has a bug where environment variables are not expanded
# inside the 'models:' map in config.yaml.
# This wrapper bypasses the bug by forcing a fallback to the legacy 'openai'
# configuration and supplying the API key via environment variables.

set -gx TMUXAI_DEFAULT_MODEL "__legacy__"
set -gx TMUXAI_OPENAI_API_KEY "$OPENAI_API_KEY"

# Fallback to gpt-5-mini if not specified
if not set -q TMUXAI_OPENAI_MODEL
    set -gx TMUXAI_OPENAI_MODEL "gpt-5-mini"
end

exec /opt/homebrew/bin/tmuxai $argv

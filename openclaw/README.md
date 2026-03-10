# OpenClaw Release Watcher

JS watcher for `code-yeongyu/oh-my-openagent` releases with explanatory Telegram notifications.

## What it does

- Checks GitHub releases for `code-yeongyu/oh-my-openagent` every 2 hours.
- Tracks the last seen tag in `~/.openclaw-watch/omo_last_tag.txt`.
- Generates a practical Russian summary via OpenAI (not a raw changelog).
- Sends one Telegram message only when a new release appears.
- Uses Telegram HTML formatting for stable rendering in chat.

Summary structure:

1. What changed
2. Who should care
3. How to use it
4. What to verify after update
5. Risks/compatibility notes

## Runtime setup

This setup uses **OpenClaw built-in cron**.

- `OPENAI_API_KEY` is loaded from `~/dev/dotfiles/fish/secrets.fish`.
- `GITHUB_TOKEN` is optional but recommended (also auto-loaded from `~/dev/dotfiles/fish/secrets.fish`) to avoid GitHub API rate limits.
- Telegram settings are read from OpenClaw config (`~/.openclaw/openclaw.json`):
  - `channels.telegram.botToken`
  - first entry from `channels.telegram.allowFrom` as destination chat id

## Install

```bash
cd ~/dev/dotfiles/openclaw
chmod +x omo-release-watcher.sh omo-release-watcher-control.sh
./omo-release-watcher-control.sh install
```

## Commands

```bash
./omo-release-watcher-control.sh install    # add OpenClaw cron job
./omo-release-watcher-control.sh uninstall  # remove OpenClaw cron job
./omo-release-watcher-control.sh status     # scheduler + jobs
./omo-release-watcher-control.sh run        # run job now
./omo-release-watcher-control.sh logs       # show run history
```

## Files

- `omo-release-watcher.js` — main Node.js watcher
- `omo-release-watcher.sh` — wrapper that exports `OPENAI_API_KEY` from fish secrets
- `omo-release-watcher-control.sh` — OpenClaw cron job manager

# tmux Customizations for ActivityWatch

This directory contains customized files for `aw-watcher-tmux`, a plugin for monitoring tmux activity with ActivityWatch.

These files are managed in this `dotfiles` repository to track changes and ensure they are not overwritten by plugin updates. The original files are replaced by symbolic links pointing to the files in this directory.

## Files

- `aw-watcher-tmux.toml`: The configuration file for the watcher. This was created because it was missing.
- `monitor-session-activity.sh`: A modified version of the watcher's main script to fix a bug with JSON payload generation.

## Symlink Creation

To set up the symbolic links after cloning the `dotfiles` repository, run the following commands:

```bash
# Create the target directory for the config file if it doesn't exist
mkdir -p "/Users/tim/Library/Application Support/activitywatch/aw-watcher-tmux"

# Create the symlink for the config file
ln -sfn "/Users/tim/dev/dotfiles/tmux/aw-watcher-tmux.toml" "/Users/tim/Library/Application Support/activitywatch/aw-watcher-tmux/aw-watcher-tmux.toml"

# Create the symlink for the script
ln -sfn "/Users/tim/dev/dotfiles/tmux/monitor-session-activity.sh" "/Users/tim/.tmux/plugins/aw-watcher-tmux/scripts/monitor-session-activity.sh"
```

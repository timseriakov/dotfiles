# fx config notes

`fx` refuses to read `~/.fx/settings.json` when it is a symlink (`durable_path_unsafe`).

Keep the source config here:

```text
~/dev/dotfiles/fx/settings.json
```

After changing it, run:

```sh
~/dev/dotfiles/fx/copy-config.sh
```

The script copies `settings.json` to `~/.fx/settings.json` as a regular file and reloads the local Omnirouter proxy LaunchAgent.

Do not commit auth state, sessions, history, locks, backups, logs, or API keys.

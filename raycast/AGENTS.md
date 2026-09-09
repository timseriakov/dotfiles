# Raycast notes for future agents

## Kill Process on pre-Tahoe Raycast

The current Store version of `Kill Process` requires Raycast `v1.104.1`, so it cannot be installed on the user's Raycast `v1.93.2`. This is a Raycast v1 API mismatch, not a reason to upgrade macOS to Tahoe.

Use the older source revision whose parent is `67bf5d48d2c47d4a885a46f7a8ed419c3fec56ee`. Commit `f4ea41ccf6698212c4c4465069bdb4e6f69275d8` raised `@raycast/api` from `^1.90.0` to `^1.104.1`.

The local clone is kept here:

```text
~/Documents/Raycast Extensions/extensions/extensions/kill-process
```

If it needs to be restored, use:

```bash
cd "$HOME/Documents/Raycast Extensions/extensions"
git fetch origin 67bf5d48d2c47d4a885a46f7a8ed419c3fec56ee
git checkout 67bf5d48d2c47d4a885a46f7a8ed419c3fec56ee -- extensions/kill-process
cd extensions/kill-process
npm ci
npm run dev
```

After Raycast reports the extension as ready/it appears in Raycast, `Ctrl+C` may stop `npm run dev`; the local extension remains installed. Keep the source directory and do not run `npm update` or `npm audit fix`, because changing the locked dependency versions can reintroduce the incompatibility.

Do not install the current Store version, change its API dependency by hand, unblock macOS Tahoe update domains, or upgrade Raycast unless the user explicitly asks for that migration.

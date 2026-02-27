# pinchtab - Headless Chrome Bridge

Headless Chrome bridge for controlling browser sessions. Runs as a launchd service on localhost only.

## Quick Start

### Install

```bash
cd ~/dev/dotfiles/pinchtab
./install.sh
```

This installs the launchd service (`com.local.pinchtab.server`) and creates symlinks for config and plist files.

### Service Control

```bash
cd ~/dev/dotfiles/pinchtab
./launchd-control.sh <command>
```

Available commands:

- `install` - Install and start the service
- `uninstall` - Stop and remove the service
- `start` - Start the service
- `stop` - Stop the service
- `restart` - Restart the service
- `status` - Show service status
- `logs` - Show recent logs
- `follow` - Follow logs in real-time

## Configuration

Config location: `~/.pinchtab/config.json` (symlinked from `pinchtab/config.json`)

Current defaults:

- Listen address: `127.0.0.1:9867` (localhost only)
- Headless mode: enabled
- State directory: `~/.pinchtab`
- Chrome profile: `~/.pinchtab/chrome-profile`

**Security note**: Service binds to `127.0.0.1` only. No mandatory API token by default. If you expose the port beyond localhost, set `BRIDGE_TOKEN` in config.

## Health Check

Check if the service is responding:

```bash
curl http://127.0.0.1:9867/health
```

Or use the status command:

```bash
cd ~/dev/dotfiles/pinchtab
./launchd-control.sh status
```

## Logs

Log directory: `~/Library/Logs/pinchtab/`

- `stdout.log` - Standard output
- `stderr.log` - Standard error

View logs:

```bash
# Recent logs
cd ~/dev/dotfiles/pinchtab
./launchd-control.sh logs

# Follow in real-time
./launchd-control.sh follow
```

## Troubleshooting

### Exit code 126 (binary not found)

If the launchd job shows `last exit code = 126`, check stderr logs for "resolved binary path missing" errors.

**Symptoms**:

- launchctl shows exit code 126
- Logs indicate `/opt/homebrew/bin/pinchtab` cannot be found

**Remediation**:

1. Ensure pinchtab binary is installed and on PATH
2. Run `which pinchtab` to verify the binary location
3. If using Homebrew: `brew install pinchtab` or `brew reinstall pinchtab`
4. Restart the service: `./launchd-control.sh restart`

The LaunchAgent uses `npm prefix -g` to resolve the binary path dynamically, avoiding fixed Homebrew paths.

### Service not responding

1. Check service status: `./launchd-control.sh status`
2. Check logs: `./launchd-control.sh logs`
3. Verify port: `lsof -i :9867`
4. Restart service: `./launchd-control.sh restart`

## Manual Dashboard

The pinchtab dashboard runs **on-demand only** and is **not** autostarted by the launchd service.

To launch the dashboard manually:

```bash
pinchtab dashboard
```

Or run it on a specific monitoring port:

```bash
./launchd-control.sh dashboard 9879
# opens dashboard at http://127.0.0.1:9879/dashboard
```

The launchd service (`com.local.pinchtab.server`) runs in headless mode and does not include the dashboard UI.

## Service Details

- **Label**: `com.local.pinchtab.server`
- **Domain**: `gui/$(id -u)`
- **Plist**: `~/Library/LaunchAgents/com.local.pinchtab.server.plist`

Check launchd job status:

```bash
launchctl print "gui/$(id -u)/com.local.pinchtab.server" | head
```

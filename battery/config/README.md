# Battery Automation Configuration

This directory contains the configuration and documentation for the macOS battery automation system.

## System Overview

The system automates battery health management using the `battery` CLI (v1.3.2) as the backend. It manages charging thresholds based on the current operational mode.

### Operational Behaviors

- **Server Mode**: Maintains the battery at 75% charge level (`battery maintain 75`) to maximize longevity while connected to power indefinitely.
- **Mobile Mode**: Stops the maintenance cap (`battery maintain stop`) to allow standard macOS charging behavior. Full charge to 100% is opt-in via `battery charge 100`.
- **Auto-Return**: A KeepAlive supervisor loop (running every 120 seconds) that automatically returns the system from Mobile to Server mode based on a timer or home WiFi SSID detection.
- **Weekly Maintenance**: Every Sunday at 04:00, the system discharges the battery to 60% (`battery discharge 60`) and then restores Server Mode to maintain chemical health.

### Important Constraints

- **No Automatic Sleep Prevention**: The system does NOT automatically prevent system sleep.
- **No Automatic pmset Changes**: The system does NOT apply any `pmset` changes automatically.
- **Manual Opt-in for Full Charge**: Mobile mode defaults to stopping the maintenance cap; charging to 100% must be explicitly requested.

## Log Locations

Logs for the LaunchAgents are stored in the following locations:

- **Server Mode Agent**:
  - `/tmp/battery-servermode.out`
  - `/tmp/battery-servermode.err`
- **Auto-Return Agent**:
  - `/tmp/battery-autoreturn.out`
  - `/tmp/battery-autoreturn.err`
- **Weekly Maintenance Agent**:
  - `/tmp/battery-maintenance.out`
  - `/tmp/battery-maintenance.err`

## Recommended Power Management Settings

For optimal automation performance, the following `pmset` configurations are recommended. These should be applied manually via Terminal; the automation system does not modify these settings automatically.

```bash
sudo pmset -a sleep 0
sudo pmset -a disksleep 0
sudo pmset -a displaysleep 5
sudo pmset -a standby 0
sudo pmset -a autopoweroff 0
sudo pmset -a powernap 1
sudo pmset -a tcpkeepalive 1
sudo pmset -a womp 1
```

## Caffeinate Usage

The `caffeinate` utility can be used to prevent system sleep during critical tasks.

Examples:

- Prevent sleep while a command runs: `caffeinate -i <command>`
- Prevent sleep for a specific duration (e.g., 1 hour): `caffeinate -u -t 3600`
- Prevent sleep until a specific process ID exits: `caffeinate -w <pid>`

## Installation and Symlinks

The system components (launch agents, scripts, and configurations) are managed via symlinks. These links are created and managed by the `install.sh` script located in the repository root. All real files reside in `$HOME/dev/dotfiles/battery/`.

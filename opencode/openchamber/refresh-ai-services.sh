#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

OPENCODE_PLIST="$REPO_ROOT/com.opencode.serve.plist"
OPENCHAMBER_PLIST="$REPO_ROOT/openchamber/com.openchamber.web.plist"

if ! command -v volta >/dev/null 2>&1; then
  echo "Error: volta is not installed or not in PATH"
  exit 1
fi

OPENCODE_BIN="$(volta which opencode)"
OPENCHAMBER_BIN="$HOME/.bun/bin/openchamber"

if [ ! -x "$OPENCODE_BIN" ]; then
  echo "Error: opencode binary not found: $OPENCODE_BIN"
  exit 1
fi

OPENCHAMBER_SERVER_JS="$HOME/.bun/install/global/node_modules/@openchamber/web/server/index.js"
if [ ! -f "$OPENCHAMBER_SERVER_JS" ]; then
  echo "Error: openchamber server entrypoint not found: $OPENCHAMBER_SERVER_JS"
  exit 1
fi

if [ -x "$HOME/.bun/bin/bun" ]; then
  BUN_BIN="$HOME/.bun/bin/bun"
elif command -v bun >/dev/null 2>&1; then
  BUN_BIN="$(command -v bun)"
else
  echo "Error: bun binary not found (expected at \$HOME/.bun/bin/bun)"
  exit 1
fi

cat > "$OPENCODE_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.opencode.serve</string>

    <key>ProgramArguments</key>
    <array>
        <string>$OPENCODE_BIN</string>
        <string>serve</string>
        <string>--hostname</string>
        <string>0.0.0.0</string>
        <string>--port</string>
        <string>4096</string>
    </array>

    <key>WorkingDirectory</key>
    <string>$HOME</string>

    <key>RunAtLoad</key>
    <true/>

    <key>StandardOutPath</key>
    <string>$HOME/tmp/opencode/serve-stdout.log</string>

    <key>StandardErrorPath</key>
    <string>$HOME/tmp/opencode/serve-stderr.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>$HOME/.volta/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>HOME</key>
        <string>$HOME</string>
    </dict>

    <key>ProcessType</key>
    <string>Interactive</string>

    <key>ExitTimeOut</key>
    <integer>30</integer>
</dict>
</plist>
EOF

cat > "$OPENCHAMBER_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.openchamber.web</string>

    <key>ProgramArguments</key>
    <array>
        <string>$BUN_BIN</string>
        <string>$OPENCHAMBER_SERVER_JS</string>
        <string>--port</string>
        <string>1911</string>
    </array>

    <key>WorkingDirectory</key>
    <string>$HOME</string>

    <key>RunAtLoad</key>
    <true/>

    <key>StandardOutPath</key>
    <string>$HOME/tmp/openchamber/stdout.log</string>

    <key>StandardErrorPath</key>
    <string>$HOME/tmp/openchamber/stderr.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>$HOME/.volta/bin:$HOME/.bun/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>HOME</key>
        <string>$HOME</string>
    </dict>

    <key>ProcessType</key>
    <string>Interactive</string>

    <key>ExitTimeOut</key>
    <integer>30</integer>
</dict>
</plist>
EOF

echo "Updated plist files:"
echo "  $OPENCODE_PLIST"
echo "  $OPENCHAMBER_PLIST"

"$REPO_ROOT/launchd-control.sh" install
"$SCRIPT_DIR/launchd-control.sh" install

echo
echo "Service status:"
"$REPO_ROOT/launchd-control.sh" status
"$SCRIPT_DIR/launchd-control.sh" status


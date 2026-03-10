#!/bin/bash
set -e

SUDOERS_FILE="/private/etc/sudoers.d/openclaw-tailscale"
TAILSCALE_BIN="/Applications/Tailscale.app/Contents/MacOS/Tailscale"

TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT

SUDO_USER=${SUDO_USER:-$USER}
WHOAMI=$SUDO_USER

echo "󰜢  Готовлю правило sudoers для OpenClaw на $WHOAMI..."
cat <<EOF >"$TMPFILE"
# Allow OpenClaw to manage Tailscale CLI without password
$WHOAMI ALL=(root) NOPASSWD: $TAILSCALE_BIN *
EOF

echo "󰜢  Проверяю синтаксис через visudo -cf..."
sudo visudo -cf "$TMPFILE"

echo "󰞤  Сохраняю правило в $SUDOERS_FILE..."
sudo bash -c "umask 226 && cat '$TMPFILE' > '$SUDOERS_FILE'"

echo "󰇵  Правило настроено, можно использовать sudo без пароля для Tailscale CLI."

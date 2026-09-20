#!/usr/bin/env bash
set -euo pipefail

repo=$(cd "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/bin" "$tmp/home/dev/dotfiles/battery/config"
cp "$repo/bin/battery-mode.sh" "$tmp/bin/battery-mode.sh"
sed -i '' "s|LOCK_DIR=.*|LOCK_DIR=\"$tmp/home/dev/dotfiles/battery/config/.lockdir\"|; s|STATE_FILE=.*|STATE_FILE=\"$tmp/home/dev/dotfiles/battery/config/state.env\"|" "$tmp/bin/battery-mode.sh"
cat >"$tmp/bin/battery" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$BATTERY_CALLS"
EOF
chmod +x "$tmp/bin/battery" "$tmp/bin/battery-mode.sh"
export HOME="$tmp/home" BATTERY_CALLS="$tmp/calls"
sed -i '' "s|PATH=.*|PATH=\"$tmp/bin:/usr/bin:/bin\"|" "$tmp/bin/battery-mode.sh"

"$tmp/bin/battery-mode.sh" server >/dev/null
"$tmp/bin/battery-mode.sh" mobile 6 --charge >/dev/null
expected=$'maintain 75\nmaintain stop\nmaintain 100'
[[ $(cat "$BATTERY_CALLS") == "$expected" ]]
grep -qx 'MODE=mobile' "$tmp/home/dev/dotfiles/battery/config/state.env"

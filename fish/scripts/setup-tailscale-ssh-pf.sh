#!/bin/bash
set -e

echo "󰋼  Looking for Tailscale IP and interface..."
sleep 2

TS_INTERFACE=$(ifconfig | awk '
/^[a-z]/ { iface=$1 }
/inet 100\./ { sub(":", "", iface); print iface; exit }
')

if [ -z "$TS_INTERFACE" ]; then
  echo "󰅙  Could not detect Tailscale interface"
  exit 1
fi

echo "󰈸  Detected Tailscale interface: $TS_INTERFACE"

PF_FILE="/etc/pf.conf.tailssh"

echo "󰩈  Writing config to $PF_FILE..."

sudo tee "$PF_FILE" >/dev/null <<EOF
set skip on lo0
scrub in all

pass in quick on $TS_INTERFACE proto tcp from 100.0.0.0/8 to any port 22 keep state
block drop in quick proto tcp from any to any port = 22

pass out all keep state
EOF

echo "󰈼  pf.conf written:"
cat "$PF_FILE"

echo "󱓻  Reloading pf with new rules..."
sudo pfctl -f "$PF_FILE" || true
sudo pfctl -e || true

echo "󰄬  pf enabled and rules applied"

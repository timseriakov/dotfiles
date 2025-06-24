#!/bin/bash

set -e

echo "󰋼  Looking for Tailscale IP and interface..."
sleep 5

TS_INTERFACE=$(ifconfig | awk '
/^[a-z]/ { iface=$1 }
/inet 100\./ { sub(":", "", iface); print iface; exit }
')

if [ -z "$TS_INTERFACE" ]; then
  echo "󰅙  Could not detect utun interface with 100.x.x.x address"
  echo "  --- Debug ifconfig dump ---"
  ifconfig
  exit 1
fi

echo "󰈸  Detected Tailscale interface: $TS_INTERFACE"

PF_FILE="/etc/pf.conf.tailssh"

echo "󰩈  Writing config to $PF_FILE..."

sudo tee "$PF_FILE" >/dev/null <<EOF
set skip on lo0
scrub in all
block all

pass out all keep state

pass in on $TS_INTERFACE proto tcp from 100.0.0.0/8 to any port 22 keep state
EOF

echo "󰈼  pf.conf written. Contents:"
cat "$PF_FILE"

echo "󱓻  Reloading pf with new rules..."
sudo pfctl -f "$PF_FILE" 2>/dev/null || true
sudo pfctl -e 2>/dev/null || true

echo "󰄬  pf enabled and rules applied"

exit 0

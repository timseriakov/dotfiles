#!/usr/bin/env fish
# One-time bootstrap: create the ActivityWatch bucket used by the bridge.
# Usage: bin/aw-heartbeat-bridge-bootstrap.fish [http://127.0.0.1:5600]

set -l AW_BASE 'http://127.0.0.1:5600'
if test (count $argv) -ge 1
  set AW_BASE $argv[1]
end
set AW_BASE (string replace -r '/$' '' $AW_BASE)
set -l HOST (python3 -c 'import socket; print(socket.gethostname())')
set -l BUCKET aw-watcher-qutebrowser_$HOST

echo "Creating bucket $BUCKET on $AW_BASE ..."
set -l DATA (printf '{"client":"%s","type":"%s","hostname":"%s"}' 'aw-heartbeat-bridge' 'event' "$HOST")
curl -sS -i -X POST "$AW_BASE/api/0/buckets/$BUCKET" -H 'Content-Type: application/json' --data-raw "$DATA" | sed -n '1,40p'

echo "Querying bucket back:"
curl -sS -i "$AW_BASE/api/0/buckets/$BUCKET" | sed -n '1,80p'

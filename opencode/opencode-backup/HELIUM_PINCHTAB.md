# Helium + Pinchtab: practical guide

This note captures the stable setup that worked in this environment.

## What works reliably

- Use your existing Helium session (cookies/logins) via CDP.
- Run Pinchtab against Helium browser WebSocket URL, not just HTTP CDP URL.
- Use explicit `tabId` for actions in multi-tab flows.

## 1) Start Helium with remote debugging

Close any old Helium instance first:

```bash
osascript -e 'tell application "Helium" to quit'
```

Start Helium with a debug port:

```bash
/Applications/Helium.app/Contents/MacOS/Helium \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9333 \
  >/tmp/helium-debug.log 2>&1 &
```

Check endpoint:

```bash
curl -s http://127.0.0.1:9333/json/version
```

## 2) Start Pinchtab connected to Helium (stable mode)

Get `webSocketDebuggerUrl` and use it as `CDP_URL`:

```bash
WS_URL=$(curl -s http://127.0.0.1:9333/json/version | python3 -c 'import sys,json; print(json.load(sys.stdin)["webSocketDebuggerUrl"])')

CDP_URL="$WS_URL" \
BRIDGE_PORT=9868 \
BRIDGE_HEADLESS=false \
BRIDGE_NO_RESTORE=true \
pinchtab >/tmp/pinchtab-helium.log 2>&1 &
```

Health check:

```bash
curl -s http://127.0.0.1:9868/health
PINCHTAB_URL=http://127.0.0.1:9868 pinchtab health
```

## 3) Daily commands

```bash
PINCHTAB_URL=http://127.0.0.1:9868 pinchtab tabs
PINCHTAB_URL=http://127.0.0.1:9868 pinchtab snap -i -c --tab <TAB_ID>
PINCHTAB_URL=http://127.0.0.1:9868 pinchtab text
```

For clicks in a specific tab (more deterministic):

```bash
curl -s -X POST http://127.0.0.1:9868/action \
  -H "Content-Type: application/json" \
  -d '{"tabId":"<TAB_ID>","kind":"click","ref":"e147","waitNav":true}'
```

## 4) If requests hang

Symptom: `pinchtab tabs` or `curl .../health` times out.

Recovery:

```bash
pkill -f "/Users/tim/.pinchtab/bin/0.7.6/pinchtab-darwin-arm64"
pkill -f "node .*pinchtab"

WS_URL=$(curl -s http://127.0.0.1:9333/json/version | python3 -c 'import sys,json; print(json.load(sys.stdin)["webSocketDebuggerUrl"])')

CDP_URL="$WS_URL" BRIDGE_PORT=9868 BRIDGE_HEADLESS=false BRIDGE_NO_RESTORE=true pinchtab >/tmp/pinchtab-helium.log 2>&1 &
```

## 5) Notes about login/session

- Pinchtab does not import sessions from another engine automatically.
- In this setup, Helium is Chromium-based, so attaching via CDP reuses your active Helium session.
- If Google blocks login in automation context, sign in manually in Helium window, then continue automation through the same attached instance.

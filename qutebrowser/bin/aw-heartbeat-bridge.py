#!/usr/bin/env python3
"""
Small local bridge for ActivityWatch.

Listens on 127.0.0.1:8437 (POST /heartbeat) and forwards events to
ActivityWatch server (default http://127.0.0.1:5600) into a bucket
"aw-watcher-qutebrowser_{hostname}".

Usage:
  python3 bin/aw-heartbeat-bridge.py [--port 8437] [--aw http://127.0.0.1:5600]

No external dependencies.
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.request import urlretrieve
import urllib.error
import json
import socket
import sys
import argparse
import time
import platform
import os


def ensure_bucket(aw_base: str, bucket_id: str, meta_hostname: str):
    """Ensure bucket exists on aw-server.

    Tries to PUT bucket metadata; ignores errors if it already exists.
    """
    url_post = f"{aw_base}/api/0/buckets/{bucket_id}"
    data = json.dumps({
        "client": "aw-heartbeat-bridge",
        "type": "event",
        "hostname": meta_hostname,
        "name": bucket_id,
    }).encode("utf-8")
    # First try POST (works with certain aw-server builds)
    req = Request(url_post, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with urlopen(req, timeout=3) as resp:
            resp.read()
            print(f"Bucket ensured (POST): {bucket_id}")
            return
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8", "ignore")
        except Exception:
            body = ""
        print(f"ensure_bucket POST HTTPError {e.code}: {body}")
        # Fall back to PUT if POST not allowed
    # Fallback to PUT
    url_put = url_post
    req = Request(url_put, data=data, method="PUT")
    req.add_header("Content-Type", "application/json")
    try:
        with urlopen(req, timeout=3) as resp:
            resp.read()
            print(f"Bucket ensured (PUT): {bucket_id}")
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8", "ignore")
        except Exception:
            body = ""
        print(f"ensure_bucket PUT HTTPError {e.code}: {body}")
    except Exception:
        raise


def post_event(aw_base: str, bucket_id: str, ts: str, url: str, title: str):
    """Send a single event to aw-server."""
    api = f"{aw_base}/api/0/buckets/{bucket_id}/events"
    event = {
        "timestamp": ts,
        "duration": 0,
        "data": {
            "app": "qutebrowser",
            "url": url,
            "title": title,
        },
    }
    body = json.dumps(event).encode("utf-8")
    req = Request(api, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    with urlopen(req, timeout=3) as resp:
        resp.read()


def heartbeat_event(aw_base: str, bucket_id: str, ts: str, url: str, title: str, pulsetime: int = 15):
    """Send a heartbeat which lets aw-server aggregate durations.

    pulsetime controls how far apart heartbeats can be and still be merged
    into a single event. Since the userscript sends every ~5s, 15s is sane.
    """
    api = f"{aw_base}/api/0/buckets/{bucket_id}/heartbeat?pulsetime={int(pulsetime)}"
    event = {
        "timestamp": ts,
        "duration": 0,
        "data": {
            "app": "qutebrowser",
            "url": url,
            "title": title,
        },
    }
    body = json.dumps(event).encode("utf-8")
    req = Request(api, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    with urlopen(req, timeout=3) as resp:
        resp.read()


def bucket_exists(aw_base: str, bucket_id: str) -> bool:
    try:
        with urlopen(f"{aw_base}/api/0/buckets/{bucket_id}", timeout=2) as resp:
            _ = resp.read()
            return True
    except Exception as e:
        return False


class Handler(BaseHTTPRequestHandler):
    server_version = "aw-heartbeat-bridge/1.0"

    def do_POST(self):  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path != "/heartbeat":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8")) if raw else {}
        except Exception:
            payload = {}

        url = (payload.get("url") or "").strip()
        title = (payload.get("title") or "").strip()
        ts = (payload.get("ts") or "").strip()

        # Ignore non-http(s) URLs, but be forgiving about whitespace/case
        low = url.lower()
        if not (low.startswith("http://") or low.startswith("https://")):
            # Log ignored payload for debugging
            try:
                print(f"IGNORED (non-http): url='{url}' title='{title}' ts='{ts}'")
            except Exception:
                pass
            self.send_response(204)
            self.end_headers()
            return

        bucket_id = self.server.bucket_id
        aw_base = self.server.aw_base
        pulsetime = self.server.pulsetime
        meta_hostname = self.server.meta_hostname

        try:
            try:
                # Prefer heartbeat to aggregate durations for graphs
                heartbeat_event(aw_base, bucket_id, ts, url, title, pulsetime=pulsetime)
            except urllib.error.HTTPError as e:
                code = getattr(e, 'code', None)
                body = ''
                try:
                    body = e.read().decode('utf-8', 'ignore')
                except Exception:
                    pass
                print(f"post_event HTTPError {code}: {body}")
                if code == 404:
                    exists = bucket_exists(aw_base, bucket_id)
                    print(f"Bucket exists before create? {exists}")
                    print("Retrying after creating bucket...")
                    ensure_bucket(aw_base, bucket_id, meta_hostname)
                    exists_after = bucket_exists(aw_base, bucket_id)
                    print(f"Bucket exists after create? {exists_after}")
                    heartbeat_event(aw_base, bucket_id, ts, url, title, pulsetime=pulsetime)
                else:
                    raise

            # log to stdout
            print(f"HB -> AW: {ts} {title} {url}")
            self.send_response(200)
            self.end_headers()
        except Exception as e:
            msg = f"Error forwarding to AW: {e}"
            print(msg, file=sys.stderr)
            self.send_response(502)
            self.end_headers()

    def log_message(self, format, *args):  # noqa: A003
        # Keep server quiet; we log only successful forwards/errors
        return


def probe_aw_base(preferred: str) -> str:
    """Try a few common ActivityWatch endpoints and return the first that works."""
    candidates = []
    if preferred:
        candidates.append(preferred.rstrip('/'))
    # common defaults
    candidates += [
        'http://127.0.0.1:5600',
        'http://localhost:5600',
        'http://127.0.0.1:5665',
        'http://127.0.0.1:5666',
    ]
    seen = set()
    for base in candidates:
        if base in seen:
            continue
        seen.add(base)
        try:
            with urlopen(base + '/api/0/version', timeout=1.5) as resp:
                _ = resp.read()
                print(f"aw-server detected at {base}")
                return base
        except Exception:
            continue
    return preferred.rstrip('/') if preferred else 'http://127.0.0.1:5600'


def choose_hostname(cli_hostname: str | None) -> str:
    # priority: cli -> env -> platform.node with .local -> socket.gethostname
    if cli_hostname:
        return cli_hostname
    env = os.environ.get('AW_BRIDGE_HOSTNAME')
    if env:
        return env
    node = platform.node()
    if node and node.endswith('.local'):
        return node
    host = socket.gethostname()
    return host


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8437)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--aw", default="http://127.0.0.1:5600")
    parser.add_argument("--pulsetime", type=int, default=15)
    parser.add_argument("--hostname", default=None)
    parser.add_argument("--bucket-id", default=None)
    args = parser.parse_args()

    host = args.host
    port = args.port
    aw_base = probe_aw_base(args.aw)
    meta_hostname = choose_hostname(args.hostname)
    bucket_id = args.bucket_id or f"aw-watcher-qutebrowser_{meta_hostname}"

    httpd = HTTPServer((host, port), Handler)
    httpd.bucket_id = bucket_id
    httpd.aw_base = aw_base
    httpd.pulsetime = max(5, int(args.pulsetime))
    httpd.meta_hostname = meta_hostname
    print(f"Listening on http://{host}:{port}/heartbeat -> {aw_base} bucket={bucket_id} hostname={meta_hostname}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")


if __name__ == "__main__":
    main()

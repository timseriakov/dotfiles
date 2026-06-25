#!/usr/bin/env python3
import json
import subprocess
import sys

if len(sys.argv) != 3:
    raise SystemExit("usage: hunk-commit-items.py <start-directory> <popup-helper>")

start_dir, popup_helper = sys.argv[1:]
try:
    repo = subprocess.check_output(
        ["git", "-C", start_dir, "rev-parse", "--show-toplevel"],
        text=True,
        stderr=subprocess.DEVNULL,
    ).strip()
    rows = subprocess.check_output(
        ["git", "-C", repo, "log", "--date=short", "--pretty=format:%h%x09%ad%x09%s", "-50"],
        text=True,
    ).splitlines()
except subprocess.CalledProcessError:
    print("[]")
    raise SystemExit(0)

items = []
for row in rows:
    short, date, subject = row.split("\t", 2)
    items.append({
        "icon": "󰜘",
        "category": "Commits",
        "title": f"{short}  {subject}",
        "description": date,
        "action": {"shell": f"{popup_helper} {json.dumps(repo)} hunk show {short}"},
    })

print(json.dumps(items, ensure_ascii=False))

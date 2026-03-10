#!/bin/bash

set -euo pipefail

SCRIPT_PATH="/Users/tim/dev/dotfiles/openclaw/omo-release-watcher.sh"
JOB_NAME="oh-my-openagent release watcher"
TZ_NAME="Europe/Minsk"

find_job_id() {
  openclaw cron list --all --json | node -e '
    let data = "";
    process.stdin.on("data", chunk => (data += chunk));
    process.stdin.on("end", () => {
      const parsed = JSON.parse(data);
      const jobs = parsed.jobs || [];
      const match = jobs.find(job => job.name === process.argv[1]);
      if (match) {
        process.stdout.write(match.id);
      }
    });
  ' "$JOB_NAME"
}

case "${1:-}" in
  install)
    if [ ! -x "$SCRIPT_PATH" ]; then
      chmod +x "$SCRIPT_PATH"
    fi

    if [ -n "$(find_job_id || true)" ]; then
      echo "[INFO] Cron job already exists: $(find_job_id)"
      exit 0
    fi

    openclaw cron add \
      --name "$JOB_NAME" \
      --agent main \
      --session isolated \
      --every 2h \
      --tz "$TZ_NAME" \
      --timeout-seconds 180 \
      --no-deliver \
      --message "Run this command exactly: $SCRIPT_PATH . If output contains '[INFO] No new release', respond exactly NO_REPLY. If output contains '[SUCCESS]', respond exactly WATCHER_OK. If command errors, include one short error line." >/dev/null

    echo "[OK] Installed cron job: $(find_job_id)"
    ;;

  uninstall)
    JOB_ID="$(find_job_id || true)"
    if [ -z "$JOB_ID" ]; then
      echo "[INFO] Job not found"
      exit 0
    fi
    openclaw cron rm "$JOB_ID" >/dev/null
    echo "[OK] Removed cron job: $JOB_ID"
    ;;

  status)
    openclaw cron status
    echo
    openclaw cron list
    ;;

  run)
    JOB_ID="$(find_job_id || true)"
    if [ -z "$JOB_ID" ]; then
      echo "[ERROR] Job not found. Run: $0 install"
      exit 1
    fi
    openclaw cron run "$JOB_ID"
    ;;

  logs)
    JOB_ID="$(find_job_id || true)"
    if [ -z "$JOB_ID" ]; then
      echo "[ERROR] Job not found. Run: $0 install"
      exit 1
    fi
    openclaw cron runs --id "$JOB_ID"
    ;;

  *)
    echo "Usage: $0 {install|uninstall|status|run|logs}"
    exit 1
    ;;
esac

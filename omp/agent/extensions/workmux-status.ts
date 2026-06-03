/**
 * Workmux status tracking extension for Oh My Pi.
 *
 * Reports agent lifecycle status to workmux so tmux windows, the dashboard,
 * and the sidebar can show OMP activity the same way they show Pi activity.
 */

import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

type WorkmuxStatus = "working" | "done";

export default function workmuxStatus(pi: ExtensionAPI): void {
  function setStatus(status: WorkmuxStatus): void {
    pi.exec("workmux", ["set-window-status", status]).catch(() => {});
  }

  pi.on("agent_start", async () => {
    setStatus("working");
  });

  pi.on("agent_end", async () => {
    setStatus("done");
  });
}

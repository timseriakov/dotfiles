import { replaceExactlyOnce } from "./plannotator-setup-goal-tailscale.mjs";

/**
 * The Inbox sidebar's "Reload/ Restart <runtime> N" row, asked to be hidden.
 * Stale sessions stay listed in Settings -> Agents, which keeps the dot there;
 * only the always-visible sidebar row goes.
 */
const RESTART_ROW_BEFORE =
  "        {restartAgents.total > 0 && props.onRestartSessions && <RestartSessionsRow agents={restartAgents} onOpen={pick(props.onRestartSessions)} />}";
const RESTART_ROW_AFTER =
  "        {/* local patch: the sidebar restart row is hidden; Settings -> Agents still lists stale sessions */}";

export function patchInboxSidebarRestart(sidebar) {
  return replaceExactlyOnce(
    sidebar,
    RESTART_ROW_BEFORE,
    RESTART_ROW_AFTER,
    "inbox sidebar restart row",
  );
}

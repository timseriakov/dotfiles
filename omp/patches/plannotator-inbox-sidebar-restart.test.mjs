import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { CACHE, VERSION } from "../build-plannotator-setup-goal.mjs";
import { patchInboxSidebarRestart } from "./plannotator-inbox-sidebar-restart.mjs";

const sidebar = execFileSync(
  "tar",
  [
    "-xOf",
    path.join(CACHE, "source.tar.gz"),
    `plannotator-${VERSION}/packages/inbox/components/Sidebar.tsx`,
  ],
  { encoding: "utf8" },
);

test("sidebar restart row patch removes the row and is idempotent", () => {
  const once = patchInboxSidebarRestart(sidebar);
  assert.ok(!once.includes("<RestartSessionsRow agents={restartAgents}"));
  assert.equal(patchInboxSidebarRestart(once), once);
});

test("sidebar restart row patch fails closed on source drift", () => {
  const drifted = sidebar.replace(
    "<RestartSessionsRow agents={restartAgents}",
    "<RestartSessionsRow agents={stale}",
  );
  assert.throws(() => patchInboxSidebarRestart(drifted), /drift/);
});

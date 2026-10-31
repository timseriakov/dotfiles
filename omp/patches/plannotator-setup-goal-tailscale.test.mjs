import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  ARCHIVE_SHA256,
  CACHE,
  VERSION,
  sha256,
  verifiedPatch,
} from "../build-plannotator-setup-goal.mjs";
import { patchSetupGoalTailnetSources } from "./plannotator-setup-goal-tailscale.mjs";

const archive = path.join(CACHE, "source.tar.gz");
const original = (name) =>
  execFileSync("tar", ["-xOf", archive, `plannotator-${VERSION}/${name}`], {
    encoding: "utf8",
  });
const cli = original("apps/hook/server/index.ts");
const goalSetup = original("packages/server/goal-setup.ts");

test("patch is pinned to verified upstream bytes and reuses native lifecycle", () => {
  assert.equal(sha256(readFileSync(archive)), ARCHIVE_SHA256);
  const result = verifiedPatch(cli, goalSetup);
  assert.match(result.cli, /TAILSCALE_COMMANDS = new Set\(\[.*"setup-goal"/);
  assert.match(
    result.cli,
    /await openBrowser\(await handleTailscaleReady\(port\)\)/,
  );
  assert.match(
    result.cli,
    /await announceTailscaleSession\(url, port\);\n  return url;/,
  );
  assert.ok(
    result.cli.includes(
      "enableTailscaleServe(port, undefined, { persist: setupGoal })",
    ),
  );
  assert.ok(
    result.cli.includes(
      "takeDownOwnServeMapping(runTailscale, port, [`http://127.0.0.1:${port}`])",
    ),
  );
  assert.ok(result.cli.includes("allowServedHostname(new URL(url).hostname)"));
  assert.match(
    result.goalSetup,
    /try \{\n    await onReady\?\.\(serverUrl, isRemote, port\);\n  \} catch \(error\) \{\n    server.stop\(\);\n    throw error;/,
  );
  for (const invariant of [
    "hostname: getServerHostname()",
    "requestHostGuard.check(req)",
    "refuseCrossOriginWrite(req)",
    "stop: () => server.stop()",
  ])
    assert.equal(
      result.goalSetup.includes(invariant),
      goalSetup.includes(invariant),
    );
});

test("reapplying the patch is idempotent", () => {
  const once = patchSetupGoalTailnetSources({ cli, goalSetup });
  assert.deepEqual(patchSetupGoalTailnetSources(once), once);
});

test("missing, duplicated and unrelated source drift fail closed", () => {
  assert.throws(
    () =>
      patchSetupGoalTailnetSources({
        cli: cli.replace("TAILSCALE_COMMANDS", "CHANGED_COMMANDS"),
        goalSetup,
      }),
    /patch drift/,
  );
  assert.throws(
    () => patchSetupGoalTailnetSources({ cli: cli + cli, goalSetup }),
    /patch drift/,
  );
  assert.throws(
    () => verifiedPatch(cli + "\n// unrelated drift", goalSetup),
    /Source drift/,
  );
});

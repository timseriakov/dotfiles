import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  ARCHIVE_SHA256,
  CACHE,
  VERSION,
  isOlderVersion,
  sha256,
  verifiedPatch,
  verifyExecutable,
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

test("installed executable verification requires the pinned version and patch behavior", () => {
  const executable = path.join(CACHE, "plannotator-setup-goal-darwin-arm64");
  assert.match(
    verifyExecutable(executable),
    new RegExp(`plannotator ${VERSION}`),
  );
  assert.throws(() => verifyExecutable(process.execPath), /version mismatch/);
});

test("builder only upgrades valid lower stable versions to its pin", () => {
  assert.equal(isOlderVersion("0.28.46", VERSION), true);
  assert.equal(isOlderVersion("0.28.48", VERSION), true);
  assert.equal(isOlderVersion("0.28.49", VERSION), true);
  assert.equal(isOlderVersion("0.28.50", VERSION), true);
  assert.equal(isOlderVersion("0.28.51", VERSION), true);
  assert.equal(isOlderVersion("0.28.54", VERSION), true);
  assert.equal(isOlderVersion("0.28.55", VERSION), true);
  assert.equal(isOlderVersion("0.29.0", VERSION), false);
  assert.equal(isOlderVersion("0.28.48-beta.1", VERSION), false);
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

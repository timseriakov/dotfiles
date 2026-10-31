function replaceExactlyOnce(source, before, after, label) {
  const count = (text, needle) => text.split(needle).length - 1;
  const afterCount = count(source, after);
  if (afterCount === 1 && !source.replace(after, "").includes(before))
    return source;
  if (afterCount === 0 && count(source, before) === 1) {
    return source.replace(before, after);
  }
  throw new Error(
    `Plannotator setup-goal patch drift at ${label}; refusing to build.`,
  );
}

const CLI_COMMANDS_BEFORE =
  'const TAILSCALE_COMMANDS = new Set(["review", "annotate", "annotate-last", "last"]);';
const CLI_COMMANDS_AFTER =
  'const TAILSCALE_COMMANDS = new Set(["review", "annotate", "annotate-last", "last", "setup-goal"]);';
const CLI_ERROR_BEFORE =
  '      "--tailscale is only supported with: plannotator review, annotate, annotate-last (last)",';
const CLI_ERROR_AFTER =
  '      "--tailscale is only supported with: plannotator review, annotate, annotate-last (last), setup-goal",';
const CLI_READY_BEFORE = `    onReady: (url, isRemote, port) => {
      handleGoalSetupServerReady(url, isRemote, port);
    },`;
const CLI_READY_AFTER = `    onReady: async (url, isRemote, port) => {
      if (tailscaleFlag) {
        await openBrowser(await handleTailscaleReady(port));
        return;
      }
      await handleGoalSetupServerReady(url, isRemote, port);
    },`;
const GOAL_READY_TYPE_BEFORE =
  "  onReady?: (url: string, isRemote: boolean, port: number) => void;";
const GOAL_READY_TYPE_AFTER =
  "  onReady?: (url: string, isRemote: boolean, port: number) => void | Promise<void>;";
const GOAL_READY_CALL_BEFORE = "  onReady?.(serverUrl, isRemote, port);";
const GOAL_READY_CALL_AFTER = `  try {
    await onReady?.(serverUrl, isRemote, port);
  } catch (error) {
    server.stop();
    throw error;
  }`;

export function patchSetupGoalTailnetSources({ cli, goalSetup }) {
  let patchedCli = cli;
  for (const [before, after, label] of [
    [
      CLI_COMMANDS_BEFORE,
      CLI_COMMANDS_AFTER,
      "setup-goal --tailscale command allowlist",
    ],
    [CLI_ERROR_BEFORE, CLI_ERROR_AFTER, "setup-goal --tailscale usage error"],
    [
      'import { announceTailscaleSession, enableTailscaleServe } from "@plannotator/server/tailscale-serve";',
      'import { announceTailscaleSession, enableTailscaleServe, takeDownOwnServeMapping } from "@plannotator/server/tailscale-serve";\nimport { allowServedHostname } from "../../../packages/server/request-host-guard";\nimport { runTailscale } from "@plannotator/shared/tailscale";',
      "reuse native owned-route cleanup",
    ],
    [
      "    ({ url } = enableTailscaleServe(port));",
      `    const setupGoal = args[0] === "setup-goal";
    ({ url } = enableTailscaleServe(port, undefined, { persist: setupGoal }));
    if (setupGoal) {
      allowServedHostname(new URL(url).hostname);
      process.once("exit", () => {
        if (takeDownOwnServeMapping(runTailscale, port, [\`http://127.0.0.1:\${port}\`]) === "failed") {
          process.stderr.write(\`[plannotator] Could not verify/remove own route on port \${port}; inspect tailscale serve status.\\n\`);
        }
      });
      process.once("SIGHUP", () => process.exit(129));
    }`,
      "setup-goal removes only a route it still owns",
    ],
    [
      "async function handleTailscaleReady(port: number): Promise<void> {",
      "async function handleTailscaleReady(port: number): Promise<string> {",
      "return native tailnet URL",
    ],
    [
      "  await announceTailscaleSession(url, port);\n}",
      "  await announceTailscaleSession(url, port);\n  return url;\n}",
      "native tailnet URL after announcement",
    ],
    [
      '<bundle.json | -> [--json]"',
      '<bundle.json | -> [--json] [--tailscale]"',
      "setup-goal usage",
    ],
    [
      CLI_READY_BEFORE,
      CLI_READY_AFTER,
      "setup-goal tailnet startup and browser",
    ],
  ]) {
    patchedCli = replaceExactlyOnce(patchedCli, before, after, label);
  }

  let patchedGoalSetup = goalSetup;
  for (const [before, after, label] of [
    [
      GOAL_READY_TYPE_BEFORE,
      GOAL_READY_TYPE_AFTER,
      "async goal-setup ready callback",
    ],
    [
      GOAL_READY_CALL_BEFORE,
      GOAL_READY_CALL_AFTER,
      "await goal-setup ready callback and close on failure",
    ],
  ]) {
    patchedGoalSetup = replaceExactlyOnce(
      patchedGoalSetup,
      before,
      after,
      label,
    );
  }
  return { cli: patchedCli, goalSetup: patchedGoalSetup };
}

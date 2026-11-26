import { readFileSync } from "node:fs";

export function runPatchRoutes(ctx) {
  const {
    home,
    path,
    write,
    replaceAny,
    patchFile,
    patchFirstExistingFile,
    patchTuiFile,
    patchPiAiFile,
    patchAbsoluteFile,
    setupRuntimeStateLinks,
    rebuildBundledCli,
    patches,
  } = ctx;

  setupRuntimeStateLinks();

  const sourceRoutes = [
    [
      "tools/browser.ts",
      (content) => patches.patchBrowserRelayOnly(content, { replaceAny }),
    ],
    ["cli.ts", patches.patchCliStartupPrepaint],
    ["modes/interactive-mode.ts", patches.patchInteractiveMode],
    [
      "modes/controllers/input-controller.ts",
      (content) =>
        patches.patchExpandedBtwDispatch(patches.patchInputController(content)),
    ],
    [
      "modes/controllers/input-controller.ts",
      patches.patchFocusedSubagentAdvisorController,
    ],
    [
      "slash-commands/builtin-collaboration.ts",
      patches.patchFocusedSubagentAdvisorCommand,
    ],
    [
      "modes/controllers/selector-controller.ts",
      patches.patchRewindTmuxController,
    ],
    ["session/agent-session.ts", patches.patchSessionForkFile],
    ["predict/client.ts", patches.patchPredictClientSuffix],
    [
      "modes/controllers/composer-prediction-controller.ts",
      patches.patchComposerPredictionSlashGate,
    ],
    ["session/session-manager.ts", patches.patchSessionManager],
    ["session/session-manager.ts", patches.patchSessionForkLeaf],
    ["session/session-paths.ts", patches.patchSessionPaths],
    ["session/session-tools.ts", patches.patchSessionTools],
    ["session/turn-recovery.ts", patches.patchTurnRecovery],
    ["session/model-controls.ts", patches.patchModelControlsLunaPriority],
    ["modes/settings.ts", patches.patchSettingsSchemaAttachmentPreview],
    ["config/keybindings/app-keybindings.ts", patches.patchKeybindingsConfig],
    ["ui/composer/vim.ts", patches.patchVimRuLayout],
    ["modes/view-model/status-line/types.ts", patches.patchStatusLineTypes],
    ["ui/status/segments.ts", patches.patchStatusSegments],
    ["ui/status/status-line.tsx", patches.patchStatusLineSubagentBadge],
    ["ui/status/composer-facts.tsx", patches.patchComposerFactsSubagentBadge],
    ["ui/status/segments.ts", patches.patchSessionNameColor],
    ["modes/interactive/frame.tsx", patches.patchWelcomeFrame],
    ["modes/interactive/frame.tsx", patches.patchWorkingBandGap],
    ["modes/interactive-mode.ts", patches.patchQuietWelcomeStartup],
    ["modes/interactive-mode.ts", patches.patchWorkingTitle],
    ["ui/styles/status/top.ts", patches.patchStatusTop],
    ["ui/styles/composer/shapes.ts", patches.patchComposerShapes],
    ["ui/composer/chips.tsx", patches.patchComposerChipsPreviewSize],
    ["ui/styles/composer/chips.ts", patches.patchComposerChipsPreviewStyle],
    ["modes/interactive-mode.ts", patches.patchAttachmentChipsGeometry],
    ["modes/magic-keywords.ts", patches.patchMagicKeywords],
    ["goals/tools/goal-tool.ts", patches.patchGoalTool],
    ["slash-commands/builtin-lifecycle.ts", patches.patchBtwAliases],
    ["slash-commands/builtin-collaboration.ts", patches.patchAdvisorAliases],
    ["extensibility/extensions/loader.ts", patches.patchExtensionLoader],
    ["discovery/helpers.ts", patches.patchDiscoveryHelpers],
    [
      "extensibility/legacy-pi-coding-agent-shim.ts",
      patches.patchLegacyModelRuntime,
    ],
  ];

  for (const [target, patch] of sourceRoutes) {
    if (Array.isArray(target)) patchFirstExistingFile(target, patch);
    else patchFile(target, patch);
  }

  // 19.2 rewrote @oh-my-pi/pi-tui and moved the terminal renderers into this
  // package; the old pi-tui source routes have no target here (see AGENTS.md).
  patchTuiFile("term/painters/editor.ts", patches.patchEditorGhostGap);
  const piAiRoutes = [
    ["types.ts", patches.patchPiAiTypes],
    ["providers/openai-completions.ts", patches.patchPiAiOpenAICompletions],
  ];
  for (const [target, patch] of piAiRoutes) patchPiAiFile(target, patch);

  for (const file of [
    "plannotator-tailnet-runtime.mjs",
    "plannotator-tailnet.ts",
  ]) {
    write(
      path.join(
        home,
        ".omp/plugins/node_modules/@plannotator/pi-extension",
        file,
      ),
      readFileSync(new URL(file, import.meta.url), "utf8"),
    );
  }

  const pluginRoutes = [
    [
      path.join(
        home,
        ".omp/plugins/node_modules/@plannotator/pi-extension/index.ts",
      ),
      "Plannotator extension uses host pi-tui shortcuts",
      (content) => patches.patchPlannotatorPiTuiCompat(content),
    ],
    [
      path.join(
        home,
        ".omp/agent/npm/node_modules/@plannotator/pi-extension/index.ts",
      ),
      "Plannotator npm-tree copy uses host pi-tui shortcuts",
      (content) => patches.patchPlannotatorPiTuiCompat(content),
    ],
    [
      path.join(
        home,
        ".omp/plugins/node_modules/@plannotator/pi-extension/plannotator-browser.ts",
      ),
      "open Plannotator in system browser and retain access metadata",
      (content) =>
        patches.patchPlannotatorBrowserOpen(
          patches.patchPlannotatorBrowserNotification(content, { replaceAny }),
          { replaceAny },
        ),
    ],
    [
      path.join(
        home,
        ".omp/plugins/node_modules/@plannotator/pi-extension/server/network.ts",
      ),
      "bind Plannotator Tailscale servers on loopback",
      (content) =>
        patches.patchPlannotatorLoopbackPort(content, { replaceAny }),
    ],
    [
      path.join(
        home,
        ".omp/plugins/node_modules/@plannotator/pi-extension/server/request-host-guard.ts",
      ),
      "allow exact Plannotator Tailscale hostname",
      (content) => patches.patchPlannotatorGuard(content, { replaceAny }),
    ],
    [
      path.join(
        home,
        ".omp/plugins/node_modules/@plannotator/pi-extension/server/serverPlan.ts",
      ),
      "publish Plannotator plan over verified Tailscale HTTPS",
      (content) => patches.patchPlannotatorPlanTailnet(content, { replaceAny }),
    ],
    [
      path.join(
        home,
        ".omp/plugins/node_modules/@plannotator/pi-extension/server/serverReview.ts",
      ),
      "publish Plannotator review over verified Tailscale HTTPS",
      (content) =>
        patches.patchPlannotatorReviewTailnet(content, { replaceAny }),
    ],
    [
      path.join(
        home,
        ".omp/plugins/node_modules/@plannotator/pi-extension/server/serverAnnotate.ts",
      ),
      "publish Plannotator annotate over verified Tailscale HTTPS",
      (content) => patches.patchPlannotatorPlanTailnet(content, { replaceAny }),
    ],
    [
      path.join(
        home,
        ".omp/plugins/node_modules/@plannotator/pi-extension/session-opened.ts",
      ),
      "announce verified Plannotator HTTPS or local fallback",
      (content) =>
        patches.patchPlannotatorAnnouncement(content, { replaceAny }),
    ],
    [
      path.join(
        home,
        ".omp/plugins/node_modules/@plannotator/pi-extension/index.ts",
      ),
      "include Plannotator HTTPS status in opened notifications",
      (content) =>
        patches.patchPlannotatorNotifications(content, { replaceAny }),
    ],
  ];
  for (const [target, label, patch] of pluginRoutes)
    patchAbsoluteFile(target, label, patch);
  rebuildBundledCli();
}

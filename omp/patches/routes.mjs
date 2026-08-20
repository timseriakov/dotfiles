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
    SIDE_CHAT_CONFIG,
    patches,
  } = ctx;

  setupRuntimeStateLinks();

  const sourceRoutes = [
    ["modes/interactive-mode.ts", patches.patchInteractiveMode],
    [
      [
        "modes/components/status-line/component.ts",
        "modes/components/status-line.ts",
      ],
      patches.patchStatusLineTs,
    ],
    [
      [
        "modes/components/status-line/types.ts",
        "modes/components/status-line.ts",
      ],
      patches.patchStatusTypes,
    ],
    [
      [
        "modes/components/status-line/segments.ts",
        "modes/components/status-line.ts",
      ],
      patches.patchSegments,
    ],
    ["modes/components/welcome.ts", patches.patchWelcome],
    ["modes/components/assistant-message.ts", patches.patchAssistantMessage],
    ["modes/components/usage-row.ts", patches.patchUsageRow],
    ["modes/components/user-message.ts", patches.patchUserMessage],
    [
      "modes/controllers/extension-ui-controller.ts",
      patches.patchExtensionUiController,
    ],
    ["config/keybindings.ts", patches.patchKeybindingsConfig],
    ["modes/controllers/input-controller.ts", patches.patchInputController],
    ["session/session-manager.ts", patches.patchSessionManager],
    ["session/session-paths.ts", patches.patchSessionPaths],
    ["session/session-listing.ts", patches.patchSessionListing],
    ["session/session-tools.ts", patches.patchSessionTools],
    ["session/model-controls.ts", patches.patchModelControlsLunaPriority],
    ["config/model-registry.ts", patches.patchModelRegistryCatalog],
    ["goals/tools/goal-tool.ts", patches.patchGoalTool],
    ["slash-commands/builtin-lifecycle.ts", patches.patchBtwAliases],
    ["modes/ultrathink.ts", patches.patchUltrathink],
    ["modes/magic-keywords.ts", patches.patchMagicKeywords],
    ["modes/orchestrate.ts", patches.patchOrchestrate],
    ["extensibility/extensions/loader.ts", patches.patchExtensionLoader],
    ["discovery/helpers.ts", patches.patchDiscoveryHelpers],
    ["modes/components/custom-editor.ts", patches.patchCustomEditor],
    [
      "extensibility/legacy-pi-coding-agent-shim.ts",
      patches.patchLegacyModelRuntime,
    ],
  ];

  for (const [target, patch] of sourceRoutes) {
    if (Array.isArray(target)) patchFirstExistingFile(target, patch);
    else patchFile(target, patch);
  }

  const tuiRoutes = [
    ["tui.ts", patches.patchTuiOverlayFocus],
    ["utils.ts", patches.patchTuiVisibleWidth],
    ["components/editor.ts", patches.patchEditorGutterWidth],
    ["terminal.ts", patches.patchTuiTerminal],
    ["kitty-graphics.ts", patches.patchTuiKittyGraphics],
    ["terminal-capabilities.ts", patches.patchTuiTerminalCapabilities],
  ];
  for (const [target, patch] of tuiRoutes) patchTuiFile(target, patch);

  const piAiRoutes = [
    ["utils/schema/normalize.ts", patches.patchPiAiSchemaNormalize],
    ["types.ts", patches.patchPiAiTypes],
    ["providers/openai-completions.ts", patches.patchPiAiOpenAICompletions],
  ];
  for (const [target, patch] of piAiRoutes) patchPiAiFile(target, patch);

  const pluginRoutes = [
    [
      path.join(
        home,
        ".omp/plugins/node_modules/@plannotator/pi-extension/plannotator-browser-runtime.ts",
      ),
      "plannotator browser asset fallback",
      patches.patchPlannotatorBrowserRuntime,
    ],
    [
      path.join(
        home,
        ".omp/plugins/node_modules/@plannotator/pi-extension/index.ts",
      ),
      "suppress Plannotator version warning",
      (content) =>
        patches.patchPlannotatorVersionWarning(content, { replaceAny }),
    ],
    [
      path.join(
        home,
        ".omp/plugins/node_modules/pi-side-chat/side-chat-overlay.ts",
      ),
      "pi-side-chat canonical editor and Nord frame",
      (content) => patches.patchPiSideChatOverlay(content, { replaceAny }),
    ],
    [
      path.join(home, ".omp/plugins/node_modules/pi-side-chat/index.ts"),
      "pi-side-chat tmux popup geometry and shortcuts",
      (content) => patches.patchPiSideChatIndex(content, { replaceAny }),
    ],
    [
      path.join(home, ".omp/plugins/node_modules/rejudge/dist/extension.js"),
      "rejudge extension unique inner agent ids",
      (content) => patches.patchRejudgeAgentIds(content, { replaceAny }),
    ],
    [
      path.join(home, ".omp/plugins/node_modules/rejudge/bin/rejudge.js"),
      "rejudge CLI unique inner agent ids",
      (content) => patches.patchRejudgeAgentIds(content, { replaceAny }),
    ],
  ];
  for (const [target, label, patch] of pluginRoutes)
    patchAbsoluteFile(target, label, patch);

  write(
    path.join(home, ".omp/plugins/node_modules/pi-side-chat/config.json"),
    `${JSON.stringify(SIDE_CHAT_CONFIG, null, 2)}\n`,
  );
  rebuildBundledCli();
}

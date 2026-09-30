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
    [
      "tools/browser.ts",
      (content) => patches.patchBrowserIsolation(content, { replaceAny }),
    ],
    [
      "tools/browser/attach.ts",
      (content) => patches.patchBrowserAttach(content, { replaceAny }),
    ],
    [
      "tools/browser/tab-supervisor.ts",
      (content) => patches.patchBrowserTabSupervisor(content, { replaceAny }),
    ],
    ["cli.ts", patches.patchCliStartupPrepaint],
    ["modes/interactive-mode.ts", patches.patchInteractiveMode],
    [
      "modes/controllers/extension-ui-controller.ts",
      patches.patchExtensionUiController,
    ],
    ["modes/controllers/input-controller.ts", patches.patchInputController],
    ["predict/client.ts", patches.patchPredictClientSuffix],
    ["session/session-manager.ts", patches.patchSessionManager],
    ["session/session-paths.ts", patches.patchSessionPaths],
    ["session/session-listing.ts", patches.patchSessionListing],
    ["session/session-tools.ts", patches.patchSessionTools],
    ["session/turn-recovery.ts", patches.patchTurnRecovery],
    ["session/model-controls.ts", patches.patchModelControlsLunaPriority],
    ["modes/settings.ts", patches.patchSettingsSchemaAttachmentPreview],
    ["modes/interactive-mode.ts", patches.patchAttachmentChipsGeometry],
    ["config/model-registry.ts", patches.patchModelRegistryCatalog],
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

  const tuiRoutes = [
    ["tui.ts", patches.patchTuiOverlayFocus],
    ["prompt/composer.ts", patches.patchComposer],
    ["status-line/component.ts", patches.patchStatusLineTs],
    ["status-line/types.ts", patches.patchStatusTypes],
    ["status-line/segments.ts", patches.patchSegments],
    ["prompt/welcome.ts", patches.patchWelcome],
    ["chat/assistant-message.ts", patches.patchAssistantMessage],
    ["overlays/usage-row.ts", patches.patchUsageRow],
    ["chat/user-message.ts", patches.patchUserMessage],
    ["chrome/dynamic-border.ts", patches.patchDynamicBorder],
    ["app-keybindings.ts", patches.patchKeybindingsConfig],
    ["prompt/custom-editor.ts", patches.patchCustomEditor],
    ["prompt/attachment-chips.ts", patches.patchAttachmentChips],
    ["apps/git/colors.ts", patches.patchGitTuiColors],
    ["apps/git/git-tui.ts", patches.patchGitTuiLayout],
    ["utils.ts", patches.patchTuiVisibleWidth],
    ["components/editor.ts", patches.patchEditorGutterWidth],
    ["components/editor.ts", patches.patchEditorVimKillRing],
    ["vim.ts", patches.patchVimRuLayout],
    ["vim.ts", patches.patchVimCutRegisters],
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
    [
      path.join(
        home,
        ".omp/plugins/node_modules/ponytail/pi-extension/index.js",
      ),
      "suppress Ponytail startup loaded notification",
      (content) => patches.patchPonytailStartupNotify(content, { replaceAny }),
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

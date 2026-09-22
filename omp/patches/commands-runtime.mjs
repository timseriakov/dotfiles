export function createCommandRuntimePatches(ctx) {
  const { replaceOnce, replaceAny, insertAfter, insertBefore } = ctx;

  function patchBtwAliases(content) {
    return replaceAny(
      content,
      [
        `\t\tname: "btw",\n\t\tdescription: "Ask an ephemeral side question using the current session context",`,
        `\t\tname: "btw",\n\t\ticon: "question",\n\t\tdescription: "Ask an ephemeral side question using the current session context",`,
        `\t\tname: "btw",\n\t\taliases: ["b", "и"],\n\t\tdescription: "Ask an ephemeral side question using the current session context",`,
        `\t\tname: "btw",\n\t\taliases: ["b", "и"],\n\t\ticon: "question",\n\t\tdescription: "Ask an ephemeral side question using the current session context",`,
        `\t\tname: "btw",\n\t\ticon: "question",\n\t\tdescription: "Ask a side question, or browse this session's BTW history",`,
        `\t\tname: "btw",\n\t\taliases: ["b", "и"],\n\t\ticon: "question",\n\t\tdescription: "Ask a side question, or browse this session's BTW history",`,
      ],
      `\t\tname: "btw",\n\t\taliases: ["b", "и"],\n\t\ticon: "question",\n\t\tdescription: "Ask a side question, or browse this session's BTW history",`,
      "btw aliases /b /и",
    ).content;
  }
  function patchAdvisorAliases(content) {
    return replaceAny(
      content,
      [
        `\t\tname: "advisor",\n\t\ticon: "advisor",\n\t\tdescription: "Toggle the advisor (a second model that reviews each turn and injects notes)",`,
        `\t\tname: "advisor",\n\t\taliases: ["a", "ф"],\n\t\ticon: "advisor",\n\t\tdescription: "Toggle the advisor (a second model that reviews each turn and injects notes)",`,
      ],
      `\t\tname: "advisor",\n\t\taliases: ["a", "ф"],\n\t\ticon: "advisor",\n\t\tdescription: "Toggle the advisor (a second model that reviews each turn and injects notes)",`,
      "advisor aliases /a /ф",
    ).content;
  }

  function patchCliStartupPrepaint(content) {
    const block = `\tlet stopStartupComposer: (() => void) | undefined;
\tif (
\t\t!process.env.PI_TIMING &&
\t\tprocess.stdin.isTTY === true &&
\t\tprocess.stdout.isTTY === true &&
\t\t(resolvedArgv.length === 0 || (resolvedArgv.length === 1 && resolvedArgv[0] === "--no-session"))
\t) {
\t\t// Intentional exception to the static-import convention: this latency boundary
\t\t// keeps the TUI graph out of worker, subcommand, help, and version launches.
\t\t// Loading it statically would erase the measured cold-start improvement.
\t\tconst { beginStartupComposer, stopPendingStartupComposer } = await import("./modes/startup-composer");
\t\tbeginStartupComposer({ version: VERSION });
\t\tstopStartupComposer = stopPendingStartupComposer;
\t}`;
    const patched = `\tlet stopStartupComposer: (() => void) | undefined;
\t// Startup prepaint intentionally disabled: it painted the welcome + prompt before
\t// the real status line was mounted, producing a two-phase render. Disabling it lets
\t// the full layout (welcome + status + prompt) paint together after InteractiveMode init.
\tif (false && !process.env.PI_TIMING && process.stdin.isTTY === true) {
\t\tconst { beginStartupComposer, stopPendingStartupComposer } = await import("./modes/startup-composer");
\t\tbeginStartupComposer({ version: VERSION });
\t\tstopStartupComposer = stopPendingStartupComposer;
\t}`;
    const blockWithSafeFlags = `\tlet stopStartupComposer: (() => void) | undefined;
\tif (
\t\t!process.env.PI_TIMING &&
\t\tprocess.stdin.isTTY === true &&
\t\tprocess.stdout.isTTY === true &&
\t\tresolvedArgv.every(arg => PREPAINT_SAFE_FLAGS[arg] === true)
\t) {
\t\t// Intentional exception to the static-import convention: this latency boundary
\t\t// keeps the TUI graph out of worker, subcommand, help, and version launches.
\t\t// Loading it statically would erase the measured cold-start improvement.
\t\tconst { beginStartupComposer, stopPendingStartupComposer } = await import("./modes/startup-composer");
\t\tbeginStartupComposer({ version: VERSION });
\t\tstopStartupComposer = stopPendingStartupComposer;
\t}`;
    return replaceAny(
      content,
      [block, blockWithSafeFlags],
      patched,
      "disable startup prepaint composer",
    ).content;
  }
  function patchPonytailStartupNotify(content) {
    const current = `    if (!getQuietStartup()) {
      ctx?.ui?.notify?.(\`Ponytail loaded: \${currentMode}\`, "info");
    }`;
    const patched = `    if (false && !getQuietStartup()) {
      ctx?.ui?.notify?.(\`Ponytail loaded: \${currentMode}\`, "info");
    }`;
    return replaceAny(
      content,
      [current, patched],
      patched,
      "suppress Ponytail startup loaded notification",
    ).content;
  }
  function patchGoalTool(content) {
    return replaceAny(
      content,
      [
        `	const tokenBudget = params.token_budget;
	if (tokenBudget !== undefined && (!Number.isInteger(tokenBudget) || tokenBudget <= 0)) {
		throw new ToolError("token_budget must be a positive integer when provided");
	}
	return { objective, tokenBudget };`,
        `	const tokenBudget = undefined;
	return { objective, tokenBudget };`,
      ],
      `	const tokenBudget = undefined;
	return { objective, tokenBudget };`,
      "goal ignores model token budget",
    ).content;
  }

  function patchMagicKeywords(content) {
    // 18.2.8 rewrote the engine: keywords are now declarative entries in the
    // host list (pi-coding-agent modes/magic-keywords.ts); aliases become
    // first-class entries reusing the parent keyword's hue and notice.
    const orchestrateEntry = `\t{\n\t\tid: "orchestrate",\n\t\tword: "orchestrate",\n\t\thue: [150, 280],\n\t\tlabel: "Orchestrate Keyword",\n\t\tdescription: "Let standalone orchestrate append its hidden multi-agent orchestration notice",\n\t\t// The contract is entirely about \`task\` subagent dispatch.\n\t\trequires: ["task"],\n\t\tnotice: renderOrchestrateNotice,\n\t},\n`;
    const aliasEntries = `\t{\n\t\tid: "ulw",\n\t\tword: "ulw",\n\t\thue: [0, 330],\n\t\tlabel: "ULW Keyword",\n\t\tdescription: "Let standalone ulw act as a short ultrathink alias and append its hidden notice",\n\t\trequires: [],\n\t\tnotice: () => ULTRATHINK_NOTICE,\n\t},\n\t{\n\t\tid: "orch",\n\t\tword: "orch",\n\t\thue: [150, 280],\n\t\tlabel: "ORCH Keyword",\n\t\tdescription: "Let standalone orch act as a short orchestrate alias and append its hidden orchestration notice",\n\t\trequires: ["task"],\n\t\tnotice: renderOrchestrateNotice,\n\t},\n`;
    if (content.includes(aliasEntries)) return content;
    return replaceAny(
      content,
      [orchestrateEntry],
      orchestrateEntry + aliasEntries,
      "magic keyword ulw/orch aliases (18.2.8)",
    ).content;
  }

  function patchExtensionLoader(content) {
    return replaceAny(
      content,
      [
        `function isExtensionFile(name: string): boolean {\n\treturn name.endsWith(".ts") || name.endsWith(".js");\n}`,
        `function isExtensionFile(name: string): boolean {\n\treturn !name.includes(".test.") && (name.endsWith(".ts") || name.endsWith(".js"));\n}`,
      ],
      `function isExtensionFile(name: string): boolean {\n\treturn !name.includes(".test.") && (name.endsWith(".ts") || name.endsWith(".js"));\n}`,
      "extension discovery skips test files",
    ).content;
  }

  function patchDiscoveryHelpers(content) {
    return replaceAny(
      content,
      [
        `\tfor (const match of directFiles) {\n\t\tif (match.path.includes("/")) continue;\n\t\tdiscovered.add(path.join(dir, match.path));\n\t}`,
        `\tfor (const match of directFiles) {\n\t\tif (match.path.includes("/") || match.path.includes(".test.")) continue;\n\t\tdiscovered.add(path.join(dir, match.path));\n\t}`,
      ],
      `\tfor (const match of directFiles) {\n\t\tif (match.path.includes("/") || match.path.includes(".test.")) continue;\n\t\tdiscovered.add(path.join(dir, match.path));\n\t}`,
      "extension discovery skips direct test files",
    ).content;
  }
  function patchLegacyModelRuntime(content) {
    let out = content;
    let r;
    r = replaceAny(
      out,
      [
        `import { type AuthCredential, SqliteAuthCredentialStore, type TSchema } from "@oh-my-pi/pi-ai";`,
      ],
      `import { type Api, type AuthCredential, type Model, SqliteAuthCredentialStore, type TSchema } from "@oh-my-pi/pi-ai";`,
      "legacy ModelRuntime model types",
    );
    out = r.content;
    r = replaceAny(
      out,
      [`import { getPackageDir as getOmpPackageDir } from "../config";`],
      `import { getPackageDir as getOmpPackageDir } from "../config";\nimport { ModelRegistry } from "../config/model-registry";`,
      "legacy ModelRuntime registry import",
    );
    out = r.content;
    r = replaceAny(
      out,
      [`\tdiscoverSkills,\n\tcreateAgentSession as ompCreateAgentSession,`],
      `\tdiscoverSkills,\n\tdiscoverAuthStorage,\n\tcreateAgentSession as ompCreateAgentSession,`,
      "legacy ModelRuntime auth import",
    );
    out = r.content;
    r = replaceAny(
      out,
      [
        `/**\n * Legacy pi extensions call \`createAgentSession({ resourceLoader })\`.`,
      ],
      `export class ModelRuntime {\n\treadonly modelRegistry: ModelRegistry;\n\n\tprivate constructor(modelRegistry: ModelRegistry) {\n\t\tthis.modelRegistry = modelRegistry;\n\t}\n\n\tstatic async create(): Promise<ModelRuntime> {\n\t\tconst authStorage = await discoverAuthStorage();\n\t\treturn new ModelRuntime(new ModelRegistry(authStorage));\n\t}\n\n\tgetModel(provider: string, modelId: string): Model<Api> | undefined {\n\t\treturn this.modelRegistry.find(provider, modelId);\n\t}\n}\n\n/**\n * Legacy pi extensions call \`createAgentSession({ resourceLoader })\`.`,
      "legacy ModelRuntime export",
    );
    out = r.content;
    r = replaceAny(
      out,
      [
        `export type LegacyPiCreateAgentSessionOptions = CreateAgentSessionOptions & {\n\tresourceLoader?: ResourceLoader;\n};`,
      ],
      `export type LegacyPiCreateAgentSessionOptions = CreateAgentSessionOptions & {\n\tresourceLoader?: ResourceLoader;\n\tmodelRuntime?: ModelRuntime;\n};`,
      "legacy ModelRuntime session option",
    );
    out = r.content;
    r = replaceAny(
      out,
      [
        `\tconst loader = options.resourceLoader;\n\tif (!loader) {\n\t\treturn ompCreateAgentSession(options);\n\t}`,
        `\tconst loader = options.resourceLoader;\n\tconst { resourceLoader: _, modelRuntime, ...rest } = options;\n\tif (!loader) {\n\t\tconst forwarded: CreateAgentSessionOptions = { ...rest };\n\t\tif (rest.modelRegistry === undefined && modelRuntime !== undefined) {\n\t\t\tforwarded.modelRegistry = modelRuntime.modelRegistry;\n\t\t}\n\t\treturn ompCreateAgentSession(forwarded);\n\t}`,
      ],
      `\tconst loader = options.resourceLoader;\n\tconst { resourceLoader: _, modelRuntime, ...rest } = options;\n\tif (!loader) {\n\t\tconst forwarded: CreateAgentSessionOptions = { ...rest };\n\t\tif (rest.modelRegistry === undefined && modelRuntime !== undefined) {\n\t\t\tforwarded.modelRegistry = modelRuntime.modelRegistry;\n\t\t}\n\t\treturn ompCreateAgentSession(forwarded);\n\t}`,
      "legacy ModelRuntime no-loader adapter",
    );
    out = r.content;
    r = replaceAny(
      out,
      [
        `\tconst { resourceLoader: _, ...rest } = options;\n\tconst forwarded: CreateAgentSessionOptions = {\n\t\t...rest,\n\t\tcwd: rest.cwd ?? state.cwd,\n\t\tagentDir: rest.agentDir ?? state.agentDir,\n\t};`,
        `\tconst { resourceLoader: _, modelRuntime, ...rest } = options;\n\tconst forwarded: CreateAgentSessionOptions = {\n\t\t...rest,\n\t\tcwd: rest.cwd ?? state.cwd,\n\t\tagentDir: rest.agentDir ?? state.agentDir,\n\t};\n\tif (rest.modelRegistry === undefined && modelRuntime !== undefined) {\n\t\tforwarded.modelRegistry = modelRuntime.modelRegistry;\n\t}`,
        `\t// resourceLoader and modelRuntime were stripped above.\n\tconst forwarded: CreateAgentSessionOptions = {\n\t\t...rest,\n\t\tcwd: rest.cwd ?? state.cwd,\n\t\tagentDir: rest.agentDir ?? state.agentDir,\n\t};`,
      ],
      `\t// resourceLoader and modelRuntime were stripped above.\n\tconst forwarded: CreateAgentSessionOptions = {\n\t\t...rest,\n\t\tcwd: rest.cwd ?? state.cwd,\n\t\tagentDir: rest.agentDir ?? state.agentDir,\n\t};\n\tif (rest.modelRegistry === undefined && modelRuntime !== undefined) {\n\t\tforwarded.modelRegistry = modelRuntime.modelRegistry;\n\t}`,
      "legacy ModelRuntime loader adapter",
    );
    out = r.content;
    return out;
  }

  function patchSessionTools(content) {
    const alternatives = [
      `		this.#host.emitNotice(
			"info",
			after
				? \`inspect_image is now available: \${modelName} has no native image input.\`
				: \`inspect_image is now hidden: \${modelName} supports image input natively. Override with /vision on.\`,
			"vision",
		);`,
      `		const model = this.#host.model();
		const modelName = model ? formatModelString(model) : "the current model";
		this.#host.emitNotice(
			"info",
			after
				? \`inspect_image is now available: \${modelName} has no native image input.\`
				: \`inspect_image is now hidden: \${modelName} supports image input natively. Override with /vision on.\`,
			"vision",
		);`,
      `			this.#host.emitNotice(
				"info",
				after
					? \`inspect_image is now available: \${modelName} has no native image input.\`
					: \`inspect_image is now hidden: \${modelName} supports image input natively. Override with /vision on.\`,
				"vision",
			);`,
    ];
    if (!alternatives.some((anchor) => content.includes(anchor)))
      return content;
    return replaceAny(
      content,
      alternatives,
      `		// dotfiles patch: avoid noisy vision flip notices.
		return;`,
      "suppress inspect_image flip notice",
    ).content;
  }

  function patchExtensionUiController(content) {
    const currentOverlay = `			if (options?.overlay) {
				const overlayConfig = options as {
					overlayOptions?: Record<string, unknown>;
					onHandle?: (handle: OverlayHandle) => void;
				};
				overlayHandle = this.ctx.ui.showOverlay(component, {
					anchor: "bottom-center",
					width: "100%",
					maxHeight: "100%",
					margin: 0,
					...(overlayConfig.overlayOptions ?? {}),
				});
				overlayConfig.onHandle?.(overlayHandle);
				return;
			}`;
    const currentOverlayModern = `			if (options?.overlay) {
				const overlayOptions =
					typeof options.overlayOptions === "function" ? options.overlayOptions() : options.overlayOptions;
				overlayHandle = this.ctx.ui.showOverlay(
					component,
					overlayOptions ?? {
						anchor: "bottom-center",
						width: "100%",
						maxHeight: "100%",
						margin: 0,
					},
				);
				options.onHandle?.(overlayHandle);
				return;
			}`;
    const currentOverlayLatest = `				if (options?.overlay) {
					const overlayOptions =
						typeof options.overlayOptions === "function" ? options.overlayOptions() : options.overlayOptions;
					overlayHandle = this.ctx.ui.showOverlay(
						component,
						overlayOptions ?? {
							anchor: "bottom-center",
							width: "100%",
							maxHeight: "100%",
							margin: 0,
						},
					);
					options.onHandle?.(overlayHandle);
					return;
				}`;
    const patchedOverlay = `			if (options?.overlay) {
				const overlayConfig = options as {
					overlayOptions?: Record<string, unknown>;
					onHandle?: (handle: OverlayHandle) => void;
				};
				const previousFocus = this.ctx.ui.getFocused();
				const nativeOverlayHandle = this.ctx.ui.showOverlay(component, {
					anchor: "bottom-center",
					width: "100%",
					maxHeight: "100%",
					margin: 0,
					...(overlayConfig.overlayOptions ?? {}),
				});
				overlayHandle = {
					...nativeOverlayHandle,
					focus: () => this.ctx.ui.setFocus(component),
					unfocus: () => this.ctx.ui.setFocus(previousFocus),
					isFocused: () => this.ctx.ui.getFocused() === component,
				} as OverlayHandle;
				overlayConfig.onHandle?.(overlayHandle);
				return;
			}`;
    return replaceAny(
      content,
      [
        currentOverlay,
        currentOverlayModern,
        currentOverlayLatest,
        patchedOverlay,
      ],
      patchedOverlay,
      "custom overlay options and focus handle",
    ).content;
  }
  function patchTuiOverlayFocus(content) {
    const current = `		if (topVisibleOverlay && !isOverlayFocusTarget(topVisibleOverlay.component, component)) {
			const currentFocus = this.#focusedComponent;
			component = isOverlayFocusTarget(topVisibleOverlay.component, currentFocus)
				? currentFocus
				: topVisibleOverlay.component;
		}`;
    const patched = `		if (topVisibleOverlay && !topVisibleOverlay.options?.nonCapturing && !isOverlayFocusTarget(topVisibleOverlay.component, component)) {
			const currentFocus = this.#focusedComponent;
			component = isOverlayFocusTarget(topVisibleOverlay.component, currentFocus)
				? currentFocus
				: topVisibleOverlay.component;
		}`;
    return replaceAny(
      content,
      [current, patched],
      patched,
      "pi-tui nonCapturing overlay focus",
    ).content;
  }

  return {
    patchBtwAliases,
    patchAdvisorAliases,

    patchGoalTool,
    patchMagicKeywords,
    patchExtensionLoader,
    patchDiscoveryHelpers,
    patchLegacyModelRuntime,
    patchSessionTools,
    patchExtensionUiController,
    patchTuiOverlayFocus,
    patchCliStartupPrepaint,
    patchPonytailStartupNotify,
  };
}

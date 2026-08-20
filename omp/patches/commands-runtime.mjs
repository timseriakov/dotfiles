export function createCommandRuntimePatches(ctx) {
  const { replaceOnce, replaceAny, insertAfter, insertBefore } = ctx;

  function patchBtwAliases(content) {
    return replaceOnce(
      content,
      `\t\tname: "btw",
\t\tdescription: "Ask an ephemeral side question using the current session context",`,
      `\t\tname: "btw",
\t\taliases: ["b", "и"],
\t\tdescription: "Ask an ephemeral side question using the current session context",`,
      "btw aliases /b /и",
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

  function patchUltrathink(content) {
    let out = content;
    let r;

    r = replaceAny(
      out,
      [
        `const ULTRATHINK_WORD = magicKeywordRegex("ultrathink");`,
        `const ULTRATHINK_WORD = /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:ultrathink|ulw)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/u;`,
      ],
      `const ULTRATHINK_WORD = /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:ultrathink|ulw)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/u;`,
      "ultrathink ulw alias detection",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\tprobe: /ultrathink/,\n\thighlight: magicKeywordRegex("ultrathink", "g"),`,
        `\tprobe: /ultrathink|ulw/,\n\thighlight: /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:ultrathink|ulw)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/gu,`,
      ],
      `\tprobe: /ultrathink|ulw/,\n\thighlight: /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:ultrathink|ulw)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/gu,`,
      "ultrathink ulw alias highlight",
    );
    out = r.content;
    return out;
  }

  function patchOrchestrate(content) {
    let out = content;
    let r;

    r = replaceAny(
      out,
      [
        `const ORCHESTRATE_WORD = magicKeywordRegex("orchestrate");`,
        `const ORCHESTRATE_WORD = /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:orchestrate|orch)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/u;`,
      ],
      `const ORCHESTRATE_WORD = /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:orchestrate|orch)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/u;`,
      "orchestrate orch alias detection",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\tprobe: /orchestrate/,\n\thighlight: magicKeywordRegex("orchestrate", "g"),`,
        `\tprobe: /orchestrate|orch/,\n\thighlight: /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:orchestrate|orch)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/gu,`,
      ],
      `\tprobe: /orchestrate|orch/,\n\thighlight: /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:orchestrate|orch)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/gu,`,
      "orchestrate orch alias highlight",
    );
    out = r.content;
    return out;
  }

  function patchMagicKeywords(content) {
    return replaceAny(
      content,
      [
        `\tif (!text.includes("ultrathink") && !text.includes("orchestrate") && !text.includes("workflowz")) {`,
        `\tif (!text.includes("ultrathink") && !text.includes("ulw") && !text.includes("orchestrate") && !text.includes("workflowz")) {`,
      ],
      `\tif (!text.includes("ultrathink") && !text.includes("ulw") && !text.includes("orchestrate") && !text.includes("orch") && !text.includes("workflowz")) {`,
      "magic keyword ulw fast probe",
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
    return replaceAny(
      content,
      [
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
      ],
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
    patchGoalTool,
    patchUltrathink,
    patchOrchestrate,
    patchMagicKeywords,
    patchExtensionLoader,
    patchDiscoveryHelpers,
    patchLegacyModelRuntime,
    patchSessionTools,
    patchExtensionUiController,
    patchTuiOverlayFocus,
  };
}

export function createInputSessionPatches(ctx) {
  const { replaceOnce, replaceAny, insertAfter, insertBefore } = ctx;

  function patchKeybindingsConfig(content) {
    let out = content;
    const compactDefinition = `\t"app.session.compact": {\n\t\tdefaultKeys: [],\n\t\tdescription: "Compact current session",\n\t},\n`;
    const gitDefinition = `\t"app.git.open": {\n\t\tdefaultKeys: [],\n\t\tdescription: "Open git UI",\n\t},\n`;
    const smolDefinition = `\t"app.smol.cycle": {\n\t\tdefaultKeys: [],\n\t\tdescription: "Cycle smol models",\n\t},\n`;

    if (out.includes("APP_KEYBINDINGS")) {
      let r = insertAfter(
        out,
        `\t"app.session.observe": true;\n`,
        `\t"app.session.compact": true;\n`,
        "keybindings app.session.compact interface",
      );
      out = r.content;
      r = insertAfter(
        out,
        `\t"app.session.compact": true;\n`,
        `\t"app.git.open": true;\n`,
        "keybindings app.git.open interface",
      );
      out = r.content;
      r = insertAfter(
        out,
        `\t"app.git.open": true;\n`,
        `\t"app.smol.cycle": true;\n`,
        "keybindings app.smol.cycle interface",
      );
      out = r.content;
      return insertAfter(
        out,
        `\t"app.session.observe": {\n\t\tdefaultKeys: "ctrl+s",\n\t\tdescription: "Open the agent hub",\n\t},\n`,
        compactDefinition + gitDefinition + smolDefinition,
        "keybindings app.* definitions",
      ).content;
    }

    let r = insertAfter(
      out,
      `\t"app.session.observe": true;\n`,
      `\t"app.session.compact": true;\n`,
      "keybindings app.session.compact interface",
    );
    out = r.content;
    r = insertAfter(
      out,
      `\t"app.session.compact": true;\n`,
      `\t"app.git.open": true;\n`,
      "keybindings app.git.open interface",
    );
    out = r.content;
    r = insertAfter(
      out,
      `\t"app.git.open": true;\n`,
      `\t"app.smol.cycle": true;\n`,
      "keybindings app.smol.cycle interface",
    );
    out = r.content;
    r = insertAfter(
      out,
      `\t"app.session.observe": {\n\t\tdefaultKeys: "ctrl+s",\n\t\tdescription: "Open the agent hub",\n\t},\n`,
      compactDefinition,
      "keybindings app.session.compact definition",
    );
    out = r.content;
    r = insertAfter(
      out,
      compactDefinition,
      gitDefinition,
      "keybindings app.git.open definition",
    );
    out = r.content;
    return insertAfter(
      out,
      gitDefinition,
      smolDefinition,
      "keybindings app.smol.cycle definition",
    ).content;
  }

  function patchInputController(content) {
    let out = content;
    // Tab completes the draft (slash commands, @paths); only an empty composer cycles models.
    out = replaceOnce(
      out,
      `\t\tif (km.matches(key, "app.model.cycleForward")) {\n\t\t\tvoid this.cycleRoleModel("forward");\n\t\t\treturn true;\n\t\t}`,
      `\t\t// Tab completes a non-empty draft (slash commands, paths); only an empty composer cycles models.\n\t\tif (km.matches(key, "app.model.cycleForward") && (empty || key.id !== "tab")) {\n\t\t\tvoid this.cycleRoleModel("forward");\n\t\t\treturn true;\n\t\t}`,
      "input-controller tab completes before model cycle",
    ).content;
    const smolHandler = `\tasync cycleSmolModel(): Promise<void> {
\t\tif (this.ctx.focusedAgentId) {
\t\t\tthis.ctx.showStatus("Model changes apply to the main session — press ←← to return first");
\t\t\treturn;
\t\t}
\t\tconst ids = [
\t\t\t"omniroute/opencode-go/deepseek-v4-flash",
\t\t\t"omniroute/opencode-go/deepseek-v4.1-flash",
\t\t\t"omniroute/opencode-go/glm-5.3-flash",
\t\t];
\t\tconst available = this.ctx.session.modelRegistry.getAvailable();
\t\tconst models = ids.map(id => available.find(model => \`\${model.provider}/\${model.id}\` === id)).filter(Boolean);
\t\tif (models.length < 2) {
\t\t\tthis.ctx.showStatus("Smol model cycle is unavailable");
\t\t\treturn;
\t\t}
\t\tconst current = this.ctx.session.model;
\t\tconst index = models.findIndex(model => model!.provider === current?.provider && model!.id === current.id);
\t\tconst next = models[(index + 1) % models.length]!;
\t\ttry {
\t\t\tawait this.ctx.session.setModel(next, "smol");
\t\t\tthis.ctx.statusLine.refresh();
\t\t\tthis.ctx.updateEditorBorderColor();
\t\t\tthis.ctx.showStatus(\`Smol model: \${next.name}\`);
\t\t} catch (error) {
\t\t\tthis.ctx.showError(error instanceof Error ? error.message : String(error));
\t\t}
\t}

`;
    if (!out.includes(smolHandler)) {
      out = insertBefore(
        out,
        `\tcycleThinkingLevel(): void {\n`,
        smolHandler,
        "input-controller smol model cycle",
      ).content;
    }
    const entries = [
      `\t\t\t["app.smol.cycle", () => {\n\t\t\t\tconst role = this.ctx.viewSession.sessionManager.getLastModelChangeRole();\n\t\t\t\tconst model = this.ctx.session.model;\n\t\t\t\tconst legacySmolModel = role === "temporary" && model && model.provider === "opencode-go" && ["deepseek-v4-flash", "deepseek-v4.1-flash", "glm-5.3-flash"].includes(model.id);\n\t\t\t\tif ((role === "smol" && model?.id !== "cx/gpt-6-luna") || legacySmolModel) void this.cycleSmolModel();\n\t\t\t\telse this.cycleThinkingLevel();\n\t\t\t}],\n`,
      `\t\t\t["app.git.open", () => this.ctx.showGitUi()],\n`,
      `\t\t\t["app.session.compact", () => void this.ctx.handleCompactCommand()],\n`,
    ].filter((entry) => !out.includes(entry));
    if (entries.length > 0) {
      out = insertAfter(
        out,
        `["app.session.observe", () => this.ctx.showAgentHub()],\n`,
        entries.join(""),
        "input-controller app key handlers",
      ).content;
    }
    return out;
  }

  function patchSessionManager(content) {
    let out = content;
    let r;

    r = insertAfter(
      out,
      `function mintSessionId(): string {\n\treturn Bun.randomUUIDv7();\n}\n`,
      `\nfunction inferSessionIdFromPath(filePath: string): string | undefined {\n\tconst fileName = path.basename(filePath, ".jsonl");\n\tconst separator = fileName.lastIndexOf("_");\n\tconst candidate = separator >= 0 ? fileName.slice(separator + 1) : fileName;\n\treturn /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)\n\t\t? candidate\n\t\t: undefined;\n}\n`,
      "session-manager infer id from session file path",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\t#resetToNewSession(options?: NewSessionOptions, forcedSessionFile?: string): string | undefined {\n\t\tthis.#diskTail = Promise.resolve();\n\t\tthis.#clearDiskError();\n\t\tthis.#sessionId = mintSessionId();`,
        `\t#resetToNewSession(options?: NewSessionOptions, forcedSessionFile?: string): string | undefined {\n\t\tthis.#diskTail = Promise.resolve();\n\t\tthis.#clearDiskError();\n\t\tthis.#sessionId = forcedSessionFile ? inferSessionIdFromPath(forcedSessionFile) ?? mintSessionId() : mintSessionId();`,
        `\t#resetToNewSession(options?: NewSessionOptions, forcedSessionFile?: string): string | undefined {\n\t\tthis.#diskTail = Promise.resolve();\n\t\tthis.#clearDiskError();\n\t\tthis.#reconcileSessionDirForFallback();\n\t\tthis.#sessionId = mintSessionId();`,
        `\t#resetToNewSession(options?: NewSessionOptions, forcedSessionFile?: string): string | undefined {\n\t\tthis.#diskTail = Promise.resolve();\n\t\tthis.#clearDiskError();\n\t\tthis.#reconcileSessionDirForFallback();\n\t\tthis.#sessionId = forcedSessionFile ? inferSessionIdFromPath(forcedSessionFile) ?? mintSessionId() : mintSessionId();`,
        `\t#resetToNewSession(options?: NewSessionOptions, forcedSessionFile?: string): string | undefined {\n\t\tthis.#diskTail = Promise.resolve();\n\t\tthis.#clearDiskError();\n\t\tthis.#expectedDiskSize = null;\n\t\tthis.#reconcileSessionDirForFallback();\n\t\tthis.#sessionId = mintSessionId();`,
        `\t#resetToNewSession(options?: NewSessionOptions, forcedSessionFile?: string): string | undefined {\n\t\tthis.#diskTail = Promise.resolve();\n\t\tthis.#clearDiskError();\n\t\tthis.#expectedDiskSize = null;\n\t\tthis.#reconcileSessionDirForFallback();\n\t\tif (options?.sessionDir && this.#persist) {\n\t\t\tthis.#sessionDir = path.resolve(options.sessionDir);\n\t\t\tthis.#storage.ensureDirSync(this.#sessionDir);\n\t\t}\n\t\tthis.#sessionId = mintSessionId();`,
      ],
      `\t#resetToNewSession(options?: NewSessionOptions, forcedSessionFile?: string): string | undefined {\n\t\tthis.#diskTail = Promise.resolve();\n\t\tthis.#clearDiskError();\n\t\tthis.#expectedDiskSize = null;\n\t\tthis.#reconcileSessionDirForFallback();\n\t\tif (options?.sessionDir && this.#persist) {\n\t\t\tthis.#sessionDir = path.resolve(options.sessionDir);\n\t\t\tthis.#storage.ensureDirSync(this.#sessionDir);\n\t\t}\n\t\tthis.#sessionId = forcedSessionFile ? inferSessionIdFromPath(forcedSessionFile) ?? mintSessionId() : mintSessionId();`,
      "session-manager recovery keeps path id",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `function isAssistantEntry(entry: SessionEntry): boolean {\n\treturn entry.type === "message" && entry.message.role === "assistant";\n}\n`,
        `function isUserOrAssistantEntry(entry: SessionEntry): boolean {\n\treturn entry.type === "message" && (entry.message.role === "user" || entry.message.role === "assistant");\n}\n`,
      ],
      `function isUserOrAssistantEntry(entry: SessionEntry): boolean {\n\treturn entry.type === "message" && (entry.message.role === "user" || entry.message.role === "assistant");\n}\n`,
      "session-manager persist submitted prompts",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\t#historyContainsAssistantMessage(): boolean {\n\t\treturn this.#entries.some(isAssistantEntry);\n\t}\n`,
        `\t#historyContainsAssistantMessage(): boolean {\n\t\treturn this.#entries.some(isUserOrAssistantEntry);\n\t}\n`,
      ],
      `\t#historyContainsAssistantMessage(): boolean {\n\t\treturn this.#entries.some(isUserOrAssistantEntry);\n\t}\n`,
      "session-manager user prompt opens session file",
    );
    out = r.content;

    return out;
  }

  function patchSessionPaths(content) {
    let out = content;
    let r;

    r = replaceAny(
      out,
      [
        `\t\tconst stat = fs.statSync(sessionFile, { throwIfNoEntry: false });\n\t\tconst exists = stat?.isFile() === true;\n\t\t// A materialized target resumes normally; a missing target is honored only\n\t\t// for a fresh \`/new\` boundary (never-written lazy session).\n\t\tif (exists || fresh) return { cwd: breadcrumbCwd, sessionFile, exists, fresh };`,
        `\t\tconst stat = fs.statSync(sessionFile, { throwIfNoEntry: false });\n\t\tconst exists = stat?.isFile() === true;\n\t\t// A materialized target resumes normally; a missing target is honored only\n\t\t// for a never-written lazy fresh-session boundary.\n\t\tif (exists || fresh) return { cwd: breadcrumbCwd, sessionFile, exists, fresh };`,
        `\t\tconst stat = fs.statSync(sessionFile, { throwIfNoEntry: false });\n\t\tconst exists = stat?.isFile() === true;\n\t\tconst breadcrumbStat = fs.statSync(breadcrumbFile, { throwIfNoEntry: false });\n\t\tconst freshIsRecent =\n\t\t\tfresh && breadcrumbStat?.isFile() === true && Date.now() - breadcrumbStat.mtimeMs < 5 * 60_000;\n\t\t// A materialized target resumes normally; a missing fresh target is honored\n\t\t// only briefly, so stale fresh breadcrumbs cannot hide older sessions forever.\n\t\tif (exists || freshIsRecent) return { cwd: breadcrumbCwd, sessionFile, exists, fresh };`,
        `\t\tconst stat = fs.statSync(sessionFile, { throwIfNoEntry: false });\n\t\tconst exists = stat?.isFile() === true;\n\t\t// A materialized target resumes normally; a missing target is honored only\n\t\t// for a never-written lazy fresh-session boundary.\n\t\tif (exists || fresh) return { cwd: breadcrumbCwd, sessionFile, exists, fresh, cwdIdentity };`,
      ],
      `\t\tconst stat = fs.statSync(sessionFile, { throwIfNoEntry: false });\n\t\tconst exists = stat?.isFile() === true;\n\t\tconst breadcrumbStat = fs.statSync(breadcrumbFile, { throwIfNoEntry: false });\n\t\tconst freshIsRecent =\n\t\t\tfresh && breadcrumbStat?.isFile() === true && Date.now() - breadcrumbStat.mtimeMs < 5 * 60_000;\n\t\t// A materialized target resumes normally; a missing fresh target is honored\n\t\t// only briefly, so stale fresh breadcrumbs cannot hide older sessions forever.\n\t\tif (exists || freshIsRecent) return { cwd: breadcrumbCwd, sessionFile, exists, fresh };`,
      "session-paths stale fresh breadcrumb expiry",
    );
    out = r.content;

    return out;
  }

  function patchPredictClientSuffix(content) {
    return replaceAny(
      content,
      [
        `\t\t\t\t\treturn (await this.complete(resolved, before, prefix)).suggestion?.suffix ?? null;`,
        `\t\t\t\t\treturn (await this.complete(resolved, before, prefix)).suggestion?.suffix?.trimStart() ?? null;`,
      ],
      `\t\t\t\t\treturn (await this.complete(resolved, before, prefix)).suggestion?.suffix?.trimStart() ?? null;`,
      "text prediction ghost suffix no leading space",
    ).content;
  }

  function patchComposerPredictionSlashGate(content) {
    let out = insertAfter(
      content,
      `function predictionAnchor(session: AgentViewSession): AgentMessage | undefined {\n\tconst messages = session.messages;\n\tfor (let i = messages.length - 1; i >= 0; i--) {\n\t\tconst message = messages[i];\n\t\tif (isAdvisorCard(message) || isExcludedFromContext(message)) continue;\n\t\treturn message;\n\t}\n\treturn undefined;\n}\n`,
      `\n/** Slash-command input (its arguments and paths included) never shows a model prediction. */\nfunction isSlashCommandDraft(text: string): boolean {\n\treturn text.trimStart().startsWith("/");\n}\n`,
      "composer prediction slash draft helper",
    ).content;

    out = insertAfter(
      out,
      `\tconstructor(ctx: PredictionContext, options: { deadlineMs?: number; meterProvider?: MeterProvider } = {}) {\n\t\tthis.#ctx = ctx;\n`,
      `\t\tctx.composer.addEditListener((_edit, composer) => {\n\t\t\tif (isSlashCommandDraft(composer.text())) this.cancel();\n\t\t});\n`,
      "composer prediction cancels on slash draft",
    ).content;

    out = insertAfter(
      out,
      `\tget choices(): readonly string[] | undefined {\n`,
      `\t\tif (isSlashCommandDraft(this.#ctx.composer.text())) return undefined;\n`,
      "composer prediction hides on slash draft",
    ).content;

    return insertAfter(
      out,
      `\t\tif (!this.#isCurrent(source)) return "stale";\n`,
      `\t\tif (isSlashCommandDraft(this.#ctx.composer.text())) return "cancelled";\n`,
      "composer prediction declines slash draft",
    ).content;
  }

  return {
    patchKeybindingsConfig,
    patchInputController,
    patchSessionManager,
    patchPredictClientSuffix,
    patchComposerPredictionSlashGate,
    patchSessionPaths,
  };
}

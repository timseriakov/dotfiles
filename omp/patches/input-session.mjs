export function createInputSessionPatches(ctx) {
  const { replaceOnce, replaceAny, insertAfter, insertBefore } = ctx;

  function patchKeybindingsConfig(content) {
    let out = content;
    if (out.includes("APP_KEYBINDINGS")) {
      // 18.2.6 moved app keybindings into pi-tui app-keybindings.ts; upstream
      // dropped app.session.compact and app.git.open from it while the coding
      // agent still wires getKeys("app.git.open") / "app.session.compact".
      const compactDefinition = `\t"app.session.compact": {\n\t\tdefaultKeys: [],\n\t\tdescription: "Compact current session",\n\t},\n`;
      const gitDefinition = `\t"app.git.open": {\n\t\tdefaultKeys: [],\n\t\tdescription: "Open git UI",\n\t},\n`;
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
        `\t"app.session.observe": {
		defaultKeys: "ctrl+s",
		description: "Open the agent hub",
	},
`,
        compactDefinition + gitDefinition,
        "keybindings app.* definitions",
      );
      return r.content;
    }
    const duplicateInterface = `\t"app.session.observe": true;\n\t"app.session.compact": true;\n\t"app.git.open": true;\n\t"app.session.compact": true;\n`;
    if (out.includes(duplicateInterface)) {
      out = out.replace(
        duplicateInterface,
        `\t"app.session.observe": true;\n\t"app.session.compact": true;\n\t"app.git.open": true;\n`,
      );
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

    const compactDefinition = `\t"app.session.compact": {\n\t\tdefaultKeys: [],\n\t\tdescription: "Compact current session",\n\t},\n`;
    const gitDefinition = `\t"app.git.open": {\n\t\tdefaultKeys: [],\n\t\tdescription: "Open git UI",\n\t},\n`;
    const duplicateDefinitions = `${compactDefinition}${gitDefinition}${compactDefinition}`;
    if (out.includes(duplicateDefinitions))
      out = out.replace(
        duplicateDefinitions,
        `${compactDefinition}${gitDefinition}`,
      );

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
    return r.content;
  }

  function patchInputControllerBase(content) {
    const newHandler = `\thandleCtrlZ(): void {
\t\tif (process.platform === "win32" || !process.stdout.isTTY) {
\t\t\tthis.ctx.showStatus("Suspend (Ctrl+Z) is not supported on this platform");
\t\t\treturn;
\t\t}

\t\t// Set up handler to restore TUI when resumed.
\t\tconst onResume = (): void => {
\t\t\tthis.ctx.ui.start();
\t\t\tthis.ctx.ui.requestRender(true);
\t\t};
\t\tprocess.once("SIGCONT", onResume);

\t\t// Stop the TUI (restore terminal to normal mode) before suspending only OMP.
\t\tthis.ctx.ui.stop();

\t\ttry {
\t\t\t// Keep shell job-control flow intact: suspend OMP itself, not the whole process group.
\t\t\tprocess.kill(process.pid, "SIGTSTP");
\t\t} catch (err) {
\t\t\tprocess.removeListener("SIGCONT", onResume);
\t\t\tthis.ctx.ui.start();
\t\t\tthis.ctx.ui.requestRender(true);
\t\t\tconst reason = err instanceof Error ? err.message : String(err);
\t\t\tthis.ctx.showError(\`Failed to suspend: \${reason}\`);
\t\t}
\t}`;

    if (content.includes(newHandler)) return content;

    const start = content.indexOf("\thandleCtrlZ(): void {");
    const endAnchor = "\n\n\thandleDequeue(): void {";
    const end = start === -1 ? -1 : content.indexOf(endAnchor, start);
    if (start === -1 || end === -1) {
      throw new Error(
        "Patch 'input-controller ctrl-z suspends only omp process' could not find handleCtrlZ block. Upstream source changed.",
      );
    }

    return `${content.slice(0, start)}${newHandler}${content.slice(end)}`;
  }

  function patchInputController(content) {
    let out = patchInputControllerBase(content);
    const gitHandler = `\n\t\tfor (const key of this.ctx.keybindings.getKeys("app.git.open")) {\n\t\t\tthis.ctx.editor.setCustomKeyHandler(key, () => this.ctx.showGitUi());\n\t\t}\n`;
    if (out.includes(gitHandler)) return out;

    const compactHandler = `\t\tfor (const key of this.ctx.keybindings.getKeys("app.session.compact")) {\n\t\t\tthis.ctx.editor.setCustomKeyHandler(key, () => void this.ctx.handleCompactCommand());\n\t\t}\n`;
    const planHandler = `\t\tconst planModeKeys = this.ctx.keybindings.getKeys("app.plan.toggle");\n\t\tfor (const key of planModeKeys) {\n\t\t\tthis.ctx.editor.setCustomKeyHandler(key, () => void this.ctx.handlePlanModeCommand());\n\t\t}\n`;

    if (out.includes(compactHandler)) {
      return out.replace(compactHandler, compactHandler + gitHandler);
    }

    if (!out.includes(planHandler)) {
      throw new Error(
        "Patch 'input-controller app.git.open handler' could not find plan or compact handler. Upstream source changed.",
      );
    }
    return out.replace(
      planHandler,
      planHandler + "\n" + compactHandler + gitHandler,
    );
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
      ],
      `\t#resetToNewSession(options?: NewSessionOptions, forcedSessionFile?: string): string | undefined {\n\t\tthis.#diskTail = Promise.resolve();\n\t\tthis.#clearDiskError();\n\t\tthis.#reconcileSessionDirForFallback();\n\t\tthis.#sessionId = forcedSessionFile ? inferSessionIdFromPath(forcedSessionFile) ?? mintSessionId() : mintSessionId();`,
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

  function patchSessionListing(content) {
    let out = content;
    let r;

    r = replaceAny(
      out,
      [
        `\t\tconst files = await Array.fromAsync(new Bun.Glob("*/*.jsonl").scan(sessionsRoot), name =>\n\t\t\tpath.join(sessionsRoot, name),\n\t\t);`,
        `\t\tconst files = await Array.fromAsync(new Bun.Glob("**/*.jsonl").scan(sessionsRoot), name =>\n\t\t\tpath.join(sessionsRoot, name),\n\t\t);`,
      ],
      `\t\tconst files = await Array.fromAsync(new Bun.Glob("**/*.jsonl").scan(sessionsRoot), name =>\n\t\t\tpath.join(sessionsRoot, name),\n\t\t);`,
      "session-listing recursive all sessions",
    );
    out = r.content;

    return out;
  }

  return {
    patchKeybindingsConfig,
    patchInputControllerBase,
    patchInputController,
    patchSessionManager,
    patchSessionPaths,
    patchSessionListing,
  };
}

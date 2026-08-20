export function createInputSessionPatches(ctx) {
  const { replaceOnce, replaceAny, insertAfter, insertBefore } = ctx;

  function patchKeybindingsConfig(content) {
    let out = content;
    let r;

    r = insertAfter(
      out,
      `\t"app.session.observe": true;\n`,
      `\t"app.session.compact": true;\n`,
      "keybindings app.session.compact interface",
    );
    out = r.content;

    r = insertAfter(
      out,
      `\t"app.session.observe": {\n\t\tdefaultKeys: "ctrl+s",\n\t\tdescription: "Open the agent hub",\n\t},\n`,
      `\t"app.session.compact": {\n\t\tdefaultKeys: [],\n\t\tdescription: "Compact current session",\n\t},\n`,
      "keybindings app.session.compact definition",
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
    const r = insertAfter(
      out,
      `		const planModeKeys = this.ctx.keybindings.getKeys("app.plan.toggle");
		for (const key of planModeKeys) {
			this.ctx.editor.setCustomKeyHandler(key, () => void this.ctx.handlePlanModeCommand());
		}
`,
      `
		for (const key of this.ctx.keybindings.getKeys("app.session.compact")) {
			this.ctx.editor.setCustomKeyHandler(key, () => void this.ctx.handleCompactCommand());
		}
`,
      "input-controller app.session.compact handler",
    );
    return r.content;
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
      ],
      `\t#resetToNewSession(options?: NewSessionOptions, forcedSessionFile?: string): string | undefined {\n\t\tthis.#diskTail = Promise.resolve();\n\t\tthis.#clearDiskError();\n\t\tthis.#sessionId = forcedSessionFile ? inferSessionIdFromPath(forcedSessionFile) ?? mintSessionId() : mintSessionId();`,
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
        `\t\tconst stat = fs.statSync(sessionFile, { throwIfNoEntry: false });\n\t\tconst exists = stat?.isFile() === true;\n\t\tconst breadcrumbStat = fs.statSync(breadcrumbFile, { throwIfNoEntry: false });\n\t\tconst freshIsRecent =\n\t\t\tfresh && breadcrumbStat?.isFile() === true && Date.now() - breadcrumbStat.mtimeMs < 5 * 60_000;\n\t\t// A materialized target resumes normally; a missing fresh target is honored\n\t\t// only briefly, so stale fresh breadcrumbs cannot hide older sessions forever.\n\t\tif (exists || freshIsRecent) return { cwd: breadcrumbCwd, sessionFile, exists, fresh };`,
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

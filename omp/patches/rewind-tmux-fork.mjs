export function createRewindTmuxForkPatches({
  replaceOnce,
  insertAfter,
  insertBefore,
}) {
  function patchRewindTmuxFork(content) {
    let out = insertAfter(
      content,
      "\tonSelect: (entryId: string) => void;\n",
      "\tonFork?: (entryId: string) => void;\n",
      "rewind fork callback",
    ).content;
    const legacyForkKey = 'matchesKey(data, "shift+return") || data === "\\n"';
    if (out.includes(legacyForkKey))
      out = out.replace(
        legacyForkKey,
        'matchesKey(data, "shift+return") || matchesKey(data, "ctrl+j") || data === "\\x1b[10u" || data === "\\n"',
      );
    out = insertBefore(
      out,
      "\t\tif (this.#filter !== undefined) {\n\t\t\tthis.#handleFilterInput(data);",
      `\t\tif (this.deps.onFork && (matchesKey(data, "shift+enter") || matchesKey(data, "shift+return") || matchesKey(data, "ctrl+j") || data === "\\x1b[10u" || data === "\\n" || data === "\\x1b[13;2~")) {
\t\t\tthis.#forkOutlined();
\t\t\treturn;
\t\t}
`,
      "rewind Shift+Enter including Kitty bare LF",
    ).content;
    out = insertBefore(
      out,
      "\t#toggleExpanded(): void {\n",
      `\t#forkOutlined(): void {
\t\tconst target = this.#filter === undefined
\t\t\t? this.#outlinedTarget()
\t\t\t: this.#filterMatches().includes(this.#selected) ? this.#targets[this.#selected] : undefined;
\t\tif (target) this.deps.onFork?.(target.entryId);
\t}

`,
      "fork outlined turn or matching filtered turn",
    ).content;
    out = insertBefore(
      out,
      '\t\tif (event.act === "rewind") {\n',
      '\t\tif (event.act === "fork") {\n\t\t\tthis.#forkOutlined();\n\t\t\treturn;\n\t\t}\n',
      "native rewind fork action",
    ).content;
    for (const caption of ["Cancel", "Show all"]) {
      const old = `actionBar([null, actionButton("${caption}", "cancel", { keys: "escape" }), rewind]),`;
      out = replaceOnce(
        out,
        old,
        `actionBar([null, actionButton("${caption}", "cancel", { keys: "escape" }), ...(this.deps.onFork ? [actionButton("Fork in tmux", "fork", { keys: "shift+enter" })] : []), rewind]),`,
        `rewind ${caption} bar fork hint`,
      ).content;
    }
    for (const tail of [
      '${this.#truncated ? `${formatKeyHint("a")} earlier turns  ` : ""}',
      '${editorKey("tui.select.cancel")} show all',
    ]) {
      out = replaceOnce(
        out,
        '${formatKeyHint("enter")} rewind  ' + tail,
        '${formatKeyHint("enter")} rewind  ${this.deps.onFork ? `${formatKeyHint("shift+enter")} fork in tmux  ` : ""}' +
          tail,
        "rewind terminal fork hint",
      ).content;
    }
    return out;
  }

  function patchSessionForkLeaf(content) {
    let out = insertAfter(
      content,
      "\t\t\trepairInterruptedTail?: boolean;\n",
      "\t\t\tleafId?: string;\n",
      "forkFrom optional history boundary",
    ).content;
    out = replaceOnce(
      out,
      '\t\tconst history = sourceEntries.filter(entry => entry.type !== "session") as SessionEntry[];',
      '\t\tlet history = sourceEntries.filter(entry => entry.type !== "session") as SessionEntry[];',
      "allow forkFrom history cut",
    ).content;
    out = replaceOnce(
      out,
      "\t\tmanager.#index.rebuild(history);\n\t\tmanager.sanitizeLoadedOpenAIResponsesReplayMetadata();",
      `\t\tmanager.#index.rebuild(history);
\t\tif (options?.leafId !== undefined) {
\t\t\tif (!manager.#index.has(options.leafId)) throw new Error(\`Entry \${options.leafId} not found\`);
\t\t\tmanager.#entries = history = manager.getBranch(options.leafId).map(entry =>
\t\t\t\tentry.activeLeafId === undefined ? entry : { ...entry, activeLeafId: undefined },
\t\t\t);
\t\t\tmanager.#index.rebuild(manager.#entries);
\t\t}
\t\tmanager.sanitizeLoadedOpenAIResponsesReplayMetadata();`,
      "cut independent fork to selected branch without later history",
    ).content;
    return out;
  }

  function patchSessionForkFile(content) {
    const out = replaceOnce(
      content,
      '\ttype SessionManager,\n} from "./session-manager";',
      '\tSessionManager,\n} from "./session-manager";',
      "runtime SessionManager for detached fork",
    ).content;
    return insertBefore(
      out,
      "\t/**\n\t * Fork the current session, creating a new session file with the exact same state.\n",
      `\t/** Create a detached entry fork while leaving this live session untouched. */
\tasync createForkFile(entryId: string): Promise<string> {
\t\tconst queued = this.#enterSessionTransition(() => this.createForkFile(entryId));
\t\tif (queued) return queued;
\t\tusing _transition = this.#beginSessionTransition();
\t\tthis.#assertIdleForSnapshot("fork into a tmux pane");
\t\tconst entry = this.sessionManager.getEntry(entryId);
\t\tif (!entry || (entry.type !== "message" && entry.type !== "custom_message")) {
\t\t\tthrow new Error(\`Invalid entry ID for forking: \${entryId}\`);
\t\t}
\t\tawait this.flushToDisk();
\t\tthis.#assertIdleForSnapshot("fork into a tmux pane");
\t\tconst source = this.sessionManager.getSessionFile();
\t\tif (!source || !this.sessionManager.isSessionOnDisk()) throw new Error("Fork requires a saved session");
\t\tconst fork = await SessionManager.forkFrom(source, this.sessionManager.getCwd(), this.sessionManager.getSessionDir(), undefined, {
\t\t\tleafId: this.#resolveForkLeaf(entryId),
\t\t\tsuppressBreadcrumb: true,
\t\t});
\t\ttry {
\t\t\treturn fork.getSessionFile()!;
\t\t} finally {
\t\t\tawait fork.close();
\t\t}
\t}

`,
      "create fork file without switching live session",
    ).content;
  }

  function patchRewindTmuxController(content) {
    let out = insertAfter(
      content,
      "\t\t\tonSelect: entryId => void this.#rewindFromTranscript(entryId, done),\n",
      "\t\t\tonFork: entryId => void this.#forkRewindInTmux(entryId, done),\n",
      "wire rewind tmux fork",
    ).content;
    out = out
      .replace(
        '"tmux", "split-window", "-v", "-t", pane',
        '"tmux", "split-window", "-h", "-t", pane',
      )
      .replace(
        "Fork opened in the tmux pane below; original session unchanged",
        "Fork opened in the tmux pane beside this one; original session unchanged",
      );
    out = insertBefore(
      out,
      "\tasync #forkAt(entryId: string): Promise<void> {\n",
      `\tasync #forkRewindInTmux(entryId: string, done: () => void): Promise<void> {
\t\tdone();
\t\tconst pane = process.env.TMUX_PANE;
\t\tif (!process.env.TMUX || !pane) {
\t\t\tthis.ctx.showError("Shift+Enter fork requires tmux");
\t\t\treturn;
\t\t}
\t\tlet forkFile: string | undefined;
\t\ttry {
\t\t\tforkFile = await this.ctx.session.createForkFile(entryId);
\t\t\t// Multiple tmux command arguments execute directly, without shell interpolation.
\t\t\tconst proc = Bun.spawn([
\t\t\t\t"tmux", "split-window", "-h", "-t", pane, "-c", this.ctx.sessionManager.getCwd(),
\t\t\t\t"-e", \`PI_CODING_AGENT_DIR=\${getAgentDir()}\`,
\t\t\t\t"env", "-u", "PI_SESSION_ID", "fish", "-lc", "exec $argv", "--",
\t\t\t\tprocess.execPath, process.argv[1], "--session", forkFile,
\t\t\t], { stdin: "ignore", stdout: "ignore", stderr: "pipe" });
\t\t\tconst [code, stderr] = await Promise.all([proc.exited, new Response(proc.stderr).text()]);
\t\t\tif (code !== 0) throw new Error(stderr.trim() || \`tmux exited \${code}\`);
\t\t\tthis.ctx.showStatus("Fork opened in the tmux pane beside this one; original session unchanged");
\t\t} catch (error) {
\t\t\tconst message = error instanceof Error ? error.message : String(error);
\t\t\tthis.ctx.showError(forkFile ? \`\${message} · Fork saved: \${forkFile}\` : message);
\t\t}
\t}

`,
      "open rewind fork in vertical tmux split",
    ).content;
    return out;
  }

  return {
    patchRewindTmuxFork,
    patchSessionForkLeaf,
    patchSessionForkFile,
    patchRewindTmuxController,
  };
}

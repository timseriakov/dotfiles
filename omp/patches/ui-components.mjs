export function createUiComponentPatches(ctx) {
  const { replaceOnce, replaceAny, insertAfter, insertBefore } = ctx;

  function patchWelcome(content) {
    const alreadyPatched = `\t#renderLines(_termWidth: number): string[] {\n\t\treturn [theme.bold("Welcome from Oh My Pi")];\n\n\t\t// Box dimensions - responsive with max width and small-terminal support`;
    const alreadyPatchedOld = `\trender(_termWidth: number): string[] {\n\t\treturn [theme.bold("Welcome from Oh My Pi")];\n\n\t\t// Box dimensions - responsive with max width and small-terminal support`;
    return replaceAny(
      content,
      [
        `\t#renderLines(termWidth: number): string[] {\n\t\t// Box dimensions - responsive with max width and small-terminal support`,
        alreadyPatched,
        `\trender(termWidth: number): string[] {\n\t\t// Box dimensions - responsive with max width and small-terminal support`,
        alreadyPatchedOld,
        `\t#renderLines(_termWidth: number): string[] {\n\t\treturn [theme.bold("Welcome from Oh My Pi"), ""]\n\n\t\t// Box dimensions - responsive with max width and small-terminal support`,
        `\trender(_termWidth: number): string[] {\n\t\treturn [theme.bold("Welcome from Oh My Pi"), ""]\n\n\t\t// Box dimensions - responsive with max width and small-terminal support`,
      ],
      alreadyPatched,
      "welcome minimal text only",
    ).content;
  }
  function patchAssistantMessage(content) {
    let out = content;
    const replacements = [
      [
        [
          "new Markdown(content.text.trim(), 1, 0, getMarkdownTheme())",
          "new Markdown(trimmed, 1, 0, getMarkdownTheme())",
          "new Markdown(trimmed, 1, 0, getMarkdownTheme(), mdOptions)",
          "new Markdown(content.text.trim(), 0, 0, getMarkdownTheme())",
          "new Markdown(trimmed, 0, 0, getMarkdownTheme())",
          "new Markdown(trimmed, 0, 0, getMarkdownTheme(), mdOptions)",
          "new Markdown(trimmed, 1, 0, getMarkdownTheme(), mdOptions, 0)",
          "new Markdown(trimmed, 0, 0, getMarkdownTheme(), mdOptions, 0)",
          "new Markdown(trimmed, 1, 0, this.#getProseTheme(), mdOptions, 0)",
          "new Markdown(trimmed, 0, 0, this.#getProseTheme(), mdOptions, 0)",
        ],
        "new Markdown(trimmed, 0, 0, this.#getProseTheme(), mdOptions, 0)",
        "assistant text padding",
      ],
      [
        [
          'new Text(theme.italic(theme.fg("thinkingText", "Thinking...")), 1, 0)',
          'new Text(theme.italic(theme.fg("thinkingText", "Thinking...")), 0, 0)',
        ],
        'new Text(theme.italic(theme.fg("thinkingText", "Thinking...")), 0, 0)',
        "assistant thinking label padding",
        true, // skipIfMissing
      ],
      [
        [
          "new Markdown(thinkingText, 1, 0, getMarkdownTheme(), {",
          "new Markdown(thinkingText, 0, 0, getMarkdownTheme(), {",
        ],
        "new Markdown(thinkingText, 0, 0, getMarkdownTheme(), {",
        "assistant thinking block padding",
      ],
      [
        [
          'new Text(theme.fg("error", errorPresentation.text), 1, 0)',
          'new Text(theme.fg("error", errorPresentation.text), 0, 0)',
          'new Text(theme.fg("error", abortMessage), 1, 0)',
          'new Text(theme.fg("error", abortMessage), 0, 0)',
        ],
        'new Text(theme.fg("error", errorPresentation.text), 0, 0)',
        "assistant abort padding",
      ],
    ];
    for (const [alternatives, newText, label, skipIfMissing] of replacements) {
      if (
        skipIfMissing &&
        !alternatives.some((a) => out.includes(a.replace(/, 1, 0/, ", 0, 0")))
      )
        continue;
      out = replaceAny(out, alternatives, newText, label).content;
    }
    return out;
  }

  function patchUsageRow(content) {
    return replaceAny(
      content,
      [
        'new Text(theme.fg("dim", parts.join("  ")), 1, 0)',
        'new Text(theme.fg("dim", parts.join("  ")), 0, 0)',
        'new Text(theme.fg("dim", formatUsageRow(usage, durationMs, ttftMs, timestamp)), 1, 0)',
        'new Text(theme.fg("dim", formatUsageRow(usage, durationMs, ttftMs, timestamp)), 0, 0)',
        'new Text(theme.fg("dim", formatUsageRow(usage, durationMs, ttftMs, timestamp, turnElapsedMs)), 1, 0)',
        'new Text(theme.fg("dim", formatUsageRow(usage, durationMs, ttftMs, timestamp, turnElapsedMs)), 0, 0)',
      ],
      'new Text(theme.fg("dim", formatUsageRow(usage, durationMs, ttftMs, timestamp, turnElapsedMs)), 0, 0)',
      "assistant usage padding",
    ).content;
  }

  function patchUserMessage(content) {
    return replaceOnce(
      content,
      "new Markdown(text, 1, 1, getMarkdownTheme(), {",
      "new Markdown(text, 0, 1, getMarkdownTheme(), {",
      "user message padding",
    ).content;
  }

  function patchComposer(content) {
    let out = content;
    let r;

    r = replaceAny(
      out,
      [
        `		this.#editor = new CustomEditor(getEditorTheme());
		this.editor.disableSubmit = true;
		this.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
        `		this.#editor = new CustomEditor(getEditorTheme());
		this.editor.disableSubmit = true;
		this.editor.setBorderVisible(false);
		this.editor.setPaddingX(0);
		this.editor.setPromptGutter(" ");
		this.editor.setPromptGutterColor(theme.fg.bind(theme, "success"));
		this.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      ],
      `		this.#editor = new CustomEditor(getEditorTheme());
		this.editor.disableSubmit = true;
		this.editor.setBorderVisible(false);
		this.editor.setPaddingX(0);
		this.editor.setPromptGutter(" ");
		this.editor.setPromptGutterColor(theme.fg.bind(theme, "success"));
		this.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      "composer startup editor gutter",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `		if (this.#preferences.quiet) {
			this.#welcome?.stopIntro();
			this.#welcome = undefined;
		} else {
			this.#ensureWelcome();
			this.#welcome?.invalidate();
			if (wasQuiet && this.#started) this.playWelcomeIntro();
		}`,
        `		if (this.#preferences.quiet) {
			this.#ensureWelcome();
			this.#welcome?.stopIntro();
		} else {
			this.#ensureWelcome();
			this.#welcome?.invalidate();
			if (wasQuiet && this.#started) this.playWelcomeIntro();
		}`,
      ],
      `		if (this.#preferences.quiet) {
			this.#ensureWelcome();
			this.#welcome?.stopIntro();
		} else {
			this.#ensureWelcome();
			this.#welcome?.invalidate();
			if (wasQuiet && this.#started) this.playWelcomeIntro();
		}`,
      "composer keeps welcome line in quiet mode",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\t#rebuildHeader(): void {
\t\tthis.#header.clear();
\t\tfor (const component of this.#headerBefore) this.#header.addChild(component);
\t\tif (this.#welcome) {
\t\t\tthis.#header.addChild(new Spacer(1));
\t\t\tthis.#header.addChild(this.#welcome);
\t\t\tthis.#header.addChild(new Spacer(1));
\t\t}
\t\tfor (const component of this.#headerAfter) this.#header.addChild(component);
\t}`,
        `\t#rebuildHeader(): void {
\t\tthis.#header.clear();
\t\tfor (const component of this.#headerBefore) this.#header.addChild(component);
\t\tif (this.#welcome) {
\t\t\tthis.#header.addChild(this.#welcome);
\t\t\tthis.#header.addChild(new Spacer(1));
\t\t}
\t\tfor (const component of this.#headerAfter) this.#header.addChild(component);
\t}`,
      ],
      `\t#rebuildHeader(): void {
\t\tthis.#header.clear();
\t\tfor (const component of this.#headerBefore) this.#header.addChild(component);
\t\tif (this.#welcome) {
\t\t\tthis.#header.addChild(this.#welcome);
\t\t}
\t\tfor (const component of this.#headerAfter) this.#header.addChild(component);
\t}`,
      "composer no blank line before welcome",
    );
    out = r.content;

    return out;
  }

  function patchInteractiveMode(content) {
    let out = content;
    let r;

    if (out.includes("this.#welcomeComponent")) {
      r = replaceAny(
        out,
        [
          `\t\t\t// Setup UI layout\n\t\t\tthis.ui.addChild(new Spacer(1));\n\t\t\tthis.ui.addChild(this.#welcomeComponent);\n\t\t\tthis.ui.addChild(new Spacer(1));`,
          `\t\t\t// Setup UI layout\n\t\t\tthis.ui.addChild(this.#welcomeComponent);`,
        ],
        `\t\t\t// Setup UI layout\n\t\t\tthis.ui.addChild(this.#welcomeComponent);`,
        "interactive welcome spacing",
      );
      out = r.content;

      r = replaceAny(
        out,
        [`\t\tif (!startupQuiet) {`, `\t\tif (true) {`],
        `\t\tif (true) {`,
        "interactive minimal welcome visible in quiet mode",
      );
      out = r.content;
    }

    r = replaceAny(
      out,
      [
        `\t\t\tif (!options.suppressWelcomeIntro) {`,
        `\t\t\tif (!startupQuiet && !options.suppressWelcomeIntro) {`,
        `\t\t\t\tplayWelcomeIntro: !options.suppressWelcomeIntro,`,
        `\t\t\t\tplayWelcomeIntro: !startupQuiet && !options.suppressWelcomeIntro,`,
      ],
      `\t\t\t\tplayWelcomeIntro: !startupQuiet && !options.suppressWelcomeIntro,`,
      "interactive quiet skips welcome intro animation",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\t\t\tif (this.#startupChangelog && settings.get("startup.changelogMode") !== "hidden") {`,
        `\t\t\tif (!startupQuiet && this.#startupChangelog && settings.get("startup.changelogMode") !== "hidden") {`,
        `\t\tif (this.#startupChangelog && settings.get("startup.changelogMode") !== "hidden") {`,
        `\t\tif (!startupQuiet && this.#startupChangelog && settings.get("startup.changelogMode") !== "hidden") {`,
      ],
      `\t\tif (!startupQuiet && this.#startupChangelog && settings.get("startup.changelogMode") !== "hidden") {`,
      "interactive quiet suppresses changelog noise",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\t\tthis.editor = new CustomEditor(getEditorTheme());\n\t\tthis.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
        `\t\tthis.editor = new CustomEditor(getEditorTheme());\n\t\tthis.ui.enableScopedInputRender(this.editor);\n\t\tthis.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
        `\t\tthis.editor = new CustomEditor(getEditorTheme());\n\t\tthis.editor.setBorderVisible(false);\n\t\tthis.editor.setPaddingX(0);\n\t\tthis.editor.setPromptGutter(" ");\n\t\tthis.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
        `\t\tthis.editor = new CustomEditor(getEditorTheme());\n\t\tthis.editor.setBorderVisible(false);\n\t\tthis.editor.setPaddingX(0);\n\t\tthis.editor.setPromptGutter(" ");\n\t\tthis.editor.setPromptGutterColor(theme.fg.bind(theme, "success"));\n\t\tthis.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
        `\t\tthis.editor = this.composer.editor;\n\t\tthis.editor.magicKeywordsEnabled = () => this.settings.get("magicKeywords.enabled");`,
        `\t\tthis.editor = this.composer.editor;\n\t\tthis.editor.setBorderVisible(false);\n\t\tthis.editor.setPaddingX(0);\n\t\tthis.editor.setPromptGutter(" ");\n\t\tthis.editor.setPromptGutterColor(theme.fg.bind(theme, "success"));\n\t\tthis.editor.magicKeywordsEnabled = () => this.settings.get("magicKeywords.enabled");`,
      ],
      `\t\tthis.editor = this.composer.editor;\n\t\tthis.editor.setBorderVisible(false);\n\t\tthis.editor.setPaddingX(0);\n\t\tthis.editor.setPromptGutter(" ");\n\t\tthis.editor.setPromptGutterColor(theme.fg.bind(theme, "success"));\n\t\tthis.editor.magicKeywordsEnabled = () => this.settings.get("magicKeywords.enabled");`,
      "interactive editor default gutter",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
        `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\t\tif (!factory) this.ui.enableScopedInputRender(nextEditor);\n\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
        `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\n\t\tnextEditor.setBorderVisible(false);\n\t\tnextEditor.setPaddingX(0);\n\t\tnextEditor.setPromptGutter(" ");\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
        `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\n\t\tnextEditor.setBorderVisible(false);\n\t\tnextEditor.setPaddingX(0);\n\t\tnextEditor.setPromptGutter(" ");\n\t\tnextEditor.setPromptGutterColor(theme.fg.bind(theme, "success"));\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
        `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
        `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\t\tif (!factory) this.ui.enableScopedInputRender(nextEditor);\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      ],
      `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\t\tif (!factory) this.ui.enableScopedInputRender(nextEditor);\n\n\t\tnextEditor.setBorderVisible(false);\n\t\tnextEditor.setPaddingX(0);\n\t\tnextEditor.setPromptGutter(" ");\n\t\tnextEditor.setPromptGutterColor(theme.fg.bind(theme, "success"));\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      "interactive replacement editor gutter",
    );
    out = r.content;

    return out;
  }

  function patchDynamicBorder(content) {
    return replaceAny(
      content,
      [
        `\trender(width: number): readonly string[] {
\t\tif (this.#cachedLines && this.#cachedWidth === width) {
\t\t\treturn this.#cachedLines;
\t\t}
\t\tconst horizontal = typeof theme === "undefined" ? "─" : theme.boxRound.horizontal;
\t\tconst lines = [this.#color(horizontal.repeat(Math.max(1, width)))];
\t\tthis.#cachedWidth = width;
\t\tthis.#cachedLines = lines;
\t\treturn lines;
\t}`,
        `\trender(_width: number): readonly string[] {
\t\treturn [];
\t}`,
      ],
      `\trender(_width: number): readonly string[] {
\t\treturn [];
\t}`,
      "dynamic message border lines disabled",
    ).content;
  }

  function patchTuiVisibleWidth(content) {
    // Upstream 15.10+ handles ANSI natively via Bun.stringWidth and its own
    // escape scanner — the old ANSI-strip workaround is no longer needed.
    return content;
  }

  return {
    patchWelcome,
    patchAssistantMessage,
    patchUsageRow,
    patchUserMessage,
    patchComposer,
    patchDynamicBorder,
    patchInteractiveMode,
    patchTuiVisibleWidth,
  };
}

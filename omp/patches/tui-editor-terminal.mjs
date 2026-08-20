export function createTuiEditorTerminalPatches(ctx) {
  const { replaceOnce, replaceAny, insertAfter, insertBefore } = ctx;

  function patchEditorGutterWidth(content) {
    let out = content;
    let r;

    r = replaceAny(
      out,
      [
        `\t#promptGutter: string | undefined;`,
        `\t#promptGutter: string | undefined;\n\t#promptGutterColor: ((str: string) => string) | undefined;`,
      ],
      `\t#promptGutter: string | undefined;\n\t#promptGutterColor: ((str: string) => string) | undefined;`,
      "editor prompt gutter color field",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\tsetPromptGutter(promptGutter: string | undefined): void {\n\t\tthis.#promptGutter = promptGutter;\n\t}`,
        `\tsetPromptGutter(promptGutter: string | undefined): void {\n\t\tthis.#promptGutter = promptGutter;\n\t}\n\n\tsetPromptGutterColor(color: ((str: string) => string) | undefined): void {\n\t\tthis.#promptGutterColor = color;\n\t}`,
      ],
      `\tsetPromptGutter(promptGutter: string | undefined): void {\n\t\tthis.#promptGutter = promptGutter;\n\t}\n\n\tsetPromptGutterColor(color: ((str: string) => string) | undefined): void {\n\t\tthis.#promptGutterColor = color;\n\t}`,
      "editor prompt gutter color setter",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\t\treturn {\n\t\t\tfirstLine: sliceByColumn(this.#promptGutter, 0, gutterWidth, true),\n\t\t\tcontinuation: padding(gutterWidth),\n\t\t\twidth: gutterWidth,\n\t\t};`,
        `\t\tconst firstLine = sliceByColumn(this.#promptGutter, 0, gutterWidth, true);\n\t\treturn {\n\t\t\tfirstLine: this.#promptGutterColor ? this.#promptGutterColor(firstLine) : firstLine,\n\t\t\tcontinuation: padding(gutterWidth),\n\t\t\twidth: gutterWidth,\n\t\t};`,
        `\t\treturn {\n\t\t\tfirstLine: sliceByColumn(gutter, 0, gutterWidth, true),\n\t\t\tcontinuation: padding(gutterWidth),\n\t\t\twidth: gutterWidth,\n\t\t};`,
      ],
      `\t\tconst firstLine = sliceByColumn(this.#promptGutter, 0, gutterWidth, true);\n\t\treturn {\n\t\t\tfirstLine: this.#promptGutterColor ? this.#promptGutterColor(firstLine) : firstLine,\n\t\t\tcontinuation: padding(gutterWidth),\n\t\t\twidth: gutterWidth,\n\t\t};`,
      "editor prompt gutter green style",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\tgetTopBorderAvailableWidth(terminalWidth: number): number {\n\t\tconst paddingX = this.#getEditorPaddingX();\n\t\tconst borderWidth = this.#getHorizontalChromeWidth(paddingX);\n\t\treturn Math.max(0, terminalWidth - borderWidth * 2);\n\t}`,
        `\tgetTopBorderAvailableWidth(terminalWidth: number): number {\n\t\tconst paddingX = this.#getEditorPaddingX();\n\t\tconst borderWidth = this.#getHorizontalChromeWidth(paddingX);\n\t\treturn Math.max(0, terminalWidth - borderWidth * 2 - this.#getPromptGutterWidth(terminalWidth, paddingX));\n\t}`,
      ],
      `\tgetTopBorderAvailableWidth(terminalWidth: number): number {\n\t\tconst paddingX = this.#getEditorPaddingX();\n\t\tconst borderWidth = this.#getHorizontalChromeWidth(paddingX);\n\t\treturn Math.max(0, terminalWidth - borderWidth * 2);\n\t}`,
      "editor status width ignores gutter",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\t#getPromptGutterWidth(width: number, paddingX: number): number {\n\t\tif (this.#borderVisible || !this.#promptGutter) return 0;\n\t\tconst chromeWidth = 2 * this.#getHorizontalChromeWidth(paddingX);\n\t\tconst availableWidth = Math.max(0, width - chromeWidth);\n\t\treturn Math.min(visibleWidth(this.#promptGutter), availableWidth);\n\t}\n`,
        `\t#getPromptGutterWidth(width: number, paddingX: number): number {\n\t\tif (this.#borderVisible || !this.#promptGutter) return 0;\n\t\tconst chromeWidth = 2 * this.#getHorizontalChromeWidth(paddingX);\n\t\tconst availableWidth = Math.max(0, width - chromeWidth);\n\t\tconst promptGutterWidth = visibleWidth(this.#promptGutter);\n\t\treturn Math.min(promptGutterWidth > 0 ? promptGutterWidth : 1, availableWidth);\n\t}\n`,
        `\t#getPromptGutterWidth(width: number, paddingX: number): number {\n\t\tconst gutter = this.#getEffectivePromptGutter();\n\t\tif (!gutter) return 0;\n\t\tconst chromeWidth = 2 * this.#getHorizontalChromeWidth(paddingX);\n\t\tconst availableWidth = Math.max(0, width - chromeWidth);\n\t\treturn Math.min(visibleWidth(gutter), availableWidth);\n\t}\n`,
      ],
      `\t#getPromptGutterWidth(width: number, paddingX: number): number {\n\t\tif (this.#borderVisible || !this.#promptGutter) return 0;\n\t\tconst chromeWidth = 2 * this.#getHorizontalChromeWidth(paddingX);\n\t\tconst availableWidth = Math.max(0, width - chromeWidth);\n\t\tconst promptGutterWidth = visibleWidth(this.#promptGutter);\n\t\treturn Math.min(promptGutterWidth > 0 ? promptGutterWidth : 1, availableWidth);\n\t}\n`,
      "editor prompt gutter width fallback",
    );
    out = r.content;

    // 17.4.0 moved top-border/chrome rendering into the composer style's
    // `renderTop(chromeCtx)`, but the borderless style intentionally renders no
    // chrome. Keep the old Starship-like status row for the borderless editor,
    // using the current private field instead of the removed local `borderVisible`.
    const badBorderlessStatusBlock = `\t\tif (!borderVisible) {\n\t\t\tconst topBorder = this.#topBorderProvider ? this.#topBorderProvider(width) : this.#topBorderContent;\n\t\t\tif (topBorder) {\n\t\t\t\tconst contentWidth = Math.max(0, width);\n\t\t\t\tconst { content, width: statusWidth } = topBorder;\n\t\t\t\tif (statusWidth <= contentWidth) {\n\t\t\t\t\tresult.push(content + padding(contentWidth - statusWidth));\n\t\t\t\t} else {\n\t\t\t\t\tresult.push(truncateToWidth(content, contentWidth));\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n`;
    const borderlessStatusBlock = badBorderlessStatusBlock.replace(
      "if (!borderVisible)",
      "if (!this.#borderVisible)",
    );
    const borderlessStatusAnchor = `\t\tconst topRow = style.renderTop(chromeCtx);\n\t\tif (topRow !== undefined) result.push(topRow);\n\n`;
    if (out.includes(badBorderlessStatusBlock)) {
      out = out.replace(badBorderlessStatusBlock, borderlessStatusBlock);
    } else if (!out.includes(borderlessStatusBlock)) {
      out = out.replace(
        borderlessStatusAnchor,
        borderlessStatusAnchor + borderlessStatusBlock,
      );
    }

    return out;
  }
  function patchTuiTerminalCapabilities(content) {
    // Upstream 16.5.2+ moved kitty image transmission to kitty-graphics.ts and
    // already wraps APC sequences with wrapTmuxPassthroughIfNeeded.
    return content;
  }

  function patchTuiKittyGraphics(content) {
    // Upstream 16.5.2+ moved tmux helpers to ./tmux.ts and already uses
    // wrapTmuxPassthroughIfNeeded for APC wrapping, so no patch needed.
    return content;
  }

  function patchTuiTerminal(content) {
    // OMP 17.0.1 avoids OSC 99 capability probes in terminal multiplexers.
    return content;
  }

  function patchCustomEditor(content) {
    let out = content;
    let r;
    r = replaceAny(
      out,
      [
        `\t\t\t// Intercept configured forward model cycling\n\t\t\tif (this.#matchesAction(canonical, "app.model.cycleForward") && this.onCycleModelForward) {\n\t\t\t\tthis.onCycleModelForward();\n\t\t\t\treturn;\n\t\t\t}`,
      ],
      `\t\t\t// Intercept configured forward model cycling\n\t\t\tif (this.#matchesAction(canonical, "app.model.cycleForward") && this.onCycleModelForward && !this.isShowingAutocomplete()) {\n\t\t\t\tthis.onCycleModelForward();\n\t\t\t\treturn;\n\t\t\t}`,
      "custom-editor cycleForward autocomplete guard",
    );
    out = r.content;
    return out;
  }

  return {
    patchEditorGutterWidth,
    patchTuiTerminalCapabilities,
    patchTuiKittyGraphics,
    patchTuiTerminal,
    patchCustomEditor,
  };
}

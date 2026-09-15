export function createGitTuiPatches({ replaceAny }) {
  function patchGitTuiColors(content) {
    return replaceAny(
      content,
      [
        `export function canvasHex(): string {
	const hex = theme.getBgHex("statusLineBg");
	return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : isDark() ? "#000000" : "#ffffff";
}`,
        `export function canvasHex(): string {
	const hex = theme.getBgHex("statusLineBg");
	if (/^#[0-9a-fA-F]{6}$/.test(hex) && hex !== "#ffffff" && hex !== "#000000") return hex;
	const surface = theme.getBgHex("userMessageBg");
	return /^#[0-9a-fA-F]{6}$/.test(surface) ? surface : isDark() ? "#2e3440" : "#ffffff";
}`,
        `export function canvasHex(): string {
	const brightText = luminance(textHex()) > 0.5;
	const hex = theme.getBgHex("statusLineBg");
	if (!brightText && /^#[0-9a-fA-F]{6}$/.test(hex) && hex !== "#ffffff" && hex !== "#000000") return hex;
	const surface = theme.getBgHex("userMessageBg");
	if (!brightText && /^#[0-9a-fA-F]{6}$/.test(surface)) return surface;
	return brightText ? "#2e3440" : "#ffffff";
}`,
      ],
      `export function canvasHex(): string {
	const brightText = luminance(textHex()) > 0.5;
	const hex = theme.getBgHex("statusLineBg");
	if (!brightText && /^#[0-9a-fA-F]{6}$/.test(hex) && hex !== "#ffffff" && hex !== "#000000") return hex;
	const surface = theme.getBgHex("userMessageBg");
	if (!brightText && /^#[0-9a-fA-F]{6}$/.test(surface)) return surface;
	return brightText ? "#2e3440" : "#ffffff";
}`,
      "git TUI uses readable surface when statusLineBg is terminal default",
    ).content;
  }

  function patchGitTuiLayout(content) {
    let out = replaceAny(
      content,
      ["\t#centerWidth = 0;"],
      "\t#centerWidth = 0;\n\t#sidebarWidth = 0;",
      "git TUI stores sidebar width",
    ).content;
    out = replaceAny(
      out,
      ["const inSidebar = event.col > this.#centerWidth;"],
      "const inSidebar = event.col < this.#sidebarWidth;",
      "git TUI sidebar mouse region moved left",
    ).content;
    out = replaceAny(
      out,
      [
        "this.#sidebar.handleClick(contentRow, event.col - this.#centerWidth - 1);",
      ],
      "this.#sidebar.handleClick(contentRow, event.col);",
      "git TUI sidebar click offset",
    ).content;
    out = replaceAny(
      out,
      ["this.#pane.clickAt(event.col, contentRow, (event.button & 4) !== 0);"],
      "this.#pane.clickAt(event.col - this.#sidebarWidth - 1, contentRow, (event.button & 4) !== 0);",
      "git TUI diff click offset",
    ).content;
    out = replaceAny(
      out,
      [
        "\t\tconst sidebarWidth = Math.max(30, Math.min(48, Math.floor(width * 0.3)));\n\t\tthis.#centerWidth = width - sidebarWidth - 1;",
      ],
      "\t\tconst sidebarWidth = Math.max(30, Math.min(48, Math.floor(width * 0.3)));\n\t\tthis.#sidebarWidth = sidebarWidth;\n\t\tthis.#centerWidth = width - sidebarWidth - 1;",
      "git TUI computes sidebar width",
    ).content;

    const oldRender = [
      '\t\t\tconst left = paneLines[i] ?? "";',
      '\t\t\tconst leftPad = " ".repeat(Math.max(0, this.#centerWidth - visibleWidth(left)));',
      '\t\t\tlines.push(`${truncateToWidth(left, this.#centerWidth)}${leftPad}${separator}${sidebarLines[i] ?? ""}`);',
    ].join("\n");
    const newRender = [
      '\t\t\tconst sidebar = sidebarLines[i] ?? "";',
      '\t\t\tconst sidebarPad = " ".repeat(Math.max(0, this.#sidebarWidth - visibleWidth(sidebar)));',
      '\t\t\tconst pane = paneLines[i] ?? "";',
      '\t\t\tconst panePad = " ".repeat(Math.max(0, this.#centerWidth - visibleWidth(pane)));',
      "\t\t\tlines.push(`${truncateToWidth(sidebar, this.#sidebarWidth)}${sidebarPad}${separator}${truncateToWidth(pane, this.#centerWidth)}${panePad}`);",
    ].join("\n");
    return replaceAny(
      out,
      [oldRender],
      newRender,
      "git TUI renders sidebar before diff pane",
    ).content;
  }

  return { patchGitTuiColors, patchGitTuiLayout };
}

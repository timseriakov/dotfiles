export const SIDE_CHAT_CONFIG = { shortcut: "alt+;", shortcuts: ["alt+;", "ctrl+;", "ctrl+shift+;"] };

export function patchPiSideChatOverlay(content, { replaceAny }) {
  let out = content;
  let r;
  const oldImports = [
    "  buildSessionContext,",
    "  convertToLlm,",
    "  createCodingTools,",
    "  createReadOnlyTools,",
    "  getSelectListTheme,",
  ].join("\n");
  const newImports = [
    "  buildSessionContext,",
    "  convertToLlm,",
    "  createCodingTools,",
    "  createReadOnlyTools,",
    "  CustomEditor,",
    "  getSelectListTheme,",
  ].join("\n");
  r = replaceAny(out, [oldImports], newImports, "pi-side-chat canonical editor imports");
  out = r.content;
  const oldEditorImport = 'import { Editor, Key, matchesKey, truncateToWidth, visibleWidth, type Component, type Focusable, type TUI } from "@mariozechner/pi-tui";';
  const newEditorImport = 'import { Key, matchesKey, truncateToWidth, visibleWidth, type Component, type Focusable, type TUI } from "@mariozechner/pi-tui";';
  r = replaceAny(out, [oldEditorImport, newEditorImport], newEditorImport, "pi-side-chat remove legacy Editor import");
  out = r.content;
  r = replaceAny(out, ["  private editor: Editor;", "  private editor: CustomEditor;"], "  private editor: CustomEditor;", "pi-side-chat canonical editor type");
  out = r.content;
  const oldConstructor = '    this.editor = new Editor(tui, { borderColor: (t) => theme.fg("borderMuted", t), selectList: getSelectListTheme() }, { paddingX: 0 });';
  const newConstructor = "    this.editor = new CustomEditor(tui, getSideChatEditorTheme(theme), undefined, { paddingX: 0 });";
  r = replaceAny(out, [oldConstructor, "    this.editor = new CustomEditor(tui, getSideChatEditorTheme(theme), undefined, { paddingX: 0 });"], newConstructor, "pi-side-chat canonical editor constructor");
  const oldApiKeyResolver = `      getApiKey: async (provider) => {
        const key = await modelRegistry.getApiKeyForProvider(provider);
        if (!key) throw new Error("No API key available");
        return key;
      },`;
  const newApiKeyResolver = `      getApiKey: async (model) => {
        const key = await modelRegistry.getApiKey(model);
        if (!key) throw new Error("No API key available");
        return key;
      },`;
  r = replaceAny(out, [oldApiKeyResolver, newApiKeyResolver], newApiKeyResolver, "pi-side-chat use model-specific API key");
  out = r.content;
  const editorTheme = String.raw`function getSideChatEditorTheme(theme: Theme) {
  const asciiBox = { topLeft: "+", topRight: "+", bottomLeft: "+", bottomRight: "+", horizontal: "-", vertical: "|", cross: "+", teeDown: "+", teeUp: "+", teeLeft: "+", teeRight: "+" };
  const box = theme.boxRound ?? asciiBox;
  const symbols = {
    cursor: theme.nav?.cursor ?? ">",
    inputCursor: "▏",
    boxRound: box,
    boxSharp: theme.boxSharp ?? box,
    table: theme.boxSharp ?? box,
    quoteBorder: theme.md?.quoteBorder ?? "|",
    hrChar: theme.md?.hrChar ?? "-",
    colorSwatch: theme.md?.colorSwatch ?? "[]",
    spinnerFrames: theme.getSpinnerFrames?.("activity") ?? ["-", "\\\\", "|", "/"],
  };
  const selectList = { ...getSelectListTheme(), symbols, hovered: (text: string) => theme.bg?.("selectedBg", text) ?? text };
  return { borderColor: (text: string) => theme.fg("borderMuted", text), selectList, symbols, hintStyle: (text: string) => theme.fg("dim", text) };
}

`;
  if (!out.includes("function getSideChatEditorTheme(theme: Theme)")) {
    r = replaceAny(out, ["export interface ForkContext {"], editorTheme + "export interface ForkContext {", "pi-side-chat editor theme adapter");
    out = r.content;
  }
  const oldBorderConstants = String.raw`    const borderColor = this._focused ? "border" : "borderMuted";
    const box = theme.boxRound;
    const topLeft = box.topLeft || " ";
    const topRight = box.topRight || " ";
    const bottomLeft = box.bottomLeft || " ";
    const bottomRight = box.bottomRight || " ";
    const teeLeft = box.teeLeft || " ";
    const teeRight = box.teeRight || " ";
    const horizontal = box.horizontal || " ";
    const vertical = box.vertical || " ";`;
  const currentBorderConstants = String.raw`    const borderColor = "borderAccent";
    const box = theme.boxRound;
    const topLeft = box.topLeft || "╭";
    const topRight = box.topRight || "╮";
    const bottomLeft = box.bottomLeft || "╰";
    const bottomRight = box.bottomRight || "╯";
    const horizontal = box.horizontal || "─";
    const teeLeft = box.teeLeft || "├";
    const teeRight = box.teeRight || "┤";
    const vertical = box.vertical || "│";`;
  const newBorderConstants = String.raw`    const borderColor = "statusLineContext";
    const box = theme.boxRound;
    const topLeft = box.topLeft || "╭";
    const topRight = box.topRight || "╮";
    const bottomLeft = box.bottomLeft || "╰";
    const bottomRight = box.bottomRight || "╯";
    const horizontal = box.horizontal?.trim() ? box.horizontal : "─";
    const teeLeft = "├";
    const teeRight = "┤";
    const vertical = box.vertical || "│";`;
  const whitespaceHorizontalBorderConstants = String.raw`    const borderColor = "statusLineContext";
    const box = theme.boxRound;
    const topLeft = box.topLeft || "╭";
    const topRight = box.topRight || "╮";
    const bottomLeft = box.bottomLeft || "╰";
    const bottomRight = box.bottomRight || "╯";
    const horizontal = box.horizontal?.trim() ? box.horizontal : "─";
    const teeLeft = box.teeLeft || "├";
    const teeRight = box.teeRight || "┤";
    const vertical = box.vertical || "│";`;
  const duplicateBorderConstants = String.raw`    const borderColor = this._focused ? "border" : "borderMuted";
    const box = theme.boxRound;
    const topLeft = box.topLeft || " ";
    const topRight = box.topRight || " ";
    const bottomLeft = box.bottomLeft || " ";
    const bottomRight = box.bottomRight || " ";
    const horizontal = box.horizontal || " ";
    const teeLeft = box.vertical ? (box.teeLeft || " ") : " ";
    const teeRight = box.vertical ? (box.teeRight || " ") : " ";
    const box = theme.boxRound;
    const topLeft = box.topLeft || " ";
    const topRight = box.topRight || " ";
    const bottomLeft = box.bottomLeft || " ";
    const bottomRight = box.bottomRight || " ";
    const teeLeft = box.teeLeft || " ";
    const teeRight = box.teeRight || " ";
    const horizontal = box.horizontal || " ";
    const vertical = box.vertical || " ";`;
  r = replaceAny(out, [duplicateBorderConstants, oldBorderConstants, currentBorderConstants, whitespaceHorizontalBorderConstants, newBorderConstants], newBorderConstants, "pi-side-chat tmux popup frame symbols");
  out = r.content;
  const oldHorizontal = '    const horizontal = box.horizontal || "─";';
  const newHorizontal = '    const horizontal = box.horizontal?.trim() ? box.horizontal : "─";';
  r = replaceAny(out, [oldHorizontal, newHorizontal], newHorizontal, "pi-side-chat visible horizontal frame symbols");
  out = r.content;
  const oldTeeLeft = '    const teeLeft = box.teeLeft || "├";';
  const newTeeLeft = '    const teeLeft = "├";';
  r = replaceAny(out, [oldTeeLeft, newTeeLeft], newTeeLeft, "pi-side-chat inward left dividers");
  out = r.content;
  const oldTeeRight = '    const teeRight = box.teeRight || "┤";';
  const newTeeRight = '    const teeRight = "┤";';
  r = replaceAny(out, [oldTeeRight, newTeeRight], newTeeRight, "pi-side-chat inward right dividers");
  out = r.content;
  const oldTop = '    lines.push(theme.fg(borderColor, "┌" + "─".repeat(width - 2) + "┐"));';
  const newTop = "    lines.push(theme.fg(borderColor, topLeft + horizontal.repeat(Math.max(0, width - 2)) + topRight));";
  r = replaceAny(out, [oldTop, newTop], newTop, "pi-side-chat Nord top frame");
  out = r.content;
  const oldDivider = '    lines.push(theme.fg(borderColor, "├" + "─".repeat(width - 2) + "┤"));';
  const newDivider = "    lines.push(theme.fg(borderColor, teeLeft + horizontal.repeat(Math.max(0, width - 2)) + teeRight));";
  const dividerCount = out.split(oldDivider).length - 1;
  if (dividerCount === 3) out = out.split(oldDivider).join(newDivider);
  else if (dividerCount !== 0) throw new Error(`Patch 'pi-side-chat Nord dividers' expected three old dividers, found ${dividerCount}.`);
  const oldBottom = '    lines.push(theme.fg(borderColor, "└" + "─".repeat(width - 2) + "┘"));';
  const newBottom = "    lines.push(theme.fg(borderColor, bottomLeft + horizontal.repeat(Math.max(0, width - 2)) + bottomRight));";
  r = replaceAny(out, [oldBottom, newBottom], newBottom, "pi-side-chat Nord bottom frame");
  out = r.content;
  const oldFrameLine = '    return theme.fg(borderColor, "│ ") + truncateToWidth(line, width, "...", true) + theme.fg(borderColor, " │");';
  const previousFrameLine = '    const frameVertical = theme.boxRound.vertical || " ";\n    return theme.fg(borderColor, frameVertical + " ") + truncateToWidth(line, width, "...", true) + theme.fg(borderColor, " " + frameVertical);';
  const newFrameLine = '    const frameVertical = theme.boxRound.vertical || "│";\n    return theme.fg(borderColor, frameVertical + " ") + truncateToWidth(line, width, "...", true) + theme.fg(borderColor, " " + frameVertical);';
  r = replaceAny(out, [oldFrameLine, previousFrameLine, newFrameLine], newFrameLine, "pi-side-chat tmux popup frame lines");
  out = r.content;
  const oldMaxLines = '    const maxLines = Math.max(3, Math.floor(this.options.tui.terminal.rows * 0.35) - 10);';
  const newMaxLines = '    const maxLines = Math.max(3, Math.floor(this.options.tui.terminal.rows * 0.9) - 12);';
  if (out.includes(oldMaxLines) || out.includes(newMaxLines)) {
    r = replaceAny(out, [oldMaxLines, newMaxLines], newMaxLines, "pi-side-chat tmux popup height");
    out = r.content;
  }
  const currentPopupBody = [
    '    const title = "Side Chat";',
    '    const focusHint = this._focused ? "" : " (unfocused)";',
    '    const mainLabel = tracker.writeCount ? `${tracker.writeCount} file${tracker.writeCount > 1 ? "s" : ""}` : "idle";',
    '    const modeLabel = this.toolMode === "full" ? "Edit" : "Read-only";',
    '    const modeColor = this.toolMode === "full" ? "warning" : "dim";',
    '    const status = theme.fg("dim", `[Main: ${mainLabel}] `) + theme.fg(modeColor, `[${modeLabel}]`);',
    '    const stream = this.isStreaming ? theme.fg("warning", " ●") : "";',
    '    const left = theme.fg(this._focused ? "accent" : "dim", title) + theme.fg("dim", focusHint) + stream;',
    '    const leftWidth = Math.max(1, innerWidth - visibleWidth(status) - 1);',
    '    const headerLeft = truncateToWidth(left, leftWidth);',
    '    const headerGap = " ".repeat(Math.max(1, innerWidth - visibleWidth(headerLeft) - visibleWidth(status)));',
    '',
    '    lines.push(theme.fg(borderColor, topLeft + horizontal.repeat(Math.max(0, width - 2)) + topRight));',
    '    lines.push(this.frameLine(`${headerLeft}${headerGap}${status}`, innerWidth, theme, borderColor));',
    '    lines.push(theme.fg(borderColor, teeLeft + horizontal.repeat(Math.max(0, width - 2)) + teeRight));',
    '',
    '    const maxLines = Math.max(3, Math.floor(this.options.tui.terminal.rows * 0.9) - 12);',
    '    this.messages.setMaxVisibleLines(maxLines);',
    '    const msgLines = this.messages.render(innerWidth);',
    '    for (const line of msgLines) lines.push(this.frameLine(line, innerWidth, theme, borderColor));',
    '    for (let i = msgLines.length; i < maxLines; i++) lines.push(this.frameLine("", innerWidth, theme, borderColor));',
    '',
    '    lines.push(theme.fg(borderColor, teeLeft + horizontal.repeat(Math.max(0, width - 2)) + teeRight));',
    '    for (const line of this.editor.render(innerWidth)) {',
    '      lines.push(this.frameLine(line, innerWidth, theme, borderColor));',
    '    }',
    '',
    '    const displayShortcuts = (this.options.shortcuts ?? [this.options.shortcut]).filter((shortcut) => shortcut !== "ctrl+shift+;" || !(this.options.shortcuts ?? []).includes("ctrl+;"));',
    '    const shortcutLabel = displayShortcuts.map((shortcut) => shortcut.replace(/ctrl/i, "Ctrl").replace(/shift/i, "Shift").replace(/alt/i, "Alt")).join("/");',
    '    const escHint = this.isStreaming ? "Esc stop" : "Esc close";',
    '    const modeHint = this.toolMode === "read-only" ? "Ctrl+T → edit mode" : "Ctrl+T → read-only";',
    '    const hints = this._focused',
    '      ? `${escHint} · Enter send · Alt+R refork · Alt+N clear · ${shortcutLabel} → unfocus · ${modeHint}`',
    '      : `${shortcutLabel} → focus side chat`;',
    '    lines.push(theme.fg(borderColor, teeLeft + horizontal.repeat(Math.max(0, width - 2)) + teeRight));',
    '    lines.push(this.frameLine(theme.fg("dim", hints), innerWidth, theme, borderColor));',
    '    lines.push(theme.fg(borderColor, bottomLeft + horizontal.repeat(Math.max(0, width - 2)) + bottomRight));',
  ].join("\n");
  const currentClosePopupBody = currentPopupBody
    .replace('${shortcutLabel} → unfocus', '${shortcutLabel} close')
    .replace('${shortcutLabel} → focus side chat', '${shortcutLabel} close');
  const previousTmuxPopupBody = [
    '    lines.push(theme.fg(borderColor, topLeft + horizontal.repeat(Math.max(0, width - 2)) + topRight));',
    '    const targetHeight = Math.max(3, Math.floor(this.options.tui.terminal.rows * 0.9));',
    '    const contentRows = Math.max(1, targetHeight - 2);',
    '    const editorLines = this.editor.render(innerWidth);',
    '    const maxMessageLines = Math.max(1, contentRows - editorLines.length);',
    '    this.messages.setMaxVisibleLines(maxMessageLines);',
    '    const msgLines = this.messages.render(innerWidth).slice(0, maxMessageLines);',
    '    for (const line of msgLines) lines.push(this.frameLine(line, innerWidth, theme, borderColor));',
    '    for (let i = msgLines.length; i < maxMessageLines; i++) lines.push(this.frameLine("", innerWidth, theme, borderColor));',
    '    for (const line of editorLines) lines.push(this.frameLine(line, innerWidth, theme, borderColor));',
    '    while (lines.length < targetHeight - 1) lines.push(this.frameLine("", innerWidth, theme, borderColor));',
    '    lines.push(theme.fg(borderColor, bottomLeft + horizontal.repeat(Math.max(0, width - 2)) + bottomRight));',
  ].join("\n");
  const tmuxPopupBody = [
    '    lines.push(theme.fg(borderColor, topLeft + horizontal.repeat(Math.max(0, width - 2)) + topRight));',
    '    const targetHeight = Math.max(3, Math.floor(this.options.tui.terminal.rows * 0.9));',
    '    const contentRows = Math.max(1, targetHeight - 2);',
    '    const editorLines = this.editor.render(innerWidth);',
    '    const maxMessageLines = Math.max(1, contentRows - editorLines.length);',
    '    for (const line of editorLines) lines.push(this.frameLine(line, innerWidth, theme, borderColor));',
    '    this.messages.setMaxVisibleLines(maxMessageLines);',
    '    const msgLines = this.messages.render(innerWidth).slice(0, maxMessageLines);',
    '    for (const line of msgLines) lines.push(this.frameLine(line, innerWidth, theme, borderColor));',
    '    while (lines.length < targetHeight - 1) lines.push(this.frameLine("", innerWidth, theme, borderColor));',
    '    lines.push(theme.fg(borderColor, bottomLeft + horizontal.repeat(Math.max(0, width - 2)) + bottomRight));',
  ].join("\n");
  r = replaceAny(out, [currentPopupBody, currentClosePopupBody, previousTmuxPopupBody, tmuxPopupBody], currentPopupBody, "pi-side-chat tmux popup body");
  out = r.content;
  r = replaceAny(out, ["  shortcut: string;", "  shortcut: string;\n  shortcuts?: string[];"], "  shortcut: string;\n  shortcuts?: string[];", "pi-side-chat overlay shortcuts option");
  out = r.content;
  const oldShortcutLabel = '    const shortcutLabel = this.options.shortcut.replace(/ctrl/i, "Ctrl").replace(/shift/i, "Shift").replace(/alt/i, "Alt");';
  const previousShortcutLabel = '    const shortcutLabel = (this.options.shortcuts ?? [this.options.shortcut]).map((shortcut) => shortcut.replace(/ctrl/i, "Ctrl").replace(/shift/i, "Shift").replace(/alt/i, "Alt")).join("/");';
  const newShortcutLabel = '    const displayShortcuts = (this.options.shortcuts ?? [this.options.shortcut]).filter((shortcut) => shortcut !== "ctrl+shift+;" || !(this.options.shortcuts ?? []).includes("ctrl+;"));\n    const shortcutLabel = displayShortcuts.map((shortcut) => shortcut.replace(/ctrl/i, "Ctrl").replace(/shift/i, "Shift").replace(/alt/i, "Alt")).join("/");';
  const oldShortcutInput = '    if (matchesKey(data, this.options.shortcut)) { this.options.onUnfocus(); return; }';
  const previousShortcutInput = '    if ((this.options.shortcuts ?? [this.options.shortcut]).some((shortcut) => matchesKey(data, shortcut))) { this.options.onUnfocus(); return; }';
  const closeShortcutInput = '    if ((this.options.shortcuts ?? [this.options.shortcut]).some((shortcut) => matchesKey(data, shortcut))) { this.dispose(); return; }';
  const requestRenderShortcutInput = '    if ((this.options.shortcuts ?? [this.options.shortcut]).some((shortcut) => matchesKey(data, shortcut))) { this.options.onUnfocus(); this.options.tui.requestRender(); return; }';
  const renderUnfocusShortcutInput = '    if ((this.options.shortcuts ?? [this.options.shortcut]).some((shortcut) => matchesKey(data, shortcut))) { this.focused = false; this.options.onUnfocus(); this.options.tui.requestRender(); return; }';
  r = replaceAny(out, [oldShortcutInput, previousShortcutInput, closeShortcutInput, requestRenderShortcutInput, renderUnfocusShortcutInput], renderUnfocusShortcutInput, "pi-side-chat shortcut unfocuses overlay");
  out = r.content;
  const previousShortcutHints = '    const hints = this._focused\n      ? `${escHint} · Enter send · Alt+R refork · Alt+N clear · ${shortcutLabel} → unfocus · ${modeHint}`\n      : `${shortcutLabel} → focus side chat`;';
  const closeShortcutHints = '    const hints = this._focused\n      ? `${escHint} · Enter send · Alt+R refork · Alt+N clear · ${shortcutLabel} close · ${modeHint}`\n      : `${shortcutLabel} close`;';
  r = replaceAny(out, [previousShortcutHints, closeShortcutHints], previousShortcutHints, "pi-side-chat shortcut hint focuses");
  out = r.content;
  r = replaceAny(out, ["    this.messages.setMessages(forkedMessages);", "    this.messages.setMessages([]);"], "    this.messages.setMessages([]);", "pi-side-chat blank visual history");
  return r.content;
}

export function patchPiSideChatIndex(content, { replaceAny }) {
      let out = replaceAny(
        content,
        [
          `            width: "85%",
            maxHeight: "35%",
            anchor: "top-center",
            margin: { top: 1, left: 2, right: 2 },`,
          `            width: "95%",
            maxHeight: "90%",
            anchor: "center",`,
          `            width: "95%",
            maxHeight: "90%",
            anchor: "center",
            margin: 0,`,
          `            width: "95%",
            maxHeight: "90%",
            anchor: "top-center",
            margin: 0,`,
          `            width: "100%",
            maxHeight: "90%",
            anchor: "top-center",
            margin: 0,`,
        ],
        `            width: "100%",
            maxHeight: "90%",
            anchor: "top-center",
            margin: 0,`,
        "pi-side-chat tmux popup geometry",
      ).content;
      const duplicatePopupMargin = `            width: "100%",
            maxHeight: "90%",
            anchor: "top-center",
            margin: 0,
            margin: 0,`;
      const singlePopupMargin = `            width: "100%",
            maxHeight: "90%",
            anchor: "top-center",
            margin: 0,`;
      out = out.replace(duplicatePopupMargin, singlePopupMargin);
      out = replaceAny(
        out,
        [
          `function loadConfig(): { shortcut: string } {
  const configPath = join(dirname(fileURLToPath(import.meta.url)), "config.json");
  try {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    const shortcut = typeof config.shortcut === "string" ? config.shortcut.trim() : "";
    return { shortcut: shortcut || DEFAULT_SHORTCUT };
  } catch {
    return { shortcut: DEFAULT_SHORTCUT };
  }
}`,
          `function loadConfig(): { shortcut: string; shortcuts: string[] } {
  const configPath = join(dirname(fileURLToPath(import.meta.url)), "config.json");
  try {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    const primary = typeof config.shortcut === "string" ? config.shortcut.trim() : "";
    const extra = Array.isArray(config.shortcuts) ? config.shortcuts.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter(Boolean) : [];
    const shortcuts = [...new Set([primary || DEFAULT_SHORTCUT, ...extra])];
    return { shortcut: shortcuts[0]!, shortcuts };
  } catch {
    return { shortcut: DEFAULT_SHORTCUT, shortcuts: [DEFAULT_SHORTCUT] };
  }
}`,
        ],
        `function loadConfig(): { shortcut: string; shortcuts: string[] } {
  const configPath = join(dirname(fileURLToPath(import.meta.url)), "config.json");
  try {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    const primary = typeof config.shortcut === "string" ? config.shortcut.trim() : "";
    const extra = Array.isArray(config.shortcuts) ? config.shortcuts.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter(Boolean) : [];
    const aliases = extra.includes("ctrl+;") ? ["ctrl+shift+;"] : [];
    const shortcuts = [...new Set([primary || DEFAULT_SHORTCUT, ...extra, ...aliases])];
    return { shortcut: shortcuts[0]!, shortcuts };
  } catch {
    return { shortcut: DEFAULT_SHORTCUT, shortcuts: [DEFAULT_SHORTCUT] };
  }
}`,
        "pi-side-chat multiple shortcuts config",
      ).content;
      out = replaceAny(
        out,
        [
          `            shortcut: config.shortcut,`,
          `            shortcut: config.shortcut,
            shortcuts: config.shortcuts,`,
        ],
        `            shortcut: config.shortcut,
            shortcuts: config.shortcuts,`,
        "pi-side-chat pass multiple shortcuts to overlay",
      ).content;
      out = replaceAny(
        out,
        [
          `  const toggleSideChat = async (ctx: ExtensionContext) => {
    if (activeOverlay) {
      if (overlayHandle?.isFocused()) {
        overlayHandle.unfocus();
      } else {
        overlayHandle?.focus();
      }
      return;
    }
    return openSideChat(ctx);
  };`,
          `  const toggleSideChat = async (ctx: ExtensionContext) => {
    if (activeOverlay) {
      activeOverlay.dispose();
      return;
    }
    return openSideChat(ctx);
  };`,
          `  const toggleSideChat = async (ctx: ExtensionContext) => {
    if (activeOverlay) {
      if (overlayHandle?.isFocused()) {
        activeOverlay.focused = false;
        overlayHandle.unfocus();
      } else {
        activeOverlay.focused = true;
        overlayHandle?.focus();
      }
      return;
    }
    return openSideChat(ctx);
  };`,
        ],
        `  const toggleSideChat = async (ctx: ExtensionContext) => {
    if (activeOverlay) {
      if (overlayHandle?.isFocused()) {
        activeOverlay.focused = false;
        overlayHandle.unfocus();
      } else {
        activeOverlay.focused = true;
        overlayHandle?.focus();
      }
      return;
    }
    return openSideChat(ctx);
  };`,
        "pi-side-chat shortcut toggles focus",
      ).content;
      return replaceAny(
        out,
        [
          `  pi.registerShortcut(config.shortcut, {
    description: "Toggle side chat focus (open if closed)",
    handler: toggleSideChat,
  });`,
        ],
        `  for (const shortcut of config.shortcuts) {
    pi.registerShortcut(shortcut, {
      description: "Toggle side chat focus (open if closed)",
      handler: toggleSideChat,
    });
  }`,
        "pi-side-chat register multiple shortcuts",
      ).content;
  }

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
    return replaceAny(
      content,
      [
        `\tif (terminalId === "vscode" || terminalId === "alacritty") return null;\n\tconst term = env.TERM?.toLowerCase() ?? "";\n\tif (term.includes("screen") || term.includes("tmux") || term.includes("ghostty")) {\n\t\treturn ImageProtocol.Kitty;\n\t}\n\treturn null;`,
        `\tif (terminalId === "vscode" || terminalId === "alacritty") return null;\n\tconst term = env.TERM?.toLowerCase() ?? "";\n\tif (env.TMUX && term.includes("xterm-kitty")) return ImageProtocol.Kitty;\n\tif (term.includes("screen") || term.includes("tmux") || term.includes("ghostty")) {\n\t\treturn ImageProtocol.Kitty;\n\t}\n\treturn null;`,
      ],
      `\tconst term = env.TERM?.toLowerCase() ?? "";\n\tif (env.TMUX && term.includes("xterm-kitty")) return ImageProtocol.Kitty;\n\tif (terminalId === "vscode" || terminalId === "alacritty") return null;\n\tif (term.includes("screen") || term.includes("tmux") || term.includes("ghostty")) {\n\t\treturn ImageProtocol.Kitty;\n\t}\n\treturn null;`,
      "tmux xterm-kitty image protocol fallback before terminal exclusion",
    ).content;
  }

  function patchTuiKittyGraphics(content) {
    return replaceAny(
      content,
      [
        `\tif (env.TMUX && env.PI_FORCE_IMAGE_PROTOCOL?.trim().toLowerCase() === "kitty") return true;`,
        `\tif (env.TMUX && (env.PI_FORCE_IMAGE_PROTOCOL?.trim().toLowerCase() === "kitty" || env.TERM?.toLowerCase().includes("xterm-kitty"))) return true;`,
        `\tif (insideMultiplexer && env.PI_FORCE_IMAGE_PROTOCOL?.trim().toLowerCase() === "kitty") return true;`,
        `\tif (insideMultiplexer && (env.PI_FORCE_IMAGE_PROTOCOL?.trim().toLowerCase() === "kitty" || env.TERM?.toLowerCase().includes("xterm-kitty"))) return true;`,
      ],
      `\tif (insideMultiplexer && (env.PI_FORCE_IMAGE_PROTOCOL?.trim().toLowerCase() === "kitty" || env.TERM?.toLowerCase().includes("xterm-kitty"))) return true;`,
      "tmux xterm-kitty kitty placeholder support",
    ).content;
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

  function patchSettingsSchemaAttachmentPreview(content) {
    return replaceAny(
      content,
      [
        `	"images.blockImages": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "Images",
			label: "Block Images",
			description: "Prevent images from being sent to LLM providers",
		},
	},`,
        `	"images.attachmentPreviewWidth": {
		type: "number",
		default: 12,
		ui: {
			tab: "appearance",
			group: "Images",
			label: "Attachment Preview Width",
			description: "Maximum inline attachment thumbnail width in terminal cells",
		},
	},

	"images.attachmentPreviewHeight": {
		type: "number",
		default: 4,
		ui: {
			tab: "appearance",
			group: "Images",
			label: "Attachment Preview Height",
			description: "Maximum inline attachment thumbnail height in terminal rows",
		},
	},

	"images.blockImages": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "Images",
			label: "Block Images",
			description: "Prevent images from being sent to LLM providers",
		},
	},`,
      ],
      `	"images.attachmentPreviewWidth": {
		type: "number",
		default: 12,
		ui: {
			tab: "appearance",
			group: "Images",
			label: "Attachment Preview Width",
			description: "Maximum inline attachment thumbnail width in terminal cells",
		},
	},

	"images.attachmentPreviewHeight": {
		type: "number",
		default: 4,
		ui: {
			tab: "appearance",
			group: "Images",
			label: "Attachment Preview Height",
			description: "Maximum inline attachment thumbnail height in terminal rows",
		},
	},

	"images.blockImages": {
		type: "boolean",
		default: false,
		ui: {
			tab: "appearance",
			group: "Images",
			label: "Block Images",
			description: "Prevent images from being sent to LLM providers",
		},
	},`,
      "attachment preview size settings schema",
    ).content;
  }

  function patchAttachmentChips(content) {
    let out = content;
    out = replaceAny(
      out,
      [
        `import { convertImageToPng } from "../../utils/image-loading";`,
        `import { settings } from "../../config/settings";
import { convertImageToPng } from "../../utils/image-loading";`,
      ],
      `import { settings } from "../../config/settings";
import { convertImageToPng } from "../../utils/image-loading";`,
      "attachment chips can read preview size settings",
    ).content;
    out = replaceAny(
      out,
      [
        `const INNER_COLS = 12;
const INNER_ROWS = 4;
const CARD_COLS = INNER_COLS + 2;
const CARD_GAP = 2;`,
        `let INNER_COLS = 12;
let INNER_ROWS = 4;
let CARD_COLS = INNER_COLS + 2;
const CARD_GAP = 2;

function clampPreviewSize(value: number | undefined, fallback: number, min: number, max: number): number {
	if (!Number.isFinite(value)) return fallback;
	return Math.max(min, Math.min(max, Math.floor(value!)));
}`,
      ],
      `let INNER_COLS = 12;
let INNER_ROWS = 4;
let CARD_COLS = INNER_COLS + 2;
const CARD_GAP = 2;

function clampPreviewSize(value: number | undefined, fallback: number, min: number, max: number): number {
	if (!Number.isFinite(value)) return fallback;
	return Math.max(min, Math.min(max, Math.floor(value!)));
}`,
      "attachment preview geometry is configurable",
    ).content;
    out = replaceAny(
      out,
      [
        `	constructor(
		private readonly editor: CustomEditor,
		private readonly budget: ImageBudget,
		private readonly requestRender: () => void,
	) {}`,
        `	constructor(
		private readonly editor: CustomEditor,
		private readonly budget: ImageBudget,
		private readonly requestRender: () => void,
	) {
		INNER_COLS = clampPreviewSize(settings.get("images.attachmentPreviewWidth"), 12, 4, 80);
		INNER_ROWS = clampPreviewSize(settings.get("images.attachmentPreviewHeight"), 4, 1, 30);
		CARD_COLS = INNER_COLS + 2;
	}`,
      ],
      `	constructor(
		private readonly editor: CustomEditor,
		private readonly budget: ImageBudget,
		private readonly requestRender: () => void,
	) {
		INNER_COLS = clampPreviewSize(settings.get("images.attachmentPreviewWidth"), 12, 4, 80);
		INNER_ROWS = clampPreviewSize(settings.get("images.attachmentPreviewHeight"), 4, 1, 30);
		CARD_COLS = INNER_COLS + 2;
	}`,
      "attachment preview geometry reads settings",
    ).content;
    out = replaceAny(
      out,
      [
        `		const rows = ["", "", "", "", "", ""];`,
        `		const rows = Array.from({ length: INNER_ROWS + 2 }, () => "");`,
      ],
      `		const rows = Array.from({ length: INNER_ROWS + 2 }, () => "");`,
      "attachment chip rows follow preview height",
    ).content;
    out = replaceAny(
      out,
      [
        `		if (chip.kind === "image") {
			const dims = this.#imageDims(chip.image);
			bottomCaption = dims ? \`\${dims.width}x\${dims.height}\` : "";
			interior = this.#imageInterior(chip.image, dims);
		} else {`,
        `		if (chip.kind === "image") {
			const dims = this.#imageDims(chip.image);
			return ["", ...this.#imageInterior(chip.image, dims), ""];
		} else {`,
        `		if (chip.kind !== "paste") {
			const dims = this.#imageDims(chip.image);
			bottomCaption = dims ? \`\${dims.width}x\${dims.height}\` : "";
			interior = this.#imageInterior(chip.image, dims, chip.kind);
		} else {`,
      ],
      `		if (chip.kind !== "paste") {
			const dims = this.#imageDims(chip.image);
			return ["", ...this.#imageInterior(chip.image, dims, chip.kind), ""];
		} else {`,
      "attachment image chips without border fallback lines",
    ).content;
    out = replaceAny(
      out,
      [
        `			for (let r = 0; r < rows.length; r++) rows[r] += (x > 0 ? gap : "") + card[r];`,
        `			for (let r = 0; r < rows.length; r++) rows[r] += (x > 0 ? gap : "") + (card[r] ?? " ".repeat(CARD_COLS));`,
      ],
      `			for (let r = 0; r < rows.length; r++) rows[r] += (x > 0 ? gap : "") + (card[r] ?? " ".repeat(CARD_COLS));`,
      "attachment chip render pads missing rows",
    ).content;
    out = replaceAny(
      out,
      [
        `			if (!budget.observe(imageId)) {
				const result = renderImage(
					image.data,
					{ widthPx: dims.width, heightPx: dims.height },
					{
						maxWidthCells: INNER_COLS,
						maxHeightCells: INNER_ROWS,
						imageId,
						includeTransmit: budget.shouldTransmit(imageId),
					},
				);
				if (result?.transmit) budget.enqueueTransmit(imageId, result.transmit);
				if (result?.lines) return this.#centerGrid(result.lines);
			}`,
        `				if (!budget.observe(imageId)) {
					const result = renderImage(
						display.data,
						{ widthPx: dims.width, heightPx: dims.height },
						{
							maxWidthCells: INNER_COLS,
							maxHeightCells: INNER_ROWS,
							imageId,
							includeTransmit: budget.shouldTransmit(imageId),
						},
					);
					if (result?.transmit) budget.enqueueTransmit(imageId, result.transmit);
					if (result?.lines) return this.#centerGrid(result.lines);
				}`,
        `				budget.observe(imageId);
				const result = renderImage(
					display.data,
					{ widthPx: dims.width, heightPx: dims.height },
					{
						maxWidthCells: INNER_COLS,
						maxHeightCells: INNER_ROWS,
						imageId,
						includeTransmit: budget.shouldTransmit(imageId),
					},
				);
				if (result?.transmit) budget.enqueueTransmit(imageId, result.transmit);
				if (result?.lines) return this.#centerGrid(result.lines);`,
      ],
      `				budget.observe(imageId);
				const result = renderImage(
					display.data,
					{ widthPx: dims.width, heightPx: dims.height },
					{
						maxWidthCells: INNER_COLS,
						maxHeightCells: INNER_ROWS,
						imageId,
						includeTransmit: budget.shouldTransmit(imageId),
					},
				);
				if (result?.transmit) budget.enqueueTransmit(imageId, result.transmit);
				if (result?.lines) return this.#centerGrid(result.lines);`,
      "attachment image chips are not budget-demoted",
    ).content;
    return out;
  }

  /**
   * Russian (ЙЦУКЕН) layout support for the Vim state machine: map Cyrillic input to the Latin
   * key at the same physical keyboard position, so motions/operators work while the host layout
   * is Russian. Anything the state machine declines (or Insert-mode typing) is untouched.
   */
  function patchVimRuLayout(content) {
    let out = content;
    let r;

    const translitTable = `const RU_LAYOUT_TO_LATIN: Record<string, string> = {
	"й": "q", "ц": "w", "у": "e", "к": "r", "е": "t", "н": "y", "г": "u", "ш": "i", "щ": "o", "з": "p", "х": "[", "ъ": "]",
	"ф": "a", "ы": "s", "в": "d", "а": "f", "п": "g", "р": "h", "о": "j", "л": "k", "д": "l", "ж": ";", "э": "'",
	"я": "z", "ч": "x", "с": "c", "м": "v", "и": "b", "т": "n", "ь": "m", "б": ",", "ю": ".",
	"Й": "Q", "Ц": "W", "У": "E", "К": "R", "Е": "T", "Н": "Y", "Г": "U", "Ш": "I", "Щ": "O", "З": "P", "Х": "{", "Ъ": "}",
	"Ф": "A", "Ы": "S", "В": "D", "А": "F", "П": "G", "Р": "H", "О": "J", "Л": "K", "Д": "L", "Ж": ":", "Э": "\\"",
	"Я": "Z", "Ч": "X", "С": "C", "М": "V", "И": "B", "Т": "N", "Ь": "M", "Б": "<", "Ю": ">",
	"ё": "\`", "Ё": "~",
};`;

    r = replaceOnce(
      out,
      `export class VimState {`,
      `${translitTable}\nexport class VimState {`,
      "vim RU layout translation table",
    );
    out = r.content;

    r = replaceOnce(
      out,
      `\thandleKey(key: string, buf: VimBuffer): VimCommand[] | null {\n\t\tif (key === "escape") return this.#handleEscape(buf);\n\t\tif (this.mode === "insert") return null;`,
      `\thandleKey(key: string, buf: VimBuffer): VimCommand[] | null {\n\t\tif (key === "escape") return this.#handleEscape(buf);\n\t\tif (this.mode === "insert") return null;\n\n\t\t// Russian (ЙЦУКЕН) layout: map the key to the Latin one at the same physical position\n\t\t// (р→h, о→j, в→d, …) so the motions/operators below keep working while the host layout\n\t\t// is Russian. Insert mode returned above, so typing real Russian text is never rewritten.\n\t\tkey = RU_LAYOUT_TO_LATIN[key] ?? key;`,
      "vim handleKey RU layout translation",
    );
    out = r.content;

    return out;
  }

  /**
   * User's Neovim register scheme: plain deletes (`x X c C dd d D`) go to the black hole (`"_` —
   * no copy into the paste register), while `m`/`mm`/`M` are the explicit cut (delete AND store,
   * like stock `c`), and `p` pastes only what was yanked/cut. Adds a `yank` flag to the delete
   * command and a new `m` operator (change with yank).
   */
  function patchVimCutRegisters(content) {
    let out = content;
    let r;

    r = replaceOnce(
      out,
      `export type VimOperator = "d" | "y" | "c";`,
      `export type VimOperator = "d" | "y" | "c" | "m";`,
      "vim operator type + m",
    );
    out = r.content;

    r = replaceOnce(
      out,
      `	| { kind: "delete"; from: VimPosition; to: VimPosition; linewise: boolean; insert: boolean }`,
      `	| { kind: "delete"; from: VimPosition; to: VimPosition; linewise: boolean; insert: boolean; yank: boolean }`,
      "vim delete command yank field",
    );
    out = r.content;

    // Normal-mode `x`: black-hole delete.
    r = replaceOnce(
      out,
      `				return [
					{
						kind: "delete",
						from: { line: buf.cursorLine, col: buf.cursorCol },
						to: { line: buf.cursorLine, col },
						linewise: false,
						insert: false,
					},
				];`,
      `				return [
					{
						kind: "delete",
						from: { line: buf.cursorLine, col: buf.cursorCol },
						to: { line: buf.cursorLine, col },
						linewise: false,
						insert: false,
						yank: false,
					},
				];`,
      "vim x black-hole delete",
    );
    out = r.content;

    // `M` = cut to end of line (like `C` but with yank).
    r = replaceOnce(
      out,
      `			case "D":
			case "C": {
				// Like Vim, \`D\`/\`C\` take a count: \`2D\` deletes to the end of the next line, not just
				// this one (\`:h D\` — "and [count]-1 more lines").
				const span = this.#takeCount();
				const last = Math.min(buf.cursorLine + span - 1, buf.lines.length - 1);
				return this.#operate(
					key === "C" ? "c" : "d",`,
      `			case "D":
			case "C":
			case "M": {
				// Like Vim, \`D\`/\`C\` take a count: \`2D\` deletes to the end of the next line, not just
				// this one (\`:h D\` — "and [count]-1 more lines").
				const span = this.#takeCount();
				const last = Math.min(buf.cursorLine + span - 1, buf.lines.length - 1);
				return this.#operate(
					key === "C" ? "c" : key === "M" ? "m" : "d",`,
      "vim M cut to end of line",
    );
    out = r.content;

    // Add `m` as a motion-waiting operator (doubled `mm` = linewise cut).
    r = replaceOnce(
      out,
      `			case "d":
			case "y":
			case "c":
				// A doubled operator (\`dd\`, \`yy\`, \`cc\`) is linewise over \`count\` lines.`,
      `			case "d":
			case "y":
			case "c":
			case "m":
				// A doubled operator (\`dd\`, \`yy\`, \`cc\`, \`mm\`) is linewise over \`count\` lines.`,
      "vim m operator",
    );
    out = r.content;

    // `#operate`: d → delete without yank, c → change without yank, m → change WITH yank.
    r = replaceOnce(
      out,
      `		if (operator !== "c") {
			return [{ kind: "delete", from, to, linewise, insert: false }];
		}
		// \`c\` always lands in Insert mode. The leading move matters when the range is empty
		// (\`ci"\` between bare quotes): the delete is a no-op, so nothing else would park the cursor.
		// \`cc\`/\`cj\` clear the lines but keep them, so a linewise change stays linewise-shaped.
		this.mode = "insert";
		return [
			{ kind: "move", to: from },
			{ kind: "delete", from, to, linewise: false, insert: true },
			{ kind: "mode", mode: "insert" },
		];`,
      `		if (operator !== "c" && operator !== "m") {
			return [{ kind: "delete", from, to, linewise, insert: false, yank: false }];
		}
		// \`c\`/\`m\` always land in Insert mode. The leading move matters when the range is empty
		// (\`ci"\` between bare quotes): the delete is a no-op, so nothing else would park the cursor.
		// \`cc\`/\`cj\` clear the lines but keep them, so a linewise change stays linewise-shaped.
		// \`m\` is the user's explicit cut: unlike \`c\` it also stores the deleted text for \`p\`.
		this.mode = "insert";
		return [
			{ kind: "move", to: from },
			{ kind: "delete", from, to, linewise: false, insert: true, yank: operator === "m" },
			{ kind: "mode", mode: "insert" },
		];`,
      "vim operate yank flag",
    );
    out = r.content;

    // Visual mode: `d`/`x` black-hole, `m` cut.
    r = replaceOnce(
      out,
      `			case "y":
			case "d":
			case "x":
			case "c":
			case "s": {
				const operator: VimOperator = key === "y" ? "y" : key === "c" || key === "s" ? "c" : "d";`,
      `			case "y":
			case "d":
			case "x":
			case "c":
			case "s":
			case "m": {
				// \`d\`/\`x\` black-hole delete; \`c\`/\`s\`/\`m\` all yank the selection (stock \`c\` stores,
				// \`m\` is the explicit cut — same engine path), matching the user's Neovim config.
				const operator: VimOperator =
					key === "y" ? "y" : key === "d" || key === "x" ? "d" : "m";`,
      "vim visual m operator",
    );
    out = r.content;

    return out;
  }

  /**
   * Keep the editor's delete handler in sync with the `yank` flag: only store into the kill ring
   * (the paste register behind `p`) when the delete asked to — black-hole deletes must not clobber it.
   */
  function patchEditorVimKillRing(content) {
    let out = content;
    let r;

    r = replaceOnce(
      out,
      `				case "delete":
					this.#deleteVimRange(command.from, command.to, command.linewise);
					break;`,
      `				case "delete":
					this.#deleteVimRange(command.from, command.to, command.linewise, command.yank);
					break;`,
      "editor pass yank to deleteVimRange",
    );
    out = r.content;

    r = replaceOnce(
      out,
      `	#deleteVimRange(from: VimPosition, to: VimPosition, linewise: boolean): void {`,
      `	#deleteVimRange(from: VimPosition, to: VimPosition, linewise: boolean, yank = true): void {`,
      "editor deleteVimRange yank param",
    );
    out = r.content;

    r = replaceOnce(
      out,
      `			this.#recordUndoState();
			this.#killRing.push(\`\${removed}\\n\`, { prepend: false });`,
      `			this.#recordUndoState();
			if (yank) this.#killRing.push(\`\${removed}\\n\`, { prepend: false });`,
      "editor linewise kill ring condition",
    );
    out = r.content;

    r = replaceOnce(
      out,
      `		this.#recordUndoState();
		this.#killRing.push(removed, { prepend: false });`,
      `		this.#recordUndoState();
		if (yank) this.#killRing.push(removed, { prepend: false });`,
      "editor kill ring condition",
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
    patchSettingsSchemaAttachmentPreview,
    patchAttachmentChips,
    patchVimRuLayout,
    patchVimCutRegisters,
    patchEditorVimKillRing,
  };
}

/**
 * Restore `images.attachmentPreviewWidth/Height` for OMP 19.2's composer chips.
 *
 * 19.2 moved the attachment band out of @oh-my-pi/pi-tui's `AttachmentChipsBand`
 * (the old `patchAttachmentChipsGeometry` target) into:
 *   - src/ui/composer/chips.tsx        — builds each card; hardcoded 12ch x 4lines
 *   - src/ui/styles/composer/chips.ts  — paints the cards; hardcoded 12x4 cells
 * Both constants ignored the settings the registry still declares, so the
 * configured 64x20 previews collapsed to 12x4.
 */
export function createAttachmentPreviewPatches({ replaceAny }) {
  function patchComposerChipsPreviewSize(content) {
    let out = replaceAny(
      content,
      [`import type { ChipCardTerm } from "../styles/composer/chips";`],
      `import { attachmentPreviewSize, type ChipCardTerm } from "../styles/composer/chips";`,
      "composer chips import configured preview size",
    ).content;

    out = replaceAny(
      out,
      [
        `/** Lines of a text chip's preview. */
const PREVIEW_LINES = 4;`,
      ],
      `/** Text chip preview lines follow the configured card height. */`,
      "composer chips drop fixed preview lines",
    ).content;

    out = replaceAny(
      out,
      [
        `function card(atom: Atom & { kind: "paste" | "image" | "video" }, attachment?: CardAttachment): JSXNode {
	const link = attachment?.link;`,
      ],
      `function card(atom: Atom & { kind: "paste" | "image" | "video" }, attachment?: CardAttachment): JSXNode {
	const { cols, rows } = attachmentPreviewSize();
	const link = attachment?.link;`,
      "composer chips read configured preview size",
    ).content;

    out = replaceAny(
      out,
      [
        `					spans={[{ s: "muted", t: content.split("\\n", PREVIEW_LINES).join("\\n") }]}
					wrap="none"
					lines={PREVIEW_LINES}`,
      ],
      `					spans={[{ s: "muted", t: content.split("\\n", rows).join("\\n") }]}
					wrap="none"
					lines={rows}`,
      "text chip preview follows configured height",
    ).content;

    return replaceAny(
      out,
      [`					max={{ w: "12ch", h: "4lines" }}`],
      `					max={{ w: \`\${cols}ch\`, h: \`\${rows}lines\` }}`,
      "image chip preview follows configured size",
    ).content;
  }

  function patchComposerChipsPreviewStyle(content) {
    let out = replaceAny(
      content,
      [`import { fileLink } from "../tools/file-common";`],
      `import { fileLink } from "../tools/file-common";
import { isSettingsInitialized, settings } from "../../../config/settings";
import {
	cfgImagesAttachmentPreviewHeight,
	cfgImagesAttachmentPreviewWidth,
} from "../../../modes/settings";`,
      "composer chip style imports preview settings",
    ).content;

    out = replaceAny(
      out,
      [
        `const INNER_COLS = 12;
const INNER_ROWS = 4;
const CARD_GAP = 2;`,
      ],
      `let INNER_COLS = 12;
let INNER_ROWS = 4;
const CARD_GAP = 2;

/** Apply \`images.attachmentPreviewWidth/Height\` before painting; falls back to 12x4. */
function refreshPreviewSize(): void {
	if (!isSettingsInitialized()) return;
	const clamp = (value: number, fallback: number, min: number, max: number): number =>
		Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value))) : fallback;
	INNER_COLS = clamp(cfgImagesAttachmentPreviewWidth.get(settings), 12, 4, 80);
	INNER_ROWS = clamp(cfgImagesAttachmentPreviewHeight.get(settings), 4, 1, 30);
}

/** The card interior in terminal cells, from the configured attachment preview size. */
export function attachmentPreviewSize(): { cols: number; rows: number } {
	refreshPreviewSize();
	return { cols: INNER_COLS, rows: INNER_ROWS };
}`,
      "composer chip style reads configured preview size",
    ).content;

    out = replaceAny(
      out,
      [
        `function paintCard(node: UiNode, cx: PaintContext): string[] {
	const theme = cx.theme;`,
      ],
      `function paintCard(node: UiNode, cx: PaintContext): string[] {
	refreshPreviewSize();
	const theme = cx.theme;`,
      "painted chip card uses configured size",
    ).content;

    return replaceAny(
      out,
      [
        `function paintChips(node: UiNode, cx: PaintContext): Block {
	const cards = node.children();`,
      ],
      `function paintChips(node: UiNode, cx: PaintContext): Block {
	refreshPreviewSize();
	const cards = node.children();`,
      "painted chip band uses configured size",
    ).content;
  }

  return {
    patchComposerChipsPreviewSize,
    patchComposerChipsPreviewStyle,
  };
}

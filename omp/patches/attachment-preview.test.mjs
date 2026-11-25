import assert from "node:assert/strict";
import { test } from "node:test";
import { createAttachmentPreviewPatches } from "./attachment-preview.mjs";

function replaceAny(content, alternatives, newText, label) {
  if (content.includes(newText)) return { content };
  for (const oldText of alternatives) {
    const count = content.split(oldText).length - 1;
    if (count === 1)
      return { content: content.replace(oldText, () => newText) };
  }
  throw new Error(`Patch '${label}' did not match`);
}

const patches = createAttachmentPreviewPatches({ replaceAny });

const chipsSource = String.raw`import { For, type JSXNode } from "@oh-my-pi/pi-tui";
import type { ChipCardTerm } from "../styles/composer/chips";

/** Lines of a text chip's preview. */
const PREVIEW_LINES = 4;

function card(atom: Atom & { kind: "paste" | "image" | "video" }, attachment?: CardAttachment): JSXNode {
	const link = attachment?.link;
	return (
		<card>
			{atom.kind === "paste" ? (
				<text
					spans={[{ s: "muted", t: content.split("\n", PREVIEW_LINES).join("\n") }]}
					wrap="none"
					lines={PREVIEW_LINES}
				/>
			) : atom.image ? (
				<image
					max={{ w: "12ch", h: "4lines" }}
				/>
			) : null}
		</card>
	);
}
`;

const stylesSource = String.raw`import { fileLink } from "../tools/file-common";

const INNER_COLS = 12;
const INNER_ROWS = 4;
const CARD_GAP = 2;

function paintCard(node: UiNode, cx: PaintContext): string[] {
	const theme = cx.theme;
	return [];
}

function paintChips(node: UiNode, cx: PaintContext): Block {
	const cards = node.children();
	return { rows: [] };
}
`;

test("composer chips read images.attachmentPreviewWidth/Height", () => {
  const patched = patches.patchComposerChipsPreviewSize(chipsSource);

  assert.match(
    patched,
    /import \{ attachmentPreviewSize, type ChipCardTerm \}/,
  );
  assert.match(patched, /const \{ cols, rows \} = attachmentPreviewSize\(\);/);
  assert.ok(
    patched.includes("max={{ w: `${cols}ch`, h: `${rows}lines` }}"),
    "image max follows the configured card size",
  );
  assert.match(patched, /content\.split\("\\n", rows\)/);
  assert.doesNotMatch(patched, /PREVIEW_LINES/);
  assert.equal(patches.patchComposerChipsPreviewSize(patched), patched);
});

test("chip painter uses the configured card size and falls back when settings are unavailable", () => {
  const patched = patches.patchComposerChipsPreviewStyle(stylesSource);

  assert.match(patched, /import \{ isSettingsInitialized, settings \}/);
  assert.match(patched, /let INNER_COLS = 12;/);
  assert.match(patched, /let INNER_ROWS = 4;/);
  assert.match(patched, /cfgImagesAttachmentPreviewWidth\.get\(settings\)/);
  assert.match(patched, /cfgImagesAttachmentPreviewHeight\.get\(settings\)/);
  assert.match(patched, /if \(!isSettingsInitialized\(\)\) return;/);
  assert.match(patched, /export function attachmentPreviewSize\(\)/);
  assert.match(
    patched,
    /function paintCard[\s\S]*?\n\trefreshPreviewSize\(\);/,
  );
  assert.match(
    patched,
    /function paintChips[\s\S]*?\n\trefreshPreviewSize\(\);/,
  );
  assert.equal(patches.patchComposerChipsPreviewStyle(patched), patched);
});

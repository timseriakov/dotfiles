import assert from "node:assert/strict";
import { test } from "node:test";
import { createStatusLinePatches } from "./status-line.mjs";

const pathHeader = `\t\t// Starship-style minimal path: always show only the last directory segment.\n\t\t// This keeps the display stable even if custom statusLine.segmentOptions are not loaded.\n\t\tpwd = path.basename(pwd) || pwd;`;
const oldUpmAlias = `${pathHeader}\n\t\t// Short alias for the main project so narrow SSH terminals show more info.\n\t\tif (pwd === "urban-prime-mono") pwd = "upm";`;
const aliases = `${pathHeader}\n\t\t// Short aliases keep frequent project names recognizable and free status-line space.\n\t\tif (pwd === "urban-prime-mono") pwd = "upm";\n\t\tif (pwd === "qutebrowser") pwd = "qt";`;

function replaceAny(content, alternatives, newText) {
  if (content.includes(newText))
    return { content, changed: false, already: true };
  for (const oldText of alternatives) {
    if (
      typeof oldText === "string" &&
      content.split(oldText).length - 1 === 1
    ) {
      return {
        content: content.replace(oldText, () => newText),
        changed: true,
        already: false,
      };
    }
    if (oldText instanceof RegExp && oldText.test(content)) {
      return {
        content: content.replace(oldText, () => newText),
        changed: true,
        already: false,
      };
    }
  }
  return { content, changed: false, already: false };
}

function replaceOnce(content, oldText, newText) {
  return replaceAny(content, [oldText], newText);
}

const patchSegments = createStatusLinePatches({
  replaceAny,
  replaceOnce,
  insertAfter: (content, anchor, text) =>
    replaceOnce(content, anchor, anchor + text),
  insertBefore: (content, anchor, text) =>
    replaceOnce(content, anchor, text + anchor),
}).patchSegments;

function source(pathBlock) {
  return `import { TERMINAL } from "@oh-my-pi/pi-tui";\n${pathBlock}\nfunction modelDisplayName(ctx: SegmentContext): string {\n\tconst state = ctx.session.state;\n\tconst modelName = state.model?.name || state.model?.id || "no-model";\n\treturn modelName.startsWith("Claude ") ? modelName.slice(7) : modelName;\n}`;
}

test("adds qutebrowser → qt while preserving urban-prime-mono → upm", () => {
  const patched = patchSegments(source(pathHeader));
  assert.ok(patched.includes('if (pwd === "urban-prime-mono") pwd = "upm";'));
  assert.ok(patched.includes('if (pwd === "qutebrowser") pwd = "qt";'));
});

test("migrates the existing upm-only patch and stays idempotent", () => {
  const patched = patchSegments(source(oldUpmAlias));
  assert.ok(patched.includes(aliases));
  assert.equal(patchSegments(patched), patched);
});

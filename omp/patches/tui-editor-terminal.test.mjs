import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createTuiEditorTerminalPatches } from "./tui-editor-terminal.mjs";

function replaceOnce(content, oldText, newText, label) {
  if (content.includes(newText))
    return { content, changed: false, already: true };
  const count = content.split(oldText).length - 1;
  assert.equal(count, 1, `Patch '${label}' expected one anchor`);
  return {
    content: content.replace(oldText, () => newText),
    changed: true,
    already: false,
  };
}

function replaceAny(content, alternatives, newText, label) {
  if (content.includes(newText))
    return { content, changed: false, already: true };
  for (const oldText of alternatives) {
    if (content.split(oldText).length - 1 === 1)
      return replaceOnce(content, oldText, newText, label);
  }
  throw new Error(`Patch '${label}' did not match`);
}

const patches = createTuiEditorTerminalPatches({ replaceOnce, replaceAny });

test("visual m survives the #visualEdit dot-repeat refactor", () => {
  const source = readFileSync(
    "/Users/tim/.bun/install/global/node_modules/@oh-my-pi/pi-tui/src/vim.ts",
    "utf8",
  );
  const patched = patches.patchVimCutRegisters(source);

  assert.match(patched, /case "s":\n\s+case "m":\n\s+case ">":/);
  assert.match(
    patched,
    /const change: VimChange = \{\s+kind: "visual",\s+key,\s+linewise,/,
  );
  assert.match(
    patched,
    /const operator: VimOperator = key === "y" \? "y" : key === "c" \|\| key === "s" \? "c" : key === "m" \? "m" : "d";/,
  );
  assert.match(patched, /commands = this\.#repeatVisual\(change, buf\);/);
  assert.match(
    patched,
    /return this\.#visualEdit\(change\.key, from, to, change\.linewise\);/,
  );
});

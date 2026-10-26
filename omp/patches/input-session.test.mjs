import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createInputSessionPatches } from "./input-session.mjs";

function replaceOnce(content, oldText, newText) {
  if (content.includes(newText))
    return { content, changed: false, already: true };
  const count = content.split(oldText).length - 1;
  if (count !== 1) throw new Error(`Expected one anchor, found ${count}`);
  return {
    content: content.replace(oldText, () => newText),
    changed: true,
    already: false,
  };
}

const patchInputController = createInputSessionPatches({
  replaceOnce,
  replaceAny: (content, alternatives, newText) => {
    for (const oldText of alternatives) {
      if (content.split(oldText).length - 1 === 1)
        return replaceOnce(content, oldText, newText);
    }
    return { content, changed: false, already: false };
  },
  insertAfter: (content, anchor, text) =>
    replaceOnce(content, anchor, anchor + text),
  insertBefore: (content, anchor, text) =>
    replaceOnce(content, anchor, text + anchor),
}).patchInputController;

const inputControllerSource = `class InputController {
\tconstructor() {
\t\tthis.ctx.editor.clearCustomKeyHandlers();
\t\tfor (const key of this.ctx.keybindings.getKeys("app.smol.cycle")) {
\t\t\tthis.ctx.editor.setCustomKeyHandler(key, () => void this.cycleSmolModel());
\t\t}
\t\tfor (const key of this.ctx.keybindings.getKeys("app.session.compact")) {
\t\t\tthis.ctx.editor.setCustomKeyHandler(key, () => void this.ctx.handleCompactCommand());
\t\t}
\t}

\thandleCtrlZ(): void {}

\thandleDequeue(): void {}

\tcycleThinkingLevel(): void {
\t}
}`;

function dispatchCtrlT(patched, role, modelId) {
  const handlerBody = patched.match(
    /setCustomKeyHandler\(key, \(\) => \{([\s\S]*?)\n\t\t\t\}\);/,
  )?.[1];
  assert.ok(handlerBody);
  let action;
  new Function(handlerBody).call({
    ctx: {
      viewSession: {
        sessionManager: { getLastModelChangeRole: () => role },
        model: modelId
          ? {
              provider: modelId.split("/")[0],
              id: modelId.split("/").slice(1).join("/"),
            }
          : undefined,
      },
    },
    cycleSmolModel: () => (action = "smol"),
    cycleThinkingLevel: () => (action = "thinking"),
  });
  return action;
}

test("Ctrl+T routes the smol role to model cycling and other roles to thinking", () => {
  const patched = patchInputController(inputControllerSource);
  assert.match(
    patched,
    /const role = this\.ctx\.viewSession\.sessionManager\.getLastModelChangeRole\(\);/,
  );
  assert.match(patched, /model\?\.id !== "cx\/gpt-6-luna"/);
  assert.equal(
    dispatchCtrlT(patched, "smol", "omniroute/cx/gpt-6-luna"),
    "thinking",
  );
  assert.match(patched, /else this\.cycleThinkingLevel\(\);/);
  assert.match(patched, /role === "temporary" && model &&/);
  assert.equal(
    dispatchCtrlT(patched, "smol", "opencode-go/deepseek-v4-flash"),
    "smol",
  );
  assert.equal(dispatchCtrlT(patched, "default"), "thinking");
  assert.equal(dispatchCtrlT(patched, "slow"), "thinking");
  assert.equal(
    dispatchCtrlT(patched, "temporary", "opencode-go/deepseek-v4.1-flash"),
    "smol",
  );
  assert.equal(
    dispatchCtrlT(patched, "temporary", "omniroute/cx/gpt-6-luna"),
    "thinking",
  );
});

test("smol cycling restores the three-model order and keeps the smol role", () => {
  const patched = patchInputController(inputControllerSource);
  const idsBlock = patched.match(/const ids = \[([\s\S]*?)\n\t\t\];/)?.[1];
  assert.ok(idsBlock);
  assert.deepEqual(
    [...idsBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]),
    [
      "omniroute/opencode-go/deepseek-v4-flash",
      "omniroute/opencode-go/deepseek-v4.1-flash",
      "omniroute/opencode-go/glm-5.3-flash",
    ],
  );
  assert.match(patched, /this\.ctx\.session\.setModel\(next, "smol"\)/);
  assert.doesNotMatch(patched, /deepseek-v4-flash-vision-exp/);
});

test("smol config uses Luna low", () => {
  const config = readFileSync(
    new URL("../agent/config.yml", import.meta.url),
    "utf8",
  );
  assert.match(config, /^  smol: omniroute\/cx\/gpt-6-luna:low$/m);
});

test("input controller patch remains idempotent", () => {
  const once = patchInputController(inputControllerSource);
  assert.equal(patchInputController(once), once);
});

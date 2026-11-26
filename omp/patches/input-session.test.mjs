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

\t#onComposerKey(key: KeyEvent): boolean {
\t\tconst km = this.ctx.keybindings;
\t\tconst empty = this.ctx.composer.text().trim() === "";
\t\tif (km.matches(key, "app.model.cycleForward")) {
\t\t\tvoid this.cycleRoleModel("forward");
\t\t\treturn true;
\t\t}
\t\treturn false;
\t}

\t#customKeyHandler(): void {
\t\tconst actions = [
\t\t\t["app.session.observe", () => this.ctx.showAgentHub()],
\t\t];
\t}

\thandleCtrlZ(): void {}

\thandleDequeue(): void {}

\tcycleThinkingLevel(): void {
\t}
}`;

function dispatchCtrlT(patched, role, modelId) {
  const handlerBody = patched.match(
    /\["app\.smol\.cycle", \(\) => \{([\s\S]*?)\n\t\t\t\}\],/,
  )?.[1];
  assert.ok(handlerBody);
  let action;
  new Function(handlerBody).call({
    ctx: {
      viewSession: {
        sessionManager: { getLastModelChangeRole: () => role },
      },
      session: {
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

test("Tab falls through to completion unless the composer is empty", () => {
  const patched = patchInputController(inputControllerSource);
  const guard = patched.match(
    /if \(km\.matches\(key, "app\.model\.cycleForward"\)( && [^\n]+)\) \{/,
  )?.[1];
  assert.ok(guard, "forward model cycling must be guarded");

  const dispatch = (key, text) => {
    const empty = text.trim() === "";
    const km = {
      matches: (pressed, action) =>
        action === "app.model.cycleForward" &&
        (pressed.id === "tab" || pressed.id === "ctrl+p"),
    };
    return new Function(
      "km",
      "key",
      "empty",
      `if (km.matches(key, "app.model.cycleForward")${guard}) return "cycle"; return "fallthrough";`,
    )(km, key, empty);
  };

  assert.equal(dispatch({ id: "tab" }, ""), "cycle");
  assert.equal(dispatch({ id: "tab" }, "/mod"), "fallthrough");
  assert.equal(dispatch({ id: "tab" }, "@src/input"), "fallthrough");
  assert.equal(dispatch({ id: "ctrl+p" }, "/mod"), "cycle");
  assert.equal(dispatch({ id: "ctrl+p" }, ""), "cycle");
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

test("smol config uses DeepSeek v4.1 Flash max", () => {
  const config = readFileSync(
    new URL("../agent/config.yml", import.meta.url),
    "utf8",
  );
  assert.match(
    config,
    /^  smol: omniroute\/opencode-go\/deepseek-v4\.1-flash:max$/m,
  );
});

test("input controller patch remains idempotent", () => {
  const once = patchInputController(inputControllerSource);
  assert.equal(patchInputController(once), once);
});

const slashGatePatches = createInputSessionPatches({
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
});

const predictionControllerSource = `function predictionAnchor(session: AgentViewSession): AgentMessage | undefined {
\tconst messages = session.messages;
\tfor (let i = messages.length - 1; i >= 0; i--) {
\t\tconst message = messages[i];
\t\tif (isAdvisorCard(message) || isExcludedFromContext(message)) continue;
\t\treturn message;
\t}
\treturn undefined;
}

export class ComposerPredictionController {
\treadonly #ctx: PredictionContext;

\tconstructor(ctx: PredictionContext, options: { deadlineMs?: number; meterProvider?: MeterProvider } = {}) {
\t\tthis.#ctx = ctx;
\t\tthis.#deadlineMs = options.deadlineMs ?? PREDICTION_DEADLINE_MS;
\t}

\tget choices(): readonly string[] | undefined {
\t\tconst prediction = this.#prediction();
\t\tif (!prediction || !this.#isCurrent(prediction.source)) return undefined;
\t\treturn prediction.choices;
\t}

\t#offer(source: PredictionSource, abort: AbortController, choices: string[] | undefined): PredictionOutcome {
\t\tif (this.#abort !== abort) return "cancelled";
\t\tif (!this.#isCurrent(source)) return "stale";
\t\tif (!choices) return "skipped";
\t\treturn "offered";
\t}
}`;

test("composer predictions stay off slash-command and path drafts", () => {
  const patched = slashGatePatches.patchComposerPredictionSlashGate(
    predictionControllerSource,
  );
  assert.match(
    patched,
    /function isSlashCommandDraft\(text: string\): boolean \{\n\treturn text\.trimStart\(\)\.startsWith\("\/"\);\n\}/,
  );
  assert.match(
    patched,
    /get choices\(\): readonly string\[\] \| undefined \{\n\t\tif \(isSlashCommandDraft\(this\.#ctx\.composer\.text\(\)\)\) return undefined;\n\t\tconst prediction/,
  );
  assert.match(
    patched,
    /#offer\(source: PredictionSource, abort: AbortController, choices: string\[\] \| undefined\): PredictionOutcome \{\n\t\tif \(this\.#abort !== abort\) return "cancelled";\n\t\tif \(!this\.#isCurrent\(source\)\) return "stale";\n\t\tif \(isSlashCommandDraft\(this\.#ctx\.composer\.text\(\)\)\) return "cancelled";/,
  );
  assert.match(
    patched,
    /addEditListener\(\(_edit, composer\) => \{\n\t\t\tif \(isSlashCommandDraft\(composer\.text\(\)\)\) this\.cancel\(\);/,
  );

  const helper = patched.match(
    /function isSlashCommandDraft\(text: string\): boolean \{[\s\S]*?\n\}/,
  )?.[0];
  assert.ok(helper);
  const isSlashCommandDraft = new Function(
    `${helper.replace("(text: string): boolean", "(text)")}; return isSlashCommandDraft;`,
  )();
  assert.equal(isSlashCommandDraft("/model gpt-6"), true);
  assert.equal(isSlashCommandDraft("  /add-dir /Users/tim/dev"), true);
  assert.equal(isSlashCommandDraft("/Users/tim/dev"), true);
  assert.equal(isSlashCommandDraft("Please run the tests"), false);
  assert.equal(isSlashCommandDraft(""), false);

  assert.equal(
    slashGatePatches.patchComposerPredictionSlashGate(patched),
    patched,
  );
});

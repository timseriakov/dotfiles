import assert from "node:assert/strict";
import { test } from "node:test";
import { createCommandRuntimePatches } from "./commands-runtime.mjs";

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

function replaceAny(content, alternatives, newText, label) {
  if (content.includes(newText))
    return { content, changed: false, already: true };
  for (const oldText of alternatives) {
    if (content.split(oldText).length - 1 === 1)
      return replaceOnce(content, oldText, newText);
  }
  throw new Error(`${label} did not match`);
}

const patches = createCommandRuntimePatches({
  replaceOnce,
  replaceAny,
  insertAfter: (content, anchor, insertion, label) =>
    replaceOnce(content, anchor, anchor + insertion, label),
  insertBefore: (content, anchor, insertion, label) =>
    replaceOnce(content, anchor, insertion + anchor, label),
});

const expandedBtw = "/btw доложи статус и прогресс";
const btwSource = `\t\tname: "btw",\n\t\taliases: ["b", "и", "s", "ы"],\n\t\ticon: "question",\n\t\tdescription: "Ask a side question, or browse this session's BTW history",`;
const dispatchSource = `import { parseSlashCommand, parseSubcommand } from "../../slash-commands/helpers/parse";\n\t\t\tif (bareSlashCommand) text = bareSlashCommand.command;\n\t\t\t\tconst slashResult = await executeBuiltinSlashCommand(text, { ctx: this.ctx, input, draftDetached: true });\n\t/** Whether \`text\` invokes a registered extension command, which runs locally instead of prompting the model. */\n\t#isLocalExtensionCommand(text: string): boolean {\n\t\treturn false;\n\t}`;
const currentDispatchSource = `import { parseSlashCommand, parseSubcommand } from "../../slash-commands/helpers/parse";\n\t\t\tif (bareSlashCommand) text = bareSlashCommand.command;\n\t\t\t\tlet slashResult: string | boolean;\n\t\t\t\ttry {\n\t\t\t\t\tslashResult = await executeBuiltinSlashCommand(text, { ctx: this.ctx, input, draftDetached });\n\t/** Whether \`text\` invokes a registered extension command, which runs locally instead of prompting the model. */\n\t#isLocalExtensionCommand(text: string): boolean {\n\t\treturn false;\n\t}`;

function expandMethodFrom(patchedSource) {
  const body = patchedSource.match(
    /\t#expandBtwPromptCommand\(text: string\): string \{([\s\S]*?)\n\t\}/,
  )?.[1];
  assert.ok(
    body,
    "patched InputController should contain BTW expansion helper",
  );
  return new Function(
    "parseSlashCommand",
    "lookupBuiltinSlashCommand",
    "isKnownSkillCommand",
    "expandSlashCommand",
    `return function(text) {${body}\n}`,
  )(
    (text) => {
      if (!text.startsWith("/")) return null;
      const [name] = text.slice(1).split(/\s+/, 1);
      return { name, args: "", text };
    },
    (name) =>
      name === "btw" || name === "b" || name === "и"
        ? { name: "btw" }
        : undefined,
    (_ctx, text) => text.startsWith("/skill:"),
    (text, commands) =>
      commands.find(
        (command) => command.name === text.slice(1).split(/\s+/, 1)[0],
      )?.content ?? text,
  );
}

function createController(source) {
  const callCount = { expansions: 0 };
  const expand = expandMethodFrom(source);
  const commandContent = {
    s: expandedBtw,
    ы: expandedBtw,
    report: "A normal report prompt",
  };
  return {
    callCount,
    expand(text) {
      const command = text.startsWith("/")
        ? text.slice(1).split(/\s+/, 1)[0]
        : "";
      if (commandContent[command]) callCount.expansions += 1;
      return expand.call(
        {
          ctx: {
            session: {
              extensionRunner: undefined,
              customCommands: [],
              slashCommands: Object.entries(commandContent).map(
                ([name, content]) => ({ name, content }),
              ),
            },
            skillCommands: new Set(),
          },
        },
        text,
      );
    },
  };
}

test("expanded /s and /ы dispatch the BTW builtin with the original Russian payload", () => {
  const patched = patches.patchExpandedBtwDispatch(dispatchSource);
  const controller = createController(patched);
  assert.equal(controller.expand("/s"), expandedBtw);
  assert.equal(controller.expand("/ы"), expandedBtw);
  assert.equal(controller.callCount.expansions, 2);
  assert.equal(
    (patched.match(/text = this\.#expandBtwPromptCommand\(text\);/g) ?? [])
      .length,
    2,
  );
});

test("ordinary prompts and direct /btw invocations are left for their existing paths", () => {
  const controller = createController(
    patches.patchExpandedBtwDispatch(dispatchSource),
  );
  assert.equal(controller.expand("What changed today?"), "What changed today?");
  assert.equal(controller.expand("/btw already direct"), "/btw already direct");
  assert.equal(controller.expand("/report"), "/report");
  assert.equal(controller.expand("/other"), "/other");
  assert.equal(controller.callCount.expansions, 1);
});

test("BTW alias migration removes only mistaken s/ы and is idempotent", () => {
  const once = patches.patchBtwAliases(btwSource);
  assert.match(once, /aliases: \["b", "и"\]/);
  assert.doesNotMatch(once, /aliases: \[.*(?:"s"|"ы")/);
  assert.equal(patches.patchBtwAliases(once), once);
});

test("expanded BTW dispatch patch is idempotent and ordered before builtin dispatch", () => {
  const once = patches.patchExpandedBtwDispatch(dispatchSource);
  assert.equal(patches.patchExpandedBtwDispatch(once), once);
  assert.ok(
    once.includes(
      'import { expandSlashCommand } from "../../extensibility/slash-commands";',
    ),
  );
  assert.ok(
    once.indexOf("text = this.#expandBtwPromptCommand(text);") <
      once.indexOf("const slashResult = await executeBuiltinSlashCommand"),
  );
});
test("expanded BTW dispatch patch supports OMP try/catch builtin dispatch", () => {
  const patched = patches.patchExpandedBtwDispatch(currentDispatchSource);
  assert.match(
    patched,
    /text = this\.#expandBtwPromptCommand\(text\);\n\t\t\t\tlet slashResult: string \| boolean;/,
  );
  assert.equal(patches.patchExpandedBtwDispatch(patched), patched);
});

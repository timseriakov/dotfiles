import assert from "node:assert/strict";
import { test } from "node:test";
import { createFocusedSubagentAdvisorPatch } from "./focused-subagent-advisor.mjs";

function replaceOnce(content, oldText, newText, label) {
  if (content.includes(newText))
    return { content, changed: false, already: true };
  const count = content.split(oldText).length - 1;
  if (count !== 1)
    throw new Error(`${label}: expected one anchor, found ${count}`);
  return {
    content: content.replace(oldText, () => newText),
    changed: true,
    already: false,
  };
}

function insertAfter(content, anchor, insertion, label) {
  if (content.includes(insertion))
    return { content, changed: false, already: true };
  const count = content.split(anchor).length - 1;
  if (count !== 1)
    throw new Error(`${label}: expected one anchor, found ${count}`);
  return {
    content: content.replace(anchor, () => anchor + insertion),
    changed: true,
    already: false,
  };
}

const patches = createFocusedSubagentAdvisorPatch({ insertAfter, replaceOnce });
const controllerSource = `const FOCUSED_VIEW_COMMANDS: Record<string, (args: string) => boolean> = {\n\tbtw: () => true,\n};`;
const commandSource = `		name: "advisor",
		getTuiAutocompleteDescription: runtime => {
			const stats = runtime.ctx.session.getAdvisorStats();
			return stats.active ? "on" : "off";
		},
		handle: async (command, runtime) => {
			runtime.session.toggleAdvisorEnabled();
		},
		handleTui: async (command, runtime) => {
			const { verb, rest } = parseSubcommand(command.args);
			if (!verb || verb === "toggle") {
				const active = runtime.ctx.session.toggleAdvisorEnabled();
				const configured = runtime.ctx.session.isAdvisorEnabled();
			}
			if (verb === "on") runtime.ctx.session.setAdvisorEnabled(true);
			if (verb === "off") runtime.ctx.session.setAdvisorEnabled(false);
			if (verb === "status") await runtime.ctx.handleAdvisorStatusCommand();
		},`;

test("focused subagent accepts only Advisor toggle/on/off forms", () => {
  const patched =
    patches.patchFocusedSubagentAdvisorController(controllerSource);
  const entry = patched.match(/\tadvisor: args => \{[\s\S]*?\n\t\},/)?.[0];
  assert.ok(entry, "focused-view command table should contain Advisor entry");
  const accepts = new Function(
    "parseSubcommand",
    `return ({${entry}}).advisor`,
  )((args) => {
    const [verb, ...rest] = args.trim().split(/\s+/).filter(Boolean);
    return { verb: verb || undefined, rest: rest.join(" ") };
  });

  for (const args of ["", "toggle", "on", "off"])
    assert.equal(accepts(args), true, args);
  for (const args of ["status", "dump", "configure", "model"])
    assert.equal(accepts(args), false, args);
  assert.equal(patches.patchFocusedSubagentAdvisorController(patched), patched);
});

test("TUI Advisor controls target the viewed session, leaving main-mode handler unchanged", () => {
  const patched = patches.patchFocusedSubagentAdvisorCommand(commandSource);

  assert.match(
    patched,
    /const stats = runtime\.ctx\.viewSession\.getAdvisorStats\(\)/,
  );
  assert.match(patched, /const target = runtime\.ctx\.viewSession;/);
  assert.match(patched, /target\.toggleAdvisorEnabled\(\)/);
  assert.match(patched, /target\.isAdvisorEnabled\(\)/);
  assert.match(patched, /target\.setAdvisorEnabled\(true\)/);
  assert.match(patched, /target\.setAdvisorEnabled\(false\)/);
  assert.match(patched, /runtime\.session\.toggleAdvisorEnabled\(\)/);
  assert.match(
    patched,
    /if \(verb === "status"\) await runtime\.ctx\.handleAdvisorStatusCommand\(\)/,
  );
  assert.equal(patches.patchFocusedSubagentAdvisorCommand(patched), patched);
});

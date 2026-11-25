import assert from "node:assert/strict";
import { test } from "node:test";
import { createComposerDetailsPatches } from "./composer-details.mjs";

function replaceOnce(content, oldText, newText, label) {
  if (content.includes(newText))
    return { content, changed: false, already: true };
  assert.equal(
    content.split(oldText).length - 1,
    1,
    `Patch '${label}' expected one anchor`,
  );
  return {
    content: content.replace(oldText, () => newText),
    changed: true,
    already: false,
  };
}

const patch = createComposerDetailsPatches({ replaceOnce });

const statusLineSource = `\tconst badge = facts.subagents > 0;
\tif (badge) {
\t\tconst count = \`\${facts.subagents}\`;
\t\tbadges.push({
\t\t\tkey: "subagent-badge",
\t\t\tside: "right",
\t\t\tpriority: 0,
\t\t\ticon: "agents",
\t\t\tspans: [{ t: count, s: "statusLineSubagents" }],
\t\t\tlook: {
\t\t\t\tpieces: [
\t\t\t\t\t{ icon: "agents", s: "statusLineSubagents" },
\t\t\t\t\t{ t: count, s: "statusLineSubagents" },
\t\t\t\t],
\t\t\t},
\t\t});
\t}`;

test("status subagent badge keeps its icon and drops the count digit", () => {
  const once = patch.patchStatusLineSubagentBadge(statusLineSource);
  assert.doesNotMatch(once, /const count =/);
  assert.doesNotMatch(once, /spans: \[\{ t: count/);
  assert.doesNotMatch(once, /\{ t: count, s: "statusLineSubagents" \}/);
  assert.match(once, /icon: "agents"/);
  assert.match(once, /spans: \[\],/);
  assert.match(
    once,
    /title: `\$\{facts\.subagents\} running subagent\$\{facts\.subagents === 1 \? "" : "s"\}`/,
  );
  assert.equal(patch.patchStatusLineSubagentBadge(once), once);
});

const composerFactsSource = `\t\tconst badge = state.subagents > 0;
\t\tif (badge)
\t\t\tpush("subagent-badge", "right", 0, {
\t\t\t\tspans: [{ t: \`\${state.subagents}\`, s: "statusLineSubagents" }],
\t\t\t\ticon: "agents",
\t\t\t});`;

test("composer preview subagent badge keeps its icon and drops the count digit", () => {
  const once = patch.patchComposerFactsSubagentBadge(composerFactsSource);
  assert.doesNotMatch(once, /t: `\$\{state\.subagents\}`/);
  assert.match(once, /icon: "agents"/);
  assert.match(once, /spans: \[\],/);
  assert.match(
    once,
    /title: `\$\{state\.subagents\} running subagent\$\{state\.subagents === 1 \? "" : "s"\}`/,
  );
  assert.equal(patch.patchComposerFactsSubagentBadge(once), once);
});

const editorSource = `\t\tlet tail = "";
\t\tif (hasCaret && !caretOnText && caretEnd !== "none" && !(selection && selected(row.end))) {
\t\t\tif (caretEnd === "block") {
\t\t\t\ttail += \`\${INVERSE_ON} \${INVERSE_OFF}\`;
\t\t\t}
\t\t}`;

test("editor skips the end-of-text caret cell when a ghost follows", () => {
  const once = patch.patchEditorGhostGap(editorSource);
  assert.match(once, /const ghostText = props\.ghost;/);
  assert.match(once, /const ghostAhead =/);
  assert.match(once, /!ghostAhead &&/);
  assert.match(
    once,
    /truncate\(ghostText, Math\.max\(0, wrapWidth - width\), ""\) !== ""/,
  );
  assert.equal(patch.patchEditorGhostGap(once), once);
});

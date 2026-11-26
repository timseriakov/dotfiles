import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorkingSpacingPatches } from "./working-spacing.mjs";

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

const patch = createWorkingSpacingPatches({ replaceOnce });

const frameSource = `\t\t\tdock
\t\t\t.slot("editorGap")
\t\t\t.set(() => (
\t\t\t\t<EditorGap
\t\t\t\t\twidgets={hud.widgets}
\t\t\t\t\tstatusOccupied={hud.status.occupied}
\t\t\t\t\tband={() => composerShape(this.#shape()).id === "band"}
\t\t\t\t/>
\t\t\t));`;

test("editor gap opens under a working row so the band keeps one blank row", () => {
  const once = patch.patchWorkingBandGap(frameSource);
  assert.match(
    once,
    /statusOccupied=\{\(\) => hud\.status\.current\(\) === undefined && hud\.status\.occupied\(\)\}/,
  );
  assert.doesNotMatch(once, /statusOccupied=\{hud\.status\.occupied\}/);
  // Idle (no status row) keeps the old flush band: current() is undefined.
  assert.match(once, /current\(\) === undefined/);
  assert.equal(patch.patchWorkingBandGap(once), once);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { patchBrowserRelayOnly } from "./browser-policy.mjs";

function replaceAny(content, alternatives, newText, label) {
  if (content.includes(newText))
    return { content, changed: false, already: true };
  for (const oldText of alternatives) {
    if (content.split(oldText).length - 1 === 1) {
      return {
        content: content.replace(oldText, () => newText),
        changed: true,
        already: false,
      };
    }
  }
  throw new Error(`${label} did not match`);
}

const source = `async function invokeBrowser(parameters, session) {\n\tconst parsed = browserSchema(parameters);\n\tif (parsed instanceof type.errors) {\n\t\tthrow new ToolError(\`browser received invalid arguments: \${parsed.summary}\`);\n\t}\n\n\tswitch (parsed.action) {}\n}`;

test("requires an explicit relay and target before any browser action", () => {
  const patched = patchBrowserRelayOnly(source, { replaceAny });
  assert.match(patched, /parsed\.app\?\.relay !== true/);
  assert.match(patched, /!parsed\.app\.target\?\.trim\(\)/);
  assert.match(
    patched,
    /resolveBrowserKind\(parsed, session\)\.kind !== "relay"/,
  );
  assert.ok(
    patched.indexOf("parsed.app?.relay !== true") <
      patched.indexOf("switch (parsed.action)"),
  );
});

test("is idempotent when the explicit-relay guard is already present", () => {
  const once = patchBrowserRelayOnly(source, { replaceAny });
  assert.equal(patchBrowserRelayOnly(once, { replaceAny }), once);
});

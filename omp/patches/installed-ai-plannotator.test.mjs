import assert from "node:assert/strict";
import { test } from "node:test";
import { createInstalledAiPlannotatorPatches } from "./installed-ai-plannotator.mjs";

const patches = createInstalledAiPlannotatorPatches({
  replaceOnce() {},
  replaceAny() {},
  insertAfter() {},
  insertBefore() {},
});

test("use native OpenAI schema normalization and keep completion sanitizer wiring", () => {
  assert.equal("patchPiAiSchemaNormalize" in patches, false);
  assert.equal(typeof patches.patchPiAiOpenAICompletions, "function");
});

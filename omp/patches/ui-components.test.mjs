import assert from "node:assert/strict";
import { test } from "node:test";
import { createUiComponentPatches } from "./ui-components.mjs";

function replaceAny(content, alternatives, newText, label) {
  if (content.includes(newText))
    return { content, changed: false, already: true };
  const matches = alternatives.filter((oldText) => content.includes(oldText));
  assert.equal(matches.length, 1, `Patch '${label}' expected one anchor`);
  return {
    content: content.replace(matches[0], () => newText),
    changed: true,
    already: false,
  };
}

const { patchWelcome, patchDynamicBorder } = createUiComponentPatches({
  replaceAny,
});
const dynamicBorderWithLabel = `\trender(width: number): readonly string[] {
\t\tconst label = typeof this.#label === "function" ? this.#label() : this.#label;
\t\tif (this.#cachedLines && this.#cachedWidth === width && this.#cachedLabel === label) {
\t\t\treturn this.#cachedLines;
\t\t}
\t\tconst horizontal = typeof theme === "undefined" ? "─" : theme.boxRound.horizontal;
\t\tconst lines = [this.#rule(horizontal, Math.max(1, width), label)];
\t\tthis.#cachedWidth = width;
\t\tthis.#cachedLabel = label;
\t\tthis.#cachedLines = lines;
\t\treturn lines;
\t}`;
const alreadyMinimalTerminalRenderer = `\t#renderLines(_termWidth: number): string[] {\n\t\treturn [theme.bold("Welcome from Oh My Pi")];\n\n\t\t// Content keeps a column clear on each side; everything centers in the full width.`;
const nativeWelcomeCard = `\tdescribe(_cx: DescribeContext): NativeNode {\n\t\tconst tip = this.tip;\n\t\tif (this.#native && this.#native.tip === tip) return this.#native.node;\n\t\tconst body: NativeChild[] = [lockupNode(this.version)];\n\t\tif (tip) {\n\t\t\tconst isNew = NEW_TIP_MARKER.test(tip);\n\t\t\tconst tipText = compactText(tipSpans(expandTipKeys(isNew ? tip.replace(NEW_TIP_MARKER, "") : tip)));\n\t\t\tconst tipRow: NativeChild[] = [\n\t\t\t\tnode("icon", { name: "lightbulb", role: "omp.welcome.tip-icon" }),\n\t\t\t\ttext(tipText, { wrap: "word", role: "omp.welcome.tip-text" }),\n\t\t\t];\n\t\t\tif (isNew) tipRow.push(node("shimmer", { text: "New", role: "omp.welcome.new" }));\n\t\t\tbody.push(node("row", { gap: "sm", align: "start", role: "omp.welcome.tip" }, tipRow, "tip"));\n\t\t}\n\t\t// No head row or chevron: the card is the hero; the version sits under the wordmark.\n\t\tconst described = card({ role: "omp.welcome" }, body);\n\t\tthis.#native = { tip, node: described };\n\t\treturn described;\n\t}`;

test("welcome native card keeps only the wordmark and is idempotent", () => {
  const source = `${alreadyMinimalTerminalRenderer}\n${nativeWelcomeCard}`;
  const patched = patchWelcome(source);

  assert.match(patched, /return \[theme\.bold\("Welcome from Oh My Pi"\)\]/);
  assert.match(patched, /text\(\[span\("Welcome from Oh My Pi", "strong"\)\]/);
  assert.doesNotMatch(
    patched,
    /const body: NativeChild\[\]|card\(\{ role: "omp\.welcome" \}/,
  );
  assert.equal(patchWelcome(patched), patched);
});
test("dynamic border stays disabled for OMP 18.16 label-aware renderer", () => {
  const patched = patchDynamicBorder(dynamicBorderWithLabel);

  assert.match(
    patched,
    /render\(_width: number\): readonly string\[\]\s*\{\s*return \[\];/,
  );
  assert.equal(patchDynamicBorder(patched), patched);
});

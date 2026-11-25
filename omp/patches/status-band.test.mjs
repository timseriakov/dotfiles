import assert from "node:assert/strict";
import { test } from "node:test";
import { createStatusBandPatches } from "./status-band.mjs";

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

const patch = createStatusBandPatches({ replaceOnce });

const segmentsSource = `import { pathToFileURL } from "node:url";
function pathSeg(input: SegInput): SegView {
	const { facts } = input;
	const opts = input.options.path ?? {};
	const strip = opts.stripWorkPrefix !== false;
	const max = opts.maxLength ?? 40;
	const href = pathToFileURL(facts.cwd).href;
	const s = "statusLinePath";
	if (strip && facts.worktree) {
		return { spans: [], look: { pieces: [] } };
	}
	return { spans: [], look: { pieces: [] } };
}
function vimSeg(input: SegInput): SegView | null {
	const labels = { insert: "INSERT", normal: "NORMAL", visual: "VISUAL", "visual-line": "V-LINE", replace: "REPLACE" };
	return null;
}
function modelSeg(input: SegInput): SegView {
	const pieces: LookPiece[] = [
		thinking.length > 0 && compact ? { ...thinking[0], lead: true, space: "after" } : { icon: "model", s: look },
		{ t: name, s: look },
	];
	const spans: TspSpan[] = [span(name, native)];
	return { spans, look: { pieces } };
}
function contextSeg(input: SegInput): SegView {
	const { facts } = input;
	const { percent, window, tokens } = facts.context;
	const level = contextLevel(percent ?? 0, window);
	const color = contextColor(level);
	const text = percent === null && window > 0 ? formatNumber(window) : formatContextUsage(percent, window, tokens);
	const spans: TspSpan[] = [span(text, color)];
	const pieces: LookPiece[] = [{ icon: "context" }, { t: text, s: color }];
	if (facts.autoCompact) {
		const speculation = facts.speculation ?? "idle";
		const lit = speculation !== "idle";
		pieces.push({ icon: "auto", s: lit ? lookAccent(input, "accent") : color, space: "before", bare: true });
		const auto: TspSpan = { t: \` \${glyph(input, "icon.auto")}\`, s: lit ? nativeAccent(input, "accent") : color };
		spans.push(speculation === "running" ? { ...auto, fx: "pulse" } : auto);
	}
	return view(input, spans, pieces, "context", contextTone(level));
}`;

test("path lastSegment, compact vim, via and plain context patch idempotently", () => {
  const once = patch.patchStatusSegments(segmentsSource);
  assert.match(once, /import \* as path from "node:path";/);
  assert.match(once, /path\.basename\(facts\.cwd\) \|\| facts\.cwd/);
  assert.match(
    once,
    /const labels = \{ insert: "I", normal: "N", visual: "V", "visual-line": "VL", replace: "R" \};/,
  );
  assert.match(once, /\{ t: "via ", s: "text" \}/);
  assert.match(once, /\[span\("via ", "text"\), span\(name, native\)\]/);
  assert.match(
    once,
    /return view\(input, \[span\(text, color\)\], \[\{ t: text, s: color \}\]/,
  );
  assert.doesNotMatch(once, /icon: "context"|icon: "auto"|autoCompact/);
  assert.equal(patch.patchStatusSegments(once), once);
});

test("lastSegment type option patches idempotently", () => {
  const source =
    "\tpath?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean };";
  const once = patch.patchStatusLineTypes(source);
  assert.match(once, /lastSegment\?: boolean/);
  assert.equal(patch.patchStatusLineTypes(once), once);
});

const topSource = `function paintTop(node: UiNode, cx: PaintContext): Block {
	const { theme, width } = cx;
	const chip = look.attachment === "top-rule-chip";
	const band = look.attachment === "top-band";
	const sep: Separator = chip ? { left: "·", right: "·" } : separatorOf(look.separator, theme);
	const bg = look.transparent ? BG_DEFAULT : bgSgr(theme, "statusLineBg");
	const caps = sep.caps && !look.transparent ? sep.caps : undefined;
	const bandCap = band && caps ? theme.symbols.symbol("sep.powerlineCapLeft") : "";

	let segs = look.segs;
	if (band) segs = segs.filter(seg => seg.key() !== "session_name");
	const { percent, window } = look.context;
	const group = (texts, separator) => texts.length === 0 ? "" : \`\${bg}\${fg} \${texts.join(\` \${sepSgr}\${separator}\${fg} \`)} \${RESET}\`;
	if (width === 0 || (chip && (!leftRow || !rightRow))) row = leftRow + (leftRow && rightRow ? " " : "") + rightRow;
	else row = leftRow + gauge(look, Math.max(1, width - fit.leftWidth - fit.rightWidth), embedded, cx) + rightRow;
}`;

test("band keeps session, draws no caps, and leaves a plain gap", () => {
  const once = patch.patchStatusTop(topSource);
  assert.match(once, /const bg = look\.transparent \|\| band/);
  assert.match(once, /!look\.transparent && !band/);
  assert.match(once, /let segs = look\.segs; \/\/ Keep the session title/);
  assert.doesNotMatch(once, /session_name/);
  assert.match(
    once,
    /" "\.repeat\(Math\.max\(1, width - visibleWidth\(leftRow\) - visibleWidth\(rightRow\)\)\)/,
  );
  assert.match(once, /band \? `\$\{bg\}\$\{fg\}\$\{texts\.join/);
  assert.equal(patch.patchStatusTop(once), once);
});

const shapesSource = `const band: ComposerShape = {
	id: "band",
	gutter: "╰─ ",
	row: cx => [(cx.gutter ? cx.border(cx.gutter) : "") + cx.text + cx.pad],
};`;

test("band prompt uses the green starship gutter", () => {
  const once = patch.patchComposerShapes(shapesSource);
  assert.match(once, /gutter: " ",/);
  assert.match(once, /cx\.theme\.fg\("success", cx\.gutter\)/);
  assert.equal(patch.patchComposerShapes(once), once);
});

test("quiet welcome startup and session color patch idempotently", () => {
  const startup =
    "if (cfgStartupQuiet.get(settings)) this.#frame.hideWelcome();\n\t\telse this.#frame.showWelcome();";
  const once = patch.patchQuietWelcomeStartup(startup);
  assert.equal(
    once,
    "this.#frame.showWelcome(); // Keep the minimal welcome in quiet mode.",
  );
  assert.equal(patch.patchQuietWelcomeStartup(once), once);
  const color =
    'pieces.push({ t: name, s: lookAccent(input, "accent") });\n\t\t\treturn view(input, [span(name)], pieces, facts.pinned ? "pin" : undefined);';
  const muted = patch.patchSessionNameColor(color);
  assert.match(muted, /span\(name, "muted"\)/);
  assert.equal(patch.patchSessionNameColor(muted), muted);
});

test("working row does not duplicate the status title", () => {
  const source =
    '\t#workingTitleTrailer(): string | undefined {\n\t\tif (cfgComposerShape.get(settings) !== "band") return undefined;';
  const once = patch.patchWorkingTitle(source);
  assert.match(
    once,
    /return undefined; \/\/ The session title lives in the status line only/,
  );
  assert.equal(patch.patchWorkingTitle(once), once);
});

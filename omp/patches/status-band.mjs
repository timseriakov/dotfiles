/** OMP 19.2 status line + band composer: Starship-minimal status above the prompt. */
export function createStatusBandPatches(ctx) {
  const { replaceOnce } = ctx;

  function patchStatusLineTypes(content) {
    return replaceOnce(
      content,
      "\tpath?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean };",
      "\tpath?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean; lastSegment?: boolean };",
      "status line path.lastSegment option",
    ).content;
  }

  function patchStatusSegments(content) {
    let out = content;
    out = replaceOnce(
      out,
      'import { pathToFileURL } from "node:url";',
      'import * as path from "node:path";\nimport { pathToFileURL } from "node:url";',
      "status segments path import",
    ).content;
    out = replaceOnce(
      out,
      '\tconst s = "statusLinePath";\n\tif (strip && facts.worktree) {',
      '\tconst s = "statusLinePath";\n\tif (opts.lastSegment) {\n\t\tconst label = path.basename(facts.cwd) || facts.cwd;\n\t\tconst out = view(input, [span(label, s)], [{ t: label, s, href }]);\n\t\treturn { ...out, look: { ...out.look, truncate: "start" } };\n\t}\n\tif (strip && facts.worktree) {',
      "status path last segment only",
    ).content;
    out = replaceOnce(
      out,
      '\tconst labels = { insert: "INSERT", normal: "NORMAL", visual: "VISUAL", "visual-line": "V-LINE", replace: "REPLACE" };',
      '\tconst labels = { insert: "I", normal: "N", visual: "V", "visual-line": "VL", replace: "R" };',
      "status vim compact labels",
    ).content;
    out = replaceOnce(
      out,
      '\tconst pieces: LookPiece[] = [\n\t\tthinking.length > 0 && compact ? { ...thinking[0], lead: true, space: "after" } : { icon: "model", s: look },\n\t\t{ t: name, s: look },\n\t];\n\tconst spans: TspSpan[] = [span(name, native)];',
      '\tconst pieces: LookPiece[] = [\n\t\t{ t: "via ", s: "text" },\n\t\tthinking.length > 0 && compact ? { ...thinking[0], lead: true, space: "after" } : { icon: "model", s: look },\n\t\t{ t: name, s: look },\n\t];\n\tconst spans: TspSpan[] = [span("via ", "text"), span(name, native)];',
      "status model via prefix",
    ).content;
    out = replaceOnce(
      out,
      'function contextSeg(input: SegInput): SegView {\n\tconst { facts } = input;\n\tconst { percent, window, tokens } = facts.context;\n\tconst level = contextLevel(percent ?? 0, window);\n\tconst color = contextColor(level);\n\tconst text = percent === null && window > 0 ? formatNumber(window) : formatContextUsage(percent, window, tokens);\n\tconst spans: TspSpan[] = [span(text, color)];\n\tconst pieces: LookPiece[] = [{ icon: "context" }, { t: text, s: color }];\n\tif (facts.autoCompact) {\n\t\tconst speculation = facts.speculation ?? "idle";\n\t\tconst lit = speculation !== "idle";\n\t\tpieces.push({ icon: "auto", s: lit ? lookAccent(input, "accent") : color, space: "before", bare: true });\n\t\tconst auto: TspSpan = { t: ` ${glyph(input, "icon.auto")}`, s: lit ? nativeAccent(input, "accent") : color };\n\t\tspans.push(speculation === "running" ? { ...auto, fx: "pulse" } : auto);\n\t}\n\treturn view(input, spans, pieces, "context", contextTone(level));\n}',
      "function contextSeg(input: SegInput): SegView {\n\tconst { facts } = input;\n\tconst { percent, window, tokens } = facts.context;\n\tconst level = contextLevel(percent ?? 0, window);\n\tconst color = contextColor(level);\n\tconst text = percent === null && window > 0 ? formatNumber(window) : formatContextUsage(percent, window, tokens);\n\treturn view(input, [span(text, color)], [{ t: text, s: color }], undefined, contextTone(level));\n}",
      "status context plain text",
    ).content;
    return out;
  }

  function patchStatusTop(content) {
    let out = content.replace(
      "\tconst segs = look.segs;",
      '\tlet segs = look.segs;\n\tif (band) segs = segs.filter(seg => seg.key() !== "session_name");',
    );
    out = replaceOnce(
      out,
      '\tconst bg = look.transparent ? BG_DEFAULT : bgSgr(theme, "statusLineBg");\n\tconst caps = sep.caps && !look.transparent ? sep.caps : undefined;',
      '\tconst bg = look.transparent || band ? BG_DEFAULT : bgSgr(theme, "statusLineBg");\n\tconst caps = sep.caps && !look.transparent && !band ? sep.caps : undefined;',
      "status band plain background",
    ).content;
    out = replaceOnce(
      out,
      '\tlet segs = look.segs;\n\tif (band) segs = segs.filter(seg => seg.key() !== "session_name");',
      "\tlet segs = look.segs; // Keep the session title in the band too.",
      "status band keeps session",
    ).content;
    out = replaceOnce(
      out,
      "\telse row = leftRow + gauge(look, Math.max(1, width - fit.leftWidth - fit.rightWidth), embedded, cx) + rightRow;",
      '\telse\n\t\trow =\n\t\t\tleftRow +\n\t\t\t(band\n\t\t\t\t? " ".repeat(Math.max(1, width - fit.leftWidth - fit.rightWidth))\n\t\t\t\t: gauge(look, Math.max(1, width - fit.leftWidth - fit.rightWidth), embedded, cx)) +\n\t\t\trightRow;',
      "status band plain gap",
    ).content;
    out = replaceOnce(
      out,
      'texts.length === 0 ? "" : `${bg}${fg} ${texts.join(` ${sepSgr}${separator}${fg} `)} ${RESET}`;',
      'texts.length === 0 ? "" : band ? `${bg}${fg}${texts.join(`${sepSgr}${separator}${fg}`)}${RESET}` : `${bg}${fg} ${texts.join(` ${sepSgr}${separator}${fg} `)} ${RESET}`;',
      "status band compact spacing",
    ).content;
    return out;
  }

  function patchComposerShapes(content) {
    let out = content;
    out = replaceOnce(
      out,
      '\tgutter: "╰─ ",',
      '\tgutter: " ",',
      "band prompt gutter",
    ).content;
    out = replaceOnce(
      out,
      '\trow: cx => [(cx.gutter ? cx.border(cx.gutter) : "") + cx.text + cx.pad],',
      '\trow: cx => [(cx.gutter ? cx.theme.fg("success", cx.gutter) : "") + cx.text + cx.pad],',
      "band prompt green",
    ).content;
    return out;
  }

  return {
    patchStatusLineTypes,
    patchStatusSegments,
    patchStatusTop,
    patchComposerShapes,
  };
}

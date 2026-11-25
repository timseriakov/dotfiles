/**
 * Composer details: the live-work badge keeps its icon but shows no count
 * digit, and ghost text closes against the typed text instead of one caret
 * cell away. Both are Tim's UI preferences, not upstream behaviour.
 */
export function createComposerDetailsPatches(ctx) {
  const { replaceOnce } = ctx;

  function patchStatusLineSubagentBadge(content) {
    return replaceOnce(
      content,
      `\tif (badge) {\n\t\tconst count = \`\${facts.subagents}\`;\n\t\tbadges.push({\n\t\t\tkey: "subagent-badge",\n\t\t\tside: "right",\n\t\t\tpriority: 0,\n\t\t\ticon: "agents",\n\t\t\tspans: [{ t: count, s: "statusLineSubagents" }],\n\t\t\tlook: {\n\t\t\t\tpieces: [\n\t\t\t\t\t{ icon: "agents", s: "statusLineSubagents" },\n\t\t\t\t\t{ t: count, s: "statusLineSubagents" },\n\t\t\t\t],\n\t\t\t},\n\t\t});\n\t}`,
      `\tif (badge) {\n\t\tbadges.push({\n\t\t\tkey: "subagent-badge",\n\t\t\tside: "right",\n\t\t\tpriority: 0,\n\t\t\ticon: "agents",\n\t\t\ttitle: \`\${facts.subagents} running subagent\${facts.subagents === 1 ? "" : "s"}\`,\n\t\t\tspans: [],\n\t\t\tlook: {\n\t\t\t\tpieces: [{ icon: "agents", s: "statusLineSubagents" }],\n\t\t\t},\n\t\t});\n\t}`,
      "status subagent badge icon without count digit",
    ).content;
  }

  function patchComposerFactsSubagentBadge(content) {
    return replaceOnce(
      content,
      `\t\tif (badge)\n\t\t\tpush("subagent-badge", "right", 0, {\n\t\t\t\tspans: [{ t: \`\${state.subagents}\`, s: "statusLineSubagents" }],\n\t\t\t\ticon: "agents",\n\t\t\t});`,
      `\t\tif (badge)\n\t\t\tpush("subagent-badge", "right", 0, {\n\t\t\t\tspans: [],\n\t\t\t\ticon: "agents",\n\t\t\t\ttitle: \`\${state.subagents} running subagent\${state.subagents === 1 ? "" : "s"}\`,\n\t\t\t});`,
      "composer preview subagent badge icon without count digit",
    ).content;
  }

  function patchEditorGhostGap(content) {
    return replaceOnce(
      content,
      `\t\tif (hasCaret && !caretOnText && caretEnd !== "none" && !(selection && selected(row.end))) {`,
      `\t\t// A ghost closes against the text: the hardware cursor marks the caret, no bar cell between.\n\t\tconst ghostText = props.ghost;\n\t\tconst ghostAhead =\n\t\t\ttypeof ghostText === "string" &&\n\t\t\tplaceholder === null &&\n\t\t\tcaret >= row.textEnd &&\n\t\t\tr === rows.length - 1 &&\n\t\t\ttruncate(ghostText, Math.max(0, wrapWidth - width), "") !== "";\n\t\tif (\n\t\t\thasCaret &&\n\t\t\t!caretOnText &&\n\t\t\tcaretEnd !== "none" &&\n\t\t\t!ghostAhead &&\n\t\t\t!(selection && selected(row.end))\n\t\t) {`,
      "editor ghost text closes against the typed text",
    ).content;
  }

  return {
    patchStatusLineSubagentBadge,
    patchComposerFactsSubagentBadge,
    patchEditorGhostGap,
  };
}

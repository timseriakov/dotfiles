export function createFocusedSubagentAdvisorPatch({
  insertAfter,
  replaceOnce,
}) {
  function patchInputController(content) {
    const anchor = `const FOCUSED_VIEW_COMMANDS: Record<string, (args: string) => boolean> = {\n`;
    const insertion = `\tadvisor: args => {
\t\tconst { verb } = parseSubcommand(args);
\t\treturn !verb || verb === "toggle" || verb === "on" || verb === "off";
\t},
`;
    return insertAfter(
      content,
      anchor,
      insertion,
      "allow focused-view /advisor toggle, on, and off",
    ).content;
  }

  function patchAdvisorCommand(content) {
    let out = replaceOnce(
      content,
      "const stats = runtime.ctx.session.getAdvisorStats();",
      "const stats = runtime.ctx.viewSession.getAdvisorStats();",
      "show focused session Advisor status in autocomplete",
    ).content;
    const handlerAnchor = `\t\thandleTui: async (command, runtime) => {\n\t\t\tconst { verb, rest } = parseSubcommand(command.args);\n`;
    out = insertAfter(
      out,
      handlerAnchor,
      "\t\t\tconst target = runtime.ctx.viewSession;\n",
      "target focused session for /advisor toggles",
    ).content;
    for (const [from, to, label] of [
      [
        "runtime.ctx.session.toggleAdvisorEnabled()",
        "target.toggleAdvisorEnabled()",
        "toggle focused session Advisor",
      ],
      [
        "runtime.ctx.session.isAdvisorEnabled()",
        "target.isAdvisorEnabled()",
        "read focused session Advisor enabled state",
      ],
      [
        "runtime.ctx.session.setAdvisorEnabled(true)",
        "target.setAdvisorEnabled(true)",
        "enable focused session Advisor",
      ],
      [
        "runtime.ctx.session.setAdvisorEnabled(false)",
        "target.setAdvisorEnabled(false)",
        "disable focused session Advisor",
      ],
    ]) {
      out = replaceOnce(out, from, to, label).content;
    }
    return out;
  }

  return {
    patchFocusedSubagentAdvisorController: patchInputController,
    patchFocusedSubagentAdvisorCommand: patchAdvisorCommand,
  };
}

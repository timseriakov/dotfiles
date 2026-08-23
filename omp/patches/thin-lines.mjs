export function createThinLinePatches({ replaceAny }) {
  function patchOutputBlockThinLines(content) {
    let out = content;
    out = replaceAny(
      out,
      ["\tconst h = theme.boxRound.horizontal;", '\tconst h = "─";'],
      '\tconst h = "─";',
      "output blocks use thin horizontal borders",
    ).content;
    out = replaceAny(
      out,
      [
        "\tconst v = theme.boxRound.vertical;",
        '\tconst v = "│";',
        '\tconst v = theme.boxRound.vertical.replaceAll("┃", "│").replaceAll("║", "│");',
      ],
      '\tconst v = theme.boxRound.vertical.replaceAll("┃", "│").replaceAll("║", "│");',
      "output blocks keep theme vertical borders, only thinning heavy variants",
    ).content;
    return out;
  }

  function patchAgentHubThinLines(content) {
    return replaceAny(
      content,
      [
        '\treturn `${theme.fg("accent", "━".repeat(filled))}${theme.fg("dim", "─".repeat(10 - filled))} ${formatNumber(tokens)}/${formatNumber(window)} ${Math.round(ratio * 100)}%`;',
        '\treturn `${theme.fg("accent", "─".repeat(filled))}${theme.fg("dim", "─".repeat(10 - filled))} ${formatNumber(tokens)}/${formatNumber(window)} ${Math.round(ratio * 100)}%`;',
      ],
      '\treturn `${theme.fg("accent", "─".repeat(filled))}${theme.fg("dim", "─".repeat(10 - filled))} ${formatNumber(tokens)}/${formatNumber(window)} ${Math.round(ratio * 100)}%`;',
      "agent hub context gauge uses thin progress line",
    ).content;
  }

  function patchMcpAuthThinLines(content) {
    let out = content;
    out = replaceAny(
      out,
      [
        '\t\t\t\t\t\tblock.addChild(new Text(theme.fg("accent", "━━━ OAuth Authorization Required ━━━"), 1, 0));',
        '\t\t\t\t\t\tblock.addChild(new Text(theme.fg("accent", "─── OAuth Authorization Required ───"), 1, 0));',
      ],
      '\t\t\t\t\t\tblock.addChild(new Text(theme.fg("accent", "─── OAuth Authorization Required ───"), 1, 0));',
      "MCP OAuth heading uses thin line",
    ).content;
    out = replaceAny(
      out,
      [
        '\t\t\t\t\t\tblock.addChild(new Text(theme.fg("accent", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"), 1, 0));',
        '\t\t\t\t\t\tblock.addChild(new Text(theme.fg("accent", "─────────────────────────────────"), 1, 0));',
      ],
      '\t\t\t\t\t\tblock.addChild(new Text(theme.fg("accent", "─────────────────────────────────"), 1, 0));',
      "MCP OAuth footer uses thin line",
    ).content;
    return out;
  }

  function patchSetupWizardThinLines(content) {
    return replaceAny(
      content,
      [
        '\tconst sweep = `${theme.fg("accent", "━".repeat(sweepWidth))}${theme.fg("dim", "─".repeat(Math.max(0, width - 8 - sweepWidth)))}`;',
        '\tconst sweep = `${theme.fg("accent", "─".repeat(sweepWidth))}${theme.fg("dim", "─".repeat(Math.max(0, width - 8 - sweepWidth)))}`;',
      ],
      '\tconst sweep = `${theme.fg("accent", "─".repeat(sweepWidth))}${theme.fg("dim", "─".repeat(Math.max(0, width - 8 - sweepWidth)))}`;',
      "setup wizard progress line is thin",
    ).content;
  }

  function patchThemeSymbolsThinLines(content) {
    const replacements = [
      ['\t"progress.filled": "━",', '\t"progress.filled": "─",'],
      ['\t"context.compaction": "┃",', '\t"context.compaction": "│",'],
    ];
    let out = content;
    for (const [from, to] of replacements) out = out.replaceAll(from, to);
    if (out === content && replacements.every(([, to]) => content.includes(to)))
      return content;
    if (out === content) {
      throw new Error(
        "Patch 'theme line symbols are thin' expected line symbol entries",
      );
    }
    return out;
  }

  return {
    patchOutputBlockThinLines,
    patchAgentHubThinLines,
    patchMcpAuthThinLines,
    patchSetupWizardThinLines,
    patchThemeSymbolsThinLines,
  };
}

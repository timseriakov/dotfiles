export function createStatusLinePatches(ctx) {
  const { replaceOnce, replaceAny, insertAfter, insertBefore } = ctx;

  function patchStatusLineTs(content) {
    let out = content;
    let r;

    r = insertAfter(
      out,
      `\t#gitStatusLastFetch = 0;\n\t#gitStatusInFlightCwd: string | undefined = undefined;`,
      `\n\t#cachedGitRemote: { ahead: number; behind: number } | null = null;\n\t#gitRemoteLastFetch = 0;\n\t#gitRemoteInFlight = false;`,
      "status-line git remote cache fields",
    );
    out = r.content;

    const remoteMethod = `\n\t#getGitRemote(effectiveGitCwd?: string): { ahead: number; behind: number } | null {\n\t\tconst gitCwd = effectiveGitCwd ?? this.#resolveActiveRepoCache().effectiveGitCwd;\n\t\tif (this.#gitRemoteInFlight || Date.now() - this.#gitRemoteLastFetch < 5000) {\n\t\t\treturn this.#cachedGitRemote;\n\t\t}\n\n\t\tthis.#gitRemoteInFlight = true;\n\n\t\t(async () => {\n\t\t\ttry {\n\t\t\t\tconst result = await $\`git rev-list --left-right --count @{upstream}...HEAD\`.cwd(gitCwd).quiet().nothrow();\n\t\t\t\tif (result.exitCode !== 0) {\n\t\t\t\t\tthis.#cachedGitRemote = null;\n\t\t\t\t\treturn;\n\t\t\t\t}\n\t\t\t\tconst [behindText, aheadText] = result.stdout.toString().trim().split(/\\s+/);\n\t\t\t\tconst behind = Number.parseInt(behindText ?? "0", 10);\n\t\t\t\tconst ahead = Number.parseInt(aheadText ?? "0", 10);\n\t\t\t\tthis.#cachedGitRemote = {\n\t\t\t\t\tahead: Number.isFinite(ahead) ? ahead : 0,\n\t\t\t\t\tbehind: Number.isFinite(behind) ? behind : 0,\n\t\t\t\t};\n\t\t\t} catch {\n\t\t\t\tthis.#cachedGitRemote = null;\n\t\t\t} finally {\n\t\t\t\tthis.#gitRemoteLastFetch = Date.now();\n\t\t\t\tthis.#gitRemoteInFlight = false;\n\t\t\t}\n\t\t})();\n\n\t\treturn this.#cachedGitRemote;\n\t}\n`;
    r = insertBefore(
      out,
      `\n\t#lookupPr(effectiveGitCwd?: string): { number: number; url: string } | null {`,
      remoteMethod,
      "status-line #getGitRemote method",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\t\t\tgit: {\n\t\t\t\tbranch: this.#getCurrentBranch(),\n\t\t\t\tstatus: this.#getGitStatus(),\n\t\t\t\tpr: this.#lookupPr(),\n\t\t\t},`,
        `\t\t\tgit: {\n\t\t\t\tbranch: gitBranch,\n\t\t\t\tstatus: gitStatus,\n\t\t\t\tpr: gitPr,\n\t\t\t},`,
      ],
      `\t\t\tgit: {\n\t\t\t\tbranch: gitBranch,\n\t\t\t\tstatus: gitStatus,\n\t\t\t\tremote: this.#getGitRemote(activeRepoCache.effectiveGitCwd),\n\t\t\t\tpr: gitPr,\n\t\t\t},`,
      "status-line context git.remote",
    );
    out = r.content;

    r = replaceOnce(
      out,
      `\t\t\tconst sepTotal = Math.max(0, parts.length - 1) * (sepWidth + 2);\n\t\t\treturn partsWidth + sepTotal + 2 + capWidth;`,
      `\t\t\tconst sepTotal = Math.max(0, parts.length - 1) * sepWidth;\n\t\t\treturn partsWidth + sepTotal + capWidth;`,
      "status-line group width no outer padding",
    );
    out = r.content;

    const renderGroupAlreadyPatched =
      out.includes(
        '\t\t\tlet content = bgAnsi + fgAnsi;\n\t\t\tcontent += parts.join(`${sepAnsi}${sep}${fgAnsi}`);\n\t\t\tcontent += "\\x1b[0m";',
      ) ||
      out.includes(
        `\t\t\tlet content = bgAnsi + fgAnsi;\n\t\t\tcontent += parts.join(\`\${sepAnsi}\${sep}\${fgAnsi}\`);\n\t\t\tcontent += "\x1b[0m";`,
      );
    if (!renderGroupAlreadyPatched) {
      r = replaceAny(
        out,
        [
          `\t\t\tlet content = bgAnsi + fgAnsi + " ";\n\t\t\tcontent += parts.join(\`\${sepAnsi} \${sep} \${fgAnsi}\`);\n\t\t\tcontent += " \x1b[0m";`,
          '\t\t\tlet content = bgAnsi + fgAnsi + " ";\n\t\t\tcontent += parts.join(`${sepAnsi} ${sep} ${fgAnsi}`);\n\t\t\tcontent += " \x1b[0m";',
          "\t\t\tlet content = bgAnsi + fgAnsi;\n\t\t\tcontent += ` ${parts.join(` ${sepAnsi}${sep}${fgAnsi} `)} `;",
        ],
        `\t\t\tlet content = bgAnsi + fgAnsi;\n\t\t\tcontent += parts.join(\`\${sepAnsi}\${sep}\${fgAnsi}\`);\n\t\t\tcontent += "\x1b[0m";`,
        "status-line render group no outer padding",
      );
      out = r.content;
    }

    r = replaceAny(
      out,
      [
        `\t\tif (layout !== "plain-left") {\n\t\t\tconst runningBackgroundJobs = this.session.getAsyncJobSnapshot()?.running.length ?? 0;\n\t\t\tif (runningBackgroundJobs > 0) {\n\t\t\t\trightParts.unshift(theme.fg("statusLineSubagents", \`\${theme.icon.job} \${runningBackgroundJobs}\`));\n\t\t\t}\n\t\t\tif (subagentBadge) {\n\t\t\t\trightParts.unshift(subagentBadge);\n\t\t\t}\n\t\t}\n`,
        `\t\t// Starship-style status: configured rightSegments only, no injected job/subagent badges.\n`,
      ],
      `\t\t// Starship-style status: configured rightSegments only, no injected job/subagent badges.\n`,
      "status-line no injected right badges",
    );
    out = r.content;

    return out;
  }

  function patchStatusTypes(content) {
    let out = content;
    let r;

    r = replaceAny(
      out,
      [
        `\tpath?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean };`,
        `\tpath?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean; lastSegment?: boolean };`,
        `path?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean };`,
        `path?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean; lastSegment?: boolean };`,
      ],
      `\tpath?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean; lastSegment?: boolean };`,
      "status-line path.lastSegment option",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\tgit?: { showBranch?: boolean; showStaged?: boolean; showUnstaged?: boolean; showUntracked?: boolean };`,
        `\tgit?: { showBranch?: boolean; showStaged?: boolean; showUnstaged?: boolean; showUntracked?: boolean; compactDirty?: boolean; showAheadBehind?: boolean };`,
        `git?: { showBranch?: boolean; showStaged?: boolean; showUnstaged?: boolean; showUntracked?: boolean };`,
        `git?: { showBranch?: boolean; showStaged?: boolean; showUnstaged?: boolean; showUntracked?: boolean; compactDirty?: boolean; showAheadBehind?: boolean };`,
      ],
      `\tgit?: { showBranch?: boolean; showStaged?: boolean; showUnstaged?: boolean; showUntracked?: boolean; compactDirty?: boolean; showAheadBehind?: boolean };`,
      "status-line git compact/ahead options",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\tgit: {\n\t\tbranch: string | null;\n\t\tstatus: { staged: number; unstaged: number; untracked: number } | null;\n\t\tpr: { number: number; url: string } | null;\n\t};`,
        `\tgit: {\n\t\tbranch: string | null;\n\t\tstatus: { staged: number; unstaged: number; untracked: number } | null;\n\t\tremote: { ahead: number; behind: number } | null;\n\t\tpr: { number: number; url: string } | null;\n\t};`,
      ],
      `\tgit: {\n\t\tbranch: string | null;\n\t\tstatus: { staged: number; unstaged: number; untracked: number } | null;\n\t\tremote: { ahead: number; behind: number } | null;\n\t\tpr: { number: number; url: string } | null;\n\t};`,
      "status-line types git.remote",
    );
    out = r.content;

    return out;
  }

  function patchSegments(content) {
    let out = content;
    let r;

    r = replaceAny(
      out,
      [
        `import { TERMINAL } from "@oh-my-pi/pi-tui";`,
        `import { TERMINAL, truncateToWidth, visibleWidth } from "@oh-my-pi/pi-tui";`,
      ],
      `import { TERMINAL, truncateToWidth, visibleWidth } from "@oh-my-pi/pi-tui";`,
      "segments width helpers import",
    );
    out = r.content;
    // 17.4.0 removed the model-role resolver from segments.ts (role display is
    // no longer part of the status-line model segment), so there is no
    // resolver import to add anymore.

    r = replaceAny(
      out,
      [
        `\t\tif (opts.abbreviate !== false) {\n\t\t\tpwd = shortenPath(pwd);\n\t\t}`,
      ],
      `\t\t// Starship-style minimal path: always show only the last directory segment.\n\t\t// This keeps the display stable even if custom statusLine.segmentOptions are not loaded.\n\t\tpwd = path.basename(pwd) || pwd;`,
      "segments path basename only",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `		if (modelName.startsWith("Claude ")) {
			modelName = modelName.slice(7);
		}`,
        `		if (modelName.startsWith("Claude ")) {
			modelName = modelName.slice(7);
		}
		if (state.model?.provider === "omniroute/cx" && !/\\bOMNi\\b/.test(modelName)) {
			modelName = \`\${modelName} OMNi\`;
		}`,
        `		if (modelName.startsWith("Claude ")) {
			modelName = modelName.slice(7);
		}
		if (((state.model?.provider === "omniroute/cx") || (state.model?.provider === "omniroute" && state.model?.id?.startsWith("cx/"))) && !/\\bOMNi\\b/.test(modelName)) {
			modelName = \`\${modelName} OMNi\`;
		}`,
      ],
      `		if (modelName.startsWith("Claude ")) {
			modelName = modelName.slice(7);
		}
		if (((state.model?.provider === "omniroute/cx") || (state.model?.provider === "omniroute" && state.model?.id?.startsWith("cx/"))) && !/\\bOMNi\\b/.test(modelName)) {
			modelName = \`\${modelName} OMNi\`;
		}`,
      "segments omniroute suffix",
    );
    out = r.content;
    out = out.replace(
      `		if (((state.model?.provider === "omniroute/cx") || (state.model?.provider === "omniroute" && state.model?.id?.startsWith("cx/"))) && !/\\bOMNi\\b/.test(modelName)) {
			modelName = \`\${modelName} OMNi\`;
		}
		if (state.model?.provider === "omniroute/cx" && !/\\bOMNi\\b/.test(modelName)) {
			modelName = \`\${modelName} OMNi\`;
		}`,
      `		if (((state.model?.provider === "omniroute/cx") || (state.model?.provider === "omniroute" && state.model?.id?.startsWith("cx/"))) && !/\\bOMNi\\b/.test(modelName)) {
			modelName = \`\${modelName} OMNi\`;
		}`,
    );

    if (
      false && // 17.4.0 retired role/via display from segments.ts; role indicator removed
      !out.includes(
        `\t\tconst providerSuffix = modelName.endsWith(" OMNi") ? " OMNi" : "";`,
      )
    ) {
      r = replaceAny(
        out,
        [
          `\t\tlet content = withIcon(theme.icon.model, modelName);\n\t\treturn { content: theme.fg("statusLineModel", content), visible: true };`,
          `\t\tlet content = modelName;\n\t\tconst providerMatch = content.match(/^(.*) (OMNi)(.*)$/);\n\t\tconst modelContent = providerMatch\n\t\t\t? \`\${theme.fg("statusLineModel", providerMatch[1])} \${theme.fg("dim", providerMatch[2] + providerMatch[3])}\`\n\t\t\t: theme.fg("statusLineModel", content);\n\t\treturn { content: \`\${theme.fg("text", "via ")}\${modelContent}\`, visible: true };`,
          `\t\tlet content = withIcon(modelIcon, modelName);\n\t\tif (ctx.session.isAdvisorActive()) {\n\t\t\tcontent += theme.fg("success", "++");\n\t\t}\n\t\tif (tail) {\n\t\t\tcontent += tail;\n\t\t}\n\t\tconst providerMatch = content.match(/^(.*) (OMNi)(.*)$/);\n\t\tconst modelContent = providerMatch\n\t\t\t? \`\${theme.fg("statusLineModel", providerMatch[1])} \${theme.fg("dim", providerMatch[2] + providerMatch[3])}\`\n\t\t\t: theme.fg("statusLineModel", content);\n\t\treturn { content: \`\${theme.fg("text", "via ")}\${modelContent}\`, visible: true };`,
          `\t\t// \`statusLineModel\` is aliased to \`accent\` in many themes, so the badge\n\t\t// uses \`success\` to stay visibly distinct from the model name color.\n\t\tlet content = theme.fg("statusLineModel", withIcon(theme.icon.model, modelName));\n\t\tif (ctx.session.isAdvisorActive()) {\n\t\t\tcontent += theme.fg("success", "++");\n\t\t}\n\t\tif (tail) {\n\t\t\tcontent += theme.fg("statusLineModel", tail);\n\t\t}\n\n\t\treturn { content, visible: true };`,
          `\t\t// \`statusLineModel\` is aliased to \`accent\` in many themes, so the badge\n\t\t// uses \`success\` to stay visibly distinct from the model name color.\n\t\tlet content = theme.fg("statusLineModel", withIcon(modelIcon, modelName));\n\t\tif (ctx.session.isAdvisorActive()) {\n\t\t\tcontent += theme.fg("success", "++");\n\t\t}\n\t\tif (tail) {\n\t\t\tcontent += theme.fg("statusLineModel", tail);\n\t\t}\n\n\t\treturn { content, visible: true };`,

          `// \`statusLineModel\` is aliased to \`accent\` in many themes, so the badge\n\t\t// uses status colors to stay visibly distinct from the model name color.\n\t\tlet content = theme.fg("statusLineModel", withIcon(modelIcon, modelName));\n\t\t// Advisor "++" badge, colored by the worst status in the roster:\n\t\t// success = all running, warning = quota-exhausted, error = failed,\n\t\t// dim = everything paused/no-model. Per-advisor detail lives in\n\t\t// \`/advisor status\`.\n\t\t// Optional chaining: lightweight session doubles (test mocks) that don't\n\t\t// implement getAdvisorStatusOverview skip the badge instead of crashing.\n\t\tconst advisorStats = ctx.session.getAdvisorStatusOverview?.();\n\t\tif (advisorStats?.configured && advisorStats.advisors.length > 0) {\n\t\t\tconst statuses = advisorStats.advisors.map(a => a.status);\n\t\t\tconst badgeColor = statuses.includes("error")\n\t\t\t\t? "error"\n\t\t\t\t: statuses.includes("quota_exhausted")\n\t\t\t\t\t? "warning"\n\t\t\t\t\t: statuses.includes("running")\n\t\t\t\t\t\t? "success"\n\t\t\t\t\t\t: "dim";\n\t\t\tcontent += theme.fg(badgeColor, "++");\n\t\t}\n\t\tif (tail) {\n\t\t\tcontent += theme.fg("statusLineModel", tail);\n\t\t}\n\n\t\treturn { content, visible: true };`,
        ],
        `\t\tlet content = withIcon(modelIcon, modelName);\n\t\tif (ctx.session.isAdvisorActive()) {\n\t\t\tcontent += theme.fg("success", "++");\n\t\t}\n\t\tif (tail) {\n\t\t\tcontent += tail;\n\t\t}\n\t\tconst providerMatch = content.match(/^(.*) (OMNi)(.*)$/);\n\t\tconst modelContent = providerMatch\n\t\t\t? \`\${theme.fg("statusLineModel", providerMatch[1])} \${theme.fg("dim", providerMatch[2] + providerMatch[3])}\`\n\t\t\t: theme.fg("statusLineModel", content);\n\t\tconst roleColors = { smol: "statusLineSpend", default: "success", slow: "warning" } as const;\n\t\tconst roles = (["smol", "default", "slow"] as const).filter(role => {\n\t\t\tconst resolved = resolveModelRoleValue(\n\t\t\t\tctx.session.settings.getModelRole(role),\n\t\t\t\tctx.session.modelRegistry.getAvailable(),\n\t\t\t\t{ settings: ctx.session.settings },\n\t\t\t).model;\n\t\t\treturn resolved?.provider === state.model?.provider && resolved.id === state.model?.id;\n\t\t});\n\t\tconst roleContent = roles.length\n\t\t\t? \` \${roles.map(role => theme.fg(roleColors[role], role)).join("/")}\`\n\t\t\t: "";\n\t\treturn { content: \`\${theme.fg("text", "via ")}\${modelContent}\${roleContent}\`, visible: true };`,
        "segments model display via",
      );
      out = r.content;
    }
    if (
      out.includes(`\t\tlet content = withIcon(modelIcon, modelName);`) &&
      !out.includes(
        `\t\tconst providerSuffix = modelName.endsWith(" OMNi") ? " OMNi" : "";`,
      )
    ) {
      r = insertBefore(
        out,
        `\t\tlet content = withIcon(modelIcon, modelName);`,
        `\t\tconst providerSuffix = modelName.endsWith(" OMNi") ? " OMNi" : "";\n\t\tif (providerSuffix) modelName = modelName.slice(0, -providerSuffix.length);\n\t\tif (thinkingDisplay) {\n\t\t\tconst parts = thinkingDisplay.trim().split(/\\s+/);\n\t\t\tconst symbol = parts.shift() ?? "";\n\t\t\tthinkingDisplay = theme.fg("statusLineSep", symbol) + (parts.length ? \` \${theme.fg("thinkingText", parts.join(" "))}\` : "");\n\t\t}\n\t\tif (tail) {\n\t\t\ttail = "";\n\t\t\tif (ctx.session.isFastModeActive() && theme.icon.fast) tail += \` \${theme.fg("dim", theme.icon.fast)}\`;\n\t\t\tif (!compact && thinkingDisplay) tail += \`\${theme.sep.dot}\${thinkingDisplay}\`;\n\t\t}\n`,
        "segments thinking label colors",
      );
      out = r.content;
      r = insertAfter(
        out,
        `\t\tif (tail) {\n\t\t\tcontent += tail;\n\t\t}`,
        `\t\tcontent += providerSuffix;\n`,
        "segments provider suffix after thinking",
      );
      out = r.content;
    }

    r = replaceAny(
      out,
      [
        `\t\tlet content = theme.fg("statusLineModel", withIcon(modelIcon, modelName));`,
        `\t\tlet content = \`\${theme.fg("text", "via ")}\${theme.fg("statusLineModel", withIcon(modelIcon, modelName))}\`;`,
        `\t\tconst providerSuffix = modelName.endsWith(" OMNi") ? " OMNi" : "";\n\t\tconst displayModelName = providerSuffix ? modelName.slice(0, -providerSuffix.length) : modelName;\n\t\tlet content = \`\${theme.fg("text", "via ")}\${theme.fg("statusLineModel", withIcon(modelIcon, displayModelName))}\${providerSuffix ? theme.fg("dim", providerSuffix) : ""}\`;`,
        `\t\tconst providerSuffix = modelName.endsWith(" OMNi") ? " OMNi" : "";\n\t\tconst displayModelName = providerSuffix ? modelName.slice(0, -providerSuffix.length) : modelName;\n\t\tconst modelId = state.model?.id ?? "";\n\t\tconst modelKey = state.model ? state.model.provider + "/" + modelId : "";\n\t\tconst modelRole = modelId\n\t\t\t? Object.entries(ctx.session.settings?.get("modelRoles") ?? {}).find(([, value]) =>\n\t\t\t\ttypeof value === "string" && (value.includes(modelKey) || value.includes(modelId)),\n\t\t\t)?.[0] ?? ""\n\t\t\t: "";\n\t\tlet content = \`\${theme.fg("text", "via ")}\${theme.fg("statusLineModel", withIcon(modelIcon, displayModelName))}\`;`,
        `\t\tconst providerSuffix = modelName.endsWith(" OMNi") ? " OMNi" : "";\n\t\tconst displayModelName = providerSuffix ? modelName.slice(0, -providerSuffix.length) : modelName;\n\t\tconst modelId = state.model?.id ?? "";\n\t\tconst modelKey = state.model ? state.model.provider + "/" + modelId : "";\n\t\tconst modelRoles = ctx.session.settings?.get("modelRoles") ?? {};\n\t\tconst modelRoleEntries = Object.entries(modelRoles).sort(([a], [b]) => (a === "default" ? -1 : b === "default" ? 1 : 0));\n\t\tconst modelRole = modelId\n\t\t\t? modelRoleEntries.find(([, value]) =>\n\t\t\t\ttypeof value === "string" && (value.includes(modelKey) || value.includes(modelId)),\n\t\t\t)?.[0] ?? ""\n\t\t\t: "";\n\t\tlet content = \`\${theme.fg("text", "via ")}\${theme.fg("statusLineModel", withIcon(modelIcon, displayModelName))}\`;`,
        `\t\t// \`statusLineModel\` is aliased to \`accent\` in many themes, so the badge\n\t\t// uses status colors to stay visibly distinct from the model name color.\n\t\tconst providerSuffix = modelName.endsWith(" OMNi") ? " OMNi" : "";\n\t\tconst displayModelName = providerSuffix ? modelName.slice(0, -providerSuffix.length) : modelName;\n\t\tlet content = \`\${theme.fg("text", "via ")}\${theme.fg("statusLineModel", withIcon(modelIcon, displayModelName))}\`;`,
        `\t\tconst providerSuffix = modelName.endsWith(" OMNi") ? " OMNi" : "";\n\t\tconst displayModelName = providerSuffix ? modelName.slice(0, -providerSuffix.length) : modelName;\n\t\tlet content = \`\${theme.fg("text", "via ")}\${theme.fg("statusLineModel", withIcon(modelIcon, displayModelName))}\`;\n\t\tif (ctx.session.isAdvisorActive()) {\n\t\t\tcontent += theme.fg("success", "++");\n\t\t}`,
      ],
      `\t\tconst providerSuffix = modelName.endsWith(" OMNi") ? " OMNi" : "";\n\t\tconst displayModelName = providerSuffix ? modelName.slice(0, -providerSuffix.length) : modelName;\n\t\tlet content = \`\${theme.fg("text", "via ")}\${theme.fg("statusLineModel", withIcon(modelIcon, displayModelName))}\`;\n\t\tif (ctx.session.isAdvisorActive()) {\n\t\t\tcontent += theme.fg("success", "++");\n\t\t}`,
      "segments model via prefix and provider setup",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\t\tif (tail) {\n\t\t\tcontent += theme.fg("statusLineModel", tail);\n\t\t}`,
        `\t\tif (tail) {\n\t\t\tcontent += theme.fg("dim", tail);\n\t\t}`,
        `\t\tif (tail) {\n\t\t\tcontent += theme.fg("dim", tail);\n\t\t}\n\t\tif (providerSuffix) {\n\t\t\tcontent += theme.fg("dim", providerSuffix);\n\t\t}\n\t\tif (modelRole) {\n\t\t\tcontent += theme.fg("statusLineModel", " " + modelRole);\n\t\t}`,
      ],
      `\t\tif (tail) {\n\t\t\tconst tailMatch = tail.match(/^(.*\\s)(\\S+)$/);\n\t\t\tcontent += tailMatch ? theme.fg("dim", tailMatch[1]) + theme.fg("text", tailMatch[2]) : theme.fg("dim", tail);\n\t\t}\n\t\tif (providerSuffix) {\n\t\t\tcontent += theme.fg("dim", providerSuffix);\n\t\t}`,
      "segments dim thinking glyph and white level",
    );
    out = r.content;

    out = out.replace(
      `\t\tif (providerSuffix) {\n\t\t\tcontent += theme.fg("dim", providerSuffix);\n\t\t}\n\t\tif (modelRole) {\n\t\t\tcontent += theme.fg("statusLineModel", " " + modelRole);\n\t\t}\n`,
      "",
    );
    r = replaceAny(
      out,
      [
        `\t\t// Compact mode swaps the model icon for the thinking-level glyph and drops\n\t\t// the " · <level>" tail, keeping the level visible as a single icon.`,
      ],
      `\t\tif (!ctx.session.isAutoThinking && thinkingDisplay) {\n\t\t\tconst thinkingLabel = thinkingDisplay.trim().split(/\\s+/).at(-1)?.toLowerCase();\n\t\t\tconst modelWords = modelName.toLowerCase().split(/[^a-z0-9]+/);\n\t\t\tif (thinkingLabel && modelWords.includes(thinkingLabel)) {\n\t\t\t\tthinkingDisplay = "";\n\t\t\t}\n\t\t}\n\n\t\t// Compact mode swaps the model icon for the thinking-level glyph and drops\n\t\t// the " · <level>" tail, keeping the level visible as a single icon.`,
      "segments hide duplicate thinking label",
    );
    out = r.content;

    r = replaceAny(
      out,
      [
        `\t\tconst color = getContextUsageThemeColor(getContextUsageLevel(pct ?? 0, window));`,
        `\t\tconst color = (pct ?? 0) >= 80 ? "error" : (pct ?? 0) >= 50 ? "warning" : "statusLineContext";`,
      ],
      `\t\tconst color = (pct ?? 0) >= 80 ? "error" : (pct ?? 0) >= 50 ? "warning" : "statusLineContext";`,
      "segments context percentage colors",
    );
    out = r.content;

    const oldGit = `const gitSegment: StatusLineSegment = {\n\tid: "git",\n\trender(ctx) {\n\t\tconst { branch, status } = ctx.git;\n\t\tif (!branch && !status) return { content: "", visible: false };\n\n\t\tconst opts = ctx.options.git ?? {};\n\t\tconst gitStatus = status;\n\t\tconst isDirty = gitStatus && (gitStatus.staged > 0 || gitStatus.unstaged > 0 || gitStatus.untracked > 0);\n\n\t\tconst showBranch = opts.showBranch !== false;\n\t\tlet content = "";\n\t\tif (showBranch && branch) {\n\t\t\tcontent = withIcon(theme.icon.branch, branch);\n\t\t}\n\n\t\t// Add status indicators\n\t\tif (gitStatus) {\n\t\t\tconst indicators: string[] = [];\n\t\t\tif (opts.showUnstaged !== false && gitStatus.unstaged > 0) {\n\t\t\t\tindicators.push(theme.fg("statusLineDirty", \`*\${gitStatus.unstaged}\`));\n\t\t\t}\n\t\t\tif (opts.showStaged !== false && gitStatus.staged > 0) {\n\t\t\t\tindicators.push(theme.fg("statusLineStaged", \`+\${gitStatus.staged}\`));\n\t\t\t}\n\t\t\tif (opts.showUntracked !== false && gitStatus.untracked > 0) {\n\t\t\t\tindicators.push(theme.fg("statusLineUntracked", \`?\${gitStatus.untracked}\`));\n\t\t\t}\n\t\t\tif (indicators.length > 0) {\n\t\t\t\tconst indicatorText = indicators.join(" ");\n\t\t\t\tif (!content && showBranch === false) {\n\t\t\t\t\tcontent = withIcon(theme.icon.git, indicatorText);\n\t\t\t\t} else {\n\t\t\t\t\tcontent += content ? \` \${indicatorText}\` : indicatorText;\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\tif (!content) return { content: "", visible: false };\n\n\t\treturn { content: theme.fg(isDirty ? "statusLineGitDirty" : "statusLineGitClean", content), visible: true };\n\t},\n};`;
    const upstreamGitWithColorName = `const gitSegment: StatusLineSegment = {
	id: "git",
	render(ctx) {
		const { branch, status } = ctx.git;
		if (!branch && !status) return { content: "", visible: false };

		const opts = ctx.options.git ?? {};
		const gitStatus = status;
		const isDirty = gitStatus && (gitStatus.staged > 0 || gitStatus.unstaged > 0 || gitStatus.untracked > 0);

		const showBranch = opts.showBranch !== false;
		let content = "";
		if (showBranch && branch) {
			content = withIcon(theme.icon.branch, branch);
		}

		// Add status indicators
		if (gitStatus) {
			const indicators: string[] = [];
			if (opts.showUnstaged !== false && gitStatus.unstaged > 0) {
				indicators.push(theme.fg("statusLineDirty", \`*\${gitStatus.unstaged}\`));
			}
			if (opts.showStaged !== false && gitStatus.staged > 0) {
				indicators.push(theme.fg("statusLineStaged", \`+\${gitStatus.staged}\`));
			}
			if (opts.showUntracked !== false && gitStatus.untracked > 0) {
				indicators.push(theme.fg("statusLineUntracked", \`?\${gitStatus.untracked}\`));
			}
			if (indicators.length > 0) {
				const indicatorText = indicators.join(" ");
				if (!content && showBranch === false) {
					content = withIcon(theme.icon.git, indicatorText);
				} else {
					content += content ? \` \${indicatorText}\` : indicatorText;
				}
			}
		}

		if (!content) return { content: "", visible: false };

		const colorName = isDirty ? "statusLineGitDirty" : "statusLineGitClean";
		return { content: theme.fg(colorName, content), visible: true };
	},
};`;
    const newGit = `const gitSegment: StatusLineSegment = {\n\tid: "git",\n\trender(ctx) {\n\t\tconst { branch, status, remote } = ctx.git;\n\t\tif (!branch && !status && !remote) return { content: "", visible: false };\n\n\t\tconst opts = ctx.options.git ?? {};\n\t\tconst gitStatus = status;\n\t\tconst showBranch = opts.showBranch !== false;\n\t\tlet content = "";\n\t\tif (showBranch && branch) {\n\t\t\tcontent = withIcon(theme.icon.branch, branch);\n\t\t}\n\n\t\tconst parts: string[] = [];\n\t\tif (remote && opts.showAheadBehind !== false) {\n\t\t\tif (remote.ahead > 0) parts.push(theme.fg("statusLineStaged", \`↑\${remote.ahead}\`));\n\t\t\tif (remote.behind > 0) parts.push(theme.fg("statusLineDirty", \`↓\${remote.behind}\`));\n\t\t}\n\n\t\tif (gitStatus) {\n\t\t\tconst dirtyParts: string[] = [];\n\t\t\tif (opts.showUnstaged !== false && gitStatus.unstaged > 0) {\n\t\t\t\tdirtyParts.push(opts.compactDirty === true ? "!" : \`*\${gitStatus.unstaged}\`);\n\t\t\t}\n\t\t\tif (opts.showStaged !== false && gitStatus.staged > 0) {\n\t\t\t\tdirtyParts.push(opts.compactDirty === true ? "+" : \`+\${gitStatus.staged}\`);\n\t\t\t}\n\t\t\tif (opts.showUntracked !== false && gitStatus.untracked > 0) {\n\t\t\t\tdirtyParts.push(opts.compactDirty === true ? "?" : \`?\${gitStatus.untracked}\`);\n\t\t\t}\n\t\t\tif (dirtyParts.length > 0) {\n\t\t\t\tconst dirtyText = opts.compactDirty === true ? \`[\${dirtyParts.join("")}]\` : dirtyParts.join(" ");\n\t\t\t\tparts.push(theme.fg("statusLineDirty", dirtyText));\n\t\t\t}\n\t\t}\n\n\t\tif (parts.length > 0) {\n\t\t\tconst indicatorText = parts.join(" ");\n\t\t\tif (!content && showBranch === false) {\n\t\t\t\tcontent = withIcon(theme.icon.git, indicatorText);\n\t\t\t} else {\n\t\t\t\tcontent += content ? \` \${indicatorText}\` : indicatorText;\n\t\t\t}\n\t\t}\n\n\t\tif (!content) return { content: "", visible: false };\n\n\t\treturn { content: \`\${theme.fg("text", "on ")}\${theme.fg("statusLineGitClean", content)}\`, visible: true };\n\t},\n};`;
    r = replaceAny(
      out,
      [oldGit, upstreamGitWithColorName, newGit],
      newGit,
      "segments compact git renderer",
    );
    out = r.content;

    const upstreamSessionName15_8 = `const sessionNameSegment: StatusLineSegment = {\n\tid: "session_name",\n\trender(ctx) {\n\t\tconst sessionManager = ctx.session.sessionManager;\n\t\tconst name = sessionManager?.getSessionName();\n\t\tif (!name) return { content: "", visible: false };\n\n\t\tconst ansi = getSessionAccentAnsi(getSessionAccentHex(name)) ?? theme.getFgAnsi("accent");\n\t\treturn { content: \`\${ansi}\${sanitizeStatusText(name)}\\x1b[39m\`, visible: true };\n\t},\n};`;
    const upstreamSessionName15_9 = `const sessionNameSegment: StatusLineSegment = {\n\tid: "session_name",\n\trender(ctx) {\n\t\tconst sessionManager = ctx.session.sessionManager;\n\t\tconst name = sessionManager?.getSessionName();\n\t\tif (!name) return { content: "", visible: false };\n\n\t\tconst ansi =\n\t\t\tgetSessionAccentAnsi(getSessionAccentHex(name, theme.accentSurfaceLuminance)) ?? theme.getFgAnsi("accent");\n\t\treturn { content: \`\${ansi}\${sanitizeStatusText(name)}\\x1b[39m\`, visible: true };\n\t},\n};`;
    const upstreamSessionName15_12 = `const sessionNameSegment: StatusLineSegment = {\n\tid: \"session_name\",\n\trender(ctx) {\n\t\tconst sessionManager = ctx.session.sessionManager;\n\t\tconst name = sessionManager?.getSessionName();\n\t\tif (!name) return { content: \"\", visible: false };\n\n\t\tconst ansi =\n\t\t\tgetSessionAccentAnsi(\n\t\t\t\tgetSessionAccentHex(name, theme.getMajorThemeColorHexes(), theme.accentSurfaceLuminance),\n\t\t\t) ?? theme.getFgAnsi(\"accent\");\n\t\treturn { content: \`\${ansi}\${sanitizeStatusText(name)}\\x1b[39m\`, visible: true };\n\t},\n};`;
    const upstreamSessionName17_2_11 = `const sessionNameSegment: StatusLineSegment = {\n\tid: "session_name",\n\trender(ctx) {\n\t\tconst sessionManager = ctx.session.sessionManager;\n\t\tconst name = sessionManager?.getSessionName();\n\t\tif (!name) return { content: "", visible: false };\n\n\t\tconst accentEnabled = ctx.sessionAccent !== false;\n\t\tconst ansi = accentEnabled\n\t\t\t? (getSessionAccentAnsi(\n\t\t\t\t\tgetSessionAccentHex(name, theme.getMajorThemeColorHexes(), theme.accentSurfaceLuminance),\n\t\t\t\t) ?? theme.getFgAnsi("accent"))\n\t\t\t: theme.getFgAnsi("accent");\n\t\treturn { content: \`\${ansi}\${sanitizeStatusText(name)}\\x1b[39m\`, visible: true };\n\t},\n};`;
    const upstreamSessionName17_4 = `const sessionNameSegment: StatusLineSegment = {
	id: "session_name",
	render(ctx) {
		const sessionManager = ctx.session.sessionManager;
		const name = sessionManager?.getSessionName() || ctx.previewTitle;
		if (!name) return { content: "", visible: false };

		const accentEnabled = ctx.sessionAccent !== false;
		const ansi = accentEnabled
			? (getSessionAccentAnsi(
					getSessionAccentHex(name, theme.getMajorThemeColorHexes(), theme.accentSurfaceLuminance),
				) ?? theme.getFgAnsi("accent"))
			: theme.getFgAnsi("accent");
		return { content: \`\${ansi}\${sanitizeStatusText(name)}\\x1b[39m\`, visible: true };
	},
};`;
    const accentedLimitedSessionName = `const sessionNameSegment: StatusLineSegment = {\n\tid: "session_name",\n\trender(ctx) {\n\t\tconst sessionManager = ctx.session.sessionManager;\n\t\tconst name = sessionManager?.getSessionName();\n\t\tif (!name) return { content: "", visible: false };\n\n\t\tconst maxSessionNameWidth = 24;\n\t\tconst cleanName = sanitizeStatusText(name);\n\t\tconst display = visibleWidth(cleanName) > maxSessionNameWidth ? truncateToWidth(cleanName, maxSessionNameWidth) : cleanName;\n\n\t\tconst ansi = getSessionAccentAnsi(getSessionAccentHex(name)) ?? theme.getFgAnsi("accent");\n\t\treturn { content: \`\${ansi}\${display}\\x1b[39m\`, visible: true };\n\t},\n};`;
    const limitedSessionName = `const sessionNameSegment: StatusLineSegment = {\n\tid: "session_name",\n\trender(ctx) {\n\t\tconst sessionName = ctx.session.sessionManager?.getSessionName();\n\t\tconst name = sessionName || ctx.previewTitle;\n\t\tif (!name) return { content: "", visible: false };\n\n\t\tconst maxSessionNameWidth = 48;\n\t\tconst cleanName = sanitizeStatusText(name);\n\t\tconst display = visibleWidth(cleanName) > maxSessionNameWidth ? truncateToWidth(cleanName, maxSessionNameWidth) : cleanName;\n\n\t\treturn { content: \`\${theme.fg("muted", display)}  \`, visible: true };\n\t},\n};`;

    r = replaceAny(
      out,
      [
        upstreamSessionName15_8,
        upstreamSessionName15_9,
        upstreamSessionName15_12,
        upstreamSessionName17_2_11,
        upstreamSessionName17_4,
        accentedLimitedSessionName,
        limitedSessionName,
      ],
      limitedSessionName,
      "segments session name max width",
    );
    out = r.content;

    return out;
  }

  return {
    patchStatusLineTs,
    patchStatusTypes,
    patchSegments,
  };
}

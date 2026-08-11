export function patchRejudgeAgentIds(content, { replaceAny }) {
  let out = content;
  let r;

  r = replaceAny(
    out,
    [
      `  const cwd = options.cwd ?? process.cwd();
  const { resourceLoader, settingsManager } = innerResourceLoader(cwd);`,
    ],
    `  const cwd = options.cwd ?? process.cwd();
  const roleKey = options.roleKey ?? (options.role === "judge" ? JUDGE_ROLE_KEY : panelRoleKey(0));
  const { resourceLoader, settingsManager } = innerResourceLoader(cwd);`,
    "rejudge inner agent role key",
  );
  out = r.content;

  if (out.includes('    agentId: `Rejudge-${roleKey}`')) {
    return out;
  }

  r = replaceAny(
    out,
    [
      `    thinkingLevel: options.thinkingLevel ?? "xhigh",
    sessionManager: options.sessionManager ?? SessionManager.inMemory(cwd)
  });`,
    ],
    `    thinkingLevel: options.thinkingLevel ?? "xhigh",
    sessionManager: options.sessionManager ?? SessionManager.inMemory(cwd),
    agentId: \`Rejudge-\${roleKey}\`,
    agentDisplayName: \`rejudge-\${roleKey}\`
  });`,
    "rejudge unique inner agent id",
  );
  out = r.content;

  return out;
}

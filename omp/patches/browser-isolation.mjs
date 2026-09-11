const QUTE_BROWSER_CDP = "http://127.0.0.1:9223";
const AGENT_TARGET = "OMP_AGENT_WINDOW_9f2c";

export function patchBrowserIsolation(content, { replaceAny }) {
  let out = replaceAny(
    content,
    [
      `const DEFAULT_TAB_NAME = "main";\nconst BROWSER_RUN_SCOPE`,
      `const DEFAULT_TAB_NAME = "main";\nconst QUTE_BROWSER_CDP`,
    ],
    `const DEFAULT_TAB_NAME = "main";\nconst QUTE_BROWSER_CDP = "http://127.0.0.1:9223";\nconst AGENT_TARGET = "OMP_AGENT_WINDOW_9f2c";\nconst BROWSER_RUN_SCOPE`,
    "qutebrowser agent constants",
  ).content;

  const unpatchedGuard = `\tconst kind = resolveBrowserKind(params, session);\n\tdetails.browser = kind.kind;`;
  const manualGuard = `\tconst kind = resolveBrowserKind(params, session);\n\tconst explicitRelay = params.app?.relay === true;\n\tconst validQutebrowser = kind.kind === "connected" && kind.cdpUrl === QUTE_BROWSER_CDP;\n\tconst validRelay = explicitRelay && kind.kind === "relay";\n\tif (!validQutebrowser && !validRelay) {\n\t\tthrow new ToolError(\n\t\t\t"Browser automation requires qutebrowser CDP 9223; Chrome/headless/cmux and implicit relay are disabled.",\n\t\t);\n\t}\n\tif (validQutebrowser && params.app?.target !== AGENT_TARGET) {\n\t\tthrow new ToolError(\n\t\t\t"Missing qutebrowser agent target. Open qutebrowser/bin/qutebrowser-agent and use app.target=OMP_AGENT_WINDOW_9f2c.",\n\t\t);\n\t}\n\tdetails.browser = kind.kind;`;
  const finalGuard = `\tconst kind = resolveBrowserKind(params, session);\n\tconst explicitRelay = params.app?.relay === true;\n\tconst validQutebrowser = kind.kind === "connected" && kind.cdpUrl === QUTE_BROWSER_CDP;\n\tconst validRelay = explicitRelay && kind.kind === "relay";\n\tif (!validQutebrowser && !validRelay) {\n\t\tthrow new ToolError(\n\t\t\t"Browser automation requires qutebrowser CDP 9223; Chrome/headless/cmux and implicit relay are disabled.",\n\t\t);\n\t}\n\tif (validQutebrowser && params.app?.target && params.app.target !== AGENT_TARGET) {\n\t\tthrow new ToolError(\n\t\t\t"qutebrowser automation only permits target=OMP_AGENT_WINDOW_9f2c.",\n\t\t);\n\t}\n\tconst browserTarget = validQutebrowser ? AGENT_TARGET : params.app?.target;\n\tdetails.browser = kind.kind;`;
  out = replaceAny(
    out,
    [unpatchedGuard, manualGuard, finalGuard],
    finalGuard,
    "qutebrowser backend and implicit agent target",
  ).content;
  out = replaceAny(
    out,
    [
      `\t\t\t\t\ttarget: params.app?.target,`,
      `\t\t\t\t\ttarget: browserTarget,`,
    ],
    `\t\t\t\t\ttarget: browserTarget,`,
    "qutebrowser effective agent target",
  ).content;
  return out;
}

export function patchBrowserAttach(content, { replaceAny }) {
  let out = replaceAny(
    content,
    [
      `export async function pickElectronTarget(\n\tbrowser: Browser,\n\toptions: { matcher?: string; preferVisible?: boolean } = {},\n): Promise<Page> {\n\tconst discoveredPages`,
      `export async function pickElectronTarget(\n\tbrowser: Browser,\n\toptions: { matcher?: string; preferVisible?: boolean } = {},\n): Promise<Page> {\n\tawait ensureQutebrowserAgentTarget(browser, options.matcher);\n\tconst discoveredPages`,
    ],
    `export async function pickElectronTarget(\n\tbrowser: Browser,\n\toptions: { matcher?: string; preferVisible?: boolean } = {},\n): Promise<Page> {\n\tawait ensureQutebrowserAgentTarget(browser, options.matcher);\n\tconst discoveredPages`,
    "automatic qutebrowser agent window creation",
  ).content;

  const helper = `let qutebrowserAgentTargetOpen: Promise<void> | undefined;

async function ensureQutebrowserAgentTarget(browser: Browser, matcher?: string): Promise<void> {
	if (matcher?.toLowerCase() !== "omp_agent_window_9f2c") return;
	if (!qutebrowserAgentTargetOpen) {
		qutebrowserAgentTargetOpen = ensureQutebrowserAgentTargetOnce(browser).finally(() => {
			qutebrowserAgentTargetOpen = undefined;
		});
	}
	await qutebrowserAgentTargetOpen;
}

async function ensureQutebrowserAgentTargetOnce(browser: Browser): Promise<void> {
	const hasTarget = async () => {
		for (const target of browser.targets()) {
			if (String(target.type()) !== "page") continue;
			const page = await target.page().catch(() => null);
			if (page && (await page.title().catch(() => "")).toLowerCase().includes("omp_agent_window_9f2c")) return true;
		}
		return false;
	};
	if (await hasTarget()) return;
	const child = Bun.spawn(["/Users/tim/dev/dotfiles/qutebrowser/bin/qutebrowser-agent"], {
		stdout: "ignore",
		stderr: "ignore",
	});
	child.unref();
	const deadline = Date.now() + 5_000;
	while (Date.now() < deadline) {
		if (await hasTarget()) return;
		await Bun.sleep(100);
	}
	throw new ToolError("Could not create the marked qutebrowser agent window");
}

`;
  if (!out.includes("async function ensureQutebrowserAgentTarget")) {
    out = out.replace(
      "export async function pickElectronTarget(",
      helper + "export async function pickElectronTarget(",
    );
  }
  out = replaceAny(
    out,
    [
      `\t\tconst hit = enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
      `\t\tconst hit = needle === "omp_agent_window_9f2c"\n\t\t\t? enriched.find(p => p.title.toLowerCase().includes(needle))\n\t\t\t: enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
    ],
    `\t\tconst hit = needle === "omp_agent_window_9f2c"\n\t\t\t? enriched.find(p => p.title.toLowerCase().includes(needle))\n\t\t\t: enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
    "qutebrowser persistent title marker matcher",
  ).content;
  out = replaceAny(
    out,
    [
      `return !target;`,
      `return !target || target === "OMP_AGENT_WINDOW_9f2c";`,
    ],
    `return !target || target === "OMP_AGENT_WINDOW_9f2c";`,
    "preserve qutebrowser agent focus",
  ).content;
  return out;
}

export function patchBrowserIsolation(content, { replaceAny }) {
  let out = replaceAny(
    content,
    [
      `const DEFAULT_TAB_NAME = "main";\nconst BROWSER_RUN_SCOPE`,
      `const DEFAULT_TAB_NAME = "main";\nconst QUTE_BROWSER_CDP`,
    ],
    `const DEFAULT_TAB_NAME = "main";\nconst QUTE_BROWSER_CDP = "http://127.0.0.1:9223";\nconst AGENT_TARGET = "OMP_AGENT_WINDOW_9f2c";\n\nfunction scopedBrowserTabName(ownerSessionId: string, displayName: string): string {\n\tif (!ownerSessionId) throw new ToolError("Browser automation requires a session id for tab isolation.");\n\tconst scope = createHash("sha256").update(ownerSessionId).digest("hex").slice(0, 16);\n\treturn \`__omp_session_\${scope}:\${displayName}\`;\n}\n\nconst BROWSER_RUN_SCOPE`,
    "qutebrowser agent constants",
  ).content;

  const downloadsLine = `\tconst downloadsPath = params.downloads === undefined ? undefined : resolveToCwd(params.downloads, session.cwd);\n`;
  const unpatchedGuard = `\tconst kind = resolveBrowserKind(params, session);\n\tdetails.browser = kind.kind;`;
  const upstream1828Guard = `\tconst kind = resolveBrowserKind(params, session);\n${downloadsLine}\tdetails.browser = kind.kind;`;
  const manualGuard = `\tconst kind = resolveBrowserKind(params, session);\n\tconst explicitRelay = params.app?.relay === true;\n\tconst validQutebrowser = kind.kind === "connected" && kind.cdpUrl === QUTE_BROWSER_CDP;\n\tconst validRelay = explicitRelay && kind.kind === "relay";\n\tif (!validQutebrowser && !validRelay) {\n\t\tthrow new ToolError(\n\t\t\t"Browser automation requires qutebrowser CDP 9223; Chrome/headless/cmux and implicit relay are disabled.",\n\t\t);\n\t}\n\tif (validQutebrowser && params.app?.target !== AGENT_TARGET) {\n\t\tthrow new ToolError(\n\t\t\t"Missing qutebrowser agent target. Open qutebrowser/bin/qutebrowser-agent and use app.target=OMP_AGENT_WINDOW_9f2c.",\n\t\t);\n\t}\n\tdetails.browser = kind.kind;`;
  const finalGuard = `\tconst kind = resolveBrowserKind(params, session);\n\tconst explicitRelay = params.app?.relay === true;\n\tconst validQutebrowser = kind.kind === "connected" && kind.cdpUrl === QUTE_BROWSER_CDP;\n\tconst validRelay = explicitRelay && kind.kind === "relay";\n\tif (!validQutebrowser && !validRelay) {\n\t\tthrow new ToolError(\n\t\t\t"Browser automation requires qutebrowser CDP 9223; Chrome/headless/cmux and implicit relay are disabled.",\n\t\t);\n\t}\n\tif (validQutebrowser && params.app?.target && params.app.target !== AGENT_TARGET) {\n\t\tthrow new ToolError(\n\t\t\t"qutebrowser automation only permits target=OMP_AGENT_WINDOW_9f2c.",\n\t\t);\n\t}\n\tconst browserTarget = validQutebrowser ? AGENT_TARGET : params.app?.target;\n\tdetails.browser = kind.kind;`;
  const finalGuard1828 = finalGuard.replace(
    `\tconst browserTarget = validQutebrowser ? AGENT_TARGET : params.app?.target;\n\tdetails.browser = kind.kind;`,
    `\tconst browserTarget = validQutebrowser ? AGENT_TARGET : params.app?.target;\n${downloadsLine}\tdetails.browser = kind.kind;`,
  );
  const guardOpenOnKindShape = `\tconst downloadsPath = params.downloads === undefined ? undefined : resolveToCwd(params.downloads, session.cwd);\n\tdetails.browser = kind.kind;`;
  const guardOpenOnKind = `\tconst explicitRelay = params.app?.relay === true;\n\tconst validQutebrowser = kind.kind === "connected" && kind.cdpUrl === QUTE_BROWSER_CDP;\n\tconst validRelay = explicitRelay && kind.kind === "relay";\n\tif (!validQutebrowser && !validRelay) {\n\t\tthrow new ToolError(\n\t\t\t"Browser automation requires qutebrowser CDP 9223; Chrome/headless/cmux and implicit relay are disabled.",\n\t\t);\n\t}\n\tif (validQutebrowser && params.app?.target && params.app.target !== AGENT_TARGET) {\n\t\tthrow new ToolError(\n\t\t\t"qutebrowser automation only permits target=OMP_AGENT_WINDOW_9f2c.",\n\t\t);\n\t}\n\tconst browserTarget = validQutebrowser ? AGENT_TARGET : params.app?.target;\n${guardOpenOnKindShape}`;
  if (out.includes(guardOpenOnKindShape) && !out.includes(guardOpenOnKind)) {
    out = replaceAny(
      out,
      [guardOpenOnKindShape],
      guardOpenOnKind,
      "qutebrowser backend and implicit agent target (openOnKind)",
    ).content;
  } else if (!out.includes(guardOpenOnKind) && !out.includes(finalGuard1828)) {
    out = replaceAny(
      out,
      [
        upstream1828Guard,
        unpatchedGuard,
        manualGuard,
        finalGuard,
        finalGuard1828,
      ],
      finalGuard1828,
      "qutebrowser backend and implicit agent target",
    ).content;
  }
  out = replaceAny(
    out,
    [
      `\t\t\t\t\ttarget: params.app?.target,`,
      `\t\t\t\t\ttarget: browserTarget,`,
    ],
    `\t\t\t\t\ttarget: browserTarget,`,
    "qutebrowser effective agent target",
  ).content;
  out = replaceAny(
    out,
    [
      `import { type } from "@oh-my-pi/omptype";`,
      `import { createHash } from "node:crypto";\nimport { type } from "@oh-my-pi/omptype";`,
    ],
    `import { createHash } from "node:crypto";\nimport { type } from "@oh-my-pi/omptype";`,
    "browser session scope hash import",
  ).content;
  out = replaceAny(
    out,
    [
      `\treleaseIdleTabsForOwner,\n\treleaseTab,`,
      `\treleaseIdleTabsForOwner,\n\treleaseTab,\n\treleaseTabsForOwner,`,
    ],
    `\treleaseIdleTabsForOwner,\n\treleaseTab,\n\treleaseTabsForOwner,`,
    "browser release owner import",
  ).content;
  out = replaceAny(
    out,
    [
      `const AGENT_TARGET = "OMP_AGENT_WINDOW_9f2c";\n\nconst BROWSER_RUN_SCOPE`,
      `const AGENT_TARGET = "OMP_AGENT_WINDOW_9f2c";\n\nfunction scopedBrowserTabName(ownerSessionId: string, displayName: string): string {\n\tif (!ownerSessionId) throw new ToolError("Browser automation requires a session id for tab isolation.");\n\tconst scope = createHash("sha256").update(ownerSessionId).digest("hex").slice(0, 16);\n\treturn \`__omp_session_\${scope}:\${displayName}\`;\n}\n\nconst BROWSER_RUN_SCOPE`,
    ],
    `const AGENT_TARGET = "OMP_AGENT_WINDOW_9f2c";\n\nfunction scopedBrowserTabName(ownerSessionId: string, displayName: string): string {\n\tif (!ownerSessionId) throw new ToolError("Browser automation requires a session id for tab isolation.");\n\tconst scope = createHash("sha256").update(ownerSessionId).digest("hex").slice(0, 16);\n\treturn \`__omp_session_\${scope}:\${displayName}\`;\n}\n\nconst BROWSER_RUN_SCOPE`,
    "browser session-scoped tab helper",
  ).content;
  out = replaceAny(
    out,
    [
      `\t\tconst name = parsed.name ?? DEFAULT_TAB_NAME;\n\t\tconst details: BrowserPreludeDetails = { action: parsed.action, name };`,
      `\t\tconst displayName = parsed.name ?? DEFAULT_TAB_NAME;\n\t\tconst ownerSessionId = session.getSessionId?.();\n\t\tif (!ownerSessionId) throw new ToolError("Browser automation requires a session id for tab isolation.");\n\t\tconst name = scopedBrowserTabName(ownerSessionId, displayName);\n\t\tconst details: BrowserPreludeDetails = { action: parsed.action, name: displayName };`,
    ],
    `\t\tconst displayName = parsed.name ?? DEFAULT_TAB_NAME;\n\t\tconst ownerSessionId = session.getSessionId?.();\n\t\tif (!ownerSessionId) throw new ToolError("Browser automation requires a session id for tab isolation.");\n\t\tconst name = scopedBrowserTabName(ownerSessionId, displayName);\n\t\tconst details: BrowserPreludeDetails = { action: parsed.action, name: displayName };`,
    "browser session-scoped default tab name",
  ).content;
  out = replaceAny(
    out,
    [
      `\t\t\t\t\townerSessionId: session.getSessionId?.() ?? undefined,\n\t\t\t\t\t// Omitted stays undefined: creation defaults it to false`,
      `\t\t\t\t\townerSessionId: session.getSessionId?.() ?? undefined,\n\t\t\t\t\tdisplayName: details.name,\n\t\t\t\t\t// Omitted stays undefined: creation defaults it to false`,
    ],
    `\t\t\t\t\townerSessionId: session.getSessionId?.() ?? undefined,\n\t\t\t\t\tdisplayName: details.name,\n\t\t\t\t\t// Omitted stays undefined: creation defaults it to false`,
    "browser display name to tab supervisor",
  ).content;
  if (
    out.includes(
      "async function openBrowser(\n\tsession: ToolSession,\n\townerSessionId: string,",
    )
  ) {
    out = replaceAny(
      out,
      [
        `\t\t\tcase "open":\n\t\t\t\treturn await openBrowser(session, name, parsed, details, timeoutMs, context.signal);`,
        `\t\t\tcase "open":\n\t\t\t\treturn await openBrowser(session, name, displayName, parsed, details, timeoutMs, context.signal);`,
        `\t\t\tcase "open":\n\t\t\t\treturn await openBrowser(session, ownerSessionId, name, displayName, parsed, details, timeoutMs, context.signal);`,
      ],
      `\t\t\tcase "open":\n\t\t\t\treturn await openBrowser(session, ownerSessionId, name, displayName, parsed, details, timeoutMs, context.signal);`,
      "browser open display name call",
    ).content;
    out = replaceAny(
      out,
      [
        `\t\t\tcase "close":\n\t\t\t\treturn await closeBrowser(name, parsed, details, timeoutMs, context.signal);\n\t\t\tcase "tabs":\n\t\t\t\tdetails.value = listTabs();`,
        `\t\t\tcase "close":\n\t\t\t\treturn await closeBrowser(ownerSessionId, name, displayName, parsed, details, timeoutMs, context.signal);\n\t\t\tcase "tabs":\n\t\t\t\tdetails.value = listTabs(ownerSessionId);`,
      ],
      `\t\t\tcase "close":\n\t\t\t\treturn await closeBrowser(ownerSessionId, name, displayName, parsed, details, timeoutMs, context.signal);\n\t\t\tcase "tabs":\n\t\t\t\tdetails.value = listTabs(ownerSessionId);`,
      "browser session-filtered close/tabs",
    ).content;
    out = replaceAny(
      out,
      [
        `async function openBrowser(\n\tsession: ToolSession,\n\tname: string,\n\tparams: BrowserParams,`,
        `async function openBrowser(\n\tsession: ToolSession,\n\tname: string,\n\tdisplayName: string,\n\tparams: BrowserParams,`,
        `async function openBrowser(\n\tsession: ToolSession,\n\townerSessionId: string,\n\tname: string,\n\tdisplayName: string,\n\tparams: BrowserParams,`,
      ],
      `async function openBrowser(\n\tsession: ToolSession,\n\townerSessionId: string,\n\tname: string,\n\tdisplayName: string,\n\tparams: BrowserParams,`,
      "browser open display name parameter",
    ).content;
    out = replaceAny(
      out,
      [
        `\t\t\t\t\townerSessionId: session.getSessionId?.() ?? undefined,`,
        `\t\t\t\t\townerSessionId: session.getSessionId?.() ?? undefined,\n\t\t\t\t\tdisplayName,`,
        `\t\t\t\t\townerSessionId,`,
        `\t\t\t\t\townerSessionId,\n\t\t\t\t\tdisplayName,`,
      ],
      `\t\t\t\t\townerSessionId,\n\t\t\t\t\tdisplayName,`,
      "browser display name to tab supervisor",
    ).content;
    out = replaceAny(
      out,
      [
        `\t\t\t\`\${verb} tab \${JSON.stringify(name)} on \${describeBrowser(browser)}\`,`,
        `\t\t\t\`\${verb} tab \${JSON.stringify(displayName)} on \${describeBrowser(browser)}\`,`,
      ],
      `\t\t\t\`\${verb} tab \${JSON.stringify(displayName)} on \${describeBrowser(browser)}\`,`,
      "browser open text display name",
    ).content;
    out = replaceAny(
      out,
      [
        `async function closeBrowser(\n\tname: string,\n\tparams: BrowserParams,`,
        `async function closeBrowser(\n\townerSessionId: string,\n\tname: string,\n\tdisplayName: string,\n\tparams: BrowserParams,`,
      ],
      `async function closeBrowser(\n\townerSessionId: string,\n\tname: string,\n\tdisplayName: string,\n\tparams: BrowserParams,`,
      "browser close display name parameters",
    ).content;
    out = replaceAny(
      out,
      [
        `\tif (params.all) {\n\t\tconst count = await untilAborted(signal, () => releaseAllTabs({ kill, timeoutMs }));`,
        `\tif (params.all) {\n\t\tconst count = await untilAborted(signal, () => releaseTabsForOwner(ownerSessionId, { kill, timeoutMs }));`,
      ],
      `\tif (params.all) {\n\t\tconst count = await untilAborted(signal, () => releaseTabsForOwner(ownerSessionId, { kill, timeoutMs }));`,
      "browser close all session scoped",
    ).content;
    out = replaceAny(
      out,
      [
        `\tconst text = closed ? \`Released managed tab \${JSON.stringify(name)}\` : \`No tab named \${JSON.stringify(name)}\`;`,
        `\tconst text = closed ? \`Released managed tab \${JSON.stringify(displayName)}\` : \`No tab named \${JSON.stringify(displayName)}\`;`,
      ],
      `\tconst text = closed ? \`Released managed tab \${JSON.stringify(displayName)}\` : \`No tab named \${JSON.stringify(displayName)}\`;`,
      "browser close text display name",
    ).content;
    out = replaceAny(
      out,
      [
        `\tconst tab = getTab(name);\n\tif (tab) {`,
        `\tconst tab = getTab(name);\n\tif (!tab) throw new ToolError(\`Tab \${JSON.stringify(details.name)} is not alive. Open it first with action:\"open\".\`);\n\tif (tab) {`,
      ],
      `\tconst tab = getTab(name);\n\tif (!tab) throw new ToolError(\`Tab \${JSON.stringify(details.name)} is not alive. Open it first with action:\"open\".\`);\n\tif (tab) {`,
      "browser run missing display name",
    ).content;
  }
  return out;
}

export function patchBrowserAttach(content, { replaceAny }) {
  let out = replaceAny(
    content,
    [
      `import * as fs from "node:fs/promises";\nimport * as net from "node:net";`,
      `import { createHash } from "node:crypto";\nimport * as fs from "node:fs/promises";\nimport * as net from "node:net";`,
    ],
    `import { createHash } from "node:crypto";\nimport * as fs from "node:fs/promises";\nimport * as net from "node:net";`,
    "browser attach sha256 import",
  ).content;

  out = replaceAny(
    out,
    [
      `export async function pickElectronTarget(\n\tbrowser: Browser,\n\toptions: { matcher?: string; preferVisible?: boolean } = {},\n): Promise<Page> {\n\tconst discoveredPages`,
      `export async function pickElectronTarget(\n\tbrowser: Browser,\n\toptions: { matcher?: string; preferVisible?: boolean } = {},\n): Promise<Page> {\n\tawait ensureQutebrowserAgentTarget(browser, options.matcher);\n\tconst discoveredPages`,
      `export async function pickElectronTarget(\n\tbrowser: Browser,\n\toptions: { matcher?: string; preferVisible?: boolean; ownerSessionId?: string; tabName?: string } = {},\n): Promise<Page> {\n\tawait ensureQutebrowserAgentTarget(browser, options.matcher, options.ownerSessionId, options.tabName);\n\tconst discoveredPages`,
    ],
    `export async function pickElectronTarget(\n\tbrowser: Browser,\n\toptions: { matcher?: string; preferVisible?: boolean; ownerSessionId?: string; tabName?: string } = {},\n): Promise<Page> {\n\tawait ensureQutebrowserAgentTarget(browser, options.matcher, options.ownerSessionId, options.tabName);\n\tconst discoveredPages`,
    "automatic qutebrowser agent window creation",
  ).content;

  out = replaceAny(
    out,
    [
      `async function pickPageFromList(pages: Page[], options: { matcher?: string; preferVisible?: boolean }): Promise<Page> {`,
      `async function pickPageFromList(pages: Page[], options: { matcher?: string; preferVisible?: boolean; ownerSessionId?: string; tabName?: string }): Promise<Page> {`,
    ],
    `async function pickPageFromList(pages: Page[], options: { matcher?: string; preferVisible?: boolean; ownerSessionId?: string; tabName?: string }): Promise<Page> {`,
    "qutebrowser page picker option type",
  ).content;

  const helper = `const qutebrowserAgentTargetOpen = new Map<string, Promise<void>>();

function qutebrowserAgentToken(ownerSessionId?: string, tabName?: string): string | undefined {
	if (!ownerSessionId) return undefined;
	return "s" + createHash("sha256").update(JSON.stringify([ownerSessionId, tabName ?? ""])).digest("hex").slice(0, 32);
}

function titleHasExactMarker(title: string, marker: string): boolean {
	return title.toLowerCase().split(/\\s+/).includes(marker);
}

function qutebrowserTargetMarker(matcher?: string, ownerSessionId?: string, tabName?: string): string | undefined {
	if (matcher?.toLowerCase() !== "omp_agent_window_9f2c") return undefined;
	const token = qutebrowserAgentToken(ownerSessionId, tabName);
	return token ? "omp_agent_window_9f2c_token_" + token : "omp_agent_window_9f2c";
}

async function ensureQutebrowserAgentTarget(browser: Browser, matcher?: string, ownerSessionId?: string, tabName?: string): Promise<void> {
	const marker = qutebrowserTargetMarker(matcher, ownerSessionId, tabName);
	if (!marker) return;
	if (!qutebrowserAgentTargetOpen.has(marker)) {
		qutebrowserAgentTargetOpen.set(marker, ensureQutebrowserAgentTargetOnce(browser, marker, ownerSessionId, tabName));
	}
	await qutebrowserAgentTargetOpen.get(marker);
}

async function ensureQutebrowserAgentTargetOnce(browser: Browser, marker: string, ownerSessionId?: string, tabName?: string): Promise<void> {
	const hasTarget = async () => {
		for (const target of browser.targets()) {
			if (String(target.type()) !== "page") continue;
			const page = await target.page().catch(() => null);
			if (page && titleHasExactMarker(await page.title().catch(() => ""), marker)) return true;
		}
		return false;
	};
	if (await hasTarget()) return;
	const token = qutebrowserAgentToken(ownerSessionId, tabName);
	const args = ["/Users/tim/dev/dotfiles/qutebrowser/bin/qutebrowser-agent"];
	if (token) args.push("--token", token);
	const child = Bun.spawn(args, {
		stdout: "ignore",
		stderr: "pipe",
	});
	child.unref();
	let exitCode: number | undefined;
	let exitError: unknown;
	const stderrPromise = new Response(child.stderr).text().catch(() => "");
	child.exited.then(
		code => { exitCode = code; },
		error => { exitError = error; exitCode = -1; },
	);
	const deadline = Date.now() + 15_000;
	while (Date.now() < deadline) {
		if (await hasTarget()) return;
		if (exitCode !== undefined && exitCode !== 0) break;
		await Bun.sleep(100);
	}
	if (await hasTarget()) return;
	if (exitCode === undefined) {
		child.kill("SIGTERM");
		let exited = await Promise.race([child.exited.then(() => true, () => true), Bun.sleep(2_000).then(() => false)]);
		if (!exited) {
			child.kill("SIGKILL");
			exited = await Promise.race([child.exited.then(() => true, () => true), Bun.sleep(1_000).then(() => false)]);
		}
		const stderr = await Promise.race([stderrPromise, Bun.sleep(200).then(() => "")]);
		const reason = String(stderr || (exited ? "" : "child did not exit after SIGKILL")).trim();
		throw new ToolError("Could not create the marked qutebrowser agent window: qutebrowser-agent timed out" + (reason ? ": " + reason : ""));
	}
	const stderr = (await stderrPromise).trim();
	const reason = exitError instanceof Error ? exitError.message : stderr;
	if (exitCode === 0) {
		throw new ToolError("Could not create the marked qutebrowser agent window: qutebrowser-agent exited 0 but marker target did not appear" + (reason ? ": " + reason : ""));
	}
	throw new ToolError("Could not create the marked qutebrowser agent window: qutebrowser-agent exited " + String(exitCode) + (reason ? ": " + reason : ""));
}

`;
  const helperPattern =
    /(?:let qutebrowserAgentTargetOpen: Promise<void> \| undefined;|const qutebrowserAgentTargetOpen = new Map<string, Promise<void>>\(\);)\n\n(?:function qutebrowserAgentToken[\s\S]*?\n\n)?(?:function titleHasExactMarker[\s\S]*?\n\n)?(?:function qutebrowserTargetMarker[\s\S]*?\n\n)?async function ensureQutebrowserAgentTarget[\s\S]*?\n\nexport async function pickElectronTarget\(/;
  if (helperPattern.test(out)) {
    out = out.replace(
      helperPattern,
      helper + "export async function pickElectronTarget(",
    );
  } else {
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
      `\t\tconst targetMarker = qutebrowserTargetMarker(options.matcher, options.ownerSessionId);\n\t\tconst hit = targetMarker\n\t\t\t? enriched.find(p => p.title.toLowerCase().includes(targetMarker))\n\t\t\t: enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
      `\t\tconst targetMarker = qutebrowserTargetMarker(options.matcher, options.ownerSessionId);\n\t\tconst hit = targetMarker\n\t\t\t? enriched.find(p => titleHasExactMarker(p.title, targetMarker))\n\t\t\t: enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
      `\t\tconst targetMarker = qutebrowserTargetMarker(options.matcher, options.ownerSessionId, options.tabName);\n\t\tconst hit = targetMarker\n\t\t\t? enriched.find(p => titleHasExactMarker(p.title, targetMarker))\n\t\t\t: enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
    ],
    `\t\tconst targetMarker = qutebrowserTargetMarker(options.matcher, options.ownerSessionId, options.tabName);\n\t\tconst hit = targetMarker\n\t\t\t? enriched.find(p => titleHasExactMarker(p.title, targetMarker))\n\t\t\t: enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
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

export function patchBrowserTabSupervisor(content, { replaceAny }) {
  let out = replaceAny(
    content,
    [
      `\t\ttabName: opts.displayName ?? name,`,
      `\t\ttabName: opts.displayName ?? "main",`,
    ],
    `\t\ttabName: opts.displayName ?? "main",`,
    "browser relay attach tab name fallback",
  ).content;
  out = replaceAny(
    out,
    [
      `\tif (existing) {\n\t\tif (existing.browser === browser && existing.state === "alive") {`,
      `\tif (existing) {\n\t\tif (existing.ownerSessionId !== undefined && opts.ownerSessionId !== undefined && existing.ownerSessionId !== opts.ownerSessionId) {\n\t\t\tthrow new ToolError(\n\t\t\t\t\`Tab \${JSON.stringify(name)} belongs to another browser session. Use a unique browser name or close it first.\`,\n\t\t\t);\n\t\t}\n\t\tif (existing.browser === browser && existing.state === "alive") {`,
      `\tif (existing) {\n\t\tif (existing.browser === browser && existing.state === "alive") {\n\t\t\tif (existing.ownerSessionId !== undefined && opts.ownerSessionId !== undefined && existing.ownerSessionId !== opts.ownerSessionId) {\n\t\t\t\tthrow new ToolError(\n\t\t\t\t\t\`Tab \${JSON.stringify(name)} belongs to another browser session. Use a unique browser name or close it first.\`,\n\t\t\t\t);\n\t\t\t}`,
    ],
    `\tif (existing) {\n\t\tif (existing.browser === browser && existing.state === "alive") {\n\t\t\tif (existing.ownerSessionId !== undefined && opts.ownerSessionId !== undefined && existing.ownerSessionId !== opts.ownerSessionId) {\n\t\t\t\tthrow new ToolError(\n\t\t\t\t\t\`Tab \${JSON.stringify(name)} belongs to another browser session. Use a unique browser name or close it first.\`,\n\t\t\t\t);\n\t\t\t}`,
    "browser tab owner-session reuse guard",
  ).content;
  out = replaceAny(
    out,
    [
      `\tconst page = await pickElectronTarget(browser.browser, {\n\t\tmatcher: opts.target,\n\t\tpreferVisible: !activateForScreenshot,\n\t});`,
      `\tconst page = await pickElectronTarget(browser.browser, {\n\t\tmatcher: opts.target,\n\t\tpreferVisible: !activateForScreenshot,\n\t\townerSessionId: opts.ownerSessionId,\n\t});`,
      `\tconst page = await pickElectronTarget(browser.browser, {\n\t\tmatcher: opts.target,\n\t\tpreferVisible: !activateForScreenshot,\n\t\townerSessionId: opts.ownerSessionId,\n\t\ttabName: opts.displayName ?? "main",\n\t});`,
    ],
    `\tconst page = await pickElectronTarget(browser.browser, {\n\t\tmatcher: opts.target,\n\t\tpreferVisible: !activateForScreenshot,\n\t\townerSessionId: opts.ownerSessionId,\n\t\ttabName: opts.displayName ?? "main",\n\t});`,
    "browser physical target owner token",
  ).content;
  out = replaceAny(
    out,
    [
      `\townerSessionId?: string;\n\t/**\n\t * Opt out of settle-freeze`,
      `\townerSessionId?: string;\n\t/** User-facing tab name; module map key may be session-scoped. */\n\tdisplayName?: string;\n\t/**\n\t * Opt out of settle-freeze`,
    ],
    `\townerSessionId?: string;\n\t/** User-facing tab name; module map key may be session-scoped. */\n\tdisplayName?: string;\n\t/**\n\t * Opt out of settle-freeze`,
    "tab display name session field",
  ).content;
  out = replaceAny(
    out,
    [
      `\townerSessionId?: string;\n\t/**\n\t * Keep the tab live`,
      `\townerSessionId?: string;\n\t/** User-facing tab name; module map key may be session-scoped. */\n\tdisplayName?: string;\n\t/**\n\t * Keep the tab live`,
    ],
    `\townerSessionId?: string;\n\t/** User-facing tab name; module map key may be session-scoped. */\n\tdisplayName?: string;\n\t/**\n\t * Keep the tab live`,
    "tab display name option field",
  ).content;
  out = replaceAny(
    out,
    [
      `export function listTabs(): ManagedTabInfo[] {\n\treturn [...tabs.values()]\n\t\t.filter(tab => tab.state === "alive")`,
      `export function listTabs(ownerSessionId?: string): ManagedTabInfo[] {\n\treturn [...tabs.values()]\n\t\t.filter(tab => tab.state === "alive" && (ownerSessionId === undefined || tab.ownerSessionId === ownerSessionId))`,
    ],
    `export function listTabs(ownerSessionId?: string): ManagedTabInfo[] {\n\treturn [...tabs.values()]\n\t\t.filter(tab => tab.state === "alive" && (ownerSessionId === undefined || tab.ownerSessionId === ownerSessionId))`,
    "tab list owner filter",
  ).content;
  out = replaceAny(
    out,
    [
      `\t\t\tname: tab.name,\n\t\t\turl: tab.info.url,`,
      `\t\t\tname: tab.displayName ?? tab.name,\n\t\t\turl: tab.info.url,`,
    ],
    `\t\t\tname: tab.displayName ?? tab.name,\n\t\t\turl: tab.info.url,`,
    "tab list display name",
  ).content;
  out = replaceAny(
    out,
    [
      `\t\townerSessionId: opts.ownerSessionId,\n\t\tpersist: opts.persist ?? false,`,
      `\t\townerSessionId: opts.ownerSessionId,\n\t\tdisplayName: opts.displayName,\n\t\tpersist: opts.persist ?? false,`,
    ],
    `\t\townerSessionId: opts.ownerSessionId,\n\t\tdisplayName: opts.displayName,\n\t\tpersist: opts.persist ?? false,`,
    "worker tab display name",
  ).content;
  out = replaceAny(
    out,
    [
      `\t\t\tkindTag: browser.kind.kind,\n\t\t\tcmuxAttachedSurface: attachedSurface,\n\t\t\townerSessionId: opts.ownerSessionId,\n\t\t\tpersist: opts.persist ?? false,`,
      `\t\t\tkindTag: browser.kind.kind,\n\t\t\tcmuxAttachedSurface: attachedSurface,\n\t\t\townerSessionId: opts.ownerSessionId,\n\t\t\tdisplayName: opts.displayName,\n\t\t\tpersist: opts.persist ?? false,`,
    ],
    `\t\t\tkindTag: browser.kind.kind,\n\t\t\tcmuxAttachedSurface: attachedSurface,\n\t\t\townerSessionId: opts.ownerSessionId,\n\t\t\tdisplayName: opts.displayName,\n\t\t\tpersist: opts.persist ?? false,`,
    "cmux tab display name",
  ).content;
  out = replaceAny(
    out,
    [
      `\t\t\tkindTag: browser.kind.kind,\n\t\t\townerSessionId: opts.ownerSessionId,\n\t\t\tpersist: opts.persist ?? false,`,
      `\t\t\tkindTag: browser.kind.kind,\n\t\t\townerSessionId: opts.ownerSessionId,\n\t\t\tdisplayName: opts.displayName,\n\t\t\tpersist: opts.persist ?? false,`,
    ],
    `\t\t\tkindTag: browser.kind.kind,\n\t\t\townerSessionId: opts.ownerSessionId,\n\t\t\tdisplayName: opts.displayName,\n\t\t\tpersist: opts.persist ?? false,`,
    "tern tab display name",
  ).content;
  return out;
}

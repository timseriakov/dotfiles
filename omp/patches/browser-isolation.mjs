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
  if (out.includes("async function openBrowser(\n\tsession: ToolSession,")) {
    out = out.replace(
      `\t\t\t\t\townerSessionId: session.getSessionId?.() ?? undefined,\n\t\t\t\t\tdisplayName: details.name,\n\t\t\t\t\tdisplayName,`,
      `\t\t\t\t\townerSessionId: session.getSessionId?.() ?? undefined,\n\t\t\t\t\tdisplayName: details.name,`,
    );
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
        `\t\t\t\t\townerSessionId,\n\t\t\t\t\tdisplayName,`,
        `\t\t\t\t\townerSessionId: session.getSessionId?.() ?? undefined,\n\t\t\t\t\tdisplayName: details.name,`,
        `\t\t\t\t\townerSessionId: session.getSessionId?.() ?? undefined,`,
        `\t\t\t\t\townerSessionId: session.getSessionId?.() ?? undefined,\n\t\t\t\t\tdisplayName,`,
        `\t\t\t\t\townerSessionId: session.getSessionId?.() ?? undefined,\n\t\t\t\t\tdisplayName: details.name,`,
      ],
      `\t\t\t\t\townerSessionId: session.getSessionId?.() ?? undefined,\n\t\t\t\t\tdisplayName: details.name,`,
      "browser display name to tab supervisor",
    ).content;
    out = replaceAny(
      out,
      [
        `\t\t\t\`\${verb} tab \${JSON.stringify(name)} on \${describeBrowser(browser)}\`,`,
        `\t\t\t\`\${verb} tab \${JSON.stringify(displayName)} on \${describeBrowser(browser)}\`,`,
        `\t\t\t\`\${verb} tab \${JSON.stringify(details.name)} on \${describeBrowser(browser)}\`,`,
        `\t\t\t\`\${verb} tab \${JSON.stringify(name)} on \${describeBrowser(tab)}\`,`,
        `\t\t\t\`\${verb} tab \${JSON.stringify(displayName)} on \${describeBrowser(tab)}\`,`,
        `\t\t\t\`\${verb} tab \${JSON.stringify(details.name)} on \${describeBrowser(tab)}\`,`,
      ],
      `\t\t\t\`\${verb} tab \${JSON.stringify(details.name)} on \${describeBrowser(tab)}\`,`,
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
    out = out.replace("\treleaseAllTabs,\n", "");
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

  if (out.includes("export interface PickTargetOptions {")) {
    const optionAnchor = `export interface PickTargetOptions {\n\tmatcher?: string;\n\tpreferVisible?: boolean;`;
    const optionsStart = out.indexOf("export interface PickTargetOptions {");
    const optionsEnd = out.indexOf("\n}", optionsStart);
    const options = out.slice(optionsStart, optionsEnd);
    if (
      !options.includes("ownerSessionId?: string;") ||
      !options.includes("tabName?: string;")
    ) {
      out = out.replace(
        optionAnchor,
        `${optionAnchor}\n\townerSessionId?: string;\n\ttabName?: string;`,
      );
    }
  }

  const pickerStart =
    /export async function pickElectronTarget\(browser: Browser, options: PickTargetOptions = \{\}\): Promise<Page> \{\n\tthrowIfAborted\(options.signal\);\n(?:\tawait ensureQutebrowserAgentTarget\(browser, options.matcher(?:, options.ownerSessionId, options.tabName)?\);\n)?/;
  const pickerMatch = out.match(pickerStart);
  if (!pickerMatch)
    throw new Error(
      "Patch 'automatic qutebrowser agent window creation' expected pickElectronTarget with PickTargetOptions.",
    );
  const currentEnsure =
    "await ensureQutebrowserAgentTarget(browser, options.matcher);";
  const identityEnsure =
    "await ensureQutebrowserAgentTarget(browser, options.matcher, options.ownerSessionId, options.tabName);";
  if (pickerMatch[0].includes(currentEnsure)) {
    out = out.replace(
      pickerStart,
      pickerMatch[0].replace(currentEnsure, identityEnsure),
    );
  } else if (!pickerMatch[0].includes(identityEnsure)) {
    out = out.replace(
      pickerStart,
      pickerMatch[0].replace(
        "throwIfAborted(options.signal);",
        `throwIfAborted(options.signal);\n\t${identityEnsure}`,
      ),
    );
  }

  out = replaceAny(
    out,
    [
      `async function pickPageFromList(pages: Page[], options: PickTargetOptions): Promise<Page> {`,
      `async function pickPageFromList(pages: Page[], options: { matcher?: string; preferVisible?: boolean }): Promise<Page> {`,
      `async function pickPageFromList(pages: Page[], options: { matcher?: string; preferVisible?: boolean; ownerSessionId?: string; tabName?: string }): Promise<Page> {`,
    ],
    `async function pickPageFromList(pages: Page[], options: PickTargetOptions): Promise<Page> {`,
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
	qutebrowserAgentTargetOpen.delete(marker);
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
    /(?:let qutebrowserAgentTargetOpen: Promise<void> \| undefined;|const qutebrowserAgentTargetOpen = new Map<string, Promise<void>>\(\);)\n+(?:function qutebrowserAgentToken[\s\S]*?\n\n)?(?:function titleHasExactMarker[\s\S]*?\n\n)?(?:function qutebrowserTargetMarker[\s\S]*?\n\n)?async function ensureQutebrowserAgentTarget[\s\S]*?\n+export async function pickElectronTarget\(/;
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
  if (
    out.includes(
      "function selectRelayEntry(entries: RelayJsonEntry[], options: PickTargetOptions): RelayJsonEntry | null {",
    )
  ) {
    const oldRelay = `\tconst needle = options.matcher?.toLowerCase();\n\tif (needle) {\n\t\tconst hits = entries.filter(e => relayEntryMatches(e, needle));`;
    const ownerRelay = `\tconst needle = options.matcher?.toLowerCase();\n\tconst marker = qutebrowserTargetMarker(options.matcher, options.ownerSessionId, options.tabName);\n\tif (marker) {\n\t\tconst target = entries.find(entry => titleHasExactMarker(entry.title, marker) && entry.discarded !== "true");\n\t\treturn target ?? null;\n\t}\n\tif (needle) {\n\t\tconst hits = entries.filter(e => relayEntryMatches(e, needle));`;
    const relayMiss = `\t\tconst selected = pageEntries.length > 0 ? selectRelayEntry(pageEntries, options) : null;`;
    const relayFailClosed = `\t\tconst selected = pageEntries.length > 0 ? selectRelayEntry(pageEntries, options) : null;\n\t\tif (qutebrowserTargetMarker(options.matcher, options.ownerSessionId, options.tabName) && !selected) throw new ToolError(\`No page target matched the qutebrowser owner marker\`);`;
    if (out.includes(relayMiss) && !out.includes(relayFailClosed))
      out = out.replace(relayMiss, relayFailClosed);

    out = replaceAny(
      out,
      [oldRelay, ownerRelay],
      ownerRelay,
      "qutebrowser relay owner-token target selection",
    ).content;
  }

  out = replaceAny(
    out,
    [
      `\t\tconst hit = enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
      `\t\tconst hit = needle === "omp_agent_window_9f2c"\n\t\t\t? enriched.find(p => p.title.toLowerCase().includes(needle))\n\t\t\t: enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
      `\t\tconst targetMarker = qutebrowserTargetMarker(options.matcher);\n\t\tconst hit = targetMarker\n\t\t\t? enriched.find(p => titleHasExactMarker(p.title, targetMarker))\n\t\t\t: enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
      `\t\tconst targetMarker = qutebrowserTargetMarker(options.matcher, options.ownerSessionId);\n\t\tconst hit = targetMarker\n\t\t\t? enriched.find(p => titleHasExactMarker(p.title, targetMarker))\n\t\t\t: enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
      `\t\tconst targetMarker = qutebrowserTargetMarker(options.matcher, options.ownerSessionId, options.tabName);\n\t\tconst hit = targetMarker\n\t\t\t? enriched.find(p => titleHasExactMarker(p.title, targetMarker))\n\t\t\t: enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
      `\t\tconst targetMarker = qutebrowserTargetMarker(options.matcher, options.ownerSessionId);\n\t\tconst hit = targetMarker\n\t\t\t? enriched.find(p => titleHasExactMarker(p.title, targetMarker))\n\t\t\t: enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
      `\t\tconst targetMarker = qutebrowserTargetMarker(options.matcher, options.ownerSessionId, options.tabName);\n\t\tconst hit = targetMarker\n\t\t\t? enriched.find(p => titleHasExactMarker(p.title, targetMarker))\n\t\t\t: enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
    ],
    `\t\tconst targetMarker = qutebrowserTargetMarker(options.matcher, options.ownerSessionId, options.tabName);\n\t\tconst hit = targetMarker\n\t\t\t? enriched.find(p => titleHasExactMarker(p.title, targetMarker))\n\t\t\t: enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));`,
    "qutebrowser persistent title marker matcher",
  ).content;
  if (
    !out.includes(
      "function selectRelayEntry(entries: RelayJsonEntry[], options: PickTargetOptions): RelayJsonEntry | null {",
    )
  ) {
    out = replaceAny(
      out,
      [
        `return !target;`,
        `return !target || target === "OMP_AGENT_WINDOW_9f2c";`,
      ],
      `return !target || target === "OMP_AGENT_WINDOW_9f2c";`,
      "preserve qutebrowser agent focus",
    ).content;
  }
  return out;
}

export function patchBrowserTabSupervisor(content, { replaceAny }) {
  let out = content;
  const optionsStart = out.indexOf("export interface AcquireTabOptions {");
  const optionsEnd = out.indexOf("\n}", optionsStart);
  if (optionsStart >= 0 && optionsEnd > optionsStart) {
    const options = out.slice(optionsStart, optionsEnd);
    if (!options.includes("displayName?: string;")) {
      const ownerOption = "\townerSessionId?: string;";
      if (!options.includes(ownerOption))
        throw new Error(
          "Patch 'browser tab displayName option' expected ownerSessionId in AcquireTabOptions.",
        );
      out =
        out.slice(0, optionsStart) +
        options.replace(
          ownerOption,
          ownerOption + "\n\tdisplayName?: string;",
        ) +
        out.slice(optionsEnd);
    }
  }
  const guardStart = out.indexOf("if (existing) {");
  const guardEnd = out.indexOf(
    '\n\t\tif (existing.browser === browser && existing.state === "alive") {',
    guardStart,
  );
  if (
    guardStart >= 0 &&
    guardEnd >= 0 &&
    !out
      .slice(guardStart, guardEnd)
      .includes("existing.ownerSessionId !== opts.ownerSessionId")
  ) {
    const guard = `if (existing) {\n\t\tif (existing.ownerSessionId !== undefined && opts.ownerSessionId !== undefined && existing.ownerSessionId !== opts.ownerSessionId) {\n\t\t\tthrow new ToolError(\n\t\t\t\t\`Tab \${JSON.stringify(name)} belongs to another browser session. Use a unique browser name or close it first.\`,\n\t\t\t);\n\t\t}`;
    out =
      out.slice(0, guardStart) +
      out.slice(guardStart, guardEnd).replace("if (existing) {", guard) +
      out.slice(guardEnd);
  }
  const pickerOptions =
    /const picked = await pickElectronTarget\(browser\.browser, \{\n(\s*)matcher: opts\.target,\n\s*preferVisible: userDriven && !opts\.target,\n\s*relayJson: browser\.kind\.kind === "relay" \? browser\.kind\.cdpUrl : undefined,\n\s*signal: opts\.signal,\n\s*\}\);/;
  const match = out.match(pickerOptions);
  if (match && !match[0].includes("ownerSessionId: opts.ownerSessionId")) {
    const indent = match[1];
    const updated = match[0].replace(
      /\n\s*\}\);$/,
      `\n${indent}ownerSessionId: opts.ownerSessionId,\n${indent}tabName: opts.displayName ?? "main",\n${indent.slice(1)}});`,
    );
    out = out.replace(pickerOptions, updated);
  }
  return out;
}

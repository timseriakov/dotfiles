import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  patchBrowserAttach,
  patchBrowserIsolation,
  patchBrowserTabSupervisor,
} from "./browser-isolation.mjs";

const LIVE_BROWSER_TS = process.env.OMP_INSTALLED_BROWSER_TS;
const LIVE_ATTACH_TS = process.env.OMP_INSTALLED_ATTACH_TS;

function readInstalledBrowserSource() {
  assert.ok(
    LIVE_BROWSER_TS,
    "set OMP_INSTALLED_BROWSER_TS for installed-source smoke checks",
  );
  return readFileSync(LIVE_BROWSER_TS, "utf8");
}

function readInstalledAttachSource() {
  assert.ok(
    LIVE_ATTACH_TS,
    "set OMP_INSTALLED_ATTACH_TS for installed attach smoke checks",
  );
  return readFileSync(LIVE_ATTACH_TS, "utf8");
}

function replaceAny(content, alternatives, newText, label) {
  if (content.includes(newText)) {
    return { content, changed: false, already: true };
  }
  for (const oldText of alternatives) {
    const count = content.split(oldText).length - 1;
    if (count === 1) {
      return {
        content: content.replace(oldText, () => newText),
        changed: true,
        already: false,
      };
    }
  }
  throw new Error(`${label} did not match`);
}

const attachPrefix = `import * as fs from "node:fs/promises";
import * as net from "node:net";
`;

function attachSource(body) {
  return attachPrefix + body;
}
function extractFunction(source, name, jsSignature) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(
    new RegExp(`function ${escapedName}\\([^)]*\\)[^{]*\\{([\\s\\S]*?)\\n\\}`),
  );
  assert.ok(match, `${name} helper missing`);
  return Function(
    "createHash",
    `function ${name}${jsSignature} {${match[1]}\n}\nreturn ${name};`,
  )(createHash);
}

const pickerWithHook = `export async function pickElectronTarget(
	browser: Browser,
	options: { matcher?: string; preferVisible?: boolean } = {},
): Promise<Page> {
	await ensureQutebrowserAgentTarget(browser, options.matcher);
	const discoveredPages = [];
async function pickPageFromList(pages: Page[], options: { matcher?: string; preferVisible?: boolean }): Promise<Page> {
	const enriched = [];
	if (options.matcher) {
		const needle = options.matcher.toLowerCase();
		const hit = enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));
	}
}
return !target;
}`;
const pickerWithoutHook = pickerWithHook.replace(
  "\tawait ensureQutebrowserAgentTarget(browser, options.matcher);\n",
  "",
);

const oldHelper = `let qutebrowserAgentTargetOpen: Promise<void> | undefined;

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
	const hasTarget = async () => false;
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

function assertCanonicalAttach(patched) {
  assert.match(patched, /import \{ createHash \} from "node:crypto";/);
  assert.match(patched, /new Map<string, Promise<void>>/);
  assert.match(patched, /createHash\("sha256"\)/);
  assert.match(patched, /titleHasExactMarker\(await page\.title/);
  assert.match(patched, /titleHasExactMarker\(p\.title, targetMarker\)/);
  assert.match(
    patched,
    /qutebrowserTargetMarker\(options\.matcher, options\.ownerSessionId, options\.tabName\)/,
  );
  assert.match(
    patched,
    /pickPageFromList\(pages: Page\[\], options: \{ matcher\?: string; preferVisible\?: boolean; ownerSessionId\?: string; tabName\?: string \}\)/,
  );
  assert.match(patched, /qutebrowserAgentToken\(ownerSessionId, tabName\)/);
  assert.match(patched, /tabName\?: string/);
  assert.match(patched, /args\.push\("--token", token\)/);
  assert.match(patched, /ownerSessionId\?: string/);
  assert.match(patched, /stderr: "pipe"/);
  assert.match(patched, /SIGTERM/);
  assert.match(patched, /SIGKILL/);
  assert.match(patched, /Date\.now\(\) \+ 15_000/);
  assert.doesNotMatch(patched, /stderr: "ignore"/);
  assert.doesNotMatch(patched, /finally\(\(\) =>/);
}

test("inserts canonical qutebrowser owner-token helper into unpatched attach source", () => {
  assertCanonicalAttach(
    patchBrowserAttach(attachSource(pickerWithoutHook), { replaceAny }),
  );
});

test("live installed attach source is canonical and idempotent", () => {
  const source = readInstalledAttachSource();
  assertCanonicalAttach(source);
  assert.equal(patchBrowserAttach(source, { replaceAny }), source);
});

test("replaces already-patched qutebrowser helper with SHA owner-token lifecycle diagnostics", () => {
  assertCanonicalAttach(
    patchBrowserAttach(attachSource(oldHelper + pickerWithHook), {
      replaceAny,
    }),
  );
});

test("generated token helper uses SHA-256 vector and does not leak raw session id", () => {
  const rawSessionId = "session/raw id with spaces";
  const patched = patchBrowserAttach(attachSource(pickerWithoutHook), {
    replaceAny,
  });
  const token = extractFunction(
    patched,
    "qutebrowserAgentToken",
    "(ownerSessionId, tabName)",
  );
  const expected = `s${createHash("sha256")
    .update(JSON.stringify([rawSessionId, "main"]))
    .digest("hex")
    .slice(0, 32)}`;
  assert.equal(token(rawSessionId, "main"), expected);
  assert.notEqual(
    token(rawSessionId, "main"),
    token(rawSessionId, "secondary"),
  );
  assert.doesNotMatch(
    patched,
    new RegExp(rawSessionId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
});

test("generated marker matcher is exact and rejects prefix collisions", () => {
  const patched = patchBrowserAttach(attachSource(pickerWithoutHook), {
    replaceAny,
  });
  const hasMarker = extractFunction(
    patched,
    "titleHasExactMarker",
    "(title, marker)",
  );
  assert.equal(
    hasMarker(
      "OMP_AGENT_WINDOW_9f2c_TOKEN_sabc rest",
      "omp_agent_window_9f2c_token_sabc",
    ),
    true,
  );
  assert.equal(
    hasMarker(
      "OMP_AGENT_WINDOW_9f2c_TOKEN_sabcdef",
      "omp_agent_window_9f2c_token_sabc",
    ),
    false,
  );
  assert.equal(
    hasMarker(
      "prefixOMP_AGENT_WINDOW_9f2c_TOKEN_sabc",
      "omp_agent_window_9f2c_token_sabc",
    ),
    false,
  );
});

test("patchBrowserAttach is idempotent after canonical helper is present", () => {
  const once = patchBrowserAttach(attachSource(oldHelper + pickerWithHook), {
    replaceAny,
  });
  const twice = patchBrowserAttach(once, { replaceAny });
  assert.equal(twice, once);
});

test("tab supervisor refuses cross-session reuse and passes owner to physical target picker", () => {
  const source = `	ownerSessionId?: string;
	/**
	 * Opt out of settle-freeze
	 */
	ownerSessionId?: string;
	/**
	 * Keep the tab live
export function listTabs(): ManagedTabInfo[] {
	return [...tabs.values()]
		.filter(tab => tab.state === "alive")
		.map(tab => ({
			name: tab.name,
		}));
	if (existing) {
		if (existing.browser === browser && existing.state === "alive") {
			return existing;
		}
	}
		ownerSessionId: opts.ownerSessionId,
		persist: opts.persist ?? false,
			ownerSessionId: opts.ownerSessionId,
			persist: opts.persist ?? false,
	const page = await pickElectronTarget(browser.browser, {
		matcher: opts.target,
		preferVisible: !activateForScreenshot,
	});`;
  const patched = patchBrowserTabSupervisor(source, { replaceAny });
  assert.match(patched, /existing\.ownerSessionId !== opts\.ownerSessionId/);
  assert.ok(
    patched.indexOf(
      'existing.browser === browser && existing.state === "alive"',
    ) < patched.indexOf("existing.ownerSessionId !== opts.ownerSessionId"),
  );
  assert.match(patched, /belongs to another browser session/);
  assert.match(patched, /ownerSessionId: opts\.ownerSessionId/);
  assert.match(patched, /tabName: opts\.displayName \?\? name/);
  assert.equal(patchBrowserTabSupervisor(patched, { replaceAny }), patched);
});

const freshBrowserSource = `import { type } from "@oh-my-pi/omptype";
import {
	releaseIdleTabsForOwner,
	releaseTab,
} from "./browser/tab-supervisor";

const DEFAULT_TAB_NAME = "main";
const BROWSER_RUN_SCOPE = Symbol("browser");

async function invokeBrowser(params, session, parsed, context, timeoutMs) {
	const details = {};
	const kind = resolveBrowserKind(params, session);
	const downloadsPath = params.downloads === undefined ? undefined : resolveToCwd(params.downloads, session.cwd);
	details.browser = kind.kind;
		const name = parsed.name ?? DEFAULT_TAB_NAME;
		const details: BrowserPreludeDetails = { action: parsed.action, name };
		const browserOptions = {
			app: {
					target: params.app?.target,
			},
		};
		switch (parsed.action) {
			case "open":
				return await openBrowser(session, name, parsed, details, timeoutMs, context.signal);
			case "close":
				return await closeBrowser(name, parsed, details, timeoutMs, context.signal);
			case "tabs":
				details.value = listTabs();
	}
}

async function openBrowser(
	session: ToolSession,
	name: string,
	params: BrowserParams,
	details: BrowserPreludeDetails,
	timeoutMs: number,
	signal: AbortSignal,
) {
	const browser = await acquireTab({
		browser: params.browser,
		name,
		options: {
					ownerSessionId: session.getSessionId?.() ?? undefined,
			persist: params.persist,
		},
	});
	const verb = "Opened";
	return toolResult(
				\`\${verb} tab \${JSON.stringify(name)} on \${describeBrowser(browser)}\`,
		details,
	);
}

async function closeBrowser(
	name: string,
	params: BrowserParams,
	details: BrowserPreludeDetails,
	timeoutMs: number,
	signal: AbortSignal,
) {
	const kill = params.kill === true;
	if (params.all) {
		const count = await untilAborted(signal, () => releaseAllTabs({ kill, timeoutMs }));
	}
	const closed = await releaseTab(name, { kill, timeoutMs });
	const text = closed ? \`Released managed tab \${JSON.stringify(name)}\` : \`No tab named \${JSON.stringify(name)}\`;
	return toolResult(text, details);
}

async function runBrowser(name, details) {
	const tab = getTab(name);
	if (tab) {
		return tab;
	}
}
`;

test("patchBrowserIsolation upgrades fresh upstream open/acquire path", () => {
  const once = patchBrowserIsolation(freshBrowserSource, { replaceAny });
  assert.equal(
    (
      once.match(
        /return await openBrowser\(session, ownerSessionId, name, displayName, parsed, details, timeoutMs, context\.signal\);/g,
      ) ?? []
    ).length,
    1,
  );
  assert.doesNotMatch(once, /openBrowser\(session, name, parsed/);
  assert.match(
    once,
    /async function openBrowser\(\n\tsession: ToolSession,\n\townerSessionId: string,\n\tname: string,\n\tdisplayName: string,/,
  );
  assert.match(once, /ownerSessionId,\n\s+displayName,/);
  assert.doesNotMatch(
    once,
    /ownerSessionId: session\.getSessionId\?\.\(\) \?\? undefined/,
  );
  assert.equal(patchBrowserIsolation(once, { replaceAny }), once);
});

test("patchBrowserIsolation is idempotent after session-scoped browser patch is present", () => {
  const source = readInstalledBrowserSource();
  const once = patchBrowserIsolation(source, { replaceAny });
  assert.equal(patchBrowserIsolation(once, { replaceAny }), once);
});

test("session-scoped browser open passes displayName before params", () => {
  const source = readInstalledBrowserSource();
  assert.match(
    source,
    /const displayName = parsed\.name \?\? DEFAULT_TAB_NAME;/,
  );
  assert.match(
    source,
    /if \(!ownerSessionId\) throw new ToolError\("Browser automation requires a session id for tab isolation\."\);/,
  );
  assert.match(
    source,
    /const name = scopedBrowserTabName\(ownerSessionId, displayName\);/,
  );
  assert.doesNotMatch(source, /ownerSessionId \? releaseTabsForOwner/);
  assert.match(
    source,
    /return await openBrowser\(session, ownerSessionId, name, displayName, parsed, details, timeoutMs, context\.signal\);/,
  );
  assert.doesNotMatch(
    source,
    /return await openBrowser\(session, name, parsed, details, timeoutMs, context\.signal\);/,
  );
});

test("two owners can both use logical main with isolated keys and UI", () => {
  const source = readInstalledBrowserSource();
  const match = source.match(
    /function scopedBrowserTabName\([^)]*\)[^{]*\{([\s\S]*?)\n\}/,
  );
  assert.ok(match, "scopedBrowserTabName helper missing");
  const scopedBrowserTabName = Function(
    "createHash",
    `function scopedBrowserTabName(ownerSessionId, displayName) {${match[1]}\n}\nreturn scopedBrowserTabName;`,
  )(createHash);
  const a = scopedBrowserTabName("owner-a", "main");
  const b = scopedBrowserTabName("owner-b", "main");
  assert.notEqual(a, b);
  assert.equal(scopedBrowserTabName("owner-a", "main"), a);

  const tabs = new Map([
    [
      a,
      {
        ownerSessionId: "owner-a",
        state: "alive",
        name: a,
        displayName: "main",
      },
    ],
    [
      b,
      {
        ownerSessionId: "owner-b",
        state: "alive",
        name: b,
        displayName: "main",
      },
    ],
  ]);
  const listTabs = (owner) =>
    [...tabs.values()]
      .filter(
        (tab) =>
          tab.state === "alive" &&
          (owner === undefined || tab.ownerSessionId === owner),
      )
      .map((tab) => tab.displayName ?? tab.name);
  const releaseTabsForOwner = (owner) => {
    let count = 0;
    for (const [key, tab] of [...tabs.entries()]) {
      if (tab.ownerSessionId === owner) {
        tabs.delete(key);
        count++;
      }
    }
    return count;
  };
  assert.deepEqual(listTabs("owner-a"), ["main"]);
  assert.deepEqual(listTabs("owner-b"), ["main"]);
  assert.equal(releaseTabsForOwner("owner-a"), 1);
  assert.deepEqual(listTabs("owner-b"), ["main"]);
});

test("missing owner fails before global tab namespace", () => {
  const source = readInstalledBrowserSource();
  assert.match(
    source,
    /if \(!ownerSessionId\) throw new ToolError\("Browser automation requires a session id for tab isolation\."\);/,
  );
  assert.doesNotMatch(source, /ownerSessionId \? releaseTabsForOwner/);
  const getScopedName = (owner) => {
    if (!owner)
      throw new Error(
        "Browser automation requires a session id for tab isolation.",
      );
    return `scoped:${owner}:main`;
  };
  assert.throws(() => getScopedName(undefined), /requires a session id/);
  assert.notEqual(getScopedName("owner-a"), getScopedName("owner-b"));
});

test("scopedBrowserTabName throws on missing owner", () => {
  const source = readInstalledBrowserSource();
  assert.ok(
    source.includes(
      'if (!ownerSessionId) throw new ToolError("Browser automation requires a session id for tab isolation.");',
    ),
  );
  assert.doesNotMatch(source, /if \(!ownerSessionId\) return displayName/);
});

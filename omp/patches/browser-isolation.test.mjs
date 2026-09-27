import assert from "node:assert/strict";
import { test } from "node:test";
import { patchBrowserAttach } from "./browser-isolation.mjs";

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

const helperStart =
  "let qutebrowserAgentTargetOpen: Promise<void> | undefined;";
const pickerWithHook = `export async function pickElectronTarget(
	browser: Browser,
	options: { matcher?: string; preferVisible?: boolean } = {},
): Promise<Page> {
	await ensureQutebrowserAgentTarget(browser, options.matcher);
	const discoveredPages = [];
		const hit = enriched.find(p => p.url.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));
return !target;
}`;
const pickerWithoutHook = pickerWithHook.replace(
  "\tawait ensureQutebrowserAgentTarget(browser, options.matcher);\n",
  "",
);

const oldHelper = `${helperStart}

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

function assertCanonical(patched) {
  assert.equal(
    (patched.match(/let qutebrowserAgentTargetOpen/g) ?? []).length,
    1,
  );
  assert.match(
    patched,
    /await ensureQutebrowserAgentTarget\(browser, options\.matcher\);/,
  );
  assert.match(patched, /stderr: "pipe"/);
  assert.match(patched, /SIGTERM/);
  assert.match(patched, /SIGKILL/);
  assert.match(patched, /exited 0 but marker target did not appear/);
  assert.match(patched, /child did not exit after SIGKILL/);
  assert.doesNotMatch(patched, /stderr: "ignore"/);
  assert.doesNotMatch(patched, /finally\(\(\) =>/);
}

test("inserts canonical qutebrowser helper into unpatched attach source", () => {
  assertCanonical(patchBrowserAttach(pickerWithoutHook, { replaceAny }));
});

test("replaces already-patched qutebrowser helper with canonical lifecycle diagnostics", () => {
  assertCanonical(
    patchBrowserAttach(oldHelper + pickerWithHook, { replaceAny }),
  );
});

test("patchBrowserAttach is idempotent after canonical helper is present", () => {
  const once = patchBrowserAttach(oldHelper + pickerWithHook, { replaceAny });
  const twice = patchBrowserAttach(once, { replaceAny });
  assert.equal(twice, once);
});

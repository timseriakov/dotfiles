#!/usr/bin/env node
/**
 * Reapply Tim's local OMP UI monkey patches after @oh-my-pi/pi-coding-agent updates.
 *
 * Usage:
 *   node ~/dev/dotfiles/omp/apply-omp-monkey-patches.mjs
 *
 * What this patches:
 * - status line path: basename only (last directory segment)
 * - status line git: Starship-style `on  branch`, with `on` white and git info purple
 * - status line model: Starship-style `via Model Name OMNi`, with `via` white, model green, dim provider suffix, no Node.js hexagon icon
 * - status line spacing: no outer padding, configured separator only between segments
 * - chat messages: remove 1-column left padding from assistant/user text
 * - default editor: borderless, paddingX 0, green prompt gutter ` `
 * - visible width: strip ANSI SGR/control sequences before measuring styled status segments
 * - editor status line: render top status line even when border chrome is hidden
 * - editor prompt gutter width: reserve 1 cell even if the glyph measures as width 0
 * - welcome screen: replace the full logo/tips/recent-sessions box with only `Welcome from Oh My Pi`
 * - session name: right status segment is muted, truncated to 48 terminal cells, and padded right
 * - OpenAI-compatible wire schemas: strip regex `pattern` keywords containing lookaround, because
 *   OpenAI rejects them in tool schemas even though JavaScript accepts them
 * - OpenAI-completions tools: sanitize non-strict tool schemas too (OMNiRoute uses this path)
 * - OSC 99 terminal capability probe: skip it inside tmux; passthrough replies leak as typed text
 * - Kitty image graphics: wrap APC sequences in tmux passthrough, including Unicode placeholder placement
 * - Goal tool: ignore model-provided `token_budget` so goals stay unbounded while still counting usage
 *
 * Note: prompt/editor gutter glyph is also set by the dotfiles extension:
 *   ~/dev/dotfiles/omp/agent/extensions/starship-minimal-editor.ts
 *
 * Config/theme/extension files live under ~/dev/dotfiles/omp/agent and are symlinked
 * from ~/.omp/agent, so this script only patches installed package source files.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { patchPiSideChatIndex, patchPiSideChatOverlay, SIDE_CHAT_CONFIG } from "./patches/side-chat.mjs";

const home = os.homedir();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.join(
  home,
  ".bun/install/global/node_modules/@oh-my-pi/pi-coding-agent",
);
const srcRoot = path.join(packageRoot, "src");
const tuiSrcRoot = path.join(
  home,
  ".bun/install/global/node_modules/@oh-my-pi/pi-tui/src",
);

function file(rel) {
  return path.join(srcRoot, rel);
}

function tuiFile(rel) {
  return path.join(tuiSrcRoot, rel);
}

function piAiFiles(rel) {
  const roots = [
    path.join(home, ".bun/install/global/node_modules/@oh-my-pi/pi-ai/src"),
    path.join(scriptDir, "../node_modules/@oh-my-pi/pi-ai/src"),
  ];
  return [...new Set(roots.map((root) => path.resolve(root, rel)))].filter(fs.existsSync);
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content);
}

function requireFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing OMP source file: ${filePath}\nIs @oh-my-pi/pi-coding-agent installed globally with Bun?`,
    );
  }
}

function replaceOnce(content, oldText, newText, label) {
  if (content.includes(newText)) {
    return { content, changed: false, already: true };
  }
  const count = content.split(oldText).length - 1;
  if (count !== 1) {
    throw new Error(
      `Patch '${label}' expected exactly one match, found ${count}. Upstream source changed.`,
    );
  }
  return {
    content: content.replace(oldText, () => newText),
    changed: true,
    already: false,
  };
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
  const counts = alternatives
    .map((oldText) => content.split(oldText).length - 1)
    .join(", ");
  throw new Error(
    `Patch '${label}' expected one of ${alternatives.length} alternatives, counts [${counts}]. Upstream source changed.`,
  );
}

function insertAfter(content, anchor, insertion, label) {
  if (content.includes(insertion)) {
    return { content, changed: false, already: true };
  }
  const count = content.split(anchor).length - 1;
  if (count !== 1) {
    throw new Error(
      `Patch '${label}' expected exactly one anchor, found ${count}. Upstream source changed.`,
    );
  }
  return {
    content: content.replace(anchor, () => anchor + insertion),
    changed: true,
    already: false,
  };
}

function insertBefore(content, anchor, insertion, label) {
  if (content.includes(insertion)) {
    return { content, changed: false, already: true };
  }
  const count = content.split(anchor).length - 1;
  if (count !== 1) {
    throw new Error(
      `Patch '${label}' expected exactly one anchor, found ${count}. Upstream source changed.`,
    );
  }
  return {
    content: content.replace(anchor, () => insertion + anchor),
    changed: true,
    already: false,
  };
}

function patchFile(rel, mutator) {
  patchAbsoluteFile(file(rel), rel, mutator);
}

function patchFirstExistingFile(candidates, mutator) {
  for (const rel of candidates) {
    const filePath = file(rel);
    if (fs.existsSync(filePath)) {
      patchAbsoluteFile(filePath, rel, mutator);
      return;
    }
  }

  throw new Error(
    `Missing OMP source file: tried ${candidates.map((rel) => file(rel)).join(", ")}\nIs @oh-my-pi/pi-coding-agent installed globally with Bun?`,
  );
}

function patchTuiFile(rel, mutator) {
  patchAbsoluteFile(tuiFile(rel), `pi-tui/${rel}`, mutator);
}

function patchPiAiFile(rel, mutator) {
  const files = piAiFiles(rel);
  if (files.length === 0) requireFile(path.join(home, ".bun/install/global/node_modules/@oh-my-pi/pi-ai/src", rel));
  for (const filePath of files) {
    const label = filePath.includes(`${path.sep}dev${path.sep}dotfiles${path.sep}`)
      ? `workspace pi-ai/${rel}`
      : `pi-ai/${rel}`;
    patchAbsoluteFile(filePath, label, mutator);
  }
}

function patchAbsoluteFile(filePath, label, mutator) {
  requireFile(filePath);
  const before = read(filePath);
  const after = mutator(before, filePath);
  if (after !== before) {
    write(filePath, after);
    console.log(`patched ${label}`);
  } else {
    console.log(`ok      ${label}`);
  }
}

function rebuildBundledCli() {
  for (const entry of fs.readdirSync(path.join(packageRoot, "dist"))) {
    if (entry === "cli.js" || (entry.startsWith("CHANGELOG-") && entry.endsWith(".md"))) {
      fs.rmSync(path.join(packageRoot, "dist", entry), { force: true });
    }
  }
  execFileSync(
    "bun",
    [
      "build",
      "--target=bun",
      "--outdir=dist",
      "--minify-whitespace",
      "--minify-syntax",
      "--keep-names",
      "--external=mupdf",
      "--external=@oh-my-pi/pi-natives",
      "--external=@huggingface/transformers",
      "--external=fastembed",
      "--external=onnxruntime-node",
      "--external=omp-legacy-pi-modules",
      "--external=puppeteer-core",
      "--external=@puppeteer/browsers",
      "--external=@babel/parser",
      "--external=@xterm/headless",
      "--external=turndown",
      "--external=turndown-plugin-gfm",
      "--external=@mozilla/readability",
      "--external=linkedom",
      "--external=@agentclientprotocol/sdk",
      '--define=process.env.PI_BUNDLED="true"',
      "./src/cli.ts",
    ],
    { cwd: packageRoot, stdio: "inherit" },
  );
  const cliPath = path.join(packageRoot, "dist/cli.js");
  let bundled = read(cliPath);
  if (!bundled.startsWith("#!")) bundled = `#!/usr/bin/env bun\n${bundled}`;
  if (!bundled.includes("path.basename")) bundled += "\n/* omp patch marker: path.basename */\n";
  write(cliPath, bundled);
  console.log("rebuilt OMP bundled CLI");
}

function ensureRuntimeLink(linkPath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  if (
    fs.existsSync(linkPath) ||
    fs.lstatSync(linkPath, { throwIfNoEntry: false })?.isSymbolicLink()
  ) {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink()) {
      const currentTarget = fs.readlinkSync(linkPath);
      if (currentTarget === targetPath) return;
      fs.rmSync(linkPath);
    } else if (!fs.existsSync(targetPath)) {
      fs.renameSync(linkPath, targetPath);
    } else {
      if (stat.isDirectory()) {
        fs.cpSync(linkPath, targetPath, {
          recursive: true,
          force: false,
          errorOnExist: false,
        });
      }
      fs.rmSync(linkPath, { recursive: true, force: true });
    }
  }

  fs.symlinkSync(targetPath, linkPath);
}

function setupRuntimeStateLinks() {
  const agentDir = path.join(home, "dev/dotfiles/omp/agent");
  const dataRoot = path.join(home, ".local/share/omp");
  const stateRoot = path.join(home, ".local/state/omp");

  fs.mkdirSync(path.join(dataRoot, "sessions"), { recursive: true });
  fs.mkdirSync(path.join(dataRoot, "blobs"), { recursive: true });
  fs.mkdirSync(path.join(stateRoot, "terminal-sessions"), { recursive: true });

  const links = [
    ["agent.db", path.join(dataRoot, "agent.db")],
    ["agent.db-shm", path.join(dataRoot, "agent.db-shm")],
    ["agent.db-wal", path.join(dataRoot, "agent.db-wal")],
    ["history.db", path.join(dataRoot, "history.db")],
    ["history.db-shm", path.join(dataRoot, "history.db-shm")],
    ["history.db-wal", path.join(dataRoot, "history.db-wal")],
    ["models.db", path.join(dataRoot, "models.db")],
    ["models.db-shm", path.join(dataRoot, "models.db-shm")],
    ["models.db-wal", path.join(dataRoot, "models.db-wal")],
    ["sessions", path.join(dataRoot, "sessions")],
    ["blobs", path.join(dataRoot, "blobs")],
    ["terminal-sessions", path.join(stateRoot, "terminal-sessions")],
  ];

  for (const [name, target] of links) {
    ensureRuntimeLink(path.join(agentDir, name), target);
  }

  console.log("ok      OMP runtime state links");
}

function patchPiAiOpenAICompletions(content) {
  let out = content;
  let r;

  r = replaceAny(
    out,
    [
      `import { adaptSchemaForStrict, NO_STRICT, toolWireSchema } from "../utils/schema";`,
      `import {\n\tadaptSchemaForStrict,\n\tNO_STRICT,\n\tnormalizeSchemaForMoonshot,\n\tsanitizeSchemaForGrammar,\n\ttoolWireSchema,\n} from "../utils/schema";`,
      `import { adaptSchemaForStrict, NO_STRICT, sanitizeSchemaForOpenAIResponses, toolWireSchema } from "../utils/schema";`,
      `import { adaptSchemaForStrict, NO_STRICT, normalizeSchemaForMoonshot, toolWireSchema } from "../utils/schema";`,
      `import { adaptSchemaForStrict, NO_STRICT, normalizeSchemaForMoonshot, sanitizeSchemaForOpenAIResponses, toolWireSchema } from "../utils/schema";`,
      `import {\n\tadaptSchemaForStrict,\n\tNO_STRICT,\n\tnormalizeSchemaForMoonshot,\n\tsanitizeSchemaForGrammar,\n\tsanitizeSchemaForOpenAIResponses,\n\ttoolWireSchema,\n} from "../utils/schema";`,
    ],
    `import {\n\tadaptSchemaForStrict,\n\tNO_STRICT,\n\tnormalizeSchemaForMoonshot,\n\tsanitizeSchemaForGrammar,\n\tsanitizeSchemaForOpenAIResponses,\n\ttoolWireSchema,\n} from "../utils/schema";`,
    "pi-ai openai-completions import schema sanitizer",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\tconst baseParameters = toolWireSchema(tool);\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
      `\t\tconst baseParameters = sanitizeSchemaForOpenAIResponses(toolWireSchema(tool));\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
      `\t\tconst strict = !NO_STRICT && compat.supportsStrictMode !== false && tool.strict !== false;\n\t\tconst baseParameters = toolWireSchema(tool);\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
      `\t\tconst strict = !NO_STRICT && compat.supportsStrictMode !== false && tool.strict !== false;\n\t\tconst baseParameters = sanitizeSchemaForOpenAIResponses(toolWireSchema(tool));\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
    ],
    `\t\tconst baseParameters = sanitizeSchemaForOpenAIResponses(toolWireSchema(tool));\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
    "pi-ai openai-completions sanitize base tool schema",
  );
  out = r.content;

  return out;
}

function patchPiAiSchemaNormalize(content) {
  let out = content;
  let r;

  r = replaceAny(
    out,
    [
      `const OPENAI_RESPONSES_SCHEMA_VALUE_KEYS = new Set([\n\t"items",`,
      `const UNSUPPORTED_OPENAI_REGEX_TOKENS = /\\(\\?[=!<]/;\n\nconst OPENAI_RESPONSES_SCHEMA_VALUE_KEYS = new Set([\n\t"items",`,
    ],
    `const UNSUPPORTED_OPENAI_REGEX_TOKENS = /\\(\\?[=!<]/;\n\nconst OPENAI_RESPONSES_SCHEMA_VALUE_KEYS = new Set([\n\t"items",`,
    "pi-ai openai schema unsupported regex constant",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\tconst child = value[key];\n\t\tlet next: unknown = child;`,
      `\t\tif (key === "pattern" && typeof value.pattern === "string" && UNSUPPORTED_OPENAI_REGEX_TOKENS.test(value.pattern)) {\n\t\t\tchanged = true;\n\t\t\tcontinue;\n\t\t}\n\n\t\tconst child = value[key];\n\t\tlet next: unknown = child;`,
    ],
    `\t\tif (key === "pattern" && typeof value.pattern === "string" && UNSUPPORTED_OPENAI_REGEX_TOKENS.test(value.pattern)) {\n\t\t\tchanged = true;\n\t\t\tcontinue;\n\t\t}\n\n\t\tconst child = value[key];\n\t\tlet next: unknown = child;`,
    "pi-ai openai schema strip lookaround patterns",
  );
  out = r.content;

  return out;
}

function patchPiAiTypes(content) {
  const current = `export function serviceTierFamily(model: ServiceTierModel): ServiceTierFamily | undefined {
	const provider = model.provider;
	if (provider === "openrouter") {`;
  const previousLunaOnly = `export function serviceTierFamily(model: ServiceTierModel): ServiceTierFamily | undefined {
	if (model.provider === "omniroute" && model.id === "cx/gpt-5.6-luna") return "openai";
	const provider = model.provider;
	if (provider === "openrouter") {`;
  const patched = `export function serviceTierFamily(model: ServiceTierModel): ServiceTierFamily | undefined {
	if (model.provider === "omniroute") return model.id === "cx/gpt-5.6-luna" ? "openai" : undefined;
	const provider = model.provider;
	if (provider === "openrouter") {`;
  return replaceAny(content, [current, previousLunaOnly, patched], patched, "pi-ai Luna-only service tier family").content;
}

function patchModelControlsLunaPriority(content) {
  const current = `		if (!model) return undefined;
		return resolveModelServiceTier(this.#serviceTierByFamily, model);`;
  const patched = `		if (!model) return undefined;
		if (model.provider === "omniroute" && model.id === "cx/gpt-5.6-luna") return "priority";
		return resolveModelServiceTier(this.#serviceTierByFamily, model);`;
  return replaceAny(content, [current, patched], patched, "Luna always uses priority service tier").content;
}

function patchPlannotatorBrowserRuntime(content) {
  let out = content;
  let r;

  if (!out.includes(`import { homedir } from "node:os";`)) {
    r = replaceOnce(
      out,
      `import { fileURLToPath } from "node:url";`,
      `import { fileURLToPath } from "node:url";
import { homedir } from "node:os";`,
      "plannotator browser homedir import",
    );
    out = r.content;
  }

  r = replaceAny(
    out,
    [
      `const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const planHtmlPath = resolve(moduleDirectory, "plannotator.html");
const reviewHtmlPath = resolve(moduleDirectory, "review-editor.html");

let browserModulePromise: Promise<PlannotatorBrowserModule> | undefined;
let planHtmlContent: string | undefined;
let reviewHtmlContent: string | undefined;

function hasReadableAsset(path: string, cachedContent: string | undefined): boolean {
	if (cachedContent) return true;
	try {
		const stats = statSync(path);
		return stats.isFile() && stats.size > 0;
	} catch {
		return false;
	}
}

function readBrowserAsset(path: string, cachedContent: string | undefined): string {
	if (cachedContent !== undefined) return cachedContent;
	try {
		return readFileSync(path, "utf-8");
	} catch {
		return "";
	}
}

/** Return whether the built plan/annotation/archive UI is available without reading it into memory. */
export function hasPlanBrowserHtml(): boolean {
	return hasReadableAsset(planHtmlPath, planHtmlContent);
}

/** Return whether the built code-review UI is available without reading it into memory. */
export function hasReviewBrowserHtml(): boolean {
	return hasReadableAsset(reviewHtmlPath, reviewHtmlContent);
}

/** Read and cache the built plan/annotation/archive UI on first use. */
export function getPlanBrowserHtml(): string {
	const content = readBrowserAsset(planHtmlPath, planHtmlContent);
	if (content) planHtmlContent = content;
	return content;
}

/** Read and cache the built code-review UI on first use. */
export function getReviewBrowserHtml(): string {
	const content = readBrowserAsset(reviewHtmlPath, reviewHtmlContent);
	if (content) reviewHtmlContent = content;
	return content;
}`,
      `const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const pluginAssetDirectory = resolve(homedir(), ".omp/plugins/node_modules/@plannotator/pi-extension");
const planHtmlPaths = [resolve(moduleDirectory, "plannotator.html"), resolve(pluginAssetDirectory, "plannotator.html")];
const reviewHtmlPaths = [resolve(moduleDirectory, "review-editor.html"), resolve(pluginAssetDirectory, "review-editor.html")];

let browserModulePromise: Promise<PlannotatorBrowserModule> | undefined;
let planHtmlContent: string | undefined;
let reviewHtmlContent: string | undefined;

function hasReadableAsset(paths: string[], cachedContent: string | undefined): boolean {
	if (cachedContent) return true;
	for (const path of paths) {
		try {
			const stats = statSync(path);
			if (stats.isFile() && stats.size > 0) return true;
		} catch {
			// try the next candidate
		}
	}
	return false;
}

function readBrowserAsset(paths: string[], cachedContent: string | undefined): string {
	if (cachedContent !== undefined) return cachedContent;
	for (const path of paths) {
		try {
			return readFileSync(path, "utf-8");
		} catch {
			// try the next candidate
		}
	}
	return "";
}

/** Return whether the built plan/annotation/archive UI is available without reading it into memory. */
export function hasPlanBrowserHtml(): boolean {
	return hasReadableAsset(planHtmlPaths, planHtmlContent);
}

/** Return whether the built code-review UI is available without reading it into memory. */
export function hasReviewBrowserHtml(): boolean {
	return hasReadableAsset(reviewHtmlPaths, reviewHtmlContent);
}

/** Read and cache the built plan/annotation/archive UI on first use. */
export function getPlanBrowserHtml(): string {
	const content = readBrowserAsset(planHtmlPaths, planHtmlContent);
	if (content) planHtmlContent = content;
	return content;
}

/** Read and cache the built code-review UI on first use. */
export function getReviewBrowserHtml(): string {
	const content = readBrowserAsset(reviewHtmlPaths, reviewHtmlContent);
	if (content) reviewHtmlContent = content;
	return content;
}`,
    ],
    `const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const pluginAssetDirectory = resolve(homedir(), ".omp/plugins/node_modules/@plannotator/pi-extension");
const planHtmlPaths = [resolve(moduleDirectory, "plannotator.html"), resolve(pluginAssetDirectory, "plannotator.html")];
const reviewHtmlPaths = [resolve(moduleDirectory, "review-editor.html"), resolve(pluginAssetDirectory, "review-editor.html")];

let browserModulePromise: Promise<PlannotatorBrowserModule> | undefined;
let planHtmlContent: string | undefined;
let reviewHtmlContent: string | undefined;

function hasReadableAsset(paths: string[], cachedContent: string | undefined): boolean {
	if (cachedContent) return true;
	for (const path of paths) {
		try {
			const stats = statSync(path);
			if (stats.isFile() && stats.size > 0) return true;
		} catch {
			// try the next candidate
		}
	}
	return false;
}

function readBrowserAsset(paths: string[], cachedContent: string | undefined): string {
	if (cachedContent !== undefined) return cachedContent;
	for (const path of paths) {
		try {
			return readFileSync(path, "utf-8");
		} catch {
			// try the next candidate
		}
	}
	return "";
}

/** Return whether the built plan/annotation/archive UI is available without reading it into memory. */
export function hasPlanBrowserHtml(): boolean {
	return hasReadableAsset(planHtmlPaths, planHtmlContent);
}

/** Return whether the built code-review UI is available without reading it into memory. */
export function hasReviewBrowserHtml(): boolean {
	return hasReadableAsset(reviewHtmlPaths, reviewHtmlContent);
}

/** Read and cache the built plan/annotation/archive UI on first use. */
export function getPlanBrowserHtml(): string {
	const content = readBrowserAsset(planHtmlPaths, planHtmlContent);
	if (content) planHtmlContent = content;
	return content;
}

/** Read and cache the built code-review UI on first use. */
export function getReviewBrowserHtml(): string {
	const content = readBrowserAsset(reviewHtmlPaths, reviewHtmlContent);
	if (content) reviewHtmlContent = content;
	return content;
}`,
    "plannotator browser asset fallback",
  );
  out = r.content;

  return out;
}


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
  r = replaceAny(
    out,
    [
      `import { resolveModelRoleValue } from "../../../config/model-resolver";`,
      `import { type ThemeColor, theme } from "../../../modes/theme/theme";`,
    ],
    `import { resolveModelRoleValue } from "../../../config/model-resolver";\nimport { type ThemeColor, theme } from "../../../modes/theme/theme";`,
    "segments model role resolver import",
  );
  out = r.content;

  r = replaceOnce(
    out,
    `\t\tif (opts.abbreviate !== false) {\n\t\t\tpwd = shortenPath(pwd);\n\t\t}`,
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

  if (!out.includes(`\t\tconst providerSuffix = modelName.endsWith(" OMNi") ? " OMNi" : "";`)) {
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
    `\t\tlet content = withIcon(modelIcon, modelName);\n\t\tif (ctx.session.isAdvisorActive()) {\n\t\t\tcontent += theme.fg("success", "++");\n\t\t}\n\t\tif (tail) {\n\t\t\tcontent += tail;\n\t\t}\n\t\tconst providerMatch = content.match(/^(.*) (OMNi)(.*)$/);\n\t\tconst modelContent = providerMatch\n\t\t\t? \`\${theme.fg("statusLineModel", providerMatch[1])} \${theme.fg("dim", providerMatch[2] + providerMatch[3])}\`\n\t\t\t: theme.fg("statusLineModel", content);\n\t\tconst roleColors = { smol: "statusLineSpend", default: "success", slow: "warning" } as const;\n\t\tconst roles = (["smol", "default", "slow"] as const).filter(role => {\n\t\t\tconst resolved = resolveModelRoleValue(\n\t\t\t\tctx.session.settings.getModelRole(role),\n\t\t\t\tctx.session.modelRegistry.getAvailable(),\n\t\t\t\t{ settings: ctx.session.settings },\n\t\t\t).model;\n\t\t\treturn resolved?.provider === state.model?.provider && resolved.id === state.model?.id;\n\t\t});\n\t\tconst roleContent = roles.length\n\t\t\t? \` \${roles.map(role => theme.fg(roleColors[role], role)).join("/")}\`\n\t\t\t: "";\n\t\treturn { content: \`\${theme.fg("text", "via ")}\${modelContent}\${roleContent}\`, visible: true };`
    , "segments model display via");
  out = r.content;
  }
  if (
    out.includes(`\t\tlet content = withIcon(modelIcon, modelName);`) &&
    !out.includes(`\t\tconst providerSuffix = modelName.endsWith(" OMNi") ? " OMNi" : "";`)
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
  const accentedLimitedSessionName = `const sessionNameSegment: StatusLineSegment = {\n\tid: "session_name",\n\trender(ctx) {\n\t\tconst sessionManager = ctx.session.sessionManager;\n\t\tconst name = sessionManager?.getSessionName();\n\t\tif (!name) return { content: "", visible: false };\n\n\t\tconst maxSessionNameWidth = 24;\n\t\tconst cleanName = sanitizeStatusText(name);\n\t\tconst display = visibleWidth(cleanName) > maxSessionNameWidth ? truncateToWidth(cleanName, maxSessionNameWidth) : cleanName;\n\n\t\tconst ansi = getSessionAccentAnsi(getSessionAccentHex(name)) ?? theme.getFgAnsi("accent");\n\t\treturn { content: \`\${ansi}\${display}\\x1b[39m\`, visible: true };\n\t},\n};`;
  const limitedSessionName = `const sessionNameSegment: StatusLineSegment = {\n\tid: "session_name",\n\trender(ctx) {\n\t\tconst sessionManager = ctx.session.sessionManager;\n\t\tconst name = sessionManager?.getSessionName();\n\t\tif (!name) return { content: "", visible: false };\n\n\t\tconst maxSessionNameWidth = 48;\n\t\tconst cleanName = sanitizeStatusText(name);\n\t\tconst display = visibleWidth(cleanName) > maxSessionNameWidth ? truncateToWidth(cleanName, maxSessionNameWidth) : cleanName;\n\n\t\treturn { content: \`\${theme.fg("muted", display)}  \`, visible: true };\n\t},\n};`;

  r = replaceAny(
    out,
    [
      upstreamSessionName15_8,
      upstreamSessionName15_9,
      upstreamSessionName15_12,
      upstreamSessionName17_2_11,
      accentedLimitedSessionName,
      limitedSessionName,
    ],
    limitedSessionName,
    "segments session name max width",
  );
  out = r.content;

  return out;
}

function patchWelcome(content) {
  const alreadyPatched = `\t#renderLines(_termWidth: number): string[] {\n\t\treturn [theme.bold("Welcome from Oh My Pi")];\n\n\t\t// Box dimensions - responsive with max width and small-terminal support`;
  const alreadyPatchedOld = `\trender(_termWidth: number): string[] {\n\t\treturn [theme.bold("Welcome from Oh My Pi")];\n\n\t\t// Box dimensions - responsive with max width and small-terminal support`;
  return replaceAny(
    content,
    [
      `\t#renderLines(termWidth: number): string[] {\n\t\t// Box dimensions - responsive with max width and small-terminal support`,
      alreadyPatched,
      `\trender(termWidth: number): string[] {\n\t\t// Box dimensions - responsive with max width and small-terminal support`,
      alreadyPatchedOld,
      `\t#renderLines(_termWidth: number): string[] {\n\t\treturn [theme.bold("Welcome from Oh My Pi"), ""]\n\n\t\t// Box dimensions - responsive with max width and small-terminal support`,
      `\trender(_termWidth: number): string[] {\n\t\treturn [theme.bold("Welcome from Oh My Pi"), ""]\n\n\t\t// Box dimensions - responsive with max width and small-terminal support`,
    ],
    alreadyPatched,
    "welcome minimal text only",
  ).content;
}
function patchAssistantMessage(content) {
  let out = content;
  const replacements = [
    [
      [
        "new Markdown(content.text.trim(), 1, 0, getMarkdownTheme())",
        "new Markdown(trimmed, 1, 0, getMarkdownTheme())",
        "new Markdown(trimmed, 1, 0, getMarkdownTheme(), mdOptions)",
        "new Markdown(content.text.trim(), 0, 0, getMarkdownTheme())",
        "new Markdown(trimmed, 0, 0, getMarkdownTheme())",
        "new Markdown(trimmed, 0, 0, getMarkdownTheme(), mdOptions)",
        "new Markdown(trimmed, 1, 0, getMarkdownTheme(), mdOptions, 0)",
        "new Markdown(trimmed, 0, 0, getMarkdownTheme(), mdOptions, 0)",
      ],
      "new Markdown(trimmed, 0, 0, getMarkdownTheme(), mdOptions, 0)",
      "assistant text padding",
    ],
    [
      [
        'new Text(theme.italic(theme.fg("thinkingText", "Thinking...")), 1, 0)',
        'new Text(theme.italic(theme.fg("thinkingText", "Thinking...")), 0, 0)',
      ],
      'new Text(theme.italic(theme.fg("thinkingText", "Thinking...")), 0, 0)',
      "assistant thinking label padding",
      true, // skipIfMissing
    ],
    [
      [
        "new Markdown(thinkingText, 1, 0, getMarkdownTheme(), {",
        "new Markdown(thinkingText, 0, 0, getMarkdownTheme(), {",
      ],
      "new Markdown(thinkingText, 0, 0, getMarkdownTheme(), {",
      "assistant thinking block padding",
    ],
    [
      [
        'new Text(theme.fg("error", errorPresentation.text), 1, 0)',
        'new Text(theme.fg("error", errorPresentation.text), 0, 0)',
        'new Text(theme.fg("error", abortMessage), 1, 0)',
        'new Text(theme.fg("error", abortMessage), 0, 0)',
      ],
      'new Text(theme.fg("error", errorPresentation.text), 0, 0)',
      "assistant abort padding",
    ],
  ];
  for (const [alternatives, newText, label, skipIfMissing] of replacements) {
    if (
      skipIfMissing &&
      !alternatives.some((a) => out.includes(a.replace(/, 1, 0/, ", 0, 0")))
    )
      continue;
    out = replaceAny(out, alternatives, newText, label).content;
  }
  return out;
}

function patchUsageRow(content) {
  return replaceAny(
    content,
    [
      'new Text(theme.fg("dim", parts.join("  ")), 1, 0)',
      'new Text(theme.fg("dim", parts.join("  ")), 0, 0)',
      'new Text(theme.fg("dim", formatUsageRow(usage, durationMs, ttftMs, timestamp)), 1, 0)',
      'new Text(theme.fg("dim", formatUsageRow(usage, durationMs, ttftMs, timestamp)), 0, 0)',
    ],
    'new Text(theme.fg("dim", formatUsageRow(usage, durationMs, ttftMs, timestamp)), 0, 0)',
    "assistant usage padding",
  ).content;
}


function patchUserMessage(content) {
  return replaceOnce(
    content,
    "new Markdown(text, 1, 1, getMarkdownTheme(), {",
    "new Markdown(text, 0, 1, getMarkdownTheme(), {",
    "user message padding",
  ).content;
}

function patchInteractiveMode(content) {
  let out = content;
  let r;

  r = replaceAny(
    out,
    [
      `\t\t\t// Setup UI layout\n\t\t\tthis.ui.addChild(new Spacer(1));\n\t\t\tthis.ui.addChild(this.#welcomeComponent);\n\t\t\tthis.ui.addChild(new Spacer(1));`,
      `\t\t\t// Setup UI layout\n\t\t\tthis.ui.addChild(this.#welcomeComponent);`,
    ],
    `\t\t\t// Setup UI layout\n\t\t\tthis.ui.addChild(this.#welcomeComponent);`,
    "interactive welcome spacing",
  );
  out = r.content;

  r = replaceAny(
    out,
    [`		if (!startupQuiet) {`, `		if (true) {`],
    `		if (true) {`,
    "interactive minimal welcome visible in quiet mode",
  );
  out = r.content;

  r = replaceAny(
    out,
    [`			if (!options.suppressWelcomeIntro) {`, `			if (!startupQuiet && !options.suppressWelcomeIntro) {`],
    `			if (!startupQuiet && !options.suppressWelcomeIntro) {`,
    "interactive quiet skips welcome intro animation",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `			if (this.#startupChangelog && settings.get("startup.changelogMode") !== "hidden") {`,
      `			if (!startupQuiet && this.#startupChangelog && settings.get("startup.changelogMode") !== "hidden") {`,
    ],
    `			if (!startupQuiet && this.#startupChangelog && settings.get("startup.changelogMode") !== "hidden") {`,
    "interactive quiet suppresses changelog noise",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\tthis.editor = new CustomEditor(getEditorTheme());\n\t\tthis.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      `\t\tthis.editor = new CustomEditor(getEditorTheme());\n\t\tthis.ui.enableScopedInputRender(this.editor);\n\t\tthis.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      `\t\tthis.editor = new CustomEditor(getEditorTheme());\n\t\tthis.editor.setBorderVisible(false);\n\t\tthis.editor.setPaddingX(0);\n\t\tthis.editor.setPromptGutter(" ");\n\t\tthis.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      `\t\tthis.editor = new CustomEditor(getEditorTheme());\n\t\tthis.editor.setBorderVisible(false);\n\t\tthis.editor.setPaddingX(0);\n\t\tthis.editor.setPromptGutter(" ");\n\t\tthis.editor.setPromptGutterColor(theme.fg.bind(theme, "success"));\n\t\tthis.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
    ],
    `\t\tthis.editor = new CustomEditor(getEditorTheme());\n\t\tthis.ui.enableScopedInputRender(this.editor);\n\t\tthis.editor.setBorderVisible(false);\n\t\tthis.editor.setPaddingX(0);\n\t\tthis.editor.setPromptGutter(" ");\n\t\tthis.editor.setPromptGutterColor(theme.fg.bind(theme, "success"));\n\t\tthis.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
    "interactive editor default gutter",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\t\tif (!factory) this.ui.enableScopedInputRender(nextEditor);\n\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\n\t\tnextEditor.setBorderVisible(false);\n\t\tnextEditor.setPaddingX(0);\n\t\tnextEditor.setPromptGutter(" ");\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\n\t\tnextEditor.setBorderVisible(false);\n\t\tnextEditor.setPaddingX(0);\n\t\tnextEditor.setPromptGutter(" ");\n\t\tnextEditor.setPromptGutterColor(theme.fg.bind(theme, "success"));\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
    ],
    `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\t\tif (!factory) this.ui.enableScopedInputRender(nextEditor);\n\n\t\tnextEditor.setBorderVisible(false);\n\t\tnextEditor.setPaddingX(0);\n\t\tnextEditor.setPromptGutter(" ");\n\t\tnextEditor.setPromptGutterColor(theme.fg.bind(theme, "success"));\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
    "interactive replacement editor gutter",
  );
  out = r.content;

  return out;
}

function patchTuiVisibleWidth(content) {
  // Upstream 15.10+ handles ANSI natively via Bun.stringWidth and its own
  // escape scanner — the old ANSI-strip workaround is no longer needed.
  return content;
}

function patchKeybindingsConfig(content) {
  let out = content;
  let r;

  r = insertAfter(
    out,
    `\t"app.session.observe": true;\n`,
    `\t"app.session.compact": true;\n`,
    "keybindings app.session.compact interface",
  );
  out = r.content;

  r = insertAfter(
    out,
    `\t"app.session.observe": {\n\t\tdefaultKeys: "ctrl+s",\n\t\tdescription: "Open the agent hub",\n\t},\n`,
    `\t"app.session.compact": {\n\t\tdefaultKeys: [],\n\t\tdescription: "Compact current session",\n\t},\n`,
    "keybindings app.session.compact definition",
  );
  return r.content;
}

function patchInputControllerBase(content) {
  const newHandler = `\thandleCtrlZ(): void {
\t\tif (process.platform === "win32" || !process.stdout.isTTY) {
\t\t\tthis.ctx.showStatus("Suspend (Ctrl+Z) is not supported on this platform");
\t\t\treturn;
\t\t}

\t\t// Set up handler to restore TUI when resumed.
\t\tconst onResume = (): void => {
\t\t\tthis.ctx.ui.start();
\t\t\tthis.ctx.ui.requestRender(true);
\t\t};
\t\tprocess.once("SIGCONT", onResume);

\t\t// Stop the TUI (restore terminal to normal mode) before suspending only OMP.
\t\tthis.ctx.ui.stop();

\t\ttry {
\t\t\t// Keep shell job-control flow intact: suspend OMP itself, not the whole process group.
\t\t\tprocess.kill(process.pid, "SIGTSTP");
\t\t} catch (err) {
\t\t\tprocess.removeListener("SIGCONT", onResume);
\t\t\tthis.ctx.ui.start();
\t\t\tthis.ctx.ui.requestRender(true);
\t\t\tconst reason = err instanceof Error ? err.message : String(err);
\t\t\tthis.ctx.showError(\`Failed to suspend: \${reason}\`);
\t\t}
\t}`;

  if (content.includes(newHandler)) return content;

  const start = content.indexOf("\thandleCtrlZ(): void {");
  const endAnchor = "\n\n\thandleDequeue(): void {";
  const end = start === -1 ? -1 : content.indexOf(endAnchor, start);
  if (start === -1 || end === -1) {
    throw new Error(
      "Patch 'input-controller ctrl-z suspends only omp process' could not find handleCtrlZ block. Upstream source changed.",
    );
  }

  return `${content.slice(0, start)}${newHandler}${content.slice(end)}`;
}

function patchInputController(content) {
  let out = patchInputControllerBase(content);
  const r = insertAfter(
    out,
    `		const planModeKeys = this.ctx.keybindings.getKeys("app.plan.toggle");
		for (const key of planModeKeys) {
			this.ctx.editor.setCustomKeyHandler(key, () => void this.ctx.handlePlanModeCommand());
		}
`,
    `
		for (const key of this.ctx.keybindings.getKeys("app.session.compact")) {
			this.ctx.editor.setCustomKeyHandler(key, () => void this.ctx.handleCompactCommand());
		}
`,
    "input-controller app.session.compact handler",
  );
  return r.content;
}

function patchSessionManager(content) {
  let out = content;
  let r;

  r = insertAfter(
    out,
    `function mintSessionId(): string {\n\treturn Bun.randomUUIDv7();\n}\n`,
    `\nfunction inferSessionIdFromPath(filePath: string): string | undefined {\n\tconst fileName = path.basename(filePath, ".jsonl");\n\tconst separator = fileName.lastIndexOf("_");\n\tconst candidate = separator >= 0 ? fileName.slice(separator + 1) : fileName;\n\treturn /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)\n\t\t? candidate\n\t\t: undefined;\n}\n`,
    "session-manager infer id from session file path",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t#resetToNewSession(options?: NewSessionOptions, forcedSessionFile?: string): string | undefined {\n\t\tthis.#diskTail = Promise.resolve();\n\t\tthis.#clearDiskError();\n\t\tthis.#sessionId = mintSessionId();`,
      `\t#resetToNewSession(options?: NewSessionOptions, forcedSessionFile?: string): string | undefined {\n\t\tthis.#diskTail = Promise.resolve();\n\t\tthis.#clearDiskError();\n\t\tthis.#sessionId = forcedSessionFile ? inferSessionIdFromPath(forcedSessionFile) ?? mintSessionId() : mintSessionId();`,
    ],
    `\t#resetToNewSession(options?: NewSessionOptions, forcedSessionFile?: string): string | undefined {\n\t\tthis.#diskTail = Promise.resolve();\n\t\tthis.#clearDiskError();\n\t\tthis.#sessionId = forcedSessionFile ? inferSessionIdFromPath(forcedSessionFile) ?? mintSessionId() : mintSessionId();`,
    "session-manager recovery keeps path id",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `function isAssistantEntry(entry: SessionEntry): boolean {\n\treturn entry.type === "message" && entry.message.role === "assistant";\n}\n`,
      `function isUserOrAssistantEntry(entry: SessionEntry): boolean {\n\treturn entry.type === "message" && (entry.message.role === "user" || entry.message.role === "assistant");\n}\n`,
    ],
    `function isUserOrAssistantEntry(entry: SessionEntry): boolean {\n\treturn entry.type === "message" && (entry.message.role === "user" || entry.message.role === "assistant");\n}\n`,
    "session-manager persist submitted prompts",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t#historyContainsAssistantMessage(): boolean {\n\t\treturn this.#entries.some(isAssistantEntry);\n\t}\n`,
      `\t#historyContainsAssistantMessage(): boolean {\n\t\treturn this.#entries.some(isUserOrAssistantEntry);\n\t}\n`,
    ],
    `\t#historyContainsAssistantMessage(): boolean {\n\t\treturn this.#entries.some(isUserOrAssistantEntry);\n\t}\n`,
    "session-manager user prompt opens session file",
  );
  out = r.content;

  return out;
}

function patchEditorGutterWidth(content) {
  let out = content;
  let r;

  r = replaceAny(
    out,
    [
      `\t#promptGutter: string | undefined;`,
      `\t#promptGutter: string | undefined;\n\t#promptGutterColor: ((str: string) => string) | undefined;`,
    ],
    `\t#promptGutter: string | undefined;\n\t#promptGutterColor: ((str: string) => string) | undefined;`,
    "editor prompt gutter color field",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\tsetPromptGutter(promptGutter: string | undefined): void {\n\t\tthis.#promptGutter = promptGutter;\n\t}`,
      `\tsetPromptGutter(promptGutter: string | undefined): void {\n\t\tthis.#promptGutter = promptGutter;\n\t}\n\n\tsetPromptGutterColor(color: ((str: string) => string) | undefined): void {\n\t\tthis.#promptGutterColor = color;\n\t}`,
    ],
    `\tsetPromptGutter(promptGutter: string | undefined): void {\n\t\tthis.#promptGutter = promptGutter;\n\t}\n\n\tsetPromptGutterColor(color: ((str: string) => string) | undefined): void {\n\t\tthis.#promptGutterColor = color;\n\t}`,
    "editor prompt gutter color setter",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\treturn {\n\t\t\tfirstLine: sliceByColumn(this.#promptGutter, 0, gutterWidth, true),\n\t\t\tcontinuation: padding(gutterWidth),\n\t\t\twidth: gutterWidth,\n\t\t};`,
      `\t\tconst firstLine = sliceByColumn(this.#promptGutter, 0, gutterWidth, true);\n\t\treturn {\n\t\t\tfirstLine: this.#promptGutterColor ? this.#promptGutterColor(firstLine) : firstLine,\n\t\t\tcontinuation: padding(gutterWidth),\n\t\t\twidth: gutterWidth,\n\t\t};`,
    ],
    `\t\tconst firstLine = sliceByColumn(this.#promptGutter, 0, gutterWidth, true);\n\t\treturn {\n\t\t\tfirstLine: this.#promptGutterColor ? this.#promptGutterColor(firstLine) : firstLine,\n\t\t\tcontinuation: padding(gutterWidth),\n\t\t\twidth: gutterWidth,\n\t\t};`,
    "editor prompt gutter green style",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\tgetTopBorderAvailableWidth(terminalWidth: number): number {\n\t\tconst paddingX = this.#getEditorPaddingX();\n\t\tconst borderWidth = this.#getHorizontalChromeWidth(paddingX);\n\t\treturn Math.max(0, terminalWidth - borderWidth * 2);\n\t}`,
      `\tgetTopBorderAvailableWidth(terminalWidth: number): number {\n\t\tconst paddingX = this.#getEditorPaddingX();\n\t\tconst borderWidth = this.#getHorizontalChromeWidth(paddingX);\n\t\treturn Math.max(0, terminalWidth - borderWidth * 2 - this.#getPromptGutterWidth(terminalWidth, paddingX));\n\t}`,
    ],
    `\tgetTopBorderAvailableWidth(terminalWidth: number): number {\n\t\tconst paddingX = this.#getEditorPaddingX();\n\t\tconst borderWidth = this.#getHorizontalChromeWidth(paddingX);\n\t\treturn Math.max(0, terminalWidth - borderWidth * 2);\n\t}`,
    "editor status width ignores gutter",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t#getPromptGutterWidth(width: number, paddingX: number): number {\n\t\tif (this.#borderVisible || !this.#promptGutter) return 0;\n\t\tconst chromeWidth = 2 * this.#getHorizontalChromeWidth(paddingX);\n\t\tconst availableWidth = Math.max(0, width - chromeWidth);\n\t\treturn Math.min(visibleWidth(this.#promptGutter), availableWidth);\n\t}\n`,
      `\t#getPromptGutterWidth(width: number, paddingX: number): number {\n\t\tif (this.#borderVisible || !this.#promptGutter) return 0;\n\t\tconst chromeWidth = 2 * this.#getHorizontalChromeWidth(paddingX);\n\t\tconst availableWidth = Math.max(0, width - chromeWidth);\n\t\tconst promptGutterWidth = visibleWidth(this.#promptGutter);\n\t\treturn Math.min(promptGutterWidth > 0 ? promptGutterWidth : 1, availableWidth);\n\t}\n`,
    ],
    `\t#getPromptGutterWidth(width: number, paddingX: number): number {\n\t\tif (this.#borderVisible || !this.#promptGutter) return 0;\n\t\tconst chromeWidth = 2 * this.#getHorizontalChromeWidth(paddingX);\n\t\tconst availableWidth = Math.max(0, width - chromeWidth);\n\t\tconst promptGutterWidth = visibleWidth(this.#promptGutter);\n\t\treturn Math.min(promptGutterWidth > 0 ? promptGutterWidth : 1, availableWidth);\n\t}\n`,
    "editor prompt gutter width fallback",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\t// Render each layout line\n`,
      `\t\tif (!borderVisible && this.#topBorderContent) {\n\t\t\tconst gutterPrefix = promptGutter?.continuation ?? "";\n\t\t\tconst contentWidth = Math.max(0, width - visibleWidth(gutterPrefix));\n\t\t\tconst { content, width: statusWidth } = this.#topBorderContent;\n\t\t\tif (statusWidth <= contentWidth) {\n\t\t\t\tresult.push(gutterPrefix + content + padding(contentWidth - statusWidth));\n\t\t\t} else {\n\t\t\t\tresult.push(gutterPrefix + truncateToWidth(content, contentWidth));\n\t\t\t}\n\t\t}\n\n\t\t// Render each layout line\n`,
      `\t\tif (!borderVisible && this.#topBorderContent) {\n\t\t\tconst contentWidth = Math.max(0, width);\n\t\t\tconst { content, width: statusWidth } = this.#topBorderContent;\n\t\t\tif (statusWidth <= contentWidth) {\n\t\t\t\tresult.push(content + padding(contentWidth - statusWidth));\n\t\t\t} else {\n\t\t\t\tresult.push(truncateToWidth(content, contentWidth));\n\t\t\t}\n\t\t}\n\n\t\t// Render each layout line\n`,
      `\t\tif (!borderVisible && this.#topBorderContent) {\n\t\t\tconst contentWidth = Math.max(0, width);\n\t\t\tconst { content, width: statusWidth } = this.#topBorderContent;\n\t\t\tif (statusWidth <= contentWidth) {\n\t\t\t\tresult.push(content + padding(contentWidth - statusWidth));\n\t\t\t} else {\n\t\t\t\tresult.push(truncateToWidth(content, contentWidth));\n\t\t\t}\n\t\t}\n\n\t\t// Render each layout line\n`,
      `\t\tif (!borderVisible) {\n\t\t\tconst topBorder = this.#topBorderProvider ? this.#topBorderProvider(width) : this.#topBorderContent;\n\t\t\tif (topBorder) {\n\t\t\t\tconst contentWidth = Math.max(0, width);\n\t\t\t\tconst { content, width: statusWidth } = topBorder;\n\t\t\t\tif (statusWidth <= contentWidth) {\n\t\t\t\t\tresult.push(content + padding(contentWidth - statusWidth));\n\t\t\t\t} else {\n\t\t\t\t\tresult.push(truncateToWidth(content, contentWidth));\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\t// Render each layout line\n`,
    ],
    `\t\tif (!borderVisible) {\n\t\t\tconst topBorder = this.#topBorderProvider ? this.#topBorderProvider(width) : this.#topBorderContent;\n\t\t\tif (topBorder) {\n\t\t\t\tconst contentWidth = Math.max(0, width);\n\t\t\t\tconst { content, width: statusWidth } = topBorder;\n\t\t\t\tif (statusWidth <= contentWidth) {\n\t\t\t\t\tresult.push(content + padding(contentWidth - statusWidth));\n\t\t\t\t} else {\n\t\t\t\t\tresult.push(truncateToWidth(content, contentWidth));\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\t// Render each layout line\n`,
    "editor borderless status line render",
  );
  out = r.content;

  return out;
}
function patchTuiTerminalCapabilities(content) {
  // Upstream 16.5.2+ moved kitty image transmission to kitty-graphics.ts and
  // already wraps APC sequences with wrapTmuxPassthroughIfNeeded.
  return content;
}

function patchTuiKittyGraphics(content) {
  // Upstream 16.5.2+ moved tmux helpers to ./tmux.ts and already uses
  // wrapTmuxPassthroughIfNeeded for APC wrapping, so no patch needed.
  return content;
}

function patchTuiTerminal(content) {
  // OMP 17.0.1 avoids OSC 99 capability probes in terminal multiplexers.
  return content;
}

function patchCustomEditor(content) {
  let out = content;
  let r;
  r = replaceAny(
    out,
    [
      `\t\t\t// Intercept configured forward model cycling\n\t\t\tif (this.#matchesAction(canonical, "app.model.cycleForward") && this.onCycleModelForward) {\n\t\t\t\tthis.onCycleModelForward();\n\t\t\t\treturn;\n\t\t\t}`,
    ],
    `\t\t\t// Intercept configured forward model cycling\n\t\t\tif (this.#matchesAction(canonical, "app.model.cycleForward") && this.onCycleModelForward && !this.isShowingAutocomplete()) {\n\t\t\t\tthis.onCycleModelForward();\n\t\t\t\treturn;\n\t\t\t}`,
    "custom-editor cycleForward autocomplete guard",
  );
  out = r.content;
  return out;
}
function patchGoalTool(content) {
  return replaceAny(
    content,
    [
      `	const tokenBudget = params.token_budget;
	if (tokenBudget !== undefined && (!Number.isInteger(tokenBudget) || tokenBudget <= 0)) {
		throw new ToolError("token_budget must be a positive integer when provided");
	}
	return { objective, tokenBudget };`,
      `	const tokenBudget = undefined;
	return { objective, tokenBudget };`,
    ],
    `	const tokenBudget = undefined;
	return { objective, tokenBudget };`,
    "goal ignores model token budget",
  ).content;
}


function patchUltrathink(content) {
  let out = content;
  let r;

  r = replaceAny(
    out,
    [
      `const ULTRATHINK_WORD = magicKeywordRegex("ultrathink");`,
      `const ULTRATHINK_WORD = /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:ultrathink|ulw)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/u;`,
    ],
    `const ULTRATHINK_WORD = /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:ultrathink|ulw)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/u;`,
    "ultrathink ulw alias detection",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\tprobe: /ultrathink/,\n\thighlight: magicKeywordRegex("ultrathink", "g"),`,
      `\tprobe: /ultrathink|ulw/,\n\thighlight: /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:ultrathink|ulw)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/gu,`,
    ],
    `\tprobe: /ultrathink|ulw/,\n\thighlight: /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:ultrathink|ulw)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/gu,`,
    "ultrathink ulw alias highlight",
  );
  out = r.content;
  return out;
}

function patchOrchestrate(content) {
  let out = content;
  let r;

  r = replaceAny(
    out,
    [
      `const ORCHESTRATE_WORD = magicKeywordRegex("orchestrate");`,
      `const ORCHESTRATE_WORD = /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:orchestrate|orch)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/u;`,
    ],
    `const ORCHESTRATE_WORD = /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:orchestrate|orch)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/u;`,
    "orchestrate orch alias detection",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\tprobe: /orchestrate/,\n\thighlight: magicKeywordRegex("orchestrate", "g"),`,
      `\tprobe: /orchestrate|orch/,\n\thighlight: /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:orchestrate|orch)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/gu,`,
    ],
    `\tprobe: /orchestrate|orch/,\n\thighlight: /(?<![\\p{L}\\p{N}_./\\\\-])(?<!::)(?:orchestrate|orch)(?![\\p{L}\\p{N}_/\\\\-])(?!\\.[\\p{L}\\p{N}_-])(?!\\()/gu,`,
    "orchestrate orch alias highlight",
  );
  out = r.content;
  return out;
}

function patchMagicKeywords(content) {
  return replaceAny(
    content,
    [
    `\tif (!text.includes("ultrathink") && !text.includes("orchestrate") && !text.includes("workflowz")) {`,
      `\tif (!text.includes("ultrathink") && !text.includes("ulw") && !text.includes("orchestrate") && !text.includes("workflowz")) {`,
    ],
    `\tif (!text.includes("ultrathink") && !text.includes("ulw") && !text.includes("orchestrate") && !text.includes("orch") && !text.includes("workflowz")) {`,
    "magic keyword ulw fast probe",
  ).content;
}

function patchExtensionLoader(content) {
  return replaceAny(
    content,
    [
      `function isExtensionFile(name: string): boolean {\n\treturn name.endsWith(".ts") || name.endsWith(".js");\n}`,
      `function isExtensionFile(name: string): boolean {\n\treturn !name.includes(".test.") && (name.endsWith(".ts") || name.endsWith(".js"));\n}`,
    ],
    `function isExtensionFile(name: string): boolean {\n\treturn !name.includes(".test.") && (name.endsWith(".ts") || name.endsWith(".js"));\n}`,
    "extension discovery skips test files",
  ).content;
}

function patchDiscoveryHelpers(content) {
  return replaceAny(
    content,
    [
      `\tfor (const match of directFiles) {\n\t\tif (match.path.includes("/")) continue;\n\t\tdiscovered.add(path.join(dir, match.path));\n\t}`,
      `\tfor (const match of directFiles) {\n\t\tif (match.path.includes("/") || match.path.includes(".test.")) continue;\n\t\tdiscovered.add(path.join(dir, match.path));\n\t}`,
    ],
    `\tfor (const match of directFiles) {\n\t\tif (match.path.includes("/") || match.path.includes(".test.")) continue;\n\t\tdiscovered.add(path.join(dir, match.path));\n\t}`,
    "extension discovery skips direct test files",
  ).content;
}
function patchLegacyModelRuntime(content) {
  let out = content;
  let r;
  r = replaceAny(
    out,
    [
      `import { type AuthCredential, SqliteAuthCredentialStore, type TSchema } from "@oh-my-pi/pi-ai";`,
    ],
    `import { type Api, type AuthCredential, type Model, SqliteAuthCredentialStore, type TSchema } from "@oh-my-pi/pi-ai";`,
    "legacy ModelRuntime model types",
  );
  out = r.content;
  r = replaceAny(
    out,
    [`import { getPackageDir as getOmpPackageDir } from "../config";`],
    `import { getPackageDir as getOmpPackageDir } from "../config";\nimport { ModelRegistry } from "../config/model-registry";`,
    "legacy ModelRuntime registry import",
  );
  out = r.content;
  r = replaceAny(
    out,
    [`\tdiscoverSkills,\n\tcreateAgentSession as ompCreateAgentSession,`],
    `\tdiscoverSkills,\n\tdiscoverAuthStorage,\n\tcreateAgentSession as ompCreateAgentSession,`,
    "legacy ModelRuntime auth import",
  );
  out = r.content;
  r = replaceAny(
    out,
    [`/**\n * Legacy pi extensions call \`createAgentSession({ resourceLoader })\`.`],
    `export class ModelRuntime {\n\treadonly modelRegistry: ModelRegistry;\n\n\tprivate constructor(modelRegistry: ModelRegistry) {\n\t\tthis.modelRegistry = modelRegistry;\n\t}\n\n\tstatic async create(): Promise<ModelRuntime> {\n\t\tconst authStorage = await discoverAuthStorage();\n\t\treturn new ModelRuntime(new ModelRegistry(authStorage));\n\t}\n\n\tgetModel(provider: string, modelId: string): Model<Api> | undefined {\n\t\treturn this.modelRegistry.find(provider, modelId);\n\t}\n}\n\n/**\n * Legacy pi extensions call \`createAgentSession({ resourceLoader })\`.`,
    "legacy ModelRuntime export",
  );
  out = r.content;
  r = replaceAny(
    out,
    [`export type LegacyPiCreateAgentSessionOptions = CreateAgentSessionOptions & {\n\tresourceLoader?: ResourceLoader;\n};`],
    `export type LegacyPiCreateAgentSessionOptions = CreateAgentSessionOptions & {\n\tresourceLoader?: ResourceLoader;\n\tmodelRuntime?: ModelRuntime;\n};`,
    "legacy ModelRuntime session option",
  );
  out = r.content;
  r = replaceAny(
    out,
    [
      `\tconst loader = options.resourceLoader;\n\tif (!loader) {\n\t\treturn ompCreateAgentSession(options);\n\t}`,
      `\tconst loader = options.resourceLoader;\n\tconst { resourceLoader: _, modelRuntime, ...rest } = options;\n\tif (!loader) {\n\t\tconst forwarded: CreateAgentSessionOptions = { ...rest };\n\t\tif (rest.modelRegistry === undefined && modelRuntime !== undefined) {\n\t\t\tforwarded.modelRegistry = modelRuntime.modelRegistry;\n\t\t}\n\t\treturn ompCreateAgentSession(forwarded);\n\t}`,
    ],
    `\tconst loader = options.resourceLoader;\n\tconst { resourceLoader: _, modelRuntime, ...rest } = options;\n\tif (!loader) {\n\t\tconst forwarded: CreateAgentSessionOptions = { ...rest };\n\t\tif (rest.modelRegistry === undefined && modelRuntime !== undefined) {\n\t\t\tforwarded.modelRegistry = modelRuntime.modelRegistry;\n\t\t}\n\t\treturn ompCreateAgentSession(forwarded);\n\t}`,
    "legacy ModelRuntime no-loader adapter",
  );
  out = r.content;
  r = replaceAny(
    out,
    [
      `\tconst { resourceLoader: _, ...rest } = options;\n\tconst forwarded: CreateAgentSessionOptions = {\n\t\t...rest,\n\t\tcwd: rest.cwd ?? state.cwd,\n\t\tagentDir: rest.agentDir ?? state.agentDir,\n\t};`,
      `\tconst { resourceLoader: _, modelRuntime, ...rest } = options;\n\tconst forwarded: CreateAgentSessionOptions = {\n\t\t...rest,\n\t\tcwd: rest.cwd ?? state.cwd,\n\t\tagentDir: rest.agentDir ?? state.agentDir,\n\t};\n\tif (rest.modelRegistry === undefined && modelRuntime !== undefined) {\n\t\tforwarded.modelRegistry = modelRuntime.modelRegistry;\n\t}`,
      `\t// resourceLoader and modelRuntime were stripped above.\n\tconst forwarded: CreateAgentSessionOptions = {\n\t\t...rest,\n\t\tcwd: rest.cwd ?? state.cwd,\n\t\tagentDir: rest.agentDir ?? state.agentDir,\n\t};`,
    ],
    `\t// resourceLoader and modelRuntime were stripped above.\n\tconst forwarded: CreateAgentSessionOptions = {\n\t\t...rest,\n\t\tcwd: rest.cwd ?? state.cwd,\n\t\tagentDir: rest.agentDir ?? state.agentDir,\n\t};\n\tif (rest.modelRegistry === undefined && modelRuntime !== undefined) {\n\t\tforwarded.modelRegistry = modelRuntime.modelRegistry;\n\t}`,
    "legacy ModelRuntime loader adapter",
  );
  out = r.content;
  return out;
}


function patchSessionTools(content) {
  return replaceAny(
    content,
    [
      `\t\tthis.#host.emitNotice(\n\t\t\t"info",\n\t\t\tafter\n\t\t\t\t? \`inspect_image is now available: \${modelName} has no native image input.\`\n\t\t\t\t: \`inspect_image is now hidden: \${modelName} supports image input natively. Override with /vision on.\`,\n\t\t\t"vision",\n\t\t);`,
      `\t\tconst model = this.#host.model();\n\t\tconst modelName = model ? formatModelString(model) : "the current model";\n\t\tthis.#host.emitNotice(\n\t\t\t"info",\n\t\t\tafter\n\t\t\t\t? \`inspect_image is now available: \${modelName} has no native image input.\`\n\t\t\t\t: \`inspect_image is now hidden: \${modelName} supports image input natively. Override with /vision on.\`,\n\t\t\t"vision",\n\t\t);`,
    ],
    `\t\t// dotfiles patch: avoid noisy vision flip notices.\n\t\treturn;`,
    "suppress inspect_image flip notice",
  ).content;
}
function patchExtensionUiController(content) {
  const currentOverlay = `			if (options?.overlay) {
				const overlayConfig = options as {
					overlayOptions?: Record<string, unknown>;
					onHandle?: (handle: OverlayHandle) => void;
				};
				overlayHandle = this.ctx.ui.showOverlay(component, {
					anchor: "bottom-center",
					width: "100%",
					maxHeight: "100%",
					margin: 0,
					...(overlayConfig.overlayOptions ?? {}),
				});
				overlayConfig.onHandle?.(overlayHandle);
				return;
			}`;
  const patchedOverlay = `			if (options?.overlay) {
				const overlayConfig = options as {
					overlayOptions?: Record<string, unknown>;
					onHandle?: (handle: OverlayHandle) => void;
				};
				const previousFocus = this.ctx.ui.getFocused();
				const nativeOverlayHandle = this.ctx.ui.showOverlay(component, {
					anchor: "bottom-center",
					width: "100%",
					maxHeight: "100%",
					margin: 0,
					...(overlayConfig.overlayOptions ?? {}),
				});
				overlayHandle = {
					...nativeOverlayHandle,
					focus: () => this.ctx.ui.setFocus(component),
					unfocus: () => this.ctx.ui.setFocus(previousFocus),
					isFocused: () => this.ctx.ui.getFocused() === component,
				} as OverlayHandle;
				overlayConfig.onHandle?.(overlayHandle);
				return;
			}`;
  return replaceAny(content, [currentOverlay, patchedOverlay], patchedOverlay, "custom overlay options and focus handle").content;
}
function patchTuiOverlayFocus(content) {
  const current = `		if (topVisibleOverlay && !isOverlayFocusTarget(topVisibleOverlay.component, component)) {
			const currentFocus = this.#focusedComponent;
			component = isOverlayFocusTarget(topVisibleOverlay.component, currentFocus)
				? currentFocus
				: topVisibleOverlay.component;
		}`;
  const patched = `		if (topVisibleOverlay && !topVisibleOverlay.options?.nonCapturing && !isOverlayFocusTarget(topVisibleOverlay.component, component)) {
			const currentFocus = this.#focusedComponent;
			component = isOverlayFocusTarget(topVisibleOverlay.component, currentFocus)
				? currentFocus
				: topVisibleOverlay.component;
		}`;
  return replaceAny(content, [current, patched], patched, "pi-tui nonCapturing overlay focus").content;
}
try {
  setupRuntimeStateLinks();
  patchFile("modes/interactive-mode.ts", patchInteractiveMode);
  patchFirstExistingFile(
    [
      "modes/components/status-line/component.ts",
      "modes/components/status-line.ts",
    ],
    patchStatusLineTs,
  );
  patchFirstExistingFile(
    [
      "modes/components/status-line/types.ts",
      "modes/components/status-line.ts",
    ],
    patchStatusTypes,
  );
  patchTuiFile("tui.ts", patchTuiOverlayFocus);
  patchFirstExistingFile(
    [
      "modes/components/status-line/segments.ts",
      "modes/components/status-line.ts",
    ],
    patchSegments,
  );
  patchFile("modes/components/welcome.ts", patchWelcome);
  patchFile("modes/components/assistant-message.ts", patchAssistantMessage);
  patchFile("modes/components/usage-row.ts", patchUsageRow);
  patchFile("modes/components/user-message.ts", patchUserMessage);
  patchFile("modes/controllers/extension-ui-controller.ts", patchExtensionUiController);
  patchFile("config/keybindings.ts", patchKeybindingsConfig);
  patchFile("modes/controllers/input-controller.ts", patchInputController);
  patchFile("session/session-manager.ts", patchSessionManager);
  patchFile("session/session-tools.ts", patchSessionTools);
  patchFile("session/model-controls.ts", patchModelControlsLunaPriority);
  patchFile("goals/tools/goal-tool.ts", patchGoalTool);
  patchFile("modes/ultrathink.ts", patchUltrathink);
  patchFile("modes/magic-keywords.ts", patchMagicKeywords);
  patchFile("modes/orchestrate.ts", patchOrchestrate);
  patchFile("extensibility/extensions/loader.ts", patchExtensionLoader);
  patchFile("discovery/helpers.ts", patchDiscoveryHelpers);
  patchTuiFile("utils.ts", patchTuiVisibleWidth);
  patchTuiFile("components/editor.ts", patchEditorGutterWidth);
  patchTuiFile("terminal.ts", patchTuiTerminal);
  patchTuiFile("kitty-graphics.ts", patchTuiKittyGraphics);
  patchTuiFile("terminal-capabilities.ts", patchTuiTerminalCapabilities);
  patchPiAiFile("utils/schema/normalize.ts", patchPiAiSchemaNormalize);
  patchPiAiFile("types.ts", patchPiAiTypes);
  patchPiAiFile("providers/openai-completions.ts", patchPiAiOpenAICompletions);
  patchAbsoluteFile(
    path.join(
      home,
      ".omp/plugins/node_modules/@plannotator/pi-extension/plannotator-browser-runtime.ts",
    ),
    "plannotator browser asset fallback",
    patchPlannotatorBrowserRuntime,
  );
  patchFile("modes/components/custom-editor.ts", patchCustomEditor);
  patchFile("extensibility/legacy-pi-coding-agent-shim.ts", patchLegacyModelRuntime);
  patchAbsoluteFile(
    path.join(home, ".omp/plugins/node_modules/pi-side-chat/side-chat-overlay.ts"),
    "pi-side-chat canonical editor and Nord frame",
    (content) => patchPiSideChatOverlay(content, { replaceAny }),
  );
  patchAbsoluteFile(
    path.join(home, ".omp/plugins/node_modules/pi-side-chat/index.ts"),
    "pi-side-chat tmux popup geometry and shortcuts",
    (content) => patchPiSideChatIndex(content, { replaceAny }),
  );
  write(
    path.join(home, ".omp/plugins/node_modules/pi-side-chat/config.json"),
    `${JSON.stringify(SIDE_CHAT_CONFIG, null, 2)}\n`,
  );
  rebuildBundledCli();
  console.log("OMP monkey patches applied.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

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
import { createInstalledAiPlannotatorPatches } from "./patches/installed-ai-plannotator.mjs";
import { createStatusLinePatches } from "./patches/status-line.mjs";
import { createUiComponentPatches } from "./patches/ui-components.mjs";
import { createInputSessionPatches } from "./patches/input-session.mjs";
import { createTuiEditorTerminalPatches } from "./patches/tui-editor-terminal.mjs";
import { createCommandRuntimePatches } from "./patches/commands-runtime.mjs";
import { patchRejudgeAgentIds } from "./patches/rejudge.mjs";
import { patchPlannotatorVersionWarning } from "./patches/plannotator.mjs";
import { runPatchRoutes } from "./patches/routes.mjs";
import {
  patchPiSideChatIndex,
  patchPiSideChatOverlay,
  SIDE_CHAT_CONFIG,
} from "./patches/side-chat.mjs";

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
  return [...new Set(roots.map((root) => path.resolve(root, rel)))].filter(
    fs.existsSync,
  );
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
  if (files.length === 0)
    requireFile(
      path.join(
        home,
        ".bun/install/global/node_modules/@oh-my-pi/pi-ai/src",
        rel,
      ),
    );
  for (const filePath of files) {
    const label = filePath.includes(
      `${path.sep}dev${path.sep}dotfiles${path.sep}`,
    )
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

function statsPackageRoot() {
  return path.join(packageRoot, "..", "omp-stats");
}

// The published @oh-my-pi/omp-stats package ships the prebuilt dashboard at
// dist/client but not the monorepo gen:stats script. `bundle-dist.ts` runs
// `gen:stats` before bundling to embed the client; replicate that inline so the
// raw `bun build` below picks up a populated embed instead of the empty
// checked-in placeholder (which makes `omp stats` 404 the dashboard).
function regenerateStatsClientArchive() {
  const statsRoot = statsPackageRoot();
  const clientDir = path.join(statsRoot, "dist", "client");
  const generatedPath = path.join(
    statsRoot,
    "src",
    "embedded-client.generated.txt",
  );
  if (!fs.existsSync(path.join(clientDir, "index.html"))) {
    return;
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "omp-stats-client-"));
  const tarPath = path.join(tmp, "client.tar.gz");
  try {
    execFileSync("tar", ["-czf", tarPath, "-C", clientDir, "."], {
      stdio: "inherit",
    });
    fs.writeFileSync(
      generatedPath,
      fs.readFileSync(tarPath).toString("base64"),
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function resetStatsClientArchive() {
  const generatedPath = path.join(
    statsPackageRoot(),
    "src",
    "embedded-client.generated.txt",
  );
  try {
    fs.writeFileSync(generatedPath, "");
  } catch {
    // Best-effort: the embed is already inlined into dist/cli.js.
  }
}

function rebuildBundledCli() {
  for (const entry of fs.readdirSync(path.join(packageRoot, "dist"))) {
    if (
      entry === "cli.js" ||
      (entry.startsWith("CHANGELOG-") && entry.endsWith(".md"))
    ) {
      fs.rmSync(path.join(packageRoot, "dist", entry), { force: true });
    }
  }
  regenerateStatsClientArchive();
  try {
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
  } finally {
    resetStatsClientArchive();
  }
  const cliPath = path.join(packageRoot, "dist/cli.js");
  let bundled = read(cliPath);
  if (!bundled.startsWith("#!")) bundled = `#!/usr/bin/env bun\n${bundled}`;
  if (!bundled.includes("path.basename"))
    bundled += "\n/* omp patch marker: path.basename */\n";
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

const patchHelpers = { replaceOnce, replaceAny, insertAfter, insertBefore };

const patches = {
  ...createInstalledAiPlannotatorPatches(patchHelpers),
  ...createStatusLinePatches(patchHelpers),
  ...createUiComponentPatches(patchHelpers),
  ...createInputSessionPatches(patchHelpers),
  ...createTuiEditorTerminalPatches(patchHelpers),
  ...createCommandRuntimePatches(patchHelpers),
};
try {
  runPatchRoutes({
    home,
    path,
    write,
    replaceAny,
    patchFile,
    patchFirstExistingFile,
    patchTuiFile,
    patchPiAiFile,
    patchAbsoluteFile,
    setupRuntimeStateLinks,
    rebuildBundledCli,
    SIDE_CHAT_CONFIG,
    patches: {
      ...patches,
      patchPlannotatorVersionWarning,
      patchPiSideChatOverlay,
      patchPiSideChatIndex,
      patchRejudgeAgentIds,
    },
  });
  console.log("OMP monkey patches applied.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

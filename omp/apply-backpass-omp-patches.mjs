#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

function sh(args) {
  return execFileSync(args[0], args.slice(1), { encoding: "utf8" }).trim();
}

function packageRoot() {
  const bin = sh(["command", "-v", "backpass"]);
  const starts = [
    fs.realpathSync(bin),
    path.join(
      os.homedir(),
      ".volta/tools/image/packages/backpass/bin/backpass",
    ),
    path.join(sh(["npm", "root", "-g"]), "backpass/bin/backpass.js"),
  ];
  for (const start of starts) {
    if (!fs.existsSync(start)) continue;
    let dir = path.dirname(fs.realpathSync(start));
    while (dir !== path.dirname(dir)) {
      const pkg = path.join(dir, "package.json");
      if (
        fs.existsSync(pkg) &&
        JSON.parse(fs.readFileSync(pkg, "utf8")).name === "backpass"
      )
        return dir;
      dir = path.dirname(dir);
    }
  }
  throw new Error("Cannot locate installed backpass package root");
}

function put(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content)
    return false;
  fs.writeFileSync(file, content);
  return true;
}

function replace(file, from, to, label) {
  const old = fs.readFileSync(file, "utf8");
  if (old.includes(to)) return false;
  if (!old.includes(from)) throw new Error(`Backpass patch drift: ${label}`);
  fs.writeFileSync(file, old.replace(from, to));
  return true;
}

const root = packageRoot();
let changed = false;

changed =
  put(
    path.join(root, "src/discovery/adapters/omp.js"),
    `import path from "node:path";\n\nimport {\n  attachToolResults,\n  contentToEvents,\n  home,\n  listDirs,\n  listFiles,\n  parseJsonLine,\n  readHeadLines,\n  readJsonl,\n  statOrNull,\n} from "./shared.js";\n\nexport const name = "omp";\n\nexport function storeRoot() {\n  return home(".omp", "agent", "sessions");\n}\n\nexport function enumerate() {\n  const out = [];\n  for (const dir of listDirs(storeRoot())) {\n    for (const file of listFiles(dir, ".jsonl")) {\n      const stat = statOrNull(file);\n      if (!stat) continue;\n      out.push({ key: file, path: file, mtimeMs: stat.mtimeMs, bytes: stat.size });\n    }\n  }\n  return out;\n}\n\nexport function classify(candidate) {\n  const entry = readHeadLines(candidate.path, 20)\n    .map((line) => parseJsonLine(line))\n    .find((item) => item?.type === "session" && item.cwd);\n  if (!entry) return null;\n  return {\n    id: entry.id || path.basename(candidate.path, ".jsonl"),\n    cwd: entry.cwd,\n    gitBranch: null,\n    remotes: [],\n    startedAt: entry.timestamp ? Date.parse(entry.timestamp) : candidate.mtimeMs,\n    model: null,\n  };\n}\n\nexport function read(ref) {\n  const entries = readJsonl(ref.path);\n  const events = [];\n  let model = null;\n\n  for (const entry of entries) {\n    if (entry.type === "model_change") {\n      model = entry.modelId || entry.model || model;\n      continue;\n    }\n    if (entry.type !== "message" || !entry.message) continue;\n    const message = entry.message;\n    const role = message.role;\n\n    if (role === "toolResult") {\n      events.push({ kind: "tool-result", id: message.toolCallId ?? message.id, result: textOf(message.content) });\n      continue;\n    }\n    if (role !== "user" && role !== "assistant") continue;\n    contentToEvents(role, message.content, events);\n  }\n\n  return { events: attachToolResults(events), model };\n}\n\nfunction textOf(content) {\n  if (typeof content === "string") return content;\n  if (!Array.isArray(content)) return content;\n  return content\n    .map((b) => (typeof b === "string" ? b : (b?.text ?? "")))\n    .filter(Boolean)\n    .join("\\n");\n}\n`,
  ) || changed;

const discovery = path.join(root, "src/discovery/index.js");
changed =
  replace(
    discovery,
    'import * as pi from "./adapters/pi.js";\n',
    'import * as pi from "./adapters/pi.js";\nimport * as omp from "./adapters/omp.js";\n',
    "import omp adapter",
  ) || changed;
changed =
  replace(discovery, "  pi,\n", "  pi,\n  omp,\n", "register omp adapter") ||
  changed;

const config = path.join(root, "src/config.js");
changed =
  replace(
    config,
    'export const ALL_HARNESSES = ["claude", "codex", "pi", "opencode", "grok", "cursor", "hermes"];',
    'export const ALL_HARNESSES = ["claude", "codex", "pi", "omp", "opencode", "grok", "cursor", "hermes"];',
    "known omp harness",
  ) || changed;
changed =
  replace(
    config,
    '{ model: "gpt-5.6-luna", agents: ["pi", "opencode", "codex"] }',
    '{ model: "gpt-5.6-luna", agents: ["omp", "pi", "opencode", "codex"] }',
    "analysis omp ladder",
  ) || changed;
changed =
  replace(
    config,
    '{ model: "gpt-5.6-sol", agents: ["pi", "opencode", "codex"] }',
    '{ model: "gpt-5.6-sol", agents: ["omp", "pi", "opencode", "codex"] }',
    "synthesis omp ladder",
  ) || changed;
changed =
  replace(
    config,
    '{ model: "grok-4.6", agents: ["pi", "opencode", "grok"] }',
    '{ model: "grok-4.6", agents: ["omp", "pi", "opencode", "grok"] }',
    "grok omp ladder",
  ) || changed;

const invoke = path.join(root, "src/harness-invoke.js");
let invokeSource = fs.readFileSync(invoke, "utf8");
if (
  invokeSource.includes('    if (agent === "opencode" || agent === "omp") {')
) {
  invokeSource = invokeSource.replace(
    '    if (agent === "opencode" || agent === "omp") {',
    '    if (agent === "opencode") {',
  );
  fs.writeFileSync(invoke, invokeSource);
  changed = true;
}
const ompInsertion = `    if (agent === "omp") {
      if (requestedEffort) {
        notes.push("omp does not advertise a reasoning-effort option; ran without effort=" + requestedEffort);
      }
      return {
        env: undefined,
        acpxModel: requestedModel,
        setEffortKey: null,
        acpxAgentCommand: "omp acp",
        requiredBuiltinAgent: null,
        notes,
        dispose,
      };
    }
`;
if (!invokeSource.includes(ompInsertion)) {
  const opencodeBranch = '    if (agent === "opencode") {';
  if (!invokeSource.includes(opencodeBranch))
    throw new Error("Backpass patch drift: opencode invocation branch");
  invokeSource = invokeSource.replace(
    opencodeBranch,
    ompInsertion + opencodeBranch,
  );
  fs.writeFileSync(invoke, invokeSource);
  changed = true;
}

const acpx = path.join(root, "src/acpx.js");
let acpxSource = fs.readFileSync(acpx, "utf8");
const invocationArgsOld = `function invocationAgentArgs(invocation, agent) {
  return invocation.acpxAgentCommand ? ["--agent", invocation.acpxAgentCommand] : [acpxAgentName(agent)];
}`;
const invocationArgsNew = `function invocationAgentArgs(invocation, agent) {
  if (invocation.acpxAgentCommand) return ["--agent", invocation.acpxAgentCommand];
  if (agent === "omp") return ["--agent", "omp acp"];
  return [acpxAgentName(agent)];
}`;
if (!acpxSource.includes(invocationArgsNew)) {
  if (!acpxSource.includes(invocationArgsOld))
    throw new Error("Backpass patch drift: invocation agent args");
  acpxSource = acpxSource.replace(invocationArgsOld, invocationArgsNew);
  fs.writeFileSync(acpx, acpxSource);
  changed = true;
}

const probeOld = `  const acpxAgent = acpxAgentName(agent);
  const created = await run([acpxAgent, "sessions", "new", "--name", sessionName], { timeoutMs, cwd });`;
const probeNew = `  const agentArgs = agent === "omp" ? ["--agent", "omp acp"] : [acpxAgentName(agent)];
  const created = await run([...agentArgs, "sessions", "new", "--name", sessionName], { timeoutMs, cwd });`;
if (!acpxSource.includes(probeNew)) {
  if (!acpxSource.includes(probeOld))
    throw new Error("Backpass patch drift: probe agent args");
  acpxSource = acpxSource.replace(probeOld, probeNew);
  acpxSource = acpxSource.replace(
    `await run(["--format", "json", acpxAgent, "status", "-s", sessionName], { timeoutMs, cwd });`,
    `await run(["--format", "json", ...agentArgs, "status", "-s", sessionName], { timeoutMs, cwd });`,
  );
  acpxSource = acpxSource.replace(
    `await run([acpxAgent, "sessions", "close", sessionName], { timeoutMs, cwd });`,
    `await run([...agentArgs, "sessions", "close", sessionName], { timeoutMs, cwd });`,
  );
  fs.writeFileSync(acpx, acpxSource);
  changed = true;
}

console.log(`${changed ? "patched" : "ok     "} Backpass OMP integration`);
console.log(root);

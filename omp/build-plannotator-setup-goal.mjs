#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  utimes,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { patchSetupGoalTailnetSources } from "./patches/plannotator-setup-goal-tailscale.mjs";

export const VERSION = "0.29.0";
export const SOURCE_COMMIT = "55e6bbd2b16580b23b5926b235a314a17591d12a";
export const ARCHIVE_SHA256 =
  "5e004a4bc9db9c4cb2e04fa32fd7d414ec42f373dd4d1720c13ad8859a2d247c";
export const SOURCE_HASHES = {
  "apps/hook/server/index.ts":
    "1ea1fa526944912b35a57df440773d4f506fb04b53747fa94cbcc706fc8a1e28",
  "packages/server/goal-setup.ts":
    "1939c3500d772f126bdb8abdabefc4612ab03c72234fe841a5d6152b5f880af3",
};
export const CACHE = path.join(
  os.homedir(),
  ".cache/plannotator-source",
  `v${VERSION}`,
);
export const CANDIDATE = path.join(
  CACHE,
  "plannotator-setup-goal-darwin-arm64",
);
export const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
const sourceRoot = path.join(CACHE, "src");
const run = (args, cwd = sourceRoot, env = process.env) =>
  execFileSync(args[0], args.slice(1), { cwd, env, stdio: "inherit" });

export function verifyExecutable(executable) {
  const version = execFileSync(executable, ["--version"], {
    encoding: "utf8",
  }).trim();
  if (version !== `plannotator ${VERSION}`)
    throw new Error(
      `${executable} version mismatch: expected plannotator ${VERSION}, got ${version}`,
    );
  const probe = spawnSync(
    executable,
    [
      "setup-goal",
      "interview",
      path.join(os.tmpdir(), `missing-plannotator-bundle-${process.pid}.json`),
      "--tailscale",
    ],
    { encoding: "utf8" },
  );
  const output = `${probe.stdout ?? ""}\n${probe.stderr ?? ""}`;
  if (
    probe.error ||
    probe.status !== 1 ||
    !output.includes("Failed to load goal setup bundle:") ||
    output.includes("--tailscale is only supported with:")
  )
    throw new Error(
      `${executable} is missing the setup-goal --tailscale patch: ${output.trim() || probe.error?.message || `exit ${probe.status}`}`,
    );
  return `Verified plannotator ${VERSION} setup-goal --tailscale: ${executable}`;
}

export function isOlderVersion(installed, target) {
  const versions = [installed, target].map((version) =>
    /^\d+\.\d+\.\d+$/.test(version) ? version.split(".").map(Number) : null,
  );
  if (versions.some((version) => !version)) return false;
  for (let i = 0; i < 3; i++) {
    if (versions[0][i] !== versions[1][i])
      return versions[0][i] < versions[1][i];
  }
  return false;
}
async function verifyInstalled(executable) {
  console.log(verifyExecutable(executable));
}

export function verifiedPatch(cli, goalSetup) {
  for (const [name, current] of Object.entries({
    "apps/hook/server/index.ts": cli,
    "packages/server/goal-setup.ts": goalSetup,
  })) {
    if (sha256(current) !== SOURCE_HASHES[name]) {
      throw new Error(`Source drift at ${name}; refusing to build.`);
    }
  }
  return patchSetupGoalTailnetSources({ cli, goalSetup });
}

async function prepare() {
  await mkdir(CACHE, { recursive: true });
  const archive = path.join(CACHE, "source.tar.gz");
  try {
    await readFile(archive);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const response = await fetch(
      `https://codeload.github.com/backnotprop/plannotator/tar.gz/refs/tags/v${VERSION}`,
    );
    if (!response.ok)
      throw new Error(`Source download failed: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (sha256(bytes) !== ARCHIVE_SHA256)
      throw new Error("Downloaded source archive drift.");
    await writeFile(archive, bytes, { flag: "wx" });
  }
  if (sha256(await readFile(archive)) !== ARCHIVE_SHA256)
    throw new Error("Source archive checksum mismatch.");
  const manifest = path.join(sourceRoot, "package.json");
  try {
    await readFile(manifest);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await mkdir(sourceRoot, { recursive: true });
    run(
      ["tar", "-xzf", archive, "--strip-components=1", "-C", sourceRoot],
      CACHE,
    );
  }
  if (JSON.parse(await readFile(manifest, "utf8")).version !== VERSION)
    throw new Error("Source version drift.");
  const cliPath = path.join(sourceRoot, "apps/hook/server/index.ts");
  const goalPath = path.join(sourceRoot, "packages/server/goal-setup.ts");
  const original = (name) =>
    execFileSync("tar", ["-xOf", archive, `plannotator-${VERSION}/${name}`], {
      encoding: "utf8",
    });
  const pristineCli = original("apps/hook/server/index.ts");
  const pristineGoal = original("packages/server/goal-setup.ts");
  const result = verifiedPatch(pristineCli, pristineGoal);
  for (const [file, before, after] of [
    [cliPath, pristineCli, result.cli],
    [goalPath, pristineGoal, result.goalSetup],
  ]) {
    const current = await readFile(file, "utf8");
    if (current !== before && current !== after)
      throw new Error(`Cached source drift at ${file}; refusing to overwrite.`);
  }
  await writeFile(cliPath, result.cli);
  await writeFile(goalPath, result.goalSetup);
  console.log(
    `Prepared Plannotator ${VERSION} (${SOURCE_COMMIT}) in ${sourceRoot}`,
  );
}

async function build() {
  if (process.platform !== "darwin" || process.arch !== "arm64")
    throw new Error("This local build targets darwin-arm64 only.");
  if (
    execFileSync("bun", ["--version"], { encoding: "utf8" }).trim() !== "1.4.4"
  )
    throw new Error("Pinned upstream build requires Bun 1.4.4.");
  await prepare();
  run(["bun", "install", "--frozen-lockfile"]);
  run([
    "bun",
    "test",
    "packages/server/goal-setup.test.ts",
    "apps/hook/server/cli.test.ts",
    "packages/server/tailscale-serve.test.ts",
  ]);
  run(["bun", "run", "build:review"]);
  run(["bun", "run", "build:hook"]);
  run([
    "bun",
    "build",
    "apps/hook/server/index.ts",
    "--compile",
    "--no-compile-autoload-bunfig",
    "--target=bun-darwin-arm64",
    "--define",
    `__CLI_VERSION__=${JSON.stringify(VERSION)}`,
    "--outfile",
    CANDIDATE,
  ]);
  console.log(verifyExecutable(CANDIDATE));
  console.log(`Candidate only, not installed: ${CANDIDATE}`);
}

export async function pruneBuildArtifacts(
  executable,
  cacheRoot = path.dirname(CACHE),
) {
  console.log(verifyExecutable(executable));
  const older = (await readdir(cacheRoot, { withFileTypes: true }))
    .filter(
      (entry) =>
        entry.isDirectory() &&
        /^v\d+\.\d+\.\d+$/.test(entry.name) &&
        isOlderVersion(entry.name.slice(1), VERSION),
    )
    .sort((a, b) =>
      isOlderVersion(a.name.slice(1), b.name.slice(1)) ? 1 : -1,
    );
  const bin = path.dirname(executable);
  const prefix = `${path.basename(executable)}.before-setup-goal-`;
  const backups = await Promise.all(
    (await readdir(bin, { withFileTypes: true }))
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.startsWith(prefix) &&
          /^[a-f0-9]{12}$/.test(entry.name.slice(prefix.length)),
      )
      .map(async (entry) => ({
        path: path.join(bin, entry.name),
        modified: (await stat(path.join(bin, entry.name))).mtimeMs,
      })),
  );
  backups.sort(
    (a, b) => b.modified - a.modified || a.path.localeCompare(b.path),
  );
  const obsolete = [
    ...older.slice(1).map((entry) => ({
      path: path.join(cacheRoot, entry.name),
      directory: true,
    })),
    ...backups.slice(2),
  ];
  for (const entry of obsolete) {
    const probe = spawnSync(
      "lsof",
      ["-t", ...(entry.directory ? ["+D"] : []), entry.path],
      { encoding: "utf8" },
    );
    // macOS lsof +D can list active PIDs and still exit with status 1.
    if (probe.stdout?.trim()) {
      console.log(`Kept in-use build artifact: ${entry.path}`);
      continue;
    }
    if (probe.error || probe.status !== 1 || probe.stderr.trim())
      throw new Error(
        `Cannot check build artifact usage: ${entry.path}: ${probe.error?.message ?? probe.stderr}`,
      );
    await rm(entry.path, { recursive: !!entry.directory });
    console.log(`Removed old build artifact: ${entry.path}`);
  }
}

async function install(expectedHash) {
  if (!/^[a-f0-9]{64}$/.test(expectedHash ?? ""))
    throw new Error("Install requires the verified candidate SHA-256.");
  const bytes = await readFile(CANDIDATE);
  if (sha256(bytes) !== expectedHash)
    throw new Error("Candidate changed after verification.");
  const target = path.join(os.homedir(), ".local/bin/plannotator");
  const old = await readFile(target);
  if (sha256(old) === expectedHash) {
    await pruneBuildArtifacts(target);
    console.log("Already installed; unchanged.");
    return;
  }
  const currentVersion = /^plannotator (\d+\.\d+\.\d+)$/.exec(
    execFileSync(target, ["--version"], { encoding: "utf8" }).trim(),
  )?.[1];
  if (
    currentVersion !== VERSION &&
    (!currentVersion || !isOlderVersion(currentVersion, VERSION))
  )
    throw new Error(
      `Installed CLI version drift (${currentVersion ?? "unknown"}); refusing replacement with ${VERSION}.`,
    );
  const backup = `${target}.before-setup-goal-${sha256(old).slice(0, 12)}`;
  try {
    await writeFile(backup, old, { flag: "wx", mode: 0o755 });
  } catch (error) {
    if (
      error.code !== "EEXIST" ||
      sha256(await readFile(backup)) !== sha256(old)
    )
      throw error;
  }
  await utimes(backup, new Date(), new Date());
  const temporary = `${target}.setup-goal-${process.pid}`;
  await copyFile(CANDIDATE, temporary);
  await chmod(temporary, 0o755);
  await rename(temporary, target);
  await pruneBuildArtifacts(target);
  console.log(`Installed ${expectedHash}; rollback binary: ${backup}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    if (process.argv[2] === "prepare") await prepare();
    else if (process.argv[2] === "build") await build();
    else if (process.argv[2] === "install") await install(process.argv[3]);
    else if (process.argv[2] === "prune") {
      if (!process.argv[3])
        throw new Error(
          "Prune requires the executable resolved by command -v.",
        );
      await pruneBuildArtifacts(process.argv[3]);
    } else if (process.argv[2] === "verify") {
      if (!process.argv[3])
        throw new Error(
          "Verify requires the executable resolved by command -v.",
        );
      await verifyInstalled(process.argv[3]);
    } else
      throw new Error(
        `Usage: node ${fileURLToPath(import.meta.url)} prepare|build|install <verified-sha256>|verify <resolved-executable>|prune <resolved-executable>`,
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { patchSetupGoalTailnetSources } from "./patches/plannotator-setup-goal-tailscale.mjs";

export const VERSION = "0.28.40";
export const SOURCE_COMMIT = "6a1990dbfeaab19007a366d19b61188550267e4e";
export const ARCHIVE_SHA256 =
  "42664d151b95c06ea60b9571f753cc27ab0b39e79a8afea92d9735b69f472310";
export const SOURCE_HASHES = {
  "apps/hook/server/index.ts":
    "1edff0d2484b1146a98e3bdc6d0978ff0993ffab6c312e8bc577d0f13d50a3d3",
  "packages/server/goal-setup.ts":
    "cc638fe6916dc9b93bbec1044973bf2147ebacbad108bc01cbd5c5b320af9a2e",
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
  console.log(`Candidate only, not installed: ${CANDIDATE}`);
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
    console.log("Already installed; unchanged.");
    return;
  }
  if (
    execFileSync(target, ["--version"], { encoding: "utf8" }).trim() !==
    `plannotator ${VERSION}`
  )
    throw new Error("Installed CLI version drift; refusing replacement.");
  if (
    execFileSync(CANDIDATE, ["--version"], { encoding: "utf8" }).trim() !==
    `plannotator ${VERSION}`
  )
    throw new Error("Candidate version mismatch.");
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
  const temporary = `${target}.setup-goal-${process.pid}`;
  await copyFile(CANDIDATE, temporary);
  await chmod(temporary, 0o755);
  await rename(temporary, target);
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
    else
      throw new Error(
        `Usage: node ${fileURLToPath(import.meta.url)} prepare|build|install <verified-sha256>`,
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

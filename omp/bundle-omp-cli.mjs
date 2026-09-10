#!/usr/bin/env bun

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const home = os.homedir();
const packageRoot = path.join(
  home,
  ".bun/install/global/node_modules/@oh-my-pi/pi-coding-agent",
);
const outDir = path.join(packageRoot, "dist");
const packageDefinitions = [
  ["@oh-my-pi/pi-agent-core", null],
  ["@oh-my-pi/pi-ai", "legacy-pi-ai-shim.ts"],
  ["@oh-my-pi/pi-coding-agent", "legacy-pi-coding-agent-shim.ts"],
  ["@oh-my-pi/pi-natives", null],
  ["@oh-my-pi/pi-tui", "legacy-pi-tui-shim.ts"],
  ["@oh-my-pi/pi-utils", null],
];

function packageDir(name) {
  return path.join(packageRoot, "..", name.split("/").at(-1));
}

function importTarget(value) {
  if (typeof value === "string") return value;
  if (value && typeof value.import === "string") return value.import;
  return null;
}

function safeBasename(name) {
  if (!name || name.startsWith(".") || name.startsWith("_")) return false;
  if (["index", "worker-entry"].includes(name)) return false;
  return !/\.(test|spec|d|generated|bench)$/.test(name);
}

function walkFiles(root) {
  const files = [];
  if (!fs.existsSync(root)) return files;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function collectEntries() {
  const entries = [];
  const keys = new Set();
  const bindings = new Set();
  const add = (key, binding, specifier) => {
    if (keys.has(key)) return;
    if (bindings.has(binding))
      throw new Error(`Duplicate legacy binding: ${binding}`);
    keys.add(key);
    bindings.add(binding);
    entries.push({ key, binding, specifier });
  };
  const bindingFor = (identifier, subpath) =>
    `bundled${identifier}${subpath
      .split("/")
      .filter(Boolean)
      .map((part) =>
        part
          .split(/[-_]/)
          .filter(Boolean)
          .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
          .join(""),
      )
      .join("")}`;

  for (const [name, rootShim] of packageDefinitions) {
    const dir = packageDir(name);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(dir, "package.json"), "utf8"),
    );
    const exportsField =
      manifest.exports && typeof manifest.exports === "object"
        ? manifest.exports
        : {};
    const identifier = name
      .split("/")
      .at(-1)
      .replace(/(^|[-_])(.)/g, (_, _prefix, c) => c.toUpperCase());
    const rootSpecifier = rootShim
      ? path.join(packageRoot, "src/extensibility", rootShim)
      : name;
    add(name, `bundled${identifier}`, rootSpecifier);

    for (const exportKey of Object.keys(exportsField)) {
      if (
        !exportKey.startsWith("./") ||
        exportKey === "." ||
        exportKey.includes("*")
      )
        continue;
      const subpath = exportKey.slice(2);
      add(
        `${name}/${subpath}`,
        bindingFor(identifier, subpath),
        `${name}/${subpath}`,
      );
    }

    for (const [exportKey, exportValue] of Object.entries(exportsField)) {
      if (!exportKey.startsWith("./") || !exportKey.includes("*")) continue;
      const sourcePattern = importTarget(exportValue);
      const star = sourcePattern?.indexOf("*");
      const exportStar = exportKey.indexOf("*");
      if (
        !sourcePattern?.startsWith("./") ||
        star === undefined ||
        star < 0 ||
        exportStar < 0
      )
        continue;
      const sourcePrefix = sourcePattern.slice(2, star);
      const sourceSuffix = sourcePattern.slice(star + 1);
      const exportPrefix = exportKey.slice(2, exportStar);
      const exportSuffix = exportKey.slice(exportStar + 1);
      if (exportPrefix === "" || exportPrefix === "/") continue;
      if (!/\.(ts|tsx|mts|cts|js|mjs|cjs|jsx)$/.test(sourceSuffix)) continue;
      const sourceDir = path.join(dir, sourcePrefix);

      for (const file of walkFiles(sourceDir).sort()) {
        const relative = path
          .relative(sourceDir, file)
          .split(path.sep)
          .join("/");
        if (!relative.endsWith(sourceSuffix)) continue;
        const basename = relative.slice(0, -sourceSuffix.length);
        const segments = basename.split("/");
        if (
          segments.some(
            (segment) => segment.startsWith(".") || segment.startsWith("_"),
          )
        )
          continue;
        if (!safeBasename(segments.at(-1))) continue;
        const subpath = `${exportPrefix}${basename}${exportSuffix}`;
        add(
          `${name}/${subpath}`,
          bindingFor(identifier, subpath),
          `${name}/${subpath}`,
        );
      }
    }
  }

  add(
    "typebox",
    "bundledTypeBoxShim",
    path.join(packageRoot, "src/extensibility/legacy-typebox.ts"),
  );
  return entries;
}

function render(entries) {
  const imports = entries.map(
    ({ binding, specifier }) =>
      `const ${binding} = () => import(${JSON.stringify(specifier)});`,
  );
  const registry = entries.map(
    ({ key, binding }) => `\t${JSON.stringify(key)}: ${binding},`,
  );
  return [
    ...imports,
    "",
    "export const BUNDLED_PI_MODULE_LOADERS = {",
    ...registry,
    "};",
    "",
  ].join("\n");
}

const entries = collectEntries();
const plugin = {
  name: "omp:legacy-pi-modules",
  setup(build) {
    build.onResolve({ filter: /^omp-legacy-pi-modules$/ }, () => ({
      path: "omp-legacy-pi-modules",
      namespace: "omp-legacy-pi-modules-build",
    }));
    build.onLoad(
      { filter: /.*/, namespace: "omp-legacy-pi-modules-build" },
      () => ({
        contents: render(entries),
        loader: "ts",
      }),
    );
  },
};

process.chdir(packageRoot);
const result = await Bun.build({
  entrypoints: [path.join(packageRoot, "src/cli.ts")],
  outdir: outDir,
  target: "bun",
  plugins: [plugin],
  external: [
    "mupdf",
    "@oh-my-pi/pi-natives",
    "@huggingface/transformers",
    "fastembed",
    "onnxruntime-node",
    "puppeteer-core",
    "@puppeteer/browsers",
    "@babel/parser",
    "@xterm/headless",
    "turndown",
    "turndown-plugin-gfm",
    "@mozilla/readability",
    "linkedom",
    "@agentclientprotocol/sdk",
  ],
  define: { "process.env.PI_BUNDLED": JSON.stringify("true") },
  minify: {
    whitespace: true,
    syntax: true,
    identifiers: true,
    keepNames: true,
  },
});
if (!result.success) {
  throw new Error(result.logs.map((log) => log.message).join("\n"));
}

const cliPath = path.join(outDir, "cli.js");
let bundled = fs.readFileSync(cliPath, "utf8");
if (!bundled.startsWith("#!")) bundled = `#!/usr/bin/env bun\n${bundled}`;
fs.writeFileSync(cliPath, bundled);
console.log(`Bundled OMP CLI with ${entries.length} legacy module entries.`);

import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";
import { createRewindTmuxForkPatches } from "./rewind-tmux-fork.mjs";
import { SessionManager } from "../../../../.bun/install/global/node_modules/@oh-my-pi/pi-coding-agent/src/session/session-manager.ts";
import { RewindSelectorComponent } from "../../../../.bun/install/global/node_modules/@oh-my-pi/pi-tui/src/overlays/rewind-selector.ts";

const packages = join(homedir(), ".bun/install/global/node_modules/@oh-my-pi");
const agent = join(packages, "pi-coding-agent/src");
const tui = join(packages, "pi-tui/src");

function replaceOnce(
  content: string,
  before: string,
  after: string,
  label: string,
) {
  if (content.includes(after)) return { content };
  if (content.split(before).length !== 2)
    throw new Error(`${label}: source drift`);
  return { content: content.replace(before, () => after) };
}
const patches = createRewindTmuxForkPatches({
  replaceOnce,
  insertBefore: (
    content: string,
    anchor: string,
    text: string,
    label: string,
  ) => replaceOnce(content, anchor, text + anchor, label),
  insertAfter: (content: string, anchor: string, text: string, label: string) =>
    replaceOnce(content, anchor, anchor + text, label),
});

test("all four source patches are anchored and idempotent", async () => {
  for (const [path, patch] of [
    [join(tui, "overlays/rewind-selector.ts"), patches.patchRewindTmuxFork],
    [join(agent, "session/session-manager.ts"), patches.patchSessionForkLeaf],
    [join(agent, "session/agent-session.ts"), patches.patchSessionForkFile],
    [
      join(agent, "modes/controllers/selector-controller.ts"),
      patches.patchRewindTmuxController,
    ],
  ] as const) {
    const once = patch(await readFile(path, "utf8"));
    expect(patch(once)).toBe(once);
    expect(() => patch("")).toThrow();
  }
});

const user = (text: string) => ({
  role: "user" as const,
  content: [{ type: "text" as const, text }],
  timestamp: 1,
});

test("independent fork ends at selection, copies artifacts, preserves source and rejects an invalid cut", async () => {
  const root = await mkdtemp(join(tmpdir(), "omp-rewind-fork-"));
  const source = SessionManager.create(root, join(root, "sessions"));
  let fork: InstanceType<typeof SessionManager> | undefined;
  try {
    const chosen = source.appendMessage(user("chosen turn"));
    const future = source.appendMessage(user("must not leak"));
    const sourceFile = source.getSessionFile()!;
    await source.ensureOnDisk();
    await source.flush();
    await mkdir(source.getArtifactsDir()!, { recursive: true });
    await writeFile(
      join(source.getArtifactsDir()!, "1.log"),
      "kept tool result",
    );
    const before = await readFile(sourceFile, "utf8");
    fork = await SessionManager.forkFrom(
      sourceFile,
      root,
      source.getSessionDir(),
      undefined,
      {
        leafId: chosen,
        suppressBreadcrumb: true,
      },
    );
    expect(fork.getSessionFile()).not.toBe(sourceFile);
    expect(fork.getSessionId()).not.toBe(source.getSessionId());
    expect(await readFile(join(fork.getArtifactsDir()!, "1.log"), "utf8")).toBe(
      "kept tool result",
    );
    expect(fork.getBranch().map((e: { id: string }) => e.id)).toEqual([chosen]);
    expect(fork.getEntries().some((e: { id: string }) => e.id === future)).toBe(
      false,
    );
    expect(source.getLeafId()).toBe(future);
    expect(await readFile(sourceFile, "utf8")).toBe(before);
    await expect(
      SessionManager.forkFrom(
        sourceFile,
        root,
        source.getSessionDir(),
        undefined,
        {
          leafId: "does-not-exist",
          suppressBreadcrumb: true,
        },
      ),
    ).rejects.toThrow("not found");
  } finally {
    await fork?.close();
    await source.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("Shift+Enter forks the outlined or filtered turn; ordinary Enter still rewinds", () => {
  const entries = [
    {
      type: "message",
      id: "first",
      parentId: null,
      timestamp: "2026-11-23T00:00:00Z",
      message: user("first turn"),
    },
    {
      type: "message",
      id: "second",
      parentId: "first",
      timestamp: "2026-11-23T00:00:01Z",
      message: user("second turn"),
    },
  ];
  const forks: string[] = [];
  const rewinds: string[] = [];
  const selector = new RewindSelectorComponent(entries, {
    ui: { terminal: { rows: 40 }, requestRender() {} },
    cwd: tmpdir(),
    requestRender() {},
    onCancel() {},
    onFork: (id: string) => forks.push(id),
    onSelect: (id: string) => rewinds.push(id),
  });
  try {
    selector.render(120);
    expect(selector.targetCount).toBe(2);
    for (const key of [
      "\x1b[13;2u",
      "\x1b[13;2~",
      "\n",
      "\x1b[106;5u",
      "\x1b[27;5;106~",
      "\x1b[10u",
    ])
      selector.handleInput(key);
    expect(forks).toEqual(Array(6).fill("second"));
    expect(rewinds).toEqual([]);
    selector.handleInput("\r");
    expect(rewinds).toEqual(["second"]);
    selector.handleInput("f");
    for (const char of "first") selector.handleInput(char);
    selector.handleInput("\n");
    expect(forks.at(-1)).toBe("first");
    for (const char of "nomatch") selector.handleInput(char);
    selector.handleInput("\n");
    expect(forks).toHaveLength(7);
  } finally {
    selector.dispose();
  }
});

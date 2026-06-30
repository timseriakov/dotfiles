import { existsSync } from "node:fs";
import path from "node:path";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

const WAKATIME = "/Users/tim/.wakatime/wakatime-cli";
const PLUGIN = "Oh My Pi/1";
const TIMEOUT_MS = 5_000;

export default function wakatimeHeartbeat(pi: ExtensionAPI): void {
  async function projectRoot(cwd: string): Promise<string> {
    const result = await pi.exec(
      "git",
      ["-C", cwd, "rev-parse", "--show-toplevel"],
      {
        timeout: TIMEOUT_MS,
        cwd,
      },
    );
    return result.code === 0 ? result.stdout.trim() : cwd;
  }

  async function heartbeat(cwd: string, write: boolean): Promise<void> {
    const root = await projectRoot(cwd);
    const entity =
      ["AGENTS.md", "README.md", "package.json"]
        .map((file) => path.join(root, file))
        .find(existsSync) ?? root;
    const args = [
      "--entity",
      entity,
      "--entity-type",
      "file",
      "--project",
      path
        .basename(root)
        .replace(/\.(?:add|feat|fix|db-backup|product)-.+$/, ""),
      "--project-folder",
      root,
      "--category",
      "ai coding",
      "--plugin",
      PLUGIN,
    ];

    if (write) args.push("--write");

    await pi.exec(WAKATIME, args, { timeout: TIMEOUT_MS, cwd });
  }

  pi.on("input", async (_event, ctx) => {
    try {
      await heartbeat(ctx.cwd, true);
    } catch {}
  });

  pi.on("agent_start", async (_event, ctx) => {
    try {
      await heartbeat(ctx.cwd, false);
    } catch {}
  });

  pi.on("agent_end", async (_event, ctx) => {
    try {
      await heartbeat(ctx.cwd, false);
    } catch {}
  });
}

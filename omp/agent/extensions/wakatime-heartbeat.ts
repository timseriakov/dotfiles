import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

const WAKATIME = "/Users/tim/.wakatime/wakatime-cli";
const ENTITY = "oh-my-pi://agent";
const PROJECT = "oh-my-pi";
const PLUGIN = "oh-my-pi-wakatime/1";
const TIMEOUT_MS = 5_000;

export default function wakatimeHeartbeat(pi: ExtensionAPI): void {
  function heartbeat(write: boolean): void {
    const args = [
      "--entity",
      ENTITY,
      "--entity-type",
      "app",
      "--project",
      PROJECT,
      "--category",
      "ai coding",
      "--plugin",
      PLUGIN,
    ];

    if (write) args.push("--write");

    pi.exec(WAKATIME, args, { timeout: TIMEOUT_MS }).catch(() => {});
  }

  pi.on("input", async () => {
    heartbeat(true);
  });

  pi.on("agent_start", async () => {
    heartbeat(false);
  });

  pi.on("agent_end", async () => {
    heartbeat(false);
  });
}

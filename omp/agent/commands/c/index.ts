// /c — prompt model to commit current changes.
import type {
  CustomCommand,
  CustomCommandAPI,
} from "@oh-my-pi/pi-coding-agent/extensibility/custom-commands";
import type { HookCommandContext } from "@oh-my-pi/pi-coding-agent/extensibility/hooks/types";

export default function (_api: CustomCommandAPI): CustomCommand[] {
  const cmd: CustomCommand = {
    name: "c",
    description: "Commit current changes",
    execute(args: string[], _ctx: HookCommandContext): string | undefined {
      const base = "commit";
      return args.length ? `${base} ${args.join(" ")}` : base;
    },
  };
  return [cmd, { ...cmd, name: "с" }];
}

// /c — prompt model to commit current changes.
import type {
  CustomCommand,
  CustomCommandAPI,
} from "@oh-my-pi/pi-coding-agent/extensibility/custom-commands";
import type { HookCommandContext } from "@oh-my-pi/pi-coding-agent/extensibility/hooks/types";

export default function commitCommand(_api: CustomCommandAPI): CustomCommand {
  return {
    name: "c",
    description: "Commit current changes",
    execute(_args: string[], _ctx: HookCommandContext): string | undefined {
      return "Закоммить текущие изменения. Пиши сообщение на английском, conventional commit. Ответь кратко, что и как закоммитил, на русском.";
    },
  };
}

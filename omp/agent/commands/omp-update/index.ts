import type {
  CustomCommand,
  CustomCommandAPI,
} from "@oh-my-pi/pi-coding-agent/extensibility/custom-commands";
import type { HookCommandContext } from "@oh-my-pi/pi-coding-agent/extensibility/hooks/types";

const PROMPT = `нужно сделать omp update;
и проследить что встал патч;
и дать краткое понятное саммари что поменялось в новом релизе;
так же проверь Plannotator и обнови если нужно.`;

export default function (_api: CustomCommandAPI): CustomCommand[] {
  const command: CustomCommand = {
    name: "omp-update",
    description:
      "Update OMP, verify patches, summarize release, and check Plannotator",
    execute(_args: string[], _ctx: HookCommandContext): string {
      return PROMPT;
    },
  };

  return [command];
}

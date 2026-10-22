import type {
  CustomCommand,
  CustomCommandAPI,
} from "@oh-my-pi/pi-coding-agent/extensibility/custom-commands";
import type { HookCommandContext } from "@oh-my-pi/pi-coding-agent/extensibility/hooks/types";

const PROMPT = `Снова делай omp update:
   1. Проверь текущую версию и наличие обновления; если есть — обнови.
   2. Прочитай release notes новой версии и расскажи мне понятным языком. Возможно есть что-то новое, что надо знать и опробывать.
   3. Если в release notes есть инструкции по обновлению, прогони их.
   3. Перепримени локальные monkey-патчи (node apply-omp-monkey-patches.mjs), проверь, что все маркеры на месте и сборка CLI пересобрана;
 повторный прогон должен давать 0 изменений.
   4. Прогони smoke: omp --no-session -p "ok".
   5. Проверь Plannotator: сравни установленную версию с npm latest. Если новее — обнови обе установки (~/.omp/agent/npm и ~/.omp/plugins) и снова
 прогони патчер.
   6. Обнови agent/last-changelog-version.
   7. Кратко отчитайся: версия OMP, статус патчей/сборки, саммари релиза, версия Plannotator. Сделай коммит.
`;

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

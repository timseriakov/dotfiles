import type {
  CustomCommand,
  CustomCommandAPI,
} from "@oh-my-pi/pi-coding-agent/extensibility/custom-commands";
import type { HookCommandContext } from "@oh-my-pi/pi-coding-agent/extensibility/hooks/types";

const PROMPT = `Снова делай omp update:
1. Проверь текущую версию и наличие обновления; если есть — обнови.
2. Прочитай release notes новой версии и расскажи саммари понятным языком: что нового, на что обратить внимание, что стоит попробовать. Если новых релизов нет — так и скажи.
3. Если в release notes есть инструкции по обновлению, прогони их.
4. Перепримени локальные monkey-патчи (node apply-omp-monkey-patches.mjs), проверь, что все маркеры на месте и сборка CLI пересобрана; повторный прогон должен давать 0 изменений.
5. Прогони smoke: omp --no-session -p "ok".
6. Проверь Plannotator: сравни установленную версию с npm latest. Если новее — обнови обе установки (~/.omp/agent/npm и ~/.omp/plugins) и снова прогони патчер.
7. Обнови agent/last-changelog-version, если версия новая.
8. Кратко отчитайся: версия OMP, статус патчей/сборки, саммари релиза, версия Plannotator. Сделай коммит, только если в git есть изменения.`;

export default function (_api: CustomCommandAPI): CustomCommand[] {
  const command: CustomCommand = {
    name: "omp-update",
    description:
      "Update OMP, verify patches, summarize release, and check Plannotator",
    execute(_args: string[], _ctx: HookCommandContext): string {
      // Unique per run: identical prompts get collapsed as duplicates upstream.
      return `${PROMPT}\n[omp-update ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}]`;
    },
  };

  return [command];
}

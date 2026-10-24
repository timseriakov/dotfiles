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
6. Проверь Plannotator отдельно в трёх местах: standalone CLI (command -v plannotator; plannotator --version), npm-расширение в ~/.omp/agent/npm и live-расширение в ~/.omp/plugins. Для CLI проверь plannotator update --check и при наличии обновления выполни plannotator update; для расширений сравни обе версии с npm latest и обнови каждую отстающую установку, сохранив точную версию зависимости в ~/.omp/plugins/package.json. Обновление npm-пакетов не обновляет standalone CLI. После обновления расширений снова прогони патчер и проверь идемпотентность. Повторно проверь фактические версии всех трёх установок; не объявляй Plannotator обновлённым, если CLI или одно из расширений осталось старым. CLI и расширения могут иметь разные latest: сравнивай каждый со своим источником обновления. Если запущенный Inbox использует старую версию, сообщи о необходимости перезапуска; не останавливай его автоматически и не теряй активные review-сессии. Затем расскажи, что изменилось между прежними и новыми версиями: новые возможности, исправления и важные изменения поведения — сначала по changelog или GitHub releases, при необходимости по diff содержимого пакетов; если данных нет, так и скажи.
7. Обнови agent/last-changelog-version, если версия новая.
8. Кратко отчитайся: версия OMP, статус патчей/сборки, саммари релиза OMP, отдельные версии Plannotator CLI и обоих расширений, что в Plannotator изменилось и нужен ли перезапуск Inbox. Сделай коммит, только если в git есть изменения.`;

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

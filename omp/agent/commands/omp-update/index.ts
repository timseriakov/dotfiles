import type {
  CustomCommand,
  CustomCommandAPI,
} from "@oh-my-pi/pi-coding-agent/extensibility/custom-commands";
import type { HookCommandContext } from "@oh-my-pi/pi-coding-agent/extensibility/hooks/types";

const PROMPT = `Снова делай omp update:
1. Проверь текущую версию и наличие обновления; если есть — обнови.
2. Прочитай release notes новой версии и расскажи саммари понятным языком: что нового, на что обратить внимание, что стоит попробовать. Если новых релизов нет — так и скажи.
3. Если в release notes есть инструкции по обновлению, прогони их.
4. Проверь Plannotator отдельно: standalone CLI (command -v plannotator; plannotator --version), npm-расширение в ~/.omp/agent/npm и live-расширение в ~/.omp/plugins. Для CLI выполни 'plannotator update --check'; не запускай 'plannotator update' напрямую — он ставит upstream binary без local patch. Extensions обновляй по их npm latest, сохраняй exact dependency version в ~/.omp/plugins/package.json. Автообновление CLI выключено в ~/.plannotator/config.json (autoUpdate: false).
4a. Получи resolved CLI path через 'command -v plannotator' и запусти 'node build-plannotator-setup-goal.mjs verify <resolved-path>'. Это проверяет pinned version и поведение setup-goal --tailscale; при несовпадении остановись и не объявляй CLI обновлённым.
4b. Если CLI старее pin, используй локальный builder: prepare, build, проверь candidate SHA-256 и install <sha256>. Если версия новее pin или другая — сообщи drift. Для продвижения pin сначала проверь native equivalents и обнови version/commit/archive/source hashes; затем build, hash-check, install и повторный verify.
4c. Повторно проверь версии CLI и обоих extensions, плюс marker/behavior CLI; не скрывай расхождения.
4c1. Только после успешной проверки установленного CLI запусти 'node build-plannotator-setup-goal.mjs prune <resolved-path>' даже если обновление не требовалось. install делает эту очистку автоматически: остаются текущая и предыдущая сборки в ~/.cache/plannotator-source и два свежих rollback-бинарника ~/.local/bin/plannotator.before-setup-goal-*. Активные сборки/бинарники пропускаются; ошибки проверки запрещают очистку. Не удаляй ~/.plannotator, историю, npm/Bun/pnpm или модели. После очистки сообщи оставшиеся версии и фактическое изменение свободного места.
4d. Проверь Inbox через plannotator inbox status --json; при несовпадающей версии выполни restart --tailscale и перепроверь. Tailscale обязателен.
4e. Restart сохраняет данные/threads, но прерывает live connections. Не рестартуй при совпавшей версии; сообщи ошибку без повтора при неудаче. Не используй ручные stop/kill.
4f. Саммари Plannotator — по changelog/releases, иначе по package diff; отсутствие данных назови явно.
5. На каждый локальный patch проверь native equivalent; удаляй только при доказанной эквивалентности.
6. Перепримени OMP patches через node apply-omp-monkey-patches.mjs; проверь markers, rebuilt CLI и идемпотентность.
7. Прогони smoke: omp --no-session -p "ok".
8. Обнови agent/last-changelog-version, если версия новая.
9. Кратко отчитайся по OMP/Plannotator versions, release notes, Inbox и patches с причинами; не скрывай неудачи и не создавай коммит.
`;

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

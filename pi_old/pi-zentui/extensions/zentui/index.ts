import type { AssistantMessage } from "@mariozechner/pi-ai";
import type {
  ExtensionAPI,
  ExtensionContext,
  Theme,
} from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import packageJson from "../../package.json";
import {
  type PolishedTuiConfig,
  colorize,
  ensureConfigExists,
  loadConfig,
} from "./config";
import { type GitStatusSummary, emptyGitStatus, readGitStatus } from "./git";
import { type RuntimeInfo, readRuntimeInfo } from "./runtime";

type FooterState = GitStatusSummary & {
  busy: boolean;
  modelLabel: string;
  providerLabel: string;
  contextLabel: string;
  tokenLabel: string;
  costLabel: string;
  runtime?: RuntimeInfo;
};

export type FooterSessionMetadata = {
  providerLabel?: string;
  modelLabel?: string;
  thinkingLabel?: string;
};

export function buildFooterRightSegmentLabels(
  metadata: FooterSessionMetadata,
  metrics: Pick<FooterState, "contextLabel" | "tokenLabel" | "costLabel">,
): string[] {
  const sessionMeta = [
    metadata.providerLabel,
    metadata.modelLabel,
    metadata.thinkingLabel && metadata.thinkingLabel !== "off"
      ? metadata.thinkingLabel
      : undefined,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return [
    sessionMeta,
    metrics.contextLabel,
    metrics.tokenLabel,
    metrics.costLabel,
  ].filter(Boolean);
}

export function composeFooterContent(
  left: string,
  right: string,
  innerWidth: number,
): string {
  const safeInnerWidth = Math.max(1, innerWidth);
  const leftWidth = visibleWidth(left);
  const rightWidth = visibleWidth(right);

  return leftWidth >= safeInnerWidth
    ? truncateToWidth(left, safeInnerWidth)
    : leftWidth + 1 + rightWidth <= safeInnerWidth
      ? `${left}${" ".repeat(safeInnerWidth - leftWidth - rightWidth)}${right}`
      : left;
}

export function buildFooterContent(
  leftSegments: string[],
  metadata: FooterSessionMetadata,
  metrics: Pick<FooterState, "contextLabel" | "tokenLabel" | "costLabel">,
  separator: string,
  innerWidth: number,
): string {
  const left = leftSegments.filter(Boolean).join(" ");
  const right = buildFooterRightSegmentLabels(metadata, metrics).join(
    separator,
  );
  return composeFooterContent(left, right, innerWidth);
}

type UsageTotals = {
  input: number;
  output: number;
  cost: number;
};

function formatCount(value: number): string {
  if (value < 1000) return `${value}`;
  if (value < 10_000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value / 1000)}k`;
}

function formatProviderLabel(provider: string | undefined): string {
  if (!provider) return "Unknown";

  const known: Record<string, string> = {
    anthropic: "Anthropic",
    gemini: "Google",
    google: "Google",
    ollama: "Ollama",
    openai: "OpenAI",
    "openai-codex": "OpenAI",
  };

  return (
    known[provider] ??
    provider
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function getUsageTotals(ctx: ExtensionContext): UsageTotals {
  let input = 0;
  let output = 0;
  let cost = 0;

  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type !== "message" || entry.message.role !== "assistant")
      continue;
    const message = entry.message as AssistantMessage;
    input += message.usage?.input ?? 0;
    output += message.usage?.output ?? 0;
    cost += message.usage?.cost?.total ?? 0;
  }

  return { input, output, cost };
}

function buildTokenLabel(totals: UsageTotals): string {
  return `↑${formatCount(totals.input)} ↓${formatCount(totals.output)}`;
}

function buildCostLabel(totals: UsageTotals): string {
  return `$${totals.cost.toFixed(3)}`;
}

function buildContextLabel(ctx: ExtensionContext): string {
  const usage = ctx.getContextUsage();
  const contextWindow = ctx.model?.contextWindow ?? usage?.contextWindow;

  if (!usage || !contextWindow || contextWindow <= 0) return "--";

  const percent =
    usage.percent === null
      ? "?"
      : `${Math.max(0, Math.min(999, Math.round(usage.percent)))}%`;
  return `${percent}/${formatCount(contextWindow)}`;
}

function getRuntimeColorToken(runtime: RuntimeInfo | undefined): string {
  switch (runtime?.name) {
    case "nodejs":
      return "success";
    case "deno":
      return "syntaxType";
    case "bun":
      return "warning";
    case "python":
    case "java":
      return "warning";
    case "rust":
    case "ruby":
      return "error";
    case "golang":
      return "syntaxType";
    case "lua":
    case "php":
      return "accent";
    default:
      return "text";
  }
}

function formatRuntimeSegment(
  theme: Pick<Theme, "fg">,
  runtime: RuntimeInfo | undefined,
  mutedColor: string,
): string {
  if (!runtime) return "";
  const label = runtime.version
    ? `${runtime.symbol} ${runtime.version}`
    : runtime.symbol;
  return `${colorize(theme, mutedColor, "via")} ${colorize(theme, getRuntimeColorToken(runtime), label)}`;
}

export function formatCwdLabel(cwd: string, maxSegments = 3): string {
  const normalized = cwd.replace(/\\/g, "/").replace(/\/+$/, "");
  const parts = normalized.split("/").filter(Boolean);
  return parts.slice(-maxSegments).join("/") || cwd;
}

export function formatProjectVersionLabel(
  name: string,
  version: string,
  icon = "󰏗",
): string {
  return `is ${icon} v${version}`;
}

export default function (pi: ExtensionAPI) {
  const state: FooterState = {
    busy: false,
    modelLabel: "no-model",
    providerLabel: "Unknown",
    contextLabel: "--",
    tokenLabel: "↑0 ↓0",
    costLabel: "$0.000",
    runtime: undefined,
    ...emptyGitStatus(),
  };

  let currentConfig: PolishedTuiConfig = loadConfig();
  let requestFooterRender: (() => void) | undefined;
  let projectRefreshInFlight = false;
  let projectRefreshPending = false;

  const refresh = () => requestFooterRender?.();

  const syncState = (ctx: ExtensionContext) => {
    const totals = getUsageTotals(ctx);
    state.modelLabel = ctx.model?.id ?? "no-model";
    state.providerLabel = formatProviderLabel(ctx.model?.provider);
    state.contextLabel = buildContextLabel(ctx);
    state.tokenLabel = buildTokenLabel(totals);
    state.costLabel = buildCostLabel(totals);
  };

  const refreshProjectState = async (ctx: ExtensionContext) => {
    const [gitStatus, runtime] = await Promise.all([
      readGitStatus(ctx.cwd),
      readRuntimeInfo(ctx.cwd),
    ]);
    Object.assign(state, gitStatus);
    state.runtime = runtime;
  };

  const scheduleProjectRefresh = (ctx: ExtensionContext) => {
    if (projectRefreshInFlight) {
      projectRefreshPending = true;
      return;
    }

    projectRefreshInFlight = true;
    void refreshProjectState(ctx).finally(() => {
      projectRefreshInFlight = false;
      refresh();
      if (projectRefreshPending) {
        projectRefreshPending = false;
        scheduleProjectRefresh(ctx);
      }
    });
  };

  const installFooter = (ctx: ExtensionContext) => {
    syncState(ctx);

    ctx.ui.setFooter((tui, theme, footerData) => {
      requestFooterRender = () => tui.requestRender();
      const unsubscribeBranch = footerData.onBranchChange(() => {
        scheduleProjectRefresh(ctx);
        tui.requestRender();
      });
      const separator = colorize(theme, currentConfig.colors.separator, " | ");

      return {
        dispose: () => {
          unsubscribeBranch();
          requestFooterRender = undefined;
        },
        invalidate() {},
        render(width: number): string[] {
          const innerWidth = Math.max(1, width - 2);
          const cwdLabel = colorize(
            theme,
            currentConfig.colors.cwdText,
            formatCwdLabel(ctx.cwd),
          );
          const branch = state.branch;
          const packageLabel = colorize(
            theme,
            "text",
            formatProjectVersionLabel(packageJson.name, packageJson.version),
          );
          const contextUsage = ctx.getContextUsage();
          const contextColor =
            contextUsage?.percent !== null &&
            contextUsage?.percent !== undefined
              ? contextUsage.percent >= 90
                ? currentConfig.colors.contextError
                : contextUsage.percent >= 70
                  ? currentConfig.colors.contextWarning
                  : currentConfig.colors.contextNormal
              : currentConfig.colors.contextNormal;
          const gitColor = (text: string) =>
            colorize(theme, currentConfig.colors.git, text);
          const gitStatusColor = (text: string) =>
            colorize(theme, currentConfig.colors.gitStatus, text);
          const gitIcon = gitColor(currentConfig.icons.git);
          const allStatus = [
            state.conflicted > 0 ? currentConfig.icons.conflicted : "",
            state.stashed ? currentConfig.icons.stashed : "",
            state.deleted > 0 ? currentConfig.icons.deleted : "",
            state.renamed > 0 ? currentConfig.icons.renamed : "",
            state.modified > 0 ? currentConfig.icons.modified : "",
            state.typechanged > 0 ? currentConfig.icons.typechanged : "",
            state.staged > 0 ? currentConfig.icons.staged : "",
            state.untracked > 0 ? currentConfig.icons.untracked : "",
          ].join("");
          const aheadBehind =
            state.ahead > 0 && state.behind > 0
              ? currentConfig.icons.diverged
              : state.ahead > 0
                ? currentConfig.icons.ahead
                : state.behind > 0
                  ? currentConfig.icons.behind
                  : "";
          const statusBlock =
            allStatus || aheadBehind
              ? gitStatusColor(`[${allStatus}${aheadBehind}]`)
              : "";
          const branchPrefix = [colorize(theme, "text", "on"), gitIcon]
            .filter(Boolean)
            .join(" ");
          const branchLabel = branch
            ? `${branchPrefix} ${gitColor(branch)}${statusBlock ? ` ${statusBlock}` : ""}`
            : "";
          const runtimeLabel = formatRuntimeSegment(
            theme,
            state.runtime,
            "text",
          );

          const thinkingLevel = pi.getThinkingLevel();
          const content = buildFooterContent(
            [cwdLabel, branchLabel, packageLabel, runtimeLabel],
            {
              providerLabel: colorize(theme, "text", state.providerLabel),
              modelLabel: colorize(theme, "accent", state.modelLabel),
              thinkingLabel:
                thinkingLevel === "off"
                  ? undefined
                  : colorize(theme, currentConfig.colors.tokens, thinkingLevel),
            },
            {
              contextLabel: colorize(theme, contextColor, state.contextLabel),
              tokenLabel: colorize(
                theme,
                currentConfig.colors.tokens,
                state.tokenLabel,
              ),
              costLabel: colorize(
                theme,
                currentConfig.colors.cost,
                state.costLabel,
              ),
            },
            separator,
            innerWidth,
          );
          return [` ${content} `];
        },
      };
    });
  };

  const installUi = (ctx: ExtensionContext) => {
    ensureConfigExists();
    currentConfig = loadConfig();
    installFooter(ctx);
    scheduleProjectRefresh(ctx);
    refresh();
  };

  pi.on("session_start", async (_event, ctx) => {
    installUi(ctx);
  });

  pi.on("agent_start", async (_event, ctx) => {
    state.busy = true;
    syncState(ctx);
    refresh();
  });

  pi.on("agent_end", async (_event, ctx) => {
    state.busy = false;
    syncState(ctx);
    scheduleProjectRefresh(ctx);
    refresh();
  });

  pi.on("model_select", async (_event, ctx) => {
    syncState(ctx);
    refresh();
  });

  pi.on("message_end", async (_event, ctx) => {
    syncState(ctx);
    scheduleProjectRefresh(ctx);
    refresh();
  });

  pi.on("tool_execution_end", async (_event, ctx) => {
    syncState(ctx);
    scheduleProjectRefresh(ctx);
    refresh();
  });

  pi.on("session_compact", async (_event, ctx) => {
    syncState(ctx);
    scheduleProjectRefresh(ctx);
    refresh();
  });
}

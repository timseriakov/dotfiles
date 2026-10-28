/**
 * Plannotator extension patches.
 *
 * `@plannotator/pi-extension/index.ts` notifies on every session_start that
 * project-local config is disabled when the Pi runtime predates
 * `ctx.isProjectTrusted` (a 0.79.1+ API). That banner is noise on this host;
 * suppress the notify while keeping the (const-false) projectTrusted behavior
 * unchanged.
 */
export function patchPlannotatorVersionWarning(content, { replaceAny }) {
  let out = content;
  const r = replaceAny(
    out,
    [
      `\t\tif (typeof trustFn !== "function") {
\t\t\tctx.ui.notify(
\t\t\t\t"Plannotator requires Pi 0.79.1 or newer. Update Pi; project-local config is disabled on this host.",
\t\t\t\t"warning",
\t\t\t);
\t\t}`,
      `\t\tif (typeof trustFn !== "function") {
\t\t\tctx.ui.notify(PROJECT_TRUST_CAPABILITY_WARNING, "warning");
\t\t}`,
    ],
    `\t\tif (typeof trustFn !== "function") {
\t\t\t// version-gated banner suppressed by monkey patch
\t\t}`,
    "suppress Plannotator version warning",
  );
  out = r.content;
  return out;
}

export function patchPlannotatorBrowserNotification(content, { replaceAny }) {
  const current = `\tconst failedLocally = !notOpening && !isRemoteSession() && !browserResult.opened;\n\tif (!announcedInTurn) {\n\t\tconst suffix = notOpening\n\t\t\t? \` — \${notOpening}\`\n\t\t\t: failedLocally ? " (could not open a browser automatically; open this URL)" : "";\n\t\tctx.ui.notify(\`Plannotator session ready: \${serverUrl}\${suffix}\`, "info");\n\t} else if (failedLocally) {\n\t\tctx.ui.notify(\`Could not open a browser automatically. Open \${serverUrl} to review.\`, "info");\n\t}`;
  const patched = `\tconst failedLocally = !notOpening && !isRemoteSession() && !browserResult.opened;\n\tif (!announcedInTurn || isRemoteSession()) {\n\t\tconst suffix = notOpening\n\t\t\t? \` — \${notOpening}\`\n\t\t\t: failedLocally ? " (could not open a browser automatically; open this URL)" : "";\n\t\tctx.ui.notify(\`Plannotator session ready: \${serverUrl}\${suffix}\`, "info");\n\t} else if (failedLocally) {\n\t\tctx.ui.notify(\`Could not open a browser automatically. Open \${serverUrl} to review.\`, "info");\n\t}`;
  return replaceAny(
    content,
    [current, patched],
    patched,
    "open Plannotator in local RPC sessions",
  ).content;
}

export function patchPlannotatorFeedbackDelivery(content) {
  const oldText = `{ deliverAs: "followUp" }`;
  const newText = `{ deliverAs: "aside" }`;
  const planText = `pi.sendUserMessage(text, { deliverAs: "followUp" });`;
  const followUpCount = content.split(oldText).length - 1;
  const hasPlanDelivery = content.includes(planText);
  const feedbackFollowUpCount = followUpCount - (hasPlanDelivery ? 1 : 0);
  const asideCount = content.split(newText).length - 1;
  const expectedFeedbackCount = hasPlanDelivery ? 6 : 4;

  if (feedbackFollowUpCount === 0) {
    if (asideCount === expectedFeedbackCount) return content;
    throw new Error(
      `Patch 'start Plannotator feedback turns' expected ${expectedFeedbackCount} feedback callsites or an already patched source, found ${asideCount} aside callsites.`,
    );
  }
  if (feedbackFollowUpCount !== expectedFeedbackCount) {
    throw new Error(
      `Patch 'start Plannotator feedback turns' expected ${expectedFeedbackCount} feedback callsites, found ${feedbackFollowUpCount}. Upstream source changed.`,
    );
  }

  const sentinel = "__PLANNOTATOR_PLAN_FOLLOWUP__";
  const protectedPlan = hasPlanDelivery
    ? content.replace(
        planText,
        `pi.sendUserMessage(text, { deliverAs: "${sentinel}" });`,
      )
    : content;
  return protectedPlan
    .split(oldText)
    .join(newText)
    .replace(
      `pi.sendUserMessage(text, { deliverAs: "${sentinel}" });`,
      planText,
    );
}

function patchTailnetServer(content, { replaceAny }) {
  const replace = (old, updated, label) => {
    content = replaceAny(content, [old], updated, label).content;
  };
  replace(
    'import { createRequestHostGuard } from "./request-host-guard.ts";',
    'import { createRequestHostGuard } from "./request-host-guard.ts";\nimport { preparePlannotatorTailnet, publishPlannotatorTailnet } from "../plannotator-tailnet.ts";',
    "import native Tailscale lifecycle",
  );
  replace(
    "\turl: string;",
    "\turl: string;\n\tlocalUrl: string;\n\ttailnetDiagnostic?: string;",
    "return local fallback metadata",
  );
  replace(
    "const requestHostGuard = createRequestHostGuard();",
    "const tailnetSetup = preparePlannotatorTailnet();\n\tconst requestHostGuard = createRequestHostGuard(tailnetSetup.host);",
    "allow current exact tailnet hostname",
  );
  replace(
    "await listenOnPort(server)",
    'await listenOnPort(server, "127.0.0.1")',
    "keep review listener on loopback",
  );
  replace(
    "boundPort = port;",
    "boundPort = port;\n\tconst localUrl = `http://127.0.0.1:${port}`;\n\tconst tailnet = await publishPlannotatorTailnet(tailnetSetup, port, localUrl);",
    "publish current dynamic port",
  );
  replace(
    "stop: () => {",
    "stop: () => {\n\t\t\ttailnet.cleanup();",
    "clean up owned Serve route",
  );
  return content;
}

export function patchPlannotatorPlanTailnet(content, context) {
  let out = patchTailnetServer(content, context);
  out = context.replaceAny(
    out,
    ["url: buildAdvertisedUrl(port),"],
    "url: tailnet.url ?? localUrl,\n\t\tlocalUrl,\n\ttailnetDiagnostic: tailnet.diagnostic,",
    "announce verified session URL",
  ).content;
  if (out.includes("supportsAnnotateAgentTerminalMode")) {
    out = context.replaceAny(
      out,
      [
        'enabled: supportsAnnotateAgentTerminalMode(options.mode || "annotate"),',
      ],
      'enabled: supportsAnnotateAgentTerminalMode(options.mode || "annotate") && (!tailnetSetup.host || process.env.PLANNOTATOR_AGENT_TERMINAL_REMOTE === "1"),',
      "keep tailnet terminal disabled by default",
    ).content;
    out = context.replaceAny(
      out,
      [
        "\t} catch (error) {\n\t\tdisposeFailedStart();\n\t\tthrow error;\n\t}\n\tagentTerminalCapability",
      ],
      "\t} catch (error) {\n\t\ttailnet.cleanup();\n\t\tdisposeFailedStart();\n\t\tthrow error;\n\t}\n\tagentTerminalCapability",
      "clean tailnet after failed annotate startup",
    ).content;
  }
  return out;
}

export function patchPlannotatorReviewTailnet(content, context) {
  let out = patchTailnetServer(content, context);
  out = context.replaceAny(
    out,
    ["serverUrl = buildAdvertisedUrl(port);"],
    "serverUrl = tailnet.url ?? localUrl;",
    "use verified HTTPS for code review",
  ).content;
  return context.replaceAny(
    out,
    ["url: serverUrl,"],
    "url: serverUrl,\n\t\tlocalUrl,\n\ttailnetDiagnostic: tailnet.diagnostic,",
    "return review access metadata",
  ).content;
}

export function patchPlannotatorGuard(content, { replaceAny }) {
  let out = replaceAny(
    content,
    ["export function createRequestHostGuard(): PiRequestHostGuard {"],
    "export function createRequestHostGuard(tailnetHost?: string): PiRequestHostGuard {",
    "accept exact current tailnet host",
  ).content;
  return replaceAny(
    out,
    ["if (isAllowedRequestHost(host, policy)) return true;"],
    "if (isAllowedRequestHost(host, policy)) return true;\n\t\tif (tailnetHost && isAllowedRequestHost(host, { ...policy, extraHosts: [tailnetHost] })) return true;",
    "preserve guard and add exact hostname",
  ).content;
}

export function patchPlannotatorLoopbackPort(content, { replaceAny }) {
  let out = replaceAny(
    content,
    [
      'export async function listenOnPort(\n\tserver: Server,\n): Promise<{ port: number; portSource: "env" | "remote-default" | "random" }> {',
    ],
    'export async function listenOnPort(\n\tserver: Server,\n\thostname = getServerHostname(),\n): Promise<{ port: number; portSource: "env" | "remote-default" | "random" }> {',
    "allow explicit loopback listener",
  ).content;
  return replaceAny(
    out,
    ["server.listen(port, getServerHostname());"],
    "server.listen(port, hostname);",
    "use requested listener host",
  ).content;
}

export function patchPlannotatorBrowserOpen(content, { replaceAny }) {
  let out = replaceAny(
    content,
    ['import { openBrowser, isRemoteSession } from "./server/network.ts";'],
    'import { openBrowser, isRemoteSession } from "./server/network.ts";\nimport { openPlannotatorBrowser } from "./plannotator-tailnet.ts";',
    "import system-browser launcher",
  ).content;
  const replacements = [
    [
      "const browserResult = await openBrowser(serverUrl);",
      "const browserResult = await openPlannotatorBrowser(serverUrl);",
      "open user review in system browser",
    ],
    [
      "export interface BrowserDecisionSession<T> {\n\turl: string;",
      "export interface BrowserDecisionSession<T> {\n\turl: string;\n\tlocalUrl?: string;\n\ttailnetDiagnostic?: string;",
      "expose review access metadata",
    ],
    [
      "server: { url: string; stop: () => void; hostControl?: HostControl },",
      "server: { url: string; localUrl?: string; tailnetDiagnostic?: string; stop: () => void; hostControl?: HostControl },",
      "accept review access metadata",
    ],
    [
      "\t\turl: server.url,",
      "\t\turl: server.url,\n\t\tlocalUrl: server.localUrl,\n\t\ttailnetDiagnostic: server.tailnetDiagnostic,",
      "retain metadata in browser session",
    ],
  ];
  for (const [old, updated, label] of replacements)
    out = replaceAny(out, [old], updated, label).content;
  return out;
}

export function patchPlannotatorAnnouncement(content, { replaceAny }) {
  let out = replaceAny(
    content,
    [
      'import { isRemoteSession, isUrlHostOverridden } from "./server/network.ts";',
    ],
    'import { isRemoteSession, isUrlHostOverridden } from "./server/network.ts";\nimport { plannotatorTailnetAnnouncement } from "./plannotator-tailnet-runtime.mjs";',
    "import verified access announcement",
  ).content;
  out = replaceAny(
    out,
    [
      "export function sessionOpenedMessage(label: string, url: string): string {",
    ],
    "export function sessionOpenedMessage(label: string, url: string, access?: { localUrl?: string; tailnetDiagnostic?: string }): string {",
    "include session access result",
  ).content;
  return replaceAny(
    out,
    ["if (!isRemoteSession()) return `${label} at ${url}.${tail}`;"],
    "if (!isRemoteSession() || access?.localUrl) return `${label} at ${url}.${plannotatorTailnetAnnouncement(access)}${tail}`;",
    "show verified HTTPS or explicit fallback",
  ).content;
}

export function patchPlannotatorNotifications(content, { replaceAny }) {
  for (const label of [
    "Code review opened",
    "Annotation opened",
    "Last-message annotation opened",
    "Plannotator: plan review opened",
  ]) {
    const old = `sessionOpenedMessage("${label}", session.url)`;
    const updated = `sessionOpenedMessage("${label}", session.url, session)`;
    content = replaceAny(
      content,
      [old],
      updated,
      `announce access for ${label}`,
    ).content;
  }
  return content;
}

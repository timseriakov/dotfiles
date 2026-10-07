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
  const r = replaceAny(
    content,
    [
      `\tif (ctx.mode === "rpc" || isRemoteSession()) {
\t\tctx.ui.notify(\`[Plannotator] \${serverUrl}\`, "info");
\t} else if (!browserResult.opened) {
\t\tctx.ui.notify(\`Open this URL to review: \${serverUrl}\`, "info");
\t}`,
    ],
    `\tif (isRemoteSession()) {
\t\tctx.ui.notify(\`[Plannotator] \${serverUrl}\`, "info");
\t} else if (!browserResult.opened) {
\t\tctx.ui.notify(\`Open this URL to review: \${serverUrl}\`, "info");
\t}`,
    "open Plannotator in local RPC sessions",
  );
  return r.content;
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

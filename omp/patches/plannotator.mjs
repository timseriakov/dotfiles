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

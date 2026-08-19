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
			ctx.ui.notify(
				"Plannotator requires Pi 0.79.1 or newer. Update Pi; project-local config is disabled on this host.",
				"warning",
			);
		}`,
    ],
    `\t\tif (typeof trustFn !== "function") {
			// version-gated banner suppressed by monkey patch
		}`,
    "suppress Plannotator version warning",
  );
  out = r.content;
  return out;
}

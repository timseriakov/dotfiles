import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

export default function terminalTheme(
  pi: Pick<ExtensionAPI, "registerCommand">,
): void {
  for (const [mode, theme] of [
    ["light", "starship-nord-light"],
    ["dark", "starship-nord"],
  ]) {
    pi.registerCommand(`theme-${mode}`, {
      description: `Apply Nord ${mode} to this OMP process without changing settings`,
      handler: async (_args, ctx) => {
        const result = await ctx.ui.setTheme(theme);
        ctx.ui.notify(
          result.success ? `OMP: ${theme}` : `Theme failed: ${result.error}`,
          result.success ? "info" : "error",
        );
      },
    });
  }
}

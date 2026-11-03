import { expect, test } from "bun:test";
import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@oh-my-pi/pi-coding-agent";
import terminalTheme from "../agent/extensions/terminal-theme.ts";

test("explicit light/dark commands apply themes without auto-switching", async () => {
  const commands = new Map<
    string,
    Parameters<ExtensionAPI["registerCommand"]>[1]
  >();
  terminalTheme({
    registerCommand: (name, command) => commands.set(name, command),
  });
  expect([...commands.keys()]).toEqual(["theme-light", "theme-dark"]);

  const applied: string[] = [];
  const notices: unknown[] = [];
  const ctx = {
    ui: {
      setTheme: async (
        name: string,
      ): Promise<{ success: boolean; error?: string }> => {
        applied.push(name);
        return { success: true };
      },
      notify: (...args: unknown[]) => notices.push(args),
    },
  };
  // The handlers only use the two UI methods implemented by this test double.
  const context = ctx as unknown as ExtensionCommandContext;
  await commands.get("theme-light")!.handler("", context);
  await commands.get("theme-dark")!.handler("", context);
  expect(applied).toEqual(["starship-nord-light", "starship-nord"]);
  expect(notices).toEqual([
    ["OMP: starship-nord-light", "info"],
    ["OMP: starship-nord", "info"],
  ]);

  ctx.ui.setTheme = async () => ({ success: false, error: "Missing theme" });
  await commands.get("theme-light")!.handler("", context);
  expect(notices.at(-1)).toEqual(["Theme failed: Missing theme", "error"]);
});

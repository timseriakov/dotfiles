import { CustomEditor, type EditorTheme } from "@oh-my-pi/pi-coding-agent";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import type { KeybindingsManager } from "@oh-my-pi/pi-coding-agent";
import type { TUI } from "@oh-my-pi/pi-tui";

class StarshipMinimalEditor extends CustomEditor {
  constructor(theme: EditorTheme) {
    super(theme);
    this.setBorderVisible(false);
    this.setPaddingX(0);
    this.setPromptGutter(" ");
    this.setPromptGutterColor(theme.fg.bind(theme, "success"));
  }
}

export default function starshipMinimalEditor(pi: ExtensionAPI): void {
  pi.on("session_start", (_event, ctx) => {
    if (!ctx.hasUI) return;
    ctx.ui.setEditorComponent(
      (_tui: TUI, theme: EditorTheme, _keybindings: KeybindingsManager) => {
        return new StarshipMinimalEditor(theme);
      },
    );
  });
}

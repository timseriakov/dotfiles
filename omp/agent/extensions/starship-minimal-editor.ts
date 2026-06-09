import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

export default function starshipMinimalEditor(pi: ExtensionAPI): void {
  pi.registerShortcut("ctrl+k", {
    description: "Compact context",
    handler: async (ctx) => {
      if (!ctx.isIdle()) {
        if (ctx.hasUI) {
          ctx.ui.notify(
            "Wait for current turn to finish before compacting.",
            "info",
          );
        }
        return;
      }

      if (ctx.hasPendingMessages()) {
        if (ctx.hasUI) {
          ctx.ui.notify("Process queued messages before compacting.", "info");
        }
        return;
      }

      if (ctx.hasUI) {
        ctx.ui.notify("Compaction started", "info");
      }

      ctx.compact({
        onComplete: () => {
          if (ctx.hasUI) {
            ctx.ui.notify("Compaction completed", "success");
          }
        },
        onError: (error) => {
          if (ctx.hasUI) {
            ctx.ui.notify(`Compaction failed: ${error.message}`, "error");
          }
        },
      });
    },
  });
}

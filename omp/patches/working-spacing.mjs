/**
 * Working row / status band spacing: the band composer closes the editor gap
 * under any drawn status row, so a turn's `Working…` row touches the band.
 * Keep the gap open while a status row (working, retry) holds the slot; the
 * idle trailer still sits flush on the band.
 */
export function createWorkingSpacingPatches(ctx) {
  const { replaceOnce } = ctx;

  function patchWorkingBandGap(content) {
    return replaceOnce(
      content,
      "\t\t\t\t\tstatusOccupied={hud.status.occupied}",
      "\t\t\t\t\t// A status row is its own line: keep one blank row above the band.\n\t\t\t\t\tstatusOccupied={() => hud.status.current() === undefined && hud.status.occupied()}",
      "working row band gap",
    ).content;
  }

  return { patchWorkingBandGap };
}

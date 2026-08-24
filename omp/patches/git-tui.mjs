export function createGitTuiPatches({ replaceAny }) {
  function patchGitTuiColors(content) {
    return replaceAny(
      content,
      [
        `export function canvasHex(): string {
	const hex = theme.getBgHex("statusLineBg");
	return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : isDark() ? "#000000" : "#ffffff";
}`,
        `export function canvasHex(): string {
	const hex = theme.getBgHex("statusLineBg");
	if (/^#[0-9a-fA-F]{6}$/.test(hex) && hex !== "#ffffff" && hex !== "#000000") return hex;
	const surface = theme.getBgHex("userMessageBg");
	return /^#[0-9a-fA-F]{6}$/.test(surface) ? surface : isDark() ? "#2e3440" : "#ffffff";
}`,
        `export function canvasHex(): string {
	const brightText = luminance(textHex()) > 0.5;
	const hex = theme.getBgHex("statusLineBg");
	if (!brightText && /^#[0-9a-fA-F]{6}$/.test(hex) && hex !== "#ffffff" && hex !== "#000000") return hex;
	const surface = theme.getBgHex("userMessageBg");
	if (!brightText && /^#[0-9a-fA-F]{6}$/.test(surface)) return surface;
	return brightText ? "#2e3440" : "#ffffff";
}`,
      ],
      `export function canvasHex(): string {
	const brightText = luminance(textHex()) > 0.5;
	const hex = theme.getBgHex("statusLineBg");
	if (!brightText && /^#[0-9a-fA-F]{6}$/.test(hex) && hex !== "#ffffff" && hex !== "#000000") return hex;
	const surface = theme.getBgHex("userMessageBg");
	if (!brightText && /^#[0-9a-fA-F]{6}$/.test(surface)) return surface;
	return brightText ? "#2e3440" : "#ffffff";
}`,
      "git TUI uses readable surface when statusLineBg is terminal default",
    ).content;
  }

  return { patchGitTuiColors };
}

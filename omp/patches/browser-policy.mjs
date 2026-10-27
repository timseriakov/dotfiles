export function patchBrowserRelayOnly(content, { replaceAny }) {
  const validation = `\tif (parsed instanceof type.errors) {\n\t\tthrow new ToolError(\`browser received invalid arguments: \${parsed.summary}\`);\n\t}\n`;
  const guard = `${validation}\tif (parsed.app?.relay !== true || !parsed.app.target?.trim()) {\n\t\tthrow new ToolError("Use ego-browser for browser automation. OMP relay is an explicit fallback and requires app.relay=true plus an explicit app.target.");\n\t}\n\tif (resolveBrowserKind(parsed, session).kind !== "relay") {\n\t\tthrow new ToolError("OMP browser fallback requires the browser relay.");\n\t}\n`;
  return replaceAny(
    content,
    [validation, guard],
    guard,
    "require explicit OMP browser relay fallback",
  ).content;
}

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

export function patchPlannotatorEgoViewer(content, { replaceAny }) {
  const systemOpen = `\t\t} else if (platform === "darwin") {\n\t\t\tcmd = "open";\n\t\t\targs = [url];\n\t\t} else {\n\t\t\tcmd = "xdg-open";\n\t\t\targs = [url];\n\t\t}`;
  const egoOpen = `\t\t} else if (platform === "darwin") {\n\t\t\tcmd = "open";\n\t\t\targs = ["-a", "/Applications/ego lite.app", url];\n\t\t} else {\n\t\t\tcmd = "xdg-open";\n\t\t\targs = [url];\n\t\t}`;
  return replaceAny(
    content,
    [systemOpen, egoOpen],
    egoOpen,
    "open Plannotator human review in ego lite",
  ).content;
}

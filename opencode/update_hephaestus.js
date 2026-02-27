#!/usr/bin/env node

const fs = require("fs");

// Files to update Hephaestus
const files = [
  "oh-my-opencode.jsonc",
  "oh-my-opencode_glm.jsonc",
  "oh-my-opencode_antigravity_opus_4_6.jsonc",
  "oh-my-opencode_antigravity_gemini_3.jsonc",
];

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");

  // Replace Hephaestus block more carefully
  // Find the hephaestus block and replace it
  const hephaestusPattern =
    /(\s*"hephaestus":\s*\{\s*"model":\s*)"[^"]+"(\s*,\s*"temperature":\s*)[^,]+(\s*\})/;

  content = content.replace(
    hephaestusPattern,
    '$1"openai/gpt-5.3-codex"$2"variant": "medium",$3',
  );

  fs.writeFileSync(file, content);
  console.log("Updated Hephaestus in:", file);
});

console.log("Done with Hephaestus updates");

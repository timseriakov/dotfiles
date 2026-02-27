#!/usr/bin/env node

const fs = require("fs");

const files = [
  "oh-my-opencode.jsonc",
  "oh-my-opencode_glm.jsonc",
  "oh-my-opencode_openai.jsonc",
  "oh-my-opencode_antigravity_opus_4_6.jsonc",
  "oh-my-opencode_antigravity_gemini_3.jsonc",
  "oh-my-opencode_openai_glm.jsonc",
  "oh-my-opencode_openai_and_antigravity.jsonc",
];

files.forEach((file) => {
  try {
    const content = fs.readFileSync(file, "utf8");
    // Remove comments for JSON.parse
    const jsonContent = content
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    JSON.parse(jsonContent);
    console.log("✓", file, "- valid JSON");
  } catch (e) {
    console.log("✗", file, "- INVALID:", e.message);
  }
});

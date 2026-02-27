#!/usr/bin/env node

const fs = require("fs");

// Files to replace glm-4.7-flash
const files = [
  "oh-my-opencode.jsonc",
  "oh-my-opencode_glm.jsonc",
  "oh-my-opencode_openai_glm.jsonc",
  "oh-my-opencode_openai_and_antigravity.jsonc",
];

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");

  // Replace librarian
  content = content.replace(
    /(\s*"librarian":\s*\{\s*"model":\s*)"zai-coding-plan\/glm-4\.7-flash"(\s*,\s*"temperature":)/,
    '$1"openai/gpt-5.1-codex-mini"$2',
  );

  // Replace explore
  content = content.replace(
    /(\s*"explore":\s*\{\s*"model":\s*)"zai-coding-plan\/glm-4\.7-flash"(\s*,\s*"temperature":)/,
    '$1"openai/gpt-5.1-codex-mini"$2',
  );

  // Replace quick category
  content = content.replace(
    /(\s*"quick":\s*\{\s*"model":\s*)"zai-coding-plan\/glm-4\.7-flash"(\s*,\s*"temperature":)/,
    '$1"openai/gpt-5.1-codex-mini"$2',
  );

  fs.writeFileSync(file, content);
  console.log("Replaced glm-4.7-flash in:", file);
});

console.log("Done with flash replacement");

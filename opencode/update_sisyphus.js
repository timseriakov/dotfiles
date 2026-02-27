#!/usr/bin/env node

const fs = require("fs");

// Update Sisyphus to GLM in openai config
const file = "oh-my-opencode_openai.jsonc";
let content = fs.readFileSync(file, "utf8");

// Replace Sisyphus model
content = content.replace(
  /(\s*"sisyphus":\s*\{\s*"model":\s*)"[^"]+"(\s*,\s*"temperature":)/,
  '$1"zai-coding-plan/glm-4.7"$2',
);

// Replace Sisyphus-Junior model
content = content.replace(
  /(\s*"sisyphus-junior":\s*\{\s*"model":\s*)"[^"]+"(\s*,\s*"temperature":)/,
  '$1"zai-coding-plan/glm-4.7"$2',
);

fs.writeFileSync(file, content);
console.log("Updated Sisyphus to GLM in:", file);

console.log("Done with Sisyphus updates");

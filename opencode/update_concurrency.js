#!/usr/bin/env node

const fs = require("fs");

// Files that need openai provider
const files = [
  "oh-my-opencode.jsonc",
  "oh-my-opencode_glm.jsonc",
  "oh-my-opencode_antigravity_opus_4_6.jsonc",
  "oh-my-opencode_antigravity_gemini_3.jsonc",
];

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");

  // Add openai: 5 to providerConcurrency if not already present
  if (!content.match(/"providerConcurrency":\s*\{[^}]*"openai":/)) {
    content = content.replace(
      /("providerConcurrency":\s*\{)/,
      '$1\n    "openai": 5,',
    );
  }

  // Remove glm-4.7-flash from modelConcurrency
  content = content.replace(
    /,\s*"zai-coding-plan\/glm-4\.7-flash":\s*\d+/g,
    "",
  );

  // Add openai/gpt-5.1-codex-mini: 8 to modelConcurrency if not present
  if (
    !content.match(
      /"modelConcurrency":\s*\{[^}]*"openai\/gpt-5\.1-codex-mini":/,
    )
  ) {
    content = content.replace(
      /("modelConcurrency":\s*\{)/,
      '$1\n      "openai/gpt-5.1-codex-mini": 8,',
    );
  }

  fs.writeFileSync(file, content);
  console.log("Updated concurrency for:", file);
});

// oh-my-opencode_openai.jsonc: add zai-coding-plan provider
let content = fs.readFileSync("oh-my-opencode_openai.jsonc", "utf8");

if (!content.match(/"providerConcurrency":\s*\{[^}]*"zai-coding-plan":/)) {
  content = content.replace(
    /("providerConcurrency":\s*\{)/,
    '$1\n    "zai-coding-plan": 5,',
  );
}

if (
  !content.match(/"modelConcurrency":\s*\{[^}]*"zai-coding-plan\/glm-4\.7":/)
) {
  content = content.replace(
    /("modelConcurrency":\s*\{)/,
    '$1\n      "zai-coding-plan/glm-4.7": 3,',
  );
}

fs.writeFileSync("oh-my-opencode_openai.jsonc", content);
console.log("Updated concurrency for oh-my-opencode_openai.jsonc");

console.log("Done with concurrency updates");

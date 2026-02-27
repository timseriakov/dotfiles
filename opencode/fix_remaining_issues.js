#!/usr/bin/env node

const fs = require("fs");

// Fix Hephaestus in oh-my-opencode_antigravity_gemini_3.jsonc
console.log("Fixing Hephaestus in oh-my-opencode_antigravity_gemini_3.jsonc");
let geminiContent = fs.readFileSync(
  "oh-my-opencode_antigravity_gemini_3.jsonc",
  "utf8",
);

// The current Hephaestus has a different structure - fix it specifically
geminiContent = geminiContent.replace(
  /(\s*"hephaestus":\s*\{\s*"model":\s*)"google\/gemini-3-pro"(\s*,\s*"variant":\s*"high"\s*\})/,
  '$1"openai/gpt-5.3-codex"$2\n      "variant": "medium"$3',
);

fs.writeFileSync("oh-my-opencode_antigravity_gemini_3.jsonc", geminiContent);
console.log(
  "✓ Hephaestus updated in oh-my-opencode_antigravity_gemini_3.jsonc",
);

// Remove glm-4.7-flash from modelConcurrency and add openai provider
[
  "oh-my-opencode_openai_glm.jsonc",
  "oh-my-opencode_openai_and_antigravity.jsonc",
].forEach((file) => {
  console.log("\nFixing", file);
  let content = fs.readFileSync(file, "utf8");

  // Remove glm-4.7-flash from modelConcurrency more aggressively
  content = content.replace(
    /,\s*"zai-coding-plan\/glm-4\.7-flash":\s*\d+/g,
    "",
  );
  // Also handle case where it's at the end (no leading comma)
  content = content.replace(
    /"zai-coding-plan\/glm-4\.7-flash":\s*\d+,?\s*\n?/g,
    "",
  );

  // Add openai to providerConcurrency if not present
  if (!content.match(/"providerConcurrency":\s*\{[^}]*"openai":/)) {
    content = content.replace(
      /("providerConcurrency":\s*\{)/,
      '$1\n    "openai": 5,',
    );
  }

  // Add gpt-5.1-codex-mini to modelConcurrency if not present
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
  console.log("✓ Fixed", file);
});

console.log("\nDone with all fixes");

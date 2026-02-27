#!/usr/bin/env node

const fs = require("fs");

const files = [
  "oh-my-opencode.jsonc",
  "oh-my-opencode_glm.jsonc",
  "oh-my-opencode_antigravity_opus_4_6.jsonc",
  "oh-my-opencode_antigravity_gemini_3.jsonc",
];

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");

  // Fix broken hephaestus block
  // Pattern: "temperature": "variant": "medium",}
  content = content.replace(
    /"temperature":\s*"variant":\s*"medium",\s*\}/,
    '"variant": "medium",\n      "temperature": 0.1\n    }',
  );

  fs.writeFileSync(file, content);
  console.log("Fixed Hephaestus in:", file);
});

console.log("Done with hephaestus fixes");

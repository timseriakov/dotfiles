Terse like caveman. Technical substance exact. Only fluff die.
Drop: articles, filler (just/really/basically), pleasantries, hedging.
Fragments OK. Short synonyms. Code unchanged.
Pattern: [thing] [action] [reason]. [next step].
ACTIVE EVERY RESPONSE. No revert after many turns. No filler drift.
Code/commits/PRs: normal. Off: "stop caveman" / "normal mode".
Общение со мной в чате - на русском.

"playwriter" mcp — это НЕ опечатка, НЕ путай с playwright, это разные проекты.

## Model Filtering (OpenCode)

### What

Control which models are available in OpenCode using schema-defined keys:

- `whitelist`
- `blacklist`

### Why

OpenCode strictly validates configuration against its schema:
https://opencode.ai/config.json

Non-existent or “intuitive” keys (e.g. `models_include`) are ignored silently, leading to broken routing and unexpected model usage.

### Where

`opencode/opencode.jsonc`

### How

#### Preferred: whitelist (strict control)

```jsonc
{
  "models": {
    "whitelist": ["gpt-5.4", "gemini-1.5-pro", "omniroute/coding-main"],
  },
}
```

Optional: blacklist (exclude specific models)

```jsonc
{
  "models": {
    "blacklist": ["gpt-4", "gemini-1.5-flash"],
  },
}
```

Behavior
• whitelist → only listed models are allowed
• blacklist → listed models are excluded
• If both are present → whitelist takes precedence
• Unknown keys → silently ignored (no warnings)

Plugin Caveat

Some providers/plugins expose their own options (e.g. discover: false), but:
• they are not part of OpenCode core schema
• they do not control model filtering globally

Do not rely on plugin flags for access control.

Rule

Always verify configuration keys against the official schema before using them:
https://opencode.ai/config.json

If behavior is unclear → assume the schema is the single source of truth.

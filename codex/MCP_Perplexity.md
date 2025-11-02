# Perplexity MCP Server

**Purpose**: AI-powered internet research and complex reasoning with citations

**Key Feature**: Access to real-time internet information and structured reasoning capabilities

---

## Overview

Perplexity MCP provides two distinct capabilities:
1. **Internet Search**: Access current information beyond Claude's knowledge cutoff
2. **Complex Reasoning**: Structured analysis for problems requiring deep thought

**When to Use**: External facts, verification, research, or complex multi-step reasoning

---

## Tools

### 1. perplexity_ask

**Description**: Engage in conversation using Perplexity to search internet and answer questions with citations.

**Type**: Conversational search with internet access

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `messages` | array | Yes | Array of message objects with `role` and `content` |

**Message Format:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Your question here"
    }
  ]
}
```

**Use Cases:**
- Fact verification with sources
- Current events and recent information
- Technical documentation research
- API/library version checking
- Best practices research

**Example 1: Fact Verification**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What is the latest stable version of React as of October 2025?"
    }
  ]
}
→ Returns current React version with official sources
```

**Example 2: Technical Research**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What are the recommended security practices for JWT token storage in 2025?"
    }
  ]
}
→ Returns current best practices with citations
```

**Best Practices:**
- **Be specific**: "React 19 breaking changes" > "React updates"
- **Request sources**: Ask for citations when verification critical
- **Current info**: Use for anything time-sensitive or recent
- **Fact-check**: Verify AI-generated code patterns against current docs

---

### 2. perplexity_reason

**Description**: Use Perplexity reasoning model for complex reasoning tasks requiring deep analysis.

**Type**: Structured reasoning without internet search

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | The query or problem to reason about |

**Use Cases:**
- Complex logic problems
- Multi-step reasoning
- Trade-off analysis
- Hypothesis evaluation
- Decision support

**Example 1: Architecture Decision**
```
perplexity_reason(
  query="Analyze trade-offs between microservices and monolith architecture for a team of 5 developers building a SaaS product"
)
→ Returns structured analysis of pros/cons
```

**Example 2: Performance Analysis**
```
perplexity_reason(
  query="Given: API response time 2s, database query 1.8s, network latency 50ms. What's the bottleneck and how to optimize?"
)
→ Returns reasoning chain identifying database as bottleneck
```

**Best Practices:**
- **Provide context**: Include relevant constraints, requirements
- **Be specific**: Detailed queries get better reasoning
- **Structured problems**: Works well for logic/analysis tasks
- **No internet needed**: Pure reasoning, no external facts

---

## Perplexity vs Other Tools

| Aspect | Perplexity | Sequential | Native Claude |
|--------|------------|------------|---------------|
| **Internet Access** | Yes (ask only) | No | No |
| **Use Case** | Facts, research | Complex analysis | General knowledge |
| **Citations** | Yes (ask) | No | No |
| **Speed** | Slower (API) | Moderate | Fastest |
| **Best For** | Current info, verification | Multi-component debugging | Simple queries |

**Decision Rule**: External facts → Perplexity | Internal reasoning → Sequential | Simple query → Native

---

## Perplexity vs Context7

| Aspect | Perplexity | Context7 |
|--------|------------|---------|
| **Source** | Open internet | Curated documentation |
| **Quality** | Variable | High (official docs) |
| **Coverage** | Broad | Specific frameworks |
| **Use Case** | General research | Official API/patterns |

**Decision Rule:**
- Use **Context7** for: official framework docs (React, Vue, etc.)
- Use **Perplexity** for: general research, non-framework topics

---

## Choose When

### Use perplexity_ask For:
- ✅ Verifying current versions, deprecations, breaking changes
- ✅ Researching best practices and patterns
- ✅ Checking security advisories
- ✅ Finding official documentation links
- ✅ Understanding recent technology changes
- ✅ Fact-checking generated code against current standards

### Use perplexity_reason For:
- ✅ Complex trade-off analysis
- ✅ Multi-factor decision support
- ✅ Logical problem-solving
- ✅ Hypothesis evaluation
- ✅ Performance bottleneck analysis

### Don't Use Perplexity For:
- ❌ Historical facts (use native Claude)
- ❌ Code generation (use native Claude)
- ❌ Simple explanations (use native Claude)
- ❌ Official framework docs (use Context7 if available)

---

## Combination Patterns

*See MCP_DecisionTree.md for detailed combination patterns with Sequential, Morphllm, and Serena*

---

## Best Practices

### Effective Prompting

**For perplexity_ask:**
- ✅ "What are the security implications of React Server Components in 2025?"
- ✅ "Compare Next.js 15 vs Remix performance benchmarks"
- ❌ "Tell me about React" (too broad)
- ❌ "Is React good?" (subjective, better for native)

**For perplexity_reason:**
- ✅ "Given constraints A, B, C, analyze trade-offs between solutions X and Y"
- ✅ "Reasoning chain: why does caching at layer L1 vs L2 affect latency?"
- ❌ "What should I do?" (too vague)
- ❌ "Current best practices" (use perplexity_ask instead)

### Citation Handling

When using `perplexity_ask`:
- Always check citations for credibility
- Prefer official documentation over blog posts
- Cross-reference critical information
- Note publication dates for time-sensitive info

### Token Economy

- `perplexity_ask`: Returns search results + answer (can be large)
- `perplexity_reason`: Returns reasoning chain (moderate size)
- Both add API call overhead - use judiciously
- Cache results mentally to avoid re-querying

---

## Triggers

Use Perplexity when:
- Need current information beyond training cutoff
- Verification of facts or versions required
- Researching best practices or security advisories
- Complex reasoning without internet (perplexity_reason)
- Decision analysis requiring structured thought

---

## Examples

### perplexity_ask Example
```json
{
  "messages": [{
    "role": "user",
    "content": "What are the breaking changes in TypeScript 5.6 compared to 5.5?"
  }]
}
→ Returns breaking changes with official TypeScript docs links
```

### perplexity_reason Example
```
perplexity_reason(
  query: "Analyze: Should we use event-driven architecture for order processing with 1000 orders/day, 3 developers, 6-month timeline?"
)
→ Returns structured reasoning considering all constraints
```

---

## When NOT to Use

| Scenario | Use Instead | Reason |
|----------|-------------|--------|
| Code generation | Native Claude | Faster, no API overhead |
| Historical facts | Native Claude | Within knowledge cutoff |
| Official framework docs | Context7 | Curated documentation |
| Simple explanations | Native Claude | Overkill for basic queries |
| Internal codebase questions | Serena | Project-specific context |

---

## Key Insights

- **Two distinct tools**: `perplexity_ask` (search) vs `perplexity_reason` (reasoning)
- **Internet access**: Only `perplexity_ask` searches web
- **Citations matter**: Verify sources, prefer official docs
- **Complements Sequential**: Research + analysis workflow
- **Time-sensitive**: Best for current info, recent changes
- **Token overhead**: Use judiciously, cache results
- **Verification tool**: Excellent for fact-checking AI output

---

*Integration patterns and decision flows documented in MCP_DecisionTree.md*

# MCP Decision Tree

**Systematic decision-making framework for MCP server and tool selection through GO MCP Proxy**

---

## MCPProxy Architecture

**Purpose**: Token-efficient tool discovery across multiple MCP servers using BM25 search algorithm

### How It Works

1. **Unified Access**: All MCP servers accessed through single proxy endpoint (http://localhost:8080/mcp/)
2. **BM25 Search**: Natural language query → top-5 most relevant tools across ALL servers
3. **Token Optimization**: ~99% reduction in token usage vs loading all tools upfront
4. **Automatic Discovery**: Claude Code automatically calls `retrieve_tools("what you need")`

### Active Servers

Through MCPProxy you have access to:
- **morphllm-fast-apply** - Pattern-based code editing
- **sequential-thinking** - Multi-step reasoning engine
- **serena** - Semantic code understanding & project memory
- **perplexity-mcp** - AI-powered research & reasoning
- **gitlab** - GitLab integration (MR operations)
- **atlassian** - Jira/Confluence integration
- **sqvr-graphql** - GraphQL API access

**No manual tool selection needed** - MCPProxy automatically finds the right tools based on task description.

---

## Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│                    TASK ANALYSIS START                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │  Flag specified?          │
        │  (--think, --seq, etc)    │
        └─┬──────────────────────┬──┘
     YES  │                      │ NO
  ┌───────▼─────────┐           │
  │  Use flag logic │           │
  │  (see FLAGS.md) │           │
  └─────────────────┘           │
                      ┌──────────▼───────────┐
                      │  Scope Analysis      │
                      └──────┬───────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼─────┐      ┌──────▼───────┐    ┌─────▼──────┐
    │Multi-file│      │Complex 3+    │    │Integration │
    │edits?    │      │components?   │    │needed?     │
    └────┬─────┘      └──────┬───────┘    └─────┬──────┘
         │                   │                   │
    ┌────▼─────────┐    ┌────▼──────────┐  ┌────▼────────────┐
    │Pattern-based?│    │External info? │  │Code review/     │
    │(style, bulk)?│    │needed?        │  │Issue tracking?  │
    └────┬──────┬──┘    └───┬────┬─────┘  └────┬────────────┘
    YES  │      │ NO    YES │    │ NO      YES  │
         │      │           │    │              │
    ┌────▼──┐ ┌▼──────┐ ┌──▼──┐ │         ┌────▼────┐
    │Morphllm│Serena  │ │Perp-││         │GitLab/  │
    │       │ │(symbol││ │lexity│         │Atlassian│
    │+validate│ops)  ││ │     ││         │SQVR     │
    └───────┘ └──────┘│ └─────┘│         └─────────┘
                      │        │
                 ┌────▼────┐ ┌▼────────┐
                 │Sequential│Native    │
                 │         ││Claude    │
                 └─────────┘│          │
                            └──────────┘
```

### Decision Rules

**1. Check for explicit flags first** → See FLAGS.md
   - `--think` / `--think-hard` / `--think-deep` → Sequential + combinations
   - `--seq` → Sequential explicitly
   - `--morph` → Morphllm explicitly
   - `--serena` → Serena explicitly

**2. Analyze task scope**
   - Multi-file pattern edits → **Morphllm** (with validation!)
   - Symbol operations (rename, refactor) → **Serena**
   - Complex analysis (3+ components) → **Sequential**
   - External facts needed → **Perplexity**
   - Code review / Issues → **GitLab / Atlassian**
   - API queries → **SQVR GraphQL** (granular!)

**3. Default to Native Claude** for simple, single-scope tasks

---

## Priority Matrix

### When to Choose MCP over Native

| Scenario | Use MCP | Reason |
|----------|---------|--------|
| Multi-file edits with patterns | Morphllm | 10.5K tokens/sec, 98% accuracy |
| Symbol rename across codebase | Serena | LSP-based, semantic understanding |
| Complex debugging (3+ layers) | Sequential | Structured, auditable reasoning |
| Fact verification | Perplexity | Internet access, citations |
| Simple explanation | Native Claude | Faster, no setup overhead |
| Single-file typo fix | Native Claude | Overkill for MCP |

### MCP Server Priority

**For pattern-based code edits:**
1. Serena (if symbol operations needed)
2. Morphllm (if bulk pattern transformations)
3. Native Edit tool (if single simple change)

**For analysis tasks:**
1. Sequential (if 3+ interconnected components)
2. Perplexity (if external facts needed)
3. Native Claude (if straightforward single-component)

**For code understanding:**
1. Serena (if need LSP-level semantic understanding)
2. Native Grep/Read (if simple text search sufficient)

---

## Combination Patterns

### Serial Chains (Execute in order)

**Pattern 1: Semantic Analysis → Precise Edit**
```
Serena (find_symbol, find_referencing_symbols)
  ↓ (identify all locations)
Morphllm (edit_file with pattern)
  ↓ (apply bulk changes)
Manual Validation (verify results)
```

**Pattern 2: Research → Structured Analysis**
```
Perplexity (perplexity_ask for facts)
  ↓ (gather external information)
Sequential (sequentialthinking for analysis)
  ↓ (structured reasoning)
Decision Output
```

**Pattern 3: Symbol Search → Memory → Edit**
```
Serena (find_symbol to locate)
  ↓ (find targets)
Serena (write_memory to record intent)
  ↓ (save context)
Morphllm OR Serena (apply changes)
  ↓ (execute modifications)
Validation
```

### Parallel Operations (Execute simultaneously)

When tasks are independent:
- Read multiple files in parallel
- Query multiple Serena tools for different symbols
- Fetch GitLab MR + Jira issue simultaneously

**Rule**: Parallelize when no data dependencies exist

---

## Flag Integration

See **FLAGS.md** for complete flag documentation. Quick reference:

### Analysis Depth Flags
- `--think` → Standard analysis (~4K tokens), enables Sequential
- `--think-hard` → Deep analysis (~10K tokens), Sequential + Context7
- `--think-deep` → Maximum depth (~32K tokens), all MCP servers

### MCP Server Flags
- `--seq` / `--sequential` → Enable Sequential explicitly
- `--morph` / `--morphllm` → Enable Morphllm explicitly
- `--serena` → Enable Serena explicitly
- `--all-mcp` → Enable all MCP servers
- `--no-mcp` → Disable all MCP, use native tools only

**Flag Priority**: `--no-mcp` overrides all | Depth: `--think-deep` > `--think-hard` > `--think`

---

## Quick Reference Table

| Task Type | Primary Tool | Secondary | Validation |
|-----------|-------------|-----------|------------|
| Bulk pattern edits (<10 files) | Morphllm | Serena (for symbol ops) | Always manual |
| Symbol rename/refactor | Serena | Morphllm (for bulk apply) | LSP verification |
| Complex debugging (3+ components) | Sequential | Perplexity (for facts) | Hypothesis testing |
| Architectural analysis | Sequential | Serena (for code context) | Review reasoning |
| Find all symbol references | Serena | Native Grep (fallback) | Compare results |
| Project memory management | Serena | - | Auto-triggers |
| Fact verification | Perplexity | WebSearch (fallback) | Citation check |
| GitLab MR operations | GitLab MCP | - | Manual review |
| Jira issue tracking | Atlassian | - | Minimal queries |
| GraphQL API queries | SQVR GraphQL | - | Granular, atomic |
| Simple code explanation | Native Claude | - | None needed |
| Single-file simple edit | Native Edit | - | Quick check |

---

## Critical Validation Rules

### Morphllm
- ⚠️ **ALWAYS validate manually** - 98% accuracy ≠ 100%
- Use `dryRun: true` for preview
- Review all changes before committing
- Watch for: incorrect context preservation, missed edge cases

### SQVR GraphQL
- ⚠️ **Always granular, atomic queries** - huge schema
- Never introspect entire schema
- Use filters, pagination, field selection
- Token limits hit easily - be surgical

### Serena Project Memory
- AI decides when to write automatically
- Triggers: after edits, after analysis, on errors, after onboarding
- Don't write trivial operations
- Balance thoroughness vs storage

### Sequential Thinking
- Explicit invocation required ("use sequential thinking tool")
- Dynamic thought adjustment allowed
- Branch when exploring alternatives
- Revision encouraged as understanding deepens

---

## MCPProxy Best Practices

1. **Trust BM25 Search**: Let MCPProxy find tools automatically via natural language
2. **Specify Intent Clearly**: Better descriptions = better tool matching
3. **Combine Strategically**: Use serial chains for complex workflows
4. **Validate Critical Paths**: Especially Morphllm edits and GraphQL results
5. **Minimize Redundancy**: MCPProxy already filters - don't over-constrain
6. **Monitor Token Usage**: GraphQL and large schemas can hit limits quickly
7. **Leverage Project Memory**: Serena's memory improves over time - use it

---

## Integration with SuperClaude Framework

This MCP Decision Tree integrates with:
- **FLAGS.md** - Behavioral flags and triggers
- **RULES.md** - Tool Optimization section
- **PRINCIPLES.md** - Evidence-based reasoning, efficiency
- **MCP_Morphllm.md** - Detailed Morphllm documentation
- **MCP_Sequential.md** - Sequential Thinking details
- **MCP_Serena.md** - Serena LSP-server capabilities
- **MCP_Integrations.md** - GitLab, Atlassian, SQVR GraphQL
- **MCP_Perplexity.md** - Perplexity tools and usage

**Decision Flow**: Flags (FLAGS.md) → Decision Tree (this file) → Tool Details (MCP_*.md) → Execution (RULES.md)

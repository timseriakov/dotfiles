# Codex Agent Instructions

# MCP Documentation

## MCP Server Access via MCPProxy

**IMPORTANT**: All MCP servers are accessed through MCPProxy (http://localhost:8080/mcp/) for token optimization and intelligent tool discovery.

**How it works:**

- MCPProxy exposes a single `retrieve_tools` function to Claude Code CLI
- When you need a tool, Claude automatically calls `retrieve_tools("what you need")`
- MCPProxy uses BM25 search to find the top-5 most relevant tools across all servers
- This reduces token usage by ~99% compared to loading all tools upfront

**Available servers through MCPProxy:**

- morphllm-fast-apply (pattern-based bulk edits)
- sequential-thinking (complex multi-step reasoning)
- serena (semantic code understanding, project memory)
- perplexity-mcp (AI-powered web search and reasoning)
- sqvr-graphql (GraphQL API integration)
- gitlab (GitLab integration)
- atlassian (Jira/Confluence integration)

**Usage:** Simply request tools by natural language - MCPProxy will automatically find and provide the right tools. No manual tool selection needed.

# MCP Decision Tree

**Systematic decision-making framework for MCP server and tool selection through GO MCP Proxy**

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

| Scenario                       | Use MCP       | Reason                            |
| ------------------------------ | ------------- | --------------------------------- |
| Multi-file edits with patterns | Morphllm      | 10.5K tokens/sec, 98% accuracy    |
| Symbol rename across codebase  | Serena        | LSP-based, semantic understanding |
| Complex debugging (3+ layers)  | Sequential    | Structured, auditable reasoning   |
| Fact verification              | Perplexity    | Internet access, citations        |
| Simple explanation             | Native Claude | Faster, no setup overhead         |
| Single-file typo fix           | Native Claude | Overkill for MCP                  |

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

## Quick Reference Table

| Task Type                         | Primary Tool  | Secondary                 | Validation         |
| --------------------------------- | ------------- | ------------------------- | ------------------ |
| Bulk pattern edits (<10 files)    | Morphllm      | Serena (for symbol ops)   | Always manual      |
| Symbol rename/refactor            | Serena        | Morphllm (for bulk apply) | LSP verification   |
| Complex debugging (3+ components) | Sequential    | Perplexity (for facts)    | Hypothesis testing |
| Architectural analysis            | Sequential    | Serena (for code context) | Review reasoning   |
| Find all symbol references        | Serena        | Native Grep (fallback)    | Compare results    |
| Project memory management         | Serena        | -                         | Auto-triggers      |
| Fact verification                 | Perplexity    | WebSearch (fallback)      | Citation check     |
| GitLab MR operations              | GitLab MCP    | -                         | Manual review      |
| Jira issue tracking               | Atlassian     | -                         | Minimal queries    |
| GraphQL API queries               | SQVR GraphQL  | -                         | Granular, atomic   |
| Simple code explanation           | Native Claude | -                         | None needed        |
| Single-file simple edit           | Native Edit   | -                         | Quick check        |

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

# Flags

Behavioral flags for Claude Code to enable specific execution modes and tool selection patterns.

## MCP Server Flags

**--seq / --sequential**

- Trigger: Complex debugging, system design, multi-component analysis
- Behavior: Enable Sequential for structured multi-step reasoning and hypothesis testing

**--morph / --morphllm**

- Trigger: Bulk code transformations, pattern-based edits, style enforcement
- Behavior: Enable Morphllm for efficient multi-file pattern application

**--serena**

- Trigger: Symbol operations, project memory needs, large codebase navigation
- Behavior: Enable Serena for semantic understanding and session persistence

## Analysis Depth Flags

**--think**

- Trigger: Multi-component analysis needs, moderate complexity
- Behavior: Standard structured analysis (~4K tokens), enables Sequential

**--think-hard**

- Trigger: Architectural analysis, system-wide dependencies
- Behavior: Deep analysis (~10K tokens), enables Sequential + Context7

**--think-deep**

- Trigger: Critical system redesign, legacy modernization, complex debugging
- Behavior: Maximum depth analysis (~32K tokens), enables all MCP servers

## Flag Priority Rules

**Depth Hierarchy**: --think-deep > --think-hard > --think

# Software Engineering Principles

**Core Directive**: Evidence > assumptions | Code > documentation | Efficiency > verbosity

## Philosophy

- **Task-First Approach**: Understand → Plan → Execute → Validate
- **Evidence-Based Reasoning**: All claims verifiable through testing, metrics, or documentation
- **Parallel Thinking**: Maximize efficiency through intelligent batching and coordination
- **Context Awareness**: Maintain project understanding across sessions and operations

## Engineering Mindset

### SOLID

- **Single Responsibility**: Each component has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes substitutable for base classes
- **Interface Segregation**: Don't depend on unused interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

### Core Patterns

- **DRY**: Abstract common functionality, eliminate duplication
- **KISS**: Prefer simplicity over complexity in design decisions
- **YAGNI**: Implement current requirements only, avoid speculation

### Systems Thinking

- **Ripple Effects**: Consider architecture-wide impact of decisions
- **Long-term Perspective**: Evaluate immediate vs. future trade-offs
- **Risk Calibration**: Balance acceptable risks with delivery constraints

## Decision Framework

### Data-Driven Choices

- **Measure First**: Base optimization on measurements, not assumptions
- **Hypothesis Testing**: Formulate and test systematically
- **Source Validation**: Verify information credibility
- **Bias Recognition**: Account for cognitive biases

### Trade-off Analysis

- **Temporal Impact**: Immediate vs. long-term consequences
- **Reversibility**: Classify as reversible, costly, or irreversible
- **Option Preservation**: Maintain future flexibility under uncertainty

### Risk Management

- **Proactive Identification**: Anticipate issues before manifestation
- **Impact Assessment**: Evaluate probability and severity
- **Mitigation Planning**: Develop risk reduction strategies

## Quality Philosophy

### Quality Quadrants

- **Functional**: Correctness, reliability, feature completeness
- **Structural**: Code organization, maintainability, technical debt
- **Performance**: Speed, scalability, resource efficiency
- **Security**: Vulnerability management, access control, data protection

### Quality Standards

- **Automated Enforcement**: Use tooling for consistent quality
- **Preventive Measures**: Catch issues early when cheaper to fix
- **Human-Centered Design**: Prioritize user welfare and autonomy

---

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
- `--no-mcp` → Disable all MCP, use native tools only

**Flag Priority**: `--no-mcp` overrides all | Depth: `--think-deep` > `--think-hard` > `--think`

---

# Morphllm MCP Server

**Purpose**: Pattern-based code editing engine with token optimization for bulk transformations

**Performance**: 10,500+ tokens/second | 98% accuracy | Trained on 1M+ code edits

---

## ⚠️ CRITICAL: Mandatory Validation

**Morphllm is NOT 100% accurate** - always validate changes manually:

- ✅ **USE**: `dryRun: true` for preview before applying
- ✅ **REVIEW**: All changes before committing to git
- ✅ **VERIFY**: Context preservation, edge cases, formatting
- ⚠️ **WATCH FOR**: Incorrect context, missed edge cases, scope errors

**98% accuracy means 2 errors per 100 operations** - treat all Morphllm outputs as drafts requiring human verification.

---

## Primary Tool: edit_file

**Description**: Intelligently merge AI-generated code changes into real source files using Morph's Fast Apply engine with semantic understanding and context-aware merging.

### Parameters

| Parameter     | Type    | Required | Description                                                                 |
| ------------- | ------- | -------- | --------------------------------------------------------------------------- |
| `path`        | string  | Yes      | Absolute path to file to edit                                               |
| `code_edit`   | string  | Yes      | Code changes with `// ... existing code ...` markers for unchanged sections |
| `instruction` | string  | Yes      | Single-sentence description of what this edit accomplishes                  |
| `dryRun`      | boolean | No       | Preview changes without applying (default: false)                           |

### How code_edit Works

The `code_edit` parameter uses special markers to indicate unchanged code:

```javascript
// Example: Adding error handling
function loginUser(username, password) {
  // ... existing code ...

  try {
    const user = await authenticate(username, password);
    // ... existing code ...
  } catch (error) {
    logError(error);
    throw new AuthenticationError('Login failed');
  }

  // ... existing code ...
}
```

**Pattern Rules**:

- Use `// ... existing code ...` (or language-appropriate comments) for unchanged sections
- Include only lines that need to change
- Morphllm intelligently merges changes into actual file content
- Handles variable renames, reordered blocks, formatting changes automatically

### Advanced Capabilities

- **Context-Aware**: Semantic matching via AST analysis, preserves formatting/comments
- **Adaptive**: Handles variable renames, reordered blocks, formatting shifts automatically
- **Speculative Decoding**: Parallel processing achieves 10,500+ tokens/second throughput

---

## Triggers

Use Morphllm when you need:

- Multi-file edit operations with consistent patterns
- Framework updates, style guide enforcement, code cleanup
- Bulk text replacements across multiple files
- Natural language edit instructions with specific scope
- Token optimization (efficiency gains 30-50%)

---

## Choose When

### Use Morphllm For:

- **Pattern-based edits**: Consistent transformations across multiple files
- **Bulk operations**: Style enforcement, framework updates, text replacements
- **Token efficiency**: Fast Apply scenarios with compression needs
- **Simple to moderate complexity**: <10 files, straightforward transformations

### Don't Use Morphllm For:

- **Symbol operations**: Use Serena for rename/refactor with dependency tracking
- **LSP integration needs**: Use Serena for semantic understanding
- **Single simple changes**: Native Edit tool is faster
- **100% accuracy requirements**: Morphllm needs validation

---

## Works Best With

### Serial Combination Patterns

**Pattern 1: Semantic Analysis → Morphllm Edit**

```
1. Serena.find_symbol(target)
   → Locate all instances semantically
2. Morphllm.edit_file(pattern_changes)
   → Apply bulk pattern transformations
3. Manual validation
   → Verify all changes correct
```

**Pattern 2: Sequential Planning → Morphllm Execution**

```
1. Sequential.sequentialthinking(edit_strategy)
   → Plan systematic changes
2. Morphllm.edit_file(each_file)
   → Execute planned edits
3. Review and commit
   → Validate complete workflow
```

---

## Examples

### Example 1: Add Error Handling

```javascript
// Instruction: "Add try-catch error handling to API calls"
// code_edit:
try {
  const response = await fetch(apiUrl);
  // ... existing code ...
} catch (error) {
  logError("API call failed", error);
  throw new NetworkError(error.message);
}
```

### Example 2: Framework Migration

```javascript
// Instruction: "Convert React class component to hooks"
// code_edit:
const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ... existing code ...
  }, [userId]);

  return (
    // ... existing code ...
  );
};
```

---

## When NOT to Use Morphllm

| Scenario                   | Use Instead       | Reason                              |
| -------------------------- | ----------------- | ----------------------------------- |
| Rename function everywhere | Serena            | Symbol operations need LSP tracking |
| Single typo fix            | Native Edit       | Overkill for simple change          |
| Complex refactoring        | Serena + Morphllm | Need semantic understanding first   |
| Mission-critical code      | Manual edit       | 98% accuracy insufficient           |

---

## Validation Checklist

After every Morphllm edit:

- [ ] Preview with `dryRun: true` first
- [ ] Review all modified lines for correctness
- [ ] Check context preservation (imports, dependencies)
- [ ] Verify edge cases handled properly
- [ ] Test modified code (run tests/linters)
- [ ] Validate formatting and style consistency
- [ ] Git diff review before committing

**Remember**: Morphllm is a powerful assistant, not a replacement for human judgment.

# Sequential MCP Server

**Purpose**: Multi-step reasoning engine for complex analysis and systematic problem solving

**Type**: Deterministic state-tracking and formatting utility for structured AI reasoning (by Anthropic)

**Key Feature**: Transparent, auditable reasoning with explicit thought tracking vs opaque native LLM inference

---

## Triggers

See **FLAGS.md** for complete flag documentation:

- `--think` → Standard structured analysis (~4K tokens), enables Sequential
- `--think-hard` → Deep analysis (~10K tokens), enables Sequential + Context7
- `--think-deep` → Maximum depth (~32K tokens), enables all MCP servers
- `--seq` / `--sequential` → Explicitly enable Sequential for structured reasoning

**Manual Triggers** (without flags):

- Complex debugging scenarios with multiple layers
- Architectural analysis and system design questions
- Problems requiring hypothesis testing and validation
- Multi-component failure investigation (3+ interconnected components)
- Performance bottleneck identification requiring methodical approach

---

## Primary Tool: sequentialthinking

**Description**: Provides structured, auditable framework for breaking down complex problems into sequential, manageable steps while maintaining complete history of the thinking process.

### Core Parameters

| Parameter           | Type    | Required | Description                                                                           |
| ------------------- | ------- | -------- | ------------------------------------------------------------------------------------- |
| `thought`           | string  | Yes      | Current thinking step content (analysis, revision, question, realization, hypothesis) |
| `thoughtNumber`     | integer | Yes      | Position in sequence (can exceed initial `totalThoughts`)                             |
| `totalThoughts`     | integer | Yes      | Estimated total thoughts needed (dynamically adjustable)                              |
| `nextThoughtNeeded` | boolean | Yes      | Whether additional reasoning steps required                                           |

### Advanced Parameters (Optional)

| Parameter           | Type    | Description                                                              |
| ------------------- | ------- | ------------------------------------------------------------------------ |
| `isRevision`        | boolean | Mark this thought as revising previous thinking                          |
| `revisesThought`    | integer | Which thought number is being reconsidered (requires `isRevision: true`) |
| `branchFromThought` | integer | Branching point thought number for alternative reasoning paths           |
| `branchId`          | string  | Identifier for current branch (if exploring alternatives)                |
| `needsMoreThoughts` | boolean | Realized more thoughts needed even at apparent "end"                     |

---

## Capabilities

- **Iterative Refinement**: Revise thoughts using `isRevision` and `revisesThought` parameters
- **Alternative Paths**: Branch with `branchFromThought` and track via `branchId` identifiers
- **Dynamic Adjustment**: Modify `totalThoughts` or set `needsMoreThoughts: true` as scope changes
- **Hypothesis Testing**: Generate and validate solution hypotheses throughout reasoning
- **Complete Auditability**: In-memory storage with pretty-printed output for inspection

---

## Sequential vs Native LLM Reasoning

| Aspect                  | Native LLM Reasoning                             | Sequential Thinking MCP Server                          |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| **Transparency**        | Opaque; reasoning hidden in model's forward pass | Fully auditable with explicit thought tracking          |
| **Structure**           | Implicit and unstructured                        | Explicitly structured with discrete steps and metadata  |
| **Debuggability**       | Difficult to inspect or audit                    | Easy to inspect, debug, enhance trust                   |
| **Flexibility**         | Fixed during model inference                     | Dynamic adjustment, branching, revisions allowed        |
| **Use Case**            | General-purpose reasoning                        | Complex problems requiring decomposition & traceability |
| **Prompt Engineering**  | Requires careful crafting                        | Reduces guesswork through structured framework          |
| **Context Maintenance** | Limited across long sequences                    | Maintains context over numerous steps                   |
| **Revision**            | Cannot revise earlier reasoning                  | Can mark and revise previous thoughts                   |

---

## Choose When

### Use Sequential For:

- **Over native reasoning**: When problems have 3+ interconnected components
- **Systematic analysis**: Root cause analysis, architecture review, security assessment
- **Structure matters**: Problems benefit from decomposition and evidence gathering
- **Cross-domain issues**: Problems spanning frontend, backend, database, infrastructure
- **Auditing and trust**: Need to inspect and verify how AI reached conclusions
- **Planning with revision**: Design tasks where full scope isn't clear initially
- **Multi-step tasks**: Maintaining context over numerous steps is critical
- **Agentic workflows**: Self-directed, goal-oriented AI behavior

### Don't Use Sequential For:

- **Simple tasks**: Basic explanations, single-file changes, straightforward fixes
- **Real-time needs**: Latency-critical applications (extra overhead)
- **General knowledge**: Simple facts or synthesis (native is faster)
- **Quick queries**: When transparency isn't a concern

---

## Best Practices

### Explicit Tool Invocation

**Required**: You must explicitly instruct to use Sequential Thinking tool:

```
"Use the sequential thinking tool to analyze this authentication bug"
"Break down this performance issue using sequential thinking"
"Apply --think-hard to design the microservices architecture"
```

Capitalization and exact wording are flexible, but explicit mention is required.

### Effective Prompting Patterns

**Initial Scoping**:

- Begin with clear problem statement
- Let sequential process determine steps needed
- Don't over-constrain initial `totalThoughts` estimate

**Revision Encouragement**:

- Structure prompts to allow revision of earlier thoughts
- Example: "Reconsider step 3 based on this new information"

**Alternative Exploration**:

- Explicitly ask to branch and explore alternatives
- Example: "Create a branch to explore alternative database design"

**Hypothesis Validation**:

- Generate potential solutions during reasoning
- Validate through structured subsequent thoughts
- Example: "Hypothesis: caching improves performance. Validate this."

### Workflow Integration

**Complementary, Not Replacement**:

- Sequential serves as integration layer, not orchestrator replacement
- Works with LangChain, LlamaIndex, crewAI, etc.
- Agent framework determines strategy; LLM + Sequential provide transparent reasoning

**Monitoring and Debugging**:

- Leverage in-memory storage for analysis
- Use pretty-printed output for inspection
- Verify reasoning follows expected patterns
- Identify gaps or logical leaps

---

## Works Best With

### Combination Patterns

**Sequential + Context7** (enabled by `--think-hard`):

```
Sequential coordinates analysis
  ↓
Context7 provides official documentation patterns
  ↓
Sequential integrates knowledge into structured reasoning
```

**Sequential + Perplexity**:

```
Perplexity gathers external facts
  ↓
Sequential performs structured analysis on facts
  ↓
Validated conclusion with citations
```

**Sequential + Serena**:

```
Serena provides project/code context
  ↓
Sequential performs architectural analysis
  ↓
Structured design decisions with code awareness
```

---

## Examples

### Example 1: Complex Debugging

```
Task: "Why is this API endpoint slow?"

Sequential reasoning:
1. Hypothesis: Database query inefficiency
2. Evidence gathering: Check query patterns
3. Branch A: Index missing → calculate impact
4. Branch B: N+1 query problem → validate
5. Compare branches, select most likely cause
6. Propose solution with verification steps
```

### Example 2: System Design

```
Task: "Design scalable user authentication system"

Sequential reasoning:
1. Requirements analysis: traffic, security needs
2. Architecture options: JWT vs sessions vs OAuth
3. Trade-off analysis for each option
4. Revision of thought 2: add SSO consideration
5. Security threat modeling
6. Final recommendation with rationale
```

---

## When NOT to Use Sequential

| Scenario                | Use Instead                 | Reason                                 |
| ----------------------- | --------------------------- | -------------------------------------- |
| Explain a function      | Native Claude               | Simple explanation, structure overkill |
| Fix typo                | Native Claude               | Straightforward change                 |
| Quick fact lookup       | Native Claude or Perplexity | Faster without structure overhead      |
| Real-time chatbot       | Native Claude               | Latency concerns                       |
| General knowledge query | Native Claude               | No analysis decomposition needed       |

---

## Key Insights

- **Sequential does NOT think** - it provides workspace for AI to think deliberately
- **Transparency is the goal** - make AI reasoning auditable and trustworthy
- **Dynamic by design** - adjust, branch, revise as understanding deepens
- **Complements native reasoning** - use for complex problems, not simple queries
- **Explicit invocation required** - must ask for sequential thinking tool by name

# Serena MCP Server

**Purpose**: Semantic code understanding with project memory and session persistence

**Type**: Open-source toolkit enabling LLMs to function as intelligent coding agents with IDE-like capabilities

**Key Feature**: LSP (Language Server Protocol) integration for semantic-level code analysis, navigation, and editing

---

## Overview

Serena transforms AI code interaction by providing **context-rich, symbol-aware** code navigation and editing through deep integration with Language Server Protocol. Think of it as giving AI access to an IDE's understanding of code structure, not just text.

### LSP Integration

**What LSP Provides:**

- "Go to Definition", "Find All References", "Autocomplete" capabilities
- Language-agnostic symbol parsing, navigation, modification
- Support for: Python, JavaScript/TypeScript, Java, C/C++, Rust, Go, and more
- Proven, mature capabilities from editor ecosystems (VSCode, IntelliJ)

**Benefits:**

- No manual file parsing needed
- Semantic understanding, not brittle text matching
- Consistent interface across multiple languages
- IDE-quality features available to AI agents

---

## Symbol Operations (4 Tools)

**Purpose**: Precise, reliable code manipulations at the semantic level

### 1. find_symbol

**Description**: Locate symbols (functions, classes, methods, variables) by name using semantic understanding, not text search.

**Parameters:**

| Parameter            | Type    | Required | Description                                                                   |
| -------------------- | ------- | -------- | ----------------------------------------------------------------------------- |
| `name_path`          | string  | Yes      | Symbol name or path pattern (e.g., "method", "class/method", "/class/method") |
| `relative_path`      | string  | No       | Restrict search to specific file or directory                                 |
| `depth`              | integer | No       | Depth to retrieve descendants (e.g., 1 for class methods)                     |
| `include_kinds`      | int[]   | No       | LSP symbol kinds to include (5=class, 6=method, 12=function, etc.)            |
| `exclude_kinds`      | int[]   | No       | LSP symbol kinds to exclude (takes precedence over include)                   |
| `substring_matching` | boolean | No       | Use substring matching for last segment of name                               |
| `include_body`       | boolean | No       | Include symbol's source code (use judiciously for token economy)              |

**LSP Symbol Kinds Reference:**

- 1=file, 2=module, 3=namespace, 4=package, 5=class, 6=method, 7=property, 8=field
- 9=constructor, 10=enum, 11=interface, 12=function, 13=variable, 14=constant
- 15=string, 16=number, 17=boolean, 18=array, 19=object, 20=key, 21=null
- 22=enum member, 23=struct, 24=event, 25=operator, 26=type parameter

**Use Cases:**

- Find function definition, locate class methods, discover variables, semantic search

**Choose Smartly**: Use `include_kinds`, `relative_path` to scope, avoid `include_body` unless necessary.

---

### 2. find_referencing_symbols

**Description**: Find all references to a symbol across the codebase (like IDE's "Find All References").

**Parameters:**

| Parameter          | Type    | Required | Description                                              |
| ------------------ | ------- | -------- | -------------------------------------------------------- |
| `name_path`        | string  | Yes      | Symbol name path to find references for                  |
| `relative_path`    | string  | Yes      | File containing the symbol (must be file, not directory) |
| `include_kinds`    | int[]   | No       | Filter referencing symbols by kind                       |
| `exclude_kinds`    | int[]   | No       | Exclude specific symbol kinds                            |
| `max_answer_chars` | integer | No       | Limit output size (-1 for default)                       |

**Use Cases:**

- Impact analysis before refactoring
- Understand symbol usage patterns
- Identify all callers of a function
- Dependency tracking for safe modifications

**Choose Smartly**: Always run before renaming/refactoring to understand impact scope.

---

### 3. replace_symbol_body

**Description**: Replace the implementation (body) of a symbol without altering its signature, targeting exact semantic region.

**Parameters:**

| Parameter       | Type   | Required | Description                 |
| --------------- | ------ | -------- | --------------------------- |
| `name_path`     | string | Yes      | Symbol name path to replace |
| `relative_path` | string | Yes      | File containing the symbol  |
| `body`          | string | Yes      | New implementation body     |

**Use Cases:**

- Update function logic without breaking signature
- Refactor method implementation
- Fix bugs in specific function
- Optimize algorithm while preserving interface

**Choose Smartly**: Use for implementation changes; for bulk pattern edits across files, use Morphllm instead.

---

### 4. insert_after_symbol

**Description**: Insert new code directly after a symbol definition, enabling safe addition of related code.

**Parameters:**

| Parameter       | Type   | Required | Description                  |
| --------------- | ------ | -------- | ---------------------------- |
| `name_path`     | string | Yes      | Symbol after which to insert |
| `relative_path` | string | Yes      | File containing the symbol   |
| `body`          | string | Yes      | Code to insert after symbol  |

**Use Cases:**

- Add helper function near related code
- Insert logging/instrumentation
- Add test utilities near implementation
- Inject middleware or decorators

**Choose Smartly**: Use for adding related functionality; minimal risk of disrupting other structures.

---

## Project Memory (3 Tools)

**Purpose**: Persistent storage of context, decisions, and analysis results across sessions

### Memory Management Philosophy

**AI decides AUTOMATICALLY when to write** - no manual trigger needed.

**Automatic Triggers for write_memory:**

✅ **After Code Modifications**

- What was changed and why
- Intent behind modification
- Related files/symbols affected

✅ **After Significant Analyses**

- Dependency analysis results
- Reference search outcomes
- Impact assessment findings
- Architectural insights

✅ **After Onboarding/Configuration**

- Initial project context
- Technology stack discovered
- Key patterns identified
- Project structure understanding

✅ **On Errors/Warnings**

- Problems encountered
- Solutions attempted
- Workarounds applied
- Tracking for future reference

❌ **DON'T Write For:**

- Every trivial operation (balance thoroughness vs storage)
- Temporary scratch work
- Duplicate information
- Information easily re-derived

### 5. write_memory

**Description**: Persist structured memory record for future context, building "episodic" AI memory.

**Parameters:**

| Parameter          | Type    | Required | Description                                  |
| ------------------ | ------- | -------- | -------------------------------------------- |
| `memory_name`      | string  | Yes      | Meaningful memory identifier                 |
| `content`          | string  | Yes      | UTF-8 encoded information in markdown format |
| `max_answer_chars` | integer | No       | Limit output size (-1 for default)           |

**Use Cases:**

- Record refactoring decisions
- Save analysis outcomes
- Document patterns discovered
- Track action history

**Choose Smartly**: Use descriptive names, markdown format, write after significant work only.

---

### 6. read_memory

**Description**: Retrieve stored memory to supply context for current task.

**Parameters:**

| Parameter          | Type    | Required | Description                        |
| ------------------ | ------- | -------- | ---------------------------------- |
| `memory_file_name` | string  | Yes      | Memory identifier to retrieve      |
| `max_answer_chars` | integer | No       | Limit output size (-1 for default) |

**Use Cases:**

- Recall previous decisions
- Load project context
- Retrieve analysis results
- Understand historical changes

**Choose Smartly**: Only read when relevant to current task; avoid reading same memory multiple times in one session.

---

### 7. list_memories

**Description**: Enumerate all available memories for project history overview.

**Parameters:** None

**Use Cases:**

- Browse project history
- Discover previous agent actions
- Audit memory usage
- Find relevant context

**Choose Smartly**: Use to discover what context exists before reading specific memories.

---

## Code Navigation (4 Tools)

**Purpose**: Deep, semantic codebase exploration beyond file-based search

### 8. get_symbols_overview

**Description**: High-level map of key symbols in file/project (like IDE symbol browser/outline).

**Parameters:**

| Parameter          | Type    | Required | Description                        |
| ------------------ | ------- | -------- | ---------------------------------- |
| `relative_path`    | string  | Yes      | File to get overview of            |
| `max_answer_chars` | integer | No       | Limit output size (-1 for default) |

**Use Cases:**

- First look at new file
- Understand file structure quickly
- Identify key components
- Navigate large files efficiently

**Choose Smartly**: Call FIRST when exploring new files before detailed analysis.

---

### 9. search_for_pattern

**Description**: Find instances of semantic or syntactic pattern with regex support (DOTALL mode).

**Parameters:**

| Parameter                       | Type    | Required | Description                                                       |
| ------------------------------- | ------- | -------- | ----------------------------------------------------------------- |
| `substring_pattern`             | string  | Yes      | Regular expression pattern to search                              |
| `relative_path`                 | string  | No       | Restrict to file/directory                                        |
| `restrict_search_to_code_files` | boolean | No       | Only search files with analyzable symbols (default: false)        |
| `paths_include_glob`            | string  | No       | Glob pattern for files to include (e.g., "_.ts", "src/\*\*/_.py") |
| `paths_exclude_glob`            | string  | No       | Glob pattern for files to exclude (takes precedence)              |
| `context_lines_before`          | integer | No       | Lines of context before match                                     |
| `context_lines_after`           | integer | No       | Lines of context after match                                      |

**Pattern Matching Logic:**

- DOTALL mode: `.` matches newlines
- Don't use `.*` at beginning/end (already matches all)
- Use non-greedy `.*?` in middle for complex patterns
- Multi-line patterns span lines if needed

**Use Cases:**

- Find specific code patterns
- Search non-code files (config, docs)
- Regex-based refactoring targets
- Pattern analysis across codebase

**Choose Smartly**: Use `restrict_search_to_code_files=true` for symbol operations; `false` for config/docs; prefer `find_symbol` for known symbol searches.

---

### 10. find_file

**Description**: Locate files by name, partial name, or inferred context.

**Parameters:**

| Parameter           | Type   | Required | Description                  |
| ------------------- | ------ | -------- | ---------------------------- |
| `file_name_pattern` | string | Yes      | File name or pattern to find |
| `search_path`       | string | No       | Directory to search within   |

**Use Cases:**

- Quick file location without manual browsing
- Find configuration files
- Locate test files
- Discover related modules

**Choose Smartly**: Use for quick file discovery; combine with `get_symbols_overview` for file content exploration.

---

### 11. list_dir

**Description**: List directory contents, exposing project structure.

**Parameters:**

| Parameter        | Type    | Required | Description                                      |
| ---------------- | ------- | -------- | ------------------------------------------------ |
| `directory_path` | string  | Yes      | Directory to list                                |
| `recursive`      | boolean | No       | Recursively list subdirectories (default: false) |

**Use Cases:**

- Understand project structure
- Locate modules/packages
- Discover related files
- Navigate unfamiliar codebases

**Choose Smartly**: Use to understand project organization; avoid excessive recursion for token economy.

---

## Analysis and Onboarding (2 Tools)

### 12. think_about_collected_information

**Description**: Process and synthesize collected code information for insights.

**Parameters:**

| Parameter     | Type   | Required | Description                     |
| ------------- | ------ | -------- | ------------------------------- |
| `information` | string | Yes      | Information to analyze          |
| `context`     | string | No       | Additional context for analysis |

**Use Cases:**

- Synthesize findings from multiple tool calls
- Generate insights from code exploration
- Connect patterns across codebase
- Formulate recommendations

**Choose Smartly**: Use after gathering information from multiple sources to synthesize insights.

---

### 13. check_onboarding_performed

**Description**: Verify if initial project onboarding has been completed.

**Parameters:** None

**Use Cases:**

- Determine if project context exists
- Decide whether to perform initial analysis
- Check session state

**Choose Smartly**: Call at session start to decide whether initial project analysis needed.

---

## When to Use Serena

**Use For:**

- Symbol operations: rename, refactor, find references, modify implementations
- Semantic code navigation: LSP-based understanding of structure
- Project memory: automatic context preservation across sessions
- Large codebases: >50 files, multi-language projects
- Code exploration: find symbols, references, overview

**Don't Use For:**

- Pattern-based bulk edits → Use Morphllm (faster for style enforcement)
- Simple text replacement → Native Edit tool
- Single-file trivial changes → Overkill

**Triggers:** Symbol operations, LSP needs, project memory, large codebase navigation, `/sc:load` and `/sc:save` commands

---

## Works Best With

**Serena → Morphllm**: Serena finds symbols → Morphllm applies bulk edits
**Serena → Sequential**: Serena provides code context → Sequential analyzes architecture

_See MCP_DecisionTree.md for detailed combination patterns_

---

## Tool Selection Guide

| Need            | Use                        | Notes                                |
| --------------- | -------------------------- | ------------------------------------ |
| Find by name    | `find_symbol`              | Fastest, semantic                    |
| Find references | `find_referencing_symbols` | Always before refactor               |
| Update impl     | `replace_symbol_body`      | Keeps signature                      |
| Add code        | `insert_after_symbol`      | Safe insertion                       |
| Pattern search  | `search_for_pattern`       | Use `max_answer_chars`, narrow scope |
| File overview   | `get_symbols_overview`     | First look at new file               |
| Dir structure   | `list_dir`                 | Explore project                      |
| Save context    | `write_memory`             | Auto-triggered                       |
| Load context    | `read_memory`              | When relevant                        |

---

## Validation and Best Practices

**Symbol Operations**:

- Always `find_referencing_symbols` before refactoring
- Verify scope with LSP kinds filtering
- Use `relative_path` to constrain searches

**Project Memory**:

- Descriptive memory names (include context, date if relevant)
- Markdown format for readability
- Balance thoroughness vs storage (don't write trivial operations)
- AI decides when to write automatically (trust the triggers)

**Code Navigation**:

- Start with `get_symbols_overview` for new files
- Use `include_kinds` to filter symbol types
- Prefer `find_symbol` over `search_for_pattern` for known symbols
- Use `restrict_search_to_code_files` appropriately

**Token Economy**:

- ⚠️ **ALWAYS use `max_answer_chars`** for search_for_pattern (default: unlimited!)
- Avoid `include_body=true` unless necessary
- Minimize `context_lines_before/after` (0-1 lines usually sufficient)
- Scope searches with `relative_path` and globs
- Don't read same memory multiple times per session
- Test with small scope first, then expand if needed

---

## Common Pitfalls and Anti-Patterns (JS/TS Examples)

### ❌ Anti-Pattern 1: Search Without Token Limits

**Problem:** Using `search_for_pattern` without `max_answer_chars` or with excessive context lines.

```typescript
// Example: Your 11.7K token issue
search_for_pattern({
  substring_pattern: "status.*badge|ReportStatus",
  relative_path: "src/screens/incomeReports",
  context_lines_before: 2,
  context_lines_after: 2
})
→ Returns 11.7K tokens! Fills context quickly
```

**Solution:**

```typescript
search_for_pattern({
  substring_pattern: "ReportStatusEnum\\.REJECTED",
  relative_path: "src/screens/incomeReports/utils",
  restrict_search_to_code_files: true,
  max_answer_chars: 3000,        // CRITICAL
  context_lines_before: 0,        // Minimize
  context_lines_after: 0,
  paths_exclude_glob: "**/{node_modules,dist}/**"
})
→ Controlled output, ~3K tokens max
```

**Rules:**

- ⚠️ ALWAYS `max_answer_chars: 2000-5000` for searches
- Default `context_lines: 0`, add only if needed
- Narrow with `relative_path` and globs
- Exclude node_modules, dist, build

### ❌ Anti-Pattern 2: Broad Searches Without Scope

**Problem:** Broad patterns, no scope, or requesting full symbol bodies.

```typescript
// Too broad pattern
search_for_pattern({
  substring_pattern: "useState"  // Matches everywhere in React!
})

// Or requesting bodies for many symbols
find_symbol({
  name_path: "Component",
  include_body: true,
  substring_matching: true
})
→ Returns full source of ALL matching components
```

**Solution:**

```typescript
// Option 1: Narrow pattern + scope
search_for_pattern({
  substring_pattern: "useState<ReportStatus>",
  relative_path: "src/screens/incomeReports",
  paths_include_glob: "**/*.{ts,tsx}",
  max_answer_chars: 3000
})

// Option 2: Use find_symbol instead (preferred for known identifiers)
find_symbol({
  name_path: "ReportStatusBadge",
  relative_path: "src/components",
  include_kinds: [12],  // functions only
  include_body: false   // Get locations first
})
→ Then read specific file if needed
```

**Rules:**

- Prefer `find_symbol` for known identifiers (Components, hooks, interfaces)
- Never `include_body: true` for broad searches
- Specific pattern > generic pattern
- Narrow path (component dir > src/ > project root)
- Use globs: `**/*.{ts,tsx}` for TypeScript/React

---

### React/TypeScript Specific Tips

| What to Find          | Tool                 | Example                                                                                           |
| --------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| React Components      | `find_symbol`        | `find_symbol({ name_path: "StatusBadge", include_kinds: [12], relative_path: "src/components" })` |
| TypeScript Interfaces | `find_symbol`        | `find_symbol({ name_path: "ReportProps", include_kinds: [11], relative_path: "src/types" })`      |
| Custom Hooks          | `find_symbol`        | `find_symbol({ name_path: "useReportStatus", include_kinds: [12], relative_path: "src/hooks" })`  |
| JSX/TSX Patterns      | `search_for_pattern` | Use only with `max_answer_chars` + specific `relative_path`                                       |

**Rule**: Prefer `find_symbol` over `search_for_pattern` for React/TS code - more precise, less tokens.

---

## Token Optimization Quick Reference (JS/TS)

| Operation              | Token Risk  | JS/TS Example         | Mitigation                                           |
| ---------------------- | ----------- | --------------------- | ---------------------------------------------------- |
| `search_for_pattern`   | 🔴 HIGH     | Search for "useState" | `max_answer_chars: 3000`, `context_lines: 0`         |
| `find_symbol` broad    | 🟡 MEDIUM   | Find all "Component"  | `relative_path: "src/components"`, no `include_body` |
| Search in node_modules | 🔴 CRITICAL | Any pattern in deps   | `paths_exclude_glob: "**/node_modules/**"`           |
| TSX with context       | 🔴 HIGH     | React components      | Use `find_symbol`, not pattern                       |
| `get_symbols_overview` | 🟢 LOW      | Component structure   | Safe for single files                                |

**Default JS/TS Strategy:**

```typescript
{
  max_answer_chars: 3000,
  context_lines_before: 0,
  context_lines_after: 0,
  relative_path: "src/specific/path",
  paths_include_glob: "**/*.{ts,tsx}",
  paths_exclude_glob: "**/{node_modules,dist,build}/**",
  restrict_search_to_code_files: true
}
```

---

## Key Insights

- **Serena is an LSP bridge** - gives AI IDE-quality code understanding
- **Semantic, not syntactic** - understands code structure, not just text
- **Language-agnostic** - works across Python, JS/TS, Java, C++, Rust, etc.
- **Memory-driven** - improves over time with project context
- **AI decides memory writes** - automatic triggers, not manual
- **Symbol-first** - use for operations on functions/classes/variables
- **Complements Morphllm** - Serena finds, Morphllm transforms

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

| Parameter  | Type  | Required | Description                                        |
| ---------- | ----- | -------- | -------------------------------------------------- |
| `messages` | array | Yes      | Array of message objects with `role` and `content` |

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

| Parameter | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| `query`   | string | Yes      | The query or problem to reason about |

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

| Aspect              | Perplexity                 | Sequential                | Native Claude     |
| ------------------- | -------------------------- | ------------------------- | ----------------- |
| **Internet Access** | Yes (ask only)             | No                        | No                |
| **Use Case**        | Facts, research            | Complex analysis          | General knowledge |
| **Citations**       | Yes (ask)                  | No                        | No                |
| **Speed**           | Slower (API)               | Moderate                  | Fastest           |
| **Best For**        | Current info, verification | Multi-component debugging | Simple queries    |

**Decision Rule**: External facts → Perplexity | Internal reasoning → Sequential | Simple query → Native

---

## Perplexity vs Context7

| Aspect       | Perplexity       | Context7              |
| ------------ | ---------------- | --------------------- |
| **Source**   | Open internet    | Curated documentation |
| **Quality**  | Variable         | High (official docs)  |
| **Coverage** | Broad            | Specific frameworks   |
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

_See MCP_DecisionTree.md for detailed combination patterns with Sequential, Morphllm, and Serena_

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

| Scenario                    | Use Instead   | Reason                     |
| --------------------------- | ------------- | -------------------------- |
| Code generation             | Native Claude | Faster, no API overhead    |
| Historical facts            | Native Claude | Within knowledge cutoff    |
| Official framework docs     | Context7      | Curated documentation      |
| Simple explanations         | Native Claude | Overkill for basic queries |
| Internal codebase questions | Serena        | Project-specific context   |

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

_Integration patterns and decision flows documented in MCP_DecisionTree.md_

---

## GitLab Integration

**Purpose**: Merge request (MR) operations and code review workflows

### Core Tools (3 Primary)

#### 1. create_merge_request

**Description**: Create new merge request in GitLab project.

**Key Parameters:**

- `project_id`: Project ID or URL-encoded path
- `source_branch`: Branch with changes
- `target_branch`: Base branch (usually main/master)
- `title`: MR title
- `description`: MR description (markdown supported)
- `assignee_ids`: User IDs to assign
- `reviewer_ids`: User IDs as reviewers

**Use Cases:**

- Automated MR creation after feature completion
- Batch MR creation for multiple related changes
- CI/CD pipeline integration

**Example:**

```
create_merge_request(
  project_id="my-org/my-project",
  source_branch="feature/auth-improvements",
  target_branch="main",
  title="Add JWT authentication",
  description="## Changes\n- Implement JWT tokens\n- Add refresh token logic"
)
```

---

#### 2. get_merge_request

**Description**: Retrieve merge request details and metadata.

**Key Parameters:**

- `project_id`: Project ID or URL-encoded path
- `merge_request_iid`: MR internal ID (IID, not global ID)

**Use Cases:**

- Check MR status before operations
- Retrieve MR metadata for analysis
- Monitor MR progress

**Example:**

```
get_merge_request(
  project_id="my-org/my-project",
  merge_request_iid="123"
)
→ Returns MR details, status, approvals, etc.
```

---

#### 3. get_merge_request_diffs

**Description**: Get changes/diffs for merge request with optional file filtering.

**Key Parameters:**

- `project_id`: Project ID or URL-encoded path
- `merge_request_iid`: MR internal ID
- `from`: Base branch/commit SHA
- `to`: Target branch/commit SHA
- `excluded_file_patterns`: Regex patterns to exclude files (e.g., `["^test/mocks/", "\\.spec\\.ts$"]`)

**Use Cases:**

- Code review analysis
- Change impact assessment
- Automated diff validation

**Example:**

```
get_merge_request_diffs(
  project_id="my-org/my-project",
  merge_request_iid="123",
  excluded_file_patterns=["package-lock\\.json", "^\\."]
)
→ Returns diffs excluding lock files and dotfiles
```

---

### Additional GitLab Tools

**Note**: Many additional GitLab tools exist beyond the core 3. Use MCPProxy's `retrieve_tools` for discovery:

- Thread/comment operations
- Draft note management
- Branch operations
- Commit operations
- Pipeline/CI operations
- File creation/updates
- Project management

**Discovery Pattern:**

```
retrieve_tools("gitlab merge request comments")
retrieve_tools("gitlab create branch")
retrieve_tools("gitlab commit file")
```

MCPProxy will automatically find relevant tools based on natural language query.

---

## Atlassian Integration (Jira/Confluence)

**Purpose**: Issue tracking, sprint management, documentation access

**⚠️ CRITICAL: Economical Usage Required**

### Usage Philosophy

- **Minimize Requests**: Combine operations when possible
- **Don't Overload**: Avoid excessive API calls
- **Be Specific**: Use precise JQL queries
- **Cache Results**: Don't repeatedly fetch same data

### Core Tools (4 Primary)

#### 1. getJiraIssue

**Description**: Retrieve specific Jira issue by key.

**Key Parameters:**

- `issueKey`: Jira issue key (e.g., "PROJ-123")
- `expand`: Additional fields to include (e.g., "changelog", "comments")

**Use Cases:**

- Check issue status
- Retrieve issue details for context
- Analyze issue history

**Example:**

```
getJiraIssue(issueKey="AUTH-456")
→ Returns issue details, status, assignee, etc.
```

**Best Practice**: Fetch only needed fields, avoid excessive expansion.

---

#### 2. searchJiraIssuesUsingJql

**Description**: Search Jira issues using JQL (Jira Query Language).

**Key Parameters:**

- `jql`: JQL query string
- `maxResults`: Limit result count (default: 50)
- `fields`: Specific fields to return (reduces payload)

**Use Cases:**

- Find related issues
- Sprint planning queries
- Status/priority filtering

**Example:**

```
searchJiraIssuesUsingJql(
  jql="project = AUTH AND status = 'In Progress' AND assignee = currentUser()",
  maxResults=10,
  fields=["summary", "status", "assignee"]
)
→ Returns current user's in-progress auth issues
```

**Best Practice**:

- Use specific JQL to minimize results
- Limit `maxResults` to what you need
- Request only necessary `fields`

---

#### 3. atlassianUserInfo

**Description**: Get current authenticated user information.

**Use Cases:**

- Verify authentication
- Get user ID for assignments
- Check user permissions

**Example:**

```
atlassianUserInfo()
→ Returns current user details
```

---

#### 4. getAccessibleAtlassianResources

**Description**: List accessible Atlassian resources (sites, projects).

**Use Cases:**

- Discover available projects
- Check access permissions
- Initialize integration

**Example:**

```
getAccessibleAtlassianResources()
→ Returns accessible Jira/Confluence sites
```

---

### Atlassian Best Practices

**Token Economy:**

- ✅ Batch related queries when possible
- ✅ Use JQL filters to reduce result size
- ✅ Request specific fields, not all data
- ✅ Cache results within session
- ❌ Don't repeatedly fetch same issue
- ❌ Don't fetch without specific need
- ❌ Don't use overly broad JQL queries

**Efficiency Rules:**

1. One targeted query > multiple broad queries
2. Specific fields > all fields
3. Limited results > unlimited results
4. JQL filtering > post-query filtering

---

## SQVR GraphQL Integration

**Purpose**: API access to SQVR system via GraphQL

**⚠️ CRITICAL: Granular Atomic Queries REQUIRED**

### The Schema Problem

**Challenge**: SQVR GraphQL schema is **ENORMOUS**

- Thousands of types, fields, relationships
- Easy to hit token limits with large queries
- Full schema introspection is prohibitively expensive

**Solution**: **Surgical, Precise, Atomic Operations**

### Critical Rules

1. **⚠️ ALWAYS Granular Queries**: Request minimum data per operation
2. **⚠️ NEVER Full Schema Introspection**: Introspect only specific types/fields needed
3. **⚠️ ALWAYS Use Filters**: Filter at query level, not post-processing
4. **⚠️ ALWAYS Use Pagination**: Limit, offset, or cursor-based pagination
5. **⚠️ ALWAYS Select Specific Fields**: Never use `{ ... }` or request all fields

### Core Tools (2)

#### 1. query-graphql

**Description**: Execute GraphQL query against SQVR API.

**Key Parameters:**

- `query`: GraphQL query string
- `variables`: Query variables (JSON object)
- `operationName`: Operation name for multi-operation documents

**Use Cases:**

- Fetch specific entity data
- Execute mutations
- Query relationships

**Best Practice Examples:**

**❌ WRONG - Too Broad:**

```graphql
query {
  users {
    id name email
    profile { ... }  # Fetches everything
    posts { ... }    # Fetches everything
  }
}
```

**✅ RIGHT - Surgical:**

```graphql
query GetUserEmail($userId: ID!) {
  user(id: $userId) {
    email
  }
}
```

**Token Optimization Rule**: Multiple small queries > one large query
_Example_: `query GetUser + query GetPosts` (2×1K tokens) > `query AllUserData` (5K tokens)

---

#### 2. introspect-schema

**Description**: Introspect GraphQL schema structure.

**⚠️ DANGER**: Full introspection hits token limits easily!

**Key Parameters:**

- `typename`: Specific type to introspect (ALWAYS use this!)
- `includeDeprecated`: Include deprecated fields (default: false)

**Best Practice:**

**❌ WRONG - Full Schema:**

```
introspect-schema()  // Requests ENTIRE schema - DANGER!
```

**✅ RIGHT - Specific Type:**

```
introspect-schema(typename="User")  // Only User type
introspect-schema(typename="Post")  // Only Post type
```

**Workflow for Unknown Schema:**

```
1. introspect-schema(typename="Query")
   → See available root queries
2. introspect-schema(typename="User")
   → See User fields
3. query-graphql(query="{ user(id: 1) { id name } }")
   → Execute targeted query
```

---

### SQVR Best Practices

**Query Strategy:**

1. **Start Minimal**: Request absolute minimum fields
2. **Iterate**: Add fields only as needed
3. **Paginate Everything**: Always use `first`, `last`, `limit`
4. **Filter at Source**: Use GraphQL filters, not post-query filtering
5. **One Concern Per Query**: Don't combine unrelated queries

**Introspection Strategy:**

1. **Never Full Schema**: Always specify `typename`
2. **Top-Down**: Start with `Query`/`Mutation`, drill down
3. **Just-In-Time**: Introspect only when needed for specific operation
4. **Cache Mentally**: Remember structure, don't re-introspect

**Token Economy Examples:**

| Approach                    | Token Cost      | Recommended    |
| --------------------------- | --------------- | -------------- |
| Full schema introspection   | ~50K+ tokens    | ❌ Never       |
| Type-specific introspection | ~500-2K tokens  | ✅ When needed |
| Minimal field query         | ~100-500 tokens | ✅ Default     |
| Paginated query (limit=10)  | ~500-1K tokens  | ✅ Always      |
| Unpaginated broad query     | ~10K+ tokens    | ❌ Never       |

---

## D2 Diagrams Integration

**Purpose**: Create, export, and save D2 diagram files
**Priority**: Low (use only when diagramming explicitly requested)

**Tools**: `d2_create` (create from DSL), `d2_export` (to image format), `d2_save` (persist to file)

**When to Use**: Architecture documentation, visual system design, user explicitly requests diagrams
**When NOT**: Default docs (use markdown), simple explanations (text sufficient)

---

## Integration Selection Matrix

| Need                 | Use                                  | Avoid                         |
| -------------------- | ------------------------------------ | ----------------------------- |
| Code review workflow | GitLab MR tools                      | Fetching all MRs              |
| Issue status check   | Jira getIssue                        | Searching without JQL         |
| Sprint planning      | Jira JQL search                      | Broad queries                 |
| API data fetch       | SQVR query-graphql (granular!)       | Full schema introspection     |
| Entity details       | SQVR query-graphql (specific fields) | Fetching all fields           |
| Architecture diagram | D2 tools                             | Using for simple explanations |

---

## Key Insights

**GitLab:**

- Focus on core 3 tools (MR operations)
- Use MCPProxy `retrieve_tools` for additional functionality
- Minimal, targeted operations

**Atlassian/Jira:**

- **Economy is critical** - minimize API calls
- Specific JQL queries with field selection
- Batch operations when possible

**SQVR GraphQL:**

- **Granular atomic queries** - non-negotiable
- **Never full schema introspection** - specify types
- Pagination, filtering, field selection always
- Token limits hit easily - be surgical

**D2 Diagrams:**

- Low priority, use only when needed
- Good for architecture docs
- Not for default documentation

**General Rule**: More specific query = fewer tokens = better performance

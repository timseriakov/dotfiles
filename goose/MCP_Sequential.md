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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `thought` | string | Yes | Current thinking step content (analysis, revision, question, realization, hypothesis) |
| `thoughtNumber` | integer | Yes | Position in sequence (can exceed initial `totalThoughts`) |
| `totalThoughts` | integer | Yes | Estimated total thoughts needed (dynamically adjustable) |
| `nextThoughtNeeded` | boolean | Yes | Whether additional reasoning steps required |

### Advanced Parameters (Optional)

| Parameter | Type | Description |
|-----------|------|-------------|
| `isRevision` | boolean | Mark this thought as revising previous thinking |
| `revisesThought` | integer | Which thought number is being reconsidered (requires `isRevision: true`) |
| `branchFromThought` | integer | Branching point thought number for alternative reasoning paths |
| `branchId` | string | Identifier for current branch (if exploring alternatives) |
| `needsMoreThoughts` | boolean | Realized more thoughts needed even at apparent "end" |

---

## Capabilities

- **Iterative Refinement**: Revise thoughts using `isRevision` and `revisesThought` parameters
- **Alternative Paths**: Branch with `branchFromThought` and track via `branchId` identifiers
- **Dynamic Adjustment**: Modify `totalThoughts` or set `needsMoreThoughts: true` as scope changes
- **Hypothesis Testing**: Generate and validate solution hypotheses throughout reasoning
- **Complete Auditability**: In-memory storage with pretty-printed output for inspection

---

## Sequential vs Native LLM Reasoning

| Aspect | Native LLM Reasoning | Sequential Thinking MCP Server |
|--------|---------------------|-------------------------------|
| **Transparency** | Opaque; reasoning hidden in model's forward pass | Fully auditable with explicit thought tracking |
| **Structure** | Implicit and unstructured | Explicitly structured with discrete steps and metadata |
| **Debuggability** | Difficult to inspect or audit | Easy to inspect, debug, enhance trust |
| **Flexibility** | Fixed during model inference | Dynamic adjustment, branching, revisions allowed |
| **Use Case** | General-purpose reasoning | Complex problems requiring decomposition & traceability |
| **Prompt Engineering** | Requires careful crafting | Reduces guesswork through structured framework |
| **Context Maintenance** | Limited across long sequences | Maintains context over numerous steps |
| **Revision** | Cannot revise earlier reasoning | Can mark and revise previous thoughts |

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

| Scenario | Use Instead | Reason |
|----------|-------------|--------|
| Explain a function | Native Claude | Simple explanation, structure overkill |
| Fix typo | Native Claude | Straightforward change |
| Quick fact lookup | Native Claude or Perplexity | Faster without structure overhead |
| Real-time chatbot | Native Claude | Latency concerns |
| General knowledge query | Native Claude | No analysis decomposition needed |

---

## Key Insights

- **Sequential does NOT think** - it provides workspace for AI to think deliberately
- **Transparency is the goal** - make AI reasoning auditable and trustworthy
- **Dynamic by design** - adjust, branch, revise as understanding deepens
- **Complements native reasoning** - use for complex problems, not simple queries
- **Explicit invocation required** - must ask for sequential thinking tool by name

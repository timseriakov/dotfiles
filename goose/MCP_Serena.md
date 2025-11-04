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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name_path` | string | Yes | Symbol name or path pattern (e.g., "method", "class/method", "/class/method") |
| `relative_path` | string | No | Restrict search to specific file or directory |
| `depth` | integer | No | Depth to retrieve descendants (e.g., 1 for class methods) |
| `include_kinds` | int[] | No | LSP symbol kinds to include (5=class, 6=method, 12=function, etc.) |
| `exclude_kinds` | int[] | No | LSP symbol kinds to exclude (takes precedence over include) |
| `substring_matching` | boolean | No | Use substring matching for last segment of name |
| `include_body` | boolean | No | Include symbol's source code (use judiciously for token economy) |

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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name_path` | string | Yes | Symbol name path to find references for |
| `relative_path` | string | Yes | File containing the symbol (must be file, not directory) |
| `include_kinds` | int[] | No | Filter referencing symbols by kind |
| `exclude_kinds` | int[] | No | Exclude specific symbol kinds |
| `max_answer_chars` | integer | No | Limit output size (-1 for default) |

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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name_path` | string | Yes | Symbol name path to replace |
| `relative_path` | string | Yes | File containing the symbol |
| `body` | string | Yes | New implementation body |

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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name_path` | string | Yes | Symbol after which to insert |
| `relative_path` | string | Yes | File containing the symbol |
| `body` | string | Yes | Code to insert after symbol |

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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `memory_name` | string | Yes | Meaningful memory identifier |
| `content` | string | Yes | UTF-8 encoded information in markdown format |
| `max_answer_chars` | integer | No | Limit output size (-1 for default) |

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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `memory_file_name` | string | Yes | Memory identifier to retrieve |
| `max_answer_chars` | integer | No | Limit output size (-1 for default) |

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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `relative_path` | string | Yes | File to get overview of |
| `max_answer_chars` | integer | No | Limit output size (-1 for default) |

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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `substring_pattern` | string | Yes | Regular expression pattern to search |
| `relative_path` | string | No | Restrict to file/directory |
| `restrict_search_to_code_files` | boolean | No | Only search files with analyzable symbols (default: false) |
| `paths_include_glob` | string | No | Glob pattern for files to include (e.g., "*.ts", "src/**/*.py") |
| `paths_exclude_glob` | string | No | Glob pattern for files to exclude (takes precedence) |
| `context_lines_before` | integer | No | Lines of context before match |
| `context_lines_after` | integer | No | Lines of context after match |

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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file_name_pattern` | string | Yes | File name or pattern to find |
| `search_path` | string | No | Directory to search within |

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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `directory_path` | string | Yes | Directory to list |
| `recursive` | boolean | No | Recursively list subdirectories (default: false) |

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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `information` | string | Yes | Information to analyze |
| `context` | string | No | Additional context for analysis |

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

*See MCP_DecisionTree.md for detailed combination patterns*

---

## Tool Selection Guide

| Need | Use | Notes |
|------|-----|-------|
| Find by name | `find_symbol` | Fastest, semantic |
| Find references | `find_referencing_symbols` | Always before refactor |
| Update impl | `replace_symbol_body` | Keeps signature |
| Add code | `insert_after_symbol` | Safe insertion |
| Pattern search | `search_for_pattern` | Use `max_answer_chars`, narrow scope |
| File overview | `get_symbols_overview` | First look at new file |
| Dir structure | `list_dir` | Explore project |
| Save context | `write_memory` | Auto-triggered |
| Load context | `read_memory` | When relevant |

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

| What to Find | Tool | Example |
|--------------|------|----------|
| React Components | `find_symbol` | `find_symbol({ name_path: "StatusBadge", include_kinds: [12], relative_path: "src/components" })` |
| TypeScript Interfaces | `find_symbol` | `find_symbol({ name_path: "ReportProps", include_kinds: [11], relative_path: "src/types" })` |
| Custom Hooks | `find_symbol` | `find_symbol({ name_path: "useReportStatus", include_kinds: [12], relative_path: "src/hooks" })` |
| JSX/TSX Patterns | `search_for_pattern` | Use only with `max_answer_chars` + specific `relative_path` |

**Rule**: Prefer `find_symbol` over `search_for_pattern` for React/TS code - more precise, less tokens.

---

## Token Optimization Quick Reference (JS/TS)

| Operation | Token Risk | JS/TS Example | Mitigation |
|-----------|------------|---------------|------------|
| `search_for_pattern` | 🔴 HIGH | Search for "useState" | `max_answer_chars: 3000`, `context_lines: 0` |
| `find_symbol` broad | 🟡 MEDIUM | Find all "Component" | `relative_path: "src/components"`, no `include_body` |
| Search in node_modules | 🔴 CRITICAL | Any pattern in deps | `paths_exclude_glob: "**/node_modules/**"` |
| TSX with context | 🔴 HIGH | React components | Use `find_symbol`, not pattern |
| `get_symbols_overview` | 🟢 LOW | Component structure | Safe for single files |

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

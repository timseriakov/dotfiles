# Goose Framework Flags

Behavioral flags for Goose AI to enable specific execution modes and tool selection patterns.

## MCP Server Flags

**--c7 / --context7**

- Trigger: Library imports, framework questions, official documentation needs
- Behavior: Enable Context7 for curated documentation lookup and pattern guidance

**--seq / --sequential**

- Trigger: Complex debugging, system design, multi-component analysis
- Behavior: Enable Sequential for structured multi-step reasoning and hypothesis testing

**--morph / --morphllm**

- Trigger: Bulk code transformations, pattern-based edits, style enforcement
- Behavior: Enable Morphllm for efficient multi-file pattern application

**--serena**

- Trigger: Symbol operations, project memory needs, large codebase navigation
- Behavior: Enable Serena for semantic understanding and session persistence

**--all-mcp**

- Trigger: Maximum complexity scenarios, multi-domain problems
- Behavior: Enable all MCP servers for comprehensive capability

**--no-mcp**

- Trigger: Native-only execution needs, performance priority
- Behavior: Disable all MCP servers, use native tools only

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
**MCP Control**: --no-mcp overrides all individual MCP flags

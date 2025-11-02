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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Absolute path to file to edit |
| `code_edit` | string | Yes | Code changes with `// ... existing code ...` markers for unchanged sections |
| `instruction` | string | Yes | Single-sentence description of what this edit accomplishes |
| `dryRun` | boolean | No | Preview changes without applying (default: false) |

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
  logError('API call failed', error);
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

| Scenario | Use Instead | Reason |
|----------|-------------|---------|
| Rename function everywhere | Serena | Symbol operations need LSP tracking |
| Single typo fix | Native Edit | Overkill for simple change |
| Complex refactoring | Serena + Morphllm | Need semantic understanding first |
| Mission-critical code | Manual edit | 98% accuracy insufficient |

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

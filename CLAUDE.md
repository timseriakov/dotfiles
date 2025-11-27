# Claude Code Instructions

## Git Commit Best Practices

### ⚠️ Pre-commit Hook Rules

This repo uses `pre-commit` with `end-of-file-fixer` and `trailing-whitespace` hooks that automatically fix files.

### 🚫 What NOT to do:

- **Don't commit during active file editing**
- **Don't make multiple small commits in sequence**
- **Don't commit while files are being modified**

### ✅ What TO do:

1. **Work on all files first** - create, edit, modify everything needed
2. **Add newlines to end of files** when creating new files:

   ```javascript
   // Always end files with newline
   console.log("last line");
   ```

3. **Commit everything at once at the END**:
   ```bash
   git add .
   git commit -m "Complete feature description"
   ```
4. **Let pre-commit auto-fix** - it will add missing newlines and fix whitespace
5. **Group related changes** into single logical commits

### 🎯 Workflow:

```
1. User asks for changes
2. Make ALL necessary file modifications
3. Only when EVERYTHING is done → commit
4. Pre-commit runs and auto-fixes formatting
5. Commit succeeds without conflicts
```

### 📝 File Creation Pattern:

Always end files with empty line:

```bash
cat > file.txt << 'EOF'
content here
last line

EOF
```

## Additional Notes

- Pre-commit hooks are configured in `.pre-commit-config.yaml`
- They automatically fix common issues - don't fight them!
- Single commits are better than multiple incremental commits

# AI Tools - Git Workflow Instructions

> **For all AI assistants working with this repository**

## 🚨 Pre-commit Hook Warning

This repository uses automated formatting hooks that **WILL CONFLICT** with incremental commits:
- `end-of-file-fixer` - adds newlines at end of files
- `trailing-whitespace` - removes trailing whitespace
- `detect-secrets` - scans for secrets

## ❌ What Causes Conflicts

**DON'T do this pattern:**
```bash
# BAD - causes conflicts
edit file1.js
git add file1.js && git commit -m "step 1"
edit file2.js
git add file2.js && git commit -m "step 2"  # ← CONFLICT!
```

**Why it fails:**
1. First commit triggers pre-commit hooks
2. Hooks modify files (add newlines, fix whitespace)
3. Second commit conflicts with hook modifications
4. Results in "Stashed changes conflicted with hook auto-fixes"

## ✅ Correct Workflow

**DO this instead:**
```bash
# GOOD - no conflicts
edit file1.js
edit file2.js
edit file3.js
# ... complete ALL modifications first
git add .
git commit -m "Complete feature implementation"
```

## 📝 File Creation Rules

**Always end files with newline:**
```javascript
// file.js
console.log("last line");
⏎  // ← This empty line is REQUIRED
```

**Use this pattern when creating files:**
```bash
cat > newfile.js << 'EOF'
content here
last line

EOF
```

## 🎯 Key Principles

1. **Batch all changes** before committing
2. **Never commit incrementally** during active development
3. **Let pre-commit auto-fix** formatting - don't fight it
4. **End all text files** with empty lines
5. **Group related changes** into single logical commits

## 🛠️ For AI Assistants

- Complete ALL file operations before any git commands
- Create files with proper line endings from the start
- Use single commits for complete features/fixes
- Let the user know when you're ready to commit everything together

---

**Remember: Work first, commit last! 🎯**

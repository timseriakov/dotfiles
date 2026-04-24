#!/usr/bin/env python3
"""
Caveman Memory Compression Orchestrator

Usage:
    python scripts/compress.py <filepath>
"""

import json
import os
from importlib import import_module
from pathlib import Path
import re
import subprocess
import tempfile
from typing import List

OUTER_FENCE_REGEX = re.compile(
    r"\A\s*(`{3,}|~{3,})[^\n]*\n(.*)\n\1\s*\Z", re.DOTALL
)

# Filenames and paths that almost certainly hold secrets or PII. Compressing
# them ships raw bytes to the Anthropic API — a third-party data boundary that
# developers on sensitive codebases cannot cross. detect.py already skips .env
# by extension, but credentials.md / secrets.txt / ~/.aws/credentials would
# slip through the natural-language filter. This is a hard refuse before read.
SENSITIVE_BASENAME_REGEX = re.compile(
    r"(?ix)^("
    r"\.env(\..+)?"
    r"|\.netrc"
    r"|credentials(\..+)?"
    r"|secrets?(\..+)?"
    r"|passwords?(\..+)?"
    r"|id_(rsa|dsa|ecdsa|ed25519)(\.pub)?"
    r"|authorized_keys"
    r"|known_hosts"
    r"|.*\.(pem|key|p12|pfx|crt|cer|jks|keystore|asc|gpg)"
    r")$"
)

SENSITIVE_PATH_COMPONENTS = frozenset({".ssh", ".aws", ".gnupg", ".kube", ".docker"})

SENSITIVE_NAME_TOKENS = (
    "secret", "credential", "password", "passwd",
    "apikey", "accesskey", "token", "privatekey",
)


def is_sensitive_path(filepath: Path) -> bool:
    """Heuristic denylist for files that must never be shipped to a third-party API."""
    name = filepath.name
    if SENSITIVE_BASENAME_REGEX.match(name):
        return True
    lowered_parts = {p.lower() for p in filepath.parts}
    if lowered_parts & SENSITIVE_PATH_COMPONENTS:
        return True
    # Normalize separators so "api-key" and "api_key" both match "apikey".
    lower = re.sub(r"[_\-\s.]", "", name.lower())
    return any(tok in lower for tok in SENSITIVE_NAME_TOKENS)


def strip_llm_wrapper(text: str) -> str:
    """Strip outer ```markdown ... ``` fence when it wraps the entire output."""
    m = OUTER_FENCE_REGEX.match(text)
    if m:
        return m.group(2)
    return text

from .detect import should_compress
from .validate import validate

MAX_RETRIES = 2


# ---------- LLM Calls ----------

def get_runner() -> str:
    return os.environ.get("CAVEMAN_RUNNER", "claude").strip().lower()


def get_mode() -> str:
    return os.environ.get("CAVEMAN_MODE", "safe").strip().lower()


def call_anthropic_sdk(prompt: str) -> str | None:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        anthropic = import_module("anthropic")

        client = anthropic.Anthropic(api_key=api_key)
        msg = client.messages.create(
            model=os.environ.get("CAVEMAN_MODEL", "claude-sonnet-4-5"),
            max_tokens=8192,
            messages=[{"role": "user", "content": prompt}],
        )
        return strip_llm_wrapper(msg.content[0].text.strip())
    except ImportError:
        return None

def call_claude_cli(prompt: str) -> str:
    try:
        result = subprocess.run(
            ["claude", "--print"],
            input=prompt,
            text=True,
            capture_output=True,
            check=True,
        )
        return strip_llm_wrapper(result.stdout.strip())
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Claude call failed:\n{e.stderr}")


def call_codex_cli(prompt: str) -> str:
    model = os.environ.get("CAVEMAN_CODEX_MODEL")
    cmd = [
        "codex",
        "exec",
        "-",
        "--skip-git-repo-check",
        "--dangerously-bypass-approvals-and-sandbox",
        "--color",
        "never",
    ]
    if model:
        cmd.extend(["--model", model])

    with tempfile.NamedTemporaryFile(mode="r+", suffix=".txt", delete=True) as tmp:
        cmd.extend(["--output-last-message", tmp.name])
        try:
            subprocess.run(
                cmd,
                input=prompt,
                text=True,
                capture_output=True,
                check=True,
            )
        except subprocess.CalledProcessError as e:
            stderr = (e.stderr or "").strip()
            stdout = (e.stdout or "").strip()
            raise RuntimeError(
                "Codex call failed:\n" + "\n".join(p for p in [stderr, stdout] if p)
            )
        tmp.seek(0)
        return strip_llm_wrapper(tmp.read().strip())


def call_opencode_cli(prompt: str) -> str:
    model = os.environ.get("CAVEMAN_OPENCODE_MODEL")
    cmd = [
        "opencode",
        "run",
        "--format",
        "json",
        "--dangerously-skip-permissions",
        prompt,
    ]
    if model:
        cmd.extend(["--model", model])
    try:
        result = subprocess.run(
            cmd,
            text=True,
            capture_output=True,
            check=True,
        )
    except subprocess.CalledProcessError as e:
        stderr = (e.stderr or "").strip()
        stdout = (e.stdout or "").strip()
        raise RuntimeError(
            "OpenCode call failed:\n" + "\n".join(p for p in [stderr, stdout] if p)
        )

    last_text = None
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(event, dict):
            for key in ("text", "content", "message"):
                value = event.get(key)
                if isinstance(value, str) and value.strip():
                    last_text = value.strip()
            message = event.get("message")
            if isinstance(message, dict):
                for key in ("text", "content"):
                    value = message.get(key)
                    if isinstance(value, str) and value.strip():
                        last_text = value.strip()
    if not last_text:
        raise RuntimeError("OpenCode call succeeded but no final text was found in JSON output")
    return strip_llm_wrapper(last_text)


def call_llm(prompt: str) -> str:
    sdk_result = call_anthropic_sdk(prompt)
    if sdk_result is not None:
        return sdk_result

    runner = get_runner()
    if runner == "claude":
        return call_claude_cli(prompt)
    if runner == "codex":
        return call_codex_cli(prompt)
    if runner == "opencode":
        return call_opencode_cli(prompt)
    raise RuntimeError(
        f"Unsupported CAVEMAN_RUNNER={runner!r}. Use 'claude', 'codex', or 'opencode'."
    )

def build_compress_prompt(original: str) -> str:
    mode = get_mode()
    if mode == "memory":
        return f'''
Compress this markdown into aggressive caveman memory format for LLM context reuse.

MEMORY MODE GOAL:
- Preserve final decisions, policies, thresholds, states, entities, URLs, paths, commands, code blocks
- Remove repetition, filler, examples, duplicated rationale, and explanatory prose
- Merge repeated rules into one canonical statement
- Prefer compact bullets over narrative paragraphs
- Target roughly 35-50% of original size while preserving operational meaning
- Keep H1 exactly
- Keep H2 when useful for navigation
- H3+ may be merged, collapsed, or removed if meaning is preserved

STRICT RULES:
- Do NOT modify anything inside ``` code blocks
- Do NOT modify anything inside inline backticks
- Preserve ALL URLs exactly
- Preserve file paths and commands
- Return ONLY the compressed markdown body — no outer fence
- Keep all explicit thresholds, enums, statuses, field names, event names, auth/provider names, and open questions
- If two sections say the same thing, keep the strongest/canonical version once instead of repeating it

PRD / MEMORY PRIORITY:
1. final product decisions
2. auth / reveal / moderation / lifecycle rules
3. entities / fields / statuses / metrics
4. launch constraints / success criteria / open questions
5. nice-to-have rationale only if needed for interpretation

TEXT:
{original}
'''
    return f'''
Compress this markdown into caveman format.

STRICT RULES:
- Do NOT modify anything inside ``` code blocks
- Do NOT modify anything inside inline backticks
- Preserve ALL URLs exactly
- Preserve ALL headings exactly
- Preserve file paths and commands
- Return ONLY the compressed markdown body — do NOT wrap the entire output in a ```markdown fence or any other fence. Inner code blocks from the original stay as-is; do not add a new outer fence around the whole file.

Only compress natural language.

TEXT:
{original}
'''


def build_fix_prompt(original: str, compressed: str, errors: List[str]) -> str:
    errors_str = "\n".join(f"- {e}" for e in errors)
    mode = get_mode()
    if mode == "memory":
        return f'''You are fixing a caveman-compressed markdown file in MEMORY mode. Specific validation errors were found.

CRITICAL RULES:
- DO NOT fully recompress from scratch
- ONLY fix the listed errors — leave all other successful compression intact
- Preserve aggressive memory compression style in untouched sections
- H1 must remain exact; H2 may differ if not listed in errors
- Preserve all code blocks, URLs, paths, commands, explicit thresholds, enums, statuses, field names, and event names

ERRORS TO FIX:
{errors_str}

HOW TO FIX:
- Missing URL: restore it exactly from ORIGINAL
- Code block mismatch: restore exact block from ORIGINAL
- H1 mismatch: restore exact H1 from ORIGINAL
- Do not expand compressed prose unless required to fix a listed error

ORIGINAL (reference only):
{original}

COMPRESSED (fix this):
{compressed}

Return ONLY the fixed compressed file. No explanation.
'''
    return f'''You are fixing a caveman-compressed markdown file. Specific validation errors were found.

CRITICAL RULES:
- DO NOT recompress or rephrase the file
- ONLY fix the listed errors — leave everything else exactly as-is
- The ORIGINAL is provided as reference only (to restore missing content)
- Preserve caveman style in all untouched sections

ERRORS TO FIX:
{errors_str}

HOW TO FIX:
- Missing URL: find it in ORIGINAL, restore it exactly where it belongs in COMPRESSED
- Code block mismatch: find the exact code block in ORIGINAL, restore it in COMPRESSED
- Heading mismatch: restore the exact heading text from ORIGINAL into COMPRESSED
- Do not touch any section not mentioned in the errors

ORIGINAL (reference only):
{original}

COMPRESSED (fix this):
{compressed}

Return ONLY the fixed compressed file. No explanation.
'''


# ---------- Core Logic ----------


def compress_file(filepath: Path) -> bool:
    # Resolve and validate path
    filepath = filepath.resolve()
    MAX_FILE_SIZE = 500_000  # 500KB
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    if filepath.stat().st_size > MAX_FILE_SIZE:
        raise ValueError(f"File too large to compress safely (max 500KB): {filepath}")

    # Refuse files that look like they contain secrets or PII. Compressing ships
    # the raw bytes to the Anthropic API — a third-party boundary — so we fail
    # loudly rather than silently exfiltrate credentials or keys. Override is
    # intentional: the user must rename the file if the heuristic is wrong.
    if is_sensitive_path(filepath):
        raise ValueError(
            f"Refusing to compress {filepath}: filename looks sensitive "
            "(credentials, keys, secrets, or known private paths). "
            "Compression sends file contents to the Anthropic API. "
            "Rename the file if this is a false positive."
        )

    print(f"Processing: {filepath}")

    if not should_compress(filepath):
        print("Skipping (not natural language)")
        return False

    original_text = filepath.read_text(errors="ignore")
    backup_path = filepath.with_name(filepath.stem + ".original.md")

    # Check if backup already exists to prevent accidental overwriting
    if backup_path.exists():
        print(f"⚠️ Backup file already exists: {backup_path}")
        print("The original backup may contain important content.")
        print("Aborting to prevent data loss. Please remove or rename the backup file if you want to proceed.")
        return False

    # Step 1: Compress
    print(f"Compressing with runner: {get_runner()} (mode={get_mode()})...")
    compressed = call_llm(build_compress_prompt(original_text))

    # Save original as backup, write compressed to original path
    backup_path.write_text(original_text)
    filepath.write_text(compressed)

    # Step 2: Validate + Retry
    for attempt in range(MAX_RETRIES):
        print(f"\nValidation attempt {attempt + 1}")

        result = validate(backup_path, filepath)

        if result.is_valid:
            print("Validation passed")
            break

        print("❌ Validation failed:")
        for err in result.errors:
            print(f"   - {err}")

        if attempt == MAX_RETRIES - 1:
            # Restore original on failure
            filepath.write_text(original_text)
            backup_path.unlink(missing_ok=True)
            print("❌ Failed after retries — original restored")
            return False

        print(f"Fixing with runner: {get_runner()} (mode={get_mode()})...")
        compressed = call_llm(
            build_fix_prompt(original_text, filepath.read_text(errors="ignore"), result.errors)
        )
        filepath.write_text(compressed)

    return True

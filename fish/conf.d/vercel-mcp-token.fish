# Auto-export Vercel CLI token for OMP MCP.
# Project configs reference ${VERCEL_MCP_TOKEN}; keep the secret out of repo files.
set -l vercel_auth "$HOME/Library/Application Support/com.vercel.cli/auth.json"
if test -r "$vercel_auth"
    set -l token (python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("token", ""))' "$vercel_auth" 2>/dev/null)
    if test -n "$token"
        set -gx VERCEL_MCP_TOKEN "$token"
    end
end

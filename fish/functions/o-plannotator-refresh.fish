function o-plannotator-refresh
    set -l cache_dir ~/.cache/opencode
    rm -rf "$cache_dir/node_modules/@plannotator/opencode"
    rm -f "$cache_dir/bun.lock" "$cache_dir/package.json"
    echo "Plannotator cache cleared. Restart OpenCode."
end

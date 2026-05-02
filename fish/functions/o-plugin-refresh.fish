function o-plugin-refresh
    set -l cache_dir ~/.cache/opencode
    if test (count $argv) -lt 1
        echo "Usage: o-plugin-refresh <plugin-name>"
        echo "Example: o-plugin-refresh plannatoator"
        echo "Example: o-plugin-refresh @plannotator/opencode"
        return 1
    end
    set -l plugin $argv[1]
    set -l plugin_path "$cache_dir/node_modules/$plugin"
    echo "Removing plugin cache: $plugin_path"
    rm -rf "$plugin_path"
    echo "Removing OpenCode lock/cache files"
    rm -f "$cache_dir/bun.lock" "$cache_dir/package.json"
    echo "Done. Restart OpenCode."
end

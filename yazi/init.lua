require("starship"):setup()
require("git"):setup()
require("no-status"):setup()
require("close-and-restore-tab")
require("mux"):setup({
	aliases = {
		sqlite_tables = {
			previewer = "faster-piper",
			args = {
				[[sqlite3 "$1" ".mode box" ".headers on" "SELECT name AS table_name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"]],
			},
		},
		sqlite_sample = {
			previewer = "faster-piper",
			args = {
				[[query=$(sqlite3 "$1" "SELECT 'SELECT * FROM \"' || replace(name,'\"','\"\"') || '\" LIMIT 50;' FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name LIMIT 1;"); [ -n "$query" ] || { echo "No tables"; exit 0; }; sqlite3 "$1" ".mode box" ".headers on" "$query"]],
			},
		},
	},
})
require("searchjump"):setup({
	opt_unmatch_fg = "#4C566A",
	opt_match_str_fg = "#2E3440",
	opt_match_str_bg = "#88C0D0",
	opt_lable_fg = "#2E3440",
	opt_lable_bg = "#EBCB8B",
	opt_only_current = false, -- only search the current window
	opt_search_patterns = {}, -- demo:{"%.e%d+","s%d+e%d+"}
})


if os.getenv("NVIM") then
	require("toggle-pane"):entry("min-preview")
end

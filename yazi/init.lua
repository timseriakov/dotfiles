require("starship"):setup()
require("git"):setup()
require("no-status"):setup()
require("close-and-restore-tab")
require("easyjump"):setup({
	icon_fg = "#A3BE8C", -- color for hint labels "#88C1D0"
	first_key_fg = "#ffffff", -- color for first char of double-key hints #A3BE8C
	first_keys = "asdfgercwtvxbq", -- 14 keys
	second_keys = "yuiophjklnm", -- 11 keys
})

if os.getenv("NVIM") then
	require("toggle-pane"):entry("min-preview")
end

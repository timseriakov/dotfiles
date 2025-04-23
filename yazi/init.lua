require("starship"):setup()
require("git"):setup()
require("yatline"):setup({
	show_background = true,
	colors = {
		background = "#2E3440",
		foreground = "#D8DEE9",
		accent = "#88C0D0",
		error = "#BF616A",
		warning = "#EBCB8B",
		info = "#8FBCBB",
		hint = "#B48EAD",
		permission = "#A3BE8C",
	},
	header_line = {
		left = {
			section_a = {},
			section_b = {},
			section_c = {},
		},
		right = {
			section_a = {},
			section_b = {},
			section_c = {},
		},
	},
	status_line = {
		left = {
			section_a = {
				{ type = "string", custom = false, name = "tab_mode" },
			},
			section_b = {
				{ type = "string", custom = false, name = "hovered_size" },
			},
			section_c = {
				{ type = "string", custom = false, name = "hovered_name" },
			},
		},
		right = {
			section_a = {
				{ type = "string", custom = false, name = "cursor_position" },
			},
			section_b = {
				{ type = "string", custom = false, name = "cursor_percentage" },
			},
			section_c = {
				{ type = "coloreds", custom = false, name = "permissions" },
			},
		},
	},
})

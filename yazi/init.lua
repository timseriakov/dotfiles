require("starship"):setup()
require("git"):setup()
require("yatline"):setup({
	show_background = true,
	display_header_line = true,
	display_status_line = true,
	component_positions = { "header", "tab", "status" },

	section_separator = { open = "", close = "" },
	part_separator = { open = "", close = "" },

	style_a = {
		fg = "#2E3440",
		bg_mode = {
			normal = "#88C0D0", -- голубой (active tab)
			select = "#81A1C1", -- синий (selected tab)
			un_set = "#4C566A", -- серый (unused/unset)
		},
	},
	style_b = {
		bg = "#3B4252",
		fg = "#D8DEE9",
	},
	style_c = {
		bg = "#2E3440",
		fg = "#D8DEE9",
	},

	permissions_t_fg = "#A3BE8C",
	permissions_r_fg = "#EBCB8B",
	permissions_w_fg = "#BF616A",
	permissions_x_fg = "#88C0D0",
	permissions_s_fg = "#E5E9F0",

	tab_width = 18,
	tab_use_inverse = true,

	selected = { icon = "󰻭", fg = "#EBCB8B" }, -- жёлтый icon
	copied = { icon = "", fg = "#A3BE8C" },
	cut = { icon = "", fg = "#BF616A" },

	header_line = {
		left = {
			section_a = {},
			section_b = {},
			section_c = {},
		},
		right = {
			section_a = {
				{ type = "line", custom = false, name = "tabs", params = { "right", "reverse" } },
			},
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
-- require("no-status"):setup()

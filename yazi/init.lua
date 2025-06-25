require("starship"):setup()
require("git"):setup()
require("yatline"):setup({
	show_background = false,
	display_header_line = false,
	display_status_line = false,
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

	selected = { icon = "󰻭", fg = "#EBCB8B" },
	copied = { icon = "", fg = "#A3BE8C" },
	cut = { icon = "", fg = "#BF616A" },

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
				-- { type = "string", custom = false, name = "tab_mode" },
				{ type = "line", custom = false, name = "tabs", params = { "left", "reverse" } },
			},
			section_b = {
				-- { type = "string", custom = false, name = "hovered_name" },
			},
			section_c = {},
		},
		right = {
			section_a = {
				-- { type = "line", custom = false, name = "tabs", params = { "right", "reverse" } },
			},
			section_b = {
				-- { type = "coloreds", custom = false, name = "permissions" },
			},
			section_c = {
				-- { type = "string", custom = false, name = "hovered_size" },
			},
		},
	},
})
-- require("no-status"):setup()

return {
	"nvim-telescope/telescope.nvim",
	opts = {
		defaults = {
			layout_strategy = "horizontal", -- или "flex" если хочешь автоадаптацию
			layout_config = {
				horizontal = {
					preview_width = 0.55,
					prompt_position = "bottom",
				},
				width = 0.95,
				height = 0.95,
				preview_cutoff = 120,
			},
			sorting_strategy = "descending",
			winblend = 0, -- прозрачность (0 = нет прозрачности)
		},
	},
}

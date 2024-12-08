return {
	"nvim-lualine/lualine.nvim",
	config = function()
		require("lualine").setup({
			sections = {
				lualine_a = { "mode" },
				lualine_b = { "filename" },
				lualine_c = { "progress" },
				lualine_x = { "branch", "diff" },
				lualine_y = {},
				lualine_z = {},
			},
			options = {
				globalstatus = true,
			},
		})
	end,
}

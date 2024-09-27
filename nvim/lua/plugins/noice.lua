return {
	"folke/noice.nvim",
	opts = {
		views = {
			mini = {
				win_options = {
					winhighlight = "Normal:NoiceMini,FloatBorder:NoiceMiniBorder",
				},
			},
		},
	},
	config = function(_, opts)
		require("noice").setup(opts)
		vim.api.nvim_set_hl(0, "NoiceMini", { fg = "#5E81AC", bg = "#434C5E" })
	end,
}

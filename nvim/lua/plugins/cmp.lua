return {
	{
		"hrsh7th/nvim-cmp",
		optional = true,
		dependencies = { "Exafunction/codeium.nvim" },
		opts = function(_, opts)
			table.insert(opts.sources, 1, {
				name = "codeium",
				group_index = 1,
				priority = 100,
			})
		end,
	},
}

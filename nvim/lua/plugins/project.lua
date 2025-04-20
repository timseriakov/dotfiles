return {
	"ahmedkhalf/project.nvim",
	event = "VeryLazy",
	config = function()
		require("project_nvim").setup({
			detection_methods = { "lsp", "pattern" },
			patterns = { ".git", "package.json", "Makefile", "pyproject.toml" },
		})
		require("telescope").load_extension("projects")
	end,
}

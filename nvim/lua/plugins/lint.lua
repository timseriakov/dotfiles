return {
	{
		"mfussenegger/nvim-lint",
		event = { "BufReadPre", "BufNewFile" },
		config = function()
			local lint = require("lint")

			lint.linters_by_ft = {
				dockerfile = { "hadolint" },
				fish = { "fish" },
				markdown = { "markdownlint-cli2" },
				mysql = { "sqlfluff" },
				plsql = { "sqlfluff" },
				sql = { "sqlfluff" },
				-- ESLint removed - using LSP via LazyVim instead
				-- typescript = { "eslint" },
				-- typescriptreact = { "eslint" },
				-- javascript = { "eslint" },
				-- javascriptreact = { "eslint" },
			}

			vim.api.nvim_create_autocmd({ "BufWritePost", "BufEnter" }, {
				callback = function()
					require("lint").try_lint()
				end,
			})
		end,
	},
}

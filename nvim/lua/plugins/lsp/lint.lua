return {
	{
		"mfussenegger/nvim-lint",
		event = { "BufReadPre", "BufNewFile" },
		config = function()
			local lint = require("lint")

			lint.linters_by_ft = {
				dockerfile = { "hadolint" },
				fish = { "fish" },
				-- markdown = { "markdownlint-cli2" },
				mysql = { "sqlfluff" },
				plsql = { "sqlfluff" },
				sql = { "sqlfluff" },
				-- ESLint removed - using LSP via LazyVim instead
				-- typescript = { "eslint" },
				-- typescriptreact = { "eslint" },
				-- javascript = { "eslint" },
				-- javascriptreact = { "eslint" },
			}

		local markdownlint = lint.linters["markdownlint-cli2"]
		if markdownlint then
			markdownlint.condition = function()
				print("markdown_lint_enabled:", vim.b.markdown_lint_enabled)
				return vim.b.markdown_lint_enabled ~= false
			end
		end

			vim.api.nvim_create_autocmd({ "BufWritePost", "BufEnter" }, {
				callback = function()
					require("lint").try_lint()
				end,
			})
		end,
	},
}

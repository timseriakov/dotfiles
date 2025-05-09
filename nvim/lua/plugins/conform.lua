return {
  {
    "stevearc/conform.nvim",
    opts = function(_, opts)
      local cwd = function()
        return vim.fn.getcwd()
      end

      -- Расширить formatters_by_ft, не затирая другие
      opts.formatters_by_ft = vim.tbl_deep_extend("force", opts.formatters_by_ft or {}, {
        markdown = { "markdownlint-cli2" },
        markdown_mdx = { "markdownlint-cli2" },
      })

      -- Расширить formatters, не затирая другие
      opts.formatters = vim.tbl_deep_extend("force", opts.formatters or {}, {
        ["markdownlint-cli2"] = {
          command = "markdownlint-cli2",
          args = {
            "--config", ".markdownlint-cli2.jsonc",
            "--", "$FILENAME",
          },
          cwd = cwd,
          require_cwd = true,
        },
      })

      return opts
    end,
  },
}

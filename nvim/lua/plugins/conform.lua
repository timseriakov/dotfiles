return {
  {
    "stevearc/conform.nvim",
    opts = function()
      return {
        formatters_by_ft = {
          markdown = { "markdownlint-cli2" },
          markdown_mdx = { "markdownlint-cli2" },
        },
        formatters = {
  ["markdownlint-cli2"] = {
    command = "markdownlint-cli2",
    args = {
      "--config", ".markdownlint-cli2.jsonc",
      "--", "$FILENAME",
    },
    cwd = function()
      return vim.fn.getcwd()
    end,
    require_cwd = true,
  },
},
      }
    end,
  },
}


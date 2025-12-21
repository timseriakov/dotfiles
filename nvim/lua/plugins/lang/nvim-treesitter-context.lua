return {
  "nvim-treesitter/nvim-treesitter-context",
  event = "VeryLazy",
  dependencies = { "nvim-treesitter/nvim-treesitter" }, -- ensure it's loaded after treesitter
  config = function()
    require("treesitter-context").setup({
      enable = true,
      max_lines = 2,
      line_numbers = true,
      trim_scope = "outer",
      mode = "cursor",
      separator = vim.g.neovide and "" or "─",
      zindex = 50,
    })
  end,
}

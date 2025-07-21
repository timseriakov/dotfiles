return {
  "nvim-treesitter/nvim-treesitter-context",
  event = "VeryLazy",
  opts = {
    enable = true,
    max_lines = 2,
    line_numbers = true,
    trim_scope = "outer",
    mode = "cursor",
    separator = "─",
    zindex = 50,
    -- on_attach = function(buf)
    --   for _, win in ipairs(vim.api.nvim_list_wins()) do
    --     if vim.api.nvim_win_get_buf(win) == buf then
    --       vim.api.nvim_win_set_option(win, "number", false)
    --       vim.api.nvim_win_set_option(win, "relativenumber", false)
    --     end
    --   end
    -- end,
  },
  -- config = function(_, opts)
  --   require("treesitter-context").setup(opts)
  --
  --   -- Nord color for separator
  --   vim.api.nvim_set_hl(0, "TreesitterContextSeparator", { fg = "#4C566A" })
  --   vim.api.nvim_set_hl(0, "TreesitterContextLineNumber", { fg = "#88C0D0" })
  -- end,
}

return {
  { "akinsho/bufferline.nvim", enabled = false },
  { "folke/persistence.nvim", enabled = false },
  { "catppuccin/nvim", enabled = false },
  {
    "github/copilot.vim",
    enabled = false,
  },
  {
    "LazyVim/LazyVim",
    keys = {
      { "<leader>gs", false },
      { "<leader>sr", false },
    },
  },
  { "olimorris/codecompanion.nvim", enabled = false },
  { "ravitemer/codecompanion-history.nvim", enabled = false },
  { "ravitemer/mcphub.nvim", enabled = false },
  { "MeanderingProgrammer/render-markdown.nvim", enabled = false }, -- avoid loading via codecompanion
  -- If you had copilot-cmp before, keep it disabled to avoid dual engines
  { "zbirenbaum/copilot-cmp", enabled = false },
  { "iamcco/markdown-preview.nvim", enabled = false },
  -- Keep blink.cmp as your sole completion engine (LazyVim extra usually enables it)
}

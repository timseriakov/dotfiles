return {
  { "akinsho/bufferline.nvim", enabled = false },
  { "folke/persistence.nvim", enabled = false },
  { "catppuccin/nvim", enabled = false },
  {
    "github/copilot.vim",
    enabled = false,
  },
  {
    "zbirenbaum/copilot.lua",
    enabled = false,
  },
  {
    "LazyVim/LazyVim",
    keys = {
      { "<leader>gs", false },
      { "<leader>sr", false },
    },
  },
  { "ravitemer/mcphub.nvim", enabled = false },
  -- If you had copilot-cmp before, keep it disabled to avoid dual engines
  { "zbirenbaum/copilot-cmp", enabled = false },
  -- Keep blink.cmp as your sole completion engine (LazyVim extra usually enables it)

  -- Compatibility pins for plugins whose current main branches moved past NVIM 0.11
  -- or changed dependencies faster than LazyVim extras.
  { "stevearc/aerial.nvim", branch = "nvim-0.11" },
  {
    "ThePrimeagen/refactoring.nvim",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "nvim-treesitter/nvim-treesitter",
      "lewis6991/async.nvim",
    },
    config = function(_, opts)
      require("refactoring").setup(opts)
    end,
    keys = {
      {
        "<leader>rs",
        function()
          require("refactoring").select_refactor()
        end,
        mode = { "n", "x" },
        desc = "Refactor",
      },
    },
  },
}

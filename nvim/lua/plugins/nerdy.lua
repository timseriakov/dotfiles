return {
  {
    "2kabhishek/nerdy.nvim",
    dependencies = {
      "folke/snacks.nvim",
    },
    cmd = { "Nerdy", "NerdyRecents" },
    keys = {
      { "<leader>fn", "<cmd>Nerdy<cr>", desc = "Browse Nerd Icons" },
      { "<leader>fN", "<cmd>NerdyRecents<cr>", desc = "Recent Nerd Icons" },
    },
    config = function()
      require("nerdy").setup({
        max_recent = 20,
      })

      local ok, telescope = pcall(require, "telescope")
      if ok then
        telescope.load_extension("nerdy")
      end
    end,
  },
  {
    "LazyVim/LazyVim",
    keys = {
      { "<leader>fn", false },
    },
  },
}

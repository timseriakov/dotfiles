return {
  "oug-t/difi.nvim",
  event = "VeryLazy",
  keys = {
    -- Context-aware: Syncs with CLI target (e.g. main) or defaults to HEAD
    { "<leader>gd", ":Difi<CR>", desc = "Toggle Difi" },
  },
}

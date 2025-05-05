return {
  dir = vim.fn.stdpath("config") .. "/lua/modules/ai_commit",
  name = "ai-commit",
  lazy = false,
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-telescope/telescope.nvim",
  },
  config = function()
    require("modules.ai_commit.runner").setup()
  end,
}

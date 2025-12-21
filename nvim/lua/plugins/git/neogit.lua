return {
  "NeogitOrg/neogit",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "sindrets/diffview.nvim",
    "nvim-telescope/telescope.nvim",
  },
  config = function()
    local neogit = require("neogit")
    local diffview = require("diffview")

    neogit.setup({
      integrations = {
        diffview = true,
        telescope = true,
      },
    })

    diffview.setup({
      keymaps = {
        view = { ["q"] = "<cmd>DiffviewClose<CR>" },
        file_panel = { ["q"] = "<cmd>DiffviewClose<CR>" },
        file_history_panel = { ["q"] = "<cmd>DiffviewClose<CR>" },
      },
    })

    vim.keymap.set("n", "<leader>gnn", function()
      neogit.open()
    end, { desc = "Neogit: Open" })

    vim.keymap.set("n", "<leader>gnd", function()
      diffview.open("HEAD")
    end, { desc = "Neogit: Git Diff (HEAD)" })

    vim.keymap.set("n", "<leader>gnf", function()
      vim.cmd("DiffviewFileHistory %")
    end, { desc = "Neogit: Git File History (current file)" })
  end,
}

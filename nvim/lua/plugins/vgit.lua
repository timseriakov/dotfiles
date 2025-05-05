return {
  "tanvirtin/vgit.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-tree/nvim-web-devicons",
  },
  event = "VeryLazy",
  config = function()
    local vgit = require("vgit")

    vgit.setup({
      settings = {
        live_blame = {
          enabled = true,
        },
        live_gutter = {
          enabled = true,
          edge_navigation = true,
        },
        scene = {
          diff_preference = "split",
          keymaps = {
            quit = "q",
          },
        },
        diff_preview = {
          keymaps = {
            reset = "r",
            buffer_stage = "S",
            buffer_unstage = "U",
            buffer_hunk_stage = "s",
            buffer_hunk_unstage = "u",
            toggle_view = "t",
          },
        },
        project_diff_preview = {
          keymaps = {
            commit = "C",
            buffer_stage = "s",
            buffer_unstage = "u",
            buffer_hunk_stage = "gs",
            buffer_hunk_unstage = "gu",
            buffer_reset = "r",
            stage_all = "S",
            unstage_all = "U",
            reset_all = "R",
          },
        },
        project_logs_preview = {
          keymaps = {
            previous = "-",
            next = "=",
          },
        },
        project_commit_preview = {
          keymaps = {
            save = "S",
          },
        },
        project_stash_preview = {
          keymaps = {
            add = "A",
            apply = "a",
            pop = "p",
            drop = "d",
            clear = "C",
          },
        },
      },
    })

    local map = vim.keymap.set
    local opts = { noremap = true, silent = true, desc = "" }

    map("n", "<leader>gd", vgit.project_diff_preview, { desc = "VGit: Project Diff" })
    map("n", "<leader>gvh", vgit.buffer_history_preview, { desc = "VGit: File History" })
    map("n", "<leader>gvb", vgit.buffer_blame_preview, { desc = "VGit: Blame Preview" })
    map("n", "<leader>gF", vgit.buffer_diff_preview, { desc = "VGit: File Diff" })
    map("n", "<leader>gx", vgit.toggle_diff_preference, { desc = "Toggle VGit: Diff View" })
    map("n", "<leader>gu", vgit.buffer_reset, { desc = "VGit: Reset Buffer" })
    map("n", "<leader>ghs", vgit.buffer_hunk_stage, { desc = "VGit: Stage Hunk" })
    map("n", "<leader>ghr", vgit.buffer_hunk_reset, { desc = "VGit: Reset Hunk" })
    map("n", "<leader>ghp", vgit.buffer_hunk_preview, { desc = "VGit: Preview Hunk" })
    map("n", "<leader>gt", vgit.project_stash_preview, { desc = "VGit: sTash" })
  end,
}

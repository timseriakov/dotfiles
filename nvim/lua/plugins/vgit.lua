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
          enabled = false,
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

    -- global bindings
    map("n", "<leader>hv", vgit.buffer_hunk_preview, { desc = "VGit: Preview Hunk" })
    map("n", "<leader>hP", vgit.project_diff_preview, { desc = "VGit: Project Diff" })
    map("n", "<leader>hV", vgit.buffer_blame_preview, { desc = "VGit: Blame Preview" })
    map("n", "<leader>hf", vgit.buffer_diff_preview, { desc = "VGit: File Diff" })
    map("n", "<leader>hh", vgit.buffer_history_preview, { desc = "VGit: File History" })
    map("n", "<leader>ht", vgit.project_stash_preview, { desc = "VGit: Stash" })

    -- toggle diff mode with notification
    map(
      "n",
      "<leader>hx",
      (function()
        local current = "split"
        local icons = {
          split = "  split",
          unified = "  unified",
        }
        return function()
          vgit.toggle_diff_preference()
          current = (current == "split") and "unified" or "split"
          vim.notify("VGit diff mode: " .. icons[current], vim.log.levels.INFO, { title = "VGit" })
        end
      end)(),
      { desc = "VGit: Toggle Diff Mode" }
    )
  end,
}

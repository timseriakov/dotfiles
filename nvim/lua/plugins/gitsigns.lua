return {
  "lewis6991/gitsigns.nvim",
  enabled = true,
  dependencies = { "nvim-lua/plenary.nvim" },
  event = { "BufReadPre", "BufNewFile" },
  config = function()
    local gs = require("gitsigns")

    gs.setup({
      signs = {
        add = { text = "▎" },
        change = { text = "▎" },
        delete = { text = "" },
        topdelete = { text = "" },
        changedelete = { text = "▎" },
        untracked = { text = "▎" },
      },
      signs_staged = {
        add = { text = "▎" },
        change = { text = "▎" },
        delete = { text = "" },
        topdelete = { text = "" },
        changedelete = { text = "▎" },
      },
      signcolumn = true,
      attach_to_untracked = true,
      watch_gitdir = { follow_files = true },
      current_line_blame = false,
    })

    -- Nord colors
    vim.api.nvim_set_hl(0, "GitSignsAdd", { fg = "#A3BE8C" })
    vim.api.nvim_set_hl(0, "GitSignsChange", { fg = "#EBCB8B" })
    vim.api.nvim_set_hl(0, "GitSignsDelete", { fg = "#BF616A" })

    local function map(mode, lhs, rhs, desc)
      vim.keymap.set(mode, lhs, rhs, { silent = true, desc = desc })
    end

    -- navigation
    map("n", "]h", function()
      if vim.wo.diff then
        vim.cmd.normal({ "]c", bang = true })
      else
        gs.nav_hunk("next")
      end
    end, "GSigns: Next Hunk")
    map("n", "[h", function()
      if vim.wo.diff then
        vim.cmd.normal({ "[c", bang = true })
      else
        gs.nav_hunk("prev")
      end
    end, "GSigns: Prev Hunk")

    -- actions
    map({ "n", "v" }, "<leader>hs", "<cmd>Gitsigns stage_hunk<CR>", "GSigns: Stage Hunk")
    map({ "n", "v" }, "<leader>hr", "<cmd>Gitsigns reset_hunk<CR>", "GSigns: Reset Hunk")
    map("n", "<leader>hS", gs.stage_buffer, "GSigns: Stage Buffer")
    map("n", "<leader>hu", gs.undo_stage_hunk, "GSigns: Undo Stage Hunk")
    map("n", "<leader>hR", gs.reset_buffer, "GSigns: Reset Buffer")
    map("n", "<leader>hp", gs.preview_hunk_inline, "GSigns: Preview Hunk Inline")
    map("n", "<leader>hb", function()
      gs.blame_line({ full = true })
    end, "GSigns: Blame Line")
    map("n", "<leader>hB", gs.blame, "GSigns: Blame Buffer")
    map("n", "<leader>hd", gs.diffthis, "GSigns: Diff This")
    map("n", "<leader>hD", function()
      gs.diffthis("~")
    end, "GSigns: Diff This ~")

    -- text object
    map({ "o", "x" }, "ih", ":<C-U>Gitsigns select_hunk<CR>", "GSigns: Select Hunk")
  end,
}

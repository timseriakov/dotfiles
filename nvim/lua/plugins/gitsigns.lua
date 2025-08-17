-- Force-install and load gitsigns; provide keymaps under <leader>h…
return {
  "lewis6991/gitsigns.nvim",
  enabled = true, -- override any accidental disable
  dependencies = { "nvim-lua/plenary.nvim" },
  event = { "BufReadPre", "BufNewFile" }, -- load before buffers attach
  config = function()
    local gs = require("gitsigns")

    require("gitsigns").setup({
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
      attach_to_untracked = true, -- ensure on_attach even for new files
      watch_gitdir = { follow_files = true },
      on_attach = function(buf)
        local function map(mode, lhs, rhs, desc)
          vim.keymap.set(mode, lhs, rhs, { buffer = buf, silent = true, desc = desc })
        end

        -- Navigation
        map("n", "]h", function()
          if vim.wo.diff then
            vim.cmd.normal({ "]c", bang = true })
          else
            gs.nav_hunk("next")
          end
        end, "Next Hunk")
        map("n", "[h", function()
          if vim.wo.diff then
            vim.cmd.normal({ "[c", bang = true })
          else
            gs.nav_hunk("prev")
          end
        end, "Prev Hunk")

        -- Actions under <leader>h…
        map({ "n", "v" }, "<leader>hs", "<cmd>Gitsigns stage_hunk<CR>", "Stage Hunk")
        map({ "n", "v" }, "<leader>hr", "<cmd>Gitsigns reset_hunk<CR>", "Reset Hunk")
        map("n", "<leader>hS", gs.stage_buffer, "Stage Buffer")
        map("n", "<leader>hu", gs.undo_stage_hunk, "Undo Stage Hunk")
        map("n", "<leader>hR", gs.reset_buffer, "Reset Buffer")
        map("n", "<leader>hp", gs.preview_hunk_inline, "Preview Hunk Inline")
        map("n", "<leader>hb", function()
          gs.blame_line({ full = true })
        end, "Blame Line")
        map("n", "<leader>hB", gs.blame, "Blame Buffer")
        map("n", "<leader>hd", gs.diffthis, "Diff This")
        map("n", "<leader>hD", function()
          gs.diffthis("~")
        end, "Diff This ~")

        -- Text object
        map({ "o", "x" }, "ih", ":<C-U>Gitsigns select_hunk<CR>", "GitSigns Select Hunk")
      end,
    })

    -- Global fallback (works even if buffer map missed for some reason)
    local function gmap(mode, lhs, rhs, desc)
      vim.keymap.set(mode, lhs, rhs, { silent = true, desc = desc })
    end
    gmap({ "n", "v" }, "<leader>hs", "<cmd>Gitsigns stage_hunk<CR>", "Stage Hunk")
    gmap({ "n", "v" }, "<leader>hr", "<cmd>Gitsigns reset_hunk<CR>", "Reset Hunk")
    gmap("n", "]h", function()
      gs.nav_hunk("next")
    end, "Next Hunk")
    gmap("n", "[h", function()
      gs.nav_hunk("prev")
    end, "Prev Hunk")
  end,
}

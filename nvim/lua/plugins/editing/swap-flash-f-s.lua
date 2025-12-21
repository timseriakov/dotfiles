return {
  {
    "folke/flash.nvim",
    event = "VeryLazy",
    opts = {
      char = {
        enabled = false,
      },
    },
    config = function(_, opts)
      require("flash").setup(opts)

      vim.api.nvim_create_autocmd("User", {
        pattern = "VeryLazy",
        callback = function()
          for _, mode in ipairs({ "n", "x", "o" }) do
            for _, key in ipairs({ "f", "F", "t", "T", "s" }) do
              pcall(vim.keymap.del, mode, key)
            end
          end
        end,
      })

      vim.schedule(function()
        local flash = require("flash")

        vim.keymap.set({ "n", "x", "o" }, "f", flash.jump, {
          desc = "Flash jump (default)",
          noremap = true,
          silent = true,
        })

        vim.keymap.set({ "n", "x", "o" }, "s", flash.treesitter, {
          desc = "Flash treesitter",
          noremap = true,
          silent = true,
        })

        vim.keymap.set({ "n", "x", "o" }, "F", function()
          flash.jump({
            pattern = "^",
            search = { mode = "search" },
          })
        end, {
          desc = "Flash line labels (top)",
          noremap = true,
          silent = true,
        })
      end)
    end,
  },

  {
    "numToStr/Comment.nvim",
    keys = {
      {
        "S",
        mode = "x",
        function()
          require("Comment.api").toggle.linewise(vim.fn.visualmode())
        end,
        desc = "Toggle comment (visual)",
      },
    },
  },

  {
    "nvim-treesitter/nvim-treesitter-textobjects",
    opts = {
      move = {
        enable = false,
        set_jumps = false,
      },
    },
  },
}

return {
  {
    "NickvanDyke/opencode.nvim",
    dependencies = {
      -- Recommended for `ask()` and `select()`.
      -- Required for `snacks` provider.
      ---@module 'snacks' <- Loads `snacks.nvim` types for configuration intellisense.
      { "folke/snacks.nvim" },
    },
    config = function()
      ---@type opencode.Opts
      vim.g.opencode_opts = {
        -- Your configuration, if any — see `lua/opencode/config.lua`, or "goto definition".
        select = {
          snacks = {
            layout = {
              preset = "select",
            },
          },
        },
      }

      -- Required for `opts.events.reload`.
      vim.o.autoread = true

      -- Keymaps: Space A and then letter
      -- Ask
      vim.keymap.set({ "n", "x" }, "<leader>aa", function() require("opencode").ask("@this: ", { submit = true }) end, { desc = "Opencode: Ask" })
      -- Select (Actions)
      vim.keymap.set({ "n", "x" }, "<leader>as", function() require("opencode").select() end, { desc = "Opencode: Select/Actions" })
      -- Toggle
      vim.keymap.set({ "n", "t" }, "<leader>at", function() require("opencode").toggle() end, { desc = "Opencode: Toggle" })
      
      -- Operator (Range) - Space A O
      vim.keymap.set({ "n", "x" }, "<leader>ao", function() return require("opencode").operator("@this ") end, { expr = true, desc = "Opencode: Operator (Range)" })
      -- Operator (Line) - Space A L
      vim.keymap.set("n", "<leader>al", function() return require("opencode").operator("@this ") .. "_" end, { expr = true, desc = "Opencode: Operator (Line)" })

      -- Standard Opencode bindings (go / goo) as requested
      vim.keymap.set({ "n", "x" }, "go",  function() return require("opencode").operator("@this ") end,        { expr = true, desc = "Opencode: Operator (Range)" })
      vim.keymap.set("n",          "goo", function() return require("opencode").operator("@this ") .. "_" end, { expr = true, desc = "Opencode: Operator (Line)" })

      -- Scrolling in session (Global)
      vim.keymap.set("n", "<leader>ak", function() require("opencode").command("session.half.page.up") end, { desc = "Opencode: Scroll up" })
      vim.keymap.set("n", "<leader>aj", function() require("opencode").command("session.half.page.down") end, { desc = "Opencode: Scroll down" })

      -- Buffer-local keymaps for the Opencode terminal
      vim.api.nvim_create_autocmd("FileType", {
        pattern = "opencode_terminal",
        callback = function(event)
          local map = function(mode, lhs, rhs, desc)
            vim.keymap.set(mode, lhs, rhs, { buffer = event.buf, desc = "Opencode: " .. desc })
          end

          -- Navigation
          map("n", "gg", function() require("opencode").command("session.first") end, "Jump to start")
          map("n", "G", function() require("opencode").command("session.last") end, "Jump to end")
          map("n", "<C-u>", function() require("opencode").command("session.half.page.up") end, "Scroll up")
          map("n", "<C-d>", function() require("opencode").command("session.half.page.down") end, "Scroll down")
          map("n", "<C-b>", function() require("opencode").command("session.page.up") end, "Page up")
          map("n", "<C-f>", function() require("opencode").command("session.page.down") end, "Page down")

          -- Actions
          map("n", "u", function() require("opencode").command("session.undo") end, "Undo")
          map("n", "<C-r>", function() require("opencode").command("session.redo") end, "Redo")
          map("n", "<Tab>", function() require("opencode").command("agent.cycle") end, "Cycle agent")
        end,
      })
    end,
  },
}

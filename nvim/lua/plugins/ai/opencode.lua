return {
  {
    "NickvanDyke/opencode.nvim",
    dependencies = {
      -- Recommended for `ask()` and `select()`.
      -- Required for `snacks` provider.
      ---@module 'snacks' <- Loads `snacks.nvim` types for configuration intellisense.
      { "folke/snacks.nvim", opts = { input = {}, picker = {}, terminal = {} } },
    },
    config = function()
      ---@type opencode.Opts
      vim.g.opencode_opts = {
        -- Your configuration, if any — see `lua/opencode/config.lua`, or "goto definition".
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
      -- Operator (Range)
      vim.keymap.set({ "n", "x" }, "<leader>ao", function() return require("opencode").operator("@this ") end, { expr = true, desc = "Opencode: Operator (Range)" })
      -- Operator (Line)
      vim.keymap.set("n", "<leader>al", function() return require("opencode").operator("@this ") .. "_" end, { expr = true, desc = "Opencode: Operator (Line)" })

      -- Scrolling in session
      vim.keymap.set("n", "<S-C-u>", function() require("opencode").command("session.half.page.up") end, { desc = "Opencode: Half page up" })
      vim.keymap.set("n", "<S-C-d>", function() require("opencode").command("session.half.page.down") end, { desc = "Opencode: Half page down" })
    end,
  },
}

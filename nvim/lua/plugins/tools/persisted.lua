return {
  "olimorris/persisted.nvim",
  lazy = false,
  priority = 1000, -- load early
  config = function()
    require("persisted").setup({
      autostart = true,
      autoload = false, -- don't auto-restore on start; keep dashboard default
      follow_cwd = true,
      use_git_branch = true,
      silent = false,
    })

    local persisted = require("persisted")
    local map = vim.keymap.set

    local notify_group = vim.api.nvim_create_augroup("PersistedUserNotifications", { clear = true })
    vim.api.nvim_create_autocmd("User", {
      group = notify_group,
      pattern = "PersistedDeletePost",
      callback = function(event)
        local path = event.data and event.data.path or nil
        if path then
          vim.notify("Session deleted: " .. vim.fn.fnamemodify(path, ":~"), vim.log.levels.INFO)
        else
          vim.notify("Session deleted", vim.log.levels.INFO)
        end
      end,
    })

    map("n", "<leader>qr", "<cmd>Telescope persisted<CR>", { desc = "Restore Session" })
    map("n", "<leader>ql", function()
      persisted.load({ last = true })
    end, { desc = "Load Last Session" })
    map("n", "<leader>qa", function()
      persisted.stop()
      vim.notify(" Session saving disabled for this session", vim.log.levels.INFO)
    end, { desc = "Disable Session Saving" })
    map("n", "<leader>qs", function()
      persisted.save()
      vim.notify("💾 Session saved", vim.log.levels.INFO)
    end, { desc = "Save Session Now" })
    map("n", "<leader>qd", function()
      persisted.delete()
    end, { desc = "Delete Session" })
  end,
}

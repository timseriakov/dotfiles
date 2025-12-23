return {
  "folke/snacks.nvim",
  priority = 1000,
  lazy = false,
  opts = {
    image = {
      enabled = true,
      doc = {
        inline = true,
        float = true,
      },
      resolve = function(file, src)
        src = src:gsub("%%(%x%x)", function(h) return string.char(tonumber(h, 16)) end)
        
        local cleaned = src
          :gsub("^%[%[", "")
          :gsub("%]%]$", "")
        
        local doc_dir = vim.fs.dirname(file)
        
        local direct_path = doc_dir .. "/" .. cleaned
        if vim.uv.fs_stat(direct_path) then
          return direct_path
        end
        
        local attachments_path = doc_dir .. "/-attachments-/" .. cleaned
        if vim.uv.fs_stat(attachments_path) then
          return attachments_path
        end
        
        return nil
      end,
    },
    bigfile = { enabled = true },
    input = { enabled = true },
    picker = { enabled = true },
    terminal = { enabled = true },
    notifier = { enabled = false },
    quickfile = { enabled = true },
    statuscolumn = { enabled = true },
    words = { enabled = true },
    styles = {
      notification = {
        wo = { wrap = true }
      }
    }
  },
  keys = {
    { "<leader>n", function() Snacks.notifier.show_history() end, desc = "Notification History" },
    { "<leader>bd", function() Snacks.bufdelete() end, desc = "Delete Buffer" },
    { "<leader>cR", function() Snacks.rename.rename_file() end, desc = "Rename File" },
    { "<leader>gB", function() Snacks.gitbrowse() end, desc = "Git Browse" },
    { "<leader>gb", function() Snacks.git.blame_line() end, desc = "Git Blame Line" },
    { "<leader>gf", function() Snacks.lazygit.log_file() end, desc = "Lazygit Current File History" },
    { "<leader>gg", function() Snacks.lazygit() end, desc = "Lazygit" },
    { "<leader>gl", function() Snacks.lazygit.log() end, desc = "Lazygit Log (CWD)" },
    { "<leader>un", function() Snacks.notifier.hide() end, desc = "Dismiss All Notifications" },
    { "<c-/>",      function() Snacks.terminal() end, desc = "Toggle Terminal" },
    { "<c-_>",      function() Snacks.terminal() end, desc = "which_key_ignore" },
  },
}
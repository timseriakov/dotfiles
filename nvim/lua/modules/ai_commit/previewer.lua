local Job = require("plenary.job")
local previewers = require("telescope.previewers")
local putils = require("telescope.previewers.utils")

local M = {}

M.diff_cached_previewer = previewers.new_buffer_previewer({
  title = "Files (staged)",
  define_preview = function(self, _entry, _status)
    Job:new({
      command = "git",
      args = { "diff", "--cached", "--name-only" },
      on_exit = function(j)
        local result = j:result()
        if not result or vim.tbl_isempty(result) then
          result = { "-- no staged files --" }
        end
        vim.schedule(function()
          vim.api.nvim_buf_set_lines(self.state.bufnr, 0, -1, false, result)
        end)
      end,
    }):start()
  end,
})

return M

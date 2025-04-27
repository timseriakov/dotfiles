local M = {}

function M.split_definition()
  local cur_win = vim.api.nvim_get_current_win()

  local params = vim.lsp.util.make_position_params(0, "utf-16")

  local found_definition = false

  vim.lsp.buf_request(0, "textDocument/definition", params, function(err, result, _ctx, _config)
    if err then
      vim.notify("[Peek] LSP error", vim.log.levels.ERROR)
      return
    end

    if result and not vim.tbl_isempty(result) then
      found_definition = true

      local telescope = require("telescope.builtin")

      if vim.tbl_islist(result) and #result > 1 then
        telescope.lsp_definitions()
        return
      end

      local def = vim.tbl_islist(result) and result[1] or result
      if not def then
        vim.notify("[Peek] Invalid definition structure", vim.log.levels.ERROR)
        return
      end

      local uri = def.uri or def.targetUri
      local range = def.range or def.targetRange

      if not uri or not range then
        vim.notify("[Peek] Invalid definition fields", vim.log.levels.ERROR)
        return
      end

      local filename = vim.uri_to_fname(uri)
      local lnum = range.start.line + 1
      local col = range.start.character

      vim.cmd("vsplit " .. vim.fn.fnameescape(filename))
      vim.api.nvim_win_set_cursor(0, { lnum, col })

      local peek_win = vim.api.nvim_get_current_win()

      vim.api.nvim_create_autocmd("WinClosed", {
        once = true,
        callback = function(event)
          if tonumber(event.match) == peek_win and vim.api.nvim_win_is_valid(cur_win) then
            vim.api.nvim_set_current_win(cur_win)
          end
        end,
      })
    end
  end)

  vim.defer_fn(function()
    if not found_definition then
      vim.notify("[Peek] No definition found", vim.log.levels.WARN)
    end
  end, 200)
end

return M

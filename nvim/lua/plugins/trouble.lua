-- lua/plugins/trouble.lua

return {
  "folke/trouble.nvim",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  opts = {
    ---
  },
  keys = {
    {
      "<leader>xy",
      function()
        local diagnostics = vim.diagnostic.get(0)
        if not diagnostics or #diagnostics == 0 then
          print("No diagnostics in current buffer.")
          return
        end
        local lines_to_copy = {}
        for _, d in ipairs(diagnostics) do
          table.insert(
            lines_to_copy,
            string.format("L%d: [%s]: %s", d.lnum + 1, vim.diagnostic.severity[d.severity]:upper(), d.message)
          )
        end
        local content = table.concat(lines_to_copy, "\n")

        vim.fn.system("pbcopy", content)

        print("Copied " .. #diagnostics .. " buffer diagnostic(s) to system clipboard.")
      end,
      desc = "Copy buffer diagnostics to clipboard",
    },

    {
      "<leader>xY",
      function()
        local diagnostics = vim.diagnostic.get()
        if not diagnostics or #diagnostics == 0 then
          print("No diagnostics in workspace.")
          return
        end
        local lines_to_copy = {}
        for _, d in ipairs(diagnostics) do
          local filename = vim.api.nvim_buf_get_name(d.bufnr)
          table.insert(
            lines_to_copy,
            string.format(
              "%s:%d: [%s]: %s",
              vim.fn.fnamemodify(filename, ":."),
              d.lnum + 1,
              vim.diagnostic.severity[d.severity]:upper(),
              d.message
            )
          )
        end
        local content = table.concat(lines_to_copy, "\n")

        vim.fn.system("pbcopy", content)

        print("Copied " .. #diagnostics .. " workspace diagnostic(s) to system clipboard.")
      end,
      desc = "Copy all workspace diagnostics to clipboard",
    },
  },
}

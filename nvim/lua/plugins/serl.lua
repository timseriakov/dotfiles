return {
  "akinsho/toggleterm.nvim",
  opts = function(_)
    local Terminal = require("toggleterm.terminal").Terminal

    local serpl_ast = Terminal:new({
      cmd = "serpl",
      hidden = true,
      direction = "float",
      float_opts = {
        border = "none",
        width = vim.o.columns,
        height = vim.o.lines - 2,
      },
    })

    vim.keymap.set("n", "<leader>sr", function()
      serpl_ast:toggle()
    end, { desc = "Search and Replace" })
  end,
}

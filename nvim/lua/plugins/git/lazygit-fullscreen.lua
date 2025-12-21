return {
  "kdheepak/lazygit.nvim",
  keys = {
    {
      "<leader>gg",
      function()
        local Terminal = require("toggleterm.terminal").Terminal
        local lazygit = Terminal:new({
          cmd = "lazygit",
          hidden = true,
          direction = "float",
          float_opts = {
            border = "none",
            width = vim.o.columns,
            height = vim.o.lines,
            row = 0,
            col = 0,
          },
          on_open = function(term)
            vim.api.nvim_buf_set_keymap(term.bufnr, "n", "q", "<cmd>close<CR>", { noremap = true, silent = true })
          end,
        })
        lazygit:toggle()
      end,
      desc = "LazyGit (fullscreen)",
    },
  },
}

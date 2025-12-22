return {
  "antosha417/nvim-compare-with-clipboard",
  event = "BufReadPost",
  opts = {
    vertical_split = true,
    register = "+",
  },
  config = function(_, opts)
    local cmp = require("compare-with-clipboard")
    cmp.setup(opts)

    vim.keymap.set({ "n", "v" }, "<leader>bc", function()
      local mode = vim.fn.mode()
      local temp_reg = "z"

      if mode == "v" or mode == "V" then
        local start_pos = vim.fn.getpos("v")
        local end_pos = vim.fn.getpos(".")
        local start_line = math.min(start_pos[2], end_pos[2])
        local end_line = math.max(start_pos[2], end_pos[2])
        local lines = vim.api.nvim_buf_get_lines(0, start_line - 1, end_line, false)
        vim.fn.setreg(temp_reg, lines)
      else
        local lines = vim.api.nvim_buf_get_lines(0, 0, -1, false)
        vim.fn.setreg(temp_reg, lines)
      end

      cmp.compare_registers(temp_reg, opts.register)

      vim.defer_fn(function()
        for _, win in ipairs(vim.api.nvim_list_wins()) do
          if vim.wo[win].diff then
            local buf = vim.api.nvim_win_get_buf(win)
            vim.api.nvim_buf_set_keymap(
              buf,
              "n",
              "q",
              [[:diffoff! | wincmd l | close | wincmd h | close<CR>]],
              { noremap = true, silent = true }
            )
          end
        end
      end, 50)
    end, { desc = "Compare Buffer with clipboard" })
  end,
}

local function get_project_root()
  local root = vim.fn.systemlist("git rev-parse --show-toplevel 2>/dev/null")[1]
  if root ~= nil and root ~= "" then
    return root
  end

  return vim.fn.getcwd()
end

local function toggle_float_term(cmd)
  local ok, terminal = pcall(require, "toggleterm.terminal")
  if not ok then
    vim.notify("toggleterm.nvim not available", vim.log.levels.WARN)
    return
  end

  terminal.Terminal
    :new({
      cmd = cmd,
      dir = get_project_root(),
      hidden = true,
      direction = "float",
      float_opts = {
        border = "single",
        width = math.floor(vim.o.columns * 0.95),
        height = math.floor(vim.o.lines * 0.9),
      },
      on_open = function(term)
        vim.api.nvim_buf_set_keymap(term.bufnr, "n", "q", "<cmd>close<CR>", { noremap = true, silent = true })
      end,
    })
    :toggle()
end

return {
  {
    "likec4/likec4.nvim",
    lazy = false,
    init = function()
      vim.filetype.add({
        extension = {
          c4 = "likec4",
        },
      })
    end,
  },

  -- LikeC4 CLI helpers (optional but convenient)
  {
    "akinsho/toggleterm.nvim",
    optional = true,
    keys = {
      {
        "<leader>4c",
        function()
          toggle_float_term("likec4 start")
        end,
        desc = "LikeC4: Start dev server",
      },
      {
        "<leader>4t",
        function()
          toggle_float_term("likec4 validate")
        end,
        desc = "LikeC4: Validate",
      },
    },
  },
}

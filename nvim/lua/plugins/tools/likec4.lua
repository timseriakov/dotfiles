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
    ft = { "likec4" },
    init = function()
      vim.filetype.add({
        extension = {
          c4 = "likec4",
        },
      })

      vim.api.nvim_create_autocmd("FileType", {
        pattern = "likec4",
        callback = function(args)
          if vim.fn.executable("likec4-language-server") ~= 1 then
            return
          end

          local clients = vim.lsp.get_clients({ bufnr = args.buf })
          for _, client in ipairs(clients) do
            if client.name == "likec4" then
              return
            end
          end

          local bufname = vim.api.nvim_buf_get_name(args.buf)
          local startpath = (bufname ~= "" and bufname) or vim.loop.cwd()
          local root_dir = vim.fs.root(startpath, { "likec4.config.json", ".git" }) or vim.loop.cwd()

          vim.lsp.start({
            name = "likec4",
            cmd = { "likec4-language-server", "--stdio" },
            root_dir = root_dir,
          })
        end,
      })
    end,
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

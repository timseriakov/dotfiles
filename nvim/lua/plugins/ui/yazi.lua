return {
  "mikavilpas/yazi.nvim",
  event = "VeryLazy",
  dependencies = {
    -- check the installation instructions at
    -- https://github.com/folke/snacks.nvim
    "folke/snacks.nvim",
  },
  keys = {
    {
      "<leader>ff",
      mode = { "n", "v" },
      function()
        require("toggleterm.terminal").Terminal:new({
          cmd = "che",
          direction = "float",
          float_opts = {
            border = "rounded",
            width = math.floor(vim.o.columns * 0.9),
            height = math.floor(vim.o.lines * 0.85),
          },
          highlights = {
            FloatBorder = { guifg = "#81A1C1", guibg = "#2E3440" },
            NormalFloat = { guibg = "#2E3440" },
          },
        }):toggle()
      end,
      desc = "Che",
    },
    {
      "<leader>fj",
      "<cmd>Yazi cwd<cr>",
      desc = "Yazi (project root)",
    },
    {
      "<leader>fl",
      "<cmd>Yazi toggle<cr>",
      desc = "Yazi (resume session)",
    },
  },
  opts = {
    open_for_directories = false,
    floating_window_scaling_factor = 0.85,
    yazi_floating_window_border = "rounded",
    keymaps = {
      show_help = "<f1>",
    },
  },
  -- 👇 if you use `open_for_directories=true`, this is recommended
  init = function()
    -- More details: https://github.com/mikavilpas/yazi.nvim/issues/802
    -- vim.g.loaded_netrw = 1
    vim.g.loaded_netrwPlugin = 1
  end,
}

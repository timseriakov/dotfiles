-- plugins/leetcode.lua

return {
  "kawre/leetcode.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "MunifTanjim/nui.nvim",
    "nvim-telescope/telescope.nvim", -- или "ibhagwan/fzf-lua"
    -- "nvim-tree/nvim-web-devicons", -- (опционально, для иконок)
  },
  cmd = "Leet", -- загружать при вызове команды
  opts = {
    lang = "typescript", -- или "cpp", "rust", "python3", и т.д.
    cn = {
      enabled = false,
      translator = true,
      translate_problems = true,
    },
    plugins = {
      non_standalone = true, -- можно вызывать внутри текущей сессии Neovim
    },
    description = {
      position = "left",
      width = "40%",
      show_stats = true,
    },
    console = {
      open_on_runcode = true,
      dir = "row",
      size = {
        width = "90%",
        height = "75%",
      },
      result = { size = "60%" },
      testcase = { size = "40%", virt_text = true },
    },
    keys = {
      toggle = { "q" },
      confirm = { "<CR>" },
      reset_testcases = "r",
      use_testcase = "U",
      focus_testcases = "H",
      focus_result = "L",
    },
  },
}

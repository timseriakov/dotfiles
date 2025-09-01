return {
  "kawre/leetcode.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "MunifTanjim/nui.nvim",
    "nvim-telescope/telescope.nvim",
  },
  cmd = "Leet",
  opts = {
    lang = "javascript",
    cn = {
      enabled = false,
      translator = true,
      translate_problems = true,
    },
    plugins = {
      non_standalone = true,
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

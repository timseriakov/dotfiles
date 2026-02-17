return {
  "folke/noice.nvim",
  keys = {
    { "<leader>n", function() require("noice").cmd("history") end, desc = "Noice History" },
  },
  opts = {
    commands = {
      history = {
        view = "popup",
      },
    },
    views = {
      mini = {
        win_options = {
          winhighlight = "Normal:NoiceMini,FloatBorder:NoiceMiniBorder",
        },
      },
    },
  },
  config = function(_, opts)
    require("noice").setup(opts)
    vim.api.nvim_set_hl(0, "NoiceMini", { fg = "#88C1D0", bg = "#2E3440" })
  end,
}

return {
  "folke/noice.nvim",
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
    routes = {
      {
        filter = {
          event = "notify",
          kind = "debug",
          find = "Ignoring completion, line number is not the current line.",
        },
        opts = { skip = true },
      },
    },
  },
  config = function(_, opts)
    require("noice").setup(opts)
    vim.api.nvim_set_hl(0, "NoiceMini", { fg = "#88C1D0", bg = "#2E3440" })
  end,
}

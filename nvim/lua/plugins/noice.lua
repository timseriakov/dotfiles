return {
  "folke/noice.nvim",
  opts = {
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
          find = "eslint",
        },
        opts = { skip = true },
      },
      {
        filter = {
          event = "msg_show",
          kind = "",
          find = "eslint",
        },
        opts = { skip = true },
      },
      {
        filter = {
          event = "lsp",
          kind = "message",
          find = "eslint",
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

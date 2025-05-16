return {
  "folke/noice.nvim",
  enabled = not vim.g.started_by_firenvim,
  cond = not vim.g.started_by_firenvim,
  opts = {
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

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
          event = "diagnostic_set",
          cond = function(message)
            if not message.opts or not message.opts.diagnostics then
              return false
            end
            for _, d in ipairs(message.opts.diagnostics) do
              if d.source == "eslint" then
                return true
              end
            end
            return false
          end,
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

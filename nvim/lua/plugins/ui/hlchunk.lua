return {
  "shellRaining/hlchunk.nvim",
  event = { "BufReadPre", "BufNewFile" },
  config = function()
    require("hlchunk").setup({
      chunk = {
        enable = true,
        use_treesitter = true,
        style = {
          { fg = "#88C0D0" },
        },
        chars = {
          right_arrow = "─",
        },
        duration = 80,
        delay = 70,
      },
      indent = {
        enable = true,
        chars = { "│" },
        style = {
          { fg = "#4C566A" },
        },
      },
      line_num = {
        enable = true,
        style = {
          { fg = "#81A1C1" },
        },
      },
      -- blank = {
      --   enable = true,
      --   chars = { "⋅" },
      --   style = {
      --     { fg = "#3B4252" },
      --   },
      -- },
    })
  end,
}

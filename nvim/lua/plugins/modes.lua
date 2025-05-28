return {
  "timseriakov/modes.nvim",
  event = "BufReadPre",
  config = function()
    require("modes").setup({
      colors = {
        copy = "#ebcb8b",
        delete = "#bf616a",
        insert = "#88c0d0",
        visual = "#A3BE8C",
      },
      line_opacity = 0.08,
      set_cursor = true,
      set_cursorline = true,
      set_number = true,
      set_signcolumn = true,
      ignore = { "!neo-tree", "lazy", "TelescopePrompt", "!minifiles" },
    })
  end,
}

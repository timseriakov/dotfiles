return {
  "nvim-treesitter/nvim-treesitter-context",
  event = "VeryLazy",
  opts = {
    enable = true,
    max_lines = 2,
    line_numbers = true,
    trim_scope = "outer",
    mode = "cursor",
    separator = "─",
    zindex = 50,
  },
}

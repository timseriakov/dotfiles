return {
  {
    "gbprod/nord.nvim",
    opts = {
      -- your configuration comes here
      -- or leave it empty to use the default settings
      transparent = false, -- Enable this to disable setting the background color
      terminal_colors = true, -- Configure the colors used when opening a `:terminal` in Neovim
      diff = { mode = "bg" }, -- enables/disables colorful backgrounds when used in diff mode. values : [bg|fg]
      borders = true, -- Enable the border between verticaly split windows visible
      errors = { mode = "bg" }, -- Display mode for errors and diagnostics
      -- values : [bg|fg|none]
      search = { theme = "vim" }, -- theme for highlighting search results
      -- values : [vim|vscode]
      styles = {
        -- Style to be applied to different syntax groups
        -- Value is any valid attr-list value for `:help nvim_set_hl`
        comments = { italic = true },
        keywords = {},
        functions = {},
        variables = {},
      },
    },
  },
}
-- 	"m4xshen/hardtime.nvim",
-- 	dependencies = { "MunifTanjim/nui.nvim", "nvim-lua/plenary.nvim" },
-- 	opts = {},
-- },

return {
  {
    "gbprod/nord.nvim",
    opts = {
      -- your configuration comes here
      -- or leave it empty to use the default settings
      transparent = true, -- Enable this to disable setting the background color
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
  {
    "AlexvZyl/nordic.nvim",
    opts = {
      bold_keywords = false,
      -- Enable italic comments.
      italic_comments = true,
      -- Enable general editor background transparency.
      transparent_bg = true,
      -- Enable brighter float border.
      bright_border = true,
      -- Reduce the overall amount of blue in the theme (diverges from base Nord).
      reduced_blue = false,
      -- Swap the dark background with the normal one.
      swap_backgrounds = false,
      -- Override the styling of any highlight group.
      override = {},
      -- Cursorline options.  Also includes visual/selection.
      cursorline = {
        -- Bold font in cursorline.
        bold = false,
        -- Bold cursorline number.
        bold_number = true,
        -- Available styles: 'dark', 'light'.
        theme = "dark",
        -- Blending the cursorline bg with the buffer bg.
        blend = 0.7,
      },
      noice = {
        -- Available styles: `classic`, `flat`.
        style = "flat",
      },
      telescope = {
        -- Available styles: `classic`, `flat`.
        style = "flat",
      },
      leap = {
        -- Dims the backdrop when using leap.
        dim_backdrop = false,
      },
      ts_context = {
        -- Enables dark background for treesitter-context window
        dark_background = true,
      },
    },
  },
}

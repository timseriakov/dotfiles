return {
  "rmagatti/goto-preview",
  dependencies = { "rmagatti/logger.nvim" },
  event = "BufEnter",
  config = function()
    require("goto-preview").setup({
      width = 120,
      height = 20,
      border = { "↖", "─", "┐", "│", "┘", "─", "└", "│" },
      default_mappings = false,
      resizing_mappings = true,
      focus_on_open = true,
      dismiss_on_move = false,
      force_close = true,
      bufhidden = "wipe",
      stack_floating_preview_windows = true,
      same_file_float_preview = true,
      preview_window_title = { enable = true, position = "left" },
      references = {
        provider = "telescope",
        telescope = require("telescope.themes").get_dropdown({ hide_preview = false }),
      },
      vim_ui_input = true,
    })
  end,
}

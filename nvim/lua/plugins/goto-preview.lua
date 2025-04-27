return {
  "rmagatti/goto-preview",
  dependencies = { "rmagatti/logger.nvim" }, -- обязательная зависимость
  event = "BufEnter", -- загружать при открытии любого файла
  config = function()
    require("goto-preview").setup({
      width = 120,
      height = 20,
      border = { "↖", "─", "┐", "│", "┘", "─", "└", "│" },
      default_mappings = false, -- мы настроим свои биндинги
      resizing_mappings = true, -- чтобы можно было стрелками менять размер окна
      focus_on_open = true,
      dismiss_on_move = false, -- чтобы окно не закрывалось, если ты двигаешь курсор
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

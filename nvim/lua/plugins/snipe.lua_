return {
  "leath-dub/snipe.nvim",
  keys = {
    {
      "g<leader>",
      function()
        require("snipe").open_buffer_menu()
      end,
      desc = "Open Snipe buffer menu",
    },
    {
      "ff",
      function()
        local snipe = require("snipe")
        ---@diagnostic disable-next-line: undefined-field
        local now = (vim.uv or vim.loop).hrtime() / 1e6 -- безопасный вызов hrtime()
        snipe.open_buffer_menu()
      end,
      desc = "Snipe buffer menu (ff)",
    },
  },
  opts = {
    ui = {
      max_height = -1, -- авто-высота под список
      position = "center", -- окно по центру экрана
      open_win_override = {
        border = "single", -- рамка окна
        -- title = "Buffer Menu",   -- можно включить заголовок окна
      },
      preselect_current = false, -- не выделять текущий буфер
      preselect = nil, -- без предвыбора
      text_align = "left", -- выравнивание текста
      -- buffer_format можно включить при необходимости
    },
    hints = {
      dictionary = "asdfgqwertzxcvb", -- допустимые символы для меток
    },
    navigate = {
      next_page = "J", -- следующая страница
      prev_page = "K", -- предыдущая страница
      under_cursor = "<CR>", -- выбрать элемент под курсором
      cancel_snipe = "<ESC>", -- отмена
      close_buffer = "D", -- закрыть буфер
      open_vsplit = "V", -- вертикальный сплит
      open_split = "H", -- горизонтальный сплит
      change_tag = "C", -- изменить тег вручную
    },
    sort = "default", -- сортировка по номеру буфера
  },
}

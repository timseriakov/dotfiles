return {
  "karb94/neoscroll.nvim",
  cond = function()
    return vim.g.neovide ~= nil -- Only load in Neovide
  end,
  config = function()
    require("neoscroll").setup({
      mappings = {}, -- Отключаем все клавиатурные mappings
      hide_cursor = true,
      stop_eof = true,
      respect_scrolloff = false,
      cursor_scrolls_alone = true,
      easing_function = "circular",
      performance_mode = false,
    })

    -- Только мышь
    local neoscroll = require("neoscroll")
    vim.keymap.set({ "n", "v", "x" }, "<ScrollWheelUp>", function()
      neoscroll.scroll(-3, { move_cursor = false, duration = 120 })
    end)

    vim.keymap.set({ "n", "v", "x" }, "<ScrollWheelDown>", function()
      neoscroll.scroll(3, { move_cursor = false, duration = 120 })
    end)
  end,
}

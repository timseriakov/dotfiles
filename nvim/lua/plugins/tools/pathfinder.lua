-- Plugin: AlexSoliz67/pathfinder.nvim
-- Улучшенная навигация по файлам через gf/gF

return {
  "HawkinsT/pathfinder.nvim",
  event = "VeryLazy",
  config = function()
    require("pathfinder").setup({
      -- Конфигурация (если появятся опции в будущих версиях)
    })
  end,
}

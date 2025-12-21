return {
  -- фиксим WinSeparator после загрузки всех тем и оверрайдов
  {
    "nvim-lua/plenary.nvim", -- заглушка, не влияет
    lazy = false,
    config = function()
      vim.api.nvim_create_autocmd("User", {
        pattern = "VeryLazy",
        callback = function()
          -- подгружаем текущие цвета Normal
          local normal = vim.api.nvim_get_hl(0, { name = "Normal", link = false })

          -- явно переопределяем стиль WinSeparator
          vim.api.nvim_set_hl(0, "WinSeparator", {
            fg = "#414C60",
            bg = normal.bg or "#414C60", -- #2e3440
            bold = true,
          })
        end,
      })
    end,
  },
}

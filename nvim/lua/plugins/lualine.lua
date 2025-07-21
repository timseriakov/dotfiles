return {
  "nvim-lualine/lualine.nvim",
  config = function()
    require("lualine").setup({
      options = {
        globalstatus = false,
      },
      sections = {
        lualine_a = {
          "mode",
        },
        lualine_b = {
          {
            "filetype",
            colored = true,
            icon_only = true,
            icon = { align = "right" },
          },
        },
        lualine_c = {
          {
            "filename",
            file_status = true,
            newfile_status = true,
            path = 1,
            shorting_target = 70,
            symbols = {
              modified = "[+]",
              readonly = "[-]",
              unnamed = "[No Name]",
              newfile = "[New]",
            },
          },
        },
        lualine_x = {
          -- 🧠 Codeium статус — теперь САМАЯ ЛЕВАЯ часть в правом блоке
          function()
            local status = require("codeium.virtual_text").status()
            if status.state == "waiting" then
              return "󰑕"
            end
            if status.state == "completions" and status.total > 0 then
              return string.format(" %d/%d", status.current, status.total)
            end
            return ""
          end,
          "diff",
          "branch",
        },
        lualine_y = { "location" },
        lualine_z = { "progress" },
      },
    })

    -- Обновляем статусбар при смене состояния Codeium
    require("codeium.virtual_text").set_statusbar_refresh(function()
      require("lualine").refresh()
    end)
  end,
}

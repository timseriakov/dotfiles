return {
  "nvim-lualine/lualine.nvim",
  config = function()
    require("lualine").setup({
      options = {
        globalstatus = false,
        disabled_filetypes = {
          statusline = { "dashboard" },
          winbar = { "dashboard" },
        },
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
        lualine_x = { "diff", "branch" },
        lualine_y = { "location" },
        lualine_z = { "progress" },
      },
    })
  end,
}

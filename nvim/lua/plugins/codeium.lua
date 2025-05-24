return {
  "Exafunction/codeium.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
  },
  config = function()
    require("codeium").setup({
      virtual_text = {
        enabled = true,
        key_bindings = {
          accept = "<Tab>",
          next = "<M-l>",
          prev = "<M-h>",
        },
      },
    })

    -- обновление lualine
    require("codeium.virtual_text").set_statusbar_refresh(function()
      require("lualine").refresh()
    end)
  end,
}

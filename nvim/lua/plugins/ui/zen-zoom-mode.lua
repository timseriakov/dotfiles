return {
  "folke/snacks.nvim",
  keys = {
    -- Поменяли местами Zen и Zoom
    {
      "<leader>uz",
      function()
        require("snacks.toggle").zoom():toggle()
      end,
      desc = "Toggle Zoom Mode",
    },
    {
      "<leader>we",
      function()
        -- Custom zoom with statusline
        local zoom = require("snacks.toggle").zoom()
        if zoom:get() then
          -- Currently zoomed, restore
          zoom:set(false)
          vim.o.laststatus = 3 -- Restore statusline
        else
          -- Not zoomed, zoom in
          vim.o.laststatus = 3 -- Keep statusline
          zoom:set(true)
        end
      end,
      desc = "Toggle Zoom Mode (with statusline)",
    },
    {
      "<leader>uZ",
      function()
        require("snacks.toggle").zen():toggle()
      end,
      desc = "Toggle Zen Mode",
    },
    {
      "<leader>Z",
      function()
        require("snacks.toggle").zen():toggle()
      end,
      desc = "Toggle Zen Mode",
    },
  },
}

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
      "<leader>z",
      function()
        require("snacks.toggle").zoom():toggle()
      end,
      desc = "Toggle Zoom Mode",
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

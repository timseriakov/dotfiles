-- ~/.config/nvim/lua/plugins/in-and-out.lua
return {
  "ysmb-wtsg/in-and-out.nvim",
  keys = {
    {
      "<C-l>",
      function()
        require("in-and-out").in_and_out()
      end,
      mode = { "i", "n" },
      desc = "Jump in/out of surrounding characters",
    },
  },
  opts = {
    additional_targets = { "“", "”" },
  },
}

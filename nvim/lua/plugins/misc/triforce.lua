return {
  "gisketch/triforce.nvim",
  dependencies = { "nvzone/volt" },
  opts = {},
  keys = {
    {
      "<leader>;;",
      function()
        require("triforce").show_profile()
      end,
      desc = "Triforce profile",
    },
  },
}

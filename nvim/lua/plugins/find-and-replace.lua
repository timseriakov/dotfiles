return {
  "chrisgrieser/nvim-rip-substitute",
  cmd = "RipSubstitute",
  opts = {},
  keys = {
    {
      "<leader>br",
      function()
        require("rip-substitute").sub()
      end,
      mode = { "n", "x" },
      desc = "Find and Replace",
    },
  },
}

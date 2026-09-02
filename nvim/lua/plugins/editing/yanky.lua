-- Disable yanky gp/gP so our goto-preview maps can take over
return {
  "gbprod/yanky.nvim",
  optional = true,
  keys = {
    { "gp", false, mode = { "n", "x" } },
    { "gP", false, mode = { "n", "x" } },
    { "<leader>p", false, mode = { "n", "x" } },
    {
      "<leader>P",
      function()
        if LazyVim.pick.picker.name == "telescope" then
          require("telescope").extensions.yank_history.yank_history({})
        else
          vim.cmd([[YankyRingHistory]])
        end
      end,
      mode = { "n", "x" },
      desc = "Open Yank History",
    },
  },
}

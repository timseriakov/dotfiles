-- Disable yanky gp/gP so our goto-preview maps can take over
return {
  "gbprod/yanky.nvim",
  optional = true,
  keys = {
    { "gp", false, mode = { "n", "x" } },
    { "gP", false, mode = { "n", "x" } },
  },
}

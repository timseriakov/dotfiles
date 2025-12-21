return {
  "alex-popov-tech/store.nvim",
  dependencies = { "OXY2DEV/markview.nvim" },
  cmd = "Store",
  opts = {
    width = 0.9,
    height = 0.95,
    -- Window layout proportions (must sum to 1.0)
    proportions = {
      list = 0.4,
      preview = 0.6,
    },
  },
}

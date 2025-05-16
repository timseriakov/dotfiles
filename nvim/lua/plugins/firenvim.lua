return {
  "glacambre/firenvim",
  lazy = not vim.g.started_by_firenvim,
  build = ":call firenvim#install(0)",
}

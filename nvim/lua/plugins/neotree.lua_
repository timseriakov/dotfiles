return {
  "nvim-neo-tree/neo-tree.nvim",
  opts = function(_, opts)
    opts.filesystem = opts.filesystem or {}
    opts.filesystem.window = opts.filesystem.window or {}
    opts.filesystem.window.mappings = opts.filesystem.window.mappings or {}

    -- Меняем бинды местами
    opts.filesystem.window.mappings["/"] = "filter_on_submit"
    opts.filesystem.window.mappings["f"] = "fuzzy_finder"

    return opts
  end,
}

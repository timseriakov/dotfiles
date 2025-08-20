return {
  "nvim-neo-tree/neo-tree.nvim",
  opts = function(_, opts)
    opts.filesystem = opts.filesystem or {}
    opts.filesystem.window = opts.filesystem.window or {}
    opts.filesystem.window.mappings = opts.filesystem.window.mappings or {}

    opts.filesystem.window.mappings["/"] = "filter_on_submit"
    opts.filesystem.window.mappings["f"] = function()
      local flash = require("flash")
      flash.jump()
    end

    opts.filesystem.window.mappings["i"] = "fuzzy_finder"
    opts.filesystem.window.mappings["I"] = "show_file_details"

    return opts
  end,
}

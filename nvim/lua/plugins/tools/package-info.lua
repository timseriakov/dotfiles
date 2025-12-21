-- plugins/package-info.lua

return {
  "vuki656/package-info.nvim",
  event = "BufRead package.json",
  dependencies = {
    "MunifTanjim/nui.nvim",
  },
  config = function()
    require("package-info").setup({
      autostart = true,
      icons = {
        enable = false,
      },
      highlights = {
        up_to_date = { fg = "#4c566a" }, -- nord3 (polar night) - актуальные версии
        outdated = { fg = "#81a1c1" }, -- nord9 (frost blue) - устаревшие версии
        invalid = { fg = "#5e81ac" }, -- nord10 (frost dark blue) - невалидные версии
      },
      notifications = false, -- Whether to display notifications when running commands
      hide_up_to_date = true, -- It hides up to date versions when displaying virtual text
      hide_unstable_versions = false,
    })

    -- Кастомные биндинги
    -- local map = vim.keymap.set
    -- local opts = { silent = true, noremap = true }
    --
    -- map("n", "<leader>ns", require("package-info").show, opts)
    -- map("n", "<leader>nc", require("package-info").hide, opts)
    -- map("n", "<leader>nt", require("package-info").toggle, opts)
    -- map("n", "<leader>nu", require("package-info").update, opts)
    -- map("n", "<leader>nd", require("package-info").delete, opts)
    -- map("n", "<leader>ni", require("package-info").install, opts)
    -- map("n", "<leader>np", require("package-info").change_version, opts)
  end,
}

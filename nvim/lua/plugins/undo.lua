return {
  "debugloop/telescope-undo.nvim",
  dependencies = {
    {
      "nvim-telescope/telescope.nvim",
      dependencies = { "nvim-lua/plenary.nvim" },
    },
  },
  keys = {
    {
      "<leader>fu",
      "<cmd>Telescope undo<cr>",
      desc = "Undo History",
    },
  },
  opts = {
    defaults = {
      layout_strategy = "horizontal",
      layout_config = {
        horizontal = {
          preview_width = 0.7,
          results_width = 0.2,
        },
      },
    },
    extensions = {
      undo = {
        use_delta = true,
        use_custom_command = nil,
        vim_diff_opts = {
          ctxlen = vim.o.scrolloff,
        },
        entry_format = "state #$ID, $STAT, $TIME",
        time_format = "",
        saved_only = false,
        side_by_side = true,
      },
    },
  },
  config = function(_, opts)
    require("telescope").setup(opts)
    require("telescope").load_extension("undo")
  end,
}

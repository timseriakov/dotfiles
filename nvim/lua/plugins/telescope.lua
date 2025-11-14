return {
  "nvim-telescope/telescope.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-telescope/telescope-live-grep-args.nvim",
  },
  config = function(_, opts)
    local telescope = require("telescope")
    local actions = require("telescope.actions")
    local glob_store = require("modules.glob_store")
    local launchers = require("modules.telescope.launchers")
    local pickers = require("modules.telescope.pickers")
    local utils = require("modules.telescope.utils")

    opts.pickers = opts.pickers or {}
    opts.pickers.live_grep = {
      additional_args = function()
        local glob = glob_store.load_latest()
        return glob and glob ~= "" and { "--glob", glob } or {}
      end,
    }
    opts.pickers.find_files = {
      find_command = utils.build_fd_args(""),
    }

    opts.defaults = opts.defaults or {}
    opts.defaults.mappings = opts.defaults.mappings or {}
    opts.defaults.mappings.i = opts.defaults.mappings.i or {}
    opts.defaults.mappings.i["<C-l>"] = actions.send_to_qflist + actions.open_qflist
    opts.defaults.mappings.i["<c-y>"] = require("modules.telescope.actions").copy_selection_to_clipboard
    opts.defaults.mappings.i["<c-r>"] = require("modules.telescope.actions").copy_selection_paths_to_clipboard

    telescope.setup(opts)
    telescope.load_extension("live_grep_args")

    vim.opt.timeoutlen = 300

    vim.keymap.set("n", "<leader><leader>", launchers.launch_find_files, { desc = "Find Files with History" })

    vim.keymap.set("n", "<leader>sf", function()
      pickers.open_glob_picker(function(glob)
        if glob ~= nil then
          glob_store.save(glob)
          launchers.launch_find_files({ glob = glob })
        end
      end)
    end, { desc = "Find Files with Glob" })

    vim.keymap.set("n", "<leader>/", launchers.launch_grep, { desc = "Live Grep with History" })

    vim.keymap.set("n", "ff", function()
      require("telescope.builtin").buffers()
    end, { desc = "Telescope Buffers" })
  end,

  opts = {
    defaults = {
      layout_strategy = "horizontal",
      layout_config = {
        horizontal = { preview_width = 0.55, prompt_position = "bottom" },
        width = 0.95,
        height = 0.95,
        preview_cutoff = 120,
      },
      sorting_strategy = "descending",
      winblend = 0,
      vimgrep_arguments = {
        "rg",
        "--color=never",
        "--no-heading",
        "--with-filename",
        "--line-number",
        "--column",
        "--smart-case",
        "--hidden",
        "--follow",
        "--glob",
        "!*.png",
        "--glob",
        "!*.jpg",
        "--glob",
        "!*.jpeg",
        "--glob",
        "!*.gif",
        "--glob",
        "!*.svg",
        "--glob",
        "!*.webp",
      },
    },
  },
}

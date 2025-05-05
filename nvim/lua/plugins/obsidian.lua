return {
  "obsidian-nvim/obsidian.nvim",
  version = "*",
  lazy = true,
  ft = "markdown",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-telescope/telescope.nvim",
    "hrsh7th/nvim-cmp",
  },
  opts = {
    workspaces = {
      {
        name = "personal",
        path = "/Users/tim/vaults/default-vault",
      },
      -- {
      --   name = "work",
      --   path = "~/vaults/work",
      --   overrides = {
      --     notes_subdir = "notes",
      --   },
      -- },
    },

    notes_subdir = "notes",
    new_notes_location = "notes_subdir",
    preferred_link_style = "wiki",

    completion = {
      nvim_cmp = true,
      blink = false,
      min_chars = 2,
    },

    mappings = {
      ["gf"] = {
        action = function()
          return require("obsidian").util.gf_passthrough()
        end,
        opts = { noremap = false, expr = true, buffer = true },
      },
      ["<leader>ch"] = {
        action = function()
          return require("obsidian").util.toggle_checkbox()
        end,
        opts = { buffer = true },
      },
      ["<CR>"] = {
        action = function()
          return require("obsidian").util.smart_action()
        end,
        opts = { buffer = true, expr = true },
      },
    },

    attachments = {
      img_folder = "-attachments-",
      img_name_func = function()
        return string.format("img_%s", os.date("%Y%m%d%H%M%S"))
      end,
      img_text_func = function(_, path)
        local note_dir = vim.fn.expand("%:p:h")
        local relative_path = path:make_relative(note_dir)
        return string.format("![%s](%s)", path.name, relative_path)
      end,
    },

    templates = {
      folder = "/Users/tim/vaults/default-vault/03 Resources/templates",
      date_format = "%Y-%m-%d",
      time_format = "%H:%M",
    },

    ui = {
      enable = true,
      update_debounce = 200,
    },

    picker = {
      name = "telescope.nvim",
    },

    open_notes_in = "current",

    log_level = vim.log.levels.INFO,
  },
}

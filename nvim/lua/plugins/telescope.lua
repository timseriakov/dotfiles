-- telescope_glob_config.lua
return {
  "nvim-telescope/telescope.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-telescope/telescope-live-grep-args.nvim",
  },
  config = function(_, opts)
    local telescope = require("telescope")
    local actions = require("telescope.actions")
    local action_state = require("telescope.actions.state")
    local finders = require("telescope.finders")
    local pickers = require("telescope.pickers")
    local conf = require("telescope.config").values
    local glob_store = require("modules.glob_store")

    local function get_excluded()
      return {
        "-E",
        "*.png",
        "-E",
        "*.jpg",
        "-E",
        "*.jpeg",
        "-E",
        "*.gif",
        "-E",
        "*.svg",
        "-E",
        "*.webp",
      }
    end

    local function build_fd_args(glob)
      local args = { "fd", "--color", "never" }

      local path = glob:match("^([^*/]+)/%*%*$")
      if path and vim.fn.isdirectory(path) == 1 then
        table.insert(args, ".")
        table.insert(args, "--search-path")
        table.insert(args, path)
      else
        if glob ~= "" then
          table.insert(args, "--glob")
          table.insert(args, glob)
        end
      end

      vim.list_extend(args, { "--type", "f" })
      vim.list_extend(args, get_excluded())
      return args
    end

    local function open_glob_picker(callback)
      local seen = {}
      local globs = {}

      local function add_glob(label, value)
        if not seen[value] then
          table.insert(globs, { label = label, value = value })
          seen[value] = true
        end
      end

      for _, glob in ipairs(glob_store.load_all()) do
        add_glob("󰆓 " .. glob, glob)
      end

      add_glob("**/*.ts", "**/*.ts")
      add_glob("**/*.tsx", "**/*.tsx")
      add_glob("**/*.json", "**/*.json")
      add_glob("app/**", "app/**")
      add_glob("docs/**", "docs/**")
      add_glob("󰈭 Open globster.xyz", "__open_globster__")
      add_glob("All files", "")

      pickers
        .new({}, {
          prompt_title = "Choose Glob",
          previewer = false,
          layout_config = { width = 0.5, height = 0.5 },
          sorting_strategy = "ascending",
          finder = finders.new_table({
            results = globs,
            entry_maker = function(entry)
              return {
                value = entry.value,
                display = entry.label,
                ordinal = entry.label,
              }
            end,
          }),
          sorter = conf.generic_sorter({}),
          default_selection_index = #globs,
          attach_mappings = function(_, _)
            actions.select_default:replace(function(prompt_bufnr)
              actions.close(prompt_bufnr)
              local entry = action_state.get_selected_entry()
              local value = (entry and entry.value or ""):gsub("^%s*(.-)%s*$", "%1")

              if value == "__open_globster__" then
                vim.fn.jobstart(
                  { vim.fn.has("mac") == 1 and "open" or "xdg-open", "https://globster.xyz/" },
                  { detach = true }
                )
                return
              end

              glob_store.save(value)
              callback(value)
            end)
            return true
          end,
        })
        :find()
    end

    opts.pickers = opts.pickers or {}
    opts.pickers.live_grep = {
      additional_args = function()
        local glob = glob_store.load_latest()
        return glob ~= "" and { "--glob", glob } or {}
      end,
    }
    opts.pickers.find_files = {
      find_command = build_fd_args(""),
    }

    telescope.setup(opts)
    telescope.load_extension("live_grep_args")

    vim.keymap.set("n", "<leader><leader>", function()
      require("telescope.builtin").find_files({
        prompt_title = "Find Files (all)",
        find_command = build_fd_args(""),
      })
    end, { desc = "Find files (all)" })

    vim.keymap.set("n", "<leader>sf", function()
      open_glob_picker(function(glob)
        require("telescope.builtin").find_files({
          prompt_title = glob ~= "" and ("Find Files › " .. glob) or "Find Files (all)",
          find_command = build_fd_args(glob),
        })
      end)
    end, { desc = "Find Files with Glob" })

    vim.keymap.set("n", "<leader>/", function()
      open_glob_picker(function(glob)
        local title = glob ~= "" and ("Live Grep › " .. glob) or "Live Grep (all files)"
        telescope.extensions.live_grep_args.live_grep_args({
          additional_args = glob ~= "" and { "--glob", glob } or nil,
          prompt_title = title,
        })
      end)
    end, { desc = "Live Grep with Glob" })
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

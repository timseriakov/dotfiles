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
    local query_store = require("modules.query_store")

    -- Forward declarations
    local launch_grep
    local open_glob_picker
    local open_query_history_picker

    local function get_excluded()
      return {
        "-E", "*.png", "-E", "*.jpg", "-E", "*.jpeg",
        "-E", "*.gif", "-E", "*.svg", "-E", "*.webp",
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
        if glob and glob ~= "" then
          table.insert(args, "--glob")
          table.insert(args, glob)
        end
      end
      vim.list_extend(args, { "--type", "f" })
      vim.list_extend(args, get_excluded())
      return args
    end

    open_glob_picker = function(callback)
      local seen = {}
      local globs = {}

      local function add_glob(label, value)
        local key = value
        if value == "" then key = "__all_files__" end
        if not seen[key] then
          table.insert(globs, { label = label, value = value })
          seen[key] = true
        end
      end

      add_glob("All files", "")
      for _, glob in ipairs(glob_store.load_all()) do
        if glob and glob ~= "" then add_glob("󰆓 " .. glob, glob) end
      end
      add_glob("**/*.ts", "**/*.ts")
      add_glob("**/*.tsx", "**/*.tsx")
      add_glob("**/*.json", "**/*.json")
      add_glob("app/**", "app/**")
      add_glob("docs/**", "docs/**")
      add_glob("󰈭 Open globster.xyz", "__open_globster__")

      pickers.new({}, {
        prompt_title = "Choose Glob",
        previewer = false,
        layout_config = { width = 0.5, height = 0.5 },
        sorting_strategy = "ascending",
        finder = finders.new_table({
          results = globs,
          entry_maker = function(entry)
            return { value = entry.value, display = entry.label, ordinal = entry.label }
          end,
        }),
        sorter = conf.generic_sorter({}),
        attach_mappings = function(prompt_bufnr, map)
          map("i", "<cr>", function()
            local entry = action_state.get_selected_entry()
            actions.close(prompt_bufnr)
            local value = entry and entry.value
            if value == "__open_globster__" then
              vim.fn.jobstart({ vim.fn.has("mac") == 1 and "open" or "xdg-open", "https://globster.xyz/" }, { detach = true })
              return
            end
            if value ~= nil then
              callback(value)
            end
          end)
          map("i", "<esc>", function(bufnr)
            actions.close(bufnr)
            callback(nil) -- Cancel
          end)
          return true
        end,
      }):find()
    end

    open_query_history_picker = function(callback)
      local queries = query_store.load_all()
      pickers.new({}, {
        prompt_title = "Search History",
        previewer = false,
        layout_config = { width = 0.5, height = 0.5 },
        finder = finders.new_table({ results = queries }),
        sorter = conf.generic_sorter({}),
        attach_mappings = function(history_bufnr, map)
          map("i", "<cr>", function()
            local entry = action_state.get_selected_entry()
            actions.close(history_bufnr)
            callback(entry and entry.value)
          end)
          map("i", "<esc>", function(bufnr)
            actions.close(bufnr)
            callback(nil)
          end)
          return true
        end,
      }):find()
    end

    launch_grep = function(options)
      options = options or {}
      local glob = options.glob
      if glob == nil then
        glob = glob_store.load_latest()
        if glob == nil then glob = "" end
      end

      local current_query = options.query or ""
      local title = glob ~= "" and ("Live Grep › " .. glob) or "Live Grep (all files)"

      telescope.extensions.live_grep_args.live_grep_args({
        prompt_title = title,
        additional_args = glob ~= "" and { "--glob", glob } or nil,
        default_text = current_query,
        attach_mappings = function(prompt_bufnr, map)
          local function save_query_and_run(action)
            return function(bufnr)
              local query = action_state.get_current_line(bufnr)
              if query and query ~= "" then query_store.save(query) end
              action(bufnr)
            end
          end

          map("i", "<cr>", save_query_and_run(actions.select_default))
          map("i", "<c-s>", save_query_and_run(actions.select_horizontal))
          map("i", "<c-v>", save_query_and_run(actions.select_vertical))
          map("i", "<c-t>", save_query_and_run(actions.select_tab))
          map("i", "<c-l>", save_query_and_run(actions.send_to_qflist + actions.open_qflist))

          map("i", "<C-h>", function(bufnr)
            local original_query = action_state.get_current_line(bufnr)
            actions.close(bufnr)
            open_query_history_picker(function(new_query)
              launch_grep({ glob = glob, query = new_query or original_query })
            end)
          end)

          map("i", "<C-g>", function(bufnr)
            local original_query = action_state.get_current_line(bufnr)
            actions.close(bufnr)
            open_glob_picker(function(new_glob)
              if new_glob ~= nil then
                glob_store.save(new_glob)
                launch_grep({ glob = new_glob, query = original_query })
              else
                -- Relaunch with same state if glob picker was cancelled
                launch_grep({ glob = glob, query = original_query })
              end
            end)
          end)

          return true
        end,
      })
    end

    opts.pickers = opts.pickers or {}
    opts.pickers.live_grep = {
      additional_args = function()
        local glob = glob_store.load_latest()
        return glob and glob ~= "" and { "--glob", glob } or {}
      end,
    }
    opts.pickers.find_files = {
      find_command = build_fd_args(""),
    }

    opts.defaults = opts.defaults or {}
    opts.defaults.mappings = opts.defaults.mappings or {}
    opts.defaults.mappings.i = opts.defaults.mappings.i or {}
    opts.defaults.mappings.i["<C-l>"] = actions.send_to_qflist + actions.open_qflist

    telescope.setup(opts)
    telescope.load_extension("live_grep_args")

    vim.opt.timeoutlen = 300

    vim.keymap.set("n", "<leader><leader>", function()
      require("telescope.builtin").find_files({
        prompt_title = "Find Files (all)",
        find_command = build_fd_args(""),
      })
    end, { desc = "Find files (all)" })

    vim.keymap.set("n", "<leader>sf", function()
      open_glob_picker(function(glob)
        if glob ~= nil then
          glob_store.save(glob)
          require("telescope.builtin").find_files({
            prompt_title = glob ~= "" and ("Find Files › " .. glob) or "Find Files (all)",
            find_command = build_fd_args(glob),
          })
        end
      end)
    end, { desc = "Find Files with Glob" })

    vim.keymap.set("n", "<leader>/", launch_grep, { desc = "Live Grep with History" })

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
        "rg", "--color=never", "--no-heading", "--with-filename",
        "--line-number", "--column", "--smart-case", "--hidden",
        "--follow", "--glob", "!*.png", "--glob", "!*.jpg",
        "--glob", "!*.jpeg", "--glob", "!*.gif", "--glob", "!*.svg",
        "--glob", "!*.webp",
      },
    },
  },
}
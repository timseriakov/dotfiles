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
    local glob_store = require("modules.glob_store")

    opts.pickers = opts.pickers or {}

    opts.pickers.live_grep = {
      additional_args = function()
        local glob = glob_store.load_latest()
        return glob ~= "" and { "--glob", glob } or {}
      end,
    }

    opts.pickers.find_files = {
      find_command = function()
        local glob = glob_store.load_latest()
        local args = {
          "fd",
          "--type",
          "f",
          "--color",
          "never",
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
        if glob ~= "" then
          table.insert(args, "--glob")
          table.insert(args, glob)
        end
        return args
      end,
    }

    telescope.setup(opts)
    telescope.load_extension("live_grep_args")

    vim.keymap.set("n", "<leader>/", function()
      local pickers = require("telescope.pickers")
      local finders = require("telescope.finders")
      local conf = require("telescope.config").values

      local history = glob_store.load_all()
      local globs = {}

      for _, glob in ipairs(history) do
        table.insert(globs, { label = "󰆓 " .. glob, value = glob })
      end

      vim.list_extend(globs, {
        { label = "**/*.ts", value = "**/*.ts" },
        { label = "**/*.tsx", value = "**/*.tsx" },
        { label = "**/*.json", value = "**/*.json" },
        { label = "**/app/**/*", value = "**/app/**/*" },
        { label = "**/docs/**/*", value = "**/docs/**/*" },
        { label = "󰈭 Open globster.xyz", value = "__open_globster__" },
        { label = " All files", value = "" },
      })

      pickers
        .new({}, {
          prompt_title = "Glob filter",
          previewer = false,
          layout_config = {
            width = 0.5,
            height = 0.5,
            prompt_position = "bottom",
          },
          sorting_strategy = "ascending",
          results_title = false,
          winblend = 0,
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

              local current_line = action_state.get_current_line()
              local entry = action_state.get_selected_entry()
              local value = (entry and entry.value or ""):gsub("^%s*(.-)%s*$", "%1")

              if current_line ~= value then
                value = current_line
              end

              if value == "__open_globster__" then
                local open_cmd = vim.fn.has("mac") == 1 and "open" or "xdg-open"
                vim.fn.jobstart({ open_cmd, "https://globster.xyz/" }, { detach = true })
                return
              end

              glob_store.save(value)

              vim.schedule(function()
                local title = value ~= "" and ("Live Grep › " .. value) or "Live Grep (all files)"
                telescope.extensions.live_grep_args.live_grep_args({
                  additional_args = value ~= "" and { "--glob", value } or nil,
                  prompt_title = title,
                })
              end)
            end)
            return true
          end,
        })
        :find()
    end, { desc = "Glob + Grep" })
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

local pickers = require("telescope.pickers")
local finders = require("telescope.finders")
local conf = require("telescope.config").values
local actions = require("telescope.actions")
local action_state = require("telescope.actions.state")
local glob_store = require("modules.glob_store")
local query_store = require("modules.query_store")
local file_query_store = require("modules.file_query_store")

local M = {}

function M.open_glob_picker(callback)
  local seen = {}
  local globs = {}

  local function add_glob(label, value)
    local key = value
    if value == "" then
      key = "__all_files__"
    end
    if not seen[key] then
      table.insert(globs, { label = label, value = value })
      seen[key] = true
    end
  end

  add_glob("All files", "")
  for _, glob in ipairs(glob_store.load_all()) do
    if glob and glob ~= "" then
      add_glob("󰆓 " .. glob, glob)
    end
  end
  add_glob("**/*.ts", "**/*.ts")
  add_glob("**/*.tsx", "**/*.tsx")
  add_glob("**/*.json", "**/*.json")
  add_glob("app/**", "app/**")
  add_glob("docs/**", "docs/**")
  add_glob("󰈭 Open globster.xyz", "__open_globster__")

  pickers
    .new({}, {
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
            vim.fn.jobstart(
              { vim.fn.has("mac") == 1 and "open" or "xdg-open", "https://globster.xyz/" },
              { detach = true }
            )
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
    })
    :find()
end

function M.open_query_history_picker(callback)
  local queries = query_store.load_all()
  pickers
    .new({}, {
      prompt_title = "Grep History",
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
    })
    :find()
end

function M.open_file_query_history_picker(callback)
  local queries = file_query_store.load_all()
  pickers
    .new({}, {
      prompt_title = "File Search History",
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
    })
    :find()
end

return M

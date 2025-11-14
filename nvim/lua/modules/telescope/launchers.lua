local telescope = require("telescope")
local actions = require("telescope.actions")
local action_state = require("telescope.actions.state")
local glob_store = require("modules.glob_store")
local query_store = require("modules.query_store")
local file_query_store = require("modules.file_query_store")
local pickers = require("modules.telescope.pickers")
local custom_actions = require("modules.telescope.actions")
local utils = require("modules.telescope.utils")

local M = {}

function M.launch_grep(options)
  options = options or {}
  local glob = options.glob
  if glob == nil then
    glob = glob_store.load_latest()
    if glob == nil then
      glob = ""
    end
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
          if query and query ~= "" then
            query_store.save(query)
          end
          action(bufnr)
        end
      end

      map("i", "<cr>", save_query_and_run(actions.select_default))
      map("i", "<c-s>", save_query_and_run(actions.select_horizontal))
      map("i", "<c-v>", save_query_and_run(actions.select_vertical))
      map("i", "<c-t>", save_query_and_run(actions.select_tab))
      map("i", "<c-l>", save_query_and_run(actions.send_to_qflist + actions.open_qflist))
      map("i", "<c-y>", custom_actions.copy_selection_to_clipboard)
      map("i", "<c-r>", custom_actions.copy_selection_paths_to_clipboard)

      map("i", "<C-h>", function(bufnr)
        local original_query = action_state.get_current_line(bufnr)
        actions.close(bufnr)
        pickers.open_query_history_picker(function(new_query)
          M.launch_grep({ glob = glob, query = new_query or original_query })
        end)
      end)

      map("i", "<C-g>", function(bufnr)
        local original_query = action_state.get_current_line(bufnr)
        actions.close(bufnr)
        pickers.open_glob_picker(function(new_glob)
          if new_glob ~= nil then
            glob_store.save(new_glob)
            M.launch_grep({ glob = new_glob, query = original_query })
          else
            -- Relaunch with same state if glob picker was cancelled
            M.launch_grep({ glob = glob, query = original_query })
          end
        end)
      end)

      return true
    end,
  })
end

function M.launch_find_files(options)
  options = options or {}
  local glob = options.glob
  if glob == nil then
    glob = glob_store.load_latest()
    if glob == nil then
      glob = ""
    end
  end

  local current_query = options.query or ""
  local title = glob ~= "" and ("Find Files › " .. glob) or "Find Files (all)"

  require("telescope.builtin").find_files({
    prompt_title = title,
    find_command = utils.build_fd_args(glob),
    default_text = current_query,
    attach_mappings = function(prompt_bufnr, map)
      local function save_query_and_run(action)
        return function(bufnr)
          local query = action_state.get_current_line(bufnr)
          if query and query ~= "" then
            file_query_store.save(query)
          end
          action(bufnr)
        end
      end

      map("i", "<cr>", save_query_and_run(actions.select_default))
      map("i", "<c-s>", save_query_and_run(actions.select_horizontal))
      map("i", "<c-v>", save_query_and_run(actions.select_vertical))
      map("i", "<c-t>", save_query_and_run(actions.select_tab))
      map("i", "<c-l>", save_query_and_run(actions.send_to_qflist + actions.open_qflist))
      map("i", "<c-y>", custom_actions.copy_selection_to_clipboard)
      map("i", "<c-r>", custom_actions.copy_selection_paths_to_clipboard)

      map("i", "<C-h>", function(bufnr)
        local original_query = action_state.get_current_line(bufnr)
        actions.close(bufnr)
        pickers.open_file_query_history_picker(function(new_query)
          M.launch_find_files({ glob = glob, query = new_query or original_query })
        end)
      end)

      map("i", "<C-g>", function(bufnr)
        local original_query = action_state.get_current_line(bufnr)
        actions.close(bufnr)
        pickers.open_glob_picker(function(new_glob)
          if new_glob ~= nil then
            glob_store.save(new_glob)
            M.launch_find_files({ glob = new_glob, query = original_query })
          else
            M.launch_find_files({ glob = glob, query = original_query })
          end
        end)
      end)

      return true
    end,
  })
end

return M

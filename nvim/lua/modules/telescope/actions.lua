local actions = require("telescope.actions")
local action_state = require("telescope.actions.state")

local M = {}

function M.copy_selection_to_clipboard(bufnr)
  local picker = action_state.get_current_picker(bufnr)
  local selection = picker:get_multi_selection()

  if #selection == 0 then
    vim.notify("No files selected.", vim.log.levels.WARN)
    return
  end

  local content_parts = {}
  local processed_files = {}

  local git_root = vim.fn.trim(vim.fn.system("git rev-parse --show-toplevel 2>/dev/null"))
  if vim.v.shell_error ~= 0 then
    git_root = vim.fn.getcwd()
  end
  if git_root:sub(-1) ~= "/" then
    git_root = git_root .. "/"
  end

  for _, entry in ipairs(selection) do
    local path_from_picker = entry.filename or entry.value
    if path_from_picker and not processed_files[path_from_picker] then
      processed_files[path_from_picker] = true

      local abs_path = vim.fn.fnamemodify(path_from_picker, ":p")
      local relative_path = abs_path
      if abs_path:find(git_root, 1, true) == 1 then
        relative_path = abs_path:sub(#git_root + 1)
      end

      local ok, lines = pcall(vim.fn.readfile, abs_path)
      if ok then
        local file_content = table.concat(lines, "\n")
        table.insert(content_parts, relative_path .. "\n" .. file_content)
      else
        vim.notify("Error reading file: " .. abs_path, vim.log.levels.ERROR)
      end
    end
  end

  if #content_parts > 0 then
    local final_string = table.concat(content_parts, "\n\n-------------\n\n")
    vim.fn.setreg("+", final_string)
    vim.notify("Copied content of " .. #content_parts .. " file(s) to clipboard.")
  end

  actions.close(bufnr)
end

function M.copy_selection_paths_to_clipboard(bufnr)
  local picker = action_state.get_current_picker(bufnr)
  local selection = picker:get_multi_selection()

  if #selection == 0 then
    vim.notify("No files selected.", vim.log.levels.WARN)
    return
  end

  local path_parts = {}
  local processed_files = {}

  local git_root = vim.fn.trim(vim.fn.system("git rev-parse --show-toplevel 2>/dev/null"))
  if vim.v.shell_error ~= 0 then
    git_root = vim.fn.getcwd()
  end
  if git_root:sub(-1) ~= "/" then
    git_root = git_root .. "/"
  end

  for _, entry in ipairs(selection) do
    local path_from_picker = entry.filename or entry.value
    if path_from_picker and not processed_files[path_from_picker] then
      processed_files[path_from_picker] = true

      local abs_path = vim.fn.fnamemodify(path_from_picker, ":p")
      local relative_path = abs_path
      if abs_path:find(git_root, 1, true) == 1 then
        relative_path = abs_path:sub(#git_root + 1)
      end
      table.insert(path_parts, relative_path)
    end
  end

  if #path_parts > 0 then
    local final_string = table.concat(path_parts, "\n")
    vim.fn.setreg("+", final_string)
    vim.notify("Copied " .. #path_parts .. " path(s) to clipboard.")
  end

  actions.close(bufnr)
end

return M

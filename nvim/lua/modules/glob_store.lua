-- modules/glob_store.lua
local M = {}

local history_file = vim.fn.stdpath("data") .. "/telescope_glob_history.txt"

-- Saves the given glob pattern to the top of the history.
function M.save(glob)
  -- Ensure glob is a string, even if it's empty.
  if type(glob) ~= "string" then
    return
  end

  local lines = {}
  local seen = {}

  -- Add the new glob to the top and mark it as seen.
  table.insert(lines, glob)
  seen[glob] = true

  -- Read existing history, avoiding duplicates.
  local file = io.open(history_file, "r")
  if file then
    for line in file:lines() do
      -- Limit history size and prevent adding duplicates.
      if #lines < 20 and not seen[line] then
        table.insert(lines, line)
        seen[line] = true
      end
    end
    file:close()
  end

  -- Write the updated history back to the file.
  local out_file = io.open(history_file, "w")
  if out_file then
    out_file:write(table.concat(lines, "\n"))
    out_file:close()
  end
end

-- Loads all saved glob patterns.
function M.load_all()
  local file = io.open(history_file, "r")
  if not file then
    return {}
  end

  local lines = {}
  for line in file:lines() do
    table.insert(lines, line)
  end
  file:close()
  return lines
end

-- Loads the most recently used glob pattern.
function M.load_latest()
  local all = M.load_all()
  -- Returns the last saved glob. Can be an empty string. Returns nil if history is empty.
  return all[1]
end

return M
-- modules/query_store.lua
local M = {}

local history_file = vim.fn.stdpath("data") .. "/telescope_query_history.txt"

function M.save(query)
  if query == nil or query:match("^%s*$") then
    return
  end

  local lines = {}
  local file = io.open(history_file, "r")
  if file then
    for line in file:lines() do
      if line ~= query then
        table.insert(lines, line)
      end
    end
    file:close()
  end

  table.insert(lines, 1, query) -- Add new query to the top

  -- Limit history size
  local max_history = 100
  while #lines > max_history do
    table.remove(lines)
  end

  local out_file = io.open(history_file, "w")
  if out_file then
    out_file:write(table.concat(lines, "\n"))
    out_file:close()
  end
end

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

return M

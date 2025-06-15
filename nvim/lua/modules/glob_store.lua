local M = {}
local path = vim.fn.stdpath("config") .. "/glob_filter.json"
local max_history = 10

function M.save(value)
  if value == "" then
    return
  end
  local list = M.load_all()
  local new = { value }
  for _, v in ipairs(list) do
    if v ~= value then
      table.insert(new, v)
    end
  end
  while #new > max_history do
    table.remove(new)
  end
  local f = io.open(path, "w")
  if f then
    f:write(vim.fn.json_encode({ history = new }))
    f:close()
  end
end

function M.load_all()
  local f = io.open(path, "r")
  if f then
    local content = f:read("*a")
    f:close()
    local ok, decoded = pcall(vim.fn.json_decode, content)
    if ok and type(decoded) == "table" and decoded.history then
      return decoded.history
    end
  end
  return {}
end

function M.load_latest()
  local all = M.load_all()
  return all[1] or ""
end

return M

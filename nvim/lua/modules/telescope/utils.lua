local M = {}

function M.get_excluded()
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

function M.build_fd_args(glob)
  local args = { "fd", "--color", "never", "--hidden" }
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
  vim.list_extend(args, M.get_excluded())
  return args
end

return M

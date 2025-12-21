local categories = {
  "ai",
  "ui",
  "git",
  "lsp",
  "editing",
  "tools",
  "lang",
  "misc",
}



local function is_ignored_basename(basename)
  return basename:sub(1, 1) == "_"
end

local function add_specs(acc, specs)
  if specs == nil then
    return
  end

  if vim.tbl_islist(specs) then
    vim.list_extend(acc, specs)
    return
  end

  table.insert(acc, specs)
end

local function module_name(category, basename)
  return ("plugins.%s.%s"):format(category, basename)
end

local function scan_category(category)
  local root = vim.fn.stdpath("config") .. "/lua/plugins/" .. category
  local paths = vim.fn.globpath(root, "*.lua", false, true)
  table.sort(paths)

  local specs = {}
  for _, path in ipairs(paths) do
    local basename = vim.fn.fnamemodify(path, ":t:r")
    if not is_ignored_basename(basename) then
      local ok, mod = pcall(require, module_name(category, basename))
      if not ok then
        error(("plugins.index: failed loading %s/%s.lua: %s"):format(category, basename, mod))
      end

      add_specs(specs, mod)
    end
  end

  return specs
end

local all = {}
for _, category in ipairs(categories) do
  vim.list_extend(all, scan_category(category))
end

return all

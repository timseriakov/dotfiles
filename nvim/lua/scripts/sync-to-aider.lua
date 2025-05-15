-- ~/.config/nvim/scripts/sync-to-aider.lua

-- Создаём файл контекста
vim.fn.mkdir("context", "p")
vim.fn.writefile({
  "# Контекст для Aider",
  "- Сформирован через MCP tool",
}, ".context/from_mcp.md")

-- Добавляем .context в .gitignore, если его там нет
local gitignore = ".gitignore"
local context_dir = ".context"
local lines = {}
local found = false

if vim.fn.filereadable(gitignore) == 1 then
  lines = vim.fn.readfile(gitignore)
  for _, line in ipairs(lines) do
    if vim.trim(line) == context_dir then
      found = true
      break
    end
  end
end

if not found then
  table.insert(lines, context_dir)
  vim.fn.writefile(lines, gitignore)
end

-- Запускаем новый GUI Neovim и открываем Aider
vim.fn.jobstart({
  "nvim",
  "--cmd",
  [[lua vim.defer_fn(function()
    vim.cmd("AiderSend /add .context/from_mcp.md")
    vim.cmd("AiderToggle horizontal")
  end, 100)]],
}, {
  detach = true,
})

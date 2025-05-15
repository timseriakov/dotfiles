-- Получаем корень git-репозитория
local git_root = vim.fn.systemlist("git rev-parse --show-toplevel")[1]
if not git_root or git_root == "" then
  vim.notify("Не удалось найти git-репозиторий", vim.log.levels.ERROR)
  return
end

local context_dir = git_root .. "/.context"
local context_file = context_dir .. "/from_mcp.md"
local gitignore_file = git_root .. "/.gitignore"

-- Создаём директорию .context, если её нет
vim.fn.mkdir(context_dir, "p")

-- Пишем файл контекста
vim.fn.writefile({
  "# Контекст для Aider",
  "- Сформирован через MCP tool",
}, context_file)

-- Добавляем `.context` в `.gitignore`, если его там нет
local lines = {}
local found = false
if vim.fn.filereadable(gitignore_file) == 1 then
  lines = vim.fn.readfile(gitignore_file)
  for _, line in ipairs(lines) do
    if vim.trim(line) == ".context" then
      found = true
      break
    end
  end
end
if not found then
  table.insert(lines, ".context")
  vim.fn.writefile(lines, gitignore_file)
end

-- Запускаем GUI Neovim и открываем Aider с этим файлом
vim.fn.jobstart({
  "nvim",
  "--cmd",
  string.format(
    [[lua vim.defer_fn(function()
    vim.cmd("AiderSend /add %s")
    vim.cmd("AiderToggle horizontal")
  end, 100)]],
    vim.fn.fnameescape(context_file)
  ),
}, {
  detach = true,
})

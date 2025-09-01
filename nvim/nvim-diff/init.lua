-- Minimal nvim profile for diffs (Nord look, no plugins/LSP)
-- Launch: env NVIM_APPNAME=nvim-diff nvim -d <left> <right>

-- ===== Basics =====
vim.g.mapleader = " "
vim.opt.termguicolors = true
vim.opt.background = "dark"
vim.opt.number = true
vim.opt.cursorline = true
vim.opt.signcolumn = "no"
vim.opt.wrap = false
vim.o.scrolloff, vim.o.sidescrolloff = 3, 6
vim.opt.diffopt = {
  "filler",
  "vertical",
  "hiddenoff",
  "algorithm:patience",
  "indent-heuristic",
  "linematch:60",
}

-- Equalize splits automatically
vim.api.nvim_create_autocmd({ "VimEnter", "BufWinEnter", "WinResized" }, {
  callback = function()
    if vim.wo.diff then
      vim.cmd("wincmd =")
    end
  end,
})

-- ===== Nord-ish palette & highlights =====
local nord = {
  bg = "#2E3440",
  bg2 = "#3B4252",
  bg3 = "#434C5E",
  bg4 = "#4C566A",
  fg = "#D8DEE9",
  fg2 = "#E5E9F0",
  blue = "#81A1C1",
  green = "#A3BE8C",
  red = "#BF616A",
  yellow = "#EBCB8B",
  orange = "#D08770",
}
local function hl(g, v)
  vim.api.nvim_set_hl(0, g, v)
end
hl("Normal", { fg = nord.fg, bg = nord.bg })
hl("NormalFloat", { fg = nord.fg, bg = nord.bg2 })
hl("FloatBorder", { fg = nord.bg4, bg = nord.bg2 })
hl("WinSeparator", { fg = nord.bg4, bg = nord.bg })
hl("VertSplit", { fg = nord.bg4, bg = nord.bg })
hl("LineNr", { fg = nord.bg4, bg = nord.bg })
hl("CursorLineNr", { fg = nord.fg2, bg = nord.bg3, bold = true })
hl("CursorLine", { bg = nord.bg3 })
hl("Pmenu", { fg = nord.fg, bg = nord.bg2 })
hl("PmenuSel", { fg = nord.bg, bg = nord.blue, bold = true })
hl("StatusLine", { fg = nord.fg, bg = nord.bg3 })
hl("StatusLineNC", { fg = nord.bg4, bg = nord.bg })
-- Diff groups
hl("DiffAdd", { bg = "#223027", fg = nord.green })
hl("DiffDelete", { bg = "#3a2327", fg = nord.red })
hl("DiffChange", { bg = "#1f2b3a", fg = nord.blue })
hl("DiffText", { bg = "#2a3950", fg = nord.fg2, bold = true })

-- ===== Statusline =====
vim.o.laststatus = 3
vim.o.statusline = " %f %m %=  %l:%c  "

-- ===== Helpers: take from LEFT/RIGHT in 2-way diff =====
local function neighbor_buf(move)
  local cur = vim.api.nvim_get_current_win()
  vim.cmd("wincmd " .. move)
  local other = vim.api.nvim_get_current_win()
  if other == cur then
    return nil
  end
  local bufnr = vim.api.nvim_get_current_buf()
  vim.api.nvim_set_current_win(cur)
  return bufnr
end

local function take_left()
  local b = neighbor_buf("h")
  if b then
    vim.cmd("diffget " .. b)
  else
    vim.notify("No left diff window", vim.log.levels.WARN)
  end
end

local function take_right()
  local b = neighbor_buf("l")
  if b then
    vim.cmd("diffget " .. b)
  else
    vim.notify("No right diff window", vim.log.levels.WARN)
  end
end

-- ===== Keymaps (LazyVim-like, predictable) =====
local map = function(mode, lhs, rhs, desc)
  vim.keymap.set(mode, lhs, rhs, { noremap = true, silent = true, desc = desc })
end

-- Diagnostics off
vim.diagnostic.enable(false)

-- Quit
map("n", "<Space>q", ":qa!<CR>", "Quit all")

-- Navigate hunks
map("n", "<Space>j", "]c", "Next diff hunk")
map("n", "<Space>k", "[c", "Prev diff hunk")

-- Take changes
map("n", "<Space>h", take_left, "Take LEFT")
map("n", "<Space>l", take_right, "Take RIGHT")

-- Windows
map("n", "<Space>=", "<cmd>wincmd =<CR>", "Equalize windows")
map("n", "<Space>w", function()
  vim.wo.wrap = not vim.wo.wrap
end, "Toggle wrap")

-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua
-- Add any additional autocmds here

-- Автоформатирование при сохранении
vim.api.nvim_create_autocmd("BufWritePre", {
  pattern = { "*.js", "*.ts", "*.jsx", "*.tsx" },
  callback = function()
    vim.lsp.buf.format({ async = false })
  end,
})

vim.api.nvim_create_autocmd("VimEnter", {
  callback = function()
    vim.opt.rtp:prepend(vim.fn.stdpath("config") .. "/lua")
  end,
})

vim.api.nvim_create_autocmd("BufWritePre", {
  pattern = "*",
  command = [[%s/\s\+$//e]],
})

vim.api.nvim_create_autocmd("ColorScheme", {
  group = vim.api.nvim_create_augroup("CustomHL", { clear = true }),
  callback = function()
    vim.api.nvim_set_hl(0, "ObsidianVirtualH1", {
      fg = "#394253",
      bg = "#9CBF87",
      bold = true,
    })
  end,
})

-- применим сразу при старте
vim.api.nvim_set_hl(0, "ObsidianVirtualH1", {
  fg = "#394253",
  bg = "#9CBF87",
  bold = true,
})

-- Автоматическое переключение раскладки на английскую при входе в Normal Mode
-- и при фокусе на Neovim, если не находимся в Insert Mode
local function switch_to_english()
  vim.fn.jobstart({ "im-select", "com.apple.keylayout.ABC" })
end

vim.api.nvim_create_autocmd("InsertLeave", {
  callback = function()
    switch_to_english()
  end,
})

vim.api.nvim_create_autocmd("FocusGained", {
  callback = function()
    if vim.fn.mode() ~= "i" then
      switch_to_english()
    end
  end,
})

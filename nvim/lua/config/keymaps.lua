-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

-- Copy entire buffer to system clipboard
vim.keymap.set("n", "<leader>yy", ":%y+<CR>", { desc = "Copy entire buffer to clipboard" })

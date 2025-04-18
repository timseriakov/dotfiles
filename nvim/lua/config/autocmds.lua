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

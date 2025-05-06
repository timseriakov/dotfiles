local opts = { noremap = true, silent = true }

vim.api.nvim_set_keymap("n", "x", '"_x', opts)
vim.api.nvim_set_keymap("n", "X", '"_X', opts)

vim.api.nvim_set_keymap("n", "c", '"_c', opts)
vim.api.nvim_set_keymap("n", "C", '"_C', opts)
vim.api.nvim_set_keymap("n", "cc", '"_cc', opts)

vim.api.nvim_set_keymap("n", "d", '"_d', opts)
vim.api.nvim_set_keymap("n", "D", '"_D', opts)
vim.api.nvim_set_keymap("n", "dd", '"_dd', opts)

vim.api.nvim_set_keymap("v", "x", '"_x', opts)
vim.api.nvim_set_keymap("v", "d", '"_d', opts)

vim.api.nvim_set_keymap("n", "m", '"*c', opts)
vim.api.nvim_set_keymap("n", "mm", '"*cc', opts)
vim.api.nvim_set_keymap("n", "M", '"*C', opts)
vim.api.nvim_set_keymap("v", "m", '"*c', opts)

return {}

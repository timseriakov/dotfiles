-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

-- Copy entire buffer to system clipboard
vim.keymap.set("n", "<leader>yy", ":%y+<CR>", { desc = "Copy entire buffer to clipboard" })

vim.keymap.set(
  "n",
  "gpd",
  "<cmd>lua require('goto-preview').goto_preview_definition()<CR>",
  { desc = "Peek Definition" }
)
vim.keymap.set(
  "n",
  "gpi",
  "<cmd>lua require('goto-preview').goto_preview_implementation()<CR>",
  { desc = "Peek Implementation" }
)
vim.keymap.set(
  "n",
  "gpt",
  "<cmd>lua require('goto-preview').goto_preview_type_definition()<CR>",
  { desc = "Peek Type Definition" }
)
vim.keymap.set(
  "n",
  "gpr",
  "<cmd>lua require('goto-preview').goto_preview_references()<CR>",
  { desc = "Peek References" }
)
vim.keymap.set("n", "gpp", "<cmd>lua require('goto-preview').close_all_win()<CR>", { desc = "Close All Peek Windows" })

local peek_def = require("modules.split-definition")

vim.keymap.set("n", "gs", peek_def.split_definition, { desc = "Peek Definition (vsplit + return focus)" })

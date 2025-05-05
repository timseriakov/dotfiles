-- Peek in preview window
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

-- Open definition in vsplit
local peek_def = require("modules.split-definition")

vim.keymap.set("n", "gs", peek_def.split_definition, { desc = "Peek Definition (vsplit + return focus)" })

-- Jump back
vim.keymap.set("n", "gb", "<C-o>", { desc = "Jump back" })

-- Copy entire buffer to system clipboard
vim.keymap.set("n", "<leader>yy", ":%y+<CR>", { desc = "Copy entire buffer to clipboard" })
vim.keymap.set("n", "<leader>bg", ":%y+<CR>", { desc = "Copy entire buffer to clipboard" })

-- Replace buffer with system clipboard
vim.keymap.set("n", "<leader>bv", function()
  local clipboard = vim.fn.getreg("+")
  vim.api.nvim_buf_set_lines(0, 0, -1, false, vim.split(clipboard, "\n"))
end, { desc = "Replace buffer with system clipboard" })

-- LeetCode
vim.keymap.set("n", "<leader>cl", "<cmd>Leet<CR>", { desc = "LeetCode: Open dashboard" })

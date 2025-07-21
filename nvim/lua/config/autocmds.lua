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

vim.api.nvim_create_autocmd("BufEnter", {
  pattern = "*",
  callback = function()
    vim.b.snacks_indent = false
  end,
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

local spinner = { "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏" }
local group = vim.api.nvim_create_augroup("CodeCompanionFidgetHooks", { clear = true })
vim.api.nvim_create_autocmd({ "User" }, {
  pattern = "CodeCompanion*",
  group = group,
  callback = function(request)
    if request.match == "CodeCompanionChatSubmitted" then
      return
    end

    local msg

    msg = "[CodeCompanion] " .. request.match:gsub("CodeCompanion", "")

    vim.notify(msg, "info", {
      timeout = 1000,
      keep = function()
        return not vim
          .iter({ "Finished", "Opened", "Hidden", "Closed", "Cleared", "Created" })
          :fold(false, function(acc, cond)
            return acc or vim.endswith(request.match, cond)
          end)
      end,
      id = "code_companion_status",
      title = "Code Companion Status",
      opts = function(notif)
        notif.icon = ""
        if vim.endswith(request.match, "Started") then
          ---@diagnostic disable-next-line: undefined-field
          notif.icon = spinner[math.floor(vim.uv.hrtime() / (1e6 * 80)) % #spinner + 1]
        elseif vim.endswith(request.match, "Finished") then
          notif.icon = " "
        end
      end,
    })
  end,
})

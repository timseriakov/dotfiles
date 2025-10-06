-- Open definition in vsplit
local peek_def = require("modules.split-definition")

vim.keymap.set("n", "gs", peek_def.split_definition, { desc = "Peek Definition (vsplit + return focus)" })

-- Window size toggle function
local window_state = {}
local function toggle_window_size()
  local current_win = vim.api.nvim_get_current_win()
  local current_buf = vim.api.nvim_win_get_buf(current_win)

  -- Check if we have saved state for this buffer
  if window_state[current_buf] then
    -- Restore to 50/50 split
    vim.cmd("wincmd =")
    window_state[current_buf] = nil
  else
    -- Save current window configuration and maximize
    local win_config = vim.api.nvim_win_get_config(current_win)
    window_state[current_buf] = {
      width = win_config.width,
      height = win_config.height,
      col = win_config.col,
      row = win_config.row
    }

    -- Maximize current window
    vim.cmd("wincmd |")
  end
end

-- Toggle window size (moved to zoom mode)

-- Jump back
vim.keymap.set("n", "gb", "<C-o>", { desc = "Jump back" })

-- Copy entire buffer to system clipboard
vim.keymap.set("n", "<leader>yy", ":%y+<CR>", { desc = "Copy buffer to clipboard" })
vim.keymap.set("n", "<leader>bg", ":%y+<CR>", { desc = "Copy buffer to clipboard" })

-- Replace buffer with system clipboard
vim.keymap.set("n", "<leader>bv", function()
  local clipboard = vim.fn.getreg("+")
  vim.api.nvim_buf_set_lines(0, 0, -1, false, vim.split(clipboard, "\n"))
end, { desc = "Replace buffer with clipboard" })

-- Buffer copy filename and filepath
vim.keymap.set("n", "<leader>by", function()
  local filename = vim.fn.fnamemodify(vim.api.nvim_buf_get_name(0), ":t")
  vim.fn.setreg("+", filename)
  vim.notify("Copied filename: " .. filename)
end, { desc = "Copy filename to clipboard" })

vim.keymap.set("n", "<leader>bR", function()
  local fullpath = vim.api.nvim_buf_get_name(0)
  vim.fn.setreg("+", fullpath)
  vim.notify("Copied full path: " .. fullpath)
end, { desc = "Copy full path to clipboard" })

vim.keymap.set("n", "<leader>bY", function()
  local relpath = vim.fn.fnamemodify(vim.api.nvim_buf_get_name(0), ":.")
  vim.fn.setreg("+", relpath)
  vim.notify("Copied relative path: " .. relpath)
end, { desc = "Copy relative path to clipboard" })

-- LeetCode
local Menu = require("nui.menu")
local event = require("nui.utils.autocmd")
local map = vim.keymap.set

local langs = {
  { "JavaScript", "javascript" },
  { "TypeScript", "typescript" },
  { "Go", "golang" },
}

local function open_lang_menu()
  local items = vim.tbl_map(function(lang)
    return Menu.item(lang[1], { lang = lang[2] })
  end, langs)

  local menu = Menu({
    position = "50%",
    size = { width = 30, height = #items },
    border = {
      style = "rounded",
      text = { top = " LeetCode Language " },
    },
  }, {
    lines = items,
    max_width = 30,
    keymap = {
      focus_next = { "j", "<Down>" },
      focus_prev = { "k", "<Up>" },
      close = { "<Esc>", "q" },
      submit = { "<CR>", "<Space>" },
    },
    on_submit = function(item)
      require("leetcode.config").user.lang = item.lang
      vim.notify("LeetCode: switched to " .. item.text, vim.log.levels.INFO)
    end,
  })

  menu:mount()
  vim.api.nvim_create_autocmd("BufLeave", {
    buffer = menu.bufnr,
    once = true,
    callback = function()
      menu:unmount()
    end,
  })
end

-- LeetCode
map("n", "<leader>;l", "<cmd>Leet<CR>", { desc = "LeetCode: Dashboard" })
map("n", "<leader>;L", open_lang_menu, { desc = "LeetCode: Choose Language" })

-- Resty
vim.keymap.set({ "n", "v" }, "<leader>fh", ":Resty run<CR>", { desc = "Resty Run request" })
vim.keymap.set({ "n", "v" }, "<leader>fH", ":Resty favorite<CR>", { desc = "Resty favorites" })

-- Telescope import
vim.keymap.set({ "n", "v" }, "<leader>ct", ":Telescope import<CR>", { desc = "Telescope import" })

-- Fix: use vim.keymap.set for function callbacks (nvim_set_keymap doesn't support 'callback')
vim.keymap.set("n", "<leader>;r", function()
  local notify = vim.notify
  notify("Translating...", vim.log.levels.INFO)

  local buf = vim.api.nvim_get_current_buf()
  local lines = vim.api.nvim_buf_get_lines(buf, 0, -1, false)

  local output_lines = {}
  local blocks = {}
  local in_code_block = false

  for _, line in ipairs(lines) do
    if line:match("^```") then
      in_code_block = not in_code_block
      table.insert(blocks, { is_code = true, lines = { line } })
    elseif in_code_block then
      table.insert(blocks[#blocks].lines, line)
    elseif line:match("^%s*!%[.*%]%s*%(.+%)") then
      table.insert(blocks, { is_code = true, lines = { line } })
    else
      if not blocks[#blocks] or blocks[#blocks].is_code then
        table.insert(blocks, { is_code = false, lines = {} })
      end
      table.insert(blocks[#blocks].lines, line)
    end
  end

  local function process_block(i)
    local block = blocks[i]
    if not block then
      vim.api.nvim_buf_set_option(buf, "modifiable", true)
      vim.api.nvim_buf_set_lines(buf, 0, -1, false, output_lines)
      notify(
        "Готово: перевод завершён (код/изображения пропущены)",
        vim.log.levels.INFO
      )
      return
    end

    if block.is_code then
      for _, l in ipairs(block.lines) do
        table.insert(output_lines, l)
      end
      vim.schedule(function()
        process_block(i + 1)
      end)
    else
      local original_count = #block.lines
      local text = table.concat(block.lines, "\n")
      local job_id = vim.fn.jobstart({ "trans", "-brief", "-no-auto", ":ru" }, {
        stdout_buffered = true,
        on_stdout = function(_, data)
          vim.schedule(function()
            local clean = {}
            for _, l in ipairs(data or {}) do
              if not l:match("Showing translation") and not l:match("^%[.*%]$") then
                table.insert(clean, l)
              end
            end
            if #clean < original_count then
              for _ = #clean + 1, original_count do
                table.insert(clean, "")
              end
            end
            for _, l in ipairs(clean) do
              table.insert(output_lines, l)
            end
            process_block(i + 1)
          end)
        end,
        on_stderr = function(_, err)
          if err and #err > 0 and err[1] ~= "" then
            notify("Ошибка перевода блока " .. i, vim.log.levels.ERROR)
          end
        end,
      })
      vim.fn.chansend(job_id, text .. "\n")
      vim.fn.chanclose(job_id, "stdin")
    end
  end

  process_block(1)
end, { desc = "Translate buffer" })

-- popup.lua
local M = {}

function M.open_commit_popup(initial_text, commit_file, git_root, opts)
  local commit_buf = vim.api.nvim_create_buf(false, true)
  local diff_buf = vim.api.nvim_create_buf(false, true)

  local branch_name = vim.fn.systemlist("git rev-parse --abbrev-ref HEAD")[1] or "HEAD"
  local title = opts.amend and ("Amend Commit: " .. branch_name) or ("Commit: " .. branch_name)

  if opts.amend then
    local last_commit = vim.fn.systemlist("git log -1 --pretty=%B")[1] or "(no message)"
    initial_text = last_commit
  end

  local diff_lines = vim.fn.systemlist("git diff --cached", git_root)
  if #diff_lines == 0 then
    diff_lines = { "-- no staged changes --" }
  end

  vim.api.nvim_buf_set_lines(diff_buf, 0, -1, false, diff_lines)
  vim.bo[diff_buf].filetype = "diff"
  vim.bo[diff_buf].modifiable = false
  vim.bo[diff_buf].bufhidden = "wipe"

  vim.api.nvim_buf_set_lines(commit_buf, 0, -1, false, { initial_text })
  vim.bo[commit_buf].filetype = "gitcommit"
  vim.bo[commit_buf].bufhidden = "wipe"
  vim.bo[commit_buf].modifiable = not opts.amend
  vim.bo[commit_buf].readonly = opts.amend

  local width = math.floor(vim.o.columns * 0.6)
  local commit_height = 3
  local diff_height = math.floor(vim.o.lines * 0.45)
  local total_height = commit_height + diff_height + 2
  local row = math.floor((vim.o.lines - total_height) / 2)
  local col = math.floor((vim.o.columns - width) / 2)

  local commit_win = vim.api.nvim_open_win(commit_buf, true, {
    relative = "editor",
    width = width,
    height = commit_height,
    row = row,
    col = col,
    style = "minimal",
    border = "rounded",
    title = title,
    title_pos = "center",
  })

  local diff_win = vim.api.nvim_open_win(diff_buf, false, {
    relative = "editor",
    width = width,
    height = diff_height,
    row = row + commit_height + 2,
    col = col,
    style = "minimal",
    border = "rounded",
    title = "Diff: staged changes",
    title_pos = "center",
  })

  local function close_all()
    pcall(vim.api.nvim_win_close, commit_win, true)
    pcall(vim.api.nvim_win_close, diff_win, true)
  end

  local function map_key(buf, key, func)
    vim.keymap.set("n", key, func, { buffer = buf, silent = true })
  end

  map_key(commit_buf, "q", close_all)
  map_key(diff_buf, "q", close_all)
  map_key(commit_buf, "<C-j>", function()
    vim.api.nvim_set_current_win(diff_win)
  end)
  map_key(commit_buf, "<C-l>", function()
    vim.api.nvim_set_current_win(diff_win)
  end)
  map_key(diff_buf, "<C-k>", function()
    vim.api.nvim_set_current_win(commit_win)
  end)
  map_key(diff_buf, "<C-h>", function()
    vim.api.nvim_set_current_win(commit_win)
  end)

  for _, key in ipairs({ "<C-s>", "<CR>" }) do
    map_key(commit_buf, key, function()
      vim.api.nvim_exec_autocmds("BufWriteCmd", { buffer = commit_buf })
    end)
  end

  vim.api.nvim_create_autocmd("BufWriteCmd", {
    buffer = commit_buf,
    once = true,
    callback = function()
      local args = { "git", "commit" }

      if opts.amend then
        table.insert(args, "--amend")
        table.insert(args, "--no-edit")
      else
        local lines = vim.api.nvim_buf_get_lines(commit_buf, 0, -1, false)
        vim.fn.writefile(lines, commit_file)
        table.insert(args, "-F")
        table.insert(args, commit_file)
      end

      close_all()

      vim.fn.jobstart(args, {
        cwd = git_root,
        on_exit = function(_, code)
          vim.schedule(function()
            if code == 0 then
              vim.notify("  Commit created!", vim.log.levels.INFO)
            else
              vim.notify("  Commit failed", vim.log.levels.ERROR)
            end
          end)
        end,
      })
    end,
  })
end

return M

local popup = require("modules.ai_commit.popup")
local finders = require("telescope.finders")
local pickers = require("telescope.pickers")
local conf = require("telescope.config").values
local actions = require("telescope.actions")
local action_state = require("telescope.actions.state")
local builtin = require("telescope.builtin")

local M = {}

local function strip_ansi(line)
  return (line or ""):gsub("\27%[[0-9;?]*[ -/]*[@-~]", "")
end

local function parse_lazycommit_suggestions(data)
  local results = {}
  local seen = {}
  local cleaned_lines = {}

  local function add_result(value)
    local msg = vim.trim(strip_ansi(value))
    if msg == "" or seen[msg] then
      return
    end
    seen[msg] = true
    table.insert(results, msg)
  end

  local function ingest_decoded(value)
    if type(value) == "string" then
      add_result(value)
      return
    end

    if type(value) ~= "table" then
      return
    end

    for _, key in ipairs({ "suggestions", "messages", "commits", "results" }) do
      if value[key] ~= nil then
        ingest_decoded(value[key])
      end
    end

    for _, item in ipairs(value) do
      ingest_decoded(item)
    end
  end

  for _, line in ipairs(data or {}) do
    if type(line) == "string" then
      local cleaned = vim.trim(strip_ansi(line))
      if cleaned ~= "" then
        table.insert(cleaned_lines, cleaned)

        local numbered = cleaned:match("^%d+[%.)%-]%s*(.+)$")
        local bulleted = cleaned:match("^[-*•]%s*(.+)$")

        if numbered then
          add_result(numbered)
        elseif bulleted then
          add_result(bulleted)
        end
      end
    end
  end

  if not vim.tbl_isempty(results) then
    return results
  end

  local ok, decoded = pcall(vim.json.decode, table.concat(cleaned_lines, "\n"))
  if ok then
    ingest_decoded(decoded)
  end

  if not vim.tbl_isempty(results) then
    return results
  end

  local ignore_patterns = {
    "^suggested commit messages?:?$",
    "^commit messages?:?$",
    "^here are",
    "^generating",
    "^warning[:%- ]",
    "^error[:%- ]",
    "^info[:%- ]",
    "^no changes to commit$",
    "^nothing to commit$",
  }

  for _, line in ipairs(cleaned_lines) do
    local ignored = false
    local lowered = line:lower()

    for _, pattern in ipairs(ignore_patterns) do
      if lowered:match(pattern) then
        ignored = true
        break
      end
    end

    if not ignored then
      add_result(line)
    end
  end

  return results
end

local function get_git_root()
  local ok, result = pcall(function()
    local out = vim.fn.system("git rev-parse --show-toplevel")
    return vim.fn.trim(out)
  end)

  if ok and result and result ~= "" and vim.fn.isdirectory(result) == 1 then
    return result
  end

  local path = vim.fn.getcwd()
  while path and path ~= "/" do
    if vim.fn.isdirectory(path .. "/.git") == 1 then
      return path
    end
    path = vim.fn.fnamemodify(path, ":h")
  end

  return nil
end

local function run_ai_commit(git_root, desc, opts)
  local commit_file = git_root .. "/.git/COMMIT_EDITMSG"
  local stderr_accum = {}

  if opts.amend then
    popup.open_commit_popup("", commit_file, git_root, opts)
    return
  end

  local function ensure_lazycommit(callback)
    if vim.fn.executable("lazycommit") == 1 then
      callback()
    else
      vim.notify("📦 Installing lazycommit via bun...", vim.log.levels.INFO)
      vim.fn.jobstart({ "bun", "i", "-g", "@m7medvision/lazycommit@latest" }, {
        stdout_buffered = true,
        stderr_buffered = true,
        on_exit = function(_, code)
          if code == 0 then
            vim.schedule(callback)
          else
            vim.notify("❌ Failed to install lazycommit", vim.log.levels.ERROR)
          end
        end,
      })
    end
  end

  ensure_lazycommit(function()
    vim.fn.jobstart({ "lazycommit" }, {
      cwd = git_root,
      stdout_buffered = true,
      stderr_buffered = true,

      on_stdout = function(_, data)
        if not data or vim.tbl_isempty(data) then
          vim.notify("🟡 lazycommit: no output received", vim.log.levels.WARN)
          return
        end

        local results = parse_lazycommit_suggestions(data)

        if vim.tbl_isempty(results) then
          vim.notify("⚠️ lazycommit: no AI suggestions found", vim.log.levels.WARN)
          return
        end

        pickers
          .new({}, {
            prompt_title = desc,
            finder = finders.new_table({ results = results }),
            previewer = require("modules.ai_commit.previewer").diff_cached_previewer,
            sorter = conf.generic_sorter({}),
            layout_strategy = "horizontal",
            layout_config = {
              width = 0.9,
              height = 0.5,
              prompt_position = "top",
              preview_width = 0.33,
              anchor = "CENTER",
            },
            results_title = false,
            preview_title = "Files (staged)",
            border = true,
            attach_mappings = function(_, map)
              local apply = function(bufnr)
                local selection = action_state.get_selected_entry()
                actions.close(bufnr)
                if selection then
                  popup.open_commit_popup(selection[1], commit_file, git_root, opts)
                end
              end
              map("i", "<CR>", apply)
              map("n", "<CR>", apply)
              map("i", "<C-h>", actions.preview_scrolling_left)
              map("i", "<C-l>", actions.preview_scrolling_right)
              map("i", "<C-j>", actions.preview_scrolling_down)
              map("i", "<C-k>", actions.preview_scrolling_up)
              return true
            end,
          })
          :find()
      end,

      on_stderr = function(_, data)
        if data and not vim.tbl_isempty(data) then
          for _, line in ipairs(data) do
            if line:match("%S") then
              table.insert(stderr_accum, line)
            end
          end
        end
      end,

      on_exit = function(_, code)
        local stderr_combined = table.concat(stderr_accum, "\n")
        local quiet_patterns = {
          "No changes to commit",
          "nothing to commit",
        }

        for _, pat in ipairs(quiet_patterns) do
          if stderr_combined:lower():match(pat:lower()) then
            return
          end
        end

        if #stderr_combined > 0 then
          vim.notify("❌ lazycommit stderr:\n" .. stderr_combined, vim.log.levels.ERROR)
        elseif code ~= 0 then
          vim.notify("❌ lazycommit exited with code " .. code, vim.log.levels.ERROR)
        end
      end,
    })
  end)
end

function M.ai_commit(opts)
  local use_all = opts.all or false
  local use_amend = opts.amend or false
  local desc = use_all and (use_amend and "Commit (amend)" or "AI Commit (all)") or "AI Commit (staged only)"
  local git_root = get_git_root()

  if not git_root then
    vim.notify("❌ Not inside a valid git repository", vim.log.levels.ERROR)
    return
  end

  local function validate_and_run()
    local status = vim.fn.systemlist("git diff --name-only --cached")
    if vim.tbl_isempty(status) or (#status == 1 and status[1] == "") then
      vim.notify("🟡 No files staged for commit", vim.log.levels.WARN)
      return
    end
    run_ai_commit(git_root, desc, { amend = use_amend })
  end

  if opts.selected_files then
    vim.fn.jobstart(vim.list_extend({ "git", "add" }, opts.selected_files), {
      cwd = git_root,
      on_exit = validate_and_run,
    })
    return
  end

  if use_all then
    vim.fn.jobstart("git add -A", {
      cwd = git_root,
      on_exit = validate_and_run,
    })
  else
    validate_and_run()
  end
end

function M.pick_git_files_then_commit(opts)
  builtin.git_status({
    attach_mappings = function(_, map)
      actions.select_default:replace(function(prompt_bufnr)
        actions.close(prompt_bufnr)
        -- The default action of the picker already staged the files.
        -- We just need to proceed to the commit message generation.
        M.ai_commit({ amend = opts and opts.amend })
      end)
      return true
    end,
  })
end

function M.setup()
  vim.keymap.set("n", "<leader>ga", function()
    M.ai_commit({ all = true })
  end, { desc = "AI Commit: all changes" })

  vim.keymap.set("n", "<leader>gA", function()
    M.ai_commit({ all = true, amend = true })
  end, { desc = "Amend last commit" })

  vim.keymap.set("n", "<leader>gs", function()
    M.pick_git_files_then_commit()
  end, { desc = "AI Commit: select files" })

  vim.keymap.set("n", "<leader>gS", function()
    M.pick_git_files_then_commit({ amend = true })
  end, { desc = "AI Amend: select files" })
end

return M

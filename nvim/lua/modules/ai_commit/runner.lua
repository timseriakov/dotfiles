-- runner.lua
local popup = require("modules.ai_commit.popup")
local finders = require("telescope.finders")
local pickers = require("telescope.pickers")
local conf = require("telescope.config").values
local actions = require("telescope.actions")
local action_state = require("telescope.actions.state")
local Job = require("plenary.job")

local M = {}

local function run_ai_commit(git_root, desc, opts)
  local commit_file = git_root .. "/.git/COMMIT_EDITMSG"

  if opts.amend then
    popup.open_commit_popup("", commit_file, git_root, opts)
    return
  end

  vim.fn.jobstart({ "lazycommit" }, {
    cwd = git_root,
    stdout_buffered = true,
    on_stdout = function(_, data)
      local results = {}
      for _, line in ipairs(data) do
        if type(line) == "string" and line:match("^%d+%.%s*.+") then
          local msg = line:gsub("^%d+%.%s*", "")
          if msg and msg ~= "" then
            table.insert(results, msg)
          end
        end
      end

      if vim.tbl_isempty(results) then
        vim.notify("No AI commit suggestions found.", vim.log.levels.WARN)
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
            width = 0.75,
            height = 0.40,
            prompt_position = "top",
            preview_width = 0.35,
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
  })
end

local previewers = require("telescope.previewers")
local Path = require("plenary.path")

local function select_files_to_stage(callback)
  Job:new({
    command = "git",
    args = { "status", "--porcelain" },
    on_exit = function(j)
      local output = j:result()
      local entries = {}

      for _, line in ipairs(output) do
        local filepath = line:sub(4)
        if filepath ~= "" then
          table.insert(entries, { value = filepath, display = filepath, ordinal = filepath })
        end
      end

      vim.schedule(function()
        pickers
          .new({}, {
            prompt_title = "Select files to stage",
            finder = finders.new_table({
              results = entries,
              entry_maker = function(entry)
                return {
                  value = entry.value,
                  display = entry.display,
                  ordinal = entry.ordinal,
                }
              end,
            }),
            previewer = previewers.new_termopen_previewer({
              get_command = function(entry)
                return { "git", "diff", "--", entry.value }
              end,
            }),
            sorter = conf.generic_sorter({}),
            layout_strategy = "horizontal",
            layout_config = {
              width = 0.97,
              height = 0.97,
              preview_cutoff = 120,
              prompt_position = "bottom",
              preview_width = 0.65,
              anchor = "CENTER",
            },
            attach_mappings = function(prompt_bufnr, map)
              actions.select_default:replace(function()
                local picker = action_state.get_current_picker(prompt_bufnr)
                local selection = picker:get_multi_selection()
                if #selection == 0 then
                  local single = action_state.get_selected_entry()
                  if single then
                    selection = { single }
                  end
                end
                local files = vim.tbl_map(function(entry)
                  return entry.value
                end, selection)
                actions.close(prompt_bufnr)
                callback(files)
              end)
              return true
            end,
          })
          :find()
      end)
    end,
  }):start()
end

function M.ai_commit(opts)
  local use_all = opts.all or false
  local use_amend = opts.amend or false
  local desc = use_all and (use_amend and "Commit (amend)" or "AI Commit (all)") or "AI Commit (staged only)"
  local git_root = vim.fn.systemlist("git rev-parse --show-toplevel")[1]

  local function validate_and_run()
    local status = vim.fn.systemlist("git diff --name-only --cached")
    if vim.tbl_isempty(status) or (#status == 1 and status[1] == "") then
      vim.notify("No files staged for commit", vim.log.levels.WARN)
      return
    end
    run_ai_commit(git_root, desc, { amend = use_amend })
  end

  if use_all then
    vim.fn.jobstart("git add -A", {
      cwd = git_root,
      on_exit = function()
        validate_and_run()
      end,
    })
  elseif opts.select_files then
    select_files_to_stage(function(files)
      if vim.tbl_isempty(files) then
        vim.notify("No files selected", vim.log.levels.WARN)
        return
      end
      vim.fn.jobstart(vim.list_extend({ "git", "add" }, files), {
        cwd = git_root,
        on_exit = function()
          validate_and_run()
        end,
      })
    end)
  else
    validate_and_run()
  end
end

function M.setup()
  vim.keymap.set("n", "<leader>ga", function()
    M.ai_commit({ all = true })
  end, { desc = "AI Commit: all changes" })

  vim.keymap.set("n", "<leader>gA", function()
    M.ai_commit({ all = true, amend = true })
  end, { desc = "Amend last commit" })

  vim.keymap.set("n", "<leader>gs", function()
    M.ai_commit({ all = false, select_files = true })
  end, { desc = "AI Commit: select files" })
end

return M

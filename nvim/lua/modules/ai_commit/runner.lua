-- runner.lua
local popup = require("modules.ai_commit.popup")
local finders = require("telescope.finders")
local pickers = require("telescope.pickers")
local conf = require("telescope.config").values
local actions = require("telescope.actions")
local action_state = require("telescope.actions.state")

local M = {}

local function run_ai_commit(git_root, desc, opts)
  local commit_file = git_root .. "/.git/COMMIT_EDITMSG"

  -- если amend, сразу показываем попап без lazycommit
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
            width = 0.8,
            height = 0.45,
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

function M.ai_commit(opts)
  local use_all = opts.all or false
  local use_amend = opts.amend or false
  local desc = use_all and (use_amend and "AI Commit (amend)" or "AI Commit (all)") or "AI Commit (staged only)"
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
  end, { desc = "AI Commit: amend last commit" })

  vim.keymap.set("n", "<leader>gS", function()
    M.ai_commit({ all = false })
  end, { desc = "AI Commit: staged only" })
end

return M

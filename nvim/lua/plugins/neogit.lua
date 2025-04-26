return {
  "NeogitOrg/neogit",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "sindrets/diffview.nvim",
    "nvim-telescope/telescope.nvim",
  },
  config = function()
    local neogit = require("neogit")
    local diffview = require("diffview")
    local telescope_builtin = require("telescope.builtin")
    local actions = require("telescope.actions")
    local action_state = require("telescope.actions.state")
    local pickers = require("telescope.pickers")
    local finders = require("telescope.finders")
    local conf = require("telescope.config").values

    neogit.setup({
      integrations = {
        diffview = true,
        telescope = true,
      },
    })

    diffview.setup({
      keymaps = {
        view = { ["q"] = "<cmd>DiffviewClose<CR>" },
        file_panel = { ["q"] = "<cmd>DiffviewClose<CR>" },
        file_history_panel = { ["q"] = "<cmd>DiffviewClose<CR>" },
      },
    })

    vim.keymap.set("n", "<leader>gn", function()
      neogit.open()
    end, { desc = "Neogit: Open" })
    vim.keymap.set("n", "<leader>gd", function()
      diffview.open("HEAD")
    end, { desc = "Neogit: Side-by-side Git Diff" })
    vim.keymap.set("n", "<leader>gH", function()
      vim.cmd("DiffviewFileHistory %")
    end, { desc = "Neogit: Git File History (current file)" })

    vim.keymap.set("n", "<leader>gC", function()
      telescope_builtin.git_commits({
        attach_mappings = function(_, map)
          local open_diff = function(bufnr)
            local selection = action_state.get_selected_entry()
            actions.close(bufnr)
            if selection and selection.value then
              diffview.open(selection.value .. "..HEAD")
            end
          end
          map("i", "<CR>", open_diff)
          map("n", "<CR>", open_diff)
          return true
        end,
      })
    end, { desc = "Neogit: Diff selected commit (safe)" })

    vim.keymap.set("n", "<leader>gx", function()
      telescope_builtin.git_stash()
    end, { desc = "Neogit: Git Stash (Telescope)" })

    vim.keymap.set("n", "<leader>gv", function()
      telescope_builtin.git_branches({
        attach_mappings = function(_, map)
          local open_diff = function(bufnr)
            local selection = action_state.get_selected_entry()
            actions.close(bufnr)
            if selection and selection.value then
              diffview.open(selection.value .. "...HEAD")
            end
          end
          map("i", "<CR>", open_diff)
          map("n", "<CR>", open_diff)
          return true
        end,
      })
    end, { desc = "Neogit: Diff HEAD vs branch" })

    vim.keymap.set("n", "<leader>gV", function()
      local branches = {}
      vim.fn.jobstart("git branch --all --format='%(refname:short)'", {
        stdout_buffered = true,
        on_stdout = function(_, data)
          for _, line in ipairs(data) do
            if line ~= "" then
              table.insert(branches, line)
            end
          end

          local branch1 = nil
          pickers
            .new({}, {
              prompt_title = "Select first branch",
              finder = finders.new_table({ results = branches }),
              sorter = conf.generic_sorter({}),
              attach_mappings = function(_, map)
                map("i", "<CR>", function(bufnr)
                  local selection = action_state.get_selected_entry()
                  actions.close(bufnr)
                  branch1 = selection[1]

                  pickers
                    .new({}, {
                      prompt_title = "Select second branch",
                      finder = finders.new_table({ results = branches }),
                      sorter = conf.generic_sorter({}),
                      attach_mappings = function(_, map2)
                        map2("i", "<CR>", function(bufnr2)
                          local selection2 = action_state.get_selected_entry()
                          actions.close(bufnr2)
                          local branch2 = selection2[1]
                          diffview.open(branch1 .. "..." .. branch2)
                        end)
                        return true
                      end,
                    })
                    :find()
                end)
                return true
              end,
            })
            :find()
        end,
      })
    end, { desc = "Neogit: Diff branch vs branch" })

    local function run_ai_commit(git_root, desc)
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

          local commit_file = git_root .. "/.git/COMMIT_EDITMSG"
          pickers
            .new({}, {
              prompt_title = desc,
              finder = finders.new_table({ results = results }),
              sorter = conf.generic_sorter({}),
              attach_mappings = function(_, map)
                map("i", "<CR>", function(bufnr)
                  local selection = action_state.get_selected_entry()
                  actions.close(bufnr)
                  if selection then
                    vim.fn.writefile({ selection[1] }, commit_file)
                    vim.cmd("e " .. commit_file)

                    vim.api.nvim_create_autocmd("BufWritePost", {
                      once = true,
                      buffer = vim.api.nvim_get_current_buf(),
                      callback = function()
                        vim.fn.jobstart({ "git", "commit", "-F", commit_file }, {
                          cwd = git_root,
                          on_exit = function(_, code)
                            if code == 0 then
                              vim.notify("✅ Commit created!", vim.log.levels.INFO)
                            else
                              vim.notify("❌ Commit failed", vim.log.levels.ERROR)
                            end
                          end,
                        })
                      end,
                    })
                  end
                end)
                return true
              end,
            })
            :find()
        end,
        on_stderr = function(_, err)
          if err and err[1] and err[1] ~= "" then
            vim.notify(table.concat(err, "\n"), vim.log.levels.ERROR)
          end
        end,
      })
    end

    local function ai_commit(opts)
      local use_all = opts.all or false
      local desc = use_all and "AI Commit (all)" or "AI Commit (staged only)"
      local git_root = vim.fn.systemlist("git rev-parse --show-toplevel")[1]

      if use_all then
        vim.fn.jobstart("git add -A", {
          cwd = git_root,
          on_exit = function()
            local status = vim.fn.systemlist("git diff --cached")
            if vim.tbl_isempty(status) then
              vim.notify("No changes staged for commit", vim.log.levels.WARN)
              return
            end
            run_ai_commit(git_root, desc)
          end,
        })
      else
        local status = vim.fn.systemlist("git diff --cached")
        if vim.tbl_isempty(status) then
          vim.notify("No changes staged for commit", vim.log.levels.WARN)
          return
        end
        run_ai_commit(git_root, desc)
      end
    end

    vim.keymap.set("n", "<leader>ga", function()
      ai_commit({ all = true })
    end, { desc = "Neogit: AI Commit (all changes)" })

    vim.keymap.set("n", "<leader>gS", function()
      ai_commit({ all = false })
    end, { desc = "Neogit: AI Commit (staged only)" })
  end,
}

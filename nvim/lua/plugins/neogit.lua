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

		-- neogit setup
		neogit.setup({
			integrations = {
				diffview = true,
				telescope = true,
			},
		})

		-- diffview setup
		diffview.setup({
			keymaps = {
				view = { ["q"] = "<cmd>DiffviewClose<CR>" },
				file_panel = { ["q"] = "<cmd>DiffviewClose<CR>" },
				file_history_panel = { ["q"] = "<cmd>DiffviewClose<CR>" },
			},
		})

		-- 🔥 Горячие клавиши
		vim.keymap.set("n", "<leader>gn", neogit.open, { desc = "Neogit: Open" })

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
							diffview.open(selection.value)
						end
					end
					map("i", "<CR>", open_diff)
					map("n", "<CR>", open_diff)
					return true
				end,
			})
		end, { desc = "Neogit: Diff selected commit (Telescope)" })

		-- git stash
		vim.keymap.set("n", "<leader>gx", telescope_builtin.git_stash, {
			desc = "Neogit: Git Stash (Telescope)",
		})

		-- HEAD vs selected branch
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

		-- compare two branches
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
	end,
}

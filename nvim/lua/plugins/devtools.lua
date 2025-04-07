return {
	"akinsho/toggleterm.nvim",
	keys = {
		{ "<leader>f", name = "+devtools" },

		{
			"<leader>fd",
			function()
				local Terminal = require("toggleterm.terminal").Terminal
				Terminal:new({
					cmd = "lazydocker",
					direction = "float",
					float_opts = {
						border = "single",
						width = math.floor(vim.o.columns * 0.95),
						height = math.floor(vim.o.lines * 0.9),
					},
					count = 91,
				}):toggle()
			end,
			desc = "Lazydocker",
		},

		{
			"<leader>fs",
			function()
				local Terminal = require("toggleterm.terminal").Terminal
				local cmd = vim.fn.executable("btop") == 1 and "btop" or "htop"
				Terminal:new({
					cmd = cmd,
					direction = "float",
					float_opts = {
						border = "single",
						width = math.floor(vim.o.columns * 0.95),
						height = math.floor(vim.o.lines * 0.9),
					},
					count = 92,
				}):toggle()
			end,
			desc = "btop",
		},

		{
			"<leader>fo",
			function()
				local Terminal = require("toggleterm.terminal").Terminal
				Terminal:new({
					cmd = [[
set root (git rev-parse --show-toplevel);
set dir "$root/tools/posting";
test -d $dir; or mkdir -p $dir;
cd $dir; posting
]],
					direction = "float",
					float_opts = {
						border = "single",
						width = math.floor(vim.o.columns * 0.9),
						height = math.floor(vim.o.lines * 0.9),
					},
					count = 93,
					shell = "fish",
				}):toggle()
			end,
			desc = "Posting (tools/posting)",
		},

		{
			"<leader>fj",
			function()
				local Terminal = require("toggleterm.terminal").Terminal
				local git_root = vim.fn.systemlist("git rev-parse --show-toplevel")[1]
				if vim.v.shell_error ~= 0 or not git_root or git_root == "" then
					git_root = vim.fn.getcwd()
				end

				if not _JOSHUTO_TERM_PROJECT then
					_JOSHUTO_TERM_PROJECT = Terminal:new({
						cmd = "joshuto",
						dir = git_root,
						direction = "float",
						float_opts = {
							border = "single",
							width = math.floor(vim.o.columns * 0.95),
							height = math.floor(vim.o.lines * 0.9),
						},
						count = 94,
						on_open = function(term)
							vim.api.nvim_buf_set_keymap(
								term.bufnr,
								"t",
								"q",
								[[<cmd>lua require("toggleterm").toggle_all()<CR>]],
								{ noremap = true, silent = true }
							)
							vim.cmd("startinsert!")
						end,
					})
				end

				_JOSHUTO_TERM_PROJECT:toggle()
			end,
			desc = "Joshuto (project root)",
		},

		{
			"<leader>fl",
			function()
				local Terminal = require("toggleterm.terminal").Terminal
				local local_dir = vim.fn.expand("%:p:h")

				if not _JOSHUTO_TERM_LOCAL then
					_JOSHUTO_TERM_LOCAL = Terminal:new({
						cmd = "joshuto",
						dir = local_dir,
						direction = "float",
						float_opts = {
							border = "single",
							width = math.floor(vim.o.columns * 0.95),
							height = math.floor(vim.o.lines * 0.9),
						},
						count = 95,
						on_open = function(term)
							vim.api.nvim_buf_set_keymap(
								term.bufnr,
								"t",
								"q",
								[[<cmd>lua require("toggleterm").toggle_all()<CR>]],
								{ noremap = true, silent = true }
							)
							vim.cmd("startinsert!")
						end,
					})
				end

				_JOSHUTO_TERM_LOCAL:toggle()
			end,
			desc = "Joshuto (file directory)",
		},
	},
}

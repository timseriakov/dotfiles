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
	},
}

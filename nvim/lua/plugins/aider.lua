return {
	"GeorgesAlkhouri/nvim-aider",
	cmd = { "AiderTerminalToggle", "AiderHealth" },
	keys = {
		{ "<leader>a/", "<cmd>AiderTerminalToggle<cr>", desc = "Open Aider" },
		{ "<leader>as", "<cmd>AiderTerminalSend<cr>", desc = "Send to Aider", mode = { "n", "v" } },
		{ "<leader>ac", "<cmd>AiderQuickSendCommand<cr>", desc = "Send Command To Aider" },
		{ "<leader>ab", "<cmd>AiderQuickSendBuffer<cr>", desc = "Send Buffer To Aider" },
		{ "<leader>a+", "<cmd>AiderQuickAddFile<cr>", desc = "Add File to Aider" },
		{ "<leader>a-", "<cmd>AiderQuickDropFile<cr>", desc = "Drop File from Aider" },
		{ "<leader>ar", "<cmd>AiderQuickReadOnlyFile<cr>", desc = "Add File as Read-Only" },
		-- nvim-tree integration
		{ "<leader>a+", "<cmd>AiderTreeAddFile<cr>", desc = "Add File from Tree to Aider", ft = "NvimTree" },
		{ "<leader>a-", "<cmd>AiderTreeDropFile<cr>", desc = "Drop File from Tree from Aider", ft = "NvimTree" },
	},
	dependencies = {
		"folke/snacks.nvim",
		"nvim-tree/nvim-tree.lua",
	},
	config = function()
		require("nvim_aider").setup({
			aider_cmd = "aider",
			args = {
				"--no-auto-commits",
				"--pretty",
				"--stream",
				"--watch-files",
			},
			theme = {
				user_input_color = "#88C0D0", -- Arctic Water
				tool_output_color = "#81A1C1", -- Frost
				tool_error_color = "#BF616A", -- Aurora (Red)
				tool_warning_color = "#EBCB8B", -- Aurora (Yellow)
				assistant_output_color = "#B48EAD", -- Aurora (Purple)
				completion_menu_color = "#E5E9F0", -- Snow Storm (Lightest)
				completion_menu_bg_color = "#3B4252", -- Polar Night (Dark)
				completion_menu_current_color = "#ECEFF4", -- Snow Storm (White)
				completion_menu_current_bg_color = "#4C566A", -- Polar Night (Lighter)
			},
		})
	end,
}

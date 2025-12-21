return {
	"piersolenski/wtf.nvim",
	dependencies = {
		"MunifTanjim/nui.nvim", -- Dependency for UI
	},
	opts = {
		chat_dir = vim.fn.stdpath("data") .. "/wtf/chats", -- Where to store chat history
		openai_api_key = os.getenv("OPEN_API_KEY"), -- Use API key from environment
		openai_model_id = "gpt-3.5-turbo", -- Select ChatGPT model
		context = true, -- Send code context along with diagnostics
		search_engine = "google", -- Default search engine is Google
	},
	keys = {
		{
			"<leader>wd",
			mode = { "n", "x" },
			function()
				require("wtf").ai()
			end,
			desc = "WTF: AI assistant for debugging",
		},
		{
			"<leader>wg",
			mode = { "n" },
			function()
				require("wtf").search()
			end,
			desc = "WTF: Search diagnostics online",
		},
		{
			"<leader>wh",
			mode = { "n" },
			function()
				require("wtf").history()
			end,
			desc = "WTF: Chat history",
		},
		{
			"<leader>wt",
			mode = { "n" },
			function()
				require("wtf").grep_history()
			end,
			desc = "WTF: Search chat history with Telescope",
		},
	},
}

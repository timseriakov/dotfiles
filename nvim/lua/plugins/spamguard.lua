return {
	"timseriakov/spamguard.nvim",
	config = function()
		require("spamguard").setup({
			keys = {
				j = { threshold = 9, suggestion = "use s or f instead of spamming jjjj 😎" },
				k = { threshold = 9, suggestion = "try 10k instead of spamming kkkk 😎" },
				h = { threshold = 9, suggestion = "use 10h or b / ge 😎" },
				l = { threshold = 9, suggestion = "try w or e — it's faster! 😎" },
				w = { threshold = 9, suggestion = "use s or f — more precise and quicker! 😎" },
			},
		})
	end,
}

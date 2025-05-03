return {
  "timseriakov/spamguard.nvim",
  event = "VeryLazy",
  config = function()
    vim.schedule(function()
      local sg = require("spamguard")
      sg.setup({
        keys = {
          j = { threshold = 10, suggestion = "use s or f instead of spamming jjjj 😎" },
          k = { threshold = 10, suggestion = "try 10k instead of spamming kkkk 😎" },
          h = { threshold = 10, suggestion = "use 10h or b / ge 😎" },
          l = { threshold = 10, suggestion = "try w or e — it's faster! 😎" },
          w = { threshold = 7, suggestion = "use s or f — more precise and quicker! 😎" },
        },
      })
      sg.enable()
    end)
  end,
}

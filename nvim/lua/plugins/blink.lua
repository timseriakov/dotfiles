return {
  "saghen/blink.cmp",
  opts = function(_, opts)
    -- отключаем ghost text от Blink
    opts.completion = opts.completion or {}
    opts.completion.ghost_text = { enabled = false }

    -- Убираем Tab из blink.cmp, так как codeium.nvim сам управляет Tab
    opts.keymap = opts.keymap or {}
    opts.keymap["<Tab>"] = { "fallback" }
  end,
}

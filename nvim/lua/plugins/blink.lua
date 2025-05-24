return {
  "saghen/blink.cmp",
  opts = function(_, opts)
    -- отключаем ghost text от Blink
    opts.completion = opts.completion or {}
    opts.completion.ghost_text = { enabled = false }

    -- добавляем <Tab> для принятия Codeium
    opts.keymap = opts.keymap or {}
    opts.keymap["<Tab>"] = {
      LazyVim.cmp.map({
        "snippet_forward",
        "lua",
        function()
          return vim.fn["codeium#Accept"]()
        end,
      }),
      "fallback",
    }
  end,
}

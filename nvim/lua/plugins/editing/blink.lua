return {
  "saghen/blink.cmp",
  priority = 100, -- Load after other plugins to ensure our config overrides everything
  init = function()
    -- Принудительно отключаем ghost text ДО загрузки blink
    vim.g.blink_cmp_ghost_text = false
  end,
  opts = function(_, opts)
    -- ПОЛНОЕ отключение ghost text от Blink везде
    opts.completion = opts.completion or {}
    opts.completion.ghost_text = { enabled = false }

    -- ПОЛНОЕ отключение ghost text в командной строке
    opts.cmdline = opts.cmdline or {}
    opts.cmdline.completion = opts.cmdline.completion or {}
    opts.cmdline.completion.ghost_text = { enabled = false }

    -- Убираем Tab из blink.cmp, так как codeium.nvim сам управляет Tab
    opts.keymap = opts.keymap or {}
    opts.keymap["<Tab>"] = { "fallback" }
    opts.keymap["<S-Tab>"] = { "fallback" }

    -- Убираем AI источники из blink.cmp
    opts.sources = opts.sources or {}
    opts.sources.compat = opts.sources.compat or {}

    -- Убираем codeium из sources полностью
    if opts.sources.providers and opts.sources.providers.codeium then
      opts.sources.providers.codeium = nil
    end

    -- Убираем codeium из compat sources если он там есть
    if type(opts.sources.compat) == "table" then
      local filtered = {}
      for _, source in ipairs(opts.sources.compat) do
        if source ~= "codeium" then
          table.insert(filtered, source)
        end
      end
      opts.sources.compat = filtered
    end

    -- Убираем codeium из default sources если он там есть
    if type(opts.sources.default) == "table" then
      local filtered = {}
      for _, source in ipairs(opts.sources.default) do
        if source ~= "codeium" then
          table.insert(filtered, source)
        end
      end
      opts.sources.default = filtered
    end

    return opts
  end,
}

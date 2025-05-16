return {
  "hrsh7th/nvim-cmp",
  opts = function(_, opts)
    local cmp = require("cmp")

    opts.mapping = cmp.mapping.preset.insert({
      ["<CR>"] = cmp.mapping.confirm({ select = true }), -- Enter = принять выбранное
      ["<Tab>"] = function(fallback)
        fallback() -- Tab не трогает cmp, нужен для codeium
      end,
      ["<S-Tab>"] = function(fallback)
        fallback()
      end,
    })

    -- отключаем ghost_text, чтобы не мешал codeium
    opts.experimental = vim.tbl_extend("force", opts.experimental or {}, {
      ghost_text = false,
    })

    -- фильтруем codeium из глобальных источников
    opts.sources = vim.tbl_filter(function(source)
      return source.name ~= "codeium"
    end, opts.sources or {})

    -- добавляем per_filetype.sources
    opts.sources = vim.tbl_extend("force", opts.sources or {}, {
      per_filetype = {
        codecompanion = {
          { name = "codecompanion" },
        },
      },
    })
  end,
}

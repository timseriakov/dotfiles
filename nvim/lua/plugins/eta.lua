return {
  "timseriakov/nvim-eta",
  ft = "eta", -- Lazy load only for .eta files
  dependencies = {
    "nvim-treesitter/nvim-treesitter",
    "windwp/nvim-ts-autotag",
  },
  config = function()
    require("nvim-eta").setup({
      -- Enable Treesitter integration
      treesitter = true,

      -- LSP configuration
      lsp = {
        html = true, -- HTML Language Server
        tailwindcss = true, -- TailwindCSS IntelliSense
        emmet = true, -- Emmet abbreviations
      },

      -- Auto-closing tags via nvim-ts-autotag
      autotag = true,
    })
  end,
}

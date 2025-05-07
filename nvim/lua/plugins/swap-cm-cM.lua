return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        vtsls = {
          keys = {
            { "<leader>cM", false },
            { "<leader>cm", LazyVim.lsp.action["source.addMissingImports.ts"], desc = "Add missing imports" },
          },
        },
      },
    },
  },
  {
    "williamboman/mason.nvim",
    keys = {
      { "<leader>cm", false },
      { "<leader>cM", "<cmd>Mason<CR>", desc = "Mason" },
    },
  },
}

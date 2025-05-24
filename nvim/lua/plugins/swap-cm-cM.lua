return {
  {
    "neovim/nvim-lspconfig",
    opts = function(_, opts)
      local vtsls = opts.servers.vtsls or {}
      vtsls.keys = vtsls.keys or {}

      vtsls.keys = vim.tbl_filter(function(key)
        return key[1] ~= "<leader>cM" and key[1] ~= "<leader>cm"
      end, vtsls.keys)

      table.insert(vtsls.keys, {
        "<leader>cm",
        LazyVim.lsp.action["source.addMissingImports.ts"],
        desc = "Add missing imports",
      })

      opts.servers.vtsls = vtsls
    end,
  },
  {
    "williamboman/mason.nvim",
    keys = {
      { "<leader>cm", false },
      { "<leader>cM", "<cmd>Mason<CR>", desc = "Mason" },
    },
  },
}

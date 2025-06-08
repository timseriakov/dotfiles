return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        sourcekit = {
          cmd = { "sourcekit-lsp" },
          filetypes = { "swift" },
        },
      },
    },
  },

  {
    "nvim-lua/plenary.nvim",
    config = function()
      vim.env.TMPDIR = "/tmp/nvim"
      vim.fn.mkdir(vim.env.TMPDIR, "p")

      vim.api.nvim_create_autocmd("FileType", {
        pattern = "swift",
        callback = function()
          local root_file = vim.fs.find({ "Package.swift", ".git" }, { upward = true })[1]
          if not root_file then
            return
          end
          local root = vim.fs.dirname(root_file)

          vim.lsp.start({
            name = "sourcekit-lsp",
            cmd = { "sourcekit-lsp" },
            root_dir = root,
          })

          vim.opt_local.foldmethod = "indent"
          vim.opt_local.foldenable = true
        end,
      })
    end,
  },

  {
    "nvim-treesitter/nvim-treesitter",
    config = function()
      local parser_dir = vim.fn.stdpath("data") .. "/tree-sitter-parsers"
      vim.fn.mkdir(parser_dir, "p")

      require("nvim-treesitter.parsers").get_parser_configs().swift = {
        install_info = {
          url = "https://github.com/tree-sitter/tree-sitter-swift",
          files = { "src/parser.c" },
          branch = "main",
          generate_requires_npm = false,
        },
        filetype = "swift",
      }

      require("nvim-treesitter.configs").setup({
        parser_install_dir = parser_dir,
        ensure_installed = {},
        highlight = { enable = true },
        indent = { enable = true },
      })
    end,
  },
}

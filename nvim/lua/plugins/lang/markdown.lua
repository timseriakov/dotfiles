return {
  "iamcco/markdown-preview.nvim",
  build = function()
    vim.fn.system("cd app && npm exec --yes --package=yarn@1.22.22 -- yarn install --frozen-lockfile")
  end,
  ft = { "markdown" },
  cmd = { "MarkdownPreview", "MarkdownPreviewStop", "MarkdownPreviewToggle" },
}

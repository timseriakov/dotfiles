return {
  "iamcco/markdown-preview.nvim",
  build = function()
    -- Use frozen lockfile to avoid modifying yarn.lock
    vim.fn.system("cd app && rm -rf yarn.lock && yarn install --frozen-lockfile")
  end,
  ft = { "markdown" },
  cmd = { "MarkdownPreview", "MarkdownPreviewStop", "MarkdownPreviewToggle" },
}

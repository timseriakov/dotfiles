return {
  "terrastruct/d2-vim",
  -- Load for D2 files and also on keypress so mappings work in any file
  ft = { "d2" },
  keys = {
    -- Prefix: <leader>2 ... (Space+2)
    { "<leader>2p", "<cmd>D2Preview<CR>", mode = "n", desc = "D2: Preview buffer" },
    { "<leader>2u", "<cmd>D2PreviewUpdate<CR>", mode = "n", desc = "D2: Update preview" },
    { "<leader>2t", "<cmd>D2PreviewToggle<CR>", mode = "n", desc = "D2: Toggle preview" },
    { "<leader>2y", "<cmd>D2PreviewCopy<CR>", mode = "n", desc = "D2: Copy preview" },
    { "<leader>2s", ":'<,'>D2PreviewSelection<CR>", mode = "v", desc = "D2: Preview selection" },
    { "<leader>2r", ":'<,'>D2ReplaceSelection<CR>", mode = "v", desc = "D2: Replace selection" },
    { "<leader>2a", "<cmd>D2AsciiToggle<CR>", mode = "n", desc = "D2: Toggle autorender" },
    { "<leader>2f", "<cmd>D2Fmt<CR>", mode = "n", desc = "D2: Format" },
    { "<leader>2F", "<cmd>D2FmtToggle<CR>", mode = "n", desc = "D2: Toggle autoformat" },
    { "<leader>2v", "<cmd>D2Validate<CR>", mode = "n", desc = "D2: Validate" },
    { "<leader>2V", "<cmd>D2ValidateToggle<CR>", mode = "n", desc = "D2: Toggle autovalidate" },
    { "<leader>2P", "<cmd>D2Play<CR>", mode = "n", desc = "D2: Open playground" },
  },
  init = function()
    -- ASCII preview configuration
    vim.g.d2_ascii_autorender = 1 -- auto-render on save
    vim.g.d2_ascii_command = "d2" -- binary name
    -- Default to basic ASCII characters for maximum compatibility
    vim.g.d2_ascii_mode = "extended" -- "extended" | "standard"

    -- Auto-formatting on save via `d2 fmt`
    vim.g.d2_fmt_autosave = 1
    vim.g.d2_fmt_command = "d2 fmt"
    vim.g.d2_fmt_fail_silently = 0

    -- Validation (off by default; toggle with :D2ValidateToggle)
    vim.g.d2_validate_autosave = 0
    vim.g.d2_validate_command = "d2 validate"
    vim.g.d2_list_type = "quickfix"
    vim.g.d2_validate_fail_silently = 0

    -- Playground defaults
    vim.g.d2_play_command = "d2 play"
    vim.g.d2_play_theme = 0
    vim.g.d2_play_sketch = 0

    -- Treesitter integration for D2 is disabled; highlighting falls back to d2-vim
  end,
}

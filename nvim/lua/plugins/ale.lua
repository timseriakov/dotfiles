-- ALE for TypeScript/JavaScript projects
-- Keep builtin LSP for IDE features, use ALE only for linting and fixing
return {
  "dense-analysis/ale",
  event = { "BufReadPre", "BufNewFile" },
  init = function()
    -- Use Neovim diagnostics UI
    vim.g.ale_use_neovim_diagnostics_api = 1
    -- Auto-disable ALE LSP if builtin LSP is active
    vim.g.ale_disable_lsp = "auto"

    -- Stop ALE from echoing messages, which are then picked up by noice
    vim.g.ale_echo_cursor = 0

    -- Linting triggers
    vim.g.ale_lint_on_enter = 1
    vim.g.ale_lint_on_text_changed = "never"
    vim.g.ale_lint_on_insert_leave = 1

    -- Fix on save
    vim.g.ale_fix_on_save = 1

    -- Signs configuration
    vim.g.ale_sign_column_always = 1
    vim.g.ale_sign_error = ""
    vim.g.ale_sign_warning = ""

    -- Explicit linters
    vim.g.ale_linters_explicit = 1
    vim.g.ale_linters = {
      typescript = { "eslint" },
      typescriptreact = { "eslint" },
      javascript = { "eslint" },
      javascriptreact = { "eslint" },
    }

    -- Fixers: Prettier then ESLint
    vim.g.ale_fixers = {
      ["*"] = { "remove_trailing_lines", "trim_whitespace" },
      typescript = { "prettier", "eslint" },
      typescriptreact = { "prettier", "eslint" },
      javascript = { "prettier", "eslint" },
      javascriptreact = { "prettier", "eslint" },
    }

    -- Show virtual text only on current line
    vim.g.ale_virtualtext_cursor = "current"
  end,
}

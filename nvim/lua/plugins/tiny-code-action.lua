return {
  "rachartier/tiny-code-action.nvim",
  event = "LspAttach",
  dependencies = {
    { "nvim-lua/plenary.nvim" },
    { "nvim-telescope/telescope.nvim" },
    -- Альтернатива: snacks.nvim или fzf-lua по вкусу
    {
      "folke/snacks.nvim",
      opts = {
        terminal = {},
      },
    },
  },
  opts = {
    backend = "vim", -- или "delta", если установлен delta
    picker = {
      "telescope",
      opts = {
        layout_strategy = "vertical",
        layout_config = {
          width = 0.7,
          height = 0.9,
          preview_cutoff = 1,
          preview_height = function(_, _, max_lines)
            local h = math.floor(max_lines * 0.5)
            return math.max(h, 10)
          end,
        },
      },
    },
    backend_opts = {
      delta = {
        header_lines_to_remove = 4,
        args = { "--line-numbers" },
      },
      difftastic = {
        header_lines_to_remove = 1,
        args = {
          "--color=always",
          "--display=inline",
          "--syntax-highlight=on",
        },
      },
      diffsofancy = {
        header_lines_to_remove = 4,
      },
    },
    signs = {
      quickfix = { "󰁨", { link = "DiagnosticInfo" } },
      others = { "?", { link = "DiagnosticWarning" } },
      refactor = { "", { link = "DiagnosticWarning" } },
      ["refactor.move"] = { "󰪹", { link = "DiagnosticInfo" } },
      ["refactor.extract"] = { "", { link = "DiagnosticError" } },
      ["source.organizeImports"] = { "", { link = "DiagnosticWarning" } },
      ["source.fixAll"] = { "", { link = "DiagnosticError" } },
      ["source"] = { "", { link = "DiagnosticError" } },
      ["rename"] = { "󰑕", { link = "DiagnosticWarning" } },
      ["codeAction"] = { "", { link = "DiagnosticError" } },
    },
  },
  keys = {
    {
      "<leader>cj",
      function()
        require("tiny-code-action").code_action()
      end,
      desc = "Code Action (Tiny)",
    },
  },
}

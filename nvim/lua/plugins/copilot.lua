return {
  {
    "zbirenbaum/copilot.lua",
    event = "InsertEnter",
    cmd = "Copilot",
    opts = {
      panel = { enabled = false },
      suggestion = {
        enabled = true,
        auto_trigger = true,
        debounce = 75,
        keymap = {
          accept = "<Tab>", -- accept entire suggestion
          accept_word = "<M-o>", -- accept next word
          accept_line = "<M-l>", -- accept until end of line
          next = "<M-n>", -- next suggestion
          prev = "<M-p>", -- previous suggestion
          dismiss = "<M-esc>", -- dismiss suggestion
        },
      },
      filetypes = {
        markdown = true,
        gitcommit = true,
        ["*"] = true,
      },
    },
  },
}

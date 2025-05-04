return {
  "chrisgrieser/nvim-spider",
  event = "VeryLazy",
  config = function()
    require("spider").setup({
      skipInsignificantPunctuation = false,
      consistentOperatorPending = false,
      subwordMovement = true,
    })

    vim.schedule(function()
      vim.keymap.set(
        { "n", "o", "x" },
        "w",
        "<cmd>lua require('spider').motion('w')<CR>",
        { noremap = true, silent = true }
      )
      vim.keymap.set(
        { "n", "o", "x" },
        "e",
        "<cmd>lua require('spider').motion('e')<CR>",
        { noremap = true, silent = true }
      )
      vim.keymap.set(
        { "n", "o", "x" },
        "b",
        "<cmd>lua require('spider').motion('b')<CR>",
        { noremap = true, silent = true }
      )
    end)
  end,
}

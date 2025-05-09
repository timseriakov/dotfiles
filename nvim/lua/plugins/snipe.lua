return {
  "leath-dub/snipe.nvim",
  keys = {
    {
      "g<leader>",
      function()
        require("snipe").open_buffer_menu()
      end,
      desc = "Open Snipe buffer menu",
    },
  },
  opts = {
    ui = {
      max_height = -1, -- -1 means dynamic height (adapts to number of items)
      position = "center", -- Show menu centered on screen
      open_win_override = {
        border = "single", -- You can use "rounded", "none", etc.
        -- title = "Buffer Menu", -- Uncomment to set custom title
      },
      preselect_current = false, -- Automatically select current buffer
      preselect = nil, -- Function to dynamically preselect a buffer
      text_align = "left", -- Can be "left", "right", or "file-first"
      -- buffer_format = { "->", "icon", "filename", "", "directory" },
    },
    hints = {
      dictionary = "asdfgqwertzxcvb", -- Characters used for hint tags
    },
    navigate = {
      next_page = "J", -- Go to next page
      prev_page = "K", -- Go to previous page
      under_cursor = "<cr>", -- Select item under cursor
      cancel_snipe = "<esc>", -- Cancel and close the menu
      close_buffer = "D", -- Close the buffer under cursor
      open_vsplit = "V", -- Open in vertical split
      open_split = "H", -- Open in horizontal split
      change_tag = "C", -- Change hint tag manually
    },
    sort = "default", -- Sort buffers by buffer number (can also be "last" or a function)
  },
}

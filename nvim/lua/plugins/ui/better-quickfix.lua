return {
  "kevinhwang91/nvim-bqf",
  -- Only load the plugin when a quickfix window is opened (filetype = qf)
  -- This is for performance optimization.
  ft = "qf",
  -- BQF requires the fzf.vim plugin to be available for its `zf` command.
  dependencies = {
    {
      "junegunn/fzf",
      -- The `run` command updates the fzf binary, which is good practice.
      run = function()
        vim.fn["fzf#install"]()
      end,
    },
  },
  config = function()
    require("bqf").setup({
      -- ## General settings ##
      auto_enable = true, -- Automatically enable nvim-bqf for quickfix windows.
      magic_window = true, -- Keeps the main window's cursor position stable when opening the quickfix window.
      auto_resize_height = true, -- Automatically resize the qf window height based on the number of items. Highly recommended.
      previous_winid_ft_skip = {}, -- Filetypes to skip when finding the previous window.

      -- ## Custom key mappings for the quickfix window ##
      func_map = {
        -- We remapped the horizontal split key to <C-s> to match personal preference.
        -- The default was <C-x>.
        -- split = "<C-s>",
      },

      -- ## Preview window settings ##
      preview = {
        auto_preview = true, -- Enable auto-preview on cursor move inside the quickfix list.
        border = "rounded", -- Style of the preview window border.
        show_title = true, -- Show the file path as a title in the preview window.
        show_scroll_bar = true, -- Show a scrollbar in the preview window.
        delay_syntax = 50, -- Delay in ms for applying syntax highlighting to the previewed buffer.
        win_height = 15, -- Height of the preview window for horizontal quickfix layout.
        win_vheight = 15, -- Height of the preview window for vertical quickfix layout.
        -- We set winblend to 0 to make the preview window fully opaque for better readability.
        -- The default is 12 (semi-transparent).
        winblend = 0,
        wrap = false, -- Do not wrap lines in the preview window.
        buf_label = true, -- Show buffer index label (e.g., [1/3]) in the quickfix list.
        -- Callback to decide whether to preview a file. Return false to skip.
        -- We provide a default function to satisfy the linter.
        should_preview_cb = function()
          return true
        end,
      },

      -- ## FZF integration settings (for filtering within the qf window) ##
      -- These are default values to satisfy the linter.
      filter = {
        fzf = {
          action_for = {
            ["ctrl-t"] = "tabedit",
            ["ctrl-v"] = "vsplit",
            ["ctrl-x"] = "split",
            ["ctrl-q"] = "signtoggle",
            ["ctrl-c"] = "closeall",
          },
          extra_opts = { "--bind", "ctrl-o:toggle-all" },
        },
      },
    })
  end,
}

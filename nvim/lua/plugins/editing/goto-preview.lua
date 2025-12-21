return {
  "rmagatti/goto-preview",
  dependencies = { "rmagatti/logger.nvim" },
  event = "BufEnter",
  opts = {
    -- Small default preview for `gp`
    width = 104,
    height = 18,
    border = { "↖", "─", "┐", "│", "┘", "─", "└", "│" },
    default_mappings = false,
    resizing_mappings = true,
    focus_on_open = true,
    dismiss_on_move = false,
    force_close = true,
    bufhidden = "wipe",
    stack_floating_preview_windows = true,
    same_file_float_preview = true,
    preview_window_title = { enable = true, position = "left" },

    -- Big vertical layout for `gP` with preview (top results, bottom preview)
    references = {
      provider = "telescope",
      telescope = {
        layout_strategy = "vertical",
        sorting_strategy = "ascending",
        previewer = true,
        -- Force preview to always show
        layout_config = {
          width = 0.96, -- a bit less than fullscreen
          height = 0.96,
          preview_height = 0.6, -- preview takes ~2/3 bottom
          preview_cutoff = 0, -- do not disable preview due to size
          prompt_position = "bottom",
          mirror = false,
        },
        results_title = "References",
        preview_title = "Preview",
        -- Show full paths
        path_display = function(_, path)
          return path
        end,
      },
    },

    vim_ui_input = true,
    post_open_hook = function(buf)
      -- Make 'q' close only inside preview windows
      vim.keymap.set("n", "q", "<cmd>close<CR>", {
        buffer = buf,
        silent = true,
        nowait = true,
        desc = "Close preview window",
      })
    end,
  },

  keys = {
    {
      "gp",
      function()
        local ok, gp = pcall(require, "goto-preview")
        if not ok then
          return
        end
        -- Try Definition -> Type Definition -> Implementation
        if pcall(gp.goto_preview_definition) then
          return
        end
        if pcall(gp.goto_preview_type_definition) then
          return
        end
        pcall(gp.goto_preview_implementation)
      end,
      mode = "n",
      desc = "Preview: Definition → Type → Implementation",
      noremap = true,
      silent = true,
      nowait = true,
    },
    {
      "gP",
      function()
        local ok, gp = pcall(require, "goto-preview")
        if ok then
          gp.goto_preview_references()
        end
      end,
      mode = "n",
      desc = "Preview References (vertical w/ preview)",
      noremap = true,
      silent = true,
      nowait = true,
    },
  },
}

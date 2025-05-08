return {
  "nvim-telescope/telescope.nvim",
  dependencies = { "nvim-lua/plenary.nvim" },
  opts = {
    defaults = {
      layout_strategy = "horizontal",
      layout_config = {
        horizontal = {
          preview_width = 0.55,
          prompt_position = "bottom",
        },
        width = 0.95,
        height = 0.95,
        preview_cutoff = 120,
      },
      sorting_strategy = "descending",
      winblend = 0,

      -- 🔍 live_grep: игнорируем изображения
      vimgrep_arguments = {
        "rg",
        "--color=never",
        "--no-heading",
        "--with-filename",
        "--line-number",
        "--column",
        "--smart-case",
        "--hidden",
        "--follow",
        "--glob",
        "!*.png",
        "--glob",
        "!*.jpg",
        "--glob",
        "!*.jpeg",
        "--glob",
        "!*.gif",
        "--glob",
        "!*.svg",
        "--glob",
        "!*.webp",
      },

      -- 🧠 кастомный previewer для PDF
      buffer_previewer_maker = function(filepath, bufnr, opts)
        local Job = require("plenary.job")
        if filepath:match("%.pdf$") then
          Job:new({
            command = "pdftotext",
            args = { "-layout", "-nopgbrk", filepath, "-" },
            on_exit = function(j)
              local result = j:result()
              vim.schedule(function()
                vim.api.nvim_buf_set_lines(bufnr, 0, -1, false, result)
              end)
            end,
          }):start()
        else
          require("telescope.previewers").buffer_previewer_maker(filepath, bufnr, opts)
        end
      end,
    },

    -- 📁 find_files: исключаем изображения через fd
    pickers = {
      find_files = {
        find_command = {
          "fd",
          "--type",
          "f",
          "--color",
          "never",
          "-E",
          "*.png",
          "-E",
          "*.jpg",
          "-E",
          "*.jpeg",
          "-E",
          "*.gif",
          "-E",
          "*.svg",
          "-E",
          "*.webp",
        },
      },
    },
  },
}

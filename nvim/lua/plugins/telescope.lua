return {
  "nvim-telescope/telescope.nvim",
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

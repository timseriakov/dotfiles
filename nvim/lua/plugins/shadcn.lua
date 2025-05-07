return {
  {
    "BibekBhusal0/nvim-shadcn",
    cmd = {
      "ShadcnAdd",
      "ShadcnInit",
      "ShadcnAddImportant",
    },
    dependencies = {
      "nvim-telescope/telescope.nvim",
    },
    config = function()
      require("nvim-shadcn").setup({
        default_installer = "bun",

        format = {
          doc = "https://ui.shadcn.com/docs/components/%s",
          npm = "npx shadcn@latest add %s",
          pnpm = "pnpm dlx shadcn@latest add %s",
          yarn = "npx shadcn@latest add %s",
          bun = "bunx --bun shadcn@latest add %s",
        },

        -- Показ промежуточной информации
        verbose = false,

        -- Список важных компонентов для `:ShadcnAddImportant`
        important = { "button", "card", "checkbox", "tooltip" },

        -- Telescope keymaps внутри UI списка
        keys = {
          -- В нормальном и insert-режиме: открыть документацию компонента
          i = { doc = "<C-o>" },
          n = { doc = "<C-o>" },

          -- Дополнительно можно добавить биндинги для альтернативных package managers:
          -- i = { yarn = "<C-y>" },
          -- n = { yarn = "<C-y>" },
        },

        -- Команды для инициализации
        init_command = {
          commands = {
            npm = "npx shadcn@latest init",
            pnpm = "pnpm dlx shadcn@latest init",
            yarn = "npx shadcn@latest init",
            bun = "bunx --bun shadcn@latest init",
          },
          flags = {
            defaults = false,
            force = false,
          },
          default_color = "Gray", -- Цвет (с большой буквы)
        },

        -- Telescope UI настройки
        telescope_config = {
          sorting_strategy = "ascending",
          prompt_title = "Shadcn UI components",
          layout_config = {
            prompt_position = "top",
          },
        },
      })
    end,

    keys = {
      { "<leader>;a", "<cmd>ShadcnAdd<CR>", desc = "Add shadcn component" },
      { "<leader>;i", "<cmd>ShadcnInit<CR>", desc = "Init shadcn" },
      { "<leader>;m", "<cmd>ShadcnAddImportant<CR>", desc = "Add i[M]portant shadcn components" },
    },
  },
}

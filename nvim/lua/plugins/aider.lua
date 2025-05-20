return {
  {
    "timseriakov/aider.nvim",
    dependencies = {
      "akinsho/toggleterm.nvim",
      "nvim-telescope/telescope.nvim",
      "sindrets/diffview.nvim",
      "folke/snacks.nvim",
      "willothy/flatten.nvim",
    },
    lazy = false,
    opts = {

      spawn_args = {
        "--model",
        "openai/gpt-4.1",
        "--editor-model",
        "gpt-4.1-nano",
        "--weak-model",
        "gpt-4.1-nano",
      },
      -- Автозапуск Aider при добавлении комментариев вида `ai`, `ai?`, `ai!`
      spawn_on_comment = true,

      -- Автопоказ окна Aider в разных ситуациях
      auto_show = {
        on_ask = true, -- при запросе `ai?` сразу показать окно
        on_change_req = false, -- при `ai!` не открывать автоматически
        on_file_add = false, -- при добавлении файла — показывать окно
      },
      -- Фильтры для отображения моделей в Telescope
      model_picker_search = { "^openrouter/", "^openai/", "^gemini/", "^deepseek/" },

      -- Следить за файлами и автоматически запускаться при валидном `ai`-комментарии
      watch_files = true,

      -- Настройка отображения прогресса через snacks.nvim
      progress_notifier = { style = "minimal" }, -- fansy, compact

      -- Лог Aider через fidget.nvim (если установлен)
      log_notifier = false,

      -- Цветовая тема для markdown-блоков кода в тёмной теме
      code_theme_dark = "nord",
      -- Цветовая тема для markdown-блоков кода в светлой теме
      code_theme_light = "default",

      -- Команда для запуска вложенного редактора через `/editor` (работает с flatten.nvim)
      editor_command = "nvim --cmd 'let g:flatten_wait=1' --cmd 'cnoremap wq write<bar>bdelete<bar>startinsert'",

      -- При открытии терминала сразу переходить в insert mode
      auto_insert = true,

      -- Аргументы CLI для Aider — задаём модели по умолчанию
      aider_args = {
        "--no-auto-commits",
        "--model",
        "openai/gpt-4.1", -- основная модель
        "--editor-model",
        "gpt-4.1-nano", -- модель для редактора
        "--weak-model",
        "gpt-4.1-nano", -- модель для незначительных правок
      },

      -- Автоматически запускать Aider при старте Neovim (нет, спасибо)
      spawn_on_startup = false,

      -- Перезапускать Aider при смене директории (не требуется, тк сессии изолированы)
      restart_on_chdir = false,

      -- Хук, вызываемый при открытии терминала (если хочешь настраивать keymaps в терминале)
      on_term_open = function(term_bufnr)
        -- Ставим autocmd, который сработает только при первом входе в буфер
        vim.api.nvim_create_autocmd("BufWinEnter", {
          buffer = term_bufnr,
          once = true,
          callback = function()
            local win = vim.api.nvim_get_current_win()

            -- Применяем highlight от Normal вручную к окну
            local ns = vim.api.nvim_create_namespace("aider-term-fix")
            vim.api.nvim_win_set_hl_ns(win, ns)

            -- Ставим фон как у Normal
            local normal = vim.api.nvim_get_hl(0, { name = "Normal", link = false })
            vim.api.nvim_set_hl(ns, "Normal", { fg = normal.fg, bg = normal.bg })
            vim.api.nvim_set_hl(ns, "NormalNC", { fg = normal.fg, bg = normal.bg })
            vim.api.nvim_set_hl(ns, "EndOfBuffer", { fg = normal.bg, bg = normal.bg })
            vim.api.nvim_set_hl(ns, "StatusLine", { fg = normal.fg, bg = normal.bg })

            vim.cmd("startinsert")
          end,
        })

        vim.api.nvim_create_autocmd("BufEnter", {
          callback = function(event)
            local bufnr = event.buf

            -- если уже в insert или терминал — не лезем
            if vim.fn.mode() == "i" or vim.fn.mode() == "t" then
              return
            end

            -- проверим, что это именно терминальный буфер
            if vim.api.nvim_buf_get_option(bufnr, "buftype") == "terminal" then
              vim.defer_fn(function()
                vim.cmd("startinsert")
              end, 30)
            end
          end,
        })
      end,

      -- Определяет, включена ли тёмная тема — влияет на подсветку markdown в ответах
      dark_mode = function()
        return vim.o.background == "dark"
      end,

      -- Автоскролл терминала Aider при новых сообщениях
      auto_scroll = true,

      -- Настройка внешнего вида окна Aider
      win = {
        direction = "horizontal", -- может быть 'float', 'vertical', 'horizontal', 'tab'

        -- Размер окна (для вертикального/горизонтального режимов)
        size = function(term)
          if term.direction == "horizontal" then
            return math.floor(vim.api.nvim_win_get_height(0) * 0.4)
          elseif term.direction == "vertical" then
            return math.floor(vim.api.nvim_win_get_width(0) * 0.5)
          end
        end,

        -- Настройка размеров плавающего окна
        float_opts = {
          border = "single", -- стиль рамки
          width = function()
            return math.floor(vim.api.nvim_win_get_width(0) * 0.95)
          end,
          height = function()
            return math.floor(vim.api.nvim_win_get_height(0) * 0.95)
          end,
        },
      },

      -- Клавиши для действий в Telescope (поддержка multi-select)
      telescope = {
        add = "<C-l>", -- добавить выбранные файлы в Aider
        read_only = "<C-r>", -- добавить как только для чтения
        drop = "<C-z>", -- убрать из списка Aider
      },

      -- Указываем pager для git diff, по умолчанию `cat`, чтобы не блокировать after_update_hook
      git_pager = "cat",

      -- Использовать ли tmux-интеграцию (экспериментально)
      use_tmux = false,
      -- after_update_hook = function()
      --   require("diffview").open({ "HEAD^" })
      -- end,

      -- Using telescope to show the diffs:
      -- after_update_hook = function()
      --   vim.cmd("Telescope git_status")
      -- end,

      after_update_hook = function()
        vim.cmd("DiffviewOpen")
      end,
    },
    keys = {
      -- Открытие/скрытие Aider
      { "<leader>a/", "<cmd>AiderToggle<cr>", desc = "Aider: Toggle" },
      { "<leader>as", "<cmd>AiderAsk<cr>", desc = "Aider: Ask", mode = { "n", "v" } },
      -- Добавить активный файл
      {
        "<leader>a+",
        function()
          local path = vim.api.nvim_buf_get_name(0)
          if path == "" then
            vim.notify("Нет активного файла для добавления", vim.log.levels.WARN)
            return
          end
          vim.cmd("AiderSend /add " .. vim.fn.fnameescape(path))
        end,
        desc = "Aider: Add Current File",
      },

      -- Удалить активный файл из Aider
      {
        "<leader>a-",
        function()
          local path = vim.api.nvim_buf_get_name(0)
          if path == "" then
            vim.notify("Нет активного файла для удаления", vim.log.levels.WARN)
            return
          end
          vim.cmd("AiderSend /drop " .. vim.fn.fnameescape(path))
        end,
        desc = "Aider: Drop Current File",
      },

      -- Добавить файл только для чтения
      {
        "<leader>ar",
        function()
          local path = vim.api.nvim_buf_get_name(0)
          if path == "" then
            vim.notify("Нет активного файла для read-only", vim.log.levels.WARN)
            return
          end
          vim.cmd("AiderSend /read-only " .. vim.fn.fnameescape(path))
        end,
        desc = "Aider: Add File as Read-Only",
      },
      {

        "<leader>auf",
        "<cmd>AiderToggle float<CR>",
        desc = "Aider: Toggle Float",
      },
      {
        "<leader>auv",
        "<cmd>AiderToggle vertical<CR>",
        desc = "Aider: Toggle Vertical",
      },
      {
        "<leader>auh",
        "<cmd>AiderToggle horizontal<CR>",
        desc = "Aider: Toggle Horizontal",
      },
      -- Поддержка выбора модели
      {
        "<leader>am",
        name = "+model",
      },

      { "<leader>amm", "<cmd>Telescope model_picker<CR>", desc = "Model Picker" },

      -- Основные пресеты
      {
        "<leader>amo",
        function()
          vim.cmd("AiderSend /model openai/gpt-4.1")
          vim.defer_fn(function()
            vim.cmd("AiderSend /editor-model gpt-4.1-nano")
          end, 100)
          vim.defer_fn(function()
            vim.cmd("AiderSend /weak-model gpt-4.1-nano")
          end, 200)
        end,
        desc = "OpenAI GPT-4.1 + nano for editor/weak",
      },

      {
        "<leader>amh",
        function()
          vim.cmd("AiderSend /model openrouter/anthropic/claude-3.5-sonnet")
          vim.defer_fn(function()
            vim.cmd("AiderSend /editor-model openrouter/anthropic/claude-3-haiku")
          end, 100)
          vim.defer_fn(function()
            vim.cmd("AiderSend /weak-model openrouter/anthropic/claude-3-haiku")
          end, 200)
        end,
        desc = "Claude 3.5 Sonnet + Haiku for editor/weak",
      },

      {
        "<leader>amg",
        function()
          vim.cmd("AiderSend /model openrouter/google/gemini-2.5-pro-exp-03-25:free")
          vim.defer_fn(function()
            vim.cmd("AiderSend /editor-model openrouter/google/gemini-pro:free")
          end, 100)
          vim.defer_fn(function()
            vim.cmd("AiderSend /weak-model openrouter/google/gemini-pro:free")
          end, 200)
        end,
        desc = "Gemini 2.5 (free)",
      },

      -- Быстрый доступ к диффам
      { "<leader>ad", "<cmd>DiffviewOpen HEAD^<CR>", desc = "Aider: View Last Diff" },
      { "<leader>aD", "<cmd>DiffviewOpen<CR>", desc = "Aider: View All Diffs" },
      { "<leader>aC", "<cmd>DiffviewClose!<CR>", desc = "Aider: Close Diffview" },

      -- Быстрый доступ через Ctrl+x в любом режиме
      { "<C-x>", "<cmd>AiderToggle<CR>", desc = "Toggle Aider", mode = { "n", "i", "t" } },
    },
  },
}

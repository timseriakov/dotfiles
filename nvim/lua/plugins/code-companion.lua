return {
  "olimorris/codecompanion.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-telescope/telescope.nvim",
    "ravitemer/mcphub.nvim",
    { "MeanderingProgrammer/render-markdown.nvim", ft = { "markdown", "codecompanion" } },
    { "ravitemer/codecompanion-history.nvim" },
  },
  build = {
    ["ravitemer/mcphub.nvim"] = "npm install -g mcp-hub@latest",
  },
  event = "VeryLazy",
  config = function()
    local extend = require("codecompanion.adapters").extend

    local function safe_getenv(key)
      local val = os.getenv(key)
      if not val or val == "" then
        error("❌ Missing env var: " .. key)
      end
      return val
    end

    local openrouter_models = {
      "mistralai/mistral-7b-instruct:free",
      "openai/gpt-3.5-turbo",
      "openai/gpt-4o",
      "anthropic/claude-3.5-sonnet",
      "google/gemini-1.5-flash",
    }

    local current_openrouter_model = openrouter_models[1]

    local function select_openrouter_model()
      vim.ui.select(openrouter_models, { prompt = "Select OpenRouter Model:" }, function(choice)
        if choice then
          current_openrouter_model = choice
          vim.notify("  OpenRouter model set to: " .. choice, vim.log.levels.INFO)
        end
      end)
    end

    local adapters = {
      openai = function()
        return extend("openai", {
          env = { api_key = safe_getenv("OPENAI_API_KEY") },
          schema = { model = { default = "gpt-4o" } },
        })
      end,
      mistral = function()
        return require("codecompanion.adapters").extend("mistral", {
          env = {
            url = "https://api.mistral.ai",
            api_key = "MISTRAL_API_KEY",
          },
          schema = {
            model = {
              default = "codestral-latest",
            },
          },
        })
      end,
      codestral = function()
        return extend("openai_compatible", {
          env = {
            url = "https://api.mistral.ai/v1",
            api_key = safe_getenv("CODESTRAL_API_KEY"),
          },
          schema = { model = { default = "codestral-latest" } },
        })
      end,
      openrouter = function()
        return require("codecompanion.adapters").extend("openai_compatible", {
          env = {
            url = "https://openrouter.ai/api",
            api_key = "OPENROUTER_API_KEY",
            chat_url = "/v1/chat/completions",
          },
          schema = {
            model = {
              default = current_openrouter_model,
            },
          },
        })
      end,
      gemini = function()
        return extend("gemini", {
          schema = {
            model = {
              default = "models/gemini-2.5-pro",
              choices = {
                "models/gemini-1.5-flash",
                "models/gemini-1.5-pro",
                "models/gemini-2.5-pro",
              },
            },
          },
        })
      end,
    }

    local spinner = require("plugins.code-companion.spinner")
    spinner:init()

    require("mcphub").setup({
      config = vim.fn.expand("~/.config/mcphub/servers.json"),
    })

    require("codecompanion").setup({
      log_level = "ERROR",
      adapters = adapters,
      strategies = {
        chat = { adapter = "gemini" },
        inline = { adapter = "gemini" },
      },
      opts = {
        show_defaults = false,
        show_model_choices = true,
        language = "Russian",
      },
      display = {
        action_palette = {
          provider = "telescope",
          opts = { show_default_actions = true },
        },
      },
      extensions = {
        mcphub = {
          callback = "mcphub.extensions.codecompanion",
          opts = {
            language = "Russian",
            make_vars = true,
            make_slash_commands = true,
            show_result_in_chat = true,
          },
        },
        history = {
          enabled = true,
          opts = {
            language = "Russian",
            keymap = "gh",
            save_chat_keymap = "sc",
            auto_save = true,
            expiration_days = 0,
            picker = "telescope",
            picker_keymaps = {
              rename = { n = "r", i = "<M-r>" },
              delete = { n = "d", i = "<M-d>" },
              duplicate = { n = "<C-y>", i = "<C-y>" },
            },
            auto_generate_title = true,
            title_generation_opts = {
              adapter = "openai",
              model = "gpt-4.1-nano",
              refresh_every_n_prompts = 3,
              max_refreshes = 5,
              format_title = function(title)
                return title
              end,
            },
            continue_last_chat = false,
            delete_on_clearing_chat = false,
            dir_to_save = vim.fn.stdpath("data") .. "/codecompanion-history",
            enable_logging = false,
            summary = {
              create_summary_keymap = "gcs",
              browse_summaries_keymap = "gbs",
              generation_opts = {
                adapter = "openai",
                model = "gpt-4o",
                context_size = 32000,
                include_references = true,
                include_tool_outputs = true,
                system_prompt = nil,
                format_summary = nil,
              },
            },
            memory = {
              auto_create_memories_on_summary_generation = true,
              vectorcode_exe = "vectorcode",
              tool_opts = { default_num = 10 },
              notify = true,
              index_on_startup = false,
            },
          },
        },
      },
      send = {
        callback = function(chat)
          vim.cmd("stopinsert")
          chat:submit()
          chat:add_buf_message({ role = "llm", content = "" })
        end,
        index = 1,
        description = "Send",
      },
    })

    local map = vim.keymap.set
    local opts = { noremap = true, silent = true }

    map("n", "<leader>aa", "<cmd>CodeCompanionChat<CR>", vim.tbl_extend("force", opts, { desc = "Chat UI" }))
    map("v", "<leader>ai", "<cmd>CodeCompanion<CR>", vim.tbl_extend("force", opts, { desc = "Inline Chat" }))
    map("n", "<leader>ad", "<cmd>CodeCompanionActions<CR>", vim.tbl_extend("force", opts, { desc = "Actions" }))

    map("n", "<leader>ah", function()
      require("codecompanion").extensions.history.browse_chats()
    end, vim.tbl_extend("force", opts, { desc = "History (gh)" }))

    map("n", "<leader>as", function()
      require("codecompanion").extensions.history.browse_summaries()
    end, vim.tbl_extend("force", opts, { desc = "Summaries (gbs)" }))

    map("n", "<leader>ac", function()
      require("codecompanion").extensions.history.save_chat()
    end, vim.tbl_extend("force", opts, { desc = "Save Chat (sc)" }))

    map("n", "<leader>am", function()
      require("codecompanion").extensions.history.generate_summary()
    end, vim.tbl_extend("force", opts, { desc = "Summarize Chat (gcs)" }))

    map("n", "<leader>ao", select_openrouter_model, vim.tbl_extend("force", opts, { desc = "Select OpenRouter Model" }))
  end,
}

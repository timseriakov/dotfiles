return {
  "olimorris/codecompanion.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-telescope/telescope.nvim",
    "ravitemer/mcphub.nvim",
  },
  build = {
    ["ravitemer/mcphub.nvim"] = "npm install -g mcp-hub@latest",
  },
  event = "VeryLazy",
  config = function()
    local extend = require("codecompanion.adapters").extend

    local adapters = {
      openai = function()
        return extend("openai", {
          env = { api_key = os.getenv("OPENAI_API_KEY") },
          schema = { model = { default = "gpt-4o" } },
        })
      end,

      openrouter = function()
        return extend("openai_compatible", {
          env = {
            url = "https://openrouter.ai/api/v1",
            api_key = os.getenv("OPENROUTER_API_KEY"),
            chat_url = "/chat/completions",
          },
          schema = {
            model = { default = "mistralai/mistral-7b-instruct:free" },
          },
        })
      end,

      codestral = function()
        return extend("openai_compatible", {
          env = {
            url = "https://api.mistral.ai/v1",
            api_key = os.getenv("CODESTRAL_API_KEY"),
          },
          schema = {
            model = { default = "codestral-latest" },
          },
        })
      end,
    }

    local default_adapter = vim.g.codecompanion_active_adapter or "openai"

    require("codecompanion").setup({
      adapters = vim.tbl_extend("force", adapters, {
        opts = {
          show_defaults = false,
          show_model_choices = false,
        },
      }),
      strategies = {
        chat = {
          adapter = default_adapter,
        },
        inline = {
          adapter = default_adapter,
        },
      },
      display = {
        action_palette = {
          provider = "telescope",
          opts = {
            show_default_actions = true,
            show_default_prompt_library = true,
          },
        },
      },
      extensions = {
        mcphub = {
          callback = "mcphub.extensions.codecompanion",
        },
      },
    })

    require("mcphub").setup({
      config = vim.fn.expand("~/.config/mcphub/servers.json"),
    })

    local function pick_adapter()
      local pickers = require("telescope.pickers")
      local finders = require("telescope.finders")
      local conf = require("telescope.config").values
      local actions = require("telescope.actions")
      local action_state = require("telescope.actions.state")

      local keys = vim.tbl_keys(adapters)

      pickers
        .new({}, {
          prompt_title = "Switch CodeCompanion Adapter",
          finder = finders.new_table({ results = keys }),
          sorter = conf.generic_sorter({}),
          attach_mappings = function(bufnr)
            actions.select_default:replace(function()
              local selection = action_state.get_selected_entry()
              actions.close(bufnr)
              vim.g.codecompanion_active_adapter = selection[1]
              vim.notify("  Adapter switched to: " .. selection[1])
              vim.cmd("e") -- reload buffer
            end)
            return true
          end,
        })
        :find()
    end

    local map = vim.keymap.set
    local opts = { noremap = true, silent = true }

    map("n", "<leader>aa", "<cmd>CodeCompanionChat<CR>", { desc = "Chat", unpack(opts) })
    map("v", "<leader>ai", "<cmd>CodeCompanion<CR>", { desc = "Inline Assistant", unpack(opts) })
    map("n", "<leader>ad", "<cmd>CodeCompanionActions<CR>", { desc = "Actions Palette", unpack(opts) })
    map("n", "<leader>am", pick_adapter, { desc = "Switch Adapter", unpack(opts) })
  end,
}

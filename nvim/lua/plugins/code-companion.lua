return {
  {
    "olimorris/codecompanion.nvim",
    dependencies = {
      "nvim-lua/plenary.nvim",
    },
    lazy = false,
    config = function()
      require("codecompanion").setup({
        adapter = "openai",
        opts = {
          log_level = "WARN", -- DEBUG / TRACE для отладки
        },
        extensions = {
          mcphub = {
            callback = "mcphub.extensions.codecompanion",
            opts = {
              show_result_in_chat = true,
              make_vars = true,
              make_slash_commands = true,
            },
          },
        },
      })
    end,
    keys = {
      { "<leader>ac", "<cmd>CodeCompanionChat<CR>", desc = "CodeCompanion Chat" },
      { "<leader>ai", "<cmd>CodeCompanionInline<CR>", desc = "Inline Assistant" },
      { "<leader>aa", "<cmd>CodeCompanionAction<CR>", desc = "Action Palette" },
      { "<leader>al", "<cmd>CodeCompanionClear<CR>", desc = "Clear Chat" },
      {
        "<leader>aS",
        function()
          require("telescope.pickers")
            .new({}, {
              prompt_title = "Sync to Aider",
              finder = require("telescope.finders").new_table({
                results = {
                  {
                    title = "Sync context to Aider",
                    action = function()
                      dofile(vim.fn.stdpath("config") .. "/lua/scripts/sync-to-aider.lua")
                    end,
                  },
                },
                entry_maker = function(item)
                  return {
                    value = item,
                    display = item.title,
                    ordinal = item.title,
                  }
                end,
              }),
              sorter = require("telescope.config").values.generic_sorter({}),
              attach_mappings = function(_, map)
                map("i", "<CR>", function(prompt_bufnr)
                  local entry = require("telescope.actions.state").get_selected_entry()
                  require("telescope.actions").close(prompt_bufnr)
                  entry.value.action()
                end)
                return true
              end,
            })
            :find()
        end,
        desc = "Sync to Aider",
      },
    },
  },
}

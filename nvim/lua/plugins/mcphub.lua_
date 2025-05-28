return {
  {
    "ravitemer/mcphub.nvim",
    dependencies = {
      "nvim-lua/plenary.nvim",
    },
    lazy = false,
    build = "npm install -g mcp-hub@latest",
    config = function()
      require("mcphub").setup({
        native_servers = {
          ["aider-sync"] = {
            name = "aider-sync",
            capabilities = {
              tools = {
                {
                  name = "sync_to_aider",
                  description = "Создаёт markdown и запускает Aider",
                  handler = function(_, res)
                    vim.fn.mkdir("context", "p")
                    vim.fn.writefile({
                      "# Синхронизация через MCP",
                      "- Контекст готов",
                    }, "context/from_mcp.md")

                    vim.schedule(function()
                      vim.cmd("AiderSend /add context/from_mcp.md")
                      vim.cmd("AiderToggle horizontal")
                    end)

                    res:text("Готово: открылось Aider окно с markdown-файлом"):send()
                  end,
                },
              },
            },
          },
        },
      })
    end,
  },
}

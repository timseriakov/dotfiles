return {
  "ravitemer/mcphub.nvim",
  build = "npm install -g mcp-hub@latest",
  dependencies = { "nvim-lua/plenary.nvim" },
  event = "VeryLazy",
  config = function()
    require("mcphub").setup({
      config = vim.fn.expand("~/.config/mcphub/servers.json"),
      port = 37373,
      shutdown_delay = 5 * 60 * 1000,
      use_bundled_binary = false,
      mcp_request_timeout = 60000,
      auto_approve = true,
      auto_toggle_mcp_servers = true,
      extensions = {
        avante = {
          make_slash_commands = true,
        },
      },
      workspace = {
        enabled = true,
        look_for = {
          ".mcphub/servers.json",
          ".vscode/mcp.json",
          ".cursor/mcp.json",
        },
        reload_on_dir_changed = true,
        port_range = { min = 40000, max = 41000 },
      },

      native_servers = {},

      builtin_tools = {
        edit_file = {
          parser = {
            track_issues = true,
            extract_inline_content = true,
          },
          locator = {
            fuzzy_threshold = 0.8,
            enable_fuzzy_matching = true,
          },
          ui = {
            go_to_origin_on_complete = true,
            keybindings = {
              accept = ".",
              reject = ",",
              next = "n",
              prev = "p",
              accept_all = "ga",
              reject_all = "gr",
            },
          },
        },
      },

      global_env = {},

      log = {
        level = vim.log.levels.WARN,
        to_file = false,
        file_path = nil,
        prefix = "MCPHub",
      },

      ui = {
        window = {
          width = 0.8,
          height = 0.8,
          align = "center",
          relative = "editor",
          zindex = 50,
          border = "rounded",
        },
        wo = {
          winhl = "Normal:MCPHubNormal,FloatBorder:MCPHubBorder",
        },
      },

      on_ready = function(_) end,
      on_error = function(err)
        vim.notify("MCPHub Error: " .. tostring(err), vim.log.levels.ERROR)
      end,
    })
  end,
}

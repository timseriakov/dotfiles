-- ~/.config/nvim/lua/plugins/codeium.lua
return {
  "Exafunction/codeium.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
  },
  config = function()
    -- Suppress Codeium debug notifications
    if not vim.g._codeium_notify_patched then
      local original_notify = vim.notify
      ---@diagnostic disable-next-line: duplicate-set-field
      vim.notify = function(msg, level, opts)
        if level == vim.log.levels.DEBUG and type(msg) == "string" and msg:match("Codeium") then
          return
        end
        return original_notify(msg, level, opts)
      end
      vim.g._codeium_notify_patched = true
    end

    -- Suppress Codeium stderr errors
    if not vim.g._codeium_err_patch_applied then
      local stderr = vim.api.nvim_err_write
      local stderrln = vim.api.nvim_err_writeln

      ---@diagnostic disable-next-line: duplicate-set-field
      vim.api.nvim_err_write = function(msg)
        if type(msg) == "string" and msg:match("completion request failed: .*invalid_argument") then
          return
        end
        return stderr(msg)
      end

      ---@diagnostic disable-next-line: duplicate-set-field
      vim.api.nvim_err_writeln = function(msg)
        if type(msg) == "string" and msg:match("completion request failed: .*invalid_argument") then
          return
        end
        return stderrln(msg)
      end

      vim.g._codeium_err_patch_applied = true
    end

    require("codeium").setup({
      virtual_text = {
        enabled = true,
        key_bindings = {
          accept = "<Tab>",
          next = "<M-l>",
          prev = "<M-h>",
        },
      },
    })

    require("codeium.virtual_text").set_statusbar_refresh(function()
      require("lualine").refresh()
    end)
  end,
}

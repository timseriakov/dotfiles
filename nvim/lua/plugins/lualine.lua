return {
  "nvim-lualine/lualine.nvim",
  config = function()
    local function copilot_status()
      local ok_s, suggestion = pcall(require, "copilot.suggestion")
      if not ok_s then
        return ""
      end

      -- Visible lightning when a ghost-text is shown
      if suggestion.is_visible() then
        return ""
      end

      -- Show enabled/disabled state (optional)
      local ok_c, client = pcall(require, "copilot.client")
      if ok_c and client.is_initialized() then
        return ""
      end
      return ""
    end

    require("lualine").setup({
      options = {
        globalstatus = false,
        disabled_filetypes = {
          statusline = { "dashboard" },
          winbar = { "dashboard" },
        },
      },
      sections = {
        lualine_a = { "mode" },
        lualine_b = {
          { "filetype", colored = true, icon_only = true, icon = { align = "right" } },
        },
        lualine_c = {
          {
            "filename",
            file_status = true,
            newfile_status = true,
            path = 1,
            shorting_target = 70,
            symbols = {
              modified = "[+]",
              readonly = "[-]",
              unnamed = "[No Name]",
              newfile = "[New]",
            },
          },
        },
        lualine_x = {
          copilot_status, -- Copilot indicator: "" enabled, "" visible suggestion
          "diff",
          "branch",
        },
        lualine_y = { "location" },
        lualine_z = { "progress" },
      },
    })

    -- Refresh when insert state changes to keep icon responsive
    local grp = vim.api.nvim_create_augroup("CopilotLualineRefresh", { clear = true })
    vim.api.nvim_create_autocmd({ "InsertEnter", "InsertLeave", "TextChangedI", "CursorMovedI" }, {
      group = grp,
      callback = function()
        local ok, lualine = pcall(require, "lualine")
        if ok then
          lualine.refresh()
        end
      end,
    })
  end,
}

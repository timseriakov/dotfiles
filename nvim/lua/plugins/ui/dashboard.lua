return {
  "nvimdev/dashboard-nvim",
  lazy = false,
  opts = function()
    local logo = [[






    ]]

    logo = string.rep("\n", 8) .. logo .. "\n\n"

    local opts = {
      theme = "doom",
      hide = {
        statusline = false,
      },
      config = {
        header = vim.split(logo, "\n"),
        -- stylua: ignore
        center = {
          { action = "Telescope opener",                              desc = " Open folder",     icon = " ", key = "f" },
          { action = "Telescope persisted",                           desc = " Restore Session", icon = " ", key = "r" },
          { action = 'Telescope projects',                            desc = " Projects",        icon = " ", key = "p" },
          { action = 'lua LazyVim.pick("oldfiles")()',                desc = " Recent Files",    icon = " ", key = "l" },
          { action = "qa",                                            desc = " Quit",            icon = " ", key = "q" },
        },
        footer = { "" },
      },
    }

    for _, button in ipairs(opts.config.center) do
      button.desc = button.desc .. string.rep(" ", 43 - #button.desc)
      button.key_format = "  %s"
    end

    if vim.o.filetype == "lazy" then
      vim.api.nvim_create_autocmd("WinClosed", {
        pattern = tostring(vim.api.nvim_get_current_win()),
        once = true,
        callback = function()
          vim.schedule(function()
            vim.api.nvim_exec_autocmds("UIEnter", { group = "dashboard" })
          end)
        end,
      })
    end

    return opts
  end,
}

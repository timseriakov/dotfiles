-- lua/plugins/ui/snacks.lua

return {
  "folke/snacks.nvim",
  ---@type snacks.Config
  opts = {},
  config = function(_, opts)
    require("snacks").setup(opts)

    -- Monkey-patch для подавления ошибки "Cursor position outside buffer" в модуле scope.
    -- Это происходит при попытке выделить пустую или невалидную область как текстовый объект.
    local ok, scope = pcall(require, "snacks.scope")
    if ok then
      local original_textobject = scope.textobject
      if original_textobject then
        scope.textobject = function(call_opts)
          local ok_call, err = pcall(original_textobject, call_opts)
          if not ok_call and err then
            -- Игнорируем специфическую ошибку курсора, так как это внутренний баг snacks при определенных условиях
            if not tostring(err):find("outside buffer") then
              vim.notify(tostring(err), vim.log.levels.ERROR, { title = "Snacks.scope (patched)" })
            end
          end
        end
      end

      -- Аналогичный патч для jump, так как там тоже используется nvim_win_set_cursor без проверок
      local original_jump = scope.jump
      if original_jump then
        scope.jump = function(call_opts)
          local ok_call, err = pcall(original_jump, call_opts)
          if not ok_call and err then
            if not tostring(err):find("outside buffer") then
              vim.notify(tostring(err), vim.log.levels.ERROR, { title = "Snacks.scope (patched)" })
            end
          end
        end
      end
    end
  end,
}

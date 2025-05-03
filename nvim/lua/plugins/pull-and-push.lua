local function notify_result(title, res)
  local output = vim.trim((res.stdout or "") .. "\n\n" .. (res.stderr or ""))
  local ok = res.code == 0

  if output == "" then
    output = "(no output)"
  end

  vim.notify(
    (ok and "✅ " or "❌ ") .. title .. ":\n\n" .. output,
    ok and vim.log.levels.INFO or vim.log.levels.ERROR,
    { title = title }
  )
end

return {
  {
    "tpope/vim-fugitive",
    keys = {
      {
        "<leader>gp",
        function()
          vim.system({ "git", "pull" }, { text = true }, function(res)
            notify_result("git pull", res)
          end)
        end,
        desc = "Git Pull",
      },
      {
        "<leader>gP",
        function()
          vim.system({ "git", "push" }, { text = true }, function(res)
            notify_result("git push", res)
          end)
        end,
        desc = "Git Push",
      },
    },
  },
}

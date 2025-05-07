return {
  "basola21/PDFview",
  lazy = false,
  dependencies = {
    "nvim-telescope/telescope.nvim",
  },
  config = function()
    -- Автозагрузка PDF через BufReadPost
    vim.api.nvim_create_autocmd("BufReadPost", {
      pattern = "*.pdf",
      callback = function()
        local path = vim.fn.expand("%:p")
        require("pdfview").open(path)
      end,
    })

    -- Горячие клавиши для навигации по страницам
    vim.keymap.set("n", "<leader>jj", function()
      require("pdfview.renderer").next_page()
    end, { desc = "PDFview: Next page" })

    vim.keymap.set("n", "<leader>kk", function()
      require("pdfview.renderer").previous_page()
    end, { desc = "PDFview: Previous page" })
  end,
}

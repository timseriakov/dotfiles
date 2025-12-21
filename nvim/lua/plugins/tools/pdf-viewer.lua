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

    -- 🔒 Локальные бинды только в pdfview буфере
    vim.api.nvim_create_autocmd("FileType", {
      pattern = "pdfview",
      callback = function()
        vim.keymap.set("n", "<leader>jj", function()
          require("pdfview.renderer").next_page()
        end, { desc = "PDFview: Next page", buffer = true })

        vim.keymap.set("n", "<leader>kk", function()
          require("pdfview.renderer").previous_page()
        end, { desc = "PDFview: Previous page", buffer = true })
      end,
    })
  end,
}

return {
  {
    "willthbill/opener.nvim",
    dependencies = { "nvim-telescope/telescope.nvim" },
    config = function()
      require("opener").setup({
        pre_open = function(new_dir)
          print("Opening " .. new_dir)
        end,
        post_open = function(new_dir)
          print("Opened " .. new_dir)
        end,
      })

      require("telescope").setup({
        extensions = {
          opener = {
            hidden = false,
            root_dir = "~/dev",
            respect_gitignore = true,
          },
        },
      })

      require("telescope").load_extension("opener")

      vim.api.nvim_set_keymap("n", "<leader>fo", ":Telescope opener<cr>", { noremap = true, silent = true })
    end,
  },
}

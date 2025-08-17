-- Plugin: Wansmer/treesj
-- Installed via store.nvim

return {
    "Wansmer/treesj",
    keys = {
        "<space>j",
    },
    dependencies = {
        "nvim-treesitter/nvim-treesitter"
    }, -- if you install parsers with `nvim-treesitter`
    config = function()
        require("treesj").setup(
            {}
        )
    end
}
-- Plugin: piersolenski/brewfile.nvim
-- Installed via store.nvim

return {
    "piersolenski/brewfile.nvim",
    opts = {
        -- Auto-dump Brewfile after brew commands finish
        dump_on_change = true,
        -- Show confirmation prompts for uninstall actions
        confirmation_prompt = true
    },
    keys = {
        {
            "<leader>Bi",
            function()
                require(
                    "brewfile"
                ).install()
            end,
            desc = "Brew install package",
            mode = {"n"}
        },
        {
            "<leader>Bb",
            function()
                require(
                    "brewfile"
                ).dump()
            end,
            desc = "Dump Brewfile and update the buffer",
            mode = {"n"}
        },
        {
            "<leader>Bd",
            function()
                require(
                    "brewfile"
                ).uninstall()
            end,
            desc = "Brew uninstall package",
            mode = {"n"}
        },
        {
            "<leader>BD",
            function()
                require(
                    "brewfile"
                ).force_uninstall(
                )
            end,
            desc = "Brew force uninstall package",
            mode = {"n"}
        },
        {
            "<leader>BI",
            function()
                require(
                    "brewfile"
                ).info()
            end,
            desc = "Brew info for package",
            mode = {"n"}
        }
    }
}
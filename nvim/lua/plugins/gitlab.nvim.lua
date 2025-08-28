-- Plugin: harrisoncramer/gitlab.nvim
-- Installed via store.nvim

return {
    "harrisoncramer/gitlab.nvim",
    dependencies = {
        "MunifTanjim/nui.nvim",
        "nvim-lua/plenary.nvim",
        "sindrets/diffview.nvim",
        "stevearc/dressing.nvim", -- Recommended but not required. Better UI for pickers.
        "nvim-tree/nvim-web-devicons" -- Recommended but not required. Icons in discussion tree.
    },
    build = function()
        require(
            "gitlab.server"
        ).build(true)
    end, -- Builds the Go binary
    config = function()
        require("gitlab").setup({
            -- Go server and logging
            port = nil, -- auto-pick
            log_path = vim.fn.stdpath("cache") .. "/gitlab.nvim.log",

            -- Networking
            connection_settings = {
                proxy = "",
                insecure = false,
                remote = "origin",
            },

            -- Debug toggles (turn on when troubleshooting)
            debug = {
                request = false,
                response = false,
                gitlab_request = false,
                gitlab_response = false,
            },

            -- Where attachments picker looks for files (must be absolute)
            attachment_dir = vim.fn.stdpath("data") .. "/gitlab_attachments",

            reviewer_settings = {
                jump_with_no_diagnostics = false,
                diffview = { imply_local = true },
            },

            -- Keymaps: keep defaults for local buffers; override globals below
            keymaps = {
                disable_all = false,
                help = "g?",
                global = {
                    disable_all = true, -- отключаем глобальные бинды плагина ("gl…")
                },
                popup = {
                    disable_all = false,
                    next_field = "<Tab>",
                    prev_field = "<S-Tab>",
                    perform_action = "ZZ",
                    perform_linewise_action = "ZA",
                    discard_changes = "ZQ",
                },
                reviewer = {
                    disable_all = false,
                    create_comment = "c",
                    create_suggestion = "s",
                    -- Fire immediately even if prefixed by other mappings
                    create_comment_nowait = true,
                    create_suggestion_nowait = true,
                },
            },

            -- Popups for comments, summary, pipeline, etc.
            popup = {
                width = "40%",
                height = "60%",
                position = "50%",
                border = "rounded",
                opacity = 1.0,
                create_mr = { width = "95%", height = "95%" },
                summary = { width = "95%", height = "95%" },
                temp_registers = { '"', "+", "g" },
            },

            -- Discussions sidebar/tree
            discussion_tree = {
                expanders = {
                    expanded = " ",
                    collapsed = " ",
                    indentation = "  ",
                },
                spinner_chars = { "/", "|", "\\", "-" },
                auto_open = true,
                default_view = "discussions",
                blacklist = {},
                sort_by = "latest_reply",
                keep_current_open = false,
                position = "bottom", -- alternatives: "right", "left", "top"
                size = "20%",
                relative = "editor",
                resolved = "✓",
                unresolved = "-",
                unlinked = "󰌸",
                draft = "✎",
                tree_type = "simple",
                draft_mode = false,
                relative_date = true,
                winbar = nil,
            },

            emojis = { formatter = nil },

            choose_merge_request = { open_reviewer = true },

            -- Extra metadata in the summary buffer
            info = {
                enabled = true,
                horizontal = false,
                fields = {
                    "author",
                    "created_at",
                    "updated_at",
                    "merge_status",
                    "draft",
                    "conflicts",
                    "assignees",
                    "reviewers",
                    "pipeline",
                    "branch",
                    "target_branch",
                    "delete_branch",
                    "squash",
                    "labels",
                    "web_url",
                },
            },

            -- Inline diagnostics for comments in the reviewer
            discussion_signs = {
                enabled = true,
                skip_resolved_discussion = false,
                severity = vim.diagnostic.severity.INFO,
                virtual_text = false,
                use_diagnostic_signs = true,
                priority = 100,
                icons = { comment = "→|", range = " |" },
                -- Hide diagnostics created for older MR revisions
                skip_old_revision_discussion = true,
            },

            pipeline = {
                created = "",
                pending = "",
                preparing = "",
                scheduled = "",
                running = "",
                canceled = "↪",
                skipped = "↪",
                success = "✓",
                failed = "",
            },

            -- Opinionated defaults for MR creation (adjust as needed)
            create_mr = {
                target = "master",
                template_file = nil,
                delete_branch = false,
                squash = false,
                fork = { enabled = false, forked_project_id = nil },
                title_input = { width = 40, border = "rounded" },
            },
        })

        -- Кастомные глобальные шорткаты под <leader>m (Merge Requests)
        local gitlab = require("gitlab")
        local map = vim.keymap.set
        local opts = { noremap = true, silent = true }

        map("n", "<leader>mr", gitlab.choose_merge_request, vim.tbl_extend("force", opts, { desc = "GitLab: Choose MR" }))
        map("n", "<leader>mv", gitlab.review,               vim.tbl_extend("force", opts, { desc = "GitLab: Review (Diffview)" }))
        map("n", "<leader>ms", gitlab.summary,              vim.tbl_extend("force", opts, { desc = "GitLab: Summary" }))
        map("n", "<leader>mp", gitlab.pipeline,             vim.tbl_extend("force", opts, { desc = "GitLab: Pipeline" }))
        map("n", "<leader>mo", gitlab.open_in_browser,      vim.tbl_extend("force", opts, { desc = "GitLab: Open in browser" }))
        map("n", "<leader>mu", gitlab.copy_mr_url,          vim.tbl_extend("force", opts, { desc = "GitLab: Copy MR URL" }))
        map("n", "<leader>ma", gitlab.approve,              vim.tbl_extend("force", opts, { desc = "GitLab: Approve MR" }))
        map("n", "<leader>mA", gitlab.revoke,               vim.tbl_extend("force", opts, { desc = "GitLab: Revoke approval" }))
        map("n", "<leader>mm", gitlab.merge,                vim.tbl_extend("force", opts, { desc = "GitLab: Merge MR" }))
        map("n", "<leader>mC", gitlab.create_mr,            vim.tbl_extend("force", opts, { desc = "GitLab: Create MR" }))
        map("n", "<leader>md", gitlab.toggle_discussions,   vim.tbl_extend("force", opts, { desc = "GitLab: Toggle discussions" }))
        map("n", "<leader>mD", gitlab.toggle_draft_mode,    vim.tbl_extend("force", opts, { desc = "GitLab: Toggle draft mode" }))
        map("n", "<leader>mP", gitlab.publish_all_drafts,   vim.tbl_extend("force", opts, { desc = "GitLab: Publish all drafts" }))
        map("n", "<leader>mn", gitlab.create_note,          vim.tbl_extend("force", opts, { desc = "GitLab: New note" }))
        map("n", "<leader>ml", gitlab.add_label,            vim.tbl_extend("force", opts, { desc = "GitLab: Add label" }))
        map("n", "<leader>mL", gitlab.delete_label,         vim.tbl_extend("force", opts, { desc = "GitLab: Delete label" }))
        map("n", "<leader>mra", gitlab.add_reviewer,        vim.tbl_extend("force", opts, { desc = "GitLab: Add reviewer" }))
        map("n", "<leader>mrd", gitlab.delete_reviewer,     vim.tbl_extend("force", opts, { desc = "GitLab: Delete reviewer" }))
        map("n", "<leader>maa", gitlab.add_assignee,        vim.tbl_extend("force", opts, { desc = "GitLab: Add assignee" }))
        map("n", "<leader>mad", gitlab.delete_assignee,     vim.tbl_extend("force", opts, { desc = "GitLab: Delete assignee" }))

        -- MR lists (no auto-open reviewer)
        map(
            "n",
            "<leader>mR",
            function() gitlab.choose_merge_request({ state = "all", open_reviewer = false }) end,
            vim.tbl_extend("force", opts, { desc = "GitLab: List all MRs" })
        )
        map(
            "n",
            "<leader>mO",
            function() gitlab.choose_merge_request({ state = "opened", open_reviewer = false }) end,
            vim.tbl_extend("force", opts, { desc = "GitLab: List opened MRs" })
        )
        map(
            "n",
            "<leader>mM",
            function() gitlab.choose_merge_request({ state = "merged", open_reviewer = false }) end,
            vim.tbl_extend("force", opts, { desc = "GitLab: List merged MRs" })
        )
        map(
            "n",
            "<leader>mX",
            function() gitlab.choose_merge_request({ state = "closed", open_reviewer = false }) end,
            vim.tbl_extend("force", opts, { desc = "GitLab: List closed MRs" })
        )

        -- Filtered lists via prompts
        map(
            "n",
            "<leader>mU",
            function()
                vim.ui.input({ prompt = "GitLab username: " }, function(user)
                    if not user or user == "" then return end
                    gitlab.choose_merge_request_by_username({ username = user, state = "all" })
                end)
            end,
            vim.tbl_extend("force", opts, { desc = "GitLab: List MRs by user" })
        )
        map(
            "n",
            "<leader>mF",
            function()
                vim.ui.input({ prompt = "GitLab label: " }, function(label)
                    if not label or label == "" then return end
                    gitlab.choose_merge_request({ labels = { label }, state = "all", open_reviewer = false })
                end)
            end,
            vim.tbl_extend("force", opts, { desc = "GitLab: List MRs by label" })
        )
        map(
            "n",
            "<leader>mS",
            function()
                vim.ui.input({ prompt = "Search MRs: " }, function(q)
                    if not q or q == "" then return end
                    gitlab.choose_merge_request({ search = q, state = "all", open_reviewer = false })
                end)
            end,
            vim.tbl_extend("force", opts, { desc = "GitLab: Search MRs" })
        )
    end
}

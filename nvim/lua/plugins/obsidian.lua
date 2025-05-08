return {
  "obsidian-nvim/obsidian.nvim",
  version = "*",
  event = {
    "BufReadPre */vaults/default-vault/**/*.md",
    "BufNewFile */vaults/default-vault/**/*.md",
  },
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-telescope/telescope.nvim",
    "hrsh7th/nvim-cmp",
  },
  opts = {
    workspaces = {
      {
        name = "personal",
        path = "/Users/tim/vaults/default-vault",
      },
    },

    notes_subdir = "",
    new_notes_location = "current_dir",
    preferred_link_style = "wiki",

    completion = {
      nvim_cmp = true,
      blink = false,
      min_chars = 2,
    },

    attachments = {
      img_folder = "-attachments-",
      img_name_func = function()
        return string.format("img_%s", os.date("%Y%m%d%H%M%S"))
      end,
      img_text_func = function(_, path)
        local note_dir = vim.fn.expand("%:p:h")
        local relative_path = path:make_relative(note_dir)
        return string.format("![%s](%s)", path.name, relative_path)
      end,
    },

    templates = {
      folder = "/Users/tim/vaults/default-vault/03 Resources/templates",
      date_format = "%Y-%m-%d",
      time_format = "%H:%M",
    },

    ui = {
      enable = true,
      update_debounce = 200,
    },

    picker = {
      name = "telescope.nvim",
    },

    open_notes_in = "current",
    log_level = vim.log.levels.INFO,

    mappings = {
      ["gf"] = {
        action = function()
          return require("obsidian").util.gf_passthrough()
        end,
        opts = { noremap = false, expr = true, buffer = true, desc = "Follow Obsidian link (gf)" },
      },
      ["<leader>oc"] = {
        action = function()
          return require("obsidian").util.toggle_checkbox()
        end,
        opts = { buffer = true, desc = "Toggle checkbox" },
      },
      ["<leader>oo"] = {
        action = function()
          return require("obsidian").util.smart_action()
        end,
        opts = { buffer = true, expr = true, desc = "Smart action (follow or toggle)" },
      },
      ["<leader>oO"] = {
        action = function()
          vim.cmd("ObsidianOpen")
        end,
        opts = { buffer = true, desc = "Open in Obsidian app" },
      },
      ["<leader>on"] = {
        action = function()
          vim.cmd("ObsidianNew")
        end,
        opts = { buffer = true, desc = "Create new note" },
      },
      ["<leader>oq"] = {
        action = function()
          vim.cmd("ObsidianQuickSwitch")
        end,
        opts = { buffer = true, desc = "Quick switch note" },
      },
      ["<leader>of"] = {
        action = function()
          vim.cmd("ObsidianFollowLink")
        end,
        opts = { buffer = true, desc = "Follow link under cursor" },
      },
      ["<leader>ob"] = {
        action = function()
          vim.cmd("ObsidianBacklinks")
        end,
        opts = { buffer = true, desc = "Show backlinks" },
      },
      ["<leader>ot"] = {
        action = function()
          vim.cmd("ObsidianToday")
        end,
        opts = { buffer = true, desc = "Open today's daily note" },
      },
      ["<leader>oy"] = {
        action = function()
          vim.cmd("ObsidianYesterday")
        end,
        opts = { buffer = true, desc = "Open yesterday's daily note" },
      },
      ["<leader>oT"] = {
        action = function()
          vim.cmd("ObsidianTemplate")
        end,
        opts = { buffer = true, desc = "Insert template into current note" },
      },
      ["<leader>oN"] = {
        action = function()
          vim.cmd("ObsidianNewFromTemplate")
        end,
        opts = { buffer = true, desc = "Create note from template" },
      },
      ["<leader>oi"] = {
        action = function()
          vim.cmd("ObsidianPasteImg")
        end,
        opts = { buffer = true, desc = "Paste image from clipboard" },
      },
      ["<leader>or"] = {
        action = function()
          vim.cmd("ObsidianRename")
        end,
        opts = { buffer = true, desc = "Rename current note and update links" },
      },
      ["<leader>oz"] = {
        action = function()
          local obsidian = require("obsidian")
          local Path = require("obsidian.path")
          local client = obsidian.get_client()
          local workspace = client.current_workspace

          local base_path = Path.new(workspace.path)
          local notes_dir = base_path -- весь vault, а не notes_subdir

          local glob_path = tostring(notes_dir) .. "/**/*.md"
          local files = vim.fn.glob(glob_path, true, true)

          if #files == 0 then
            vim.notify("No notes found.", vim.log.levels.WARN)
            return
          end

          local random_file = files[math.random(#files)]
          vim.cmd("edit " .. vim.fn.fnameescape(random_file))
        end,
        opts = { desc = "Random note", buffer = true },
      },
      ["<leader>oZ"] = {
        action = function()
          local Path = require("obsidian.path")
          local pickers = require("telescope.pickers")
          local finders = require("telescope.finders")
          local conf = require("telescope.config").values
          local actions = require("telescope.actions")
          local action_state = require("telescope.actions.state")

          local vault_path = "/Users/tim/vaults/default-vault"
          local dirs = vim.fn.readdir(vault_path)
          local candidates = vim.tbl_filter(function(name)
            return vim.fn.isdirectory(vault_path .. "/" .. name) == 1 and not name:match("^%.")
          end, dirs)

          local previous = vim.g.obsidian_random_dir or nil

          local function open_random_note(dir)
            local glob_path = vault_path .. "/" .. dir .. "/**/*.md"
            local files = vim.fn.glob(glob_path, true, true)

            if #files == 0 then
              vim.notify("No markdown files in selected directory.", vim.log.levels.WARN)
              return
            end

            vim.g.obsidian_random_dir = dir
            local random_file = files[math.random(#files)]
            vim.cmd("edit " .. vim.fn.fnameescape(random_file))
          end

          pickers
            .new({}, {
              prompt_title = "Pick a directory",
              finder = finders.new_table({ results = candidates }),
              sorter = conf.generic_sorter({}),
              default_text = previous or nil,
              attach_mappings = function(prompt_bufnr, map)
                actions.select_default:replace(function()
                  actions.close(prompt_bufnr)
                  local selection = action_state.get_selected_entry()
                  if selection then
                    open_random_note(selection.value)
                  end
                end)
                return true
              end,
            })
            :find()
        end,
        opts = { desc = "Random note from directory", buffer = true },
      },
    },

    callbacks = {
      enter_note = function()
        vim.schedule(function()
          local bufnr = vim.api.nvim_get_current_buf()
          local filename = vim.api.nvim_buf_get_name(bufnr)
          local title = vim.fn.fnamemodify(filename, ":t:r")
          local full_text = "# " .. title .. "  " -- добавляем 2 пробела

          if vim.b.obsidian_virtual_h1 and vim.b.obsidian_ns then
            pcall(vim.api.nvim_buf_del_extmark, bufnr, vim.b.obsidian_ns, vim.b.obsidian_virtual_h1)
          end

          vim.b.obsidian_ns = vim.api.nvim_create_namespace("obsidian_virtual_h1")
          vim.b.obsidian_virtual_h1 = vim.api.nvim_buf_set_extmark(bufnr, vim.b.obsidian_ns, 0, 0, {
            virt_lines = { { { full_text, "ObsidianVirtualH1" } } },
            virt_lines_above = true,
            priority = 100,
          })

          vim.cmd("normal! zt")
        end)
      end,
    },
  },
}

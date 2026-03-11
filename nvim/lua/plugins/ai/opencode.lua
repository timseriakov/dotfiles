return {
  {
    "NickvanDyke/opencode.nvim",
    dependencies = {
      -- Recommended for `ask()` and `select()`.
      -- Required for `snacks` provider.
      ---@module 'snacks' <- Loads `snacks.nvim` types for configuration intellisense.
      { "folke/snacks.nvim", opts = { input = {}, picker = {}, terminal = {} } },
    },
    config = function()
      ---@type opencode.Opts
      vim.g.opencode_opts = {
        server = {
          port = 4096,
          start = function()
            require("opencode.terminal").start("opencode serve --hostname 127.0.0.1 --port 4096", {
              width = math.floor(vim.o.columns * 0.45),
            })
          end,
          toggle = function()
            require("opencode.terminal").toggle("opencode attach http://127.0.0.1:4096", {
              width = math.floor(vim.o.columns * 0.45),
            })
          end,
        },
      }

      -- Required for `opts.events.reload`.
      vim.o.autoread = true

      -- Keymaps: Space A and then letter
      -- Ask
      vim.keymap.set({ "n", "x" }, "<leader>aa", function()
        require("opencode").ask("@this: ", { submit = true })
      end, { desc = "Opencode: Ask" })
      -- Select (Actions)
      vim.keymap.set({ "n", "x" }, "<leader>as", function()
        require("opencode").select()
      end, { desc = "Opencode: Select/Actions" })
      -- Toggle
      vim.keymap.set({ "n", "t" }, "<leader>at", function()
        require("opencode").toggle()
      end, { desc = "Opencode: Toggle" })
      -- Operator (Range)
      vim.keymap.set({ "n", "x" }, "<leader>ao", function()
        return require("opencode").operator("@this ")
      end, { expr = true, desc = "Opencode: Operator (Range)" })
      -- Operator (Line)
      vim.keymap.set("n", "<leader>al", function()
        return require("opencode").operator("@this ") .. "_"
      end, { expr = true, desc = "Opencode: Operator (Line)" })

      -- Scrolling in session
      vim.keymap.set("n", "<S-C-u>", function()
        require("opencode").command("session.half.page.up")
      end, { desc = "Opencode: Half page up" })
      vim.keymap.set("n", "<S-C-d>", function()
        require("opencode").command("session.half.page.down")
      end, { desc = "Opencode: Half page down" })

      vim.api.nvim_create_autocmd("TermOpen", {
        desc = "Opencode: double <Esc> exits terminal insert",
        callback = function(event)
          local name = vim.api.nvim_buf_get_name(event.buf)
          if not (name:match("^term://") and name:find("opencode", 1, true)) then
            return
          end

          if vim.b[event.buf].opencode_esc_handler_mapped then
            return
          end
          vim.b[event.buf].opencode_esc_handler_mapped = true

          vim.keymap.set("t", "<Esc>", function()
            local wait_ms = 180
            local step_ms = 10
            local waited = 0

            while waited < wait_ms do
              local c = vim.fn.getchar(1)
              if c ~= 0 then
                if c == 27 then
                  return "<C-\\><C-n>"
                end

                local s = (type(c) == "number") and vim.fn.nr2char(c) or c
                return "<Esc>" .. s
              end

              vim.wait(step_ms)
              waited = waited + step_ms
            end

            return "<Esc>"
          end, {
            buffer = event.buf,
            expr = true,
            noremap = true,
            silent = true,
            desc = "Opencode: handle double <Esc>",
          })
        end,
      })
    end,
  },
}

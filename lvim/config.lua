-- -- vim options
vim.opt.shiftwidth = 2
vim.opt.tabstop = 2
vim.opt.relativenumber = false
vim.opt.foldmethod = "expr"
vim.opt.foldexpr = "nvim_treesitter#foldexpr()"
vim.opt.foldlevel = 99
lvim.builtin.treesitter.rainbow.enable = true
lvim.transparent_window = true

-- -- general
lvim.log.level = "info"
-- vim.opt.wrap = true
lvim.format_on_save = {
  enabled = true,
  pattern = "*.lua",
  timeout = 1000,
}

-- -- for neovide
vim.opt.guifont = "Share Tech Mono:h20"
local g = vim.g
-- g.neovide_fullscreen = true
g.neovide_transparency = 0.95
g.neovide_cursor_vfx_mode = "railgun"
g.neovide_cursor_vfx_particle_density = 10.0 -- плотность частиц
-- g.neovide_cursor_vfx_particle_curl = 0.1
-- g.neovide_cursor_vfx_particle_lifetime = 3.2
-- g.neovide_cursor_vfx_particle_speed = 20.0

-- -- keymappings <https://www.lunarvim.org/docs/configuration/keybindings>
lvim.leader = "space"

-- -- save file
lvim.keys.normal_mode["<C-s>"] = ":w<cr>"

-- -- next/prev tab buffer
lvim.keys.normal_mode["<S-l>"] = ":BufferLineCycleNext<CR>"
lvim.keys.normal_mode["<S-h>"] = ":BufferLineCyclePrev<CR>"

-- -- jj escape
local options = { noremap = true }
vim.keymap.set("i", "jj", "<Esc>", options)
vim.keymap.set("i", "оо", "<Esc>", options)

-- -- new line
vim.api.nvim_set_keymap('n', 'zj', 'o<Esc>', { noremap = true })
vim.api.nvim_set_keymap('n', 'zk', 'O<Esc>', { noremap = true })
vim.api.nvim_set_keymap('n', 'zJ', 'o<Esc>k', { noremap = true })
vim.api.nvim_set_keymap('n', 'zK', 'O<Esc>j', { noremap = true })

-- -- https://github.com/svermeulen/vim-cutlass
vim.api.nvim_set_keymap('n', 'm', 'd', { noremap = true })
vim.api.nvim_set_keymap('x', 'm', 'd', { noremap = true })
vim.api.nvim_set_keymap('n', 'mm', 'dd', { noremap = true })
vim.api.nvim_set_keymap('n', 'M', 'D', { noremap = true })

-- -- Trouble
lvim.builtin.which_key.mappings["t"] = {
  name = "Diagnostics",
  t = { "<cmd>TroubleToggle<cr>", "trouble" },
  w = { "<cmd>TroubleToggle workspace_diagnostics<cr>", "workspace" },
  d = { "<cmd>TroubleToggle document_diagnostics<cr>", "document" },
  q = { "<cmd>TroubleToggle quickfix<cr>", "quickfix" },
  l = { "<cmd>TroubleToggle loclist<cr>", "loclist" },
  r = { "<cmd>TroubleToggle lsp_references<cr>", "references" },
}

-- -- Telescope
lvim.builtin.telescope.defaults.path_display = { "smart", "absolute", "truncate" }
lvim.builtin.which_key.mappings["P"] = { "<cmd>Telescope projects<CR>", "Projects" }
lvim.builtin.telescope.defaults.layout_strategy = "horizontal"
lvim.builtin.telescope.defaults.layout_config = {
  horizontal = {
    prompt_position = "top",
    width = 0.9,
    height = 0.9,
    preview_width = 0.55,
  },
}

lvim.builtin.telescope.defaults.file_ignore_patterns = {
  "vendor/*",
  "%.lock",
  "__pycache__/*",
  "%.sqlite3",
  "%.ipynb",
  "node_modules/*",
  "%.jpg",
  "%.jpeg",
  "%.png",
  "%.svg",
  "%.otf",
  "%.ttf",
  ".git/",
  "%.webp",
  ".dart_tool/",
  ".github/",
  ".gradle/",
  ".idea/",
  ".settings/",
  ".vscode/",
  "__pycache__/",
  "build/",
  "env/",
  "gradle/",
  "node_modules/",
  "target/",
  "%.pdb",
  "%.dll",
  "%.class",
  "%.exe",
  "%.cache",
  "%.ico",
  "%.pdf",
  "%.dylib",
  "%.jar",
  "%.docx",
  "%.met",
  "smalljre_*/*",
  ".vale/",
  "%.burp",
  "%.mp4",
  "%.mkv",
  "%.rar",
  "%.zip",
  "%.7z",
  "%.tar",
  "%.bz2",
  "%.epub",
  "%.flac",
  "%.tar.gz",
}

-- -- https://github.com/vuki656/package-info.nvim
require('package-info').setup()
-- Show dependency versions
vim.keymap.set({ "n" }, "<LEADER>ns", require("package-info").show, { silent = true, noremap = true })
-- Hide dependency versions
vim.keymap.set({ "n" }, "<LEADER>nc", require("package-info").hide, { silent = true, noremap = true })
-- Toggle dependency versions
vim.keymap.set({ "n" }, "<LEADER>nt", require("package-info").toggle, { silent = true, noremap = true })
-- Update dependency on the line
vim.keymap.set({ "n" }, "<LEADER>nu", require("package-info").update, { silent = true, noremap = true })
-- Delete dependency on the line
vim.keymap.set({ "n" }, "<LEADER>nd", require("package-info").delete, { silent = true, noremap = true })
-- Install a new dependency
vim.keymap.set({ "n" }, "<LEADER>ni", require("package-info").install, { silent = true, noremap = true })
-- Install a different dependency version
vim.keymap.set({ "n" }, "<LEADER>np", require("package-info").change_version, { silent = true, noremap = true })

-- -- Change theme settings
lvim.colorscheme = "nord"
vim.g.nord_borders = true
vim.g.nord_bold = false
vim.g.nord_contrast = true
vim.g.nord_cursorline_transparent = false

-- -- builtin
lvim.builtin.alpha.active = true
lvim.builtin.alpha.mode = "dashboard"
lvim.builtin.terminal.active = true
lvim.builtin.terminal.float_opts = { height = 25, width = 110 }
lvim.builtin.nvimtree.setup.view.side = "left"
lvim.builtin.nvimtree.setup.renderer.icons.show.git = true

-- -- https://github.com/junegunn/vim-peekaboo
vim.g.peekaboo_window = 'vert bo 55new'

-- -- Automatically install missing parsers when entering buffer
lvim.builtin.treesitter.auto_install = true
lvim.builtin.treesitter.ignore_install = { "fish", "java" }

-- -- always installed on startup, useful for parsers without a strict filetype
-- lvim.builtin.treesitter.ensure_installed = { "comment", "markdown_inline", "regex" }

-- -- Additional Plugins <https://www.lunarvim.org/docs/plugins#user-plugins>
lvim.plugins = {
  {
    'vuki656/package-info.nvim',
    dependencies = 'MunifTanjim/nui.nvim',
    config = function() require('package-info').setup() end
  },
  { "shaunsingh/nord.nvim" },
  {
    "phaazon/hop.nvim",
    event = "BufRead",
    config = function()
      require("hop").setup()
      vim.api.nvim_set_keymap("n", "s", ":HopChar2<cr>", { silent = true })
      vim.api.nvim_set_keymap("n", "S", ":HopWord<cr>", { silent = true })
    end,
  },
  {
    "wakatime/vim-wakatime"
  },
  {
    "p00f/nvim-ts-rainbow",
  },
  {
    "folke/todo-comments.nvim",
    event = "BufRead",
    config = function()
      require("todo-comments").setup()
    end,
  },
  {
    "folke/trouble.nvim",
    cmd = "TroubleToggle",
  },
  {
    "vuki656/package-info.nvim",
    dependencies = "MunifTanjim/nui.nvim",
  },
  { "junegunn/vim-peekaboo" },
  { "svermeulen/vim-cutlass" },
  { "jxnblk/vim-mdx-js" },
}

table.insert(lvim.plugins, {
  "zbirenbaum/copilot-cmp",
  event = "InsertEnter",
  dependencies = { "zbirenbaum/copilot.lua" },
  config = function()
    vim.defer_fn(function()
      require("copilot").setup()     -- https://github.com/zbirenbaum/copilot.lua/blob/master/README.md#setup-and-configuration
      require("copilot_cmp").setup() -- https://github.com/zbirenbaum/copilot-cmp/blob/master/README.md#configuration
    end, 100)
  end,
})

require 'lspconfig'.tailwindcss.setup({
  settings = {
    tailwindCSS = {
      experimental = {
        classRegex = {
          "twc\\.[^`]+`([^`]*)`",
          "twc\\(.*?\\).*?`([^)]*)",
          { "twc\\.[^`]+\\(([^)]*)\\)",     "(?:'|\"|`)([^']*)(?:'|\"|`)" },
          { "twc\\(.*?\\).*?\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)" }
        },
      },
    },
  },
})

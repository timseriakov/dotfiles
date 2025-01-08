-- Options are automatically loaded before lazy.nvim startup
-- Default options that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Add any additional options here
vim.g.lazyvim_picker = "telescope"
-- vim.g.lazyvim_picker = "fzf"
vim.opt.termguicolors = true
vim.o.encoding = "utf-8"
vim.o.fileencodings = "utf-8,cp1251,koi8-r,latin1"
vim.env.TMPDIR = "/tmp/nvim"

-- -- for neovide
if vim.g.neovide then
	vim.env.IN_NEOVIDE = "true"

	vim.o.guifont = "ShureTechMono Nerd Font:h18"

	vim.g.neovide_fullscreen = true

	vim.opt.title = true
	-- vim.g.neovide_background_color = "#2E3440"

	vim.g.neovide_padding_top = 20
	vim.g.neovide_padding_bottom = 0
	vim.g.neovide_padding_right = 0
	vim.g.neovide_padding_left = 10

	-- vim.g.neovide_text_gamma = 0.1
	-- vim.g.neovide_text_contrast = 0.7

	-- scroll animation
	-- vim.g.neovide_scroll_animation_length = 0 -- some turning this off makes scrolling smoother
	-- vim.g.neovide_scroll_animation_far_lines = 0 -- this prevents previews in fzf windows from snapping
	-- vim.g.neovide_cursor_animate_in_insert_mode = true

	vim.g.neovide_window_blurred = false

	-- vim.g.neovide_transparency = 0.95
	-- vim.g.neovide_normal_opacity = 0.95

	vim.g.neovide_show_border = false -- true???

	vim.g.neovide_cursor_vfx_mode = "railgun"
	vim.g.neovide_cursor_vfx_particle_density = 10.0 -- плотность частиц
	vim.g.neovide_cursor_antialiasing = true
	vim.g.neovide_hide_mouse_when_typing = true
	vim.g.neovide_floating_opacity = 1

	vim.g.neovide_cursor_vfx_particle_curl = 0.1
	vim.g.neovide_cursor_vfx_particle_lifetime = 3.2
	vim.g.neovide_cursor_vfx_particle_speed = 20.0

	-- Allow clipboard copy-paste
	vim.keymap.set("v", "<D-c>", '"+y') -- Copy
	vim.keymap.set("n", "<D-v>", '"+P') -- Paste normal mode
	vim.keymap.set("v", "<D-v>", '"+P') -- Paste visual mode
	vim.keymap.set("c", "<D-v>", "<C-R>+") -- Paste command mode
	vim.keymap.set("i", "<D-v>", '<ESC>l"+Pli') -- Paste insert mode
	vim.keymap.set("t", "<D-v>", [[<C-\><C-N>"+P]]) -- Paste terminal mode

	-- command mapping
	vim.keymap.set({ "i", "n" }, "<D-a>", "<Esc>ggVG") -- select all
	vim.keymap.set("n", "<D-z>", "u") -- undo

	-- vim.keymap.set("x", "<D-x>", '"+dm0i<Esc>`0') -- cut (include insert hack to fix whichkey issue #518)
end

-- Options are automatically loaded before lazy.nvim startup
-- Default options that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Add any additional options here
vim.g.lazyvim_picker = "telescope"
-- vim.g.lazyvim_picker = "fzf"
vim.opt.termguicolors = true

-- -- for neovide
if vim.g.neovide then
	vim.o.guifont = "ShureTechMono Nerd Font:h17" -- text below applies for VimScript

	vim.g.neovide_fullscreen = true

	vim.opt.title = true
	-- vim.g.neovide_background_color = "#2E3440"

	vim.g.neovide_padding_top = 20
	vim.g.neovide_padding_bottom = 0
	vim.g.neovide_padding_right = 0
	vim.g.neovide_padding_left = 10

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

	-- vim.g.neovide_cursor_vfx_particle_curl = 0.1
	-- vim.g.neovide_cursor_vfx_particle_lifetime = 3.2
	-- vim.g.neovide_cursor_vfx_particle_speed = 20.0
end

-- Options are automatically loaded before lazy.nvim startup
-- Default options that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Add any additional options here
vim.g.lazyvim_picker = "telescope"
-- vim.g.lazyvim_picker = "fzf"

-- Disable AI in autocomplete menu, use only ghost text (virtual_text)
vim.g.ai_cmp = false

vim.opt.relativenumber = false

vim.opt.termguicolors = true
vim.o.autoread = true -- Required for opencode.nvim (and generally good)
vim.o.encoding = "utf-8"
vim.o.fileencodings = "utf-8,cp1251,koi8-r,latin1"
vim.env.TMPDIR = "/tmp/nvim"
vim.fn.mkdir(vim.env.TMPDIR, "p") -- p = parents
vim.g.lazyvim_eslint_auto_format = true
vim.opt.spelllang = { "ru", "en" }

vim.opt.mouse = "a" -- Enable mouse support
vim.o.mousescroll = "ver:1,hor:1" -- Slower mouse scroll for terminal
vim.opt.swapfile = false

-- Change cursor shape per mode in terminals like kitty or iTerm2
if vim.env.TERM:match("xterm-kitty") or vim.env.TERM:match("xterm-256color") then
  vim.opt.guicursor = ""
  vim.opt.t_SI = "\27[6 q" -- insert: bar cursor
  vim.opt.t_EI = "\27[2 q" -- normal: block
  vim.opt.t_SR = "\27[4 q" -- replace: underline
end

-- -- for neovide
if vim.g.neovide then
  vim.env.IN_NEOVIDE = "true"

  vim.o.guifont = "ShureTechMono Nerd Font:h18"

  vim.g.neovide_input_macos_option_key_is_meta = "both"
  vim.g.neovide_input_use_logo = true

  -- Enable mouse move events for scroll-under-cursor
  vim.o.mousemoveevent = true

  vim.opt.title = false
  vim.g.neovide_fullscreen = false
  -- vim.g.neovide_macos_simple_fullscreen = true

  -- vim.g.neovide_background_color = "#2e3440"

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
  vim.g.neovide_opacity = 1 -- 0.8
  vim.g.neovide_normal_opacity = 1

  vim.g.neovide_floating_blur_amount_x = 7.0
  vim.g.neovide_floating_blur_amount_y = 7.0

  vim.g.neovide_floating_shadow = true
  vim.g.neovide_floating_z_height = 2
  vim.g.neovide_light_angle_degrees = 45
  vim.g.neovide_light_radius = 3
  vim.g.neovide_floating_corner_radius = 0.2

  vim.g.experimental_layer_grouping = false

  vim.g.neovide_show_border = true

  -- vim.g.neovide_cursor_vfx_mode = "railgun"
  -- vim.g.neovide_cursor_vfx_particle_density = 10.0 -- плотность частиц
  vim.g.neovide_cursor_antialiasing = true
  -- vim.g.neovide_cursor_short_animation_length = 0.04

  vim.g.neovide_hide_mouse_when_typing = false
  vim.g.neovide_floating_opacity = 1

  -- vim.g.neovide_cursor_vfx_particle_curl = 0.1
  -- vim.g.neovide_cursor_vfx_particle_lifetime = 3.2
  -- vim.g.neovide_cursor_vfx_particle_speed = 20.0

  -- Время жизни каждой частицы (в секундах).
  -- Чем больше значение, тем дольше частицы остаются на экране (длиннее хвост).
  vim.g.neovide_cursor_vfx_particle_lifetime = 1.1

  -- Плотность (кол-во) частиц, выбрасываемых курсором.
  -- Чем выше значение, тем ярче и насыщеннее след.
  vim.g.neovide_cursor_vfx_particle_density = 0.8

  -- Скорость, с которой частицы улетают от курсора.
  -- Чем выше, тем дальше и быстрее они двигаются.
  vim.g.neovide_cursor_vfx_particle_speed = 20.0

  -- Фаза синусоиды движения частиц (волнообразность).
  -- Чем выше значение, тем больше "извивов" в траектории.
  vim.g.neovide_cursor_vfx_particle_phase = 3

  -- Крутизна "завихрений" в траектории частиц.
  -- Чем выше значение, тем больше частицы закручиваются.
  vim.g.neovide_cursor_vfx_particle_curl = 1

  -- Размер следа от курсора (0.0–1.0).
  -- Чем больше значение, тем сильнее тянется хвост.
  -- vim.g.neovide_cursor_trail_size = 0.3

  -- Длительность анимации перемещения курсора (в секундах).
  vim.g.neovide_cursor_animation_length = 0.05

  -- Длительность анимации при коротком перемещении (1–2 символа).
  vim.g.neovide_cursor_short_animation_length = 0.015

  -- Включает/отключает анимацию курсора в режиме вставки.
  vim.g.neovide_cursor_animate_in_insert_mode = false

  -- Включает/отключает анимацию при работе с командной строкой.
  vim.g.neovide_cursor_animate_command_line = true

  -- Плавное мигание курсора
  vim.g.neovide_cursor_smooth_blink = true

  -- zoom
  vim.g.neovide_scale_factor = 1.0

  local default_scale = 1.0

  local change_scale_factor = function(delta)
    vim.g.neovide_scale_factor = vim.g.neovide_scale_factor * delta
  end

  local reset_scale_factor = function()
    vim.g.neovide_scale_factor = default_scale
  end

  vim.keymap.set("n", "<C-+>", function()
    change_scale_factor(1.25)
  end)

  vim.keymap.set("n", "<C-->", function()
    change_scale_factor(1 / 1.25)
  end)

  vim.keymap.set("n", "<C-=>", function()
    reset_scale_factor()
  end)

  vim.g.neovide_input_use_logo = true
  vim.o.clipboard = "unnamedplus"

  -- Normal / visual
  vim.keymap.set({ "n", "v" }, "<D-v>", '"+P', { noremap = true })

  -- Insert mode
  vim.keymap.set("i", "<D-v>", function()
    local lines = vim.fn.getreg("+", 1, true)
    vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes("<Esc>", true, false, true), "n", true)
    vim.api.nvim_put(lines, "c", true, true)
    vim.api.nvim_feedkeys("li", "n", true)
  end, { noremap = true })

  -- Terminal
  vim.keymap.set("t", "<D-v>", [[<C-\><C-N>"+Pi]], { noremap = true })

  -- Command-line
  vim.keymap.set("c", "<D-v>", "<C-r>+", { noremap = true })

  -- Visual mode copy
  vim.keymap.set("v", "<D-c>", '"+y', { noremap = true })

  -- Prompt buffers (Telescope, Dressing, etc)
  vim.api.nvim_create_autocmd("FileType", {
    pattern = { "DressingInput", "TelescopePrompt", "alpha", "oil", "neo-tree", "snacks_explorer" },
    callback = function()
      vim.keymap.set("i", "<D-v>", function()
        local lines = vim.fn.getreg("+", 1, true)
        vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes("<Esc>", true, false, true), "n", true)
        vim.api.nvim_put(lines, "c", true, true)
        vim.api.nvim_feedkeys("li", "n", true)
      end, { buffer = true, noremap = true })
    end,
  })
end

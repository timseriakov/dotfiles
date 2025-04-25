-- Options are automatically loaded before lazy.nvim startup
-- Default options that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/options.lua
-- Add any additional options here
vim.g.lazyvim_picker = "telescope"
-- vim.g.lazyvim_picker = "fzf"
vim.opt.termguicolors = true
vim.o.encoding = "utf-8"
vim.o.fileencodings = "utf-8,cp1251,koi8-r,latin1"
vim.env.TMPDIR = "/tmp/nvim"
vim.g.lazyvim_eslint_auto_format = true
vim.opt.spelllang = { "ru", "en" }

vim.o.mousescroll = "ver:1,hor:1"

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
  -- vim.g.neovide_cursor_vfx_particle_density = 10.0 -- плотность частиц
  vim.g.neovide_cursor_antialiasing = true
  vim.g.neovide_hide_mouse_when_typing = true
  vim.g.neovide_floating_opacity = 1

  -- vim.g.neovide_cursor_vfx_particle_curl = 0.1
  -- vim.g.neovide_cursor_vfx_particle_lifetime = 3.2
  -- vim.g.neovide_cursor_vfx_particle_speed = 20.0

  -- Время жизни каждой частицы (в секундах).
  -- Чем больше значение, тем дольше частицы остаются на экране (длиннее хвост).
  vim.g.neovide_cursor_vfx_particle_lifetime = 2

  -- Плотность (кол-во) частиц, выбрасываемых курсором.
  -- Чем выше значение, тем ярче и насыщеннее след.
  vim.g.neovide_cursor_vfx_particle_density = 0.7

  -- Скорость, с которой частицы улетают от курсора.
  -- Чем выше, тем дальше и быстрее они двигаются.
  vim.g.neovide_cursor_vfx_particle_speed = 20.0

  -- Фаза синусоиды движения частиц (волнообразность).
  -- Чем выше значение, тем больше "извивов" в траектории.
  vim.g.neovide_cursor_vfx_particle_phase = 1.5

  -- Крутизна "завихрений" в траектории частиц.
  -- Чем выше значение, тем больше частицы закручиваются.
  vim.g.neovide_cursor_vfx_particle_curl = 0.1

  -- Размер следа от курсора (0.0–1.0).
  -- Чем больше значение, тем сильнее тянется хвост.
  -- vim.g.neovide_cursor_trail_size = 0.3

  -- Длительность анимации перемещения курсора (в секундах).
  -- vim.g.neovide_cursor_animation_length = 0.13

  -- Длительность анимации при коротком перемещении (1–2 символа).
  -- vim.g.neovide_cursor_short_animation_length = 0.03

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

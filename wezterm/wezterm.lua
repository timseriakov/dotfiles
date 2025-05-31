local wezterm = require("wezterm")

return {
	-- 🎨 Цветовая схема (можно Nord, Catppuccin, Tokyo Night)
	color_scheme = "nord",

	-- 💧 Прозрачность + блюр
	window_background_opacity = 0.88,
	macos_window_background_blur = 25,

	-- 🪟 Полностью убираем рамки и заголовок
	window_decorations = "RESIZE",

	-- 🧱 Без паддингов
	window_padding = {
		left = 0,
		right = 0,
		top = 0,
		bottom = 0,
	},

	-- 🧊 Шрифт в стиле macOS / WWDC
	font = wezterm.font_with_fallback({
		"ShureTechMono Nerd Font",
		"JetBrainsMono Nerd Font",
	}),
	font_size = 18.0,
	line_height = 1.1,

	-- 🚫 Без таб-бара
	hide_tab_bar_if_only_one_tab = true,

	-- ⚡️ Быстрее реакция на redraw
	animation_fps = 60,
	max_fps = 120,

	-- ✨ Курсор и поведение (на твой вкус)
	default_cursor_style = "BlinkingBar",

	-- 🔧 Совместимость
	enable_wayland = false, -- на всякий случай, если вдруг под Linux
}

return {
	"nvim-lualine/lualine.nvim",
	config = function()
		require("lualine").setup({
			sections = {
				lualine_a = { "mode" },
				lualine_b = {
					{
						"filetype",
						colored = true, -- Отображает иконку типа файла в цвете
						icon_only = true, -- Показывает иконку и текст
						icon = { align = "right" }, -- Иконка справа от текста
					},
				},
				lualine_c = {
					{
						"filename",
						file_status = true, -- Показывает статус файла (readonly, modified)
						newfile_status = true, -- Показывает статус нового файла
						path = 1, -- 1: Относительный путь
						shorting_target = 70, -- Сокращает путь для экономии места
						symbols = {
							modified = "[+]", -- Значок для модифицированного файла
							readonly = "[-]", -- Значок для readonly файла
							unnamed = "[No Name]", -- Для неназванных буферов
							newfile = "[New]", -- Для нового файла
						},
					},
				},
				lualine_x = { "diff", "branch" },
				lualine_y = { "location" },
				lualine_z = { "progress" },
			},
			options = {
				globalstatus = true,
			},
		})
	end,
}

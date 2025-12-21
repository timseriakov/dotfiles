return {
  "3rd/image.nvim",
  lazy = false,
  enabled = not vim.g.neovide,
  opts = {
    backend = "kitty",
    processor = "magick_cli",
    integrations = {
      markdown = {
        enabled = true,
        clear_in_insert_mode = false,
        download_remote_images = true,
        only_render_image_at_cursor = false,
        only_render_image_at_cursor_mode = "popup",
        editor_only_render_when_focused = true,
        window_overlap_clear_enabled = true,
        tmux_show_only_in_active_window = true,
        floating_windows = false,
        filetypes = { "markdown", "vimwiki" },
        resolve_image_path = function(document_path, image_path, fallback)
          local cleaned = image_path
            :gsub("%[%[", "") -- убираем [[
            :gsub("]]", "") -- убираем ]]
            :gsub(" ", "\\ ") -- экранируем пробелы

          local doc_dir = vim.fs.dirname(document_path)
          local direct_path = doc_dir .. "/" .. cleaned

          -- если файл существует рядом
          if vim.loop.fs_stat(direct_path) then
            return direct_path
          end

          -- пробуем в подкаталоге --attachments--
          local attachments_path = doc_dir .. "/-attachments-/" .. cleaned
          if vim.loop.fs_stat(attachments_path) then
            return attachments_path
          end

          -- fallback (мало ли)
          return fallback(document_path, cleaned)
        end,
      },
    },
    max_height_window_percentage = 50,
    window_overlap_clear_enabled = true,
    window_overlap_clear_ft_ignore = {
      "cmp_menu",
      "cmp_docs",
      "snacks_notif",
      "scrollview",
      "scrollview_sign",
    },
    editor_only_render_when_focused = true,
    tmux_show_only_in_active_window = false,
    hijack_file_patterns = { "*.png", "*.jpg", "*.jpeg", "*.gif", "*.webp", "*.avif" },
  },
}

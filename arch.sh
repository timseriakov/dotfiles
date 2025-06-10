#!/usr/bin/env bash
set -euo pipefail

PKG="pkgs/archcraft-hyprland-catppuccin-6.0-3-any.pkg.tar.zst"

echo "==> Распаковка пакета в /"
sudo bsdtar -xpf "$PKG" -C /

echo "==> Копирование конфигурации в ~/.config/hypr"
if [ -d "$HOME/.config/hypr" ]; then
  echo "⚠️  ~/.config/hypr уже существует, делаю бэкап..."
  mv "$HOME/.config/hypr" "$HOME/.config/hypr.bak.$(date +%s)"
fi

cp -r /etc/skel/.config/hypr "$HOME/.config/"

echo "✅ Готово. Теперь можешь запускать Hyprland."

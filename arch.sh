#!/usr/bin/env bash

set -e

PKG="archcraft-hyprland-catppuccin-6.0-3-any.pkg.tar.zst"
WORKDIR="fixed"
FIXED_PKG="archcraft-hyprland-catppuccin-fixed.pkg.tar.zst"

echo "==> Распаковка пакета..."
mkdir -p "$WORKDIR"
bsdtar -xf "pkgs/$PKG" -C "$WORKDIR"

echo "==> Замена зависимостей в .PKGINFO..."
sed -i \
  -e 's/hyprland-stable/hyprland/' \
  -e 's/wlroots/wlroots-git/' \
  "$WORKDIR/.PKGINFO"

echo "==> Пересборка архива..."
bsdtar -cf "$FIXED_PKG" -C "$WORKDIR" .

echo "==> Установка исправленного пакета..."
sudo pacman -U "$FIXED_PKG" --noconfirm

echo "✅ Установлено. Можно копировать конфиги:"
echo "   cp -r /etc/skel/.config/hypr ~/.config/"

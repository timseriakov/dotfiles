#!/usr/bin/env bash

set -e

PKG="pkgs/archcraft-hyprland-catppuccin-6.0-3-any.pkg.tar.zst"
WORKDIR="archcraft-hyprland-catppuccin-fixed"
OUT="archcraft-hyprland-catppuccin-fixed.pkg.tar.zst"

echo "==> Распаковка пакета..."
rm -rf "$WORKDIR"
mkdir "$WORKDIR"
bsdtar -xf "$PKG" -C "$WORKDIR"

echo "==> Замена зависимостей..."
sed -i \
  -e 's/hyprland-stable/hyprland/' \
  -e 's/wlroots/wlroots-git/' \
  "$WORKDIR/.PKGINFO"

echo "==> Упаковка исправленного пакета..."
cd "$WORKDIR"
fakeroot bsdtar -cnf "../$OUT" ./*

echo "==> Установка..."
cd ..
sudo pacman -U "$OUT" --noconfirm

echo "✅ Установлено. Можешь скопировать конфиги:"
echo "   cp -r /etc/skel/.config/hypr ~/.config/"

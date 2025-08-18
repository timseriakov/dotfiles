#!/usr/bin/env fish

echo "==> Uninstalling old qutebrowser and PyQt..."
brew uninstall --cask qutebrowser
pip3 uninstall -y PyQt5 PyQt6 PyQtWebEngine

echo "==> Installing pyqt@6 via Homebrew..."
brew install pyqt@6

echo "==> Verifying brew Python..."
which python3
which pip3

echo "==> Installing qutebrowser without PyQt..."
pip3 install --no-deps qutebrowser

echo "==> Installing qutebrowser runtime dependencies..."
pip3 install jinja2 pygments pyyaml attrs pypeg2 markupsafe

echo "==> Adding QT_PLUGIN_PATH to fish config..."
set -Ux QT_PLUGIN_PATH (brew --prefix qt@6)/plugins

echo "==> Done! Launch qutebrowser:"
echo qutebrowser

#!/bin/bash
# Setup script for qutebrowser automatic English layout switching

set -euo pipefail

echo "🔧 Setting up qutebrowser automatic English layout switching..."

# Check if im-select is installed
if ! command -v im-select >/dev/null 2>&1; then
    echo "❌ im-select not found. Installing..."
    if command -v brew >/dev/null 2>&1; then
        brew install daipeihust/tap/im-select
    else
        echo "❌ Homebrew not found. Please install im-select manually:"
        echo "   brew install daipeihust/tap/im-select"
        exit 1
    fi
fi

# Disable keyboard layout tooltip (if not already done)
echo "🔇 Disabling keyboard layout switch tooltip..."
defaults write kCFPreferencesAnyApplication TSMLanguageIndicatorEnabled 0
defaults write com.apple.HIToolbox AppleLanguageIndicatorEnabled 0

# Make sure userscripts are executable
echo "🔐 Setting userscript permissions..."
chmod +x ../userscripts/switch-to-english
chmod +x ../userscripts/auto-layout-handler

# Test the basic layout switching
echo "🧪 Testing layout switching..."
if ../userscripts/switch-to-english; then
    echo "✅ Layout switching works!"
else
    echo "❌ Layout switching failed. Check im-select installation."
    exit 1
fi

echo ""
echo "✅ Setup complete! Features enabled:"
echo "   • Leave insert mode → English layout (Escape key)"
echo "   • Command modes → English layout (: t etc., search / ? preserves current)"
echo "   • Preserve layout in insert mode for multilingual typing"
echo ""
echo "💡 You may need to restart qutebrowser for all features to work."
echo "💡 You may need to log out/in for tooltip disabling to take effect."

#!/bin/bash
# Disable macOS keyboard layout switch tooltip/popup
# Run this once to permanently disable the blue "RU/EN" tooltip when switching layouts

echo "Disabling macOS keyboard layout switch tooltip..."

# Disable the language indicator popup
defaults write kCFPreferencesAnyApplication TSMLanguageIndicatorEnabled 0

# Alternative method (if the above doesn't work)
defaults write com.apple.HIToolbox AppleLanguageIndicatorEnabled 0

echo "Keyboard layout tooltip disabled. You may need to log out and back in for changes to take effect."
echo "To re-enable: defaults write kCFPreferencesAnyApplication TSMLanguageIndicatorEnabled 1"

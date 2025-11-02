## Base environment (no PATH modifications here)

# Locale
set -gx LANG en_US.UTF-8
set -gx LC_ALL en_US.UTF-8

# Shell UX
set -gx fish_command_timeout 8000
set -gx fish_greeting Welcome
set -gx NEOVIDE_TITLE_HIDDEN 1
set -gx HOMEBREW_NO_ENV_HINTS 1
set -gx EDITOR /opt/homebrew/bin/nvim

# XDG
set -gx XDG_CONFIG_HOME $HOME/.config

# Android SDK
set -gx ANDROID_HOME "$HOME/Library/Android/sdk"

# Java
set -gx JAVA_HOME "/Library/Java/JavaVirtualMachines/zulu-11.jdk/Contents/Home"

# Volta
set -gx VOLTA_HOME "$HOME/.volta"

# Tools env flags
set -gx ESLINT_USE_FLAT_CONFIG true
set -gx COMPOSE_BAKE true

# bat
set -gx BAT_THEME Nord

# posting
set -gx POSTING_PAGER moar
set -gx POSTING_ANIMATION full
set -gx POSTING_THEME alpine

set -gx REACT_EDITOR /opt/homebrew/bin/nvim

# vapi manpath
set --export MANPATH "$HOME/.vapi"/share/man $MANPATH

# QtWebEngine (Homebrew on macOS ARM)
if type -q brew
    set -gx QTWEBENGINE_RESOURCES_PATH (brew --prefix qt@6)/lib/QtWebEngineCore.framework/Resources
    set -gx QTWEBENGINE_LOCALES_PATH $QTWEBENGINE_RESOURCES_PATH/qtwebengine_locales
    set -gx QT_PLUGIN_PATH (brew --prefix qt@6)/plugins
end

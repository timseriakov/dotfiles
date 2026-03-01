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
set -gx BAT_STYLE plain
set -gx BAT_DECORATIONS never

# Nord file type colors for tools that use LS_COLORS (fd/eza/ls)
if type -q gdircolors
    set -l dir_colors_file "$HOME/.dir_colors"
    if test -f "$dir_colors_file"
        set -l ls_colors_line (gdircolors -b "$dir_colors_file" | head -n 1)
        if test -n "$ls_colors_line"
            set -l ls_colors_value (string replace "LS_COLORS='" "" -- "$ls_colors_line")
            set -gx LS_COLORS (string replace "';" "" -- "$ls_colors_value")
        end
    end
end

# posting
set -gx POSTING_PAGER moar
set -gx POSTING_ANIMATION full
set -gx POSTING_THEME alpine

set -gx REACT_EDITOR /opt/homebrew/bin/nvim

# vapi manpath
set --export MANPATH "$HOME/.vapi"/share/man $MANPATH

# QtWebEngine (Homebrew on macOS ARM)
if type -q brew
    set qtwebengine_prefix (brew --prefix qtwebengine 2>/dev/null)
    if test -n "$qtwebengine_prefix"
        set -gx QTWEBENGINE_RESOURCES_PATH $qtwebengine_prefix/lib/QtWebEngineCore.framework/Resources
        set -gx QTWEBENGINE_LOCALES_PATH $QTWEBENGINE_RESOURCES_PATH/qtwebengine_locales
    end

    set qtbase_prefix (brew --prefix qtbase 2>/dev/null)
    if test -n "$qtbase_prefix"
        set -gx QT_PLUGIN_PATH $qtbase_prefix/share/qt/plugins
    end
end

# Deno experemental tsgo flag
set -gx DENO_UNSTABLE_TSGO 1

# GO MCP Proxy
set -gx MCPPROXY_DISABLE_OAUTH true
set -gx MCPPROXY_UPDATE_APP_BUNDLE true

# pnpm end

true

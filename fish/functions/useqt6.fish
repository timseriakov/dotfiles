function useqt6
    set -gx PATH ~/dev/qt6-install/bin $PATH
    set -gx PKG_CONFIG_PATH ~/dev/qt6-install/lib/pkgconfig $PKG_CONFIG_PATH
    echo "✅ Qt 6 activated in PATH and PKG_CONFIG_PATH"
end

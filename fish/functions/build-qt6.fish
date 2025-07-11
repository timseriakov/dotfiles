# ~/.config/fish/functions/build-qt6.fish
function build-qt6
    set -l qt_version 6.7.1
    set -l src_dir $HOME/dev/qt6-src
    set -l build_dir $HOME/dev/qt6-build
    set -l install_dir $HOME/dev/qt6-install
    set -l log_file $HOME/dev/qt6-build.log
    set -l llvm_path (brew --prefix llvm@16)

    function _on_exit --on-event fish_exit
        echo -e "\n🪦 Build ended. Last 30 log lines:"
        tail -n 30 $log_file
        echo -e "\n⏎ Press any key to close..."
        read -n 1
    end

    echo "📦 Installing dependencies..." | tee $log_file
    brew install cmake ninja perl git \
        ffmpeg libvpx libpng jpeg zlib \
        freetype harfbuzz re2 snappy icu4c \
        libevent libxml2 libxslt little-cms2 \
        llvm@16 ccache >>$log_file 2>&1

    echo "⬇️ Cloning Qt source..." | tee -a $log_file
    if not test -d $src_dir
        git clone https://code.qt.io/qt/qt5.git $src_dir --branch v$qt_version >>$log_file 2>&1
        cd $src_dir
        perl init-repository --module-subset=qtbase,qtdeclarative,qtshadertools,qtwebengine,qtwebchannel,qttools --force >>$log_file 2>&1
    end

    echo "🧹 Cleaning build dir..." | tee -a $log_file
    rm -rf $build_dir $install_dir
    mkdir -p $build_dir
    cd $build_dir

    echo "🔧 Configuring..." | tee -a $log_file
    cmake $src_dir \
        -GNinja \
        -DCMAKE_BUILD_TYPE=Release \
        -DCMAKE_INSTALL_PREFIX=$install_dir \
        -DQT_FEATURE_webengine_proprietary_codecs=ON \
        -DQT_FEATURE_webengine_webrtc=ON \
        -DQT_FEATURE_webengine_spellchecker=ON \
        -DQT_FEATURE_webengine_kerberos=ON \
        -DQT_FEATURE_ccache=ON \
        -DCMAKE_VERBOSE_MAKEFILE=ON \
        -DCMAKE_PREFIX_PATH=$llvm_path/lib/cmake \
        -DCMAKE_C_COMPILER=$llvm_path/bin/clang \
        -DCMAKE_CXX_COMPILER=$llvm_path/bin/clang++ \
        -Wno-dev \
        --log-level=STATUS >>$log_file 2>&1

    echo "🔨 Building..." | tee -a $log_file
    cmake --build . --parallel (sysctl -n hw.ncpu) >>$log_file 2>&1

    echo "📦 Installing..." | tee -a $log_file
    cmake --install . >>$log_file 2>&1

    echo "🔎 Checking qsb..." | tee -a $log_file
    if not test -x $install_dir/bin/qsb
        echo "❌ qsb not found — QtQuick и WebEngine не будут работать" | tee -a $log_file
        exit 1
    end

    echo "✅ Qt $qt_version installed to $install_dir" | tee -a $log_file
    echo "👉 Add to environment:" | tee -a $log_file
    echo "   set -x PATH $install_dir/bin \$PATH" | tee -a $log_file
    echo "   set -x PKG_CONFIG_PATH $install_dir/lib/pkgconfig \$PKG_CONFIG_PATH" | tee -a $log_file
end

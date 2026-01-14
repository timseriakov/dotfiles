# qutebrowser macOS Application Builder
# 
# This Makefile creates a native macOS app bundle for qutebrowser that:
# - Shows as "qutebrowser" in menu bar and processes (not "Python")
# - Includes comprehensive Info.plist metadata like official releases
# - Maintains full codec support via Homebrew installation
# - Uses embedded Python interpreter for better process identification

# Configuration
HOMEBREW_PREFIX = /opt/homebrew
PYTHON_VERSION := $(shell $(HOMEBREW_PREFIX)/bin/python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
PYTHON_FRAMEWORK = $(HOMEBREW_PREFIX)/opt/python@$(PYTHON_VERSION)/Frameworks/Python.framework/Versions/$(PYTHON_VERSION)
APP_BUNDLE = /Applications/qutebrowser.app
BUILD_DIR = build

# Compiler settings
CC = clang
CFLAGS = -framework Foundation -framework AppKit
PYTHON_INCLUDES = -I$(PYTHON_FRAMEWORK)/include/python$(PYTHON_VERSION)
PYTHON_LIBS = -L$(PYTHON_FRAMEWORK)/lib -lpython$(PYTHON_VERSION)

.PHONY: all install clean uninstall backup restore check

all: $(BUILD_DIR)/qutebrowser-native

# Build the native wrapper executable
$(BUILD_DIR)/qutebrowser-native: qutebrowser-native.m | $(BUILD_DIR)
	@echo "Building native qutebrowser wrapper..."
	$(CC) $(CFLAGS) $(PYTHON_INCLUDES) $(PYTHON_LIBS) -o $@ $<
	@echo "Native wrapper built successfully"

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

# Create app bundle structure
$(APP_BUNDLE)/Contents:
	@echo "Creating app bundle structure..."
	mkdir -p $(APP_BUNDLE)/Contents/{MacOS,Resources}

# Install the complete application
install: $(BUILD_DIR)/qutebrowser-native $(APP_BUNDLE)/Contents
	@echo "Installing qutebrowser.app..."
	
	# Backup existing executable if it exists
	@if [ -f $(APP_BUNDLE)/Contents/MacOS/qutebrowser ]; then \
		echo "Backing up existing executable..."; \
		cp $(APP_BUNDLE)/Contents/MacOS/qutebrowser $(APP_BUNDLE)/Contents/MacOS/qutebrowser_backup; \
	fi
	
	# Install native wrapper
	cp $(BUILD_DIR)/qutebrowser-native $(APP_BUNDLE)/Contents/MacOS/qutebrowser
	chmod +x $(APP_BUNDLE)/Contents/MacOS/qutebrowser
	
	# Install comprehensive Info.plist
	cp Info.plist $(APP_BUNDLE)/Contents/Info.plist
	
	# Copy icon if it exists
	@if [ -f ../docs/qutebrowser.icns ]; then \
		cp ../docs/qutebrowser.icns $(APP_BUNDLE)/Contents/Resources/; \
	fi
	
	# Register with LaunchServices
	/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f $(APP_BUNDLE)
	
	@echo ""
	@echo "✅ qutebrowser.app installed successfully!"
	@echo ""
	@echo "Features:"
	@echo "  • Shows as 'qutebrowser' in menu bar and Activity Monitor"
	@echo "  • Full codec support via Homebrew Python/Qt"
	@echo "  • Comprehensive macOS integration metadata"
	@echo "  • Native process identification"
	@echo ""
	@echo "Known limitation:"
	@echo "  • Raycast Pro window layouts may not work (Qt framework limitation)"

# Backup current installation
backup:
	@echo "Creating backup..."
	@if [ -d $(APP_BUNDLE) ]; then \
		cp -r $(APP_BUNDLE) $(APP_BUNDLE).backup.$(shell date +%Y%m%d_%H%M%S); \
		echo "Backup created: $(APP_BUNDLE).backup.$(shell date +%Y%m%d_%H%M%S)"; \
	else \
		echo "No existing installation to backup"; \
	fi

# Restore from backup
restore:
	@echo "Available backups:"
	@ls -la /Applications/qutebrowser.app.backup.* 2>/dev/null || echo "No backups found"
	@echo "To restore, run: cp -r /Applications/qutebrowser.app.backup.YYYYMMDD_HHMMSS /Applications/qutebrowser.app"

# Check system requirements
check:
	@echo "Checking system requirements..."
	@echo "Python installation:"
	@test -d $(PYTHON_FRAMEWORK) && echo "✅ Python $(PYTHON_VERSION) framework found" || echo "❌ Python $(PYTHON_VERSION) framework not found at $(PYTHON_FRAMEWORK)"
	@echo ""
	@echo "qutebrowser installation:"
	@$(HOMEBREW_PREFIX)/bin/python3 -c "import qutebrowser; print('✅ qutebrowser module found')" 2>/dev/null || echo "❌ qutebrowser not installed (run: brew install qutebrowser)"
	@echo ""
	@echo "Qt installation:"
	@test -d $(HOMEBREW_PREFIX)/Cellar/qt && echo "✅ Qt6 found" || echo "❌ Qt6 not found"
	@echo ""
	@echo "Current qutebrowser version:"
	@$(HOMEBREW_PREFIX)/bin/python3 -m qutebrowser --version 2>/dev/null | head -1 || echo "❌ Cannot get qutebrowser version"

# Uninstall the application
uninstall:
	@echo "Uninstalling qutebrowser.app..."
	@if [ -d $(APP_BUNDLE) ]; then \
		rm -rf $(APP_BUNDLE); \
		echo "✅ qutebrowser.app removed"; \
	else \
		echo "No installation found"; \
	fi
	
	# Clean LaunchServices cache
	/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(BUILD_DIR)
	rm -f qutebrowser-native qutebrowser-launcher
	@echo "Build artifacts cleaned"

# Development: test the wrapper without installing
test: $(BUILD_DIR)/qutebrowser-native
	@echo "Testing native wrapper..."
	$(BUILD_DIR)/qutebrowser-native --version

# Show help
help:
	@echo "qutebrowser macOS Application Builder"
	@echo ""
	@echo "Available targets:"
	@echo "  all       - Build native wrapper (default)"
	@echo "  check     - Check system requirements"
	@echo "  install   - Build and install complete app bundle"
	@echo "  backup    - Backup current installation"
	@echo "  restore   - Show restore instructions"
	@echo "  uninstall - Remove qutebrowser.app"
	@echo "  test      - Test wrapper without installing"
	@echo "  clean     - Clean build artifacts"
	@echo "  help      - Show this help"
	@echo ""
	@echo "Quick start:"
	@echo "  make check   # Verify requirements"
	@echo "  make install # Install qutebrowser.app"
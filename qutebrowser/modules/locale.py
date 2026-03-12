config = config
c = c

from modules.base import en, leader

# ========================================
# Automatic English Keyboard Layout Switching
# ========================================
# Similar to Neovim's InsertLeave behavior but for qutebrowser:
# - Switch to English on window focus (when not in insert mode)
# - Switch to English when leaving insert mode
# - Keep current layout when in insert mode for multilingual typing

# Configure automatic insert mode behavior
c.input.insert_mode.auto_enter = True  # Enter insert mode when clicking input fields
c.input.insert_mode.auto_leave = True  # Leave insert mode when clicking outside


# Override mode-enter and mode-leave commands to include layout switching
def en_mode_enter(mode):
    """Enter mode without switching layout (preserve current for typing)"""
    return f"mode-enter {mode}"


def en_mode_leave():
    """Leave mode and switch to English layout"""
    return "spawn -u switch-to-english ;; mode-leave"


# Override insert mode bindings to preserve layout when entering, switch when leaving
config.bind("i", en_mode_enter("insert"))
config.bind("ш", en_mode_enter("insert"))  # Russian layout
config.bind("a", en_mode_enter("insert"))
config.bind("ф", en_mode_enter("insert"))  # Russian layout
config.bind(leader + "aa", en_mode_enter("insert"))

# Override Escape to switch to English when leaving insert mode
config.bind("<Escape>", en_mode_leave(), mode="insert")

# Note: Window focus monitoring removed - keeping only reliable mode-based switching

# Auto-switch to English for command modes (keep existing functionality)
config.bind(":", en("cmd-set-text :"))
config.bind("t", en("cmd-set-text -s :open -t"))
config.bind("е", en("cmd-set-text -s :open -t"))
config.bind("<Cmd-t>", en("cmd-set-text -s :open -t"))
config.bind("<Cmd-е>", en("cmd-set-text -s :open -t"))

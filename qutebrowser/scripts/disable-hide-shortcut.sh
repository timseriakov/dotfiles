#!/bin/bash
# Move macOS "Hide qutebrowser" off ⌘H so qutebrowser's own <Cmd-h> binding
# (window-cycle-prev, see modules/bindings.py) receives the key instead.
#
# macOS applies NSUserKeyEquivalents (the "App Shortcuts" system setting) to
# Qt's programmatically built app menu: the "Hide qutebrowser" NSMenuItem gets
# its key equivalent reassigned from ⌘H to ⌃H, leaving ⌘H free for the app.

set -euo pipefail

echo "Moving 'Hide qutebrowser' from ⌘H to ⌃H..."
defaults write org.qutebrowser.qutebrowser NSUserKeyEquivalents -dict-add "Hide qutebrowser" "^h"

echo "Current override:"
defaults read org.qutebrowser.qutebrowser NSUserKeyEquivalents

echo ""
echo "✅ ⌘H now reaches qutebrowser (window-cycle-prev)."
echo "💡 Restart qutebrowser for the change to take effect."
echo "💡 To undo: defaults delete org.qutebrowser.qutebrowser NSUserKeyEquivalents"

require("starship"):setup()
require("git"):setup()
require("no-status"):setup()
require("close-and-restore-tab")

if os.getenv("NVIM") then
	require("toggle-pane"):entry("min-preview")
end

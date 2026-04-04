require("hs.ipc")
hs.ipc.cliInstall()

local qutebrowserTemporarySplit = require("qutebrowser_temporary_split")
qutebrowserTemporarySplit.init()
-- Auto-reload Hammerspoon config on change
local function reloadConfig(files)
	local doReload = false
	for _, file in ipairs(files) do
		if file:sub(-4) == ".lua" then
			doReload = true
			break
		end
	end
	if doReload then
		hs.reload()
	end
end
local myWatcher = hs.pathwatcher.new(os.getenv("HOME") .. "/.hammerspoon/", reloadConfig):start()
hs.alert.show("Hammerspoon: auto-reload enabled")


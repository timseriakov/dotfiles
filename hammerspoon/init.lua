require("hs.ipc")
hs.ipc.cliInstall()

local qutebrowserTemporarySplit = require("qutebrowser_temporary_split")
qutebrowserTemporarySplit.init()
local tmuxSeshLauncher = require("tmux_sesh_launcher")
tmuxSeshLauncher.init()

ut2004JumpTap = hs.eventtap.new({ hs.eventtap.event.types.keyDown, hs.eventtap.event.types.keyUp }, function(event)
	local app = hs.application.frontmostApplication()
	local isUT2004 = app ~= nil and (app:bundleID() == "com.oldunreal.UT2004" or app:name() == "UT2004")
	if not isUT2004 or event:getKeyCode() ~= hs.keycodes.map.space then
		return false
	end

	local flags = event:getFlags()
	if flags.cmd or flags.ctrl or flags.alt then
		return false
	end

	if event:getType() == hs.eventtap.event.types.keyUp then
		return true
	end

	local isRepeat = event:getProperty(hs.eventtap.event.properties.keyboardEventAutorepeat) == 1
	if not isRepeat then
		hs.eventtap.keyStroke({}, "h", 0)
		hs.timer.doAfter(0.34, function()
			local frontmost = hs.application.frontmostApplication()
			local gameActive = frontmost ~= nil and (frontmost:bundleID() == "com.oldunreal.UT2004" or frontmost:name() == "UT2004")
			if gameActive then
				hs.eventtap.keyStroke({}, "h", 0)
			end
		end)
	end
	return true
end):start()
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


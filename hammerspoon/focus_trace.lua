---@diagnostic disable: undefined-global
local focusTrace = {}

local logPath = os.getenv("HOME") .. "/Library/Logs/hammerspoon-focus.log"
local windowFilter = nil
local keyTap = nil
local axPollTimer = nil
local lastAxFocus = nil
local eventNames = {
	[hs.application.watcher.activated] = "activated",
	[hs.application.watcher.deactivated] = "deactivated",
}
local browserBundles = {
	["org.qutebrowser.qutebrowser"] = true,
	["net.imput.helium"] = true,
}

local function appInfo(app)
	if not app then
		return "app=nil pid=-1 bundle=nil title=nil"
	end
	local win = app:focusedWindow()
	return string.format(
		"app=%s pid=%s bundle=%s title=%s",
		tostring(app:name()),
		tostring(app:pid()),
		tostring(app:bundleID()),
		tostring(win and win:title())
	)
end

local function write(event, appName, app)
	local file = io.open(logPath, "a")
	if not file then
		return
	end
	file:write(string.format("%s %.3f %s %s name=%s\n", os.date("!%Y-%m-%dT%H:%M:%SZ"), hs.timer.secondsSinceEpoch(), event, appInfo(app), tostring(appName)))
	file:close()
end

local function writeKey(event)
	local app = hs.application.frontmostApplication()
	if not (app and browserBundles[app:bundleID()]) then
		return
	end
	local props = hs.eventtap.event.properties
	local srcPid = event:getProperty(props.eventSourceUnixProcessID)
	local targetPid = event:getProperty(props.eventTargetUnixProcessID)
	local srcApp = srcPid and hs.application.applicationForPID(srcPid)
	local targetApp = targetPid and hs.application.applicationForPID(targetPid)
	write(
		string.format(
			"key-down keycode=%s srcpid=%s srcapp=%s targetpid=%s targetapp=%s repeat=%s flags=%s",
			tostring(event:getKeyCode()),
			tostring(srcPid),
			tostring(srcApp and srcApp:name()),
			tostring(targetPid),
			tostring(targetApp and targetApp:name()),
			tostring(event:getProperty(props.keyboardEventAutorepeat)),
			tostring(event:getFlags())
		),
		app:name(),
		app
	)
end
local function axFocusInfo()
	local app = hs.application.frontmostApplication()
	if not (app and browserBundles[app:bundleID()]) then
		return nil, app
	end
	local ok, element = pcall(function()
		return hs.axuielement.systemWideElement():attributeValue("AXFocusedUIElement")
	end)
	if not ok or not element then
		return "element=nil", app
	end
	local function attr(name)
		local success, value = pcall(function()
			return element:attributeValue(name)
		end)
		return success and tostring(value) or "nil"
	end
	return string.format("role=%s subrole=%s", attr("AXRole"), attr("AXSubrole")), app
end

local function pollAxFocus()
	local info, app = axFocusInfo()
	if not info then
		lastAxFocus = nil
		return
	end
	if info ~= lastAxFocus then
		lastAxFocus = info
		write("ax-focus " .. info, app:name(), app)
	end
end


function focusTrace.init()
	focusTrace.watcher = hs.application.watcher.new(function(appName, event, app)
		local eventName = eventNames[event]
		if eventName then
			write(eventName, appName, app)
		end
	end):start()
	windowFilter = hs.window.filter.new(false):setDefaultFilter({})
	windowFilter:subscribe(hs.window.filter.windowFocused, function(win)
		write("window-focused", win and win:application():name(), win and win:application())
	end)
	keyTap = hs.eventtap.new({ hs.eventtap.event.types.keyDown }, function(event)
		writeKey(event)
		return false
	end):start()
	axPollTimer = hs.timer.doEvery(0.25, pollAxFocus)
	pollAxFocus()
	local app = hs.application.frontmostApplication()
	write("started", app and app:name(), app)
end

return focusTrace

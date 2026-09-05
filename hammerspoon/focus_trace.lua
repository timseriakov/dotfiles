---@diagnostic disable: undefined-global
local focusTrace = {}

local logPath = os.getenv("HOME") .. "/Library/Logs/hammerspoon-focus.log"
local eventNames = {
	[hs.application.watcher.activated] = "activated",
	[hs.application.watcher.deactivated] = "deactivated",
}

local function write(event, appName, app)
	local file = io.open(logPath, "a")
	if not file then
		return
	end
	file:write(string.format(
		"%s %s app=%s pid=%s bundle=%s\n",
		os.date("!%Y-%m-%dT%H:%M:%SZ"),
		event,
		tostring(appName),
		tostring(app and app:pid()),
		tostring(app and app:bundleID())
	))
	file:close()
end

function focusTrace.init()
	focusTrace.watcher = hs.application.watcher.new(function(appName, event, app)
		local eventName = eventNames[event]
		if eventName then
			write(eventName, appName, app)
		end
	end):start()
	local app = hs.application.frontmostApplication()
	write("started", app and app:name(), app)
end

return focusTrace

---@diagnostic disable: undefined-global
local launcher = {}

launcher.kittyBundleId = "net.kovidgoyal.kitty"
launcher.kittyAppName = "kitty"
launcher.kittyBinary = "/Applications/kitty.app/Contents/MacOS/kitty"
launcher.launchSettleSeconds = 0.8
launcher.launchPollIntervalSeconds = 0.1
launcher.launchTimeoutSeconds = 5.0
launcher.pickerDelaySeconds = 0.15

local pendingTimer = nil
local pollTimer = nil

local function logInfo(message)
	print(string.format("[tmux-sesh-launcher] %s", message))
end

local function alertAndLog(message)
	logInfo(message)
	hs.alert.show(message)
end

local function getKittyApplication()
	local app = hs.application.get(launcher.kittyBundleId)
	if app then
		return app
	end
	return hs.appfinder.appFromName(launcher.kittyAppName)
end

local function isStandardWindow(win)
	if not win then
		return false
	end
	local ok, standard = pcall(function()
		return win:isStandard()
	end)
	return ok and standard == true
end

local function focusKitty(app)
	if not app then
		return false
	end

	local focused = false
	local windows = app:allWindows()
	for _, win in ipairs(windows) do
		if isStandardWindow(win) then
			win:focus()
			focused = true
			break
		end
	end

	app:activate(true)
	return focused or app:isFrontmost()
end

local function clearTimers()
	if pendingTimer then
		pendingTimer:stop()
		pendingTimer = nil
	end
	if pollTimer then
		pollTimer:stop()
		pollTimer = nil
	end
end

local function triggerPicker(app)
	if not app then
		alertAndLog("Kitty is not running")
		return false
	end

	local targetApp = app
	focusKitty(targetApp)
	pendingTimer = hs.timer.doAfter(launcher.pickerDelaySeconds, function()
		pendingTimer = nil
		local frontmostApp = hs.application.frontmostApplication()
		if frontmostApp and (frontmostApp:bundleID() == launcher.kittyBundleId or frontmostApp:name() == launcher.kittyAppName) then
			targetApp = frontmostApp
		end
		hs.eventtap.keyStroke({ "ctrl" }, "a", 0, targetApp)
		hs.eventtap.keyStroke({}, "s", 0, targetApp)
		logInfo("Triggered tmux session picker")
	end)
	return true
end


local function launchKittyTmux()
	if not hs.fs.attributes(launcher.kittyBinary, "mode") then
		alertAndLog("Kitty binary not found")
		return false
	end

	local fishCommand = "if command tmux has-session 2>/dev/null; exec command tmux attach; else exec command tmux; end"
	local task = hs.task.new(launcher.kittyBinary, nil, { "fish", "-i", "-C", fishCommand })
	if not task then
		alertAndLog("Failed to create Kitty launch task")
		return false
	end

	if not task:start() then
		alertAndLog("Failed to launch Kitty")
		return false
	end

	return true
end

local function waitForKittyAndTrigger(startedAt)
	local app = getKittyApplication()
	if app and focusKitty(app) then
		clearTimers()
		pendingTimer = hs.timer.doAfter(launcher.launchSettleSeconds, function()
			pendingTimer = nil
			triggerPicker(app)
		end)
		return
	end

	if hs.timer.secondsSinceEpoch() - startedAt >= launcher.launchTimeoutSeconds then
		clearTimers()
		alertAndLog("Timed out waiting for Kitty")
		return
	end
end

function launcher.launch()
	clearTimers()

	local app = getKittyApplication()
	if app then
		logInfo("Focusing existing Kitty")
		return triggerPicker(app)
	end

	logInfo("Launching Kitty tmux fallback")
	if not launchKittyTmux() then
		return false
	end

	local startedAt = hs.timer.secondsSinceEpoch()
	pollTimer = hs.timer.doEvery(launcher.launchPollIntervalSeconds, function()
		waitForKittyAndTrigger(startedAt)
	end)
	waitForKittyAndTrigger(startedAt)
	return true
end

function launcher.init()
	return launcher
end

return launcher

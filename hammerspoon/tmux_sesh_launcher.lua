---@diagnostic disable: undefined-global
local launcher = {}

launcher.kittyBundleId = "net.kovidgoyal.kitty"
launcher.kittyAppName = "kitty"
launcher.kittyBinary = "/Applications/kitty.app/Contents/MacOS/kitty"
launcher.launchSettleSeconds = 0.8
launcher.launchPollIntervalSeconds = 0.1
launcher.launchTimeoutSeconds = 5.0
launcher.pickerDelaySeconds = 0.3
launcher.focusPollIntervalSeconds = 0.05
launcher.focusStableSeconds = 0.15
launcher.focusTimeoutSeconds = 2.0
launcher.prefixDelaySeconds = 0.18
launcher.ansiKeyCodeA = 0
launcher.ansiKeyCodeS = 1

local pendingTimer = nil
local pollTimer = nil
local focusReadyAt = nil

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
	focusReadyAt = nil
end

local function isKittyFrontmost()
	local frontmostApp = hs.application.frontmostApplication()
	if not frontmostApp then
		return false
	end
	return frontmostApp:bundleID() == launcher.kittyBundleId or frontmostApp:name() == launcher.kittyAppName
end

local function hasFocusedKittyWindow(app)
	if not app then
		return false
	end

	local focusedWindow = hs.window.focusedWindow()
	if not focusedWindow or not isStandardWindow(focusedWindow) then
		return false
	end

	local windowApp = focusedWindow:application()
	if not windowApp then
		return false
	end

	return windowApp:bundleID() == launcher.kittyBundleId or windowApp:name() == launcher.kittyAppName
end

local function isKittyReady(app)
	return isKittyFrontmost() and hasFocusedKittyWindow(app)
end

local function postKeyCode(app, modifiers, keyCode)
	hs.eventtap.event.newKeyEvent(modifiers, keyCode, true):post(app)
	hs.eventtap.event.newKeyEvent(modifiers, keyCode, false):post(app)
end

local function sendPickerKeys(app)
	if app then
		app:activate(true)
	end
	logInfo("Sending tmux prefix")
	postKeyCode(app, { "ctrl" }, launcher.ansiKeyCodeA)
	pendingTimer = hs.timer.doAfter(launcher.prefixDelaySeconds, function()
		pendingTimer = nil
		if app then
			app:activate(true)
		end
		postKeyCode(app, {}, launcher.ansiKeyCodeS)
		logInfo("Triggered tmux session picker")
	end)
end

local function waitForFocusedKitty(app, startedAt)
	if isKittyReady(app) then
		local now = hs.timer.secondsSinceEpoch()
		if not focusReadyAt then
			focusReadyAt = now
			return
		end
		if now - focusReadyAt >= launcher.focusStableSeconds then
			clearTimers()
			sendPickerKeys(app)
			return
		end
	else
		focusReadyAt = nil
	end

	if hs.timer.secondsSinceEpoch() - startedAt >= launcher.focusTimeoutSeconds then
		clearTimers()
		alertAndLog("Timed out focusing Kitty")
		return
	end
end

local function triggerPicker(app)
	if not app then
		alertAndLog("Kitty is not running")
		return false
	end

	focusReadyAt = nil
	focusKitty(app)
	local startedAt = hs.timer.secondsSinceEpoch()
	pollTimer = hs.timer.doEvery(launcher.focusPollIntervalSeconds, function()
		waitForFocusedKitty(app, startedAt)
	end)
	pendingTimer = hs.timer.doAfter(launcher.pickerDelaySeconds, function()
		waitForFocusedKitty(app, startedAt)
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
